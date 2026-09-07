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

- Branch: `codex/nfl-draft-stadium`
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
It does not include enterable interiors, multiplayer, or photorealistic assets.
Balanced renders up to native 2× resolution; High adds multisample antialiasing, higher resolution, and bloom; Balanced and High include nearby sun shadows. WebGL2 is required.
The 2D map remains available if the game cannot initialize.

The realism pass adds world-scaled procedural brick/concrete/asphalt/paving, framed
reflective windows, storefronts, cornices, rooftop equipment, sidewalk curbs, benches,
and clustered tree crowns. Native browser text labels stay sharp in every quality
mode, avoid overlapping each other, and hide behind solid buildings. Physical sign
textures use 2048-pixel, aspect-correct artwork. Night lights use a bounded pool of
six nearby lamps. All materials and lighting are generated locally with no paid
assets, map API, external image service, or server-side rendering.

The existing Render Hobby static service remains the deployment target. Preserve
its $0 build spending limit and do not add paid compute or a payment method.

The predator–prey stop contains two modeled foxes chasing six hopping rabbits in a grass habitat. This is an illustrative chase animation, not a numerical population simulation. Reduced motion keeps every animal visible in a stationary pose.

The exhibit title is Predator–Prey / Hopf Bifurcation. Paired local phase portraits illustrate attraction to an equilibrium and emergence of sustained oscillations using the supercritical normal form r′ = μr − r³. These are explanatory diagrams, not a reproduction of the notebook’s Leslie–Gower simulation. The original project panel and notebook link retain the actual study.

The fantasy draft has a miniature NFL stadium with a 120-yard field, end zones, yard lines, NFL hash spacing, yellow uprights, tiered seating, players, and a laced American football. Its jumbotron shows the actual floor/ceiling objectives from `optimization-fantasy-football-draft/optimizacion.py` (`markowitz_pick`, `upside_pick`, `_build_pick_problem`). Adjusted value includes replacement value and preferences; roster limits, remaining picks and ADP feasibility constrain each decision. The animated ribbon illustrates the 12-team snake order; it does not execute the Python optimization in the browser.

At the fantasy draft stop, “View stadium” (V) opens a raised overview of the field and optimization board. V, Escape or a movement key returns to the street.
