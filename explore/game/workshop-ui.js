import { CASES, evaluateSelection } from "./model-selection.js";
export function bindWorkshop(workshop) {
  const $ = (id) => document.getElementById(id);
  let stage = 0,
    previous = "",
    result = null;
  const reset = () => {
    stage = 0;
    result = null;
    $("workshop-step").textContent = "1 · Inspect data";
    $("workshop-status").textContent =
      "Choose your constraints, then step through the three agents.";
    $("workshop-results").hidden = true;
    workshop.userData.setDemo(0, null);
  };
  for (const id of ["miss-cost", "model-budget"])
    $(id).addEventListener("change", reset);
  $("workshop-step").addEventListener("click", () => {
    if (stage === 3) {
      reset();
      return;
    }
    stage++;
    result = evaluateSelection(
      Number($("miss-cost").value),
      Number($("model-budget").value),
    );
    if (stage === 1) {
      $("workshop-status").textContent =
        `Data agent: ${CASES.length} labeled cases, 8 positive and 16 negative. A false alarm costs 1; a missed positive costs ${result.missCost}.`;
      $("workshop-step").textContent = "2 · Check candidates";
    } else if (stage === 2) {
      const names = result.rows
        .filter((r) => r.eligible)
        .map((r) => r.name)
        .join(", ");
      $("workshop-status").textContent =
        `Model agent: budget ${result.budget} compute units. Eligible candidates: ${names}.`;
      $("workshop-step").textContent = "3 · Evaluate and choose";
    } else {
      $("workshop-status").textContent =
        `Eval agent selects ${result.winner.name}: loss ${result.winner.loss}. Lower loss wins within the budget; ties prefer lower compute cost.`;
      $("workshop-results").hidden = false;
      $("workshop-rows").replaceChildren(
        ...result.rows.map((row) => {
          const tr = document.createElement("tr");
          for (const text of [
            row.name,
            row.fp,
            row.fn,
            row.loss,
            `${row.cost}${row.eligible ? "" : " · over budget"}`,
          ]) {
            const td = document.createElement("td");
            td.textContent = String(text);
            tr.append(td);
          }
          if (row.name === result.winner.name) tr.className = "selected-model";
          return tr;
        }),
      );
      $("workshop-memory").textContent = previous
        ? `Previous run: ${previous}`
        : "First run recorded. Change a constraint to compare another recommendation.";
      previous = `${result.winner.name}, loss ${result.winner.loss}, miss cost ${result.missCost}, budget ${result.budget}.`;
      $("workshop-step").textContent = "Start another experiment";
    }
    workshop.userData.setDemo(stage, result);
  });
  reset();
}
