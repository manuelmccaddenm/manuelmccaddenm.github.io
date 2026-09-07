import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSelection } from "../explore/game/model-selection.js";
test("the workshop scores actual fixed predictions and changes recommendation with the objective", () => {
  const equal = evaluateSelection(1, 6);
  assert.deepEqual(
    equal.rows.map((r) => [r.fp, r.fn]),
    [
      [1, 3],
      [2, 1],
      [5, 0],
    ],
  );
  assert.equal(equal.winner.name, "Balanced model");
  assert.equal(equal.winner.loss, 3);
  assert.equal(evaluateSelection(6, 6).winner.name, "Recall-first model");
});
test("compute constraints exclude unavailable candidates and reject invalid inputs", () => {
  assert.equal(evaluateSelection(6, 3).winner.name, "Balanced model");
  assert.equal(evaluateSelection(6, 1).winner.name, "Simple rule");
  assert.equal(evaluateSelection(6, 1).winner.loss, 19);
  assert.throws(() => evaluateSelection(NaN, 6));
  assert.throws(() => evaluateSelection(1, 0));
});
