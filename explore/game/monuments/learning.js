import * as T from "three";
import { modelWorkshop } from "./workshop.js";
import { autoencoderBridge } from "./bridge.js";
import { M, mat } from "./kit.js";
export function learning(id, k) {
  const {
    root,
    group,
    box,
    sphere,
    cylinder,
    rod,
    label,
    flow,
    ring,
    screen,
    chart,
    server,
    animated,
  } = k;
  if (id === "autoencoder") {
    autoencoderBridge(k);
  } else if (id === "thesis") {
    box(0, 1.15, 1, 9, 0.18, 3, M.wood);
    for (const x of [-4, 4])
      for (const z of [0, 2]) box(x, 0.6, z, 0.15, 1.2, 0.15, M.steel);
    const book = group("open-research-notebook", -2.9, 1.3, 1);
    box(-0.45, 0.05, 0, 0.85, 0.12, 1.2, M.white, -0.1, book);
    box(0.45, 0.05, 0, 0.85, 0.12, 1.2, M.white, 0.1, book);
    for (let i = 0; i < 5; i++)
      box(-0.5, 0.13, -0.4 + i * 0.17, 0.6, 0.015, 0.025, M.steel, 0, book);
    for (let i = 0; i < 3; i++) {
      const x = -3.7 + i * 3.7;
      screen(x, 4, -1.3, 2.8, 2.6, ["PRIOR", "POSTERIOR", "REPRESENTATION"][i]);
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        sphere(
          x + Math.cos(a) * 0.7,
          3.85 + Math.sin(a) * 0.65,
          -1.08,
          0.12,
          0.12,
          0.12,
          [M.blue, M.orange, mat("#d890ba")][i],
        );
        rod(
          [x, 3.85, -1.08],
          [x + Math.cos(a) * 0.7, 3.85 + Math.sin(a) * 0.65, -1.08],
          0.015,
          M.glass,
        );
      }
    }
    for (const x of [1, 2.3, 3.6])
      sphere(x, 2, 1, 0.45, 0.65, 0.45, mat("#ad9dd9", 0, 0.2, 0.28));
    label("ALTERNATIVE MODELS · UNCERTAINTY", 1.2, 2.9, 1.1, 6.8, 0.45);
    label("OPEN QUESTIONS · NO CONCLUSIONS YET", 0, 0.65, 3.7, 11, 0.5);
  } else if (id === "model-picker") {
    modelWorkshop(k);
  } else if (id === "btc-streaming") {
    for (const [x, title] of [
      [-4, "BINANCE"],
      [-1, "POLYMARKET"],
    ]) {
      screen(x, 3, -2.8, 2.6, 2.4, title);
      chart(x, 2.7, -2.6, 2.3, 1.25, [
        [(t) => Math.sin(t * 13 + x) * 0.3 + t * 0.25, "#ffbf70"],
      ]);
    }
    for (let i = 0; i < 3; i++)
      server(-4 + i * 2.3, 0.8, ["KAFKA 1", "KAFKA 2", "KAFKA 3"][i], 2.1);
    server(4, -2.1, "SPARK", 3.5);
    for (let i = 0; i < 5; i++)
      box(
        3.2 + (i % 2) * 1.3,
        0.35 + Math.floor(i / 2) * 0.55,
        2.6,
        1,
        0.35,
        1,
        M.orange,
      );
    label("PARTITIONED PARQUET", 3.8, 2.5, 2.7, 4.6, 0.45);
    flow(
      [
        [-4, 2, -2],
        [-4, 2.5, 0.8],
        [-1.7, 2.5, 0.8],
        [0.6, 2.5, 0.8],
        [4, 3, -1.3],
        [4, 1.5, 2.4],
      ],
      "#ffbc6c",
    );
    label("WINDOWED FEATURES → SARIMAX → DASHBOARD", 0, 5.5, -1, 11, 0.55);
    label("SCHEMATIC STREAM · NOT LIVE MARKET DATA", 0, 0.65, 4.1, 11, 0.45);
  } else return false;
  return true;
}
