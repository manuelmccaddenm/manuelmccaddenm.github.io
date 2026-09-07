import test from "node:test";
import { asset } from "./helpers/gltf.mjs";
const shippedAssets = {
  architecture: await asset("architecture"),
  tree: await asset("tree"),
};
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as T from "three";
import { posterViewingDistance } from "../explore/game/map-poster.js";
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
    shippedAssets,
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
  let instances = 0;
  scene.traverse((o) => {
    if (o.isInstancedMesh) instances++;
  });
  assert.ok(instances > 10);
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

test("perforated house screens have a continuous structural path to their base", () => {
  for (const building of world.neighborhoodBuildings.filter(
    (b) => b.screenParts.length,
  )) {
    const parts = building.screenParts;
    const supported = new Set([0]);
    const touches = (a, b) =>
      Math.abs(a.x - b.x) <= (a.w + b.w) / 2 + 1e-7 &&
      Math.abs(a.y - b.y) <= (a.h + b.h) / 2 + 1e-7;
    let changed = true;
    while (changed) {
      changed = false;
      parts.forEach((p, i) => {
        if (
          !supported.has(i) &&
          [...supported].some((j) => touches(p, parts[j]))
        ) {
          supported.add(i);
          changed = true;
        }
      });
    }
    assert.equal(
      supported.size,
      parts.length,
      "every visible block touches supported structure",
    );
  }
});

test("neighborhood roads can be walked and houses face an actual sidewalk", () => {
  for (const road of world.blocks.roads) {
    const end = movePlayer(
      road.a,
      road.b.x - road.a.x,
      road.b.z - road.a.z,
      world.colliders,
      world.bounds,
    );
    assert.ok(
      distance(end, road.b) < 0.01,
      `local road ${JSON.stringify(road)} is clear`,
    );
  }
  for (const b of world.neighborhoodBuildings) {
    const towards = {
      x: b.entry.x - b.position.x,
      z: b.entry.z - b.position.z,
    };
    assert.ok(towards.x * Math.sin(b.yaw) + towards.z * Math.cos(b.yaw) > 13.9);
    assert.ok(
      b.windows.some((w) => w.face === 0) &&
        b.windows.some((w) => w.face === Math.PI),
    );
  }
});

test("house window centers look through glass into recessed rooms, not a solid exterior box", () => {
  scene.updateMatrixWorld(true);
  const building = world.neighborhoodBuildings.find(
    (b) =>
      b.kind === "courtyard-house" && b.windows.some((w) => w.recess === 0.25),
  );
  const window = building.windows.find((w) => w.face === 0 && w.width > 2);
  const forward = new T.Vector3(
    Math.sin(building.yaw),
    0,
    Math.cos(building.yaw),
  );
  const right = new T.Vector3(
    Math.cos(building.yaw),
    0,
    -Math.sin(building.yaw),
  );
  const origin = new T.Vector3(...window.center)
    .addScaledVector(forward, 1)
    .addScaledVector(right, 0.35);
  const ray = new T.Raycaster(origin, forward.clone().negate(), 0, 5);
  const hits = ray.intersectObject(
    scene.getObjectByName("monument-neighborhood-buildings"),
    true,
  );
  const pane = hits.find((h) =>
    h.object.material === undefined ? false : h.object.material.transparent,
  );
  const solid = hits.find((h) => !h.object.material.transparent);
  assert.ok(
    pane && Math.abs(pane.distance - 1) < 0.03,
    "thin glass spans the opening",
  );
  assert.ok(
    solid && solid.distance > 1.15,
    "the opaque surface is inside the room",
  );
});

test("the complete poster fits landscape, square and portrait viewports", () => {
  for (const aspect of [16 / 9, 1, 0.6, 0.45]) {
    const distance = posterViewingDistance(aspect);
    const halfHeight = distance * Math.tan((56 * Math.PI) / 360);
    assert.ok(
      3.725 / (halfHeight * aspect) < 0.95,
      "both horizontal edges fit",
    );
    assert.ok(
      2.5 / halfHeight < 0.84,
      "the frame leaves vertical room for controls",
    );
  }
});

test("joined road and pedestrian surfaces have no overlapping paving across carriageways", () => {
  const { road, paving } = world.groundNetwork;
  scene.updateMatrixWorld(true);
  for (const segment of graph.roads) {
    const a = worldPoint(graph.nodes.find((n) => n.id === segment.from));
    const b = worldPoint(graph.nodes.find((n) => n.id === segment.to));
    const length = distance(a, b);
    for (let d = 0.25; d < length; d += 1.3) {
      const t = d / length;
      const ray = new T.Raycaster(
        new T.Vector3(a.x + (b.x - a.x) * t, 3, a.z + (b.z - a.z) * t),
        new T.Vector3(0, -1, 0),
      );
      assert.ok(
        ray.intersectObject(road).length,
        "continuous asphalt at road center",
      );
      assert.equal(
        ray.intersectObject(paving).length,
        0,
        "no paving slab crosses asphalt",
      );
    }
  }
  for (const lot of world.lots.values()) {
    assert.ok(
      !lot.group.children.some(
        (o) =>
          o.geometry?.type === "CylinderGeometry" ||
          o.geometry?.type === "TorusGeometry",
      ),
      "no generic raised base or metal rim",
    );
  }
  for (const surface of [road, paving]) {
    const p = surface.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++)
      assert.ok(Math.abs(p.getY(i)) < 0.0001, "ground mesh is level");
    assert.ok(surface.position.y <= 0.061, "surface sits at grade");
  }
});
