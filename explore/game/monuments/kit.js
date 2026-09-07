import * as T from "three";
import { leafCanopies } from "../foliage.js";
import { surface } from "../surfaces.js";
const cache = new Map();
const geometries = {
  box: new T.BoxGeometry(1, 1, 1),
  sphere: new T.SphereGeometry(1, 16, 10),
  cylinder: new T.CylinderGeometry(1, 1, 1, 20),
  cone: new T.ConeGeometry(1, 1, 20),
};
export const mat = (color, glow = 0, metal = 0, opacity = 1) => {
  const key = `${color}/${glow}/${metal}/${opacity}`;
  if (!cache.has(key))
    cache.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: metal ? 0.3 : 0.8,
        metalness: metal,
        emissive: color,
        emissiveIntensity: glow,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity === 1,
      }),
    );
  return cache.get(key);
};
export const M = {
  stone: surface("concrete", "#b3b6ac", 0.8),
  brick: surface("brick", "#b78266", 0.6),
  steel: mat("#324650", 0, 0.6),
  glass: mat("#82908b", 0, 0.92),
  white: mat("#eee6d4"),
  wood: mat("#91633d"),
  green: mat("#527848"),
  blue: mat("#72caff", 0.35),
  orange: mat("#ffb765", 0.35),
  red: mat("#ef756f", 0.4),
  dark: mat("#142532"),
};
export function kit(parent, id, sign) {
  const root = new T.Group();
  root.name = `monument-${id}`;
  parent.add(root);
  const batches = new Map(),
    animated = [],
    features = [];
  const v = (x, y, z) => new T.Vector3(x, y, z);
  function group(name, x = 0, y = 0, z = 0, into = root) {
    const g = new T.Group();
    g.name = name;
    g.position.set(x, y, z);
    into.add(g);
    features.push(name);
    return g;
  }
  function add(
    geo,
    material,
    position,
    scale,
    quaternion = new T.Quaternion(),
    into = root,
  ) {
    const key = `${geo.uuid}/${material.uuid}/${into.uuid}`;
    if (!batches.has(key))
      batches.set(key, { geo, material, into, transforms: [] });
    batches
      .get(key)
      .transforms.push(new T.Matrix4().compose(position, quaternion, scale));
  }
  const box = (x, y, z, w, h, d, m = M.stone, yaw = 0, into = root) =>
    add(
      geometries.box,
      m,
      v(x, y, z),
      v(w, h, d),
      new T.Quaternion().setFromAxisAngle(v(0, 1, 0), yaw),
      into,
    );
  const sphere = (x, y, z, sx, sy, sz, m = M.white, into = root) =>
    add(geometries.sphere, m, v(x, y, z), v(sx, sy, sz), undefined, into);
  const cylinder = (x, y, z, r, h, m = M.steel, into = root) =>
    add(geometries.cylinder, m, v(x, y, z), v(r, h, r), undefined, into);
  const cone = (x, y, z, r, h, m = M.green, into = root) =>
    add(geometries.cone, m, v(x, y, z), v(r, h, r), undefined, into);
  const rod = (a, b, r = 0.04, m = M.steel, into = root) => {
    const av = v(...a),
      bv = v(...b),
      delta = bv.clone().sub(av);
    add(
      geometries.cylinder,
      m,
      av.clone().add(bv).multiplyScalar(0.5),
      v(r, delta.length(), r),
      new T.Quaternion().setFromUnitVectors(v(0, 1, 0), delta.normalize()),
      into,
    );
  };
  function label(
    text,
    x,
    y,
    z,
    w = 4,
    h = 0.45,
    color = "#d9e8e2",
    into = root,
  ) {
    const ob = sign(text, color, w, h);
    ob.position.set(x, y, z);
    ob.userData.text = text;
    into.add(ob);
    return ob;
  }
  function curve(points, color = "#72caff", into = root, width = 0.035) {
    const path = new T.CatmullRomCurve3(points.map((p) => v(...p)));
    const ob = new T.Mesh(
      new T.TubeGeometry(
        path,
        Math.max(24, points.length * 2),
        width,
        5,
        false,
      ),
      mat(color, 0.45),
    );
    into.add(ob);
    return path;
  }
  function pulse(path, color = "#ffd184", speed = 0.12) {
    const ob = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), mat(color, 1));
    root.add(ob);
    animated.push((t) => ob.position.copy(path.getPointAt((t * speed) % 1)));
    return ob;
  }
  function flow(points, color = "#72caff") {
    const path = curve(points, color);
    pulse(path, color);
    return path;
  }
  function ring(
    x,
    y,
    z,
    r,
    color = "#72caff",
    horizontal = false,
    into = root,
  ) {
    const ob = new T.Mesh(
      new T.TorusGeometry(r, 0.045, 6, 64),
      mat(color, 0.4),
    );
    ob.position.set(x, y, z);
    if (horizontal) ob.rotation.x = -Math.PI / 2;
    into.add(ob);
    return ob;
  }
  function screen(x, y, z, w, h, title) {
    box(x, y, z, w + 0.15, h + 0.15, 0.16, M.steel);
    box(x, y, z + 0.09, w, h, 0.03, M.dark);
    if (title) label(title, x, y + h / 2 - 0.22, z + 0.14, w - 0.15, 0.32);
  }
  function chart(x, y, z, w, h, series) {
    screen(x, y, z, w, h);
    for (let i = 0; i < 5; i++)
      box(x, y - h / 2 + (i * h) / 4, z + 0.12, w, 0.018, 0.02, M.steel);
    for (const [fn, color] of series)
      curve(
        Array.from({ length: 40 }, (_, i) => [
          x - w / 2 + (i * w) / 39,
          y + fn(i / 39) * h * 0.35,
          z + 0.16,
        ]),
        color,
        root,
        0.025,
      );
  }
  function server(x, z, title = "DATA", h = 2.5) {
    const g = group(`${title}-rack`, x, 0, z);
    box(0, h / 2 + 0.3, 0, 1.1, h, 1, M.dark, 0, g);
    for (let y = 0.65; y < h + 0.1; y += 0.4) {
      box(0, y, 0.52, 0.9, 0.25, 0.05, M.steel, 0, g);
      sphere(0.32, y, 0.57, 0.035, 0.035, 0.025, M.blue, g);
    }
    label(title, x, h + 0.6, z + 0.55, 1.8, 0.3);
    return g;
  }
  function building(x, z, w = 3, d = 2.4, h = 3, m = M.stone) {
    box(x, h / 2 + 0.2, z, w, h, d, m);
    box(x, h + 0.3, z, w + 0.2, 0.2, d + 0.2, M.white);
    for (let y = 1; y < h; y += 0.85)
      for (let u = -w / 2 + 0.5; u < w / 2 - 0.2; u += 0.8) {
        box(x + u, y, z + d / 2 + 0.03, 0.52, 0.66, 0.12, M.steel);
        box(x + u, y, z + d / 2 + 0.1, 0.42, 0.57, 0.025, M.glass);
        box(x + u, y, z + d / 2 + 0.12, 0.025, 0.58, 0.025, M.white);
        box(x + u, y - 0.32, z + d / 2 + 0.07, 0.5, 0.07, 0.12, M.white);
      }
    box(x, 0.7, z + d / 2 + 0.07, 0.55, 1, 0.1, M.dark);
  }
  function panel(x, y, z, w = 2, d = 1.4) {
    const g = group("photovoltaic-panel", x, y, z);
    g.rotation.x = -0.18;
    box(0, 0, 0, w, 0.1, d, M.steel, 0, g);
    box(0, 0.06, 0, w - 0.1, 0.02, d - 0.1, mat("#244d7b", 0, 0.55), 0, g);
    for (let i = -2; i <= 2; i++)
      box((i * w) / 6, 0.08, 0, 0.018, 0.015, d - 0.12, M.white, 0, g);
    for (const s of [-1, 1])
      box(0, 0.08, (s * d) / 6, w - 0.12, 0.015, 0.018, M.white, 0, g);
    rod([x, y - 1, z], [x, y - 0.05, z], 0.07);
    return g;
  }
  function tree(x, z, s = 1) {
    cylinder(x, s, z, 0.12, 2 * s, M.wood);
    leafCanopies(root, [{ x, y: 2.2 * s, z, radius: 1.05 * s }], 90);
  }
  function person(x, z, color = "#e4bc7c", s = 0.6) {
    sphere(x, 1.7 * s, z, 0.2 * s, 0.22 * s, 0.2 * s, M.white);
    box(x, 1.1 * s, z, 0.5 * s, 0.8 * s, 0.3 * s, mat(color));
    for (const side of [-1, 1])
      rod(
        [x + side * 0.14 * s, 0.8 * s, z],
        [x + side * 0.17 * s, 0.15 * s, z],
        0.08 * s,
        M.steel,
      );
  }
  function finish() {
    for (const { geo, material, into, transforms } of batches.values()) {
      const batch = new T.InstancedMesh(geo, material, transforms.length);
      transforms.forEach((t, i) => batch.setMatrixAt(i, t));
      batch.castShadow = batch.receiveShadow = true;
      batch.computeBoundingSphere();
      into.add(batch);
    }
    root.userData.features = features;
    animated.forEach((fn) => fn(0));
    return { root, update: (t) => animated.forEach((fn) => fn(t)) };
  }
  return {
    root,
    v,
    group,
    box,
    sphere,
    cylinder,
    cone,
    rod,
    label,
    curve,
    pulse,
    flow,
    ring,
    screen,
    chart,
    server,
    building,
    panel,
    tree,
    person,
    animated,
    finish,
  };
}
