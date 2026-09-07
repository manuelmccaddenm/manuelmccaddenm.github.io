import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as T from "three";
import { createWorld } from "../explore/game/world.js";
import { cityProjects } from "../explore/game/content.js";
import {
  worldPoint,
  movePlayer,
  distance,
} from "../explore/game/navigation.js";
const graph = JSON.parse(
  readFileSync(new URL("../explore/graph.json", import.meta.url)),
);
const hotspots = JSON.parse(
  readFileSync(new URL("../explore/hotspots.json", import.meta.url)),
);
const context = { window: {} };
vm.runInNewContext(
  readFileSync(new URL("../embeddings/data.js", import.meta.url), "utf8"),
  context,
);
// Only text/noise canvases need a shim. All geometry and collision use actual Three.js.
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect() {},
      fillText() {},
      measureText: (t) => ({ width: t.length * 35 }),
    }),
  }),
};
const scene = new T.Scene(),
  world = createWorld(
    scene,
    graph,
    cityProjects(context.window.PROJECTS, graph),
    hotspots,
  );
const free = (p) =>
  !world.colliders.some((b) => {
    const x = Math.max(b.minX, Math.min(b.maxX, p.x)),
      z = Math.max(b.minZ, Math.min(b.maxZ, p.z));
    return Math.hypot(p.x - x, p.z - z) < 0.48;
  });
test("all original stop and road-node spawns are free of solid geometry", () => {
  const blocked = graph.nodes
    .filter((n) => !free(worldPoint(n)))
    .map((n) => n.id);
  assert.deepEqual(blocked, []);
});
test("every original road can actually be walked in both directions", () => {
  const blocked = [];
  for (const r of graph.roads)
    for (const ids of [r.nodes, [...r.nodes].reverse()]) {
      for (let i = 1; i < ids.length; i++) {
        const a = worldPoint(graph.nodes.find((n) => n.id === ids[i - 1])),
          b = worldPoint(graph.nodes.find((n) => n.id === ids[i]));
        const end = movePlayer(
          a,
          b.x - a.x,
          b.z - a.z,
          world.colliders,
          world.bounds,
        );
        if (distance(end, b) > 0.01) blocked.push(`${ids[i - 1]} -> ${ids[i]}`);
      }
    }
  assert.deepEqual(blocked, []);
});
test("city contains actual geometry for all stops and instanced urban scenery", () => {
  assert.equal(world.lots.size, 25);
  assert.ok(world.buildingCount > 40);
  assert.ok(world.colliders.length > 40);
  for (const [id, lot] of world.lots) {
    let meshes = 0;
    lot.group.traverse((o) => {
      if (o.isMesh) meshes++;
    });
    assert.ok(meshes > 3, `${id} has a modeled exhibit`);
  }
  assert.ok(scene.children.filter((o) => o.isInstancedMesh).length > 10);
});
