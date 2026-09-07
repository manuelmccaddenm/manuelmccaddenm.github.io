import * as T from "three";

// Modeled locally so the exhibit needs no paid assets or network downloads.
export function createPredatorPrey(parent) {
  const habitat = new T.Group();
  habitat.name = "predator-prey-habitat";
  parent.add(habitat);
  const mat = (color) => new T.MeshStandardMaterial({ color, roughness: 0.86 });
  const fur = mat("#bd592b"),
    cream = mat("#f6e8cc"),
    black = mat("#252420");
  const rabbitFur = [mat("#e4d7c1"), mat("#b4a18a"), mat("#e9e5dc")];
  const pink = mat("#ce9d90"),
    grass = mat("#698247"),
    rock = mat("#888c7c");
  const sphere = new T.SphereGeometry(1, 16, 10);
  function part(group, material, x, y, z, sx, sy, sz, geometry = sphere) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  part(
    habitat,
    grass,
    0,
    0.12,
    0,
    7.5,
    0.3,
    7.5,
    new T.CylinderGeometry(1, 1, 1, 64),
  );
  // Low rocks and planting leave the animals visible from every approach.
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    part(
      habitat,
      rock,
      Math.cos(a) * 7,
      0.28,
      Math.sin(a) * 7,
      0.35,
      0.25,
      0.45,
    );
  }
  const actors = [];
  function animal(predator, index) {
    const root = new T.Group(),
      body = new T.Group();
    root.name = `${predator ? "fox" : "rabbit"}-${index + 1}`;
    root.userData.species = predator ? "predator" : "prey";
    root.add(body);
    habitat.add(root);
    const coat = predator ? fur : rabbitFur[index % 3];
    part(body, coat, 0, 0.85, 0, 0.48, 0.52, predator ? 0.98 : 0.7);
    part(body, cream, 0, 0.8, 0.55, 0.38, 0.4, 0.35);
    part(body, coat, 0, 1.35, 0.85, 0.43, 0.43, 0.5);
    part(
      body,
      cream,
      0,
      1.18,
      predator ? 1.28 : 1.13,
      0.3,
      0.22,
      predator ? 0.5 : 0.23,
    );
    part(body, black, 0, 1.22, predator ? 1.72 : 1.36, 0.12, 0.1, 0.1);
    for (const side of [-1, 1]) {
      part(body, black, side * 0.28, 1.47, 1.17, 0.065, 0.078, 0.06);
      if (predator) {
        part(
          body,
          coat,
          side * 0.28,
          1.94,
          0.74,
          0.24,
          0.47,
          0.19,
          new T.ConeGeometry(1, 1, 3),
        );
        part(
          body,
          black,
          side * 0.28,
          1.96,
          0.83,
          0.12,
          0.25,
          0.05,
          new T.ConeGeometry(1, 1, 3),
        );
      } else {
        const ear = part(body, coat, side * 0.2, 2, 0.76, 0.15, 0.64, 0.18);
        ear.rotation.z = side * -0.14;
        part(body, pink, side * 0.2, 2.02, 0.91, 0.075, 0.46, 0.04).rotation.z =
          side * -0.14;
      }
    }
    const tail = new T.Group();
    tail.position.set(0, 0.95, -0.65);
    body.add(tail);
    if (predator) {
      part(tail, fur, 0, -0.1, -0.65, 0.32, 0.35, 0.85).rotation.x = -0.25;
      part(tail, cream, 0, -0.27, -1.25, 0.25, 0.26, 0.32);
    } else part(tail, cream, 0, 0.03, -0.14, 0.24, 0.24, 0.24);
    const legs = [];
    for (const side of [-1, 1])
      for (const end of [-1, 1]) {
        const leg = new T.Group();
        leg.position.set(side * 0.32, 0.65, end * (predator ? 0.62 : 0.42));
        part(leg, coat, 0, -0.18, 0, 0.14, 0.34, 0.16);
        part(leg, predator ? black : coat, 0, -0.46, 0.12, 0.16, 0.15, 0.27);
        body.add(leg);
        legs.push(leg);
      }
    root.scale.setScalar(predator ? 1.05 : 0.78);
    actors.push({ root, body, tail, legs, predator, index });
    return root;
  }
  for (let i = 0; i < 6; i++) animal(false, i);
  for (let i = 0; i < 2; i++) animal(true, i);
  function update(t) {
    for (const { root, body, tail, legs, predator, index } of actors) {
      // Each fox follows a rabbit on the same track, visibly behind its target.
      const target = predator ? index * 3 : index;
      const angle = t * 0.32 + (target * Math.PI) / 3 - (predator ? 0.62 : 0);
      const radius = target % 2 ? 3.5 : 5.1;
      root.position.set(
        Math.cos(angle) * radius,
        0.28,
        Math.sin(angle) * radius,
      );
      root.rotation.y = -angle;
      const stride = t * (predator ? 8 : 10) + index * 1.7;
      body.position.y = predator
        ? Math.sin(stride * 2) * 0.055
        : Math.max(0, Math.sin(stride)) * 0.34;
      body.rotation.x = predator ? 0 : Math.cos(stride) * 0.07;
      legs.forEach((leg, i) => {
        leg.rotation.x =
          Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) *
          (predator ? 0.5 : 0.32);
      });
      tail.rotation.y = Math.sin(stride * 0.45) * 0.22;
    }
  }
  update(0); // Animals are visible in a posed habitat even with reduced motion enabled.
  return { habitat, update };
}
