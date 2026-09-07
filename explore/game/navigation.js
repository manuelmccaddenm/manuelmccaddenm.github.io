/** Pure world-space navigation. x/east and z/south; graph y points north. */
export const worldPoint = (node) => ({ x: node.x, z: -node.y });
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function segmentDistance(p, a, b) {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = clamp(
    ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1),
    0,
    1,
  );
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}
export function shortestPath(graph, from, to) {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  if (!nodes.has(from) || !nodes.has(to)) return [];
  const costs = new Map([[from, 0]]),
    previous = new Map(),
    pending = new Set(nodes.keys());
  while (pending.size) {
    let id,
      best = Infinity;
    for (const key of pending)
      if ((costs.get(key) ?? Infinity) < best) {
        id = key;
        best = costs.get(key);
      }
    if (!id || id === to) break;
    pending.delete(id);
    for (const next of nodes.get(id).neighbors) {
      if (!pending.has(next)) continue;
      const cost =
        best + distance(worldPoint(nodes.get(id)), worldPoint(nodes.get(next)));
      if (cost < (costs.get(next) ?? Infinity)) {
        costs.set(next, cost);
        previous.set(next, id);
      }
    }
  }
  if (!costs.has(to)) return [];
  const path = [to];
  while (path[0] !== from) path.unshift(previous.get(path[0]));
  return path;
}
export function nearestNode(graph, point) {
  return graph.nodes.reduce((best, n) =>
    distance(worldPoint(n), point) < distance(worldPoint(best), point)
      ? n
      : best,
  );
}
/** Resolve a player circle against axis-aligned solid footprints, sliding along walls. */
export function movePlayer(position, dx, dz, colliders, bounds, radius = 0.48) {
  const out = { x: position.x, z: position.z };
  // Substeps prevent tunneling, including on a slow frame while sprinting.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (radius * 0.5)));
  const free = (x, z) =>
    !colliders.some((b) => {
      const px = clamp(x, b.minX, b.maxX),
        pz = clamp(z, b.minZ, b.maxZ);
      return (x - px) ** 2 + (z - pz) ** 2 < radius ** 2;
    });
  for (let i = 0; i < steps; i++) {
    const x = clamp(
      out.x + dx / steps,
      bounds.minX + radius,
      bounds.maxX - radius,
    );
    if (free(x, out.z)) out.x = x;
    const z = clamp(
      out.z + dz / steps,
      bounds.minZ + radius,
      bounds.maxZ - radius,
    );
    if (free(out.x, z)) out.z = z;
  }
  return out;
}
