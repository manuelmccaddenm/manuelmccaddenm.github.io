import * as T from "three";
import { M, mat } from "./kit.js";
export function products(id, k) {
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
    building,
    tree,
    person,
    animated,
  } = k;
  if (id === "mantis") {
    const insect = group("mantis-sculpture", 0, 0, 0);
    sphere(0, 2.2, -0.7, 0.6, 0.85, 1.45, mat("#69a774", 0, 0.4), insect);
    rod([0, 2.7, 0.3], [0, 4, 0.9], 0.22, mat("#75b789", 0, 0.4), insect);
    sphere(0, 4.25, 1, 0.8, 0.38, 0.4, mat("#8dc789", 0, 0.3), insect);
    for (const s of [-1, 1]) {
      sphere(
        s * 0.65,
        4.35,
        1.2,
        0.25,
        0.25,
        0.23,
        mat("#c9d89a", 0, 0.45),
        insect,
      );
      sphere(s * 0.65, 4.35, 1.4, 0.08, 0.1, 0.04, M.dark, insect);
      rod([s * 0.3, 4.45, 1], [s * 0.8, 5.3, 1.3], 0.025, M.steel, insect);
      rod([s * 0.2, 3.5, 0.9], [s * 1.4, 2.9, 1.5], 0.12, M.green, insect);
      rod([s * 1.4, 2.9, 1.5], [s * 0.7, 3.9, 2], 0.1, M.green, insect);
      for (let i = 0; i < 2; i++) {
        rod(
          [s * 0.35, 2.3, -i],
          [s * (2 + i * 0.7), 1.4, -0.7 - i * 0.8],
          0.12,
          M.green,
          insect,
        );
        rod(
          [s * (2 + i * 0.7), 1.4, -0.7 - i * 0.8],
          [s * (2.7 + i * 0.7), 0.3, -0.2 - i * 1.3],
          0.075,
          M.steel,
          insect,
        );
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        x = Math.cos(a) * 4.5,
        z = Math.sin(a) * 3.4;
      cylinder(x, 0.4, z, 0.5, 0.25, M.stone);
      sphere(
        x,
        0.8,
        z,
        0.23,
        0.23,
        0.23,
        [M.blue, M.orange, mat("#c1a2e8")][i % 3],
      );
      flow(
        [
          [x, 0.8, z],
          [x * 0.5, 1.1, z * 0.5],
          [0, 1.3, 0],
        ],
        "#b3a0ff",
      );
    }
    label("ENTITIES · RELATIONSHIPS · EVENTS", 0, 6, -2.6, 10, 0.55);
    label("ONE REPRESENTATION · MANY APPLICATIONS", 0, 0.75, 4.4, 11, 0.5);
  } else if (id === "retail") {
    const shop = group("retail-storefront", -3, 0, -0.8);
    box(0, 2.1, -0.7, 4.4, 4, 1.8, M.brick, 0, shop);
    box(0, 2, 0.25, 3.7, 2.6, 0.06, M.glass, 0, shop);
    box(0, 3.55, 0.7, 4.8, 0.22, 1.3, M.white, 0, shop);
    for (let i = 0; i < 8; i++)
      box(
        -2 + i * 0.55,
        3.38,
        0.9,
        0.35,
        0.14,
        0.7,
        i % 2 ? M.white : M.orange,
        0,
        shop,
      );
    label("RETAIL", -3, 4.05, 0.2, 3, 0.55);
    for (let shelf = 0; shelf < 3; shelf++) {
      box(2.3, 0.6 + shelf * 0.9, -1.5, 4.5, 0.1, 1.2, M.wood);
      for (let j = 0; j < 6; j++)
        box(
          0.5 + j * 0.7,
          0.9 + shelf * 0.9,
          -1.5,
          0.42,
          0.5,
          0.55,
          [M.blue, M.orange, M.green][(j + shelf) % 3],
        );
    }
    for (let i = 0; i < 3; i++) {
      const x = -3.5 + i * 3.5;
      for (const side of [-1, 1])
        box(x + side * 1.25, 1.35, 2.7, 0.16, 2.5, 0.3, M.steel);
      box(x, 2.7, 2.7, 2.65, 0.2, 0.3, [M.steel, M.blue, M.orange][i]);
      label(["RAW", "PROCESSED", "GOLDEN"][i], x, 2.68, 2.9, 2.5, 0.4);
      box(x, 0.5, 2.7, 1.5, 0.65, 1.1, [M.steel, M.blue, M.orange][i]);
    }
    flow(
      [
        [-3.5, 1.4, 2.7],
        [0, 1.4, 2.7],
        [3.5, 1.4, 2.7],
      ],
      "#b9a0f3",
    );
    label("REGISTRY + MANIFEST → VALIDATED RELEASE", 1, 5, -2, 10, 0.55);
    label("CONCEPTUAL MACHINERY · IN PROGRESS", 0, 0.65, 4.3, 11, 0.45);
  } else if (id === "glass") {
    const phone = group("local-first-finance-phone", -2.6, 0, 0);
    box(0, 2.7, 0, 3.2, 5.3, 0.5, M.steel, 0, phone);
    box(0, 2.7, 0.28, 2.85, 4.75, 0.05, M.dark, 0, phone);
    box(0, 4.83, 0.32, 0.75, 0.1, 0.035, M.steel, 0, phone);
    for (let i = 0; i < 3; i++) {
      box(
        0,
        3.9 - i * 0.85,
        0.35,
        2.4,
        0.6,
        0.04,
        [M.blue, M.orange, mat("#bba4ea")][i],
        0,
        phone,
      );
      label(
        ["BANK ACCOUNTS", "RECURRING LEAKS", "SHARED EXPENSES"][i],
        -2.6,
        3.9 - i * 0.85,
        0.42,
        2.3,
        0.3,
      );
    }
    const lock = ring(-2.6, 1.1, 0.5, 0.32, "#eee6d4");
    box(-2.6, 0.8, 0.56, 0.9, 0.7, 0.16, M.orange);
    label("ON YOUR DEVICE", -2.6, 5.9, 0.25, 4.4, 0.45);
    cylinder(3, 1.2, 1, 1.6, 0.18, M.wood);
    cylinder(3, 0.6, 1, 0.13, 1.2, M.steel);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      person(
        3 + Math.cos(a) * 2,
        1 + Math.sin(a) * 2,
        ["#72caff", "#ffb765", "#bca0e7"][i],
        0.85,
      );
      flow(
        [
          [3, 1.4, 1],
          [3 + Math.cos(a) * 1.2, 1.4, 1 + Math.sin(a) * 1.2],
        ],
        "#bca0e7",
      );
    }
    cylinder(3, 1.4, 1, 0.45, 0.12, M.orange);
    label("SPLIT TOGETHER", 3, 3.6, 1, 4.5, 0.5);
    label("CREDENTIALS STAY LOCAL", 0, 0.7, 4, 10, 0.5);
  } else if (id === "cdmx-budget") {
    const civic = group("civic-budget-palace", 0, 0, -2);
    box(0, 1.8, 0, 8, 3.3, 2.5, M.stone, 0, civic);
    box(0, 3.65, 0, 8.4, 0.25, 2.8, M.white, 0, civic);
    for (let x = -3.3; x <= 3.3; x += 1.1) {
      cylinder(x, 1.65, 1.35, 0.16, 2.7, M.white, civic);
      box(x, 2.3, 1.3, 0.55, 0.75, 0.1, M.dark, 0, civic);
    }
    label("PUBLIC BUDGET", 0, 4.35, -0.7, 7, 0.65);
    cylinder(0, 0.65, 1.1, 1.2, 0.2, M.orange);
    label("$", 0, 1.25, 1.15, 1, 0.75, "#ffbf70");
    const branches = [
      [-4.4, 3.2, "MOBILITY"],
      [0, 4, "PUBLIC WORKS"],
      [4.4, 3.2, "SERVICES"],
    ];
    branches.forEach(([x, z, title], i) => {
      flow(
        [
          [0, 0.85, 1.1],
          [x * 0.45, 0.9, 2.3],
          [x, 0.85, z],
        ],
        "#bca0ee",
      );
      cylinder(x, 0.5, z, 0.8, 0.35, [M.blue, M.orange, M.green][i]);
      cone(x, 1.55, z, 0.35, 0.8, [M.blue, M.orange, M.green][i]);
      sphere(x, 1.98, z, 0.35, 0.35, 0.35, [M.blue, M.orange, M.green][i]);
      label(title, x, 2.7, z, 3.7, 0.42);
    });
    screen(-4.8, 3, -2, 2.1, 2.5, "ASK THE DATA");
    label("TOOLS + CROSSWALK", -4.8, 4.6, -1.85, 3.5, 0.4);
    label("FOLLOW A PESO · LOCATE THE WORK", 0, 5.4, -2.4, 10, 0.55);
  } else return false;
  return true;
}
