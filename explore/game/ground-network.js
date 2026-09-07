import * as T from "three";
import polygonClipping from "polygon-clipping";
import { surface } from "./surfaces.js";
import { URBAN_STOPS } from "./monuments/urban.js";

const { union, difference } = polygonClipping;
export const GROUND_LEVELS = { terrain: 0.01, road: 0.04, paving: 0.06 };
function circle(p, r, n = 24) {
  return [
    Array.from({ length: n }, (_, i) => [
      p.x + Math.cos((i / n) * Math.PI * 2) * r,
      p.z + Math.sin((i / n) * Math.PI * 2) * r,
    ]),
  ];
}
function rectangle(a, b, width) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  if (length < 0.0001) return circle(a, width / 2);
  const x = ((-(b.z - a.z) / length) * width) / 2,
    z = (((b.x - a.x) / length) * width) / 2;
  return [
    [
      [a.x + x, a.z + z],
      [b.x + x, b.z + z],
      [b.x - x, b.z - z],
      [a.x - x, a.z - z],
    ],
  ];
}
function roundedPlaza(lot) {
  const points = [];
  for (const [x, z, angle] of [
    [6.5, 6, 0],
    [-6.5, 6, Math.PI / 2],
    [-6.5, -6, Math.PI],
    [6.5, -6, Math.PI * 1.5],
  ]) {
    for (let i = 0; i <= 8; i++) {
      const a = angle + ((i / 8) * Math.PI) / 2;
      const px = x + Math.cos(a) * 2.5,
        pz = z + Math.sin(a) * 2.5;
      const c = Math.cos(lot.group.rotation.y),
        s = Math.sin(lot.group.rotation.y);
      points.push([
        lot.center.x + c * px + s * pz,
        lot.center.z - s * px + c * pz,
      ]);
    }
  }
  return [points];
}
export function groundLayout(mainRoads, localRoads, lots) {
  const roadParts = [],
    walkParts = [];
  for (const [roads, roadWidth, walkWidth] of [
    [mainRoads, 8.5, 13],
    [localRoads, 6.1, 10],
  ]) {
    for (const { a, b } of roads) {
      roadParts.push(
        rectangle(a, b, roadWidth),
        circle(a, roadWidth / 2),
        circle(b, roadWidth / 2),
      );
      walkParts.push(
        rectangle(a, b, walkWidth),
        circle(a, walkWidth / 2),
        circle(b, walkWidth / 2),
      );
    }
  }
  const plazas = [];
  for (const lot of lots.values()) {
    if (lot.id === "autoencoder") continue;
    walkParts.push(rectangle(lot.entry, lot.center, 3.2));
    if (!URBAN_STOPS.has(lot.id)) {
      const footprint = roundedPlaza(lot);
      walkParts.push(footprint);
      plazas.push({ id: lot.id, footprint });
    }
  }
  const asphalt = union(...roadParts);
  // One union joins sidewalk, path and plaza. Removing road space creates exact
  // boundaries at angled junctions; nothing is stacked across the carriageway.
  const pedestrian = difference(union(...walkParts), asphalt);
  return { asphalt, pedestrian, plazas };
}
function geometry(polygons) {
  const shapes = polygons.map(([outer, ...holes]) => {
    const shape = new T.Shape(outer.map(([x, z]) => new T.Vector2(x, -z)));
    shape.holes = holes.map(
      (ring) => new T.Path(ring.map(([x, z]) => new T.Vector2(x, -z))),
    );
    return shape;
  });
  const g = new T.ShapeGeometry(shapes);
  g.rotateX(-Math.PI / 2);
  return g;
}
export function createGroundNetwork(scene, mainRoads, localRoads, lots) {
  const layout = groundLayout(mainRoads, localRoads, lots);
  const road = new T.Mesh(
    geometry(layout.asphalt),
    surface("asphalt", "#747873", 0.65, 0.15),
  );
  road.name = "continuous-road-surface";
  road.position.y = GROUND_LEVELS.road;
  const paving = new T.Mesh(
    geometry(layout.pedestrian),
    surface("plaster", "#b9b6aa", 0.7, 0.1, true),
  );
  // Thin expansion joints are drawn in the continuous surface, not raised slabs.
  const compile = paving.material.onBeforeCompile;
  paving.material.onBeforeCompile = (shader) => {
    compile(shader);
    shader.fragmentShader = shader.fragmentShader.replace(
      "diffuseColor *= texel;",
      `
      vec2 jointGrid = abs(fract(vSurfacePosition.xz / 2.4 + .5) - .5);
      float jointDistance = min(jointGrid.x, jointGrid.y);
      float jointAA = max(fwidth(jointDistance), .0008);
      texel.rgb *= mix(.76, 1., smoothstep(.002 - jointAA, .002 + jointAA, jointDistance));
      diffuseColor *= texel;
    `,
    );
  };
  paving.material.customProgramCacheKey = () => "continuous-paving-joints-v1";
  paving.name = "continuous-pedestrian-surface";
  paving.position.y = GROUND_LEVELS.paving;
  road.receiveShadow = paving.receiveShadow = true;
  scene.add(road, paving);
  return { ...layout, road, paving };
}
