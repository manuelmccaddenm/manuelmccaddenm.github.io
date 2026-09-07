import * as T from "three";

// Small leaf sprays with actual gaps: daylight passes through each crown.
const positions = [],
  colors = [];
for (let i = 0; i < 9; i++) {
  const a = i * 2.399,
    r = 0.05 + Math.sqrt(i / 9) * 0.42;
  const x = Math.cos(a) * r,
    z = Math.sin(a) * r;
  const points = [
    [0, 0.02, -0.13],
    [-0.065, 0, 0],
    [0, 0.035, 0.16],
    [0.065, 0, 0],
  ];
  for (const j of [0, 1, 2, 0, 2, 3]) {
    const [px, py, pz] = points[j];
    positions.push(
      x + px * Math.cos(a) - pz * Math.sin(a),
      py + Math.sin(i) * 0.12,
      z + px * Math.sin(a) + pz * Math.cos(a),
    );
    const c = new T.Color().setHSL(
      0.22 + (i % 3) * 0.008,
      0.52,
      0.17 + (j === 2 ? 0.045 : 0),
    );
    colors.push(c.r, c.g, c.b);
  }
}
const geometry = new T.BufferGeometry();
geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
geometry.computeVertexNormals();
const material = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.85,
  side: T.DoubleSide,
});
export function leafCanopies(parent, crowns, sprays = 180) {
  // Keep distant foliage out of the camera and shadow passes. One city-wide
  // instance batch forces every leaf through the GPU even when it is behind us.
  if (crowns.length > 20) {
    const cells = new Map();
    for (const crown of crowns) {
      const key = `${Math.floor(crown.x / 48)},${Math.floor(crown.z / 48)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(crown);
    }
    if (cells.size > 1) {
      const group = new T.Group();
      group.name = "spatial-leaf-canopies";
      parent.add(group);
      for (const cell of cells.values()) leafCanopies(group, cell, sprays);
      return group;
    }
  }
  const leaves = new T.InstancedMesh(
    geometry,
    material,
    crowns.length * sprays,
  );
  leaves.name = "fine-leaf-canopies";
  const o = new T.Object3D();
  let seed = 6143;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  crowns.forEach(({ x, y, z, radius = 2.5 }, n) => {
    for (let i = 0; i < sprays; i++) {
      const a = rand() * Math.PI * 2,
        h = rand() * 2 - 1,
        r = Math.cbrt(rand());
      const ring = Math.sqrt(1 - h * h);
      o.position.set(
        x + Math.cos(a) * ring * r * radius,
        y + h * r * radius * 0.85,
        z + Math.sin(a) * ring * r * radius,
      );
      o.rotation.set(rand() * 2, rand() * 6.28, rand() * 2);
      o.scale.setScalar(0.8 + rand() * 0.5);
      o.updateMatrix();
      leaves.setMatrixAt(n * sprays + i, o.matrix);
    }
  });
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.computeBoundingSphere();
  parent.add(leaves);
  return leaves;
}
