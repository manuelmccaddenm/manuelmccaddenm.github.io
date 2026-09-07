import { M, mat } from "./kit.js";

export const URBAN_STOPS = new Set([
  "model-picker",
  "nutrition",
  "retail",
  "cdmx-budget",
]);

// Human-scale places with individual wall/furniture footprints and clear entrances.
function architecture(k) {
  const { root, box, cylinder, label, tree, group } = k;
  root.userData.solidFootprints = [];
  const solid = (x, z, w, d, height) =>
    root.userData.solidFootprints.push({ x, z, w, d, height });
  function wall(x, y, z, w, h, d, material = M.brick, into = root) {
    box(x, y, z, w, h, d, material, 0, into);
    solid(x, z, w, d, y + h / 2);
  }
  function bench(x, z, w = 2) {
    const seat = group("street-bench", x, 0, z);
    for (let i = 0; i < 4; i++)
      box(0, 0.48, -0.23 + i * 0.15, w, 0.075, 0.1, M.wood, 0, seat);
    for (const side of [-1, 1])
      box(side * (w / 2 - 0.2), 0.24, 0, 0.08, 0.48, 0.5, M.steel, 0, seat);
    box(0, 0.82, -0.32, w, 0.45, 0.08, M.wood, 0, seat);
    solid(x, z, w, 0.7, 1.05);
  }
  function planter(x, z, w = 1.2) {
    wall(x, 0.3, z, w, 0.6, 1.1, M.stone);
    box(x, 0.61, z, w - 0.14, 0.03, 0.95, mat("#544836"));
    tree(x, z, 0.75);
  }
  function shopShell(title, material, accent) {
    const shell = group("street-building"),
      roof = group("inspection-roof");
    box(0, -0.08, 0, 13, 0.14, 10, M.stone);
    wall(0, 2.15, -4.6, 12.8, 4.3, 0.3, material, shell);
    for (const s of [-1, 1]) {
      wall(s * 6.25, 2.15, 0, 0.3, 4.3, 9.3, material, shell);
      wall(s * 3.85, 0.3, 4.5, 4.9, 0.6, 0.25, material, shell);
      box(
        s * 3.85,
        2.02,
        4.5,
        4.7,
        2.8,
        0.035,
        mat("#a7bdaf", 0, 0.15, 0.13),
        0,
        shell,
      );
      // Doorway stays open between the glazing bays.
      for (const x of [s * 1.4, s * 3.85, s * 6.2])
        wall(x, 2.15, 4.5, 0.11, 4.3, 0.15, M.steel, shell);
      box(s * 3.85, 3.46, 4.5, 4.9, 0.1, 0.15, M.steel, 0, shell);
    }
    box(0, 3.95, 4.52, 12.8, 0.8, 0.32, accent, 0, shell);
    label(title, 0, 4, 4.71, 11.5, 0.5, "#eee5ce");
    box(0, 4.38, -0.05, 13.1, 0.2, 9.8, M.stone, 0, roof);
    for (const z of [-4.85, 4.75])
      box(0, 4.64, z, 13.1, 0.45, 0.16, material, 0, roof);
    for (const x of [-6.47, 6.47])
      box(x, 4.64, -0.05, 0.16, 0.45, 9.8, material, 0, roof);
    for (const x of [-3, 3]) box(x, 4.55, -1.5, 2.5, 0.15, 3, M.glass, 0, roof);
    box(0, -0.075, 6.25, 13.2, 0.12, 3.6, M.stone);
    root.userData.setInspection = (enabled) => {
      roof.visible = !enabled;
    };
    return roof;
  }
  return { solid, wall, bench, planter, shopShell };
}

