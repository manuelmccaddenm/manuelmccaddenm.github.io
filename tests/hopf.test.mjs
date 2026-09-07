import test from "node:test";
import assert from "node:assert/strict";
import { hopfPoint } from "../explore/game/hopf.js";

test("local Hopf portraits approach the correct attractors", () => {
  assert.ok(hopfPoint(-0.16, 1.18, 50).radius < 0.001);
  assert.ok(
    Math.abs(hopfPoint(0.55, 0.08, 50).radius - Math.sqrt(0.55)) < 0.00001,
  );
  assert.ok(
    Math.abs(hopfPoint(0.55, 1.2, 50).radius - Math.sqrt(0.55)) < 0.00001,
  );
  assert.ok(hopfPoint(0, 1, 50).radius < 1);
  for (const mu of [-0.16, 0, 0.55])
    for (let t = 0; t <= 50; t += 0.5) {
      const point = hopfPoint(mu, 0.08, t);
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
});
