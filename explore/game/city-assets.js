import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Downloaded, optimized CC0 models are served locally. A failed optional asset
// leaves the existing procedural city usable, including every project and route.
export async function loadCityAssets() {
  const loader = new GLTFLoader();
  const assets = {};
  await Promise.all(
    ["architecture", "tree"].map(async (name) => {
      try {
        const gltf = await loader.loadAsync(
          `/explore/media/models/${name}.glb`,
        );
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          const m = o.material;
          for (const v of Object.values(m)) if (v?.isTexture) v.anisotropy = 8;
          if (m.name.includes("leaves")) {
            m.transparent = false;
            m.alphaTest = 0.45;
            m.depthWrite = true;
            m.roughness = 0.85;
            m.side = T.DoubleSide;
            // Thin leaves transmit a small amount of diffuse skylight.
            m.emissiveMap = m.map;
            m.emissive.set("#5c6a36");
            m.emissiveIntensity = 0.12;
          } else if (m.name.includes("glass")) {
            m.opacity = 0.68;
            m.depthWrite = false;
            m.roughness = 0.17;
            m.envMapIntensity = 1.3;
            m.userData.castShadow = false;
          }
        });
        assets[name] = gltf.scene;
      } catch (error) {
        console.warn(
          `Optional ${name} asset unavailable; using built-in geometry.`,
          error,
        );
      }
    }),
  );
  return assets;
}

export function modelTrees(parent, source, trees) {
  const cells = new Map();
  trees.forEach((tree, i) => {
    const key = `${Math.floor(tree.p.x / 40)},${Math.floor(tree.p.z / 40)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push({ ...tree, i });
  });
  const lods = [];
  const dummy = new T.Object3D();
  for (const cell of cells.values()) {
    const center = new T.Vector3();
    for (const { p } of cell) center.add(new T.Vector3(p.x, 0, p.z));
    center.multiplyScalar(1 / cell.length);
    const lod = new T.LOD();
    lod.name = "botanical-tree-cell";
    lod.position.copy(center);
    for (const [level, distance] of [
      ["near", 0],
      ["far", 48],
    ]) {
      const group = new T.Group();
      source.traverse((src) => {
        if (!src.isMesh || !src.name.startsWith(`tree_${level}`)) return;
        const instances = new T.InstancedMesh(
          src.geometry,
          src.material,
          cell.length,
        );
        cell.forEach(({ p, h, i }, n) => {
          dummy.position.set(p.x - center.x, 0.04, p.z - center.z);
          dummy.rotation.set(0, i * 2.39996, 0);
          // The source is 4.56 m tall. Mature street trees are 6–8 m tall.
          const scale = (h + 3) / 4.56;
          dummy.scale.set(scale * (0.94 + (i % 4) * 0.045), scale, scale);
          dummy.updateMatrix();
          instances.setMatrixAt(n, dummy.matrix);
          instances.setColorAt(
            n,
            new T.Color().setRGB(
              1 - (i % 3) * 0.045,
              1 - (i % 5) * 0.025,
              1 - (i % 4) * 0.04,
            ),
          );
        });
        instances.castShadow = instances.receiveShadow = true;
        instances.computeBoundingSphere();
        group.add(instances);
      });
      lod.addLevel(group, distance, 0.18);
    }
    parent.add(lod);
    lods.push(lod);
  }
  return lods;
}
