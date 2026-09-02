"""Generate the images some monuments display on screens and floors (matplotlib, system python).

Output: explore/build/assets/gen/*.png (build-only, gitignored). Run before world.py.
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path

OUT = Path(__file__).resolve().parent / "assets" / "gen"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
BG = "#07080a"
C = dict(energy="#c98500", stats="#3987e5", ml="#d55181", math="#199e70", dataeng="#d95926", product="#9085e9")

def fig(w, h, dpi=160):
    f = plt.figure(figsize=(w, h), dpi=dpi, facecolor=BG)
    ax = f.add_axes([0, 0, 1, 1]); ax.set_facecolor(BG); ax.axis("off")
    return f, ax

def save(f, name):
    f.savefig(OUT / name, dpi=f.dpi, facecolor=BG); plt.close(f); print("wrote", name)

# 1. predator-prey phase portrait: Rosenzweig-MacArthur with a limit cycle
f, ax = fig(8, 5)
def rm(x, y, r=1.0, K=6.0, a=1.0, h=1.0, e=0.6, m=0.25):
    return r * x * (1 - x / K) - a * x * y / (1 + h * x), e * a * x * y / (1 + h * x) - m * y
X, Y = np.meshgrid(np.linspace(0.1, 6, 26), np.linspace(0.1, 3.2, 18))
U, V = rm(X, Y)
ax.streamplot(X, Y, U, V, color=(0.2, 0.6, 0.45, 0.45), density=1.1, linewidth=0.6, arrowsize=0.6)
for x0, y0, col in ((5.5, 0.4, C["math"]), (1.0, 2.6, "#7fd9b3"), (2.5, 1.0, "#c6f2dc")):
    x, y = x0, y0; xs, ys = [], []
    for _ in range(9000):
        dx, dy = rm(x, y); x += dx * 0.01; y += dy * 0.01; xs.append(x); ys.append(y)
    ax.plot(xs, ys, color=col, lw=1.3)
ax.set_xlim(0, 6); ax.set_ylim(0, 3.2)
ax.text(0.15, 3.0, "prey", color="#b0aea5", fontsize=13, family="monospace")
ax.text(5.35, 0.1, "predators", color="#b0aea5", fontsize=13, family="monospace", rotation=90)
save(f, "phase_portrait.png")

# 2. inverter telemetry with one anomaly
f, ax = fig(8, 3)
t = np.linspace(0, 6, 900)
day = np.clip(np.sin(np.pi * (t % 1)), 0, None)
sig = 40 * day * (1 + 0.08 * rng.standard_normal(t.size)) + 8 * day * np.sin(9 * t)
sig[600:660] *= 0.15
ax.plot(t, sig, color=C["energy"], lw=1.2)
ax.plot(t, 40 * day, color="#5a4a20", lw=0.9, ls="--")
ax.axvspan(t[600], t[660], color="#ff3b3b", alpha=0.25)
ax.text(t[605], 44, "anomaly", color="#ff6b6b", fontsize=12, family="monospace")
ax.set_ylim(-2, 52)
save(f, "telemetry.png")

# 3. building baseline: expected load vs observed
f, ax = fig(8, 3)
d = np.arange(120)
base = 320 + 60 * np.sin(d / 19) + 25 * np.sin(d / 3.1)
obs = base + 18 * rng.standard_normal(d.size); obs[88:96] += 90
ax.fill_between(d, base - 35, base + 35, color=C["energy"], alpha=0.15)
ax.plot(d, base, color="#8a5d00", lw=1)
ax.plot(d, obs, color="#f2f0ea", lw=1.1)
ax.scatter(d[88:96], obs[88:96], color="#ff4d4d", s=14, zorder=3)
ax.text(2, 415, "expected load ± band · observed · flagged", color="#b0aea5", fontsize=11, family="monospace")
save(f, "baseline.png")

# 4. attention heatmap (thesis hall)
f, ax = fig(4, 4)
A = np.abs(rng.standard_normal((14, 14))) ** 2.2
A = np.tril(A) + 0.15 * rng.random((14, 14)); A /= A.max()
ax.imshow(A, cmap=matplotlib.colors.LinearSegmentedColormap.from_list("p", [BG, C["ml"], "#ffd4e4"]), interpolation="nearest")
save(f, "attention.png")

# 5. DBSCAN plaza floor: clustered points, noise, grid regions and buffer strips
f, ax = fig(8, 8)
pts = []
for cx, cy, s, n in ((0.25, 0.3, 0.05, 320), (0.7, 0.65, 0.07, 420), (0.75, 0.2, 0.04, 220), (0.3, 0.78, 0.06, 260)):
    pts.append(rng.normal((cx, cy), s, (n, 2)))
noise = rng.random((160, 2))
ax.scatter(noise[:, 0], noise[:, 1], s=7, color="#7a3a1d", alpha=0.9)
cols = [C["dataeng"], "#f28c5a", "#ffc2a3", "#b74015"]
for p, c in zip(pts, cols):
    ax.scatter(p[:, 0], p[:, 1], s=7, color=c, alpha=0.95)
for g in (0.25, 0.5, 0.75):
    ax.axvline(g, color="#3a3a3a", lw=1.2); ax.axhline(g, color="#3a3a3a", lw=1.2)
    ax.axvspan(g - 0.02, g + 0.02, color=C["dataeng"], alpha=0.12); ax.axhspan(g - 0.02, g + 0.02, color=C["dataeng"], alpha=0.12)
ax.set_xlim(0, 1); ax.set_ylim(0, 1)
save(f, "dbscan_floor.png")

# 6. BTC price with market-implied probability
f, ax = fig(8, 3)
n = 600; t = np.arange(n)
price = 100 + np.cumsum(0.25 * rng.standard_normal(n))
prob = 0.5 + 0.35 * np.tanh(np.gradient(price, 6) * 3) + 0.05 * rng.standard_normal(n)
ax.plot(t, (price - price.min()) / (price.max() - price.min()) * 0.9 + 1.2, color="#f2f0ea", lw=1.0)
ax.plot(t, np.clip(prob, 0, 1), color=C["dataeng"], lw=1.1)
ax.axhline(0.5, color="#4a3020", lw=0.8, ls="--")
ax.text(4, 2.15, "BTC (Binance)", color="#b0aea5", fontsize=11, family="monospace")
ax.text(4, 1.02, "P(up) · Polymarket", color=C["dataeng"], fontsize=11, family="monospace")
ax.set_ylim(-0.05, 2.3)
save(f, "btc_chart.png")

# 7. draft board
f, ax = fig(6, 4)
teams = [f"team {i+1}" for i in range(6)]; pos = ["QB", "RB", "RB", "WR", "WR", "TE", "K", "DEF"]
for j, tm in enumerate(teams):
    ax.text(0.05 + j * 0.155, 0.95, tm, color="#b0aea5", fontsize=9, family="monospace")
for r in range(8):
    y = 0.86 - r * 0.105
    for j in range(6):
        pick = pos[(r * 7 + j) % len(pos)]
        col = C["math"] if (r + j) % 5 == 0 else "#2a2a2a"
        ax.add_patch(plt.Rectangle((0.03 + j * 0.155, y - 0.04), 0.14, 0.085, color=col, alpha=0.9))
        ax.text(0.05 + j * 0.155, y - 0.005, f"{pick} · r{r+1}", color="#f2f0ea" if col != "#2a2a2a" else "#8a8a8a", fontsize=8, family="monospace")
ax.text(0.03, 0.02, "floor = min variance · ceiling = max expected", color=C["math"], fontsize=9, family="monospace")
save(f, "draft_board.png")

# 8. cdmx budget bars
f, ax = fig(6, 4)
cats = ["movilidad", "salud", "seguridad", "educación", "obras", "agua", "cultura", "deuda"]
vals = np.array([31, 24, 22, 15, 14, 9, 4, 12])
for i, (c, v) in enumerate(zip(cats, vals)):
    y = 0.9 - i * 0.105
    ax.add_patch(plt.Rectangle((0.28, y - 0.03), v / 34 * 0.68, 0.06, color=C["product"], alpha=0.85))
    ax.text(0.02, y - 0.01, c, color="#b0aea5", fontsize=10, family="monospace")
    ax.text(0.29 + v / 34 * 0.68, y - 0.01, f"${v} mil M", color="#f2f0ea", fontsize=9, family="monospace")
ax.text(0.02, 0.03, "la ruta de tu peso · presupuesto CDMX", color=C["product"], fontsize=9, family="monospace")
save(f, "budget.png")

# 9. space-time incidence heatmap (states x years)
f, ax = fig(6, 3)
yrs = 22; st = 32
base = np.linspace(0.2, 1.0, yrs)[None, :] * (0.5 + rng.random((st, 1)))
base[:, 17] *= 0.72  # 2020 dip
ax.imshow(base, aspect="auto", cmap=matplotlib.colors.LinearSegmentedColormap.from_list("b", [BG, C["stats"], "#cfe3ff"]), interpolation="nearest")
ax.text(0.3, -1.2, "2003", color="#b0aea5", fontsize=9, family="monospace"); ax.text(yrs - 2.8, -1.2, "2024", color="#b0aea5", fontsize=9, family="monospace")
save(f, "spacetime.png")

# 10. CFE bill (a printed page)
f, ax = fig(3, 4.2)
ax.add_patch(plt.Rectangle((0, 0), 1, 1, color="#e9e6dc"))
ax.text(0.06, 0.93, "CFE  ·  recibo de luz", color="#1a4d2e", fontsize=11, family="monospace", weight="bold")
lines = [("Periodo", "04 ABR - 04 JUN"), ("Tarifa", "GDMTH"), ("Consumo", "1,204 kWh"), ("Demanda máx.", "38 kW"),
         ("Energía base", "312 kWh"), ("Intermedia", "744 kWh"), ("Punta", "148 kWh"), ("Factor potencia", "0.96"),
         ("Subtotal", "$ 9,812.40"), ("IVA", "$ 1,569.98"), ("TOTAL", "$ 11,382.38")]
for i, (k, v) in enumerate(lines):
    y = 0.84 - i * 0.068
    ax.text(0.06, y, k, color="#333", fontsize=8.5, family="monospace")
    ax.text(0.94, y, v, color="#111", fontsize=8.5, family="monospace", ha="right", weight="bold" if k == "TOTAL" else "normal")
    if k == "Subtotal":
        ax.plot([0.06, 0.94], [y + 0.045, y + 0.045], color="#888", lw=0.6)
ax.add_patch(plt.Rectangle((0.06, 0.03), 0.88, 0.05, color="#111"))
save(f, "bill.png")

# 11. ontology graph (mantis)
f, ax = fig(5, 5)
P = rng.random((16, 2))
for i in range(16):
    for j in range(i + 1, 16):
        if np.hypot(*(P[i] - P[j])) < 0.32:
            ax.plot([P[i, 0], P[j, 0]], [P[i, 1], P[j, 1]], color=C["product"], lw=0.8, alpha=0.6)
ax.scatter(P[:, 0], P[:, 1], s=60, color=C["product"], zorder=3)
labels = ["store", "customer", "sku", "visit", "zone", "supplier", "price", "event"]
for k, lab in enumerate(labels):
    ax.text(P[k, 0] + 0.015, P[k, 1] + 0.015, lab, color="#d9d4ff", fontsize=9, family="monospace")
ax.set_xlim(-0.05, 1.05); ax.set_ylim(-0.05, 1.05)
save(f, "ontology.png")
print("done")
