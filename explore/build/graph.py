"""Build the road graph for /explore/ from the embedding coordinates in embeddings/data.js.

Roads follow the similarity map: the relative-neighborhood graph over the project
positions (planar, connected, contains the minimum spanning tree), so every fork in the
road is a fork in meaning. Long roads are split into hops of at most HOP metres so each
panorama is one step away from the next. Output: explore/graph.json (world metres,
x east, y north; the 2D map's viewBox y is flipped).
"""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCALE = 0.5          # metres per viewBox pixel (1000x720 -> 500x360 m)
HOP = 38.0           # max metres between consecutive panorama nodes
LANDMARKS = [        # extra stops that are not projects
    {"id": "itam", "label": "ITAM", "title": "ITAM, Río Hondo", "x": 500, "y": 400, "cluster": None},
]

src = (ROOT / "embeddings" / "data.js").read_text()
pat = re.compile(
    r'id:"(?P<id>[^"]+)",\s*label:"(?P<label>[^"]+)",\s*cluster:"(?P<cluster>[^"]+)",'
    r'\s*kind:"(?P<kind>[^"]+)",\s*x:(?P<x>\d+),\s*y:(?P<y>\d+),\s*title:"(?P<title>[^"]+)"'
)
projects = [m.groupdict() for m in pat.finditer(src)]
assert len(projects) >= 20, f"parsed only {len(projects)} projects"

def world(px, py):
    return (round(float(px) * SCALE, 2), round((720 - float(py)) * SCALE, 2))

stops = []
for p in projects:
    x, y = world(p["x"], p["y"])
    stops.append({"id": p["id"], "type": "monument", "project": p["id"], "label": p["label"],
                  "title": p["title"], "cluster": p["cluster"], "kind": p["kind"], "x": x, "y": y})
for l in LANDMARKS:
    x, y = world(l["x"], l["y"])
    stops.append({"id": l["id"], "type": "landmark", "project": None, "label": l["label"],
                  "title": l["title"], "cluster": l["cluster"], "kind": "landmark", "x": x, "y": y})

def dist(a, b):
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])

# relative neighbourhood graph: keep (p,q) unless some r is closer to both than they are to each other
edges = []
for i, p in enumerate(stops):
    for j in range(i + 1, len(stops)):
        q = stops[j]
        d = dist(p, q)
        if not any(dist(p, r) < d and dist(q, r) < d for k, r in enumerate(stops) if k not in (i, j)):
            edges.append((p["id"], q["id"]))

# connectivity check (RNG is connected by construction, but assert anyway)
adj = {s["id"]: set() for s in stops}
for a, b in edges:
    adj[a].add(b); adj[b].add(a)
seen, stack = set(), [stops[0]["id"]]
while stack:
    n = stack.pop()
    if n in seen: continue
    seen.add(n); stack.extend(adj[n])
assert len(seen) == len(stops), "road graph is not connected"

# split long roads into hops
by_id = {s["id"]: s for s in stops}
nodes = {s["id"]: dict(s, neighbors=[]) for s in stops}
roads = []
def link(a, b):
    nodes[a]["neighbors"].append(b); nodes[b]["neighbors"].append(a)
for a, b in edges:
    pa, pb = by_id[a], by_id[b]
    d = dist(pa, pb)
    n = max(1, math.ceil(d / HOP))
    prev = a
    chain = [a]
    for k in range(1, n):
        t = k / n
        nid = f"{a}--{b}-{k}"
        nodes[nid] = {"id": nid, "type": "road", "project": None, "label": None, "title": None,
                      "cluster": None, "kind": "road",
                      "x": round(pa["x"] + t * (pb["x"] - pa["x"]), 2),
                      "y": round(pa["y"] + t * (pb["y"] - pa["y"]), 2), "neighbors": []}
        link(prev, nid); prev = nid; chain.append(nid)
    link(prev, b); chain.append(b)
    roads.append({"from": a, "to": b, "length": round(d, 1), "nodes": chain})

out = {
    "scale": SCALE, "hop": HOP,
    "bounds": {"w": 1000 * SCALE, "h": 720 * SCALE},
    "stops": [s["id"] for s in stops],
    "edges": edges,
    "roads": roads,
    "nodes": list(nodes.values()),
}
(ROOT / "explore" / "graph.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))

deg = sorted(((len(adj[s]), s) for s in adj), reverse=True)
print(f"{len(stops)} stops, {len(edges)} roads, {len(nodes)} panorama nodes")
print("total road length %.0f m" % sum(r["length"] for r in roads))
print("degrees:", ", ".join(f"{s}:{d}" for d, s in deg))
for a, b in edges:
    print(f"  {a:18s} - {b:18s} {dist(by_id[a], by_id[b]):5.0f} m")
