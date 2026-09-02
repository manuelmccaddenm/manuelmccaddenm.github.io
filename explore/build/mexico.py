"""Export Mexico's state polygons from the Regresión Avanzada shapefile to assets/gen/mexico.json.

Pure Python (struct); no geopandas needed. Each record keeps its exterior ring, simplified to
at most MAXPTS points, tagged with its state (ADM1). Coordinates are lon/lat degrees.
"""
import json
import struct
from pathlib import Path

SRC = Path("/Users/manuelmccadden/Desktop/ITAM/Semestre_8/Regresion_Avanzada/Proyecto_final/Mexico/shapes/MEX")
OUT = Path(__file__).resolve().parent / "assets" / "gen" / "mexico.json"
MAXPTS = 48
MIN_AREA = 0.004   # square degrees; drops specks and tiny islands

def read_dbf(path):
    f = open(path, "rb"); h = f.read(32)
    nrec, hlen, rlen = struct.unpack("<IHH", h[4:12]); fields = []
    while True:
        fd = f.read(32)
        if fd[0] == 0x0D:
            break
        fields.append((fd[:11].split(b"\x00")[0].decode("latin1"), fd[16]))
    f.seek(hlen); rows = []
    for _ in range(nrec):
        r = f.read(rlen); pos = 1; vals = {}
        for name, ln in fields:
            vals[name] = r[pos:pos + ln].decode("latin1").strip(); pos += ln
        rows.append(vals)
    return rows

def read_shp(path):
    f = open(path, "rb"); f.read(100); shapes = []
    while True:
        h = f.read(8)
        if len(h) < 8:
            break
        _, ln = struct.unpack(">ii", h); body = f.read(ln * 2)
        t, = struct.unpack("<i", body[:4])
        if t != 5:
            shapes.append([]); continue
        nparts, npts = struct.unpack("<ii", body[36:44])
        parts = struct.unpack(f"<{nparts}i", body[44:44 + 4 * nparts])
        pts = struct.unpack(f"<{2 * npts}d", body[44 + 4 * nparts:44 + 4 * nparts + 16 * npts])
        pts = list(zip(pts[0::2], pts[1::2]))
        rings = [pts[parts[i]:(parts[i + 1] if i + 1 < nparts else npts)] for i in range(nparts)]
        shapes.append(rings)
    return shapes

def area(ring):
    return 0.5 * abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1])))

def simplify(ring, n):
    if len(ring) <= n:
        return ring
    step = len(ring) / n
    return [ring[int(i * step)] for i in range(n)]

rows = read_dbf(str(SRC) + ".dbf"); shapes = read_shp(str(SRC) + ".shp")
out = []
for row, rings in zip(rows, shapes):
    for ring in rings:
        if len(ring) < 4 or area(ring) < MIN_AREA:
            continue
        out.append({"state": row["ADM1"], "ring": [[round(x, 4), round(y, 4)] for x, y in simplify(ring, MAXPTS)]})
OUT.write_text(json.dumps(out))
states = sorted({o["state"] for o in out})
print(f"{len(out)} polygons, {len(states)} states, {sum(len(o['ring']) for o in out)} points -> {OUT.name}")
