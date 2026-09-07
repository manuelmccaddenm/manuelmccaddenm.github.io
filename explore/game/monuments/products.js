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
  } else return false;
  return true;
}
