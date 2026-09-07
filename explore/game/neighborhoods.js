import * as T from "three";
import { M, mat } from "./monuments/kit.js";
import { surface } from "./surfaces.js";

const plaster = ["#d6c8aa", "#be8263", "#ddd9c7", "#8f9c8c"].map((c) =>
  surface("plaster", c, 0.65, 0.15),
);
const brick = surface("brick", "#c59272", 0.7, 0.48);
const timber = mat("#77563b", 0, 0.05);
const frame = mat("#344240", 0, 0.55);
const glass = mat("#7e9b9c", 0.025, 0.65);
const housePaving = surface("paving", "#b3b4a2", 0.4);
const linen = mat("#d4c8ac");
const cyan = mat("#79b9bd", 0.3, 0.45);

export function neighborhoodBuilding(k, position, yaw, kind, variant) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const p = (x, y, z) => [
    position.x + c * x + s * z,
    y,
    position.z - s * x + c * z,
  ];
  const box = (x, y, z, w, h, d, m = M.stone) =>
    k.box(...p(x, y, z), w, h, d, m, yaw);
  const rod = (a, b, r = 0.025, m = frame) => k.rod(p(...a), p(...b), r, m);
  const label = (text, x, y, z, w, h) => {
    const sign = k.label(text, ...p(x, y, z), w, h);
    sign.rotation.y = yaw;
  };
  const footprint = {
    minX: position.x - 8.5,
    maxX: position.x + 8.5,
    minZ: position.z - 8.5,
    maxZ: position.z + 8.5,
    height: kind === "technology" ? 10 : 9,
  };
  function window(x, y, z, w, h) {
    box(x, y, z, w + 0.18, h + 0.18, 0.22, frame);
    box(x, y, z + 0.13, w, h, 0.04, glass);
    box(x, y, z + 0.17, 0.045, h, 0.04, frame);
    // Curtains set behind narrow frames add depth and domestic variation.
    box(x - w * 0.36, y, z + 0.15, w * 0.2, h - 0.08, 0.025, linen);
    box(x, y - h / 2 - 0.09, z + 0.13, w + 0.4, 0.13, 0.45, M.white);
  }
  if (kind === "technology") {
    box(0, 0.16, 0, 13, 0.3, 12, M.stone);
    box(0, 3.8, -1.2, 12, 7.3, 8.5, mat("#455b61", 0, 0.5));
    for (const side of [-1, 1]) box(side * 5.85, 3.9, 0, 0.24, 7.7, 11, frame);
    for (let x = -4.8; x <= 4.8; x += 2.4) {
      window(x, 2.1, 3.12, 2.22, 3.25);
      window(x, 5.7, 3.12, 2.22, 2.9);
      box(x, 3.85, 3.33, 2.3, 0.06, 0.08, cyan);
    }
    // An exposed diagrid and a folded roof establish a technological district.
    for (let x = -6; x < 6; x += 3) {
      rod([x, 0.3, 3.4], [x + 3, 7.6, 3.4], 0.055, M.white);
      rod([x, 7.6, 3.4], [x + 3, 0.3, 3.4], 0.055, M.white);
    }
    for (const side of [-1, 1]) {
      for (let z = -4.5; z <= 2; z += 1.3)
        box(side * 6.1, 4, z, 0.1, 7.6, 0.14, cyan);
      box(side * 3, 8.18, -0.7, 6.2, 0.18, 10, M.white);
    }
    const geo = new T.BufferGeometry();
    const vertices = [
      [-6.5, 8.25, -5.7],
      [6.5, 8.25, -5.7],
      [0, 9.8, -0.7],
      [6.5, 8.25, -5.7],
      [6.5, 8.25, 4.3],
      [0, 9.8, -0.7],
      [6.5, 8.25, 4.3],
      [-6.5, 8.25, 4.3],
      [0, 9.8, -0.7],
      [-6.5, 8.25, 4.3],
      [-6.5, 8.25, -5.7],
      [0, 9.8, -0.7],
    ];
    geo.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        vertices.flatMap((v) => p(...v)),
        3,
      ),
    );
    geo.computeVertexNormals();
    const roof = new T.Mesh(geo, mat("#bfc9c4", 0, 0.35));
    roof.material.side = T.DoubleSide;
    roof.castShadow = roof.receiveShadow = true;
    k.root.add(roof);
    box(0, 3.6, 4.2, 8, 0.2, 2.7, M.steel);
    for (const x of [-3.6, 3.6]) box(x, 1.8, 5.25, 0.12, 3.6, 0.12, M.steel);
    label(
      variant % 2
        ? "COMPUTE · REPRESENTATION LAB"
        : "MACHINE LEARNING · RESEARCH",
      0,
      7.3,
      3.55,
      10.4,
      0.42,
    );
    // Cabinet vents, heat exchangers and cable trays are physical infrastructure.
    for (let x = -4; x <= 4; x += 2) {
      box(x, 0.95, 5, 1.4, 1.8, 1, M.steel);
      for (let y = 0.3; y < 1.8; y += 0.22)
        box(x, y, 5.52, 1.1, 0.055, 0.04, mat("#98acaa"));
    }
    return { footprint, kind };
  }
  const wall = plaster[variant % plaster.length];
  box(0, 0.12, 0, 13, 0.24, 12, M.stone);
  box(-2.5, 1.65, -0.65, 6, 3.25, 8.7, wall);
  box(3.1, 1.65, -2.15, 5.2, 3.25, 5.7, variant % 2 ? brick : wall);
  // An offset upper floor leaves a terrace and a recessed planted courtyard.
  box(-2.4, 4.8, -1.5, 6.2, 3.05, 7, variant % 2 ? wall : brick);
  box(-2.4, 6.4, -1.5, 6.55, 0.22, 7.35, M.white);
  for (const side of [-1, 1])
    box(-2.4 + side * 3.2, 6.75, -1.5, 0.12, 0.65, 7.3, wall);
  box(-2.4, 6.75, -5.05, 6.5, 0.65, 0.12, wall);
  for (const x of [-4, -1]) {
    window(x, 1.65, 3.77, 2.5, 2.65);
    window(x, 4.9, 2.04, 2.35, 2.2);
  }
  window(3.1, 1.65, 0.75, 4.35, 2.65);
  box(-2.4, 3.37, 3.1, 6.7, 0.2, 2.5, M.white);
  for (let x = -5.4; x <= 0.6; x += 0.5)
    rod([x, 3.47, 4.28], [x, 4.4, 4.28], 0.022, frame);
  rod([-5.7, 4.4, 4.28], [0.9, 4.4, 4.28], 0.045, frame);
  // Three roof types break up the skyline: clay gables, timber terraces, planted roofs.
  if (variant % 3 === 0) {
    const vertices = [
      [-5.9, 6.6, -5.3],
      [-2.4, 8.25, -5.3],
      [-5.9, 6.6, 2.5],
      [-5.9, 6.6, 2.5],
      [-2.4, 8.25, -5.3],
      [-2.4, 8.25, 2.5],
      [-2.4, 8.25, -5.3],
      [1.1, 6.6, -5.3],
      [-2.4, 8.25, 2.5],
      [-2.4, 8.25, 2.5],
      [1.1, 6.6, -5.3],
      [1.1, 6.6, 2.5],
      [-5.9, 6.6, 2.5],
      [-2.4, 8.25, 2.5],
      [1.1, 6.6, 2.5],
      [-5.9, 6.6, -5.3],
      [1.1, 6.6, -5.3],
      [-2.4, 8.25, -5.3],
    ];
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        vertices.flatMap((v) => p(...v)),
        3,
      ),
    );
    geometry.computeVertexNormals();
    const roofMaterial = mat("#aa6545");
    roofMaterial.side = T.DoubleSide;
    const pitchedRoof = new T.Mesh(geometry, roofMaterial);
    pitchedRoof.castShadow = pitchedRoof.receiveShadow = true;
    k.root.add(pitchedRoof);
    for (let z = -5.25; z < 2.5; z += 0.28) {
      rod([-5.9, 6.63, z], [-2.4, 8.28, z], 0.025, mat("#bd7d59"));
      rod([-2.4, 8.28, z], [1.1, 6.63, z], 0.025, mat("#bd7d59"));
    }
    box(-4, 7.8, -3.8, 0.65, 2.1, 0.7, brick);
  } else {
    for (const x of [-4.8, -0.3])
      for (const z of [-3.8, 0.8]) box(x, 7.25, z, 0.1, 1.6, 0.1, timber);
    if (variant % 3 === 1) {
      for (let x = -5; x < 0; x += 0.42)
        box(x, 8.03, -1.5, 0.15, 0.12, 5.1, timber);
    } else {
      box(-2.5, 8.03, -1.5, 5.2, 0.08, 5.1, glass);
      for (const x of [-4.7, -0.5]) {
        box(x, 6.65, -1.5, 0.6, 0.5, 4.6, M.stone);
        box(x, 6.97, -1.5, 0.55, 0.18, 4.55, mat("#667a53"));
      }
    }
  }
  box(-5.57, 3.2, -4.5, 0.075, 6.4, 0.075, frame);
  box(3, 3.35, -2, 4.8, 0.16, 5.9, M.white);
  box(3.1, 3.65, -3.4, 2.5, 0.16, 1.55, glass);
  // Entry gate, patterned masonry screen and a low garden wall, all at human scale.
  box(3.1, 0.38, 5.3, 5.2, 0.76, 0.2, wall);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 9; col++)
      if ((row + col) % 2 === 0)
        box(1 + col * 0.52, 0.95 + row * 0.32, 5.3, 0.38, 0.22, 0.18, brick);
  box(0.55, 1.25, 4.05, 0.12, 2.5, 2.7, timber);
  for (let z = 3; z < 5.3; z += 0.2)
    box(0.64, 1.25, z, 0.08, 2.45, 0.065, frame);
  box(-2.5, -0.005, 5.3, 4.4, 0.12, 2.5, housePaving);
  for (const x of [1.6, 4.7]) {
    box(x, 0.38, 2.1, 1.1, 0.75, 1.1, M.stone);
    for (let j = 0; j < 5; j++)
      k.sphere(
        ...p(x + Math.cos(j * 2) * 0.25, 0.95, 2.1 + Math.sin(j * 2) * 0.25),
        0.35,
        0.3,
        0.35,
        mat("#667355"),
      );
  }
  label(String(100 + variant), -5.05, 1.9, 3.95, 0.58, 0.32);
  return {
    footprint,
    kind: "courtyard-house",
    style: ["clay-roof", "timber-terrace", "planted-terrace"][variant % 3],
  };
}
