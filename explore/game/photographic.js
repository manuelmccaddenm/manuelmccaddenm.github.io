import * as T from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadPhotographicSurfaces } from "./surfaces.js";

export async function photographicEnvironment(renderer, scene) {
  await loadPhotographicSurfaces();
  try {
    const hdr = await new RGBELoader().loadAsync("/explore/media/sky-hdri.hdr");
    hdr.mapping = T.EquirectangularReflectionMapping;
    const pmrem = new T.PMREMGenerator(renderer);
    const reflection = pmrem.fromEquirectangular(hdr);
    pmrem.dispose();
    scene.environment = reflection.texture;
    scene.background = hdr;
    scene.backgroundIntensity = 1.25;
    scene.backgroundBlurriness = 0;
    scene.userData.photographicSky = hdr;
  } catch (error) {
    console.warn(
      "Photographic sky unavailable; using the procedural fallback.",
      error,
    );
  }
}
