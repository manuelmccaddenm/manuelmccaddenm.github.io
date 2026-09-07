// Fixed illustrative holdout set. These are transparent demo predictions, not project results.
export const CASES = Object.freeze(
  Array.from({ length: 24 }, (_, i) => ({ id: i + 1, actual: i < 8 ? 1 : 0 })),
);
export const CANDIDATES = Object.freeze([
  { name: "Simple rule", cost: 1, positives: [1, 2, 3, 4, 5, 9] },
  { name: "Balanced model", cost: 3, positives: [1, 2, 3, 4, 5, 6, 7, 9, 10] },
  {
    name: "Recall-first model",
    cost: 6,
    positives: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
]);
export function evaluateSelection(missCost, budget) {
  if (
    !Number.isFinite(missCost) ||
    missCost < 1 ||
    !Number.isFinite(budget) ||
    budget < 1
  )
    throw new Error("Invalid demo constraints");
  const rows = CANDIDATES.map((model) => {
    let fp = 0,
      fn = 0;
    for (const row of CASES) {
      const predicted = model.positives.includes(row.id);
      if (predicted && !row.actual) fp++;
      if (!predicted && row.actual) fn++;
    }
    return {
      ...model,
      fp,
      fn,
      loss: fp + missCost * fn,
      eligible: model.cost <= budget,
    };
  });
  const ranked = rows
    .filter((row) => row.eligible)
    .sort((a, b) => a.loss - b.loss || a.cost - b.cost);
  return { rows, winner: ranked[0], missCost, budget };
}
