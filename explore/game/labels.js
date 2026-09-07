import * as T from "three";

// Text remains browser-rendered at native screen resolution, independent of WebGL quality.
export function createProjectLabels(view, world, projects) {
  const layer = document.createElement("div");
  layer.className = "world-labels";
  layer.setAttribute("aria-hidden", "true"); // The map/project dialog supplies accessible equivalents.
  view.append(layer);
  const entries = [...world.lots.values()].map((lot) => {
    const el = document.createElement("div");
    el.className = "world-label";
    el.style.setProperty("--label-color", lot.color);
    const title = document.createElement("strong");
    title.textContent = projects[lot.id].label;
    const range = document.createElement("span");
    el.append(title, range);
    layer.append(el);
    return {
      lot,
      el,
      range,
      point: new T.Vector3(lot.center.x, 11.5, lot.center.z),
    };
  });
  const projected = new T.Vector3(),
    ray = new T.Ray(),
    direction = new T.Vector3();
  const hit = new T.Vector3(),
    box = new T.Box3();
  return {
    update(camera, visible) {
      layer.hidden = !visible;
      if (!visible) return;
      camera.updateMatrixWorld();
      const width = view.clientWidth,
        height = view.clientHeight;
      const occupied = [];
      const candidates = entries
        .map((entry) => ({
          entry,
          distance: camera.position.distanceTo(entry.point),
        }))
        .sort((a, b) => a.distance - b.distance);
      for (const { entry, distance } of candidates) {
        const { el, point, range, lot } = entry;
        el.hidden = true;
        if (distance > 115 || occupied.length >= 4) continue;
        projected.copy(point).project(camera);
        if (
          projected.z < -1 ||
          projected.z > 1 ||
          Math.abs(projected.x) > 0.92 ||
          Math.abs(projected.y) > 0.78
        )
          continue;
        direction.copy(point).sub(camera.position).normalize();
        ray.set(camera.position, direction);
        const blocked = world.colliders.some((b) => {
          // Do not hide a landmark's own label behind its pedestal/building.
          if (
            lot.center.x >= b.minX &&
            lot.center.x <= b.maxX &&
            lot.center.z >= b.minZ &&
            lot.center.z <= b.maxZ
          )
            return false;
          box.min.set(b.minX, 0, b.minZ);
          box.max.set(b.maxX, b.height ?? 7, b.maxZ);
          return (
            ray.intersectBox(box, hit) &&
            camera.position.distanceTo(hit) < distance - 1
          );
        });
        if (blocked) continue;
        const x = Math.round(((projected.x + 1) * width) / 2);
        const y = Math.max(150, Math.round(((1 - projected.y) * height) / 2));
        const labelWidth = Math.min(220, width - 32);
        if (x < labelWidth / 2 + 12 || x > width - labelWidth / 2 - 12)
          continue;
        if (
          occupied.some(
            (p) =>
              Math.abs(x - p.x) < labelWidth + 12 && Math.abs(y - p.y) < 72,
          )
        )
          continue;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        range.textContent = `${Math.round(distance)} m`;
        el.hidden = false;
        occupied.push({ x, y });
      }
    },
  };
}
