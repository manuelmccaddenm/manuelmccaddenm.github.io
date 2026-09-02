"""Download the CC0 PBR textures the Blender build uses (Poly Haven, 1k JPG).

Build-only inputs; the directory is gitignored. Re-run to restore.
"""
import json
import subprocess
from pathlib import Path

OUT = Path(__file__).resolve().parent / "assets"
OUT.mkdir(exist_ok=True)

# asset id -> local prefix
TEXTURES = {
    "asphalt_02": "asphalt",
    "red_brick_03": "brick",
    "concrete_floor_worn_001": "concrete",
    "fabric_pattern_07": "fabric",
}
MAPS = {"Diffuse": "diff", "Rough": "rough", "nor_gl": "nor", "Displacement": "disp", "AO": "ao"}

def get(url):
    # curl rather than urllib: the python.org interpreter ships without a CA bundle
    return subprocess.run(["curl", "-sSL", "--max-time", "120", url], check=True, capture_output=True).stdout

credits = ["# Texture credits", "", "All textures below are CC0 from https://polyhaven.com (1k JPG).", ""]
for asset, prefix in TEXTURES.items():
    files = json.loads(get(f"https://api.polyhaven.com/files/{asset}"))
    for key, short in MAPS.items():
        entry = files.get(key, {}).get("1k", {})
        # prefer jpg, fall back to png
        variant = entry.get("jpg") or entry.get("png")
        if not variant:
            continue
        ext = "jpg" if "jpg" in entry else "png"
        dest = OUT / f"{prefix}_{short}.{ext}"
        if dest.exists():
            print("have", dest.name); continue
        dest.write_bytes(get(variant["url"]))
        print(f"{dest.name:22s} {dest.stat().st_size/1e6:5.2f} MB")
    credits.append(f"- `{prefix}_*` : https://polyhaven.com/a/{asset}")
(OUT / "CREDITS.md").write_text("\n".join(credits) + "\n")
print("total %.1f MB" % (sum(p.stat().st_size for p in OUT.iterdir()) / 1e6))
