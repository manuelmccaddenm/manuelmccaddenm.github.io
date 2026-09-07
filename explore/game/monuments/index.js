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
  if (![energy, science, learning, products].some((build) => build(id, k)))
    throw new Error(`Missing monument model: ${id}`);
  if (id === "itam") {
    k.label("ITAM · APPLIED MATHEMATICS", 0, 4.75, 1.3, 8.5, 0.5, color);
    for (const x of [-4, 4]) k.box(x, 4.45, 1.26, 0.06, 0.65, 0.07);
  } else if (id !== "autoencoder") {
    const stand = k.group("interpretation-plaque");
    k.box(0, 1.55, 6.25, 6.2, 1.05, 0.15, undefined, 0, stand);
    for (const x of [-2.5, 2.5])
      k.box(x, 0.8, 6.25, 0.1, 1.55, 0.1, undefined, 0, stand);
    k.label(definition[0], 0, 1.75, 6.34, 5.9, 0.4, color);
    k.label(definition[1], 0, 1.3, 6.34, 5.9, 0.24, color);
  }
  // The exhibit is a designed explanation; project results remain in the original project panel.
  k.root.userData.interpretation = definition[2];
  return k.finish();
}
