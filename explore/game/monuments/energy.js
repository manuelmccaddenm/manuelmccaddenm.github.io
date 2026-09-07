import { M, mat } from "./kit.js";
export function energy(id, k) {
  const {
    group,
    box,
    sphere,
    cylinder,
    cone,
    rod,
    label,
    flow,
    ring,
    screen,
    chart,
    server,
    building,
    panel,
    tree,
    animated,
  } = k;
  if (id === "batu") {
    building(0, -1, 5, 3, 3.8);
    building(-4, -1, 2.3, 2.6, 2.4);
    building(4, -1, 2.3, 2.6, 2.4);
    for (const x of [-1.4, 1.4]) panel(x, 4.1, -1, 2.4, 1.8);
    label("OPERATIONS", 0, 2, 0.58, 3, 0.5, "#ffca75");
    const hub = ring(0, 0.35, 3, 1.1, "#ffbe61", true);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        x = Math.cos(a) * 4.6,
        z = 2 + Math.sin(a) * 1.9;
      cylinder(x, 0.45, z, 0.23, 0.65, M.steel);
      sphere(x, 0.85, z, 0.15, 0.15, 0.15, M.orange);
      flow(
        [
          [x, 0.85, z],
          [x * 0.5, 1.2, 2],
          [0, 0.6, 2],
        ],
        "#ffbe61",
      );
    }
    label("SITE METERS → SHARED ENERGY DATA", 0, 5.5, -1.5, 10, 0.55);
    tree(-5, 3);
    tree(5, 3);
  } else if (id === "cfe-bills") {
    box(0, 1.1, 0, 10, 0.3, 2.2, M.steel);
    for (const x of [-4.3, 4.3])
      for (const z of [-0.8, 0.8]) box(x, 0.55, z, 0.15, 1.1, 0.15, M.steel);
    for (let x = -4.8; x <= 4.8; x += 0.35)
      box(x, 1.28, 0, 0.08, 0.08, 1.85, M.glass);
    // Document sheets visibly advance through the parser arch.
    const sheet = group("bill-on-conveyor", -4, 1.43, 0);
    box(0, 0, 0, 1.2, 0.07, 1.55, M.white, 0, sheet);
    for (let i = 0; i < 5; i++)
      box(-0.08, 0.045, -0.5 + i * 0.22, 0.82, 0.01, 0.035, M.steel, 0, sheet);
    animated.push((t) => (sheet.position.x = -4 + ((t * 0.65) % 8)));
    for (const x of [-0.9, 0.9]) box(x, 2.3, 0, 0.18, 2.1, 2, M.steel);
    box(0, 3.35, 0, 2, 0.25, 2, M.steel);
    label("PARSE", 0, 3.33, 1.04, 1.8, 0.4);
    screen(2.8, 3, -1.9, 3.4, 2.7, "NORMALIZED LINE ITEMS");
    for (let i = 0; i < 5; i++) {
      box(2.8, 2.1 + i * 0.37, -1.7, 3, 0.025, 0.025, M.glass);
      label(
        [
          "DATE  |  CONTRACT",
          "TARIFF  |  PERIOD",
          "CONCEPT  |  kWh",
          "RATE  |  AMOUNT",
          "TYPED RECORD",
        ][i],
        2.8,
        2.25 + i * 0.37,
        -1.65,
        2.8,
        0.25,
      );
    }
    server(-3.6, -2.6, "PUBLIC API", 3.2);
    label("COLLECTION", -3.3, 1.7, 1.45, 3, 0.35);
    label("IDEMPOTENT JOBS", -3.6, 4, -2, 3, 0.35);
    flow(
      [
        [4.3, 1.5, 0],
        [5, 2.3, -2],
        [-3.6, 3.6, -2],
      ],
      "#ffbe61",
    );
  } else if (id === "building-monitors") {
    // Exposed slabs and rooms create a cutaway, rather than another opaque cuboid.
    const b = group("metered-building-cutaway", -2.9, 0, 0);
    for (let floor = 0; floor < 4; floor++) {
      box(0, 0.35 + floor * 1.15, 0, 4, 0.15, 3, M.stone, 0, b);
      for (const x of [-1.85, 1.85])
        for (const z of [-1.3, 1.3])
          box(x, 0.9 + floor * 1.15, z, 0.16, 1.1, 0.16, M.steel, 0, b);
      box(-0.8, 0.55 + floor * 1.15, 0.3, 1, 0.32, 0.7, M.wood, 0, b);
      box(1, 0.95 + floor * 1.15, 1.5, 0.6, 0.65, 0.12, M.dark, 0, b);
      sphere(
        1,
        1.05 + floor * 1.15,
        1.59,
        0.09,
        0.09,
        0.02,
        floor === 2 ? M.red : M.blue,
        b,
      );
    }
    chart(2.9, 3.1, -0.8, 4.3, 3.6, [
      [(t) => 0.4 * Math.sin(t * 8), "#72caff"],
      [
        (t) =>
          0.4 * Math.sin(t * 8) +
          (t > 0.6 && t < 0.75 ? 0.55 : 0.04 * Math.sin(t * 40)),
        "#ffb765",
      ],
    ]);
    label("EXPECTED / OBSERVED", 2.9, 5.1, -0.7, 4.4, 0.45);
    label("RESIDUAL → EXPLAINABLE ALERT", 1, 1, 2.5, 8, 0.5);
    flow(
      [
        [-1.9, 3.25, 1.6],
        [0, 3.4, 1.7],
        [1, 3.4, -0.6],
      ],
      "#ffb765",
    );
    sphere(-4.6, 5.3, 0, 0.55, 0.55, 0.55, M.orange);
    label("WEATHER", -4.5, 6, 0, 2, 0.35);
  } else if (id === "solar-pipelines") {
    for (const x of [-4.5, -2, 0.5])
      for (const z of [-1.2, 1.2]) panel(x, 1.5, z, 2, 1.65);
    for (const x of [-4.5, -2, 0.5]) box(x, 0.65, -3, 0.65, 1.2, 0.6, M.white);
    server(4, -2, "CURATED DATA", 3.8);
    screen(1.7, 4.7, -2.6, 5, 1.8, "ORCHESTRATION");
    for (let i = 0; i < 4; i++) {
      box(
        -0.15 + i * 1.2,
        4.45,
        -2.43,
        0.7,
        0.5,
        0.1,
        i === 1 ? M.orange : M.blue,
      );
      if (i < 3)
        rod(
          [0.2 + i * 1.2, 4.45, -2.3],
          [0.7 + i * 1.2, 4.45, -2.3],
          0.025,
          M.white,
        );
    }
    for (const x of [-4, -2, 0])
      flow(
        [
          [x, 1.4, -2.7],
          [x, 2.3, -3.2],
          [2.3, 2.3, -3.2],
          [4, 3.7, -1.4],
        ],
        "#ffc879",
      );
    label("INVERTERS", -2, 2.8, -2.6, 4, 0.4);
    label("QUEUE → VALIDATE → PUBLISH", 0, 0.65, 3.1, 9, 0.5);
    sphere(-4, 5.2, -2.8, 0.65, 0.65, 0.65, M.orange);
  } else if (id === "inverter-anomalies") {
    panel(-3.7, 1.5, 1, 3.4, 2.1);
    panel(-3.7, 1.5, -1.6, 3.4, 2.1);
    for (const x of [1.5, 3.7]) {
      box(x, 1.65, 0.8, 1.55, 2.8, 1.2, M.white);
      screen(x, 2.05, 1.43, 1.1, 1.05, "INVERTER");
      sphere(x, 1.1, 1.45, 0.12, 0.12, 0.05, x > 3 ? M.red : M.blue);
      for (let y = 0.5; y < 1; y += 0.1)
        box(x, y, 1.44, 0.8, 0.035, 0.03, M.steel);
    }
    chart(0.5, 4.9, -2.4, 8.7, 2, [
      [(t) => Math.sin(t * Math.PI) * 0.8 - 0.3, "#72caff"],
      [
        (t) =>
          Math.sin(t * Math.PI) * 0.8 - 0.3 - (t > 0.65 && t < 0.75 ? 0.65 : 0),
        "#ffb765",
      ],
    ]);
    label("SEASONAL BASELINE / RESIDUAL EVENT", 0.5, 6.2, -2.3, 9, 0.45);
    flow(
      [
        [-2.5, 1.6, 0],
        [-0.6, 1.2, 0],
        [1.5, 1.2, 0.7],
      ],
      "#72caff",
    );
    label("WEATHER ≠ EQUIPMENT FAILURE", 0, 0.8, 3.2, 9, 0.5);
  } else if (id === "critical-hours") {
    box(-3.7, 0.2, 0, 3.4, 0.2, 5, M.glass);
    box(-3.7, 1.3, 0, 3.6, 2.3, 0.65, M.stone);
    for (const x of [-4.8, -3.7, -2.6])
      box(x, 0.8, 0.4, 0.35, 1.2, 0.05, M.blue);
    for (const x of [-0.4, 2.4]) {
      for (const s of [-1, 1])
        rod([x + s * 0.7, 0.2, 0], [x + s * 0.16, 4, 0], 0.06, M.steel);
      for (const y of [1, 2, 3, 3.8])
        rod([x - 0.7, y, 0], [x + 0.7, y, 0], 0.045, M.steel);
      for (const z of [-0.55, 0.55])
        rod([x - 0.8, 3.7, z], [x + 0.8, 3.7, z], 0.04, M.steel);
    }
    for (const z of [-0.55, 0.55])
      flow(
        [
          [-0.9, 3.7, z],
          [1, 3.35, z],
          [3, 3.7, z],
        ],
        "#ffb765",
      );
    building(4.4, 1.5, 1.5, 1.5, 2.5);
    building(2.4, 2.4, 1.4, 1.2, 1.7);
    screen(2.4, 4.1, -2.7, 5.5, 4.4, "100 CRITICAL HOURS");
    for (let i = 0; i < 100; i++)
      box(
        0.25 + (i % 10) * 0.48,
        2.55 + Math.floor(i / 10) * 0.3,
        -2.57,
        0.35,
        0.2,
        0.04,
        i < 64 ? M.orange : M.steel,
      );
    label("2024: 64 / 100 RECOVERED", 2.4, 6.6, -2.55, 5.8, 0.45);
    label("DAM → GRID → DEMAND", -1, 0.8, 3.8, 8, 0.5);
  } else if (id === "air-quality") {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i * Math.PI) / 8;
      cone(
        Math.cos(a) * 5.5,
        1.4,
        -0.5 + Math.sin(a) * 4.1,
        1.65,
        2.9,
        mat(i % 2 ? "#758477" : "#8d8d7c"),
      );
    }
    for (let i = 0; i < 6; i++)
      building(
        -3.6 + i * 1.4,
        -0.3 + (i % 2) * 1.5,
        0.9,
        1.1,
        0.9 + (i % 3) * 0.4,
      );
    box(0, 0.14, 2.7, 10, 0.09, 0.9, M.dark);
    for (let i = 0; i < 6; i++) {
      box(-4 + i * 1.55, 0.4, 2.7, 0.85, 0.35, 0.42, i % 2 ? M.orange : M.blue);
      sphere(-4 + i * 1.55, 0.7, 2.7, 0.24, 0.16, 0.19, M.glass);
    }
    cylinder(4.8, 1.2, -0.7, 0.35, 2.4, M.brick);
    sphere(4.8, 2.8, -0.7, 0.55, 0.8, 0.55, mat("#a8a99e", 0, 0, 0.35));
    const haze = group("trapped-basin-haze", 0, 3, 0);
    sphere(0, 0, 0, 4.8, 0.75, 2.6, mat("#acaca4", 0, 0, 0.18), haze);
    animated.push((t) => (haze.position.y = 3 + Math.sin(t * 0.25) * 0.1));
    label("POLITICAL HORIZON: 3–6 YEARS", 0, 5.75, -2, 8, 0.5);
    label("STRUCTURAL CHANGE: 10–15 YEARS", 0, 5.1, -2, 9, 0.5);
    label("EMISSIONS + BASIN + INCENTIVES", 0, 0.8, 4, 9, 0.5);
  } else return false;
  return true;
}
