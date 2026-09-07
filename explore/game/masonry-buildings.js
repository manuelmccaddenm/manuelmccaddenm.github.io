import * as T from "three";
import { mat } from "./monuments/kit.js";
import { surface } from "./surfaces.js";

const roof = surface("asphalt", "#68675c", 0.6, 0.2);
const concrete = surface("concrete", "#c4bbab", 0.6, 0.35);
const interior = mat("#3c3932");
const iron = mat("#313630", 0, 0.3);
const shade = mat("#a3967e");
const up = new T.Vector3(0, 1, 0);

// The original authored modules include real brick returns, bevels, window
// hardware, stone lintels and weathering. They are instanced at architectural scale.
export function masonryBuilding(k, source, position, yaw, kind, variant) {
  const technology = kind === "technology";
  const levels = technology ? 3 : 2 + (variant % 4 === 0 ? 1 : 0);
  const bays = variant % 3 === 0 ? 3 : 4;
  const width = bays * 3,
    depth = 9;
  const height = levels * 3;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const p = (x, y, z) =>
    new T.Vector3(position.x + c * x + s * z, y, position.z - s * x + c * z);
  const box = (x, y, z, w, h, d, m) =>
    k.box(...p(x, y, z).toArray(), w, h, d, m, yaw);
  const rod = (a, b, r = 0.04, m = iron) =>
    k.rod(p(...a).toArray(), p(...b).toArray(), r, m);
  const windows = [];
  function module(name, x, y, z, face, scaleY = 1) {
    const object = source.getObjectByName(name);
    if (!object) throw new Error(`Missing architectural module ${name}`);
    const q = new T.Quaternion().setFromAxisAngle(up, yaw + face);
    object.traverse((o) => {
      if (o.isMesh)
        k.add(
          o.geometry,
          o.material,
          p(x, y, z),
          new T.Vector3(1, scaleY, 1),
          q,
        );
    });
  }
  box(0, 0.13, -0.8, width + 0.55, 0.26, depth + 0.55, concrete);
  const faces = [
    { face: 0, count: bays, x: 0, z: 3.7 },
    { face: Math.PI, count: bays, x: 0, z: -5.3 },
    { face: Math.PI / 2, count: 3, x: width / 2, z: -0.8 },
    { face: -Math.PI / 2, count: 3, x: -width / 2, z: -0.8 },
  ];
  for (let floor = 0; floor < levels; floor++) {
    box(0, 0.24 + floor * 3, -0.8, width, 0.14, depth, concrete);
    for (const f of faces) {
      const cf = Math.cos(f.face),
        sf = Math.sin(f.face);
      const at = (x, y, z = 0) => [
        f.x + cf * x + sf * z,
        y,
        f.z - sf * x + cf * z,
      ];
      for (let bay = 0; bay < f.count; bay++) {
        const x = -f.count * 1.5 + (bay + 1) * 3;
        const door =
          f.face === 0 && floor === 0 && bay === Math.floor(f.count / 2);
        const style = technology
          ? "large_01"
          : ["medium_02", "double_01", "large_01", "small_01"][variant % 4];
        const y = 0.27 + floor * 3;
        const coords = at(x, y);
        module(
          door
            ? "wall_door_recessed_small_01"
            : `wall_window_centered_${style}`,
          ...coords,
          f.face,
        );
        module(
          door ? "door_recessed_small_01" : `window_centered_${style}`,
          ...coords,
          f.face,
        );
        const recess = at(x - 1.5, y + 1.5, -1.4);
        // A dark room, floor, and varied curtains behind the modeled opening.
        k.box(...p(...recess).toArray(), 2.8, 2.7, 0.1, interior, yaw + f.face);
        if (!door) {
          const covered = (variant + bay + floor) % 4;
          const blind = at(x - 1.5, y + 2.1, -0.42);
          if (covered === 0)
            k.box(
              ...p(...blind).toArray(),
              1.2,
              1.1,
              0.04,
              shade,
              yaw + f.face,
            );
          windows.push({
            center: p(...at(x - 1.5, y + 1.5, -0.17)).toArray(),
            recess: 0.17,
            depth: 1.4,
            width: style === "large_01" ? 2.1 : 1.4,
            height: 1.7,
            face: f.face,
          });
        }
        module("cornice02_standard_standard_01", ...at(x, y + 2.91), f.face);
        if (floor === levels - 1)
          module(
            "cornice01_standard_standard_01",
            ...at(x, height + 0.25),
            f.face,
          );
      }
    }
  }
  box(0, height + 0.32, -0.8, width, 0.17, depth, roof);
  // Copings, gutters and services terminate in the building, never float.
  for (const side of [-1, 1]) {
    box(
      side * (width / 2 - 0.1),
      height + 0.59,
      -0.8,
      0.2,
      0.45,
      depth,
      concrete,
    );
    rod(
      [side * (width / 2 - 0.15), height + 0.55, 3.86],
      [side * (width / 2 - 0.15), 0.35, 3.86],
      0.05,
    );
    rod(
      [side * (width / 2 - 0.15), 0.35, 3.86],
      [side * (width / 2 - 0.15), 0.23, 4.13],
      0.05,
    );
  }
  box(0, height + 0.59, -5.2, width, 0.45, 0.2, concrete);
  box(0, height + 0.59, 3.6, width, 0.45, 0.2, concrete);
  const doorX = -bays * 1.5 + Math.floor(bays / 2) * 3 + 1.5;
  box(doorX, 0.13, 5.85, 2.15, 0.15, 4.5, concrete);
  const awning = technology || variant % 3 === 1;
  if (awning) {
    box(doorX, 2.95, 4.42, 3.1, 0.12, 1.4, iron);
    for (const dx of [-1.35, 1.35])
      rod([doorX + dx, 2.93, 4.95], [doorX + dx, 3.65, 3.72], 0.024);
  }
  const address = k.label(
    technology ? "COMPUTING / RESEARCH" : String(100 + variant),
    ...p(doorX, 2.78, 3.85).toArray(),
    technology ? 2.1 : 0.4,
    0.19,
  );
  address.rotation.y = yaw;
  if (technology) {
    for (const x of [-2, 2]) {
      box(x, height + 0.88, -2, 1.8, 0.8, 2, mat("#9b9c90", 0, 0.3));
      for (let z = -2.85; z < -1.1; z += 0.14)
        box(x, height + 1.3, z, 1.65, 0.035, 0.055, iron);
    }
    for (let x = -width / 2 + 0.25; x < width / 2; x += 0.32)
      box(x, height + 0.45, 2.7, 0.07, 0.7, 1.2, iron);
  } else {
    box(-width / 2 + 1.2, height + 1, -3.5, 0.8, 1.5, 0.8, concrete);
    box(-width / 2 + 1.2, height + 1.78, -3.5, 1, 0.12, 1, iron);
    // Supported balcony on selected homes breaks up the repeated elevations.
    if (variant % 2) {
      box(-1.5, 3.34, 4.22, 3, 0.18, 1.15, concrete);
      for (let x = -2.9; x <= -0.1; x += 0.18)
        rod([x, 3.43, 4.7], [x, 4.36, 4.7], 0.013);
      rod([-3, 4.38, 4.7], [0, 4.38, 4.7], 0.026);
      for (const x of [-3, 0]) rod([x, 4.38, 3.7], [x, 4.38, 4.7], 0.026);
    }
  }
  return {
    kind: technology ? "technology" : "courtyard-house",
    style: technology ? "masonry-laboratory" : "masonry-residence",
    crowns: [],
    windows,
    screenParts: [],
    footprint: {
      minX: position.x - 8.5,
      maxX: position.x + 8.5,
      minZ: position.z - 8.5,
      maxZ: position.z + 8.5,
      height: height + 2,
    },
  };
}
