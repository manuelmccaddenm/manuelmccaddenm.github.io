import * as T from "three";

// A miniature American-football stadium, with the project's actual draft objectives.
export function createDraftStadium(parent, sign) {
  const stadium = new T.Group();
  stadium.name = "nfl-draft-stadium";
  parent.add(stadium);
  const material = (color, metalness = 0) =>
    new T.MeshStandardMaterial({
      color,
      metalness,
      roughness: metalness ? 0.35 : 0.82,
    });
  const concrete = material("#a3aaac"),
    steel = material("#293640", 0.65),
    white = material("#f4efdf");
  const gold = material("#ffbf36", 0.35),
    navy = material("#12334d"),
    red = material("#ad4544");
  const boxes = new Map(),
    cube = new T.BoxGeometry(1, 1, 1),
    dummy = new T.Object3D();
  function box(x, y, z, w, h, d, mat) {
    if (!boxes.has(mat)) boxes.set(mat, []);
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    boxes.get(mat).push(dummy.matrix.clone());
  }
  function mesh(geometry, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    const ob = new T.Mesh(geometry, mat);
    ob.position.set(x, y, z);
    ob.scale.set(sx, sy, sz);
    ob.castShadow = ob.receiveShadow = true;
    stadium.add(ob);
    return ob;
  }
  function label(text, color, x, y, z, w, h) {
    const ob = sign(text, color, w, h);
    ob.position.set(x, y, z);
    stadium.add(ob);
    return ob;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 1067;
  const c = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;
  c.fillStyle = "#285e36";
  c.fillRect(0, 0, width, height);
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? "#367747" : "#2e6c3e";
    c.fillRect(200 + i * 200, 0, 200, height);
  }
  c.fillStyle = "#183851";
  c.fillRect(0, 0, 200, height);
  c.fillStyle = "#723e3d";
  c.fillRect(2200, 0, 200, height);
  c.fillStyle = "#fff9e8";
  for (let x = 200; x <= 2200; x += 100) c.fillRect(x - 3, 0, 6, height);
  c.fillRect(0, 0, width, 8);
  c.fillRect(0, height - 8, width, 8);
  c.fillRect(0, 0, 8, height);
  c.fillRect(width - 8, 0, 8, height);
  // One-yard hash marks, including the narrower NFL hash spacing.
  for (let x = 220; x < 2200; x += 20)
    for (const y of [30, height - 45, height / 2 - 62, height / 2 + 62])
      c.fillRect(x, y, 4, 15);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "700 76px system-ui";
  for (let i = 1; i < 10; i++) {
    const n = String(Math.min(i, 10 - i) * 10),
      x = 200 + i * 200;
    c.fillText(n, x, height - 155);
    c.save();
    c.translate(x, 155);
    c.rotate(Math.PI);
    c.fillText(n, 0, 0);
    c.restore();
  }
  c.font = "700 108px system-ui";
  for (const [x, title] of [
    [100, "FANTASY"],
    [2300, "DRAFT"],
  ]) {
    c.save();
    c.translate(x, height / 2);
    c.rotate(-Math.PI / 2);
    c.fillText(title, 0, 0);
    c.restore();
  }
  const fieldTexture = new T.CanvasTexture(canvas);
  fieldTexture.colorSpace = T.SRGBColorSpace;
  fieldTexture.anisotropy = 8;
  box(0, 0.32, 0, 12.4, 0.38, 5.65, concrete);
  const field = mesh(
    new T.PlaneGeometry(12, 16 / 3),
    new T.MeshStandardMaterial({ map: fieldTexture, roughness: 0.98 }),
    0,
    0.52,
    0,
  );
  field.name = "120-yard-football-field";
  field.rotation.x = -Math.PI / 2;
  // Three banks of tiered seating; a low front concourse keeps the field visible from the street.
  const chairColors = [navy, red, material("#587789")];
  let seats = 0;
  for (let tier = 0; tier < 5; tier++) {
    const y = 0.7 + tier * 0.38,
      z = -3.05 - tier * 0.43;
    box(0, y / 2, z, 12.8, y, 0.48, concrete);
    for (let x = -6; x <= 6; x += 0.34) {
      if (Math.abs(x) < 0.32 || Math.abs(Math.abs(x) - 3.2) < 0.22) continue;
      const mat = chairColors[seats++ % 3];
      box(x, y + 0.12, z, 0.27, 0.1, 0.29, mat);
      box(x, y + 0.3, z - 0.14, 0.27, 0.32, 0.065, mat);
    }
    for (const side of [-1, 1]) {
      const x = side * (6.4 + tier * 0.25);
      box(x, y / 2, -0.3, 0.3, y, 5.5, concrete);
      for (let z = -2.65; z < 2.4; z += 0.34) {
        if (Math.abs(z) < 0.25) continue;
        const mat = chairColors[seats++ % 3];
        box(x, y + 0.12, z, 0.24, 0.1, 0.27, mat);
        box(x + side * 0.12, y + 0.3, z, 0.06, 0.32, 0.27, mat);
      }
    }
  }
  stadium.userData.seats = seats;
  for (const z of [-5.12, 3.05]) {
    box(0, 0.66, z, 13.2, 0.25, 0.15, steel);
    for (let x = -6.5; x <= 6.5; x += 1)
      box(x, 0.65, z, 0.04, 0.9, 0.04, steel);
  }
  // NFL-style yellow uprights behind the end zones, not soccer goals.
  const cylinder = (x, y, z, h) =>
    mesh(new T.CylinderGeometry(0.045, 0.045, h, 10), gold, x, y, z);
  for (const side of [-1, 1]) {
    const x = side * 6.1;
    const goal = new T.Group();
    goal.name = side < 0 ? "west-uprights" : "east-uprights";
    stadium.add(goal);
    goal.add(cylinder(x, 1.15, 0, 1.2));
    box(x, 1.78, 0, 0.09, 0.09, 1.1, gold);
    for (const z of [-0.55, 0.55]) goal.add(cylinder(x, 2.3, z, 1.05));
    box(x, 0.8, 0, 0.16, 0.55, 0.16, navy);
  }
  // Small helmeted players form an offensive lineup, with an opponent across the line.
  const ballGeo = new T.SphereGeometry(1, 16, 10);
  const players = [
    [-1.1, 0],
    [-2.1, 0.55],
    [-0.45, -1.9],
    [-0.45, 1.9],
    [-0.45, -1.05],
    [-1.5, -1.1],
    ...[-0.6, -0.3, 0, 0.3, 0.6].map((z) => [0, z]),
  ];
  players.forEach(([x, z], i) => {
    const jersey = i < 5 ? navy : white;
    mesh(ballGeo, jersey, x, 0.84, z, 0.13, 0.2, 0.15);
    mesh(ballGeo, gold, x, 1.08, z, 0.14, 0.14, 0.14);
    box(x + 0.1, 1.06, z, 0.1, 0.07, 0.18, steel);
    for (const side of [-1, 1])
      box(x, 0.62, z + side * 0.07, 0.07, 0.22, 0.065, white);
  });
  for (const z of [-1.5, -0.6, 0, 0.6, 1.5]) {
    mesh(ballGeo, red, 0.65, 0.84, z, 0.13, 0.2, 0.15);
    mesh(ballGeo, white, 0.65, 1.08, z, 0.14, 0.14, 0.14);
  }
  // Recognizable leather football with raised laces, displayed above midfield.
  const football = new T.Group();
  football.name = "laced-american-football";
  stadium.add(football);
  const leather = material("#864728");
  const shell = new T.Mesh(new T.SphereGeometry(1, 32, 20), leather);
  shell.scale.set(0.65, 0.32, 0.32);
  shell.castShadow = true;
  football.add(shell);
  const laceMat = new T.MeshStandardMaterial({
    color: "#f1dfb8",
    roughness: 0.8,
  });
  for (let i = -3; i <= 3; i++) {
    const lace = new T.Mesh(new T.BoxGeometry(0.035, 0.035, 0.17), laceMat);
    lace.position.set(i * 0.095, 0.3, 0);
    football.add(lace);
  }
  const seam = new T.Mesh(new T.BoxGeometry(0.75, 0.025, 0.028), laceMat);
  seam.position.y = 0.323;
  football.add(seam);
  // Four stadium lighting gantries and a roof over the rear seating bank.
  const lightMat = new T.MeshStandardMaterial({
    color: "#fff2cd",
    emissive: "#fff2cd",
    emissiveIntensity: 1.7,
  });
  for (const x of [-6.7, 6.7])
    for (const z of [-4.7, 2.7]) {
      box(x, 2.5, z, 0.1, 4.4, 0.1, steel);
      box(x, 4.75, z, 0.95, 0.34, 0.2, steel);
      for (let i = -2; i <= 2; i++)
        box(x + i * 0.17, 4.74, z + 0.12, 0.12, 0.18, 0.04, lightMat);
    }
  box(0, 3.1, -4.5, 13.3, 0.16, 1.5, steel);
  for (const x of [-6.3, -3.2, 3.2, 6.3])
    box(x, 2.1, -5.1, 0.09, 2.1, 0.09, steel);
  // Jumbotron: the optimization link is explicit and uses the repository's objectives.
  for (const x of [-4.8, 4.8]) box(x, 4.6, -4.6, 0.2, 4.6, 0.2, steel);
  box(0, 5.75, -4.6, 12.2, 4.1, 0.22, steel);
  label("NFL FANTASY DRAFT", "#ffcf73", 0, 7.35, -4.44, 11.5, 0.8);
  label("PORTFOLIO OPTIMIZATION", "#70d9bf", 0, 6.62, -4.43, 11.5, 0.55);
  label("FLOOR · INTERIOR POINT", "#7acbff", -2.9, 5.95, -4.42, 5.45, 0.48);
  label(
    "CEILING · PROJECTED GRADIENT",
    "#ffb774",
    2.9,
    5.95,
    -4.42,
    5.45,
    0.48,
  );
  label("max  aᵀw − λwᵀΣw", "#7acbff", -2.9, 5.3, -4.41, 5.45, 0.68);
  label("max  aᵀw + λwᵀΣw", "#ffb774", 2.9, 5.3, -4.41, 5.45, 0.68);
  label("ADJUSTED VALUE − VARIANCE", "#7acbff", -2.9, 4.73, -4.4, 5.45, 0.4);
  label("ADJUSTED VALUE + VARIANCE", "#ffb774", 2.9, 4.73, -4.4, 5.45, 0.4);
  label(
    "ROSTER LIMITS · PICK BUDGET · ADP AVAILABILITY",
    "#d6e2dc",
    0,
    4.16,
    -4.39,
    11.5,
    0.43,
  );
  // A lit 12-team snake draft ribbon reverses direction each round.
  const pickLights = [];
  for (let round = 0; round < 2; round++)
    for (let team = 0; team < 12; team++) {
      const pick = round * 12 + (round % 2 ? 11 - team : team);
      const panel = mesh(
        new T.BoxGeometry(0.86, 0.25, 0.08),
        navy,
        (team - 5.5) * 0.94,
        3.55 - round * 0.32,
        -4.35,
      );
      panel.name = `snake-pick-${pick + 1}`;
      pickLights.push({ panel, pick });
    }
  label("12 TEAMS · SNAKE DRAFT", "#ffcf73", 0, 3.88, -4.34, 11.4, 0.32);
  const activePick = new T.MeshStandardMaterial({
    color: "#ffcf73",
    emissive: "#ffcf73",
    emissiveIntensity: 0.65,
  });
  for (const [mat, matrices] of boxes) {
    const batch = new T.InstancedMesh(cube, mat, matrices.length);
    matrices.forEach((matrix, i) => batch.setMatrixAt(i, matrix));
    batch.castShadow = batch.receiveShadow = true;
    batch.computeBoundingSphere();
    stadium.add(batch);
  }
  function update(t) {
    football.position.set(0, 2.4 + Math.sin(t * 1.4) * 0.1, 0);
    football.rotation.set(0.18, t * 0.3, -0.18);
    const pick = Math.floor(t * 0.8) % 24;
    for (const light of pickLights)
      light.panel.material = light.pick === pick ? activePick : navy;
  }
  update(0);
  return { stadium, update };
}
