import * as T from "three";
import { photographicEnvironment } from "./game/photographic.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { cityProjects } from "./game/content.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createProjectLabels } from "./game/labels.js";
import { MONUMENTS, overviewFor } from "./game/monuments/catalog.js";
import { createWorld } from "./game/world.js";
import {
  clamp,
  distance,
  worldPoint,
  nearestNode,
  shortestPath,
  movePlayer,
} from "./game/navigation.js";

const $ = (id) => document.getElementById(id);
let projects = Object.fromEntries(window.PROJECTS.map((p) => [p.id, p]));
const clusters = window.CLUSTERS;
const touch = matchMedia("(pointer: coarse)").matches;
const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private browsing still works. */
    }
  },
};
const savedVisited = storage.get("idea-city-visited", []);
const visited = new Set(
  (Array.isArray(savedVisited) ? savedVisited : []).filter(
    (id) => typeof id === "string",
  ),
);
let settings = {
  quality: touch ? "low" : "balanced",
  night: false,
  sensitivity: 1,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
const savedSettings = storage.get("idea-city-settings", {});
if (savedSettings && typeof savedSettings === "object") {
  if (["low", "balanced", "high"].includes(savedSettings.quality))
    settings.quality = savedSettings.quality;
  if (typeof savedSettings.night === "boolean")
    settings.night = savedSettings.night;
  if (typeof savedSettings.reduced === "boolean")
    settings.reduced = savedSettings.reduced;
  if (Number.isFinite(savedSettings.sensitivity))
    settings.sensitivity = clamp(savedSettings.sensitivity, 0.5, 2);
}
let toastTimer;
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3500);
}
function fail(error) {
  console.error(error);
  $("failure").hidden = false;
  $("failure-message").textContent =
    "This browser could not load the 3D scene. Try reloading with WebGL enabled, or explore the same projects on the 2D map.";
}
async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

