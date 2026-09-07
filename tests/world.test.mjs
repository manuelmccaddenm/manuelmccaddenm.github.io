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
      beginPath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      fill() {},
      stroke() {},
      fillText() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
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

test("predator–prey has visible animals that animate and remain visible with reduced motion", () => {
  const habitat = world.lots
    .get("predator-prey")
    .group.getObjectByName("predator-prey-habitat");
  assert.ok(habitat, "the actual city includes the habitat");
  const animals = habitat.children.filter((o) => o.userData.species);
  assert.equal(
    animals.filter((o) => o.userData.species === "predator").length,
    2,
  );
  assert.equal(animals.filter((o) => o.userData.species === "prey").length, 6);
  const initial = animals.map((o) => o.position.clone());
  const camera = new T.PerspectiveCamera();
  world.update(5, camera, false);
  animals.forEach((o, i) => {
    assert.ok(o.visible && o.position.distanceTo(initial[i]) > 0.1);
    assert.ok(Math.hypot(o.position.x, o.position.z) < 6);
  });
  const paused = animals.map((o) => o.position.clone());
  world.update(20, camera, true);
  animals.forEach((o, i) =>
    assert.ok(o.visible && o.position.equals(paused[i])),
  );
});

test("fantasy draft contains a distinct NFL stadium and a reversing 12-team draft board", () => {
  const stadium = world.lots
    .get("fantasy-draft")
    .group.getObjectByName("nfl-draft-stadium");
  assert.ok(stadium);
  assert.ok(stadium.userData.seats > 200);
  for (const name of [
    "120-yard-football-field",
    "west-uprights",
    "east-uprights",
    "laced-american-football",
  ])
    assert.ok(stadium.getObjectByName(name), name);
  assert.equal(
    world.lots.get("negreira").group.getObjectByName("nfl-draft-stadium"),
    undefined,
  );
  const pick1 = stadium.getObjectByName("snake-pick-1"),
    pick12 = stadium.getObjectByName("snake-pick-12"),
    pick13 = stadium.getObjectByName("snake-pick-13"),
    pick24 = stadium.getObjectByName("snake-pick-24");
  assert.equal(pick12.position.x, pick13.position.x);
  assert.equal(pick1.position.x, pick24.position.x);
  world.update(15, new T.PerspectiveCamera(), false);
  assert.ok(
    pick13.material.emissive.getHex() > 0 &&
      pick12.material.emissive.getHex() === 0,
  );
});

test("all 25 stops have an explanation and a complete finite inspection scene", async () => {
  const { MONUMENTS, overviewFor } = await import(
    "../explore/game/monuments/catalog.js"
  );
  assert.deepEqual(Object.keys(MONUMENTS).sort(), [...graph.stops].sort());
  for (const [id, lot] of world.lots) {
    const definition = MONUMENTS[id];
    assert.ok(
      definition.every((text) => typeof text === "string" && text.length > 3),
      id,
    );
    const view = overviewFor(id);
    assert.ok([...view.eye, ...view.target].every(Number.isFinite), id);
    if (!["fantasy-draft", "predator-prey"].includes(id)) {
      const model = lot.group.getObjectByName(`monument-${id}`);
      assert.ok(
        model && model.userData.interpretation,
        `${id}: modeled scene and interpretation`,
      );
      const bounds = new T.Box3().setFromObject(model);
      assert.ok(
        [...bounds.min.toArray(), ...bounds.max.toArray()].every(
          Number.isFinite,
        ),
        `${id}: finite geometry`,
      );
      assert.ok(bounds.getSize(new T.Vector3()).y > 2, `${id}: full display`);
    }
  }
});

test("autoencoder straddles the original road with a traversable bottleneck and solid supports", () => {
  const lot = world.lots.get("autoencoder");
  const model = lot.group.getObjectByName("monument-autoencoder");
  const frames = model.userData.bridgeFrames;
  assert.equal(frames.length, 13);
  assert.ok(frames[6].width < frames[0].width / 2);
  assert.equal(frames[0].width, frames[12].width);
  assert.ok(
    frames.every((f) => f.height >= 4.8),
    "overhead beams clear the player and jumps",
  );
  const toWorld = (x, z) => {
    const p = lot.group.localToWorld(new T.Vector3(x, 0, z));
    return { x: p.x, z: p.z };
  };
  for (const lane of [-0.65, 0, 0.65]) {
    for (const direction of [-1, 1]) {
      const start = toWorld(lane, direction * 11),
        end = toWorld(lane, -direction * 11);
      const actual = movePlayer(
        start,
        end.x - start.x,
        end.z - start.z,
        world.colliders,
        world.bounds,
      );
      assert.ok(
        distance(actual, end) < 0.01,
        `walk lane ${lane}, direction ${direction}: missed by ${distance(actual, end)}`,
      );
    }
  }
  for (const f of frames)
    for (const side of [-1, 1])
      assert.equal(
        free(toWorld((side * f.width) / 2, f.z)),
        false,
        "support bases remain solid",
      );
  assert.ok(model.getObjectByName("roadside-loss-landscape"));
});

