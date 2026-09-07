import { urban, URBAN_STOPS } from "./urban.js";
import { kit } from "./kit.js";
import { MONUMENTS } from "./catalog.js";
import { energy } from "./energy.js";
import { science } from "./science.js";
import { learning } from "./learning.js";
import { products } from "./products.js";
export function createMonument(id, parent, sign, color) {
  const definition = MONUMENTS[id];
  if (!definition) throw new Error(`Missing monument design: ${id}`);
  const k = kit(parent, id, sign);
  if (
    ![urban, energy, science, learning, products].some((build) => build(id, k))
  )
    throw new Error(`Missing monument model: ${id}`);
  if (id === "itam") {
    k.label("ITAM · APPLIED MATHEMATICS", 0, 4.75, 1.3, 8.5, 0.5, color);
    for (const x of [-4, 4]) k.box(x, 4.45, 1.26, 0.06, 0.65, 0.07);
  } else if (id !== "autoencoder" && !URBAN_STOPS.has(id)) {
    const stand = k.group("interpretation-plaque");
    stand.position.x = -4.1;
    k.box(0, 1.04, 6.25, 3.6, 0.72, 0.14, undefined, 0, stand);
    for (const x of [-1.35, 1.35])
      k.box(x, 0.51, 6.25, 0.075, 1.02, 0.075, undefined, 0, stand);
    k.label(definition[0], 0, 1.17, 6.33, 3.35, 0.27, color, stand);
    k.label(definition[1], 0, 0.88, 6.33, 3.35, 0.18, color, stand);
  }
  // The exhibit is a designed explanation; project results remain in the original project panel.
  k.root.userData.interpretation = definition[2];
  return k.finish();
}