async function main() {
  const [graph, hotspots] = await Promise.all([
    json("/explore/graph.json"),
    json("/explore/hotspots.json"),
  ]);
  projects = cityProjects(window.PROJECTS, graph);
  for (const id of visited) if (!projects[id]) visited.delete(id);
  if (!Array.isArray(graph.nodes) || !graph.stops.every((id) => projects[id]))
    throw new Error("Project graph does not match the portfolio.");
  const nodes = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const scene = new T.Scene();
  const renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.shadowMap.enabled = settings.quality !== "low";
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const view = $("view");
  view.append(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "3D city. Use WASD to walk and drag to look.",
  );
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    fail(new Error("WebGL context lost"));
  });
  renderer.domElement.addEventListener("webglcontextrestored", () =>
    location.reload(),
  );
  const camera = new T.PerspectiveCamera(
    56,
    innerWidth / innerHeight,
    0.08,
    1900,
  );
  camera.rotation.order = "YXZ";
  const environment = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, 0.04).texture;
  scene.environmentIntensity = 0.45;
  environment.dispose();
  pmrem.dispose();
  await photographicEnvironment(renderer, scene);
  const world = createWorld(scene, graph, projects, hotspots);
  const projectLabels = createProjectLabels(view, world, projects);
  const renderTarget = new T.WebGLRenderTarget(innerWidth, innerHeight, {
    type: T.HalfFloatType,
    samples: Math.min(4, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.blendIntensity = 0.65;
  ao.updateGtaoMaterial({
    radius: 1.4,
    distanceExponent: 1.5,
    thickness: 1,
    samples: 8,
  });
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(
    new T.Vector2(innerWidth / 2, innerHeight / 2),
    0.12,
    0.35,
    1.4,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  function resize() {
    renderer.shadowMap.enabled = settings.quality !== "low";
    const ratio =
      settings.quality === "low"
        ? 1
        : settings.quality === "high"
          ? Math.min(
              Math.max(devicePixelRatio, 1.25),
              2.5,
              Math.sqrt(7000000 / (innerWidth * innerHeight)),
            )
          : Math.min(
              devicePixelRatio,
              2,
              Math.sqrt(4500000 / (innerWidth * innerHeight)),
            );
    renderer.setPixelRatio(ratio);
    renderer.setSize(innerWidth, innerHeight);
    composer.setPixelRatio(ratio);
    composer.setSize(innerWidth, innerHeight);
    ao.setSize(
      Math.ceil(innerWidth * ratio * 0.5),
      Math.ceil(innerHeight * ratio * 0.5),
    );
    ao.enabled = settings.quality !== "low";
    bloom.enabled = settings.quality === "high";
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();
  world.setNight(settings.night);

  let photoMode = false;
  function setPhotoMode(enabled) {
    photoMode = enabled;
    document.body.classList.toggle("photo-mode", enabled);
    $("exit-photo").hidden = !enabled;
    if (enabled && document.pointerLockElement) document.exitPointerLock();
    resetInput();
  }
  $("photo-button").addEventListener("click", () => {
    if (playing) setPhotoMode(true);
  });
  $("exit-photo").addEventListener("click", () => setPhotoMode(false));
  let overviewId = null;
  let playing = false,
    paused = false,
    yaw = 0,
    pitch = 0,
    vertical = 0,
    height = 0,
    grounded = true,
    nearby = null,
    currentStop = null,
    selected = null,
    target = null,
    route = [],
    walked = 0;
  const position = { x: 0, z: 0 },
    velocity = { x: 0, z: 0 },
    keys = new Set(),
    joystick = { x: 0, z: 0 };
  let touchSprint = false;
  const dialogs = [...document.querySelectorAll("dialog")];
  const anyDialog = () => dialogs.some((d) => d.open);
  const resetInput = () => {
    keys.clear();
    velocity.x = velocity.z = 0;
    joystick.x = joystick.z = 0;
    $("joystick").firstElementChild.style.transform = "";
  };
  const pause = () => {
    paused = true;
    resetInput();
  };
  addEventListener("blur", pause);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  function resume() {
    if (playing && !anyDialog()) {
      paused = false;
      last = performance.now();
    }
  }
  addEventListener("focus", resume);
  function requestCapture() {
    if (touch || anyDialog() || !playing) return;
    try {
      const p = renderer.domElement.requestPointerLock?.();
      p?.catch(() => toast("Drag the scene to look around. WASD still moves."));
    } catch {
      toast("Drag the scene to look around.");
    }
  }
  function showDialog(id) {
    resetInput();
    paused = true;
    document.exitPointerLock?.();
    $(id).showModal();
  }
  for (const d of dialogs) {
    d.addEventListener("close", () => {
      resetInput();
      resume();
    });
    d.querySelectorAll("[data-close]").forEach((b) =>
      b.addEventListener("click", () => d.close()),
    );
  }
  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    storage.set("idea-city-visited", [...visited]);
    toast(
      `Discovered ${projects[id].label} · ${visited.size} / ${graph.stops.length}`,
    );
  }
  function teleport(id, { notify = false } = {}) {
    const node = nodes[id];
    if (!node) return;
    const p = worldPoint(node);
    position.x = p.x;
    position.z = p.z;
    height = vertical = 0;
    grounded = true;
    resetInput();
    const center =
      world.lots.get(node.id)?.center || worldPoint(nodes[node.neighbors[0]]);
    yaw = Math.atan2(-(center.x - p.x), -(center.z - p.z));
    pitch = -0.06;
    history.replaceState(null, "", `#${id}`);
    currentStop = node.project || null;
    if (notify) {
      toast(`Arrived at ${node.label || "the district"}`);
      clearRoute();
    }
  }
  let hash;
  try {
    hash = decodeURIComponent(location.hash.slice(1));
  } catch {
    hash = "";
  }
  teleport(nodes[hash] ? hash : "itam");
  addEventListener("hashchange", () => {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (nodes[id]) teleport(id);
  });
  $("enter").disabled = false;
  $("enter").textContent = "Enter the district  →";
  $("enter").addEventListener("click", () => {
    playing = true;
    paused = false;
    document.body.classList.add("playing");
    $("welcome").hidden = true;
    $("touch-controls").hidden = !touch;
    requestCapture();
  });
  view.addEventListener("click", () => {
    if (playing) {
      resume();
      requestCapture();
    }
  });
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement && playing && !anyDialog()) {
      resetInput();
      toast("Mouse released. Click to look, or drag the scene.");
    }
  });
  document.addEventListener("pointerlockerror", () =>
    toast("Mouse capture unavailable. Drag the scene to look."),
  );
  let lookPointer = null,
    lastX = 0,
    lastY = 0;
  function look(dx, dy) {
    if (overviewId) return;
    yaw -= dx * 0.0021 * settings.sensitivity;
    pitch = clamp(pitch - dy * 0.0021 * settings.sensitivity, -1.35, 1.35);
  }
  document.addEventListener("mousemove", (e) => {
    if (
      playing &&
      !paused &&
      document.pointerLockElement === renderer.domElement
    )
      look(e.movementX, e.movementY);
  });
  view.addEventListener("pointerdown", (e) => {
    if (!playing || anyDialog()) return;
    resume();
    if (document.pointerLockElement) return;
    lookPointer = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener("pointermove", (e) => {
    if (e.pointerId !== lookPointer || paused) return;
    look(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const endLook = () => {
    lookPointer = null;
  };
  view.addEventListener("pointerup", endLook);
  view.addEventListener("pointercancel", endLook);
  function jump() {
    if (grounded && playing && !paused && !overviewId) {
      vertical = 7;
      grounded = false;
    }
  }
  document.addEventListener("keydown", (e) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement
    )
      return;
    if (e.code === "KeyM" && !e.repeat) {
      e.preventDefault();
      if ($("map-dialog").open) $("map-dialog").close();
      else if (!anyDialog()) openMap();
      return;
    }
    if (anyDialog()) return;
    if (e.code === "Escape") {
      if (photoMode) {
        setPhotoMode(false);
        return;
      }
      if (overviewId) {
        setMonumentOverview(false);
        return;
      }
      if (playing) showDialog("settings-dialog");
      return;
    }
    if (!playing) return;
    if (e.code === "KeyP" && !e.repeat) {
      setPhotoMode(!photoMode);
      return;
    }
    if (e.code === "KeyV" && !e.repeat && nearby) {
      e.preventDefault();
      setMonumentOverview(!overviewId);
      return;
    }
    if (
      overviewId &&
      ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown"].includes(e.code)
    )
      setMonumentOverview(false);
    if (
      [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
      ].includes(e.code)
    )
      e.preventDefault();
    resume();
    keys.add(e.code);
    if (e.code === "Space" && !e.repeat) jump();
    if (e.code === "KeyE" && !e.repeat && nearby) readProject(nearby);
  });
  document.addEventListener("keyup", (e) => keys.delete(e.code));
  let joyPointer = null;
  function moveJoy(e) {
    const r = $("joystick").getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2,
      z = e.clientY - r.top - r.height / 2;
    const mag = Math.hypot(x, z),
      ratio = mag > 36 ? 36 / mag : 1;
    joystick.x = (x * ratio) / 36;
    joystick.z = (z * ratio) / 36;
    $("joystick").firstElementChild.style.transform =
      `translate(${x * ratio}px,${z * ratio}px)`;
  }
  $("joystick").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    joyPointer = e.pointerId;
    $("joystick").setPointerCapture(e.pointerId);
    moveJoy(e);
    resume();
  });
  $("joystick").addEventListener("pointermove", (e) => {
    if (e.pointerId === joyPointer) moveJoy(e);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    $("joystick").addEventListener(event, () => {
      joyPointer = null;
      joystick.x = joystick.z = 0;
      $("joystick").firstElementChild.style.transform = "";
    });
  $("touch-jump").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  $("touch-run").addEventListener("click", () => {
    touchSprint = !touchSprint;
    $("touch-run").setAttribute("aria-pressed", String(touchSprint));
  });

  function readProject(id) {
    if (!projects[id]) return;
    visit(id);
    const p = projects[id];
    $("project-cluster").textContent =
      `${clusters[p.cluster]?.name || "ABOUT"} / ${p.kind}`;
    $("project-cluster").style.color = world.lots.get(id).color;
    $("project-title").textContent = p.title;
    $("project-meta").textContent = p.meta || "";
    $("project-body").replaceChildren(
      ...p.body.map((text) => {
        const para = document.createElement("p");
        para.textContent = text;
        return para;
      }),
    );
    $("project-note").textContent = p.note || "";
    $("project-note").hidden = !p.note;
    $("project-links").replaceChildren(
      ...(p.links || []).map((link) => {
        const a = document.createElement("a");
        a.textContent = link.label + " ↗";
        const url = new URL(link.href, location.origin);
        if (["https:", "http:"].includes(url.protocol)) a.href = url.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        return a;
      }),
    );
    showDialog("project-dialog");
  }
  $("read-button").addEventListener("click", () => {
    if (nearby) readProject(nearby);
  });
  function setMonumentOverview(enabled) {
    if (enabled && !nearby) return;
    overviewId = enabled ? nearby : null;
    $("monument-guide").hidden = !enabled;
    if (enabled) {
      const definition = MONUMENTS[overviewId];
      $("monument-guide-title").textContent = definition[1];
      $("monument-guide-text").textContent = definition[2];
      $("monument-guide").open = innerWidth >= 1100;
    }
    resetInput();
    document.body.classList.toggle("monument-overview", enabled);
    $("monument-view").textContent = enabled
      ? "Return to street · V / Esc"
      : nearby === "fantasy-draft"
        ? "View stadium · V"
        : "View monument · V";
    $("monument-view").setAttribute("aria-pressed", String(enabled));
    if (enabled && document.pointerLockElement) document.exitPointerLock();
  }
  $("monument-view").addEventListener("click", () =>
    setMonumentOverview(!overviewId),
  );
  function openMap() {
    updateDirectory();
    drawAtlas();
    showDialog("map-dialog");
  }
  $("map-button").addEventListener("click", openMap);
  $("mini-button").addEventListener("click", openMap);
  $("settings-button").addEventListener("click", () =>
    showDialog("settings-dialog"),
  );
  function select(id) {
    selected = id;
    const p = projects[id];
    $("route-choice").hidden = false;
    $("choice-cluster").textContent = clusters[p.cluster]?.name || "ABOUT";
    $("choice-title").textContent = p.title;
    $("choice-meta").textContent = p.meta || "";
    updateDirectory();
    drawAtlas();
  }
  function updateDirectory() {
    const query = $("search").value.toLowerCase().trim();
    const matches = graph.stops.filter((id) => {
      const p = projects[id];
      return [p.title, p.label, p.cluster, clusters[p.cluster]?.name, p.meta]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    $("project-list").replaceChildren(
      ...matches.map((id) => {
        const p = projects[id],
          b = document.createElement("button");
        b.className = selected === id ? "selected" : "";
        const dot = document.createElement("i");
        dot.style.background = world.lots.get(id).color;
        const name = document.createElement("span");
        name.textContent = p.label;
        const seen = document.createElement("span");
        seen.textContent = visited.has(id) ? "✓" : "↗";
        b.append(dot, name, seen);
        b.addEventListener("click", () => select(id));
        return b;
      }),
    );
    if (!matches.length) {
      const p = document.createElement("p");
      p.textContent = "No projects match that search.";
      $("project-list").append(p);
    }
  }
  $("search").addEventListener("input", updateDirectory);
  const svgNS = "http://www.w3.org/2000/svg";
  function svg(name, attrs) {
    const e = document.createElementNS(svgNS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function drawAtlas() {
    const el = $("atlas");
    el.replaceChildren();
    for (const r of graph.roads) {
      const a = nodes[r.from],
        b = nodes[r.to];
      el.append(
        svg("line", {
          x1: a.x,
          y1: 360 - a.y,
          x2: b.x,
          y2: 360 - b.y,
          stroke: "#42606f",
          "stroke-width": 2,
        }),
      );
    }
    if (route.length) {
      el.append(
        svg("polyline", {
          points: route
            .map((id) => `${nodes[id].x},${360 - nodes[id].y}`)
            .join(" "),
          fill: "none",
          stroke: "#edc594",
          "stroke-width": 3,
        }),
      );
    }
    for (const id of graph.stops) {
      const n = nodes[id],
        a = svg("a", {
          href: `#${id}`,
          "aria-label": `Select ${projects[id].label}`,
        });
      a.append(
        svg("circle", {
          cx: n.x,
          cy: 360 - n.y,
          r: id === selected ? 7 : 4.5,
          fill: world.lots.get(id).color,
          stroke: visited.has(id) ? "#fff" : "#112835",
          "stroke-width": 1.5,
        }),
      );
      const title = svg("title", {});
      title.textContent = projects[id].label;
      a.append(title);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        select(id);
      });
      el.append(a);
    }
    const player = svg("circle", {
      cx: position.x,
      cy: position.z + 360,
      r: 5,
      fill: "#fff",
      stroke: "#edc594",
      "stroke-width": 3,
    });
    el.append(player);
    if (selected) {
      const n = nodes[selected],
        label = svg("text", {
          x: clamp(n.x, 60, 415),
          y: 360 - n.y - 14,
          fill: "#fff",
          "font-size": 11,
          "text-anchor": "middle",
        });
      label.textContent = projects[selected].label;
      el.append(label);
    }
  }
  $("legend").replaceChildren(
    ...Object.entries(clusters).map(([id, c]) => {
      const span = document.createElement("span"),
        i = document.createElement("i");
      i.style.background = c.color;
      span.append(i, document.createTextNode(c.name));
      return span;
    }),
  );
  const routeMarkers = new T.InstancedMesh(
    new T.SphereGeometry(0.18, 6, 4),
    new T.MeshBasicMaterial({ color: "#ffe1a7" }),
    1200,
  );
  routeMarkers.count = 0;
  scene.add(routeMarkers);
  const marker = new T.Object3D();
  function refreshRoute() {
    if (!target) return;
    route = shortestPath(graph, nearestNode(graph, position).id, target);
    const points = [position, ...route.map((id) => worldPoint(nodes[id]))];
    let i = 0;
    for (let j = 1; j < points.length; j++) {
      const a = points[j - 1],
        b = points[j],
        len = distance(a, b);
      for (let t = 1; t < len && i < 1200; t += 2.6) {
        marker.position.set(
          a.x + ((b.x - a.x) * t) / len,
          0.35,
          a.z + ((b.z - a.z) * t) / len,
        );
        marker.updateMatrix();
        routeMarkers.setMatrixAt(i++, marker.matrix);
      }
    }
    routeMarkers.count = i;
    routeMarkers.instanceMatrix.needsUpdate = true;
    routeMarkers.computeBoundingSphere();
  }
  function clearRoute() {
    target = null;
    route = [];
    routeMarkers.count = 0;
    $("destination").hidden = true;
  }
  $("clear-route").addEventListener("click", clearRoute);
  $("navigate").addEventListener("click", () => {
    if (!selected) return;
    target = selected;
    refreshRoute();
    $("destination").hidden = false;
    $("destination-name").textContent = projects[target].label;
    $("map-dialog").close();
    if (!playing) $("enter").click();
    toast("Follow the amber lights to your destination.");
  });
  $("travel").addEventListener("click", () => {
    if (!selected) return;
    teleport(selected, { notify: true });
    $("map-dialog").close();
    if (!playing) $("enter").click();
  });
  function applySettings() {
    storage.set("idea-city-settings", settings);
    world.setNight(settings.night);
    resize();
  }
  $("time-setting").value = settings.night ? "night" : "dusk";
  $("quality-setting").value = settings.quality;
  $("sensitivity-setting").value = settings.sensitivity;
  $("motion-setting").checked = settings.reduced;
  $("time-setting").addEventListener("change", (e) => {
    settings.night = e.target.value === "night";
    applySettings();
  });
  $("quality-setting").addEventListener("change", (e) => {
    settings.quality = e.target.value;
    applySettings();
  });
  $("sensitivity-setting").addEventListener("input", (e) => {
    settings.sensitivity = Number(e.target.value);
    storage.set("idea-city-settings", settings);
  });
  $("motion-setting").addEventListener("change", (e) => {
    settings.reduced = e.target.checked;
    storage.set("idea-city-settings", settings);
  });
  const map = $("minimap"),
    ctx = map.getContext("2d");
  function drawMinimap() {
    const w = map.width,
      h = map.height,
      s = 0.79,
      ox = 22,
      oy = 8;
    const pt = (p) => [ox + p.x * s, oy + (p.z + 360) * s];
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 2;
    for (const r of graph.roads) {
      ctx.strokeStyle = "#54717e88";
      ctx.beginPath();
      ctx.moveTo(...pt(worldPoint(nodes[r.from])));
      ctx.lineTo(...pt(worldPoint(nodes[r.to])));
      ctx.stroke();
    }
    if (route.length) {
      ctx.strokeStyle = "#edc594";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(...pt(position));
      for (const id of route) ctx.lineTo(...pt(worldPoint(nodes[id])));
      ctx.stroke();
    }
    for (const id of graph.stops) {
      ctx.beginPath();
      ctx.fillStyle = world.lots.get(id).color;
      ctx.arc(
        ...pt(worldPoint(nodes[id])),
        visited.has(id) ? 3.6 : 2.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    const [x, y] = pt(position);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-yaw);
    ctx.fillStyle = "#f6e4c8";
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function updateNearby() {
    let best = null,
      bestDistance = Infinity;
    for (const [id, lot] of world.lots) {
      const d = Math.min(
        distance(position, lot.entry),
        Math.max(0, distance(position, lot.center) - 8.5),
      );
      if (d < bestDistance) {
        bestDistance = d;
        best = id;
      }
    }
    if (overviewId && best !== overviewId) setMonumentOverview(false);
    currentStop = best;
    nearby = bestDistance < 9 ? best : null;
    const p = projects[best];
    $("district").textContent = (
      clusters[p.cluster]?.name || "THE DISTRICT"
    ).toUpperCase();
    $("district").style.color = world.lots.get(best).color;
    $("place").textContent = p.label;
    $("progress").textContent =
      `${visited.size} / ${graph.stops.length} places discovered`;
    $("interaction").hidden = !nearby || !playing || anyDialog();
    $("monument-view").hidden = !nearby;
    $("monument-guide").hidden = !overviewId || anyDialog();
    if (!overviewId)
      $("monument-view").textContent =
        nearby === "fantasy-draft" ? "View stadium · V" : "View monument · V";
    if (nearby) $("nearby-name").textContent = projects[nearby].label;
    if (playing && bestDistance < 9) visit(best);
    if (target) {
      const length =
        distance(position, worldPoint(nodes[route[0] || target])) +
        route
          .slice(1)
          .reduce(
            (s, id, i) =>
              s + distance(worldPoint(nodes[id]), worldPoint(nodes[route[i]])),
            0,
          );
      $("destination-distance").textContent =
        `${Math.round(length)} m along the streets`;
      if (distance(position, worldPoint(nodes[target])) < 7) {
        toast(`You’ve reached ${projects[target].label}. Press E to explore.`);
        clearRoute();
      }
    }
    const degrees = ((((yaw * 180) / Math.PI) % 360) + 360) % 360;
    const labels = ["N", "NW", "W", "SW", "S", "SE", "E", "NE"];
    $("compass").textContent =
      `${labels[Math.round(degrees / 45) % 8]}  ·  ${Math.round((360 - degrees) % 360)}°`;
    drawMinimap();
  }
  let last = performance.now(),
    elapsed = 0,
    lastHud = -1,
    lastRoute = -2;
  let frameCount = 0,
    frameSum = 0,
    fps = 0;
  // Read-only diagnostics for performance checks and reproducible movement verification.
  window.__city = {
    getState: () => ({
      position: { ...position, y: height + 1.75 },
      playing,
      paused,
      grounded,
      nearby,
      currentStop,
      target,
      route: [...route],
      visited: [...visited],
      quality: settings.quality,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      fps: Math.round(fps),
      buildings: world.buildingCount,
      colliders: world.colliders.length,
    }),
  };
  function frame(now) {
    const raw = (now - last) / 1000,
      dt = Math.min(Math.max(raw, 0), 0.05);
    last = now;
    if (!document.hidden) {
      elapsed += dt;
      frameSum += raw;
      frameCount++;
      if (frameSum >= 1) {
        fps = frameCount / frameSum;
        $("performance").textContent =
          `${Math.round(fps)} frames/s · ${settings.quality} graphics`;
        frameSum = frameCount = 0;
      }
    }
    if (playing && !paused && !anyDialog() && !overviewId) {
      const strafe =
        (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0) + joystick.x;
      const forward =
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        joystick.z;
      if (keys.has("ArrowLeft")) yaw += dt * 1.6;
      if (keys.has("ArrowRight")) yaw -= dt * 1.6;
      const length = Math.max(1, Math.hypot(strafe, forward)),
        speed =
          keys.has("ShiftLeft") || keys.has("ShiftRight") || touchSprint
            ? 18
            : 8.5;
      const desiredX =
        ((Math.cos(yaw) * strafe - Math.sin(yaw) * forward) / length) * speed;
      const desiredZ =
        ((-Math.sin(yaw) * strafe - Math.cos(yaw) * forward) / length) * speed;
      const smooth = 1 - Math.exp(-dt * 13);
      velocity.x += (desiredX - velocity.x) * smooth;
      velocity.z += (desiredZ - velocity.z) * smooth;
      const next = movePlayer(
        position,
        velocity.x * dt,
        velocity.z * dt,
        world.colliders,
        world.bounds,
      );
      walked += distance(position, next);
      position.x = next.x;
      position.z = next.z;
      if (!grounded) {
        vertical -= 19 * dt;
        height += vertical * dt;
        if (height <= 0) {
          height = vertical = 0;
          grounded = true;
        }
      }
    }
    const bob =
      playing && !paused && grounded && !settings.reduced && !photoMode
        ? Math.sin(walked * 2.7) *
          Math.min(0.035, Math.hypot(velocity.x, velocity.z) * 0.004)
        : 0;
    if (playing) {
      camera.position.set(position.x, 1.75 + height + bob, position.z);
      camera.rotation.set(pitch, yaw, 0, "YXZ");
    } else {
      camera.position.set(position.x + 19, 13, position.z + 23);
      camera.lookAt(position.x, 5, position.z - 15);
    }
    if (overviewId) {
      const lot = world.lots.get(overviewId);
      const view = overviewFor(overviewId);
      camera.position.copy(lot.group.localToWorld(new T.Vector3(...view.eye)));
      camera.lookAt(lot.group.localToWorld(new T.Vector3(...view.target)));
    }
    const desiredFov =
      playing && !settings.reduced && Math.hypot(velocity.x, velocity.z) > 10
        ? 75
        : 56;
    if (Math.abs(camera.fov - desiredFov) > 0.05) {
      camera.fov += (desiredFov - camera.fov) * (1 - Math.exp(-dt * 4));
      camera.updateProjectionMatrix();
    }
    world.update(
      elapsed,
      camera,
      settings.reduced || paused || document.hidden,
    );
    projectLabels.update(
      camera,
      playing && !anyDialog() && !overviewId && !photoMode,
    );
    if (elapsed - lastHud > 0.12) {
      updateNearby();
      lastHud = elapsed;
    }
    if (target && elapsed - lastRoute > 1.5) {
      refreshRoute();
      lastRoute = elapsed;
    }
    if (!document.hidden) {
      if (settings.quality !== "low") composer.render();
      else renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
main().catch(fail);