test("the workshop has an open entry, solid furniture and an inspection roof", () => {
  const lot = world.lots.get("model-picker");
  const model = lot.group.getObjectByName("monument-model-picker");
  for (let i = 0; i < 3; i++)
    assert.ok(model.getObjectByName(`workstation-${i}`));
  const roof = model.getObjectByName("workshop-roof");
  model.userData.setInspection(true);
  assert.equal(roof.visible, false);
  model.userData.setInspection(false);
  assert.equal(roof.visible, true);
  const point = (x, z) => {
    const p = lot.group.localToWorld(new T.Vector3(x, 0, z));
    return { x: p.x, z: p.z };
  };
  const a = point(0, 8),
    b = point(0, 1.5);
  const entered = movePlayer(
    a,
    b.x - a.x,
    b.z - a.z,
    world.colliders,
    world.bounds,
  );
  assert.ok(
    distance(entered, b) < 0.01,
    "walk from the sidewalk through the door",
  );
  const desk = point(0, -1.8);
  const stopped = movePlayer(
    b,
    desk.x - b.x,
    desk.z - b.z,
    world.colliders,
    world.bounds,
  );
  assert.ok(distance(stopped, desk) > 0.5, "desk and chair remain solid");
});

for (const [id, obstacle] of [
  ["nutrition", [-3.55, -1.7]],
  ["retail", [0, -3.15]],
  ["cdmx-budget", [0, -5.2]],
]) {
  test(`${id}: street approach and public space are walkable while fixtures remain solid`, () => {
    const lot = world.lots.get(id);
    const model = lot.group.getObjectByName(`monument-${id}`);
    const point = (x, z) => {
      const p = lot.group.localToWorld(new T.Vector3(x, 0, z));
      return { x: p.x, z: p.z };
    };
    const interior = point(0, 1);
    const entered = movePlayer(
      lot.entry,
      interior.x - lot.entry.x,
      interior.z - lot.entry.z,
      world.colliders,
      world.bounds,
    );
    assert.ok(
      distance(entered, interior) < 0.01,
      "continuous route from the original road through the entrance",
    );
    const target = point(...obstacle);
    const stopped = movePlayer(
      interior,
      target.x - interior.x,
      target.z - interior.z,
      world.colliders,
      world.bounds,
    );
    assert.ok(
      distance(stopped, target) > 0.5,
      "counter or civic building stops the player",
    );
    if (id !== "cdmx-budget") {
      const roof = model.getObjectByName("inspection-roof");
      model.userData.setInspection(true);
      assert.equal(roof.visible, false);
      model.userData.setInspection(false);
      assert.equal(roof.visible, true);
    }
  });
}

test("energy conductors hang between real tower terminals and keep ground clearance", () => {
  const { towers, cables } = world.districts;
  assert.equal(towers.length, 3);
  assert.equal(cables.length, 12);
  for (const cable of cables) {
    assert.ok(
      cable.minHeight > 12,
      "cables clear visitors and the energy exhibits",
    );
    assert.deepEqual(cable.points[0], cable.start);
    assert.deepEqual(cable.points.at(-1), cable.end);
    assert.ok(
      cable.minHeight < cable.start[1],
      "a cable sags between its supports",
    );
    for (const end of [cable.start, cable.end])
      assert.ok(
        towers.some((t) =>
          t.terminals.some((p) => p.distanceTo(new T.Vector3(...end)) < 1e-8),
        ),
      );
  }
});

test("the physical Mantis poster indexes every site and has an unobstructed reading position", () => {
  const poster = world.mapPoster;
  assert.deepEqual(poster.userData.posterStopIds, graph.stops);
  assert.equal(new Set(poster.userData.posterStopIds).size, 25);
  assert.ok(poster.getObjectByName("district-map-print"));
  const start = world.lots.get("mantis").entry,
    end = poster.userData.readingPoint;
  const actual = movePlayer(
    start,
    end.x - start.x,
    end.z - start.z,
    world.colliders,
    world.bounds,
  );
  assert.ok(distance(actual, end) < 0.01, "walk from Mantis to the poster");
});

test("neighborhood architecture and mathematical gardens match their districts", () => {
  const buildings = world.neighborhoodBuildings;
  assert.ok(buildings.filter((b) => b.kind === "courtyard-house").length > 30);
  const technology = buildings.filter((b) => b.kind === "technology");
  assert.ok(technology.length > 5);
  assert.ok(technology.every((b) => ["ml", "dataeng"].includes(b.cluster)));
  assert.deepEqual(
    world.districts.gardens.map((g) => g.type),
    ["mobius", "gaussian", "geometry"],
  );
  assert.ok(scene.getObjectByName("mobius-ribbon"));
});
