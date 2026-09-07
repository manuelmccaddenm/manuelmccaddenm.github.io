import * as T from "three";

// Supercritical Hopf normal form: r' = mu*r - r^3, theta' = 1.3.
// A local illustration, not numerical output from the portfolio's Leslie–Gower model.
export function hopfPoint(mu, r0, t) {
  const decay = Math.exp(-2 * mu * t);
  const radius =
    mu === 0
      ? r0 / Math.sqrt(1 + 2 * r0 * r0 * t)
      : r0 / Math.sqrt(decay + ((r0 * r0) / mu) * (1 - decay));
  return {
    x: radius * Math.cos(1.3 * t),
    y: radius * Math.sin(1.3 * t),
    radius,
  };
}

export function createHopfDisplay(parent, sign) {
  const display = new T.Group();
  display.name = "hopf-bifurcation-display";
  parent.add(display);
  function caption(text, color, x, y, w, h) {
    const label = sign(text, color, w, h);
    label.position.set(x, y, 0.08);
    display.add(label);
  }
  caption("PREDATOR–PREY", "#60e3bd", 0, 8, 8, 0.85);
  caption("HOPF BIFURCATION", "#60e3bd", 0, 7.2, 8, 0.6);
  const markers = [];
  for (const [index, mu, r0, color, title] of [
    [0, -0.16, 1.18, "#70cbff", "STABLE COEXISTENCE"],
    [1, 0.55, 0.08, "#ffbf70", "SUSTAINED OSCILLATIONS"],
  ]) {
    const x = index ? 2.45 : -2.45,
      y = 4.9;
    const panel = new T.Mesh(
      new T.PlaneGeometry(4.5, 3.7),
      new T.MeshBasicMaterial({
        color: "#10202b",
        side: T.DoubleSide,
        toneMapped: false,
      }),
    );
    panel.position.set(x, y, -0.05);
    display.add(panel);
    caption(title, color, x, 6.45, 4.5, 0.45);
    const line = (points, color) => {
      const path = new T.Line(
        new T.BufferGeometry().setFromPoints(points),
        new T.LineBasicMaterial({ color, toneMapped: false }),
      );
      display.add(path);
    };
    line(
      [new T.Vector3(x - 1.9, y, 0.01), new T.Vector3(x + 1.9, y, 0.01)],
      "#526772",
    );
    line(
      [new T.Vector3(x, y - 1.3, 0.01), new T.Vector3(x, y + 1.3, 0.01)],
      "#526772",
    );
    const toWorld = (p) => new T.Vector3(x + p.x * 1.55, y + p.y * 1.05, 0.03);
    line(
      Array.from({ length: 801 }, (_, i) =>
        toWorld(hopfPoint(mu, r0, (i / 800) * 28)),
      ),
      color,
    );
    const center = new T.Mesh(
      new T.SphereGeometry(0.055, 8, 6),
      new T.MeshBasicMaterial({ color, toneMapped: false }),
    );
    center.position.set(x, y, 0.04);
    display.add(center);
    const dot = new T.Mesh(
      new T.SphereGeometry(0.1, 12, 8),
      new T.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    );
    dot.name = index ? "limit-cycle-marker" : "stable-focus-marker";
    display.add(dot);
    markers.push({ dot, mu, r0, toWorld });
  }
  caption("ILLUSTRATIVE LOCAL PHASE PORTRAITS", "#abc4cd", 0, 3.15, 9.4, 0.4);
  const update = (t) =>
    markers.forEach(({ dot, mu, r0, toWorld }) =>
      dot.position.copy(toWorld(hopfPoint(mu, r0, (t * 0.85 + 4) % 28))),
    );
  update(0);
  return { display, update };
}
