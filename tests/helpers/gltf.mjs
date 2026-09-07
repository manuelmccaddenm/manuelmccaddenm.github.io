import { readFileSync } from "node:fs";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// Decode the actual shipped GLB geometry. Node substitutes only the browser's
// image decoder; transforms, vertices, hierarchy and ray intersections are real.
export async function asset(name) {
  const loader = new GLTFLoader();
  loader.register(() => ({
    name: "NODE_TEXTURE_DECODE",
    loadTexture: () => Promise.resolve(new T.Texture()),
  }));
  const b = readFileSync(
    new URL(`../../explore/media/models/${name}.glb`, import.meta.url),
  );
  return (
    await loader.parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      "",
    )
  ).scene;
}
