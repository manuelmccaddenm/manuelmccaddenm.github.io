import * as T from "three";
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
    surface("paving", "#899084", 0.45),
    scene,
    250,
    -0.05,
    -180,
  );
  ground.rotation.x = -Math.PI / 2;
  const pavement = surface("paving", "#b8b5a6", 0.65),
    asphalt = surface("asphalt", "#454a4c", 1.5),
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

  // Every project gets a landmark with a silhouette drawn from its subject.
  function sculpture(p, parent, col) {
    const glow = material(col, 1.7),
      solid = material(col, 0.12, 0.45);
    const moving = new T.Group();
    parent.add(moving);
    const id = p.id;
    if (id === "autoencoder") {
      for (const side of [-1, 1])
        for (let i = 0; i < 5; i++) {
          const x = side * (2 + i * 1.1),
            h = 2 + i * 1.25;
          box(x, 2 + h / 2, 0, 0.22, h, 0.22, glow, 0, moving);
          ring(moving, 0.33, 0.08, solid, x, 2 + h, 0);
          if (i < 4)
            rod(
              V(x, 2 + h, 0),
              V(side * (2 + (i + 1) * 1.1), 3.25 + h, 0),
              0.055,
              glow,
              moving,
            );
        }
      ring(moving, 1.6, 0.14, glow, 0, 3.5, 0);
      moving.rotation.y = 0.3;
    } else if (id === "probability" || id === "btc-streaming") {
      const coin = mesh(
        new T.CylinderGeometry(3.5, 3.5, 0.55, 48),
        material(id === "probability" ? "#e3bc70" : "#ffa939", 0.3, 0.75),
        moving,
        0,
        5,
        0,
      );
      coin.rotation.x = Math.PI / 2;
      ring(moving, 3.15, 0.08, glow, 0, 5, 0.32);
      const symbol = sign(id === "btc-streaming" ? "₿" : "½", col, 3.8, 3.8);
      symbol.position.set(0, 5, 0.34);
      moving.add(symbol);
      animated.push((t) => {
        moving.rotation.y = t * 0.25;
      });
    } else if (id === "itam" || id === "batu" || id === "mantis") {
      const w = id === "itam" ? 13 : 10;
      const limestone = surface(
        "concrete",
        id === "itam" ? "#d8c9ab" : "#9da8a3",
        0.8,
      );
      const glazing = new T.MeshStandardMaterial({
        color: "#476878",
        roughness: 0.16,
        metalness: 0.7,
      });
      const frame = material("#343f41", 0, 0.45);
      box(0, 4, 0, w, 8, 6, limestone, 0, moving);
      box(0, 0.35, 0, w + 0.25, 0.7, 6.25, stone, 0, moving);
      box(0, 8.2, 0, w + 0.65, 0.32, 6.65, edge, 0, moving);
      box(0, 8.48, 0, w + 0.25, 0.2, 6.25, limestone, 0, moving);
      for (const side of [-1, 1]) {
        for (let x = -w / 2 + 1.25; x < w / 2 - 0.5; x += 2.1)
          for (let y = 2; y < 7.5; y += 2.5) {
            if (Math.abs(x) < 1.4 && y === 2) continue;
            box(x, y, side * 3.04, 1.45, 1.8, 0.15, edge, 0, moving);
            box(x, y, side * 3.14, 1.22, 1.56, 0.08, glazing, 0, moving);
            box(x, y, side * 3.2, 0.055, 1.6, 0.06, frame, 0, moving);
            box(x, y - 0.12, side * 3.2, 1.22, 0.055, 0.06, frame, 0, moving);
            box(x, y - 0.94, side * 3.15, 1.65, 0.12, 0.4, edge, 0, moving);
          }
        for (const y of [3.3, 5.8])
          box(0, y, side * 3.03, w + 0.12, 0.1, 0.2, edge, 0, moving);
      }
      box(0, 1.5, 3.13, 2.5, 2.8, 0.25, frame, 0, moving);
      box(0, 1.5, 3.3, 2.2, 2.6, 0.08, glazing, 0, moving);
      box(0, 1.5, 3.37, 0.07, 2.6, 0.07, brass, 0, moving);
      for (const x of [-0.16, 0.16])
        box(x, 1.3, 3.44, 0.045, 0.5, 0.06, brass, 0, moving);
      box(0, 3.3, 3.65, 3.8, 0.18, 1.6, edge, 0, moving);
      for (const x of [-1.72, 1.72])
        box(x, 1.7, 4.25, 0.13, 3.3, 0.13, brass, 0, moving);
      const title = sign(id.toUpperCase(), col, 4.6, 0.85);
      title.position.set(0, 7.95, 3.4);
      moving.add(title);
      colliders.push({
        minX: parent.position.x - w / 2,
        maxX: parent.position.x + w / 2,
        minZ: parent.position.z - 3,
        maxZ: parent.position.z + 3,
        height: 8.6,
      });
    } else if (id === "solar-pipelines") {
      for (let x = -4; x <= 4; x += 4)
        for (let z = -2; z <= 2; z += 4) {
          box(x, 1.8, z, 0.15, 3.6, 0.15, brass, 0, moving);
          const panel = box(
            x,
            3.6,
            z,
            3.5,
            0.18,
            3,
            material("#234f74", 0.3, 0.6),
            0,
            moving,
          );
          panel.rotation.x = -0.35;
          for (let k = -1; k <= 1; k++)
            box(x + k, 3.75, z, 0.035, 0.025, 2.8, glow, 0, moving);
        }
      for (let z = -5; z <= 5; z += 2)
        box(0, 0.4, z, 0.15, 0.12, 1, glow, 0, moving);
    } else if (
      id === "critical-hours" ||
      id === "building-monitors" ||
      id === "cfe-bills"
    ) {
      for (let i = 0; i < 7; i++) {
        const h =
          id === "critical-hours"
            ? i === 4
              ? 9
              : 2 + Math.sin(i) * 1.5
            : 2 + ((i * 3) % 5);
        box((i - 3) * 1.35, h / 2 + 0.5, 0, 0.85, h, 2, solid, 0, moving);
        box((i - 3) * 1.35, h + 0.55, 0, 0.95, 0.12, 2.1, glow, 0, moving);
      }
      if (id === "critical-hours") {
        const clock = ring(moving, 3, 0.12, glow, 0, 7, 1.5);
        animated.push((t) => {
          clock.rotation.z = t * 0.15;
        });
        rod(V(0, 7, 1.5), V(0, 9, 1.5), 0.08, glow, moving);
      }
    } else if (id === "inverter-anomalies" || id === "air-quality") {
      const pts = [];
      for (let i = 0; i < 64; i++) {
        const x = (i / 63 - 0.5) * 11,
          y =
            id === "inverter-anomalies"
              ? 3 + Math.sin(i * 0.32) * 1.5 + (i === 39 ? 3 : 0)
              : 2 + Math.exp(-(((i - 32) / 13) ** 2)) * 4;
        pts.push(V(x, y, 0));
      }
      mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(pts), 100, 0.12, 6, false),
        glow,
        moving,
      );
      for (let x = -5; x <= 5; x += 2)
        box(x, 1.5, -0.5, 0.04, 3, 0.04, edge, 0, moving);
    } else if (id === "thesis" || id === "model-picker" || id === "nutrition") {
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
          const h = 0.6 + random() * 5;
          box(
            (i - 1.5) * 1.7,
            1 + h / 2,
            (j - 1.5) * 1.7,
            1.1,
            h,
            1.1,
            random() > 0.5 ? solid : glow,
            0,
            moving,
          );
        }
      const hoop = ring(moving, 5, 0.09, glow, 0, 7, 0);
      hoop.rotation.x = Math.PI / 2;
      animated.push((t) => (hoop.rotation.z = t * 0.2));
    } else if (id === "markov-chains" || id === "retail" || id === "glass") {
      const pts = Array.from({ length: 6 }, (_, i) =>
        V(
          Math.cos((i * Math.PI) / 3) * 4,
          3 + Math.sin((i * Math.PI) / 3) * 2,
          Math.sin((i * Math.PI) / 3) * 3,
        ),
      );
      for (let i = 0; i < 6; i++) {
        mesh(
          new T.IcosahedronGeometry(0.65, 1),
          solid,
          moving,
          ...pts[i].toArray(),
        );
        rod(pts[i], pts[(i + 1) % 6], 0.1, glow, moving);
        if (i % 2 === 0) rod(pts[i], pts[(i + 3) % 6], 0.045, glow, moving);
      }
      animated.push((t) => (moving.rotation.y = t * 0.12));
    } else if (id === "parallel-dbscan") {
      for (let c = 0; c < 3; c++)
        for (let i = 0; i < 24; i++) {
          const a = random() * Math.PI * 2,
            r = random() * 1.8;
          mesh(
            new T.IcosahedronGeometry(0.18, 0),
            c === 0 ? glow : c === 1 ? solid : brass,
            moving,
            Math.cos(c * 2.1) * 3 + Math.cos(a) * r,
            1 + random() * 3,
            Math.sin(c * 2.1) * 3 + Math.sin(a) * r,
          );
        }
    } else if (id === "fantasy-draft" || id === "negreira") {
      box(0, 0.5, 0, 11, 0.15, 7, material("#205744"), 0, moving);
      const field = ring(moving, 1.4, 0.045, glow, 0, 0.61, 0);
      field.rotation.x = -Math.PI / 2;
      for (const x of [-5, 5]) {
        box(x, 1.5, -1.5, 0.12, 2, 0.12, glow, 0, moving);
        box(x, 1.5, 1.5, 0.12, 2, 0.12, glow, 0, moving);
        box(x, 2.5, 0, 0.12, 0.12, 3.1, glow, 0, moving);
      }
      const ball = mesh(
        new T.IcosahedronGeometry(0.8, 1),
        brass,
        moving,
        0,
        2,
        0,
      );
      animated.push((t) => {
        ball.position.y = 2 + Math.abs(Math.sin(t)) * 0.7;
        ball.rotation.y = t * 0.3;
      });
    } else if (id === "lp-solver") {
      const shape = mesh(
        new T.IcosahedronGeometry(4, 0),
        new T.MeshStandardMaterial({
          color: col,
          wireframe: true,
          emissive: col,
          emissiveIntensity: 0.8,
        }),
        moving,
        0,
        5,
        0,
      );
      animated.push((t) => (shape.rotation.y = t * 0.15));
      mesh(new T.IcosahedronGeometry(0.45, 1), glow, moving, 0, 9, 0);
    } else if (id === "cdmx-budget") {
      for (let i = 0; i < 5; i++) {
        const h = 2 + i;
        box((i - 2) * 2, h / 2 + 0.5, 0, 1.4, h, 2, solid, 0, moving);
        box((i - 2) * 2, h + 0.6, 0, 1.5, 0.12, 2.1, glow, 0, moving);
      }
    } else if (id === "spacetime-bayes") {
      for (let i = 0; i < 6; i++) {
        const r = ring(moving, 1.5 + i * 0.45, 0.075, glow, 0, 1.5 + i, 0);
        r.rotation.x = Math.PI / 2 + i * 0.17;
      }
      animated.push((t) => (moving.rotation.y = t * 0.2));
    } else if (id === "predator-prey") {
      const pts = [];
      for (let i = 0; i <= 150; i++) {
        const t = (i / 150) * Math.PI * 6;
        pts.push(V(Math.cos(t) * 3.7, 1 + (i / 150) * 7, Math.sin(t) * 3.7));
      }
      mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(pts), 150, 0.1, 6, false),
        glow,
        moving,
      );
      const dot = mesh(new T.SphereGeometry(0.4, 12, 8), brass, moving);
      animated.push((t) => {
        const a = t % (Math.PI * 6);
        dot.position.set(
          Math.cos(a) * 3.7,
          1 + (a / (Math.PI * 6)) * 7,
          Math.sin(a) * 3.7,
        );
      });
    }
  }
  function sign(text, color, w = 8, h = 1.4) {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = Math.round((2048 * h) / w);
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
    let center = preferred;
    if (!lotIsFree(center)) {
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
    const plinth = mesh(
      new T.CylinderGeometry(radius, radius + 0.3, 0.26, 48),
      stone,
      group,
      0,
      0.03,
      0,
    );
    const rim = ring(group, radius, 0.065, material(col, 0.9), 0, 0.2, 0);
    rim.rotation.x = -Math.PI / 2;
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
      material(col, 1.5),
      entry.x,
      0.2,
      entry.z,
    );
    marker.rotation.x = -Math.PI / 2;
    lots.set(id, { id, center, entry, group, color: col });
    // Solid pedestal beneath the central exhibit (player stays on level streets/plazas).
    if (!["itam", "batu", "mantis"].includes(id)) {
      const x =
        Math.abs(Math.cos(facing)) * 4.8 + Math.abs(Math.sin(facing)) * 3.6;
      const z =
        Math.abs(Math.sin(facing)) * 4.8 + Math.abs(Math.cos(facing)) * 3.6;
      colliders.push({
        minX: center.x - x,
        maxX: center.x + x,
        minZ: center.z - z,
        maxZ: center.z + z,
      });
    }
    const toward = { x: center.x - origin.x, z: center.z - origin.z };
    const len = Math.hypot(toward.x, toward.z);
    for (let t = 3; t < len - radius; t += 2)
      box(
        origin.x + (toward.x / len) * t,
        0.14,
        origin.z + (toward.z / len) * t,
        0.22,
        0.04,
        0.22,
        material(col, 1.3),
      );
  }
  // A planted, inhabited skyline. Footprints never cover a street, spawn, or exhibit.
  const buildingMats = [
    surface("brick", "#a77961", 0.55),
    surface("brick", "#bdac8e", 0.55),
    surface("concrete", "#bec2b8", 1),
    surface("concrete", "#818e94", 1),
  ];
  const glass = new T.MeshStandardMaterial({
    color: "#476574",
    roughness: 0.19,
    metalness: 0.65,
  });
  const windowMats = ["#e5b777", "#bdd4d3", "#e8d5af"].map((c) =>
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
        [...lots.values()].some((l) => distance(p, l.center) < 22)
      )
        continue;
      if (random() > 0.7) continue;
      const w = 8 + random() * 5,
        d = 8 + random() * 5;
      const floors = 3 + Math.floor(random() * 7),
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
  const trees = [];
  for (let i = 0; i < 220; i++) {
    const p = { x: random() * 500, z: -random() * 360 };
    if (
      nearRoad(p, 8) ||
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
  const treeMesh = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 2),
    material("#63794b"),
    trees.length * 7,
  );
  const dummy = new T.Object3D();
  trees.forEach(({ p, h }, i) => {
    for (let cluster = 0; cluster < 7; cluster++) {
      const angle = cluster * 2.4,
        spread = cluster === 0 ? 0 : 1.25;
      dummy.position.set(
        p.x + Math.cos(angle) * spread,
        h + (cluster === 0 ? 1.5 : 0.1 + random()),
        p.z + Math.sin(angle) * spread,
      );
      dummy.scale.set(
        1.15 + random() * 0.45,
        1.25 + random() * 0.6,
        1.1 + random() * 0.5,
      );
      dummy.rotation.set(random(), random(), random());
      dummy.updateMatrix();
      treeMesh.setMatrixAt(i * 7 + cluster, dummy.matrix);
      treeMesh.setColorAt(
        i * 7 + cluster,
        new T.Color().setHSL(
          0.2 + random() * 0.04,
          0.22 + random() * 0.15,
          0.38 + random() * 0.16,
        ),
      );
    }
  });
  dummy.rotation.set(0, 0, 0);
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
  treeMesh.castShadow = true;
  scene.add(treeMesh);
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
  const sun = new T.DirectionalLight("#ffdfb5", 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -65,
    right: 65,
    top: 65,
    bottom: -65,
    near: 1,
    far: 350,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.07;
  scene.add(sun, sun.target);
  const hemi = new T.HemisphereLight("#c0dcf0", "#777766", 1.8);
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
  scene.add(sky);
  scene.fog = new T.FogExp2("#b1bcb9", 0.0022);
  return {
    colliders,
    bounds,
    lots,
    buildingCount,
    setNight(night) {
      isNight = night;
      scene.environmentIntensity = night ? 0.08 : 0.45;
      sun.color.set(night ? "#b2c9ed" : "#ffdfb5");
      for (const mat of windowMats) mat.emissiveIntensity = night ? 1.35 : 0.03;
      sky.material.uniforms.night.value = night ? 1 : 0;
      hemi.intensity = night ? 0.55 : 1.8;
      sun.intensity = night ? 0.4 : 3.2;
      scene.fog.color.set(night ? "#152638" : "#b1bcb9");
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
      pulses.visible = !reduced;
    },
  };
}
