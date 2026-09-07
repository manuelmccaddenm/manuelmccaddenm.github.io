import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { kit } from "../explore/game/monuments/kit.js";
import { masonryBuilding } from "../explore/game/masonry-buildings.js";
import { modelTrees } from "../explore/game/city-assets.js";

import { asset } from "./helpers/gltf.mjs";
const architecture = await asset("architecture");
const tree = await asset("tree");

test("shipped architectural modules form closed, correctly scaled buildings in both street orientations", () => {
  for (const yaw of [0, Math.PI])
    for (const variant of [1, 2, 3, 4]) {
      const scene = new T.Scene();
      const k = kit(scene, "neighborhood-buildings", () => new T.Object3D());
      const building = masonryBuilding(
        k,
        architecture,
        { x: 40, z: -80 },
        yaw,
        "house",
        variant,
      );
      k.finish();
      scene.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(k.root);
      assert.ok(
        bounds.min.y >= -0.01 && bounds.max.y < 12,
        "grounded, domestic scale",
      );
      assert.ok(
        bounds.min.x >= 31.5 && bounds.max.x <= 48.5,
        "inside collision parcel",
      );
      assert.ok(
        bounds.min.z >= -88.5 && bounds.max.z <= -71.5,
        "inside collision parcel",
      );
      assert.ok(
        building.windows.some((w) => w.face === 0) &&
          building.windows.some((w) => w.face === Math.PI),
      );
      const w = building.windows.find((w) => w.face === 0);
      const forward = new T.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const start = new T.Vector3(...w.center).addScaledVector(forward, 2);
      const hits = new T.Raycaster(
        start,
        forward.negate(),
        0,
        5,
      ).intersectObject(k.root, true);
      assert.ok(hits.length, "window and room exist in front facade");
      assert.ok(
        hits.some((h) => h.distance > 2.4),
        "room has real depth behind glazing",
      );
    }
});

test("optimized botanical trees retain near/far canopies, metre scale and lower distant triangle count", () => {
  const counts = { near: 0, far: 0 };
  tree.traverse((o) => {
    if (!o.isMesh) return;
    assert.ok(o.geometry.getAttribute("position").array.every(Number.isFinite));
    counts[o.name.includes("_near_") ? "near" : "far"] +=
      o.geometry.index.count / 3;
  });
  assert.ok(counts.near < 45000 && counts.near > 20000);
  assert.ok(counts.far < 15000 && counts.far < counts.near * 0.4);
  const scene = new T.Scene();
  const lods = modelTrees(scene, tree, [
    { p: { x: 20, z: 30 }, h: 4 },
    { p: { x: 80, z: 30 }, h: 3 },
  ]);
  assert.equal(lods.length, 2);
  const camera = new T.PerspectiveCamera();
  camera.position.set(20, 2, 30);
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  lods[0].update(camera);
  assert.ok(lods[0].levels[0].object.visible);
  camera.position.set(200, 2, 30);
  camera.updateMatrixWorld();
  lods[0].update(camera);
  assert.ok(lods[0].levels[1].object.visible);
  const bounds = new T.Box3().setFromObject(scene);
  assert.ok(
    bounds.max.y > 6 && bounds.max.y < 9,
    "mature trees fit urban scale",
  );
});
