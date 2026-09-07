import * as T from "three";
import { M, mat } from "./kit.js";
export function science(id, k) {
  const {
    root,
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
    building,
    tree,
    person,
    animated,
  } = k;
  if (id === "itam") {
    building(-4, -1, 3, 4, 4.3);
    building(4, -1, 3, 4, 4.3);
    building(0, -3.5, 5, 1.8, 4.3);
    for (const x of [-5, -3, 3, 5]) {
      cylinder(x, 1.5, 1.1, 0.16, 3, M.white);
      box(x, 3.1, 1.1, 1.4, 0.2, 0.8, M.white);
    }
    cylinder(0, 0.3, 0.8, 2.2, 0.35, M.stone);
    const orbit = group("mathematical-courtyard-sculpture", 0, 2.3, 0.8);
    for (let i = 0; i < 3; i++) {
      const r = ring(
        0,
        0,
        0,
        1.45,
        ["#72caff", "#ffbe70", "#74d2b3"][i],
        false,
        orbit,
      );
      r.rotation.set(i * 0.7, i * 0.9, 0);
    }
    animated.push((t) => (orbit.rotation.y = t * 0.16));
    for (const x of [-5, 5]) tree(x, 3.5, 0.8);
    label(
      "ENERGY · STATISTICS · ML · MATH · DATA · PRODUCTS",
      0,
      0.6,
      4.6,
      12,
      0.5,
    );
  } else if (id === "spacetime-bayes") {
    const tiles = group("32-state-spatial-tiles", -3.1, 0.4, 0.5);
    for (let i = 0; i < 32; i++) {
      const h = 0.25 + (i % 5) * 0.16;
      box(
        ((i % 4) - 1.5) * 0.9,
        h / 2,
        Math.floor(i / 4) * 0.55 - 2,
        0.78,
        h,
        0.45,
        mat(["#497ba3", "#76b7c7", "#c8c491", "#ab8fbd"][i % 4]),
        0,
        tiles,
      );
    }
    label("32 STATES · SCHEMATIC", -3, 3.2, 1.8, 5, 0.45);
    for (let i = 0; i < 5; i++) {
      box(
        2.4,
        0.55 + i * 0.72,
        0,
        3.4,
        0.09,
        3.5,
        mat("#72b8d0", 0, 0.3, 0.35),
      );
      for (let j = 0; j < 6; j++)
        sphere(
          1.2 + (j % 3) * 1.1,
          0.7 + i * 0.72,
          -1 + (j % 2) * 1.8,
          0.12,
          0.12,
          0.12,
          i % 2 ? M.orange : M.blue,
        );
    }
    label("TIME LAYERS · 2003–2024", 2.6, 4.9, 0.8, 5.5, 0.45);
    flow(
      [
        [-1, 1, 0],
        [0, 2, 0],
        [2.4, 4, 0],
      ],
      "#af98ff",
    );
    screen(0, 5.4, -2.8, 8.5, 1.6, "SPACE × TIME INTERACTION");
    for (let i = 0; i < 22; i++)
      for (let j = 0; j < 3; j++)
        box(
          -3.7 + i * 0.35,
          5.2 + j * 0.22,
          -2.68,
          0.27,
          0.15,
          0.03,
          j === i % 3 ? M.orange : M.blue,
        );
  } else if (id === "markov-chains") {
    const states = [
        [-4, -1],
        [0, -2.2],
        [4, -1],
        [0, 2],
      ],
      names = ["OPERATING", "WARNING", "FAILED", "REPAIR"];
    states.forEach(([x, z], i) => {
      cylinder(x, 0.4, z, 1, 0.25, [M.green, M.orange, M.red, M.blue][i]);
      label(names[i], x, 1.1, z + 0.7, 2.6, 0.38);
      const next = states[(i + 1) % 4];
      flow(
        [
          [x, 0.58, z],
          [(x + next[0]) / 2, 0.65, (z + next[1]) / 2],
          [next[0], 0.58, next[1]],
        ],
        "#72caff",
      );
    });
    const truck = group("delivery-truck", -4, 0.75, -1);
    box(0, 0.5, 0, 1.5, 0.9, 0.85, M.white, 0, truck);
    box(0.95, 0.4, 0, 0.6, 0.7, 0.85, M.orange, 0, truck);
    box(1.12, 0.65, 0.44, 0.3, 0.3, 0.035, M.glass, 0, truck);
    for (const x of [-0.5, 0.8])
      for (const z of [-0.48, 0.48])
        sphere(x, 0.05, z, 0.2, 0.2, 0.12, M.dark, truck);
    animated.push((t) => {
      const p = (t * 0.17) % 4,
        i = Math.floor(p),
        f = p - i,
        a = states[i],
        b = states[(i + 1) % 4];
      truck.position.set(
        a[0] + (b[0] - a[0]) * f,
        0.75,
        a[1] + (b[1] - a[1]) * f,
      );
      truck.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    });
    screen(0, 5.25, -3, 10, 1.9, "STOCHASTIC EPIDEMIC · SEIR");
    ["S", "E", "I", "R"].forEach((s, i) => {
      label(
        s,
        -3.6 + i * 2.4,
        5.2,
        -2.8,
        1,
        0.65,
        ["#72caff", "#ffb765", "#ef756f", "#6ed1b1"][i],
      );
      if (i < 3)
        rod(
          [-2.9 + i * 2.4, 5.2, -2.8],
          [-1.9 + i * 2.4, 5.2, -2.8],
          0.035,
          M.white,
        );
    });
    label("LOCAL RATES → RANDOM TRANSITION TIMES", 0, 0.7, 4.5, 11, 0.5);
  } else if (id === "negreira") {
    box(0, 0.3, 0, 11, 0.22, 6, M.green);
    for (const z of [-2.8, 2.8]) box(0, 0.43, z, 10.7, 0.025, 0.04, M.white);
    for (const x of [-5.3, 0, 5.3]) box(x, 0.43, 0, 0.04, 0.025, 5.6, M.white);
    ring(0, 0.45, 0, 1.1, "#eee6d4", true);
    for (const side of [-1, 1]) {
      const x = side * 5.3;
      for (const z of [-1, 1]) rod([x, 0.45, z], [x, 1.65, z], 0.045, M.white);
      rod([x, 1.65, -1], [x, 1.65, 1], 0.045, M.white);
      for (let z = -1; z <= 1; z += 0.2)
        rod(
          [x + side * 0.55, 0.45, z],
          [x + side * 0.55, 1.6, z],
          0.015,
          M.white,
        );
      for (let y = 0.5; y < 1.6; y += 0.2)
        rod([x + side * 0.55, y, -1], [x + side * 0.55, y, 1], 0.015, M.white);
    }
    for (let tier = 0; tier < 3; tier++) {
      box(0, 0.65 + tier * 0.35, -3.1 - tier * 0.35, 11.4, 0.3, 0.34, M.stone);
      for (let x = -5; x <= 5; x += 0.5)
        box(
          x,
          0.89 + tier * 0.35,
          -3.1 - tier * 0.35,
          0.35,
          0.18,
          0.2,
          x % 1 === 0 ? mat("#b65d62") : mat("#4b70b0"),
        );
    }
    for (let i = 0; i < 6; i++)
      person(
        -3 + i * 1.1,
        -0.6 + (i % 2) * 1.5,
        i % 2 ? "#b74346" : "#446da0",
        0.5,
      );
    const ball = group("soccer-ball", 0.6, 0.85, 0.9);
    sphere(0, 0, 0, 0.3, 0.3, 0.3, M.white, ball);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      sphere(
        Math.cos(a) * 0.26,
        0.05,
        Math.sin(a) * 0.26,
        0.1,
        0.12,
        0.1,
        M.dark,
        ball,
      );
    }
    animated.push((t) => (ball.rotation.y = t * 0.6));
    label("LA LIGA · TREATED", -2.9, 5.5, -2.7, 5.5, 0.6, "#ffbd72");
    label("CHAMPIONS LEAGUE · PLACEBO", 2.9, 5.5, -2.7, 5.5, 0.6, "#72caff");
    chart(-2.9, 4.2, -2.7, 5.4, 1.7, [
      [(t) => t * 0.4 - 0.2, "#72caff"],
      [(t) => t * 0.4 - 0.2 + (t > 0.5 ? 0.25 : 0), "#ffb765"],
    ]);
    chart(2.9, 4.2, -2.7, 5.4, 1.7, [
      [(t) => t * 0.4 - 0.2, "#72caff"],
      [(t) => t * 0.4 - 0.18, "#ffb765"],
    ]);
    label("ILLUSTRATIVE DESIGN · NOT A VERDICT", 0, 0.8, 3.7, 11, 0.5);
  } else if (id === "probability") {
    box(-2.7, 1.4, 0, 4, 0.2, 3, M.wood);
    for (const x of [-4.3, -1.1])
      for (const z of [-1.2, 1.2]) box(x, 0.7, z, 0.15, 1.4, 0.15, M.steel);
    cylinder(-2.7, 1.56, 0, 0.65, 0.09, M.orange);
    const cloth = group("partly-covered-coin", -2.1, 1.7, 0);
    sphere(0, 0, 0, 1.4, 0.2, 1.4, mat("#8883bb"), cloth);
    label("HIDDEN OUTCOME", -2.7, 1.4, 1.53, 1.9, 0.18);
    cylinder(2.4, 1.5, 0, 0.11, 2.8, M.steel);
    rod([0.5, 3, 0], [4.3, 3, 0], 0.07, M.orange);
    for (const x of [0.9, 3.9]) {
      rod([x, 3, 0], [x, 1.8, 0], 0.025, M.steel);
      cylinder(x, 1.7, 0, 0.8, 0.1, M.orange);
    }
    for (let i = 0; i < 3; i++)
      sphere(0.5 + i * 0.35, 1.9, 0, 0.15, 0.15, 0.15, M.blue);
    box(3.9, 1.9, 0, 0.9, 0.3, 0.7, M.white);
    label("EVIDENCE", 2.4, 2.55, 0.13, 1.5, 0.2);
    box(0, 1.55, -2, 0.14, 3.1, 0.14, M.steel);
    box(0, 0.13, -2, 0.7, 0.2, 0.7, M.steel);
    const gauge = new T.Mesh(
      new T.CylinderGeometry(0.88, 0.88, 0.16, 64),
      M.steel,
    );
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 3.55, -2);
    gauge.castShadow = gauge.receiveShadow = true;
    root.add(gauge);
    ring(0, 3.55, -1.9, 0.81, "#a9996d");
    label("50%", 0, 3.55, -1.9, 1, 0.35);
    box(0, 0.42, 3.8, 4.2, 0.4, 0.17, M.stone);
    label("UNCERTAINTY IS IN WHAT WE KNOW", 0, 0.43, 3.9, 4, 0.22);
  } else if (id === "lp-solver") {
    const vertices = [
      [-3.8, 0.5, 0],
      [-1.2, 0.5, 2.3],
      [1.3, 0.5, 1],
      [0.2, 0.5, -2.2],
      [-2.8, 0.5, -2.3],
    ];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i],
        b = vertices[(i + 1) % vertices.length];
      rod(a, b, 0.05, M.blue);
      rod([a[0], 4, a[2]], [b[0], 4, b[2]], 0.035, M.blue);
      rod(a, [a[0], 4, a[2]], 0.025, M.glass);
    }
    const shape = new T.Shape(vertices.map((a) => new T.Vector2(a[0], a[2])));
    const face = new T.Mesh(
      new T.ShapeGeometry(shape),
      mat("#7fd6d1", 0, 0.2, 0.22),
    );
    face.rotation.x = Math.PI / 2;
    face.position.y = 0.55;
    root.add(face);
    flow(
      [
        [-1.6, 0.8, -0.5],
        [-1.4, 1.2, 0.2],
        [-1, 1.7, 0.9],
        [0.1, 2.3, 1.2],
        [1.15, 3.6, 1],
      ],
      "#ffb765",
    );
    sphere(1.3, 3.9, 1, 0.23, 0.23, 0.23, M.orange);
    label("CENTRAL PATH", -1.6, 4.7, 1, 5, 0.5);
    screen(4, 2.6, -0.2, 3.3, 4.3, "LP CLASSIFIER");
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1;
      sphere(
        4 + side * (0.4 + (i % 3) * 0.24),
        1.3 + (i % 9) * 0.3,
        -0.05,
        0.09,
        0.09,
        0.06,
        side > 0 ? M.red : M.blue,
      );
    }
    rod([3.8, 1, -0.02], [4.2, 4, -0.02], 0.03, M.orange);
    label("FEASIBLE INTERIOR → OPTIMAL VERTEX", 0, 0.8, 4, 11, 0.5);
  } else if (id === "parallel-dbscan") {
    const cloud = group("partitioned-point-clouds", 0, 0.6, 0);
    for (let i = 0; i < 3; i++) {
      box(
        -3.6 + i * 3.6,
        -0.25,
        0,
        3.5,
        0.15,
        5.2,
        [mat("#264a62"), mat("#4d4564"), mat("#565a35")][i],
        0,
        cloud,
      );
      for (let j = 0; j < 32; j++) {
        const a = j * 2.4,
          r = 0.3 + (j % 7) * 0.19;
        sphere(
          -3.6 + i * 3.6 + Math.cos(a) * r,
          0.2 + (j % 5) * 0.2,
          Math.sin(a) * r,
          0.13,
          0.13,
          0.13,
          [M.blue, mat("#b5a0ff", 0.3), M.orange][i],
          cloud,
        );
      }
    }
    for (const x of [-1.8, 1.8])
      box(x, 0.71, 0, 0.55, 0.03, 5.4, mat("#bce9c9", 0, 0, 0.5));
    const neighborhood = ring(1.6, 1.05, 0.3, 1.2, "#fff0b5", true);
    animated.push((t) => (neighborhood.position.z = Math.sin(t * 0.5) * 0.5));
    flow(
      [
        [0.4, 1.2, 0],
        [1.8, 1.2, 0.3],
        [3, 1.2, 0.5],
      ],
      "#fff0b5",
    );
    label("WORKER 1", -3.6, 3, -1.4, 3, 0.45);
    label("WORKER 2", 0, 3, -1.4, 3, 0.45);
    label("WORKER 3", 3.6, 3, -1.4, 3, 0.45);
    label("SHARED STRIPS KEEP ε-NEIGHBORHOODS WHOLE", 0, 5, -2, 11, 0.6);
    label("BOUNDARY CORRECTNESS → PARALLEL SPEED", 0, 0.75, 3.7, 11, 0.45);
  } else return false;
  return true;
}
