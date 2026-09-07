import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { cityProjects } from "../explore/game/content.js";
import {
  shortestPath,
  nearestNode,
  worldPoint,
  distance,
  segmentDistance,
  movePlayer,
} from "../explore/game/navigation.js";
const graph = JSON.parse(
  readFileSync(new URL("../explore/graph.json", import.meta.url)),
);
const bounds = { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };

test("every real project can be reached along original, reciprocal road edges", () => {
  for (const from of graph.stops)
    for (const to of graph.stops) {
      const path = shortestPath(graph, from, to);
      assert.equal(path[0], from);
      assert.equal(path.at(-1), to);
      for (let i = 1; i < path.length; i++) {
        const prev = graph.nodes.find((n) => n.id === path[i - 1]),
          next = graph.nodes.find((n) => n.id === path[i]);
        assert.ok(prev.neighbors.includes(next.id));
        assert.ok(next.neighbors.includes(prev.id));
      }
    }
});
test("weighted routing chooses distance rather than fewest hops", () => {
  const g = {
    nodes: [
      { id: "a", x: 0, y: 0, neighbors: ["b", "c"] },
      { id: "b", x: 0, y: 50, neighbors: ["a", "d"] },
      { id: "c", x: 2, y: 0, neighbors: ["a", "e"] },
      { id: "e", x: 4, y: 0, neighbors: ["c", "d"] },
      { id: "d", x: 6, y: 0, neighbors: ["b", "e"] },
    ],
  };
  assert.deepEqual(shortestPath(g, "a", "d"), ["a", "c", "e", "d"]);
  assert.deepEqual(shortestPath(g, "missing", "d"), []);
});
test("disconnected destinations return no route", () => {
  assert.deepEqual(
    shortestPath(
      {
        nodes: [
          { id: "a", x: 0, y: 0, neighbors: [] },
          { id: "b", x: 1, y: 0, neighbors: [] },
        ],
      },
      "a",
      "b",
    ),
    [],
  );
});
test("player cannot tunnel through a thin wall at sprint speed", () => {
  const wall = [{ minX: 2, maxX: 2.2, minZ: -10, maxZ: 10 }];
  const end = movePlayer({ x: 0, z: 0 }, 18, 0, wall, bounds);
  assert.ok(end.x <= 1.52);
  assert.equal(end.z, 0);
});
test("diagonal movement slides along a wall rather than stopping both axes", () => {
  const end = movePlayer(
    { x: 0, z: 0 },
    10,
    5,
    [{ minX: 2, maxX: 3, minZ: -10, maxZ: 10 }],
    bounds,
  );
  assert.ok(end.x <= 1.52);
  assert.ok(Math.abs(end.z - 5) < 1e-9);
});
test("rounded corners allow movement outside the actual player radius", () => {
  const end = movePlayer(
    { x: 1.5, z: 1.5 },
    0.1,
    0.1,
    [{ minX: 2, maxX: 4, minZ: 2, maxZ: 4 }],
    bounds,
  );
  assert.equal(end.x, 1.6);
  assert.equal(end.z, 1.6);
});
test("world boundary retains player radius and free motion is stable", () => {
  const end = movePlayer({ x: 99, z: 99 }, 8, 8, [], bounds);
  assert.equal(end.x, 99.52);
  assert.equal(end.z, 99.52);
  const p = movePlayer({ x: 0, z: 0 }, 3, 4, [], bounds);
  assert.ok(Math.abs(distance(p, { x: 0, z: 0 }) - 5) < 1e-10);
});
test("graph north maps to negative Z and nearest-node lookup matches all spawns", () => {
  assert.deepEqual(worldPoint({ x: 7, y: 13 }), { x: 7, z: -13 });
  for (const id of graph.stops) {
    const n = graph.nodes.find((n) => n.id === id);
    assert.equal(nearestNode(graph, worldPoint(n)).id, id);
  }
});
test("road distance handles segment endpoints and zero-length segments", () => {
  assert.equal(
    segmentDistance({ x: 5, z: 3 }, { x: 0, z: 0 }, { x: 10, z: 0 }),
    3,
  );
  assert.equal(
    segmentDistance({ x: 13, z: 4 }, { x: 0, z: 0 }, { x: 10, z: 0 }),
    5,
  );
  assert.equal(
    segmentDistance({ x: 3, z: 4 }, { x: 0, z: 0 }, { x: 0, z: 0 }),
    5,
  );
});
test("all 24 portfolio entries and the campus landmark have readable content", () => {
  const context = { window: {} };
  vm.runInNewContext(
    readFileSync(new URL("../embeddings/data.js", import.meta.url), "utf8"),
    context,
  );
  const projects = cityProjects(context.window.PROJECTS, graph);
  assert.equal(context.window.PROJECTS.length, 24);
  assert.equal(graph.stops.length, 25);
  for (const id of graph.stops) {
    const p = projects[id];
    assert.ok(p.title);
    assert.ok(p.body.length);
    for (const link of p.links || []) {
      assert.match(link.href, /^(https?:\/\/|\/)/);
    }
  }
});
