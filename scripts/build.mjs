import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
// Explicit allowlist: do not publish build tools, .git, or legacy panoramas.
await rm("dist", { recursive: true, force: true });
await mkdir("dist/explore", { recursive: true });
for (const path of [
  "index.html",
  "favicon.svg",
  ".nojekyll",
  "embeddings",
  "files",
]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
for (const path of ["graph.json", "hotspots.json", "game.css"]) {
  await cp(`explore/${path}`, `dist/explore/${path}`);
}
const result = await build({
  entryPoints: ["explore/game.js"],
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022"],
  outdir: "dist/explore/assets",
  entryNames: "[name]-[hash]",
  legalComments: "linked",
  metafile: true,
});
const entry = Object.keys(result.metafile.outputs).find((p) =>
  p.endsWith(".js"),
);
const html = (await readFile("explore/index.html", "utf8")).replace(
  "/explore/game.js",
  "/" + entry.replace(/^dist\//, ""),
);
await writeFile("dist/explore/index.html", html);
console.log(
  `Built landing, embedding map, documents, and playable city: ${entry}`,
);
