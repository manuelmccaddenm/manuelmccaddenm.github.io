# City model preparation

Runtime builds only copy the finished assets in `explore/media`; Render does not
run Blender or fetch third-party model services. All upstream assets are CC0.
`model-sources.json` records exact download URLs, local input paths and SHA-256.
Download those files to the specified paths and verify the checksums before rebuilding.

Prepared with Blender 5.2.1:

```sh
blender -b work/assets/tree/source.blend --python scripts/assets/prepare-tree.py
blender -b --python scripts/assets/prepare-architecture.py
npm test
npm run build
```

The tree pass separates bark, branches and foliage. It fits alpha-cut cards in
the source leaf UV space instead of collapsing leaf geometry into slivers. Near
and far versions keep deterministic subsets, with a larger far silhouette.
Trunk and branch meshes are decimated independently. The runtime instances trees
in spatial cells and selects LODs with hysteresis.

The architectural pass keeps fourteen compatible facade modules, retaining
meter-scale brick returns, window hardware, doors and cornices. Runtime geometry
constructs four-sided buildings within the existing collision parcels.

Visual comparison in the browser remains necessary; these automated geometry
checks cannot determine whether a scene is photorealistic.
