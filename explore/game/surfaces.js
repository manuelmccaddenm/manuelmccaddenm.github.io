import * as T from "three";

// Local CC0 photographed maps, with deterministic offline fallbacks.
const photographed = new Map();
const pending = [];
const flatNormal = new T.DataTexture(
  new Uint8Array([128, 128, 255, 255]),
  1,
  1,
);
const flatRough = new T.DataTexture(new Uint8Array([230, 230, 230, 255]), 1, 1);
flatNormal.needsUpdate = flatRough.needsUpdate = true;
export async function loadPhotographicSurfaces() {
  const loader = new T.TextureLoader();
  await Promise.all(
    ["asphalt", "brick", "concrete", "paving", "soil", "plaster"].map(
      async (kind) => {
        try {
          const maps = await Promise.all(
            ["diff", "nor_gl", "rough"].map(async (channel) => {
              const tex = await loader.loadAsync(
                `/explore/media/${kind}-${channel}.jpg`,
              );
              tex.wrapS = tex.wrapT = T.RepeatWrapping;
              tex.anisotropy = 8;
              tex.colorSpace =
                channel === "diff" ? T.SRGBColorSpace : T.NoColorSpace;
              return tex;
            }),
          );
          photographed.set(kind, maps);
        } catch (error) {
          console.warn(`Using procedural ${kind} fallback.`, error);
        }
      },
    ),
  );
  for (const apply of pending) apply();
}
export function surface(
  kind,
  color,
  scale = 1,
  whitening = 0.8,
  untiled = false,
) {
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
  const maps = { normal: flatNormal, rough: flatRough };
  const apply = () => {
    const set = photographed.get(kind);
    if (!set) return;
    mat.map = set[0];
    maps.normal = set[1];
    maps.rough = set[2];
    mat.color
      .set(color)
      .lerp(new T.Color("white"), kind === "asphalt" ? 0.98 : whitening);
    mat.needsUpdate = true;
  };
  pending.push(apply);
  apply();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.surfaceNormalMap = { value: maps.normal };
    shader.uniforms.surfaceRoughMap = { value: maps.rough };
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
      "varying vec3 vSurfacePosition; uniform float surfaceScale; uniform sampler2D surfaceNormalMap; uniform sampler2D surfaceRoughMap;\n" +
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
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `
      #include <roughnessmap_fragment>
      float microRough = texture2D(surfaceRoughMap, surfaceUV.zy).r * weights.x
        + texture2D(surfaceRoughMap, surfaceUV.xz).r * weights.y
        + texture2D(surfaceRoughMap, surfaceUV.xy).r * weights.z;
      roughnessFactor = clamp(microRough, .35, 1.0);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `
      #include <normal_fragment_maps>
      vec3 sx = texture2D(surfaceNormalMap, surfaceUV.zy).xyz * 2.0 - 1.0;
      vec3 sy = texture2D(surfaceNormalMap, surfaceUV.xz).xyz * 2.0 - 1.0;
      vec3 sz = texture2D(surfaceNormalMap, surfaceUV.xy).xyz * 2.0 - 1.0;
      vec3 wn = inverseTransformDirection(normal, viewMatrix);
      vec3 detail = vec3(0., sx.y, sx.x) * weights.x
        + vec3(sy.x, 0., sy.y) * weights.y + vec3(sz.x, sz.y, 0.) * weights.z;
      normal = normalize(mat3(viewMatrix) * normalize(wn + detail * .55));
    `,
    );
  };
  if (untiled) {
    const compile = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader) => {
      compile(shader);
      // Blend four offset samples over broad overlapping cells. This removes
      // visible repeat bands across the city-sized horizontal ground surface.
      shader.fragmentShader =
        `
        vec2 terrainOffset(vec2 cell) {
          return fract(sin(vec2(dot(cell, vec2(127.1, 311.7)),
            dot(cell, vec2(269.5, 183.3)))) * 43758.5453) * 19.0;
        }
        vec4 terrainSample(sampler2D imageMap, vec2 uv) {
          vec2 cell = floor(uv * .16);
          vec2 blend = smoothstep(0.0, 1.0, fract(uv * .16));
          vec4 a = texture2D(imageMap, uv + terrainOffset(cell));
          vec4 b = texture2D(imageMap, uv + terrainOffset(cell + vec2(1., 0.)));
          vec4 c = texture2D(imageMap, uv + terrainOffset(cell + vec2(0., 1.)));
          vec4 d = texture2D(imageMap, uv + terrainOffset(cell + vec2(1., 1.)));
          return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
        }
      ` + shader.fragmentShader;
      // This option is used only for the horizontal ground: avoid tripling its
      // texture lookups for the unused vertical projections.
      shader.fragmentShader = shader.fragmentShader
        .replace(
          /vec4 texel = texture2D\(map,[\s\S]*?weights.z;/,
          "vec4 texel = texture2D(map, surfaceUV.xz);",
        )
        .replace(
          /float microRough = texture2D\(surfaceRoughMap,[\s\S]*?weights.z;/,
          "float microRough = texture2D(surfaceRoughMap, surfaceUV.xz).r;",
        )
        .replace(
          /vec3 detail = vec3\(0\., sx.y,[\s\S]*?weights.z;/,
          "vec3 detail = vec3(sy.x, 0., sy.y);",
        );
      shader.fragmentShader = shader.fragmentShader.replace(
        /texture2D\((map|surfaceNormalMap|surfaceRoughMap), surfaceUV\.(zy|xz|xy)\)/g,
        "terrainSample($1, surfaceUV.$2)",
      );
    };
  }
  mat.customProgramCacheKey = () => `photographic-world-surface-v3-${untiled}`;
  return mat;
}
