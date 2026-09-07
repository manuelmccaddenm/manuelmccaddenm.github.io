import * as T from "three";
import { M, mat } from "./kit.js";
export function modelWorkshop(k) {
  const { root, group, box, cylinder, sphere, rod, label, tree } = k;
  const brick = M.brick,
    trim = mat("#a8a59a", 0, 0.3),
    timber = M.wood;
  const glass = mat("#a8c0b8", 0, 0.3, 0.12);
  const walls = group("workshop-shell"),
    roof = group("workshop-roof");
  root.userData.solidFootprints = [];
  function solid(x, z, w, d, height = 5.4) {
    root.userData.solidFootprints.push({ x, z, w, d, height });
  }
  box(0, -0.08, 0, 13.4, 0.14, 9.3, M.stone);
  box(0, 2.7, -4.2, 13, 5.4, 0.32, brick, 0, walls);
  solid(0, -4.2, 13, 0.32);
  for (const side of [-1, 1]) {
    box(side * 6.4, 2.7, 0, 0.32, 5.4, 8.5, brick, 0, walls);
    solid(side * 6.4, 0, 0.32, 8.5);
    box(side * 3.9, 0.38, 4.1, 5.2, 0.72, 0.28, brick, 0, walls);
    solid(side * 3.9, 4.1, 5.2, 0.28);
    box(side * 3.9, 2.55, 4.1, 4.95, 3.4, 0.035, glass, 0, walls);
    for (const x of [side * 1.4, side * 3.9, side * 6.3]) {
      box(x, 2.5, 4.1, 0.12, 5, 0.18, M.steel, 0, walls);
      solid(x, 4.1, 0.15, 0.25);
    }
    box(side * 3.9, 4.25, 4.1, 5.15, 0.09, 0.18, M.steel, 0, walls);
    // Recessed door jambs and a continuous street canopy.
    box(side * 1.3, 1.7, 3.95, 0.1, 3.4, 0.65, trim, 0, walls);
  }
  box(0, 4.95, 4.12, 13.15, 0.85, 0.38, brick, 0, walls);
  box(0, 4.48, 4.62, 13.5, 0.16, 1.3, M.steel, 0, walls);
  label(
    "MODEL PICKER · RESEARCH WORKSHOP",
    0,
    4.97,
    4.34,
    11.8,
    0.5,
    "#efe5cb",
  );
  label("DATA", -3.9, 3.9, 4.24, 2.2, 0.32);
  label("MODELS", 0, 3.9, 4.24, 2.2, 0.32);
  label("EVALUATION", 3.9, 3.9, 4.24, 2.2, 0.32);
  // Roof and skylight panels lift away in the inspection view.
  box(0, 5.48, -0.1, 13.6, 0.22, 9, trim, 0, roof);
  for (const x of [-4, 0, 4])
    box(x, 5.64, -0.5, 2.7, 0.12, 4.6, M.glass, 0, roof);
  for (const x of [-5.5, 5.5])
    box(x, 5.85, -2.9, 1.1, 0.55, 1.25, M.steel, 0, roof);
  for (let i = 0; i < 3; i++) {
    const x = -4.2 + i * 4.2,
      desk = group(`workstation-${i}`, x, 0, -1.8);
    box(0, 0.79, 0, 3.25, 0.12, 1.5, timber, 0, desk);
    solid(x, -1.8, 3.25, 1.5, 1.1);
    for (const leg of [-1.4, 1.4])
      box(leg, 0.4, 0, 0.09, 0.8, 1.15, M.steel, 0, desk);
    box(0, 1.48, -0.35, 1.5, 0.88, 0.1, M.steel, 0, desk);
    box(0, 1.06, -0.35, 0.09, 0.35, 0.12, M.steel, 0, desk);
    box(0, 0.92, 0.28, 1, 0.055, 0.32, M.dark, 0, desk);
    const screenMaterial = mat(["#77b7c7", "#cea56c", "#ae9bbd"][i], 0.25);
    const display = new T.Mesh(
      new T.PlaneGeometry(1.32, 0.68),
      screenMaterial.clone(),
    );
    display.position.set(0, 1.49, -0.285);
    desk.add(display);
    label(
      ["01 DATA AGENT", "02 MODEL AGENT", "03 EVAL AGENT"][i],
      x,
      2.45,
      -2.05,
      3.6,
      0.37,
    );
    // Task lighting, office chair and pinboards make these real working bays.
    rod([x + 1.2, 0.86, -1.8], [x + 1.2, 1.75, -1.8], 0.035, M.steel);
    box(1.03, 1.74, 0, 0.5, 0.06, 0.32, M.white, 0, desk);
    box(0, 0.52, 1.35, 0.7, 0.12, 0.65, M.steel, 0, desk);
    box(0, 0.95, 1.68, 0.7, 0.85, 0.1, M.steel, 0, desk);
    solid(x, -0.15, 0.75, 0.55, 1.4);
    cylinder(x, 0.28, -0.45, 0.055, 0.5, M.steel);
    box(x, 3.35, -3.98, 3.4, 1.2, 0.06, timber);
    for (let j = 0; j < 5; j++)
      box(
        x - 1.2 + j * 0.56,
        3.35,
        -3.92,
        0.4,
        0.7,
        0.025,
        j % 2 ? M.white : M.orange,
      );
  }
  // Memory is a physical shared shelf behind the three stations.
  for (const x of [-5.6, 5.6]) {
    box(x, 2, -3.3, 0.45, 3.8, 1, timber);
    for (let j = 0; j < 5; j++)
      box(x, 0.55 + j * 0.65, -3.3, 0.5, 0.06, 1.12, M.steel);
  }
  label("RUN HISTORY → LESSONS → NEXT PROJECT", 0, 4.5, -3.96, 9.5, 0.4);
  label("DATA → CANDIDATES → EVALUATION", 0, 3.5, -3.88, 8.5, 0.48);
  // Sidewalk apron joins the building to the existing approach without a display plinth.
  box(0, -0.075, 5.65, 13.6, 0.12, 3, M.stone);
  for (const side of [-1, 1]) {
    box(side * 5.3, 0.35, 5.45, 1.4, 0.7, 1.1, M.stone);
    solid(side * 5.3, 5.45, 1.4, 1.1, 0.7);
    tree(side * 5.3, 5.45, 0.75);
  }
  root.userData.setInspection = (enabled) => {
    roof.visible = !enabled;
  };
}
