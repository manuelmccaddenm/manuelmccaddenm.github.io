import * as T from "three";
import { kit, M } from "./monuments/kit.js";
import { worldPoint, segmentDistance } from "./navigation.js";

const colors = {
  energy: "#ac682b",
  stats: "#3b789b",
  math: "#367c67",
  ml: "#a65d7c",
  dataeng: "#b96342",
  product: "#7a6494",
};
export function posterViewingDistance(aspect, fov = 56) {
  return Math.max(5.7, 3.9 / (Math.tan((fov * Math.PI) / 360) * aspect * 0.9));
}
export function posterLayout(graph, projects) {
  return graph.stops.map((id, index) => ({
    id,
    number: index + 1,
    label: projects[id].label,
    color: colors[projects[id].cluster] || "#747967",
    node: graph.nodes.find((n) => n.id === id),
  }));
}
export function drawMapPoster(canvas, graph, projects, streets = []) {
  canvas.width = 4096;
  canvas.height = 2560;
  const ctx = canvas.getContext("2d"),
    entries = posterLayout(graph, projects);
  ctx.fillStyle = "#eee9d9";
  ctx.fillRect(0, 0, 4096, 2560);
  ctx.fillStyle = "#17352e";
  ctx.fillRect(0, 0, 4096, 355);
  ctx.fillStyle = "#dcbf79";
  ctx.font = "500 44px system-ui";
  ctx.fillText("MANUEL McCADDEN  /  A WALK THROUGH CONNECTED IDEAS", 130, 100);
  ctx.fillStyle = "#faf6e9";
  ctx.font = "700 132px system-ui";
  ctx.fillText("THE IDEA DISTRICT", 120, 255);
  ctx.fillStyle = "#274c40";
  ctx.font = "600 46px system-ui";
  ctx.fillText("25 PLACES TO EXPLORE", 2760, 465);
  const nodes = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const xy = (n) => [
    150 + (n.x / graph.bounds.w) * 2460,
    600 + (n.y / graph.bounds.h) * 1670,
  ];
  ctx.strokeStyle = "#d5d0c1";
  ctx.lineWidth = 3;
  for (const street of streets) {
    const a = xy({ x: street.a.x, y: -street.a.z }),
      b = xy({ x: street.b.x, y: -street.b.z });
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  ctx.strokeStyle = "#c1bcaa";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  for (const road of graph.roads) {
    ctx.beginPath();
    road.nodes.forEach((id, index) => {
      const [x, y] = xy(nodes[id]);
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  for (const entry of entries) {
    const [x, y] = xy(entry.node);
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fillStyle = entry.color;
    ctx.fill();
    ctx.fillStyle = "#fffdf3";
    ctx.font = "700 46px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(String(entry.number), x, y + 15);
  }
  const mantis = entries.find((e) => e.id === "mantis"),
    [mx, my] = xy(mantis.node);
  ctx.strokeStyle = "#17352e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(mx, my, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#17352e";
  ctx.textAlign = "right";
  ctx.font = "700 36px system-ui";
  ctx.fillText("YOU ARE HERE · MANTIS", mx - 58, my + 12);
  ctx.textAlign = "left";
  entries.forEach((e, index) => {
    const y = 565 + index * 67;
    ctx.fillStyle = e.color;
    ctx.fillRect(2760, y - 30, 56, 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 38px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(String(e.number), 2788, y + 3);
    ctx.textAlign = "left";
    ctx.fillStyle = "#253e34";
    ctx.font = "500 56px system-ui";
    ctx.fillText(e.label, 2845, y + 3, 1100);
  });
  ctx.fillStyle = "#516158";
  ctx.font = "500 32px system-ui";
  ctx.fillText("N ↑     Roads follow the similarity of ideas", 150, 470);
  ctx.fillText(
    "Walk to a site · E reads the project · M opens the district map",
    150,
    2440,
  );
  ctx.fillText("Original embedding layout · All 25 sites", 2760, 2440);
  return entries;
}

export function createMapPoster(scene, graph, projects, lot, colliders, sign) {
  const k = kit(scene, "mantis-map-poster", sign),
    yaw = lot.group.rotation.y,
    c = Math.cos(yaw),
    s = Math.sin(yaw);
  const routes = graph.roads.flatMap((r) =>
    r.nodes
      .slice(1)
      .map((id, i) => [
        worldPoint(graph.nodes.find((n) => n.id === r.nodes[i])),
        worldPoint(graph.nodes.find((n) => n.id === id)),
      ]),
  );
  let position, footprint;
  for (const [x, z] of [
    [-11, 7],
    [11, 7],
    [-12, 0],
    [12, 0],
    [-12, -6],
    [12, -6],
  ]) {
    const p = {
      x: lot.center.x + c * x + s * z,
      z: lot.center.z - s * x + c * z,
    };
    const hw = Math.abs(c) * 3.55 + Math.abs(s) * 0.3,
      hd = Math.abs(s) * 3.55 + Math.abs(c) * 0.3;
    const b = {
      minX: p.x - hw,
      maxX: p.x + hw,
      minZ: p.z - hd,
      maxZ: p.z + hd,
      height: 4.8,
    };
    if (routes.some(([a, end]) => segmentDistance(p, a, end) < 4.3)) continue;
    if (
      colliders.some(
        (ob) =>
          b.minX < ob.maxX + 0.8 &&
          b.maxX > ob.minX - 0.8 &&
          b.minZ < ob.maxZ + 0.8 &&
          b.maxZ > ob.minZ - 0.8,
      )
    )
      continue;
    position = p;
    footprint = b;
    break;
  }
  if (!position) throw new Error("No clear space for the Mantis map poster");
  k.root.position.set(position.x, 0, position.z);
  k.root.rotation.y = yaw;
  k.box(0, 2.7, 0, 7.1, 4.42, 0.22, M.steel);
  k.box(0, 4.98, 0, 7.45, 0.12, 0.75, M.steel);
  for (const x of [-2.9, 2.9]) {
    k.box(x, 1.35, -0.04, 0.12, 2.7, 0.22, M.steel);
    k.box(x, 0.1, 0, 0.55, 0.2, 0.65, M.stone);
  }
  const canvas = document.createElement("canvas");
  const entries = drawMapPoster(canvas, graph, projects);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 16;
  const poster = new T.Mesh(
    new T.PlaneGeometry(6.85, 4.28),
    new T.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  poster.position.set(0, 2.7, 0.13);
  poster.name = "district-map-print";
  k.root.add(poster);
  colliders.push(footprint);
  k.root.userData.posterStopIds = entries.map((e) => e.id);
  k.root.userData.position = position;
  k.root.userData.updateStreets = (streets) => {
    drawMapPoster(canvas, graph, projects, streets);
    texture.needsUpdate = true;
  };
  k.root.userData.readingPoint = {
    x: position.x + s * 4,
    z: position.z + c * 4,
  };
  k.finish();
  return k.root;
}
