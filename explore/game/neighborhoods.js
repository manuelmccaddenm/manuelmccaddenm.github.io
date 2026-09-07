import * as T from "three";
import { M, mat } from "./monuments/kit.js";
import { surface } from "./surfaces.js";

const walls = ["#cec6b6", "#b6ada0", "#ba9b83", "#aaa99a"].map((c) =>
  surface("plaster", c, 0.75, 0.08),
);
const masonry = surface("brick", "#8c7364", 0.72, 0.15);
const stone = surface("plaster", "#a6a192", 0.6, 0.1);
const wood = surface("brick", "#655449", 2.4, 0);
const metal = mat("#333b38", 0, 0.35);
const sill = mat("#c3bbaa");
const roomWall = mat("#726c5d");
const roomFloor = mat("#615447");
const cloth = [mat("#a59e8c"), mat("#b7b3a5"), mat("#888d84")];
const glass = new T.MeshPhysicalMaterial({
  color: "#bec8c3",
  metalness: 0,
  roughness: 0.08,
  ior: 1.5,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
  envMapIntensity: 1.15,
});
glass.userData.castShadow = false;
const roofSurface = surface("asphalt", "#675f54", 0.7, 0.15);
const roofTile = mat("#8b6049");
const screenStone = mat("#a99780");