export function urban(id, k) {
  if (!["nutrition", "retail", "cdmx-budget"].includes(id)) return false;
  const { root, box, cylinder, sphere, rod, label, group } = k;
  const a = architecture(k);
  if (id === "nutrition") {
    a.shopShell("NUTRITION5K · CAFÉ & FOOD LAB", M.brick, mat("#3f5c48"));
    const awning = group("cafe-awning");
    for (let i = 0; i < 26; i++)
      box(
        -6.25 + i * 0.5,
        3.5,
        5.25,
        0.5,
        0.09,
        1.65,
        i % 2 ? M.white : mat("#4f6651"),
        0,
        awning,
      );
    box(0, 3.35, 6.03, 13, 0.3, 0.07, mat("#4f6651"), 0, awning);
    // A real counter anchors the image-to-ingredients explanation.
    const counter = group("food-scanning-counter");
    a.wall(-3.55, 0.52, -1.7, 4.4, 1.04, 1.15, M.wood, counter);
    box(-3.55, 1.09, -1.7, 4.65, 0.12, 1.35, M.white, 0, counter);
    cylinder(-3.2, 1.19, -1.6, 0.46, 0.06, M.white, counter);
    cylinder(-3.2, 1.23, -1.6, 0.39, 0.025, mat("#c8cbbb"), counter);
    for (let i = 0; i < 7; i++)
      sphere(
        -3.38 + (i % 3) * 0.09,
        1.31,
        -1.7 + Math.floor(i / 3) * 0.1,
        0.07,
        0.09,
        0.07,
        mat("#39724b"),
        counter,
      );
    sphere(-3.02, 1.29, -1.58, 0.16, 0.055, 0.13, mat("#bd8c67"), counter);
    for (let i = 0; i < 14; i++)
      sphere(
        -3.3 + (i % 5) * 0.05,
        1.27,
        -1.43 + Math.floor(i / 5) * 0.03,
        0.026,
        0.012,
        0.015,
        M.white,
        counter,
      );
    rod([-3.2, 1.15, -2.12], [-3.2, 2.2, -2.12], 0.025, M.steel);
    rod([-3.2, 2.2, -2.12], [-3.2, 2.2, -1.6], 0.025, M.steel);
    box(-3.2, 2.16, -1.6, 0.26, 0.12, 0.22, M.dark);
    label("PHOTO → INGREDIENTS → MASS", -3.3, 2.8, -2.3, 5.2, 0.35);
    // Ingredient jars and small menu boards belong to the café interior.
    for (let row = 0; row < 3; row++) {
      box(-3.4, 1.45 + row * 0.7, -4.25, 4.5, 0.07, 0.45, M.wood);
      for (let j = 0; j < 8; j++)
        cylinder(
          -5.25 + j * 0.5,
          1.68 + row * 0.7,
          -4.25,
          0.15,
          0.38,
          [mat("#c2ad7a"), mat("#77805b"), mat("#aa734c")][row],
        );
    }
    label("GUIDED ATTENTION · INGREDIENT EMBEDDINGS", 0, 3.6, -4.4, 10.8, 0.36);
    for (const z of [-2.5, 0.9]) {
      cylinder(3.7, 0.8, z, 1, 0.09, M.wood);
      a.solid(3.7, z, 2, 2, 0.9);
      cylinder(3.7, 0.4, z, 0.075, 0.8, M.steel);
      a.bench(3.7, z + 1.3, 1.8);
      cylinder(3.7, 0.94, z, 0.08, 0.18, M.white);
    }
    a.planter(-5.4, 6.6);
    a.bench(3.8, 6.7, 3);
    label("NUTRITION FROM A PHOTOGRAPH", -3.8, 2.35, 4.66, 4.4, 0.32);
  } else if (id === "retail") {
    a.shopShell("RETAIL INTELLIGENCE · MERCADO", M.brick, mat("#74563d"));
    box(0, 3.5, 5.1, 13.2, 0.18, 1.6, M.steel);
    const stockroom = group("retail-stockroom");
    for (const x of [-4.4, 4.4]) {
      a.solid(x, -1, 2.1, 4.6, 2.4);
      for (const z of [-3, -0.9, 1.2]) {
        for (const side of [-1, 1])
          box(x + side * 0.9, 1.2, z, 0.08, 2.4, 0.7, M.steel, 0, stockroom);
        for (let row = 0; row < 4; row++) {
          box(x, 0.35 + row * 0.55, z, 2, 0.07, 0.8, M.wood, 0, stockroom);
          for (let j = 0; j < 6; j++)
            box(
              x - 0.76 + j * 0.3,
              0.58 + row * 0.55,
              z,
              0.21,
              0.37,
              0.42,
              [mat("#b98654"), mat("#798c76"), mat("#c8bca0")][(j + row) % 3],
              0,
              stockroom,
            );
        }
      }
    }
    // Three bays make the data lifecycle legible as the shop's back-of-house shelving.
    for (let i = 0; i < 3; i++) {
      const x = -3.8 + i * 3.8;
      label(
        ["RAW · RECEIVING", "PROCESSED · CHECKED", "GOLDEN · RELEASED"][i],
        x,
        3.18,
        -4.39,
        3.45,
        0.35,
      );
      box(
        x,
        2.6,
        -4.4,
        3.3,
        0.035,
        0.04,
        [M.steel, mat("#718f93"), mat("#c4a76c")][i],
      );
    }
    const counter = group("release-registry-counter");
    a.wall(0, 0.52, -3.15, 2.7, 1.04, 1.1, M.wood, counter);
    box(0, 1.1, -3.15, 2.9, 0.12, 1.2, M.white, 0, counter);
    box(0.7, 1.5, -3.3, 0.6, 0.55, 0.08, M.dark, 0, counter);
    box(-0.55, 1.2, -3.1, 0.65, 0.06, 0.5, M.white, 0, counter);
    label(
      "REGISTRY · MANIFEST · VALIDATED RELEASE",
      0,
      3.83,
      -4.39,
      10.5,
      0.33,
    );
    label("PROJECT IN PROGRESS", -3.8, 2.7, 4.66, 4.3, 0.32);
    a.planter(-5.3, 6.7);
    a.planter(5.3, 6.7);
    a.bench(3.9, 5.5, 2);
  } else {
    // A civic building forms the back of a public square, with open colonnades.
    const civic = group("civic-courtyard");
    box(0, -0.08, 0, 15.8, 0.14, 15.8, M.stone);
    a.wall(0, 3.15, -5.2, 14.8, 6.3, 3.5, M.stone, civic);
    for (const y of [3.2, 6.25])
      box(0, y, -5.2, 15.2, 0.22, 3.85, M.white, 0, civic);
    for (const x of [-6, -4, -2, 2, 4, 6]) {
      for (const y of [1.75, 4.75]) {
        box(x, y, -3.42, 1.12, 1.7, 0.12, M.steel, 0, civic);
        box(x, y, -3.34, 0.96, 1.53, 0.04, M.glass, 0, civic);
        box(x, y, -3.3, 0.055, 1.6, 0.06, M.white, 0, civic);
        box(x, y - 0.85, -3.26, 1.3, 0.12, 0.38, M.white, 0, civic);
      }
    }
    box(0, 1.45, -3.37, 1.8, 2.9, 0.1, M.wood, 0, civic);
    box(0, 6.85, -3.36, 13, 0.76, 0.15, M.steel, 0, civic);
    for (const x of [-5, 0, 5])
      box(x, 6.48, -3.4, 0.08, 0.5, 0.12, M.steel, 0, civic);
    label("CDMX · PRESUPUESTO PÚBLICO", 0, 6.85, -3.24, 12.8, 0.62);
    label("FOLLOW A PESO · LOCATE THE WORK", 0, 3.7, -3.26, 12, 0.4);
    for (const side of [-1, 1]) {
      for (const z of [-2.2, 0.5, 3.2, 5.9]) {
        cylinder(side * 6.5, 1.7, z, 0.19, 3.4, M.white, civic);
        box(side * 6.5, 0.16, z, 0.65, 0.32, 0.65, M.stone, 0, civic);
        a.solid(side * 6.5, z, 0.65, 0.65, 3.5);
      }
      box(side * 6.5, 3.5, 1.9, 1.6, 0.23, 9, M.stone, 0, civic);
      a.bench(side * 4.7, -1.3, 2.4);
      a.planter(side * 4.7, 5.5, 1.5);
    }
    // Embedded bronze lines lead to three civic notice boards, without a floating diagram.
    const destinations = [
      [-4.6, 2.6, "MOBILITY"],
      [0, -1.5, "PUBLIC WORKS"],
      [4.6, 2.6, "SERVICES"],
    ];
    for (const [x, z, title] of destinations) {
      rod([0, 0.04, 6.5], [x, 0.04, z], 0.025, mat("#b29360", 0, 0.6));
      const board = group(
        `civic-${title.toLowerCase().replaceAll(" ", "-")}`,
        x,
        0,
        z,
      );
      a.wall(x, 1.2, z, 1.7, 1.25, 0.14, M.steel);
      for (const side of [-1, 1])
        box(side * 0.65, 0.35, 0, 0.055, 0.7, 0.12, M.steel, 0, board);
      label(title, x, 1.52, z + 0.09, 1.55, 0.25);
      label("CATEGORIES → WORKS", x, 1.15, z + 0.09, 1.5, 0.17);
      for (let i = 0; i < 3; i++)
        box(
          -0.5 + i * 0.48,
          0.87,
          0.09,
          0.3,
          0.04,
          0.025,
          mat("#b29360"),
          0,
          board,
        );
    }
  }
  return true;
}
