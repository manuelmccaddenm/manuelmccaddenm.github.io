import * as T from "three";

// Small, deterministic textures, tiled in world meters instead of stretched over buildings.
// Everything is generated locally: no image service, asset downloads, or API charges.
export function surface(kind, color, scale = 1) {
  const size = 256,
    pixels = new Uint8Array(size * size * 4);
  let seed = 91;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = seed / 4294967296;
      const row = Math.floor(y / 32);
      const mortar =
        kind === "brick" && (y % 32 < 2 || (x + (row % 2) * 32) % 64 < 2);
      const joint = kind === "paving" && (x % 64 < 2 || y % 64 < 2);
      let value = 218 + noise * 30;
      if (kind === "asphalt") value = 160 + noise * 85;
      if (kind === "brick")
        value = mortar
          ? 162
          : 211 +
            noise * 29 +
            Math.sin(row * 13 + Math.floor((x + (row % 2) * 32) / 64) * 7) * 13;
      if (kind === "paving") value = joint ? 135 : 220 + noise * 25;
      const i = (y * size + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
      pixels[i + 3] = 255;
    }
  const map = new T.DataTexture(pixels, size, size);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;
  const mat = new T.MeshStandardMaterial({
    color,
    map,
    roughness: kind === "asphalt" ? 0.97 : 0.88,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.surfaceScale = { value: scale };
    shader.vertexShader =
      "varying vec3 vSurfacePosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
      vec4 surfaceVertex = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        surfaceVertex = instanceMatrix * surfaceVertex;
      #endif
      vSurfacePosition = (modelMatrix * surfaceVertex).xyz;
      #include <project_vertex>`,
    );
    shader.fragmentShader =
      "varying vec3 vSurfacePosition; uniform float surfaceScale;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
      vec3 weights = abs(normalize(cross(dFdx(vSurfacePosition), dFdy(vSurfacePosition))));
      weights = pow(weights, vec3(8.0));
      weights /= max(dot(weights, vec3(1.0)), .0001);
      vec3 surfaceUV = vSurfacePosition * surfaceScale;
      vec4 texel = texture2D(map, surfaceUV.zy) * weights.x
                 + texture2D(map, surfaceUV.xz) * weights.y
                 + texture2D(map, surfaceUV.xy) * weights.z;
      diffuseColor *= texel;`,
    );
  };
  mat.customProgramCacheKey = () => "world-surface-v1";
  return mat;
}