export function neighborhoodBuilding(k, position, yaw, kind, variant) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const p = (x, y, z) => [
    position.x + c * x + s * z,
    y,
    position.z - s * x + c * z,
  ];
  const box = (x, y, z, w, h, d, m = stone) =>
    k.box(...p(x, y, z), w, h, d, m, yaw);
  const rod = (a, b, r = 0.025, m = metal) => k.rod(p(...a), p(...b), r, m);
  const label = (text, x, y, z, w, h) => {
    const ob = k.label(text, ...p(x, y, z), w, h);
    ob.rotation.y = yaw;
  };
  const crowns = [];
  const shrub = (x, y, z, radius) => {
    const [wx, wy, wz] = p(x, y, z);
    crowns.push({ x: wx, y: wy, z: wz, radius });
  };
  const technology = kind === "technology";
  const levels = technology ? 3 : variant % 5 === 0 ? 3 : 2;
  const height = 0.25 + levels * 3.15;
  const wall = technology ? walls[1] : walls[variant % walls.length];
  const windows = [],
    screenParts = [];
  const footprint = {
    minX: position.x - 8.5,
    maxX: position.x + 8.5,
    minZ: position.z - 8.5,
    maxZ: position.z + 8.5,
    height: height + 2.2,
  };
  box(0, 0.12, 0, 13, 0.24, 13, stone);
  // Each façade is assembled around apertures. Side and rear elevations receive
  // the same construction detail, because they are visible from neighboring streets.
  function facade(level, face, front, width, offsetZ, entrance) {
    const cf = Math.cos(face),
      sf = Math.sin(face);
    const lp = (x, y, z) => [cf * x + sf * z, y, -sf * x + cf * z + offsetZ];
    const wp = (x, y, z) => p(...lp(x, y, z));
    const box = (x, y, z, w, h, d, m) =>
      k.box(...wp(x, y, z), w, h, d, m, yaw + face);
    const rod = (a, b, r, m) => k.rod(wp(...a), wp(...b), r, m);
    const base = 0.25 + level * 3.15;
    const count = width > 10 ? 3 : 2,
      spacing = width / count;
    for (let bay = 0; bay < count; bay++) {
      const x = -width / 2 + spacing * (bay + 0.5);
      const door = entrance && level === 0 && bay === 1;
      const w = door ? 1.35 : technology ? 2.8 : 2.45,
        h = door ? 2.5 : 1.85;
      const low = door ? 0.1 : 0.85,
        bottom = base + low,
        y = bottom + h / 2;
      const pier = (spacing - w) / 2;
      for (const side of [-1, 1])
        box(
          x + side * (w / 2 + pier / 2),
          base + 1.575,
          front,
          pier,
          3.15,
          0.36,
          wall,
        );
      box(
        x,
        base + low / 2,
        front,
        w,
        low,
        0.36,
        level === 1 && variant % 3 === 1 ? masonry : wall,
      );
      const top = 3.15 - low - h;
      box(x, base + 3.15 - top / 2, front, w, top, 0.36, wall);
      // Deep jambs, lintel, sill and four independent frame members.
      const glazingZ = front - 0.25;
      for (const side of [-1, 1])
        box(
          x + side * (w / 2 + 0.07),
          y,
          front - 0.05,
          0.14,
          h + 0.2,
          0.55,
          sill,
        );
      for (const side of [-1, 1])
        box(
          x,
          y + side * (h / 2 + 0.07),
          front - 0.05,
          w + 0.28,
          0.14,
          0.55,
          sill,
        );
      for (const side of [-1, 1])
        box(x + side * (w / 2 - 0.035), y, glazingZ, 0.07, h, 0.08, metal);
      for (const side of [-1, 1])
        box(x, y + side * (h / 2 - 0.035), glazingZ, w, 0.07, 0.08, metal);
      box(x, y, glazingZ, w - 0.14, h - 0.14, 0.02, glass);
      box(x, y, glazingZ + 0.03, 0.035, h, 0.045, metal);
      box(x, y - h / 2 - 0.14, front + 0.12, w + 0.4, 0.11, 0.66, sill);
      // A shaded room behind each aperture provides real parallax at street level.
      box(x, base + 1.48, front - 2.5, 3.35, 2.95, 0.16, roomWall);
      box(x, base + 0.12, front - 1.4, 3.35, 0.12, 2.2, roomFloor);
      for (const side of [-1, 1])
        box(x + side * 1.68, base + 1.5, front - 1.4, 0.1, 3, 2.3, roomWall);
      if (!door) {
        const opened = (variant + bay + level) % 3;
        // Folded cloth sits inside the room and catches light across its folds.
        if (technology) {
          box(x, y + h / 2 - 0.16, front - 0.5, w - 0.1, 0.28, 0.07, cloth[1]);
        }
        for (const side of [-1, 1])
          for (
            let fold = 0;
            fold < (technology ? 0 : opened === 0 ? 7 : 3);
            fold++
          ) {
            box(
              x + side * (w / 2 - 0.13 - fold * 0.11),
              y,
              front - 0.48 + (fold % 2) * 0.065,
              0.12,
              h - 0.05,
              0.07,
              cloth[(variant + level) % 3],
            );
          }
        rod(
          [x - w / 2, y + h / 2 + 0.08, front - 0.45],
          [x + w / 2, y + h / 2 + 0.08, front - 0.45],
          0.018,
          metal,
        );
        if (opened !== 0) {
          box(x - 0.3, base + 0.68, front - 1.8, 1.5, 0.12, 0.65, wood);
          for (const dx of [-0.9, 0.3])
            box(x + dx, base + 0.36, front - 1.8, 0.055, 0.6, 0.5, metal);
          box(
            x + 0.65,
            base + 0.52,
            front - 1.25,
            0.55,
            0.8,
            0.55,
            mat("#585e54"),
          );
        }
      } else {
        box(x, y - h * 0.3, glazingZ + 0.02, w - 0.12, h * 0.4, 0.1, wood);
        rod(
          [x + 0.38, y - 0.15, glazingZ + 0.1],
          [x + 0.38, y + 0.2, glazingZ + 0.1],
          0.026,
          metal,
        );
        box(x + 1.28, base + 1.25, front + 0.2, 0.16, 0.26, 0.1, metal);
      }
      windows.push({
        center: wp(x, y, glazingZ),
        recess: 0.25,
        depth: 2.25,
        width: w,
        height: h,
        face,
      });
    }
    box(0, base + 3.12, front + 0.1, width + 0.15, 0.16, 0.6, sill);
  }
  for (let level = 0; level < levels; level++) {
    const base = 0.25 + level * 3.15,
      front = technology ? 4 : 3.2;
    box(0, base, -0.9, 12, 0.2, 10, stone);
    facade(level, 0, front, 12, 0, true);
    facade(level, Math.PI, 5.78, 12, 0, false);
    const depth = front + 5.78,
      center = (front - 5.78) / 2;
    for (const side of [-1, 1])
      facade(level, (side * Math.PI) / 2, 5.85, depth, center, false);
    if (level > 0 && !technology) {
      const bx = variant % 2 ? -4 : 4;
      box(bx, base + 0.07, front + 0.72, 3.5, 0.18, 1.4, stone);
      for (let x = bx - 1.6; x <= bx + 1.61; x += 0.2)
        rod(
          [x, base + 0.17, front + 1.34],
          [x, base + 1.14, front + 1.34],
          0.017,
        );
      rod(
        [bx - 1.65, base + 1.15, front + 1.34],
        [bx + 1.65, base + 1.15, front + 1.34],
        0.035,
      );
      for (const side of [-1, 1])
        rod(
          [bx + side * 1.65, base + 1.15, front],
          [bx + side * 1.65, base + 1.15, front + 1.34],
          0.035,
        );
    }
  }
  box(0, height, -0.9, 12.3, 0.22, 10.2, roofSurface);
  if (technology) {
    // External shading fins and actual rooftop services replace neon ornament.
    for (const side of [-1, 1])
      for (let z = -4.8; z < 4; z += 1.05)
        box(side * 6.12, height / 2, z, 0.2, height, 0.36, metal);
    for (let x = -5.2; x <= 5.2; x += 1.3) {
      rod([x, 0.3, 4.5], [x + 0.8, height, 4.5], 0.045, sill);
      box(x, 0.3, 4.5, 0.18, 0.08, 0.22, metal);
    }
    box(0, 3.1, 5.1, 7.4, 0.14, 2.4, metal);
    for (const x of [-3.5, 3.5]) box(x, 1.55, 6.1, 0.09, 3.1, 0.09, metal);
    for (const x of [-3, 0, 3]) {
      box(x, height + 0.6, -1.5, 1.7, 1, 2.2, mat("#a4a79f", 0, 0.25));
      for (let z = -2.4; z < -0.5; z += 0.18)
        box(x, height + 1.12, z, 1.5, 0.04, 0.04, metal);
    }
    label(
      variant % 2 ? "RESEARCH / COMPUTE" : "REPRESENTATION LAB",
      0,
      2.85,
      6.32,
      5.8,
      0.32,
    );
  } else if (variant % 4 === 1) {
    const geo = new T.BufferGeometry();
    const corners = [
      [-6.3, height + 0.1, -6.1],
      [0, height + 2.1, -6.1],
      [6.3, height + 0.1, -6.1],
      [-6.3, height + 0.1, 4.3],
      [0, height + 2.1, 4.3],
      [6.3, height + 0.1, 4.3],
    ];
    geo.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [0, 1, 3, 3, 1, 4, 1, 2, 4, 4, 2, 5, 0, 2, 1, 3, 4, 5].flatMap((i) =>
          p(...corners[i]),
        ),
        3,
      ),
    );
    geo.computeVertexNormals();
    const m = roofTile.clone();
    m.side = T.DoubleSide;
    geo.addGroup(0, 12, 0);
    geo.addGroup(12, 6, 1);
    const roof = new T.Mesh(geo, [m, wall]);
    roof.castShadow = roof.receiveShadow = true;
    k.root.add(roof);
    for (let z = -6; z < 4.3; z += 0.22) {
      rod([-6.3, height + 0.13, z], [0, height + 2.13, z], 0.026, roofTile);
      rod([0, height + 2.13, z], [6.3, height + 0.13, z], 0.026, roofTile);
    }
    box(-3.5, height + 1.7, -4, 0.7, 2, 0.7, masonry);
  } else {
    for (const side of [-1, 1])
      box(side * 6, height + 0.4, -0.9, 0.22, 0.65, 10, wall);
    box(0, height + 0.4, -5.85, 12, 0.65, 0.22, wall);
    box(0, height + 0.4, 4, 12, 0.65, 0.22, wall);
    for (const x of [-3.5, 1.3])
      for (const z of [-3.5, 1.5])
        box(x, height + 1.1, z, 0.12, 2.1, 0.12, wood);
    for (let x = -3.7; x < 1.6; x += 0.24)
      box(x, height + 2.2, -1, 0.1, 0.12, 5.4, wood);
    box(3.8, height + 0.75, -3.5, 1.2, 1.2, 1.2, mat("#5c615b"));
    for (const x of [-4.7, 4.7]) {
      box(x, height + 0.35, 1.7, 0.8, 0.5, 2.2, stone);
      for (const z of [1, 2.3]) shrub(x, height + 0.8, z, 0.65);
    }
  }
  // Coping, a downpipe with elbows, meter boxes and door-side wall lights.
  rod([-5.65, height, -5.3], [-5.65, 0.35, -5.3], 0.055, metal);
  rod([-5.65, 0.35, -5.3], [-5.65, 0.2, -5.65], 0.055, metal);
  box(-5.6, 1.3, 3.43, 0.35, 0.5, 0.14, mat("#8e9187", 0, 0.3));
  box(-1.18, 2.2, 3.45, 0.16, 0.35, 0.15, metal);
  label(String(100 + variant), -1.16, 1.55, 3.46, 0.42, 0.24);
  if (!technology) {
    // Every perforated screen cell is a connected four-sided block, supported by
    // the continuous wall below. No alternating disconnected bricks remain.
    const addScreen = (x, y, w, h) => {
      screenParts.push({ x, y, z: 6.08, w, h, d: 0.22 });
      box(x, y, 6.08, w, h, 0.22, screenStone);
    };
    addScreen(3.6, 0.5, 4.9, 0.75);
    for (let col = 0; col < 10; col++)
      for (let row = 0; row < 3; row++) {
        const x = 1.35 + col * 0.5,
          y = 0.875 + row * 0.4;
        addScreen(x, y + 0.035, 0.5, 0.07);
        addScreen(x, y + 0.365, 0.5, 0.07);
        addScreen(x - 0.215, y + 0.2, 0.07, 0.26);
        addScreen(x + 0.215, y + 0.2, 0.07, 0.26);
      }
    addScreen(3.6, 2.12, 5.05, 0.12);
    box(3.6, 0.35, 4.95, 4.7, 0.45, 1.25, stone);
    box(3.6, 0.6, 4.95, 4.5, 0.07, 1.1, mat("#3f4738"));
    for (const x of [1.7, 2.8, 4, 5.1]) shrub(x, 1.03, 4.95, 0.55);
  }
  // A continuous footpath reaches the sidewalk at the front of the parcel.
  box(0, 0.15, 5.8, 2.2, 0.14, 5.8, stone);
  return {
    footprint,
    kind: technology ? "technology" : "courtyard-house",
    style: technology
      ? "research"
      : variant % 4 === 1
        ? "clay-roof"
        : "urban-terrace",
    crowns,
    windows,
    screenParts,
  };
}
