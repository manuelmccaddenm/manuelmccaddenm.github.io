import * as T from "three";
import { kit } from "./monuments/kit.js";
import { neighborhoodBuilding } from "./neighborhoods.js";
import { districtLandmarks } from "./district-landmarks.js";
import { createMapPoster } from "./map-poster.js";
import { URBAN_STOPS } from "./monuments/urban.js";
import { parkedCar } from "./streetscape.js";
import { leafCanopies } from "./foliage.js";
import { createMonument } from "./monuments/index.js";
import { createDraftStadium } from "./stadium.js";
import { createHopfDisplay } from "./hopf.js";
import { createPredatorPrey } from "./animals.js";
import { surface } from "./surfaces.js";
import { worldPoint, segmentDistance, distance } from "./navigation.js";

const UP = new T.Vector3(0, 1, 0);
const V = (x, y, z) => new T.Vector3(x, y, z);
const palette = {
  energy: "#ffbf57",
  stats: "#65bbff",
  ml: "#ff84af",
  math: "#60e3bd",
  dataeng: "#ff8c58",
  product: "#b0a0ff",
};
export function createWorld(scene, graph, projects, hotspots) {
  const nodes = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const colliders = [],
    animated = [],
    lots = new Map();
  const batches = new Map(),
    materials = new Map();
  let seed = 724;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const material = (color, glow = 0, metal = 0) => {
    const key = `${color}/${glow}/${metal}`;
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          roughness: metal ? 0.32 : 0.78,
          metalness: metal,
          emissive: color,
          emissiveIntensity: glow,
        }),
      );
    return materials.get(key);
  };
  const stone = surface("paving", "#8b9189", 0.55),
    edge = material("#b1b0a0"),
    dark = material("#101f2c"),
    brass = material("#c0a477", 0, 0.6);
  const boxGeo = new T.BoxGeometry(1, 1, 1);
  function box(x, y, z, w, h, d, mat, yaw = 0, parent = null) {
    if (parent) {
      const mesh = new T.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      mesh.rotation.y = yaw;
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    if (!batches.has(mat)) batches.set(mat, []);
    const transform = new T.Matrix4().compose(
      V(x, y, z),
      new T.Quaternion().setFromAxisAngle(UP, yaw),
      V(w, h, d),
    );
    batches.get(mat).push(transform);
  }
  function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const ob = new T.Mesh(geo, mat);
    ob.position.set(x, y, z);
    ob.castShadow = ob.receiveShadow = true;
    parent.add(ob);
    return ob;
  }
  function rod(a, b, radius, mat, parent) {
    const delta = b.clone().sub(a);
    const ob = mesh(
      new T.CylinderGeometry(radius, radius, delta.length(), 8),
      mat,
      parent,
    );
    ob.position.copy(a).add(b).multiplyScalar(0.5);
    ob.quaternion.setFromUnitVectors(UP, delta.normalize());
    return ob;
  }
  function ring(parent, radius, tube, mat, x = 0, y = 0, z = 0) {
    return mesh(new T.TorusGeometry(radius, tube, 8, 48), mat, parent, x, y, z);
  }
  const bounds = {
    minX: -35,
    maxX: graph.bounds.w + 35,
    minZ: -graph.bounds.h - 35,
    maxZ: 35,
  };
  const roads = graph.roads.map((r) => ({
    a: worldPoint(nodes[r.from]),
    b: worldPoint(nodes[r.to]),
  }));
  const nearRoad = (p, radius) =>
    roads.some((r) => segmentDistance(p, r.a, r.b) < radius);

  const ground = mesh(
    new T.PlaneGeometry(1600, 1600),
    surface("plaster", "#b5b1a2", 0.7, 0.08, true),
    scene,
    250,
    -0.05,
    -180,
  );
  ground.rotation.x = -Math.PI / 2;
  const pavement = surface("paving", "#b8b5a6", 0.35),
    asphalt = surface("asphalt", "#454a4c", 0.18),
    line = material("#d8cbb0");
  const lampPositions = [];
  for (const { a, b } of roads) {
    const length = distance(a, b),
      yaw = Math.atan2(b.x - a.x, b.z - a.z),
      x = (a.x + b.x) / 2,
      z = (a.z + b.z) / 2;
    box(x, 0.025, z, 13, 0.08, length + 3, pavement, yaw);
    box(x, 0.08, z, 8.5, 0.06, length + 3, asphalt, yaw);
    for (let t = 3; t < length - 2; t += 7) {
      const k = t / length;
      box(
        a.x + (b.x - a.x) * k,
        0.12,
        a.z + (b.z - a.z) * k,
        0.13,
        0.02,
        2.4,
        line,
        yaw,
      );
    }
    // Curbs stop at junctions rather than crossing the driving/walking surface.
    for (const side of [-1, 1])
      for (let t = 2; t < length - 2; t += 2) {
        const k = t / length,
          offset = 4.55 * side;
        const curb = {
          x: a.x + (b.x - a.x) * k + Math.cos(yaw) * offset,
          z: a.z + (b.z - a.z) * k - Math.sin(yaw) * offset,
        };
        if (
          roads.some((r) => r.a !== a && segmentDistance(curb, r.a, r.b) < 6.2)
        )
          continue;
        if (
          graph.nodes.some(
            (n) =>
              distance(curb, worldPoint(n)) < (n.type === "road" ? 6.8 : 8.8),
          )
        )
          continue;
        box(curb.x, 0.15, curb.z, 0.22, 0.2, 1.98, edge, yaw);
      }
    // Warm streetlamps and inset edge lights, no per-lamp shadow maps.
    const ux = (b.x - a.x) / length,
      uz = (b.z - a.z) / length;
    for (let t = 10; t < length - 4; t += 23) {
      const side = Math.floor(t / 23) % 2 ? 1 : -1,
        x = a.x + ux * t - uz * 6 * side,
        z = a.z + uz * t + ux * 6 * side;
      box(x, 3.5, z, 0.14, 7, 0.14, dark);
      box(x, 7, z, 1.6, 0.13, 1.6, stone);
      box(x, 6.9, z, 1.35, 0.05, 1.35, material("#ffd4a1", 2.8));
      lampPositions.push(V(x, 6.6, z));
      box(x, 0.23, z, 0.48, 0.4, 0.48, stone);
      // Benches on the outer sidewalk, clear of the walkable road.
      if (Math.floor(t / 23) % 3 === 0) {
        const bx = x - uz * 1.1 * side,
          bz = z + ux * 1.1 * side;
        const wood = material("#896649");
        box(bx, 0.65, bz, 2.3, 0.15, 0.65, wood, yaw);
        box(bx + uz * 0.3, 1.03, bz - ux * 0.3, 2.3, 0.62, 0.09, wood, yaw);
        for (const leg of [-0.85, 0.85])
          box(
            bx + Math.cos(yaw) * leg,
            0.31,
            bz - Math.sin(yaw) * leg,
            0.09,
            0.6,
            0.5,
            dark,
            yaw,
          );
      }
    }
  }
  // Parked street-scale objects anchor proportions; intersections stay clear.
  let parked = 0;
  const walkSegments = graph.roads.flatMap((r) =>
    r.nodes
      .slice(1)
      .map((id, i) => [worldPoint(nodes[r.nodes[i]]), worldPoint(nodes[id])]),
  );
  for (const road of roads) {
    if (parked >= 18) break;
    const { a, b } = road,
      length = distance(a, b);
    if (length < 36) continue;
    const ux = (b.x - a.x) / length,
      uz = (b.z - a.z) / length;
    const x = a.x + ux * 19 - uz * 3.7,
      z = a.z + uz * 19 + ux * 3.7;
    if (
      roads.some((r) => r !== road && segmentDistance({ x, z }, r.a, r.b) < 9)
    )
      continue;
    const yaw = Math.atan2(ux, uz);
    const hw = Math.abs(Math.cos(yaw)) * 0.95 + Math.abs(Math.sin(yaw)) * 2.2;
    const hd = Math.abs(Math.sin(yaw)) * 0.95 + Math.abs(Math.cos(yaw)) * 2.2;
    const footprint = {
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
      height: 1.7,
    };
    const blocksWalk = walkSegments.some(([start, end]) => {
      const steps = Math.max(1, Math.ceil(distance(start, end) / 0.3));
      for (let i = 0; i <= steps; i++) {
        const px = start.x + ((end.x - start.x) * i) / steps,
          pz = start.z + ((end.z - start.z) * i) / steps;
        if (
          px > footprint.minX - 0.65 &&
          px < footprint.maxX + 0.65 &&
          pz > footprint.minZ - 0.65 &&
          pz < footprint.maxZ + 0.65
        )
          return true;
      }
      return false;
    });
    if (blocksWalk) continue;
    parkedCar(
      scene,
      x,
      z,
      yaw,
      ["#64736e", "#b9b8ad", "#383f46", "#795e4e"][parked++ % 4],
    );
    colliders.push(footprint);
  }
  for (const n of graph.nodes) {
    const p = worldPoint(n);
    const disc = mesh(
      new T.CircleGeometry(n.type === "road" ? 6 : 8, 24),
      asphalt,
      scene,
      p.x,
      0.11,
      p.z,
    );
    disc.rotation.x = -Math.PI / 2;
  }

  // Every stop has a subject-specific model tied to the original public project description.
  function sculpture(p, parent, col) {
    if (p.id === "fantasy-draft") {
      const draft = createDraftStadium(parent, sign);
      animated.push(draft.update);
    } else if (p.id === "predator-prey") {
      const wildlife = createPredatorPrey(parent);
      const phasePortraits = createHopfDisplay(parent, sign);
      animated.push(wildlife.update, phasePortraits.update);
    } else {
      const monument = createMonument(p.id, parent, sign, col);
      animated.push(monument.update);
    }
  }
  function sign(text, color, w = 8, h = 1.4) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(
      2048,
      Math.max(512, Math.ceil((w * 180) / 256) * 256),
    );
    canvas.height = Math.round((canvas.width * h) / w);
    const c = canvas.getContext("2d");
    if (w !== h) {
      c.fillStyle = "#10202b";
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = color;
      c.fillRect(0, canvas.height - 8, canvas.width, 8);
    }
    const preferredSize = canvas.height * 0.57;
    c.font = `600 ${preferredSize}px system-ui`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const size = Math.min(
      preferredSize,
      ((canvas.width * 0.9) / c.measureText(text).width) * preferredSize,
    );
    c.font = `600 ${size}px system-ui`;
    c.fillStyle = "#f8f6ee";
    c.fillText(text, canvas.width / 2, canvas.height * 0.49);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    return new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({
        map: tex,
        toneMapped: false,
        side: T.DoubleSide,
        transparent: true,
      }),
    );
  }
  for (const id of graph.stops) {
    const n = nodes[id],
      p = projects[id],
      h = hotspots[id],
      col = palette[p.cluster] || "#ded9cf";
    const origin = worldPoint(n),
      preferred = h
        ? { x: h.x, z: -h.y }
        : { x: origin.x + 15, z: origin.z + 15 };
    // Panorama-era lots could overlap another road. Relocate only the exhibit,
    // keeping every embedding stop/road fixed and the entire street walkable.
    const lotIsFree = (p) =>
      !nearRoad(p, 15) &&
      [...lots.values()].every((l) => distance(p, l.center) > 20);
    const isBridge = id === "autoencoder";
    const isUrban = URBAN_STOPS.has(id);
    const bridgeRoad =
      nodes[n.neighbors.find((key) => key.includes("negreira"))];
    const bridgeDirection = isBridge
      ? { x: bridgeRoad.x - n.x, z: n.y - bridgeRoad.y }
      : null;
    if (bridgeDirection) {
      const length = Math.hypot(bridgeDirection.x, bridgeDirection.z);
      bridgeDirection.x /= length;
      bridgeDirection.z /= length;
    }
    let center = isBridge
      ? {
          x: origin.x + bridgeDirection.x * 14,
          z: origin.z + bridgeDirection.z * 14,
        }
      : preferred;
    if (!isBridge && !lotIsFree(center)) {
      search: for (let radius = 2; radius < 90; radius += 2)
        for (let i = 0; i < 48; i++) {
          const angle = (i / 48) * Math.PI * 2,
            candidate = {
              x: preferred.x + Math.cos(angle) * radius,
              z: preferred.z + Math.sin(angle) * radius,
            };
          if (lotIsFree(candidate)) {
            center = candidate;
            break search;
          }
        }
    }
    // The original center is preferred; adjust only when it obstructs a street.
    const group = new T.Group();
    group.position.set(center.x, 0.2, center.z);
    scene.add(group);
    const radius = 8.5;
    if (!isBridge && !isUrban) {
      const plinth = mesh(
        new T.CylinderGeometry(radius, radius + 0.3, 0.26, 48),
        stone,
        group,
        0,
        0.03,
        0,
      );
      const rim = ring(
        group,
        radius,
        0.065,
        material("#a8a498", 0, 0.4),
        0,
        0.2,
        0,
      );
      rim.rotation.x = -Math.PI / 2;
    }
    const facing = Math.atan2(origin.x - center.x, origin.z - center.z);
    const colliderStart = colliders.length;
    sculpture(p, group, col);
    group.rotation.y = facing;
    for (const solid of colliders.slice(colliderStart)) {
      const hw = (solid.maxX - solid.minX) / 2,
        hd = (solid.maxZ - solid.minZ) / 2;
      const x =
        Math.abs(Math.cos(facing)) * hw + Math.abs(Math.sin(facing)) * hd;
      const z =
        Math.abs(Math.sin(facing)) * hw + Math.abs(Math.cos(facing)) * hd;
      Object.assign(solid, {
        minX: center.x - x,
        maxX: center.x + x,
        minZ: center.z - z,
        maxZ: center.z + z,
      });
    }
    const entry = { x: origin.x, z: origin.z };
    const marker = ring(
      scene,
      1.4,
      0.08,
      material(col, 0.18),
      entry.x,
      0.2,
      entry.z,
    );
    marker.rotation.x = -Math.PI / 2;
    lots.set(id, { id, center, entry, group, color: col });
    // Solid pedestal beneath the central exhibit (player stays on level streets/plazas).
    if (isBridge || isUrban) {
      const model = group.getObjectByName(`monument-${id}`);
      for (const footprint of model.userData.solidFootprints) {
        const c = Math.cos(facing),
          s = Math.sin(facing);
        const x = center.x + c * footprint.x + s * footprint.z;
        const z = center.z - s * footprint.x + c * footprint.z;
        const hw = (Math.abs(c) * footprint.w + Math.abs(s) * footprint.d) / 2;
        const hd = (Math.abs(s) * footprint.w + Math.abs(c) * footprint.d) / 2;
        colliders.push({
          minX: x - hw,
          maxX: x + hw,
          minZ: z - hd,
          maxZ: z + hd,
          height: footprint.height,
          ...(isUrban
            ? {
                oriented: {
                  x,
                  z,
                  angle: facing,
                  hw: footprint.w / 2,
                  hd: footprint.d / 2,
                },
              }
            : {}),
        });
      }
    } else {
      const halfWidth =
        id === "fantasy-draft" ? 7.7 : id === "predator-prey" ? 4.8 : 6.6;
      const halfDepth =
        id === "fantasy-draft" ? 5.2 : id === "predator-prey" ? 3.6 : 5.4;
      const x =
        Math.abs(Math.cos(facing)) * halfWidth +
        Math.abs(Math.sin(facing)) * halfDepth;
      const z =
        Math.abs(Math.sin(facing)) * halfWidth +
        Math.abs(Math.cos(facing)) * halfDepth;
      colliders.push({
        minX: center.x - x,
        maxX: center.x + x,
        minZ: center.z - z,
        maxZ: center.z + z,
      });
    }
    const toward = { x: center.x - origin.x, z: center.z - origin.z };
    const len = Math.hypot(toward.x, toward.z);
    if (isUrban) {
      // A continuous pedestrian approach meets the actual street and the entrance apron.
      const start = 3.5,
        end = len - 6.8,
        length = end - start;
      if (length > 0) {
        const mid = (start + end) / 2;
        box(
          origin.x + (toward.x / len) * mid,
          0.105,
          origin.z + (toward.z / len) * mid,
          3.2,
          0.09,
          length,
          stone,
          facing,
        );
      }
    } else {
      for (let t = 3; t < len - radius; t += 2)
        box(
          origin.x + (toward.x / len) * t,
          0.14,
          origin.z + (toward.z / len) * t,
          0.22,
          0.04,
          0.22,
          material(col, 0.12),
        );
    }
  }
  const districts = districtLandmarks(scene, lots, roads, colliders, sign);
  const mapPoster = createMapPoster(
    scene,
    graph,
    projects,
    lots.get("mantis"),
    colliders,
    sign,
  );
  const neighborhood = kit(scene, "neighborhood-buildings", sign);
  const neighborhoodBuildings = [];
  const reserved = (p, radius) =>
    districts.reserved.some((r) => distance(p, r) < r.radius + radius) ||
    districts.cables.some(
      (cable) =>
        segmentDistance(
          p,
          { x: cable.start[0], z: cable.start[2] },
          { x: cable.end[0], z: cable.end[2] },
        ) <
        radius + 4,
    ) ||
    distance(p, mapPoster.userData.position) < radius + 5;
  // A planted, inhabited skyline. Footprints never cover a street, spawn, or exhibit.
  const buildingMats = [
    surface("brick", "#a77961", 0.55),
    surface("brick", "#bdac8e", 0.55),
    surface("concrete", "#bec2b8", 1),
    surface("concrete", "#818e94", 1),
  ];
  const glass = new T.MeshStandardMaterial({
    color: "#75817e",
    roughness: 0.1,
    metalness: 0.92,
  });
  const windowMats = ["#7b7565", "#7a807b", "#8a8372"].map((c) =>
    material(c, 0.03, 0.2),
  );
  const frames = material("#3b4545", 0, 0.45),
    trim = material("#d0c8b8");
  const roof = surface("asphalt", "#5c6260", 1);
  let buildingCount = 0;
  for (let x = 0; x <= 500; x += 22)
    for (let z = -360; z <= 0; z += 22) {
      const p = { x: x + (random() - 0.5) * 8, z: z + (random() - 0.5) * 8 };
      if (
        nearRoad(p, 17) ||
        reserved(p, 10) ||
        [...lots.values()].some((l) => distance(p, l.center) < 22)
      )
        continue;
      if (random() > 0.7) continue;
      const w = 8 + random() * 5,
        d = 8 + random() * 5;
      const closest = [...lots.values()].sort(
        (a, b) => distance(p, a.center) - distance(p, b.center),
      )[0];
      const cluster = projects[closest.id].cluster;
      const kind = ["ml", "dataeng"].includes(cluster) ? "technology" : "house";
      const nearFeature = distance(p, closest.center) < 70;
      if (kind === "technology" || buildingCount % 4 !== 0 || nearFeature) {
        const angle = Math.atan2(closest.entry.x - p.x, closest.entry.z - p.z);
        const building = neighborhoodBuilding(
          neighborhood,
          p,
          angle,
          kind,
          buildingCount,
        );
        colliders.push(building.footprint);
        neighborhoodBuildings.push({
          position: p,
          kind: building.kind,
          style: building.style,
          cluster,
        });
        buildingCount++;
        continue;
      }
      const floors = 3 + Math.floor(random() * 4),
        h = floors * 3.2 + 0.6;
      box(p.x, h / 2, p.z, w, h, d, buildingMats[Math.floor(random() * 4)]);
      box(p.x, 0.5, p.z, w + 0.15, 1, d + 0.15, stone);
      box(p.x, h + 0.07, p.z, w, 0.14, d, roof);
      // Cornices, floor bands, roof parapets and mechanical enclosures.
      for (const y of [3.1, h - 0.35])
        box(p.x, y, p.z, w + 0.24, 0.22, d + 0.24, trim);
      for (const side of [-1, 1]) {
        box(p.x, h + 0.38, p.z + side * (d / 2 - 0.1), w, 0.6, 0.2, trim);
        box(p.x + side * (w / 2 - 0.1), h + 0.38, p.z, 0.2, 0.6, d, trim);
      }
      box(p.x + w * 0.15, h + 0.6, p.z, 2.3, 1.2, 2.6, edge);
      box(p.x - w * 0.2, h + 0.28, p.z + d * 0.2, 1.6, 0.56, 1.8, frames);
      colliders.push({
        minX: p.x - w / 2,
        maxX: p.x + w / 2,
        minZ: p.z - d / 2,
        maxZ: p.z + d / 2,
        height: h + 0.7,
      });
      buildingCount++;
      for (let face = 0; face < 4; face++) {
        const side = face % 2 ? -1 : 1,
          turn = face >= 2;
        const width = turn ? d : w;
        const pane = (u, y, outward, pw, ph, pd, mat) =>
          box(
            p.x + (turn ? side * (w / 2 + outward) : u),
            y,
            p.z + (turn ? u : side * (d / 2 + outward)),
            turn ? pd : pw,
            ph,
            turn ? pw : pd,
            mat,
          );
        // Shopfront glazing, recessed door, canopy, and transoms at pedestrian height.
        for (let u = -width / 2 + 1.6; u < width / 2 - 1; u += 2.4) {
          pane(u, 1.6, 0.08, 2.15, 2.25, 0.12, frames);
          pane(u, 1.6, 0.16, 1.94, 2.02, 0.06, glass);
          pane(u, 2.95, 0.35, 2.25, 0.13, 0.75, trim);
          pane(u, 1.6, 0.2, 0.06, 2.04, 0.05, frames);
        }
        for (let floor = 1; floor < floors; floor++)
          for (let u = -width / 2 + 1.6; u < width / 2 - 1; u += 2.55) {
            const y = floor * 3.2 + 1.6;
            const mat =
              random() < 0.28 ? windowMats[Math.floor(random() * 3)] : glass;
            pane(u, y, 0.06, 1.66, 2.04, 0.15, trim);
            pane(u, y, 0.15, 1.44, 1.82, 0.08, frames);
            pane(u, y, 0.2, 1.29, 1.67, 0.04, mat);
            pane(u, y, 0.24, 0.045, 1.7, 0.04, frames);
            pane(u, y - 0.2, 0.24, 1.3, 0.045, 0.04, frames);
            pane(u, y - 1.05, 0.22, 1.84, 0.13, 0.48, trim);
          }
      }
    }
  neighborhood.finish();
  const trees = [];
  for (let i = 0; i < 220; i++) {
    const p = { x: random() * 500, z: -random() * 360 };
    if (
      nearRoad(p, 8) ||
      reserved(p, 4) ||
      [...lots.values()].some((l) => distance(p, l.center) < 12) ||
      colliders.some(
        (b) =>
          p.x > b.minX - 3 &&
          p.x < b.maxX + 3 &&
          p.z > b.minZ - 3 &&
          p.z < b.maxZ + 3,
      )
    )
      continue;
    const h = 3 + random() * 2;
    box(p.x, h / 2, p.z, 0.32, h, 0.32, material("#66513d"));
    for (let branch = 0; branch < 3; branch++) {
      const a = (branch * Math.PI * 2) / 3;
      rod(
        V(p.x, h * 0.55, p.z),
        V(p.x + Math.cos(a) * 1.25, h + 0.3, p.z + Math.sin(a) * 1.25),
        0.1,
        material("#66513d"),
        scene,
      );
    }
    trees.push({ p, h });
    colliders.push({
      minX: p.x - 0.2,
      maxX: p.x + 0.2,
      minZ: p.z - 0.2,
      maxZ: p.z + 0.2,
    });
  }
  leafCanopies(
    scene,
    trees.map(({ p, h }) => ({ x: p.x, y: h + 0.8, z: p.z, radius: 2.5 })),
    240,
  );
  // Layered planting beds soften the spaces between buildings without blocking routes.
  leafCanopies(
    scene,
    trees.flatMap(({ p }) =>
      [0, 1, 2].map((i) => ({
        x: p.x + Math.cos((i * Math.PI * 2) / 3) * 1.8,
        y: 0.65,
        z: p.z + Math.sin((i * Math.PI * 2) / 3) * 1.8,
        radius: 0.8,
      })),
    ),
    65,
  );
  const plantedSoil = surface("soil", "#837763", 0.3);
  for (const { p } of trees) {
    const bed = mesh(
      new T.CircleGeometry(3.1, 24),
      plantedSoil,
      scene,
      p.x,
      -0.035,
      p.z,
    );
    bed.rotation.x = -Math.PI / 2;
  }
  const dummy = new T.Object3D();
  const shadePixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
      shadePixels[(y * 64 + x) * 4 + 3] = Math.max(0, 1 - radius) ** 1.6 * 135;
    }
  const shadeMap = new T.DataTexture(shadePixels, 64, 64);
  shadeMap.magFilter = shadeMap.minFilter = T.LinearFilter;
  shadeMap.needsUpdate = true;
  const contact = new T.InstancedMesh(
    new T.PlaneGeometry(1, 1),
    new T.MeshBasicMaterial({
      map: shadeMap,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    trees.length,
  );
  trees.forEach(({ p }, i) => {
    dummy.position.set(p.x, -0.025, p.z);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.set(8, 8, 1);
    dummy.updateMatrix();
    contact.setMatrixAt(i, dummy.matrix);
  });
  scene.add(contact);
  dummy.rotation.set(0, 0, 0);

  for (const [mat, matrices] of batches) {
    const instanced = new T.InstancedMesh(boxGeo, mat, matrices.length);
    matrices.forEach((matrix, i) => instanced.setMatrixAt(i, matrix));
    instanced.castShadow = instanced.receiveShadow = true;
    instanced.computeBoundingSphere();
    scene.add(instanced);
  }
  // Slow data pulses follow the original roads rather than an invented road network.
  const pulses = new T.InstancedMesh(
    new T.SphereGeometry(0.18, 6, 4),
    material("#b2e7e3", 2),
    roads.length,
  );
  scene.add(pulses);
  // Only six nearby lamps get real lighting; the complete city never needs hundreds of lights.
  let isNight = false;
  const localLights = Array.from({ length: 6 }, () => {
    const light = new T.PointLight("#ffd5a0", 0, 18, 2);
    scene.add(light);
    return light;
  });
  const sun = new T.DirectionalLight("#fff0dd", 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -48,
    right: 48,
    top: 48,
    bottom: -48,
    near: 1,
    far: 350,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const hemi = new T.HemisphereLight("#d3e3f0", "#6e6b58", 0.4);
  scene.add(hemi);
  const sky = new T.Mesh(
    new T.SphereGeometry(1400, 32, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { night: { value: 0 } },
      vertexShader:
        "varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec3 vPos; uniform float night; void main(){float h=normalize(vPos).y;vec3 top=mix(vec3(.25,.46,.68),vec3(.014,.028,.07),night);vec3 bottom=mix(vec3(.85,.79,.68),vec3(.03,.05,.08),night);vec3 c=mix(bottom,top,smoothstep(-.06,.6,h));float star=step(.9988,fract(sin(dot(floor(normalize(vPos).xz*950.),vec2(12.9898,78.233)))*43758.5453))*step(.16,h);gl_FragColor=vec4(c+star*night*.5,1.0);}",
    }),
  );
  sky.visible = !scene.userData.photographicSky;
  scene.add(sky);
  scene.fog = new T.FogExp2("#c4ced0", 0.0018);
  return {
    colliders,
    bounds,
    lots,
    buildingCount,
    neighborhoodBuildings,
    districts,
    mapPoster,
    setNight(night) {
      isNight = night;
      sky.visible = night || !scene.userData.photographicSky;
      scene.background = night ? null : scene.userData.photographicSky || null;
      scene.environmentIntensity = night ? 0.12 : 0.85;
      sun.color.set(night ? "#b2c9ed" : "#fff0dd");
      for (const mat of windowMats) mat.emissiveIntensity = night ? 1.35 : 0.03;
      sky.material.uniforms.night.value = night ? 1 : 0;
      hemi.intensity = night ? 0.22 : 0.4;
      sun.intensity = night ? 0.28 : 2.4;
      scene.fog.color.set(night ? "#152638" : "#c4ced0");
    },
    update(t, camera, reduced) {
      sun.position.set(camera.position.x + 70, 140, camera.position.z + 60);
      sun.target.position.set(camera.position.x, 0, camera.position.z);
      if (!reduced) for (const fn of animated) fn(t);
      if (isNight) {
        const nearest = [...lampPositions].sort(
          (a, b) =>
            a.distanceToSquared(camera.position) -
            b.distanceToSquared(camera.position),
        );
        localLights.forEach((light, i) => {
          light.position.copy(nearest[i]);
          light.intensity = 105;
        });
      } else for (const light of localLights) light.intensity = 0;
      roads.forEach(({ a, b }, i) => {
        const k = (t * 0.025 + i * 0.17) % 1;
        dummy.position.set(a.x + (b.x - a.x) * k, 0.35, a.z + (b.z - a.z) * k);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        pulses.setMatrixAt(i, dummy.matrix);
      });
      pulses.instanceMatrix.needsUpdate = true;
      pulses.visible = isNight && !reduced;
    },
  };
}
