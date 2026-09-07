# Manuel McCadden · The Idea District

The portfolio, embedding map, and a real-time 3D city built from the original `explore`
branch (`92bdd760e20bf8d8b8b55d737f8b5766b692eb5f`). The city uses Three.js geometry,
not Google Street View, panoramas, or a map API.

## Run

Node 22.12 or newer:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/explore/`. `/` retains the landing page and `/embeddings/`
retains the interactive map. Enter the district, use WASD to walk, Shift to sprint,
Space to jump, mouse/drag or left/right arrow keys to look, E to read a project, and
M to open the map. Touch controls include a movement stick, drag-to-look, jump, and
sprint. Click the scene to capture the mouse where supported; Escape releases it and opens the pause settings.

Project panels pause movement. The map supports search, route guidance along the
original road graph, and explicit fast travel. Discovery and graphics preferences
are saved only in this browser; no account or backend is required. Daylight/night,
reduced motion, sensitivity, and graphics quality are available in Settings.

## Build and verify

```sh
npm test
npm run build
npm run preview
```

`dist/` includes the landing, map, project documents, graph, and bundled game.
Three.js is bundled locally. No runtime dependency on a JavaScript CDN, Google Maps,
Blender, or the old panorama image set. Font loading is optional with system fallbacks.
The original panorama files and Blender scripts remain in source history/worktree for
reference but are explicitly excluded from the deployment output.

## Render

The repository contains a static-site Blueprint in `render.yaml`:

- Branch: `codex/city-integrated-monuments`
- Build: `npm ci --include=dev && npm run build`
- Publish directory: `dist`
- Playable route: `/explore/`

In Render, create a Blueprint from this repository and select the task branch, or
create a Static Site with the settings above. Render hosts the built browser game;
the user's GPU renders the 3D scene. There is no server-side GPU requirement.
Do not point the new service at `main`: that branch is an older portfolio version.
After the task branch is merged, update the service's branch deliberately.

Docs: https://render.com/docs/static-sites and https://render.com/docs/blueprint-spec

## Architecture and limits

- `embeddings/data.js`: unchanged project content, metadata, links, and cluster colors.
- `explore/graph.json`: unchanged hand-tagged similarity projection and connected roads.
- `explore/hotspots.json`: preferred original landmark centers; obstructing lots move off the roads.
- `explore/game/world.js`: deterministic city geometry, instanced buildings/street
  furniture, subject-specific animated sculptures, lighting and atmosphere.
- `explore/game/navigation.js`: graph routing, world coordinates, swept/substepped
  horizontal collision with solid footprints.
- `explore/game.js`: renderer, input, jumping, project UI, discovery, routing and map.
- `scripts/build.mjs`: explicit deployment allowlist; hashed game bundle.

This is a stylized, explorable portfolio game. It has a level ground plane and
solid building/exhibit footprints; jumping does not let the player climb buildings.
Model Picker, Nutrition5K and Retail include walkable interiors, and CDMX Budget has an open civic courtyard. Other buildings remain exterior exhibits. Multiplayer is not included. The geometry remains a modeled city; the realism pass adds photographed surface maps and a photographic sky.
Balanced renders up to native 2× resolution with contact shading; High adds higher resolution and subtle bloom. Both include nearby sun shadows. WebGL2 is required.
The 2D map remains available if the game cannot initialize.

The realism pass adds world-scaled procedural brick/concrete/asphalt/paving, framed
reflective windows, storefronts, cornices, rooftop equipment, sidewalk curbs, benches,
and clustered tree crowns. Native browser text labels stay sharp in every quality
mode, avoid overlapping each other, and hide behind solid buildings. Physical sign
textures use aspect-correct artwork up to 2048 pixels, sized to each sign. Night lights use a bounded pool of
six nearby lamps. The newer photographic pass uses locally served CC0 assets alongside procedural materials, with no paid assets, map API, runtime image service, or server-side rendering.

The existing Render Hobby static service remains the deployment target. Preserve
its $0 build spending limit and do not add paid compute or a payment method.

The predator–prey stop contains two modeled foxes chasing six hopping rabbits in a grass habitat. This is an illustrative chase animation, not a numerical population simulation. Reduced motion keeps every animal visible in a stationary pose.

The exhibit title is Predator–Prey / Hopf Bifurcation. Paired local phase portraits illustrate attraction to an equilibrium and emergence of sustained oscillations using the supercritical normal form r′ = μr − r³. These are explanatory diagrams, not a reproduction of the notebook’s Leslie–Gower simulation. The original project panel and notebook link retain the actual study.

The fantasy draft has a miniature NFL stadium with a 120-yard field, end zones, yard lines, NFL hash spacing, yellow uprights, tiered seating, players, and a laced American football. Its jumbotron shows the actual floor/ceiling objectives from `optimization-fantasy-football-draft/optimizacion.py` (`markowitz_pick`, `upside_pick`, `_build_pick_problem`). Adjusted value includes replacement value and preferences; roster limits, remaining picks and ADP feasibility constrain each decision. The animated ribbon illustrates the 12-team snake order; it does not execute the Python optimization in the browser.

At the fantasy draft stop, “View stadium” (V) opens a raised overview of the field and optimization board. V, Escape or a movement key returns to the street.


## All-monument exhibits

Every one of the 25 stops has a subject-specific exhibit and a raised inspection
view. Use **View monument / V** near a stop; V, Escape or movement returns to the
street. The collapsible **About this monument** guide connects the scene to its
method, while E retains the original project panel and source links.

`explore/game/monuments/` groups the 23 new scenes into energy, science, learning,
and product builders, with shared instanced geometry and cached materials. The
existing NFL optimization stadium and predator–prey/Hopf exhibits remain intact.
Examples include a bill-processing conveyor, a metered building cutaway, a food
scanner, a Dogleg trust region, a feasible polytope, distributed DBSCAN regions,
and a mantis sculpture over an entity graph. Animated diagrams are illustrative;
research findings and project status remain grounded in the original project text.

For visual review, run the dev server and visit `/tests/monument-gallery.html`.
It renders all 25 actual models using one WebGL context, then shows category-filtered
thumbnails. This development gallery is excluded from production output. Tests
cover every catalog entry and model bounds alongside graph navigation, collision,
animals, Hopf dynamics and NFL geometry.

The autoencoder restores the original panorama-era architectural idea: thirteen
frames straddle the existing street toward Negreira, narrowing into the latent
bottleneck before widening into reconstruction. It has no display plinth or solid
exhibit-wide collider: visitors walk through it on the actual road, while individual
support bases remain solid. Five overhead signal paths animate compression and
expansion, and a roadside loss landscape retains the Dogleg/trust-region explanation.
V provides a three-quarter architectural overview. Bridge traversal and support
collisions are covered by an additional test.


## Photographic realism pass and checkpoint

The previous city is preserved locally and on GitHub as the annotated tag
`checkpoint-before-photo-realism`, pointing to commit
`4e487b7b80c7f45e3824819a64e8a04bf3f76ecd` on `codex/autoencoder-bridge`.
The realism pass is preserved on `codex/photographic-city`; restoring the prior
Render branch selects the saved version without rewriting history.

The new renderer uses locally served photographed diffuse, normal and roughness
maps for brick, concrete, pavement, asphalt and planted soil, plus a 2K HDR sky
for the background and physically based reflections. All assets are CC0 from
Poly Haven; exact URLs and file sizes are in `explore/media/sources.json`.
The game calls no asset API at runtime. Procedural textures and a procedural sky
remain available if optional images fail to load. The asset bundle adds about
17 MB before HTTP compression, cached by the browser after the first visit.

Balanced/High include half-resolution, denoised ambient occlusion and 4096-pixel
nearby shadows. Fine instanced leaf sprays replace opaque ball-shaped crowns;
parked cars establish street scale while respecting all original walking routes.
Major display titles use physical plaques or building-mounted signage. The
camera uses a calmer 56-degree field of view; P or **Photo view** hides the HUD,
and P/Escape or the visible return button restores it. Settings displays frame
rate so visitors can choose an appropriate graphics level. Low retains the
photographic assets without the heavier postprocessing.

This is a step toward architectural photography, with browser-rendered geometry
and illustrative project exhibits still visible. It is not a path-traced offline
render or a replacement with static photographs.


## Model Picker workshop

The Model Picker monument is now a street-facing brick workshop with a glazed
front, open entrance, furnished workstations, canopy, planting and a shared run
history shelf. It occupies a rectangular sidewalk apron without a display plinth.
Visitors can walk inside; oriented wall and furniture footprints keep the doorway
clear at any building angle. V lifts the roof for inspection and restores it when
returning to the street.

The model-selection experiment has been removed, including its controls, dialog,
selection engine, run history state and scene status updates. The workshop remains
an architectural interpretation; the original project panel is available through E.

## Monuments integrated into the city

Nutrition5K is a café with a food-scanning counter, ingredient shelves, tables and
a striped street awning. Retail Intelligence is an enterable shop with stocked
shelves, a registry counter and receiving / checked / released stockroom bays.
The CDMX budget project is a civic courtyard framed by a municipal façade and
colonnades; bronze paving lines connect public-service notice boards.

These places and the Model Picker workshop have continuous paved approaches from
the original streets. Individual wall and furniture colliders allow actual walking
through their public spaces. V lifts the café and shop roofs for inspection; it
restores them on exit. All original project content, stops and roads are retained.

Validation: 22 automated tests cover navigation, original road access, bridge and
workshop traversal, the new public-space entrances and solid fixtures, roof states,
and the existing subject-specific exhibits.
