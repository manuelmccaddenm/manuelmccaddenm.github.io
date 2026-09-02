# manuelmccaddenm.github.io

Personal site, live at [manuelmccaddenm.github.io](https://manuelmccaddenm.github.io/).

Projects live on the [embeddings](https://manuelmccaddenm.github.io/embeddings/) page:
each dot is a project, positioned by a 2D multidimensional-scaling projection of hand-tagged
similarity (method and subject), then relaxed so labels don't collide. The landing page renders
the same map from `embeddings/data.js`. Static HTML, no build step (`.nojekyll`).

To preview locally (paths are root-absolute): `python3 -m http.server 8000` from the repo root.
