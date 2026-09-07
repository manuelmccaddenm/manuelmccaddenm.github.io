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
  k.label(definition[0], 0, 8.25, -2.6, 11.8, 0.85, color);
  k.label(definition[1], 0, 7.42, -2.6, 11.8, 0.52, color);
  // The exhibit is a designed explanation; project results remain in the original project panel.
  k.root.userData.interpretation = definition[2];
  return k.finish();
}
