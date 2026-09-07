import * as T from "three";
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
    labels = [],
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
  const stone = material("#425b6b"),
    edge = material("#53707a"),
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

  // A single textured ground and batched street geometry keep the district inexpensive.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#24323c";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 5000; i++) {
    const c = 40 + random() * 32;
    ctx.fillStyle = `rgb(${c},${c + 8},${c + 12})`;
    ctx.fillRect(random() * 128, random() * 128, 1, 1);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(90, 90);
  texture.colorSpace = T.SRGBColorSpace;
  const ground = mesh(
    new T.PlaneGeometry(1600, 1600),
    new T.MeshStandardMaterial({ map: texture, roughness: 0.95 }),
    scene,
    250,
    -0.05,
    -180,
  );
  ground.rotation.x = -Math.PI / 2;
  const pavement = material("#3b4c55"),
    asphalt = material("#192b37"),
    line = material("#9c9a7c", 0.1);
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
      box(x, 0.14, z, 2.5, 0.02, 2.5, material("#aa875b", 0.1));
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
      box(0, 4, 0, w, 8, 6, stone, 0, moving);
      box(0, 8.3, 0, w + 1, 0.4, 7, edge, 0, moving);
      for (let x = -w / 2 + 1; x < w / 2; x += 1.6)
        for (let y = 2; y < 7; y += 2)
          box(x, y, 3.04, 0.8, 1.1, 0.08, glow, 0, moving);
      box(0, 1.6, 3.2, 2, 3.2, 0.3, dark, 0, moving);
      const title = sign(id.toUpperCase(), col, 7, 1.5);
      title.position.set(0, 9.7, 0);
      moving.add(title);
      colliders.push({
        minX: parent.position.x - w / 2,
        maxX: parent.position.x + w / 2,
        minZ: parent.position.z - 3,
        maxZ: parent.position.z + 3,
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
    canvas.width = 1024;
    canvas.height = 256;
    const c = canvas.getContext("2d");
    c.fillStyle = "#0d202cef";
    c.fillRect(0, 0, 1024, 256);
    c.fillStyle = color;
    c.fillRect(0, 248, 1024, 8);
    c.font = "600 68px system-ui";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const size = Math.min(68, (900 / c.measureText(text).width) * 68);
    c.font = `600 ${size}px system-ui`;
    c.fillStyle = "#f2eee3";
    c.fillText(text, 512, 125);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    return new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({
        map: tex,
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
    const label = sign(p.label.toUpperCase(), col, 10, 1.5);
    label.position.set(center.x, 11.5, center.z);
    label.rotation.y = facing;
    scene.add(label);
    labels.push(label);
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
  const buildingMats = ["#293e4d", "#354551", "#263947", "#394854"].map((c) =>
    material(c),
  );
  const windowMats = ["#ffcf93", "#73bfd0", "#b2cad1"].map((c) =>
    material(c, 1.4),
  );
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
        d = 8 + random() * 5,
        h = 8 + random() * 26;
      box(p.x, h / 2, p.z, w, h, d, buildingMats[Math.floor(random() * 4)]);
      box(p.x, h + 0.15, p.z, w + 0.35, 0.3, d + 0.35, edge);
      colliders.push({
        minX: p.x - w / 2,
        maxX: p.x + w / 2,
        minZ: p.z - d / 2,
        maxZ: p.z + d / 2,
      });
      buildingCount++;
      for (let y = 2; y < h - 1; y += 3)
        for (let u = -w / 2 + 1.5; u < w / 2 - 1; u += 2.5) {
          if (random() < 0.3) continue;
          const mat = windowMats[Math.floor(random() * 3)];
          box(p.x + u, y, p.z + d / 2 + 0.02, 1, 1.3, 0.04, mat);
          box(p.x + u, y, p.z - d / 2 - 0.02, 1, 1.3, 0.04, mat);
        }
      for (let y = 2; y < h - 1; y += 3)
        for (let u = -d / 2 + 1.5; u < d / 2 - 1; u += 2.5) {
          if (random() < 0.4) continue;
          const mat = windowMats[0];
          box(p.x + w / 2 + 0.02, y, p.z + u, 0.04, 1.3, 1, mat);
          box(p.x - w / 2 - 0.02, y, p.z + u, 0.04, 1.3, 1, mat);
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
    box(p.x, h / 2, p.z, 0.3, h, 0.3, brass);
    trees.push({ p, h });
    colliders.push({
      minX: p.x - 0.2,
      maxX: p.x + 0.2,
      minZ: p.z - 0.2,
      maxZ: p.z + 0.2,
    });
  }
  const treeMesh = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 1),
    material("#345e56"),
    trees.length,
  );
  const dummy = new T.Object3D();
  trees.forEach(({ p, h }, i) => {
    dummy.position.set(p.x, h, p.z);
    dummy.scale.set(1.6, 2.4, 1.6);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(i, dummy.matrix);
  });
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
  const sun = new T.DirectionalLight("#ffceaa", 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
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
  const hemi = new T.HemisphereLight("#9bcde6", "#26323d", 2.2);
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
        "varying vec3 vPos; uniform float night; void main(){float h=normalize(vPos).y;vec3 top=mix(vec3(.10,.23,.34),vec3(.014,.028,.07),night);vec3 bottom=mix(vec3(.87,.53,.36),vec3(.12,.18,.25),night);vec3 c=mix(bottom,top,smoothstep(-.06,.6,h));float star=step(.9988,fract(sin(dot(floor(normalize(vPos).xz*950.),vec2(12.9898,78.233)))*43758.5453))*step(.16,h);gl_FragColor=vec4(c+star*night*.5,1.0);}",
    }),
  );
  scene.add(sky);
  scene.fog = new T.FogExp2("#49606c", 0.0033);
  return {
    colliders,
    bounds,
    lots,
    buildingCount,
    setNight(night) {
      sky.material.uniforms.night.value = night ? 1 : 0;
      hemi.intensity = night ? 1.1 : 2.2;
      sun.intensity = night ? 0.55 : 3;
      scene.fog.color.set(night ? "#152638" : "#49606c");
    },
    update(t, camera, reduced) {
      sun.position.set(camera.position.x + 70, 140, camera.position.z + 60);
      sun.target.position.set(camera.position.x, 0, camera.position.z);
      if (!reduced) for (const fn of animated) fn(t);
      for (const label of labels) {
        label.visible = camera.position.distanceTo(label.position) < 130;
        label.quaternion.copy(camera.quaternion);
      }
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
