import { kit, mat } from "./monuments/kit.js";
import { surface } from "./surfaces.js";
import { distance, segmentDistance } from "./navigation.js";

export const localStreetLines = [
  ...Array.from({ length: 9 }, (_, i) => ({
    a: { x: -12 + i * 64, z: 12 },
    b: { x: -12 + i * 64, z: -372 },
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    a: { x: -12, z: 12 - i * 64 },
    b: { x: 500, z: 12 - i * 64 },
  })),
];

export function cityBlocks(scene, mainRoads, lots, districts, poster, sign) {
  const k = kit(scene, "neighborhood-streets", sign),
    roads = [],
    parcels = [];
  const asphalt = surface("asphalt", "#747873", 0.65, 0.15);
  const pavement = surface("plaster", "#aaa69a", 0.8, 0.12);
  const curb = mat("#a9a599"),
    joint = mat("#79786f"),
    iron = mat("#414744", 0, 0.35);
  const clear = (p) =>
    [...lots.values()].every((l) => distance(p, l.center) > 15) &&
    districts.reserved.every((r) => distance(p, r) > r.radius + 5.5) &&
    distance(p, poster.userData.position) > 9;
  for (const line of localStreetLines) {
    const length = distance(line.a, line.b),
      ux = (line.b.x - line.a.x) / length,
      uz = (line.b.z - line.a.z) / length;
    const yaw = Math.atan2(ux, uz);
    let start = null;
    for (let t = 0; t < length; t += 4) {
      const p = { x: line.a.x + ux * (t + 2), z: line.a.z + uz * (t + 2) };
      if (!clear(p)) {
        if (start) {
          roads.push({
            a: start,
            b: { x: line.a.x + ux * t, z: line.a.z + uz * t },
          });
          start = null;
        }
        continue;
      }
      if (!start) start = { x: line.a.x + ux * t, z: line.a.z + uz * t };
      k.box(p.x, 0.025, p.z, 10, 0.12, 4, pavement, yaw);
      k.box(p.x, 0.095, p.z, 6.1, 0.05, 4, asphalt, yaw);
      // Curbs and expansion joints stop at both original and local junctions.
      const junction =
        mainRoads.some((r) => segmentDistance(p, r.a, r.b) < 8) ||
        localStreetLines.some(
          (r) => r !== line && segmentDistance(p, r.a, r.b) < 7,
        );
      if (!junction)
        for (const side of [-1, 1]) {
          const x = p.x + uz * 3.2 * side,
            z = p.z - ux * 3.2 * side;
          k.box(x, 0.19, z, 0.2, 0.23, 3.97, curb, yaw);
          k.box(
            p.x + uz * 4.1 * side,
            0.091,
            p.z - ux * 4.1 * side,
            1.6,
            0.007,
            0.016,
            joint,
            yaw,
          );
          if (t % 32 === 0) {
            k.box(x - uz * 0.27 * side, 0.125, z, 0.45, 0.02, 0.85, iron, yaw);
            for (let v = -0.32; v < 0.4; v += 0.11)
              k.box(
                x - uz * 0.27 * side + ux * v,
                0.14,
                z + uz * v,
                0.39,
                0.014,
                0.027,
                curb,
                yaw,
              );
          }
        }
      if (t + 4 >= length && start) roads.push({ a: start, b: line.b });
    }
  }
  for (let x = -12; x < 499; x += 64)
    for (let z = 12; z > -371; z -= 64) {
      for (const dx of [14, 32, 50])
        for (const side of [0, 1]) {
          const p = { x: x + dx, z: z - (side ? 50 : 14) };
          const entry = { x: p.x, z: z - (side ? 64 : 0) };
          if (!roads.some((r) => segmentDistance(entry, r.a, r.b) < 0.1))
            continue;
          // Require a continuous real sidewalk at the front, including both parcel corners.
          if (
            ![-6, 6].every((dx) =>
              roads.some(
                (r) =>
                  segmentDistance({ x: entry.x + dx, z: entry.z }, r.a, r.b) <
                  0.1,
              ),
            )
          )
            continue;
          parcels.push({ position: p, yaw: side ? Math.PI : 0, entry });
        }
    }
  k.finish();
  return { roads, parcels };
}
