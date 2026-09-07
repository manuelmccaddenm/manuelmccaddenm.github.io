import * as T from "three";
import { kit, M, mat } from "./monuments/kit.js";
import { distance, segmentDistance } from "./navigation.js";

export function districtLandmarks(scene, lots, roads, colliders, sign) {
  const k = kit(scene, "district-infrastructure", sign);
  const reserved = [],
    towers = [],
    gardens = [];
  function findSpace(id, radius, preferred) {
    const lot = lots.get(id);
    for (let ring = 0; ring < 7; ring++)
      for (let i = 0; i < 24; i++) {
        const angle = lot.group.rotation.y + preferred + (i * Math.PI) / 12;
        const r = 19 + ring * 3;
        const p = {
          x: lot.center.x + Math.sin(angle) * r,
          z: lot.center.z + Math.cos(angle) * r,
        };
        if (
          roads.some((road) => segmentDistance(p, road.a, road.b) < radius + 6)
        )
          continue;
        if ([...lots.values()].some((l) => distance(p, l.center) < radius + 9))
          continue;
        if (reserved.some((v) => distance(p, v) < radius + v.radius + 2))
          continue;
        if (
          colliders.some(
            (b) =>
              p.x > b.minX - radius &&
              p.x < b.maxX + radius &&
              p.z > b.minZ - radius &&
              p.z < b.maxZ + radius,
          )
        )
          continue;
        reserved.push({ ...p, radius });
        return p;
      }
    throw new Error(`No clear space for ${id} district feature`);
  }
  const steel = mat("#8b9590", 0, 0.72),
    dark = mat("#37413e", 0, 0.55),
    ceramic = mat("#a8c0ad", 0, 0.3);
  // The transmission spine sits behind the energy exhibits, on concrete footings.
  for (const [index, id] of [
    "solar-pipelines",
    "batu",
    "building-monitors",
  ].entries()) {
    const pos = findSpace(id, 4.5, Math.PI),
      g = k.group(`transmission-tower-${index}`, pos.x, 0, pos.z);
    const levels = [0, 4, 8, 12, 16, 20, 24, 29];
    const width = (y) => 2.6 - y * 0.06;
    for (const x of [-1, 1])
      for (const z of [-1, 1]) {
        k.box(x * 2.6, 0.3, z * 2.6, 1.05, 0.6, 1.05, M.stone, 0, g);
        k.rod(
          [x * 2.6, 0.3, z * 2.6],
          [x * width(29), 29, z * width(29)],
          0.085,
          steel,
          g,
        );
      }
    for (let i = 0; i < levels.length - 1; i++) {
      const y = levels[i],
        next = levels[i + 1],
        w = width(y),
        nw = width(next);
      for (const side of [-1, 1]) {
        k.rod([-w, y, side * w], [nw, next, side * nw], 0.045, steel, g);
        k.rod([w, y, side * w], [-nw, next, side * nw], 0.045, steel, g);
        k.rod([side * w, y, -w], [side * nw, next, nw], 0.045, steel, g);
        k.rod([side * w, y, w], [side * nw, next, -nw], 0.045, steel, g);
        k.rod([-w, y, side * w], [w, y, side * w], 0.055, steel, g);
        k.rod([side * w, y, -w], [side * w, y, w], 0.055, steel, g);
      }
    }
    const terminals = [];
    for (const y of [19, 23, 27])
      for (const side of [-1, 1]) {
        k.rod([0, y, 0], [side * 5.4, y, 0], 0.075, steel, g);
        k.rod([0, y + 1.8, 0], [side * 5.4, y, 0], 0.05, steel, g);
        for (let j = 0; j < 7; j++)
          k.cylinder(
            side * 5.05,
            y - 0.18 - j * 0.15,
            0,
            0.18,
            0.075,
            ceramic,
            g,
          );
        terminals.push(new T.Vector3(pos.x + side * 5.05, y - 1.25, pos.z));
      }
    if (index === 1) {
      k.box(0, 0.9, 0, 2.8, 1.7, 2, M.steel, 0, g);
      for (let x = -1.25; x <= 1.25; x += 0.25)
        k.box(x, 0.9, 1.08, 0.08, 1.45, 0.24, steel, 0, g);
      for (const x of [-0.8, 0.8])
        for (let j = 0; j < 5; j++)
          k.cylinder(x, 1.9 + j * 0.12, 0, 0.15, 0.08, ceramic, g);
    }
    k.label("ENERGY GRID", pos.x, 2.2, pos.z + 2.8, 3.7, 0.45);
    colliders.push({
      minX: pos.x - 3.2,
      maxX: pos.x + 3.2,
      minZ: pos.z - 3.2,
      maxZ: pos.z + 3.2,
      height: 29,
    });
    towers.push({ id, position: pos, terminals });
  }
  const cables = [];
  for (let i = 1; i < towers.length; i++)
    for (let j = 0; j < 6; j++) {
      const start = towers[i - 1].terminals[j],
        end = towers[i].terminals[j];
      const sag = Math.min(5, start.distanceTo(end) * 0.055);
      // Parabolic approximation to a hanging conductor; fixed at the insulators.
      const points = Array.from({ length: 33 }, (_, n) => {
        const t = n / 32;
        return start
          .clone()
          .lerp(end, t)
          .add(new T.Vector3(0, -4 * sag * t * (1 - t), 0));
      });
      const cable = new T.Mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 64, 0.045, 5, false),
        dark,
      );
      cable.name = `overhead-conductor-${i}-${j}`;
      k.root.add(cable);
      cables.push({
        start: start.toArray(),
        end: end.toArray(),
        minHeight: Math.min(...points.map((p) => p.y)),
        points: points.map((p) => p.toArray()),
      });
    }
  for (const [id, type] of [
    ["autoencoder", "mobius"],
    ["probability", "gaussian"],
    ["lp-solver", "geometry"],
  ]) {
    const pos = findSpace(id, 6, Math.PI / 2),
      g = k.group(`mathematics-garden-${type}`, pos.x, 0, pos.z);
    k.box(0, 0.04, 0, 10.8, 0.08, 10.8, M.stone, 0, g);
    // Two-tone geometric paving is architectural pattern, not a claimed Penrose construction.
    for (let x = -4.5; x <= 4.5; x += 1)
      for (let z = -4.5; z <= 4.5; z += 1)
        k.box(
          x,
          0.095,
          z,
          0.67,
          0.025,
          0.67,
          Math.round(x + z) % 2 ? mat("#687c79") : M.white,
          Math.PI / 4,
          g,
        );
    if (type === "mobius") {
      const positions = [],
        indices = [],
        nu = 160,
        nv = 12;
      for (let i = 0; i <= nu; i++)
        for (let j = 0; j <= nv; j++) {
          const u = (i / nu) * Math.PI * 2,
            v = (j / nv - 0.5) * 1.8;
          positions.push(
            (3 + v * Math.cos(u / 2)) * Math.cos(u),
            3.6 + v * Math.sin(u / 2),
            (3 + v * Math.cos(u / 2)) * Math.sin(u),
          );
        }
      for (let i = 0; i < nu; i++)
        for (let j = 0; j < nv; j++) {
          const a = i * (nv + 1) + j,
            b = a + nv + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const material = new T.MeshStandardMaterial({
        color: "#a5b7b2",
        metalness: 0.82,
        roughness: 0.25,
        side: T.DoubleSide,
      });
      const band = new T.Mesh(geo, material);
      band.name = "mobius-ribbon";
      band.castShadow = true;
      g.add(band);
      for (const x of [-2.8, 2.8])
        k.rod([x, 0.1, 0], [x, 3.4, 0], 0.09, M.steel, g);
      k.label(
        "TOPOLOGY · ONE CONTINUOUS SURFACE",
        pos.x,
        1.25,
        pos.z + 4.9,
        8,
        0.42,
      );
    } else if (type === "gaussian") {
      for (let z = -3.5; z <= 3.5; z += 0.7) {
        const points = Array.from({ length: 33 }, (_, i) => {
          const x = -4 + i / 4;
          return new T.Vector3(x, 0.7 + 4.8 * Math.exp((-x * x) / 5), z);
        });
        const rib = new T.Mesh(
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points),
            40,
            0.055,
            6,
            false,
          ),
          steel,
        );
        rib.castShadow = true;
        g.add(rib);
      }
      k.box(0, 0.24, 0, 8.8, 0.4, 7.8, mat("#758a7c"), 0, g);
      k.label(
        "STATISTICS · THE SHAPE OF A DISTRIBUTION",
        pos.x,
        1.25,
        pos.z + 4.9,
        8,
        0.42,
      );
    } else {
      for (const [r, y] of [
        [3, 0.4],
        [2.4, 1.25],
        [1.8, 2.1],
        [1.2, 2.95],
        [0.6, 3.8],
      ]) {
        const points = Array.from({ length: 7 }, (_, i) => [
          Math.cos((i * Math.PI) / 3) * r,
          y,
          Math.sin((i * Math.PI) / 3) * r,
        ]);
        for (let i = 1; i < points.length; i++)
          k.rod(points[i - 1], points[i], 0.065, steel, g);
      }
      for (let i = 0; i < 6; i++)
        k.rod(
          [
            Math.cos((i * Math.PI) / 3) * 3,
            0.4,
            Math.sin((i * Math.PI) / 3) * 3,
          ],
          [0, 4.65, 0],
          0.055,
          steel,
          g,
        );
      k.label(
        "OPTIMIZATION · CONSTRAINTS SHAPE THE SOLUTION",
        pos.x,
        1.25,
        pos.z + 4.9,
        8,
        0.4,
      );
    }
    k.box(0, 1.25, 4.84, 8.3, 0.62, 0.1, M.steel, 0, g);
    for (const x of [-3.7, 3.7])
      k.box(x, 0.6, 4.84, 0.07, 1.2, 0.14, M.steel, 0, g);
    for (const x of [-4.3, 4.3]) {
      k.box(x, 0.5, 0, 0.65, 0.16, 5, M.wood, 0, g);
      for (const z of [-1.8, 1.8])
        k.box(x, 0.25, z, 0.45, 0.5, 0.13, M.steel, 0, g);
    }
    colliders.push({
      minX: pos.x - 4,
      maxX: pos.x + 4,
      minZ: pos.z - 4,
      maxZ: pos.z + 4,
      height: 5.7,
    });
    gardens.push({ id, type, position: pos });
  }
  const result = k.finish();
  result.root.userData = { towers, cables, gardens };
  return { reserved, towers, cables, gardens };
}
