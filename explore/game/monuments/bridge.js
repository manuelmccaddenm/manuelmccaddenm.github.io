import * as T from "three";
import { M, mat } from "./kit.js";

// Recreates the panorama-era sequence as street architecture that can be traversed.
export function autoencoderBridge(k) {
  const { root, group, box, rod, label, curve, pulse, ring } = k;
  const ribs = group("encoder-decoder-bridge");
  const green = mat("#60e3bd", 0.8, 0.35);
  const frames = Array.from({ length: 13 }, (_, i) => {
    const u = Math.abs((i - 6) / 6) ** 1.4;
    return { z: 9.3 - i * 1.55, width: 4.2 + 5.8 * u, height: 4.8 + 3.4 * u };
  });
  root.userData.solidFootprints = [];
  for (const [i, f] of frames.entries()) {
    const frame = group(`bridge-rib-${i}`, 0, 0, f.z, ribs);
    box(0, f.height, 0, f.width + 0.38, 0.38, 0.38, M.steel, 0, frame);
    box(0, f.height - 0.21, 0.04, f.width - 0.35, 0.045, 0.1, green, 0, frame);
    for (const side of [-1, 1]) {
      const x = (side * f.width) / 2;
      box(x, f.height / 2, 0, 0.38, f.height, 0.38, M.steel, 0, frame);
      box(x, 0.13, 0, 0.7, 0.3, 0.7, M.stone, 0, frame);
      box(
        x - side * 0.21,
        f.height / 2,
        0.05,
        0.045,
        f.height - 0.5,
        0.1,
        green,
        0,
        frame,
      );
      root.userData.solidFootprints.push({ x, z: f.z, w: 0.7, d: 0.7 });
      for (const dz of [-0.23, 0.23])
        box(x, 0.3, dz, 0.12, 0.08, 0.12, M.orange, 0, frame);
      if (i < frames.length - 1) {
        const next = frames[i + 1],
          nx = (side * next.width) / 2;
        rod([x, f.height, f.z], [nx, next.height, next.z], 0.11, M.steel, ribs);
        rod(
          [x, f.height - 0.85, f.z],
          [nx, next.height, next.z],
          0.055,
          M.steel,
          ribs,
        );
      }
    }
  }
  // Five overhead signal paths physically contract through z and reconstruct beyond it.
  for (let lane = -2; lane <= 2; lane++) {
    const path = curve(
      frames.map((f) => [(lane * (f.width - 1)) / 5, f.height - 0.5, f.z]),
      "#60e3bd",
    );
    pulse(path, "#ffd58c", 0.1 + (lane + 2) * 0.015);
  }
  label("AUTOENCODER BRIDGE", 0, 8.24, 9.52, 9.2, 0.7, "#60e3bd");
  label("ENCODER · INPUT", 0, 7.65, 9.52, 7.6, 0.4);
  label("z · LATENT", 0, 4.8, 0.23, 3.2, 0.42, "#ffbd73");
  label("DECODER · RECONSTRUCTION", 0, 8.22, -9.08, 9.2, 0.52);
  const reverse = label(
    "AUTOENCODER BRIDGE",
    0,
    8.24,
    -9.52,
    9.2,
    0.7,
    "#60e3bd",
  );
  reverse.rotation.y = Math.PI;

  // A roadside companion, as in the original design: loss geometry and a Dogleg step.
  const bay = group("roadside-loss-landscape");
  box(8.4, 0.1, 0, 5.8, 0.22, 2.1, M.stone, 0, bay);
  for (const x of [6, 10.8])
    box(x, 2.2, -0.3, 0.16, 4.4, 0.16, M.steel, 0, bay);
  const loss = (u, v) => 1.4 * ((u - 0.6) ** 2 * 2 + (v - 0.45) ** 2);
  const point = (u, v) => [5.8 + u * 5.2, 0.8 + v * 3.2, 0.3 + loss(u, v)];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    curve(
      Array.from({ length: 21 }, (_, j) => point(t, j / 20)),
      "#519f91",
      bay,
      0.013,
    );
    curve(
      Array.from({ length: 21 }, (_, j) => point(j / 20, t)),
      "#519f91",
      bay,
      0.013,
    );
  }
  const steps = [
    [0.18, 0.85],
    [0.32, 0.62],
    [0.58, 0.46],
  ].map(([u, v]) => {
    const p = point(u, v);
    p[2] += 0.08;
    return p;
  });
  // Piecewise linear path keeps the defining bend of a Dogleg step.
  for (let i = 1; i < steps.length; i++)
    rod(steps[i - 1], steps[i], 0.045, M.orange, bay);
  const step = new T.CurvePath();
  for (let i = 1; i < steps.length; i++)
    step.add(
      new T.LineCurve3(
        new T.Vector3(...steps[i - 1]),
        new T.Vector3(...steps[i]),
      ),
    );
  pulse(step, "#ffc275", 0.18);
  ring(7.7, 2.6, 1.6, 1.1, "#ffbd73", false, bay);
  label("LOSS LANDSCAPE · DOGLEG", 8.4, 4.5, 0.5, 6, 0.46);
  label("HAND GRADIENTS · TRUST REGION", 8.4, 0.58, 1.15, 5.9, 0.34);
  root.userData.solidFootprints.push({ x: 8.4, z: 0, w: 5.8, d: 2.1 });
  root.userData.bridgeFrames = frames;
}
