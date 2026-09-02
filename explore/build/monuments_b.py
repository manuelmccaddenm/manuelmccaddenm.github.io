"""Monuments, part B: mathematics, data engineering, products. Imported by world.py."""
import math
import random

import bmesh
import bpy
from mathutils import Vector

import monuments as A
from monuments import W, screen, frame_pt, segment, label

def install(ns):
    A.install(ns)

# ----------------------------------------------------------------------------- mathematics
def predator_prey(stop):
    """The Hopf bifurcation as a horn of light: hoops whose radius grows like the square root of the parameter,
    above a mirror pond; the fox and the hare chase each other around the last ring."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=22, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    water = W.mat_plain("pond", (0.01, 0.03, 0.04, 1), rough=0.03)
    W.box("pp_pond", (20, 12, 0.3), frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.15), W.yaw_of(d), water)
    W.box("pp_bank", (20.6, 12.6, 0.15), frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.07), W.yaw_of(d), m["concrete"])
    green = W.mat_cluster("math", 6)
    dimred = W.mat_emit("unstable_red", (1, 0.25, 0.15, 1), 1.5)
    zc = W.WALK_H + 3.6
    axis0, axis1 = -9.0, 8.0
    # spine: stable equilibrium (solid green) then the unstable branch (dim red) inside the horn
    segment("pp_spine0", frame_pt(c, d, pp, axis0, 0.5 * s, zc), frame_pt(c, d, pp, -4.0, 0.5 * s, zc), 0.05, green)
    segment("pp_spine1", frame_pt(c, d, pp, -4.0, 0.5 * s, zc), frame_pt(c, d, pp, axis1, 0.5 * s, zc), 0.04, dimred)
    for k in range(13):
        a = -4.0 + k * 1.0
        r = max(0.15, 3.0 * math.sqrt(k / 12))
        hoop = W.torus(f"pp_hoop{k}", r, 0.05, frame_pt(c, d, pp, a, 0.5 * s, zc), green, nu=64)
        hoop.rotation_euler = (0, math.pi / 2, W.yaw_of(d))
    W.sphere("pp_bead", 0.16, frame_pt(c, d, pp, -4.0, 0.5 * s, zc), W.mat_emit("optimum", (1, 1, 1, 1), 12))
    label("pp_hopf", "Hopf", 0.7, frame_pt(c, d, pp, -4.0, 0.5 * s, zc + 1.2), facing, green)
    label("pp_mu", "μ →", 0.5, frame_pt(c, d, pp, 6.5, 0.5 * s, zc - 3.9), facing, m["sign_white"])
    label("pp_stable", "equilibrio estable", 0.36, frame_pt(c, d, pp, -6.6, 0.5 * s, zc + 0.6), facing, m["sign_white"])
    label("pp_cycle", "ciclo límite", 0.36, frame_pt(c, d, pp, 4.5, 0.5 * s, zc + 3.6), facing, m["sign_white"])
    # the animals on the last hoop
    bronze = m["bronze"]
    R = 3.0; ax = axis1
    for name, ang, scale in (("fox", math.radians(30), 1.0), ("hare", math.radians(210), 0.8)):
        px, py, pz = frame_pt(c, d, pp, ax, 0.5 * s + math.cos(ang) * R * s * 0, zc + math.sin(ang) * R)
        # around the hoop: offset along pp by cos(ang)*R (hoops lie in the plane perpendicular to the road)
        px, py = c[0] + d[0] * ax + pp[0] * (0.5 * s + math.cos(ang) * R), c[1] + d[1] * ax + pp[1] * (0.5 * s + math.cos(ang) * R)
        body = W.sphere(f"pp_{name}_body", 0.42 * scale, (px, py, pz), bronze); body.scale = (2.0 * scale, 0.8 * scale, 0.9 * scale)
        head = W.bmesh_obj(f"pp_{name}_head", lambda bm, sc=scale: bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.28 * sc, radius2=0.02, depth=0.7 * sc), bronze)
        head.location = (px - d[0] * 0.95 * scale, py - d[1] * 0.95 * scale, pz + 0.3 * scale)
        head.rotation_euler = Vector((-d[0], -d[1], 0.15)).to_track_quat("Z", "Y").to_euler()
        if name == "hare":
            for e in (-0.12, 0.12):
                W.box(f"pp_ear{e}", (0.08, 0.1, 0.5), (px - d[0] * 0.9 * scale + pp[0] * e, py - d[1] * 0.9 * scale + pp[1] * e, pz + 0.75 * scale), W.yaw_of(d), bronze)
        W.spot(f"pp_{name}_light", (px + facing[0] * 3, py + facing[1] * 3, pz + 2), (px, py, pz), 200, color=(1, 0.9, 0.75), size_deg=35, blend=0.6)
    screen("pp_board", 5.6, 3.5, frame_pt(c, d, pp, -6.5, 6.3 * s, W.WALK_H + 3.2), facing, "phase_portrait.png", strength=2.4)
    W.spot("pp_key", frame_pt(c, d, pp, 0, -7 * s, 9), frame_pt(c, d, pp, 0, 0.5 * s, 3.5), 500, color=(0.85, 1, 0.9), size_deg=70, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def fantasy_draft(stop):
    """A small stadium: a bowl of stands around a gridiron, the draft board on the big screen."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=22, width=28, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    grass = W.mat_plain("turf", (0.07, 0.3, 0.09, 1), rough=0.95)
    W.box("fd_field", (20, 10, 0.05), (cx, cy, W.WALK_H + 0.03), W.yaw_of(d), grass)
    for k in range(11):
        W.box(f"fd_yard{k}", (0.1, 9.6, 0.01), frame_pt(c, d, pp, -10 + k * 2.0, 0, W.WALK_H + 0.06), W.yaw_of(d), m["paint_white"])
    for a in (-9.2, 9.2):
        W.box(f"fd_endzone{a}", (1.6, 9.6, 0.02), frame_pt(c, d, pp, a, 0, W.WALK_H + 0.06), W.yaw_of(d), W.mat_cluster("math", 0.8))
    for k in range(4):   # tiers on the far side and both ends; the road side stays open
        dep = 1.4; h = 0.9 * (k + 1)
        W.box(f"fd_far{k}", (22 + k * 2.8, dep, h), frame_pt(c, d, pp, 0, (5.8 + k * dep) * s, W.WALK_H + h / 2), W.yaw_of(d), m["concrete"])
        for a in (-1, 1):
            W.box(f"fd_end{k}{a}", (dep, 10 + k * 2.8, h), frame_pt(c, d, pp, a * (10.8 + k * dep), 0.5 * s, W.WALK_H + h / 2), W.yaw_of(d), m["concrete"])
    for a in (-13, 13):
        for b in (-6, 8):
            W.cylinder(f"fd_mast{a}{b}", 0.14, 14, frame_pt(c, d, pp, a, b * s, W.WALK_H + 7), m["pole"], segments=10)
            W.box(f"fd_head{a}{b}", (1.6, 0.4, 0.5), frame_pt(c, d, pp, a, b * s, W.WALK_H + 14.2), W.yaw_of(d), m["lamp"])
            W.spot(f"fd_flood{a}{b}", frame_pt(c, d, pp, a, b * s, W.WALK_H + 14), frame_pt(c, d, pp, a * 0.3, b * 0.3 * s, 0), 1800, color=(0.95, 0.97, 1.0), size_deg=70, blend=0.5, radius=0.4)
    screen("fd_board", 12.0, 7.5, frame_pt(c, d, pp, 0, 11.5 * s, W.WALK_H + 8.2), facing, "risk_return.png", strength=2.2)
    rng = random.Random(44)
    for k in range(180):   # Monte Carlo teams over midfield: risk across the field, return up
        fl = k < 70
        rx = rng.gauss(-4.5, 1.1) if fl else rng.gauss(2.5, 2.6)
        ry = rng.gauss(0.3, 0.6) if fl else rng.gauss(2.4, 1.3)
        W.sphere(f"fd_mc{k}", 0.09, frame_pt(c, d, pp, rx, 0.5 * s, W.WALK_H + 5.5 + ry), W.mat_cluster("math", 3.5 if fl else 2.0))
    prev = None
    for i in range(20):   # efficient frontier
        x = -7 + i * 0.75
        q = frame_pt(c, d, pp, x, 0.5 * s, W.WALK_H + 5.5 + 0.9 + 2.2 * math.sqrt((x + 7.2) / 14.5))
        if prev:
            segment(f"fd_front{i}", prev, q, 0.06, W.mat_emit("optimum", (1, 1, 1, 1), 8))
        prev = q
    W.sphere("fd_floor", 0.34, frame_pt(c, d, pp, -4.5, 0.5 * s, W.WALK_H + 5.8), W.mat_emit("optimum", (1, 1, 1, 1), 10))
    W.sphere("fd_ceiling", 0.34, frame_pt(c, d, pp, 6.0, 0.5 * s, W.WALK_H + 9.4), W.mat_emit("optimum", (1, 1, 1, 1), 10))
    label("fd_lfloor", "floor", 0.6, frame_pt(c, d, pp, -4.5, 0.5 * s, W.WALK_H + 4.9), facing, W.mat_cluster("math", 3))
    label("fd_lceil", "ceiling", 0.6, frame_pt(c, d, pp, 6.0, 0.5 * s, W.WALK_H + 10.2), facing, W.mat_cluster("math", 3))
    for a in (-4, 4):
        W.cylinder(f"fd_bpost{a}", 0.16, 4.5, frame_pt(c, d, pp, a, 11.5 * s, W.WALK_H + 2.25), m["pole"], segments=10)
    W.plaque(stop, (cx + facing[0] * 13.6, cy + facing[1] * 13.6), facing)

def lp_solver(stop):
    """A glass polytope on a plinth with the central path spiralling to its optimal vertex."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=12, along=5.0)
    W.box("lp_plinth", (7, 7, 1.0), (cx, cy, W.WALK_H + 0.5), W.yaw_of(d), m["concrete"])
    rng = random.Random(3)
    pts = [Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized() * rng.uniform(2.6, 3.2) for _ in range(18)]
    def hull(bm):
        vs = [bm.verts.new(p) for p in pts]
        bmesh.ops.convex_hull(bm, input=vs)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    centre = (cx, cy, W.WALK_H + 1.0 + 3.4)
    glass = W.mat_glass("poly_glass", tint=(0.8, 1.0, 0.9, 1), rough=0.03)
    poly = W.bmesh_obj("lp_poly", hull, glass, smooth=False)
    poly.location = centre
    edges = W.bmesh_obj("lp_edges", hull, W.mat_cluster("math", 6), smooth=False)
    edges.location = centre
    wf = edges.modifiers.new("wire", "WIREFRAME"); wf.thickness = 0.04
    top = max(pts, key=lambda p: p.z)
    prev = None
    for k in range(26):
        t = k / 25
        ang = t * 4.2
        rad = 1.6 * (1 - t)
        p = Vector((math.cos(ang) * rad, math.sin(ang) * rad, -1.2 + t * (top.z + 1.2))) * (1 - t) + top * t
        q = (centre[0] + p.x, centre[1] + p.y, centre[2] + p.z)
        W.sphere(f"lp_path{k}", 0.07 + 0.03 * t, q, W.mat_cluster("math", 9))
        if prev:
            segment(f"lp_pathseg{k}", prev, q, 0.02, W.mat_cluster("math", 3))
        prev = q
    optp = (centre[0] + top.x, centre[1] + top.y, centre[2] + top.z)
    W.sphere("lp_opt", 0.22, optp, W.mat_emit("optimum", (1, 1, 1, 1), 10))
    W.cylinder("lp_beam", 0.03, 8.0, (optp[0], optp[1], optp[2] + 4.0), W.mat_emit("optimum", (1, 1, 1, 1), 6), segments=10)
    label("lp_obj", "max cᵀx", 0.5, (optp[0] + facing[0] * 0.6, optp[1] + facing[1] * 0.6, optp[2] + 1.6), facing, m["sign_white"])
    def foot(bm):
        vs = [bm.verts.new((q.x, q.y, 0)) for q in pts]
        bmesh.ops.convex_hull(bm, input=vs)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    fp = W.bmesh_obj("lp_footprint", foot, W.mat_cluster("math", 1.5), smooth=False)
    fp.location = (cx, cy, W.WALK_H + 1.01)
    W.point("lp_inner", centre, 30, color=(0.4, 1, 0.7), radius=0.4)
    W.spot("lp_key", (cx + facing[0] * 6, cy + facing[1] * 6, 7), centre, 400, color=(0.9, 1, 0.95), size_deg=50, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

# ----------------------------------------------------------------------------- data engineering
def btc_streaming(stop):
    """A giant Bitcoin standing on end, and the pipeline as a train of light that feeds it:
    two sources merge into Kafka, split into Spark partitions, land in Parquet."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=28, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    orange = W.mat_cluster("dataeng", 3.5)
    R = 4.2
    W.box("bs_plinth", (5, 5, 1.2), frame_pt(c, d, pp, 4, 1.5 * s, W.WALK_H + 0.6), W.yaw_of(d), m["concrete"])
    centre = frame_pt(c, d, pp, 4, 1.5 * s, W.WALK_H + 1.2 + R)
    rot = (math.pi / 2, 0, W.yaw_of(W.perp(facing)))
    coin = W.cylinder("bs_coin", R, 0.5, centre, m["gold"], segments=128, rot=rot)
    bev = coin.modifiers.new("bevel", "BEVEL"); bev.width = 0.06; bev.segments = 4
    rim = W.torus("bs_rim", R - 0.3, 0.07, (centre[0] + facing[0] * 0.26, centre[1] + facing[1] * 0.26, centre[2]), W.mat_emit("btc_orange", (1, 0.55, 0.1, 1), 5), nu=128)
    rim.rotation_euler = rot
    glyph = W.mat_emit("btc_orange", (1, 0.55, 0.1, 1), 5)
    W.text("bs_B", "B", 4.6, (centre[0] + facing[0] * 0.28, centre[1] + facing[1] * 0.28, centre[2] + 0.1), (math.pi / 2, 0, W.yaw_of(W.perp(facing))), glyph, extrude=0.05)
    for e in (-0.45, 0.45):
        W.box(f"bs_bar{e}", (0.22, 0.05, 5.4), (centre[0] + d[0] * e * 0.6 - d[0] * 0.15 + facing[0] * 0.3, centre[1] + d[1] * e * 0.6 - d[1] * 0.15 + facing[1] * 0.3, centre[2] + 0.1), W.yaw_of(d), glyph)
    tl = (0.7, 0.32)  # slight tilt back
    # the pipeline: sources -> kafka -> spark partitions -> parquet, as tubes of light leading into the coin
    def tube(name, a0, b0, z0, a1, b1, z1, r=0.06, mat=orange):
        segment(name, frame_pt(c, d, pp, a0, b0 * s, z0), frame_pt(c, d, pp, a1, b1 * s, z1), r, mat)
    tube("bs_src0", -13, -1.0, 4.6, -8, 1.5, 4.6); tube("bs_src1", -13, 4.0, 4.6, -8, 1.5, 4.6)
    label("bs_l_src", "binance · polymarket", 0.42, frame_pt(c, d, pp, -12.5, 1.5 * s, W.WALK_H + 6.0), facing, m["sign_white"])
    W.sphere("bs_kafka", 0.5, frame_pt(c, d, pp, -8, 1.5 * s, 4.6), W.mat_cluster("dataeng", 8))
    label("bs_l_kafka", "kafka", 0.5, frame_pt(c, d, pp, -8, 1.5 * s, W.WALK_H + 5.9), facing, orange)
    for j, dz in enumerate((-0.9, 0, 0.9)):
        tube(f"bs_part{j}", -8, 1.5, 4.6, -2.5, 1.5, 4.6 + dz, r=0.045)
        tube(f"bs_part2{j}", -2.5, 1.5, 4.6 + dz, 0.2, 1.5, centre[2] - 1.5 + dz * 1.4, r=0.045)
    label("bs_l_spark", "spark", 0.5, frame_pt(c, d, pp, -3.5, 1.5 * s, W.WALK_H + 6.6), facing, orange)
    rng = random.Random(3)
    for k in range(16):   # the pulse train, bunching up toward the coin
        t = (k / 15) ** 1.6
        a = -13 + t * 13
        W.box(f"bs_pulse{k}", (0.9 - 0.4 * t, 0.2, 0.2), frame_pt(c, d, pp, a, 1.5 * s + (rng.uniform(-1.2, 1.2) if a < -8 else 0) * 0, 4.6 + (0.9 * ((k % 3) - 1) if a > -8 else 0)), W.yaw_of(d), W.mat_cluster("dataeng", 3 + 13 * t))
    for k in range(6):   # parquet: flat glowing slabs stacked behind the coin
        W.box(f"bs_parquet{k}", (1.4, 0.9, 0.08), frame_pt(c, d, pp, 9.5, 1.5 * s, W.WALK_H + 0.4 + k * 0.32), W.yaw_of(d), W.mat_cluster("dataeng", 2.5))
    label("bs_l_parquet", "parquet", 0.5, frame_pt(c, d, pp, 9.5, 1.5 * s, W.WALK_H + 2.9), facing, orange)
    label("bs_rate", "5 200 msg/s", 0.9, frame_pt(c, d, pp, -4, 1.5 * s, W.WALK_H + 2.2), facing, W.mat_emit("btc_orange", (1, 0.55, 0.1, 1), 4))
    screen("bs_screen", 7.0, 2.7, frame_pt(c, d, pp, -7, 6.5 * s, W.WALK_H + 3.2), facing, "btc_chart.png", strength=2.2)
    W.spot("bs_key", (centre[0] + facing[0] * 9, centre[1] + facing[1] * 9, 8), centre, 900, color=(1, 0.8, 0.55), size_deg=45, blend=0.5, radius=0.4)
    W.point("bs_coinlight", (centre[0] + facing[0] * 1.5, centre[1] + facing[1] * 1.5, centre[2]), 200, color=(1, 0.6, 0.2), radius=0.6)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def parallel_dbscan(stop):
    """The dataset as a cloud of points between sixteen columns (one per thread, height = its share of the work),
    the grid of regions on the floor and the buffer strips where points are shared, floating."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=22, width=22, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    floor = screen("pd_floor", 20, 20, (cx, cy, W.WALK_H + 0.02), facing, "dbscan_floor.png", strength=0.7, frame=False)
    floor.rotation_euler = (0, 0, W.yaw_of(W.perp(facing)))
    rng = random.Random(6)
    cols = [W.mat_emit(f"pd_c{i}", (*col, 1), 4) for i, col in enumerate(((0.85, 0.35, 0.15), (0.95, 0.55, 0.35), (1.0, 0.76, 0.64), (0.72, 0.25, 0.08)))]
    noise = W.mat_emit("pd_noise", (0.48, 0.23, 0.11, 1), 2)
    clusters = ((-5.0, -4.0, 1.0, 110), (4.0, 3.0, 1.4, 150), (5.0, -6.0, 0.8, 80), (-4.0, 5.6, 1.2, 100))
    counts = [[0] * 4 for _ in range(4)]
    def cell(a, b):
        return min(3, max(0, int((a + 10) / 5))), min(3, max(0, int((b + 10) / 5)))
    for ci, (ca, cb, sd, n) in enumerate(clusters):
        for k in range(n):
            a, b = rng.gauss(ca, sd), rng.gauss(cb, sd)
            i, j = cell(a, b); counts[i][j] += 1
            near_strip = min(abs(a + 5), abs(a), abs(a - 5), abs(b + 5), abs(b), abs(b - 5)) < 0.5
            z = W.WALK_H + (rng.uniform(1.6, 3.0) if near_strip else rng.uniform(0.5, 2.4))
            W.sphere(f"pd_pt{ci}_{k}", 0.09 if near_strip else 0.07, frame_pt(c, d, pp, a, b, z), cols[ci])
    for k in range(60):
        a, b = rng.uniform(-9.5, 9.5), rng.uniform(-9.5, 9.5)
        W.sphere(f"pd_noise{k}", 0.06, frame_pt(c, d, pp, a, b, W.WALK_H + rng.uniform(0.5, 2.4)), noise)
    for i in range(4):
        for j in range(4):
            h = 1.2 + 4.5 * counts[i][j] / 110
            p = frame_pt(c, d, pp, (i - 1.5) * 5, (j - 1.5) * 5, W.WALK_H + h / 2)
            W.cylinder(f"pd_col{i}{j}", 0.28, h, p, m["concrete"], segments=16)
            W.cylinder(f"pd_cap{i}{j}", 0.36, 0.12, (p[0], p[1], W.WALK_H + h + 0.06), W.mat_cluster("dataeng", 3), segments=16)
            W.point(f"pd_light{i}{j}", (p[0], p[1], W.WALK_H + h + 0.4), 45, color=(1, 0.55, 0.3), radius=0.15)
    for g in (-5, 0, 5):
        W.box(f"pd_bufx{g}", (0.8, 20, 0.03), frame_pt(c, d, pp, g, 0, W.WALK_H + 0.04), W.yaw_of(d), W.mat_cluster("dataeng", 0.8))
        W.box(f"pd_bufy{g}", (20, 0.8, 0.03), frame_pt(c, d, pp, 0, g, W.WALK_H + 0.04), W.yaw_of(d), W.mat_cluster("dataeng", 0.8))
    label("pd_lbl", "16 threads · franjas compartidas en la frontera", 0.5, frame_pt(c, d, pp, 0, -10.6 * s, W.WALK_H + 3.6), facing, W.mat_cluster("dataeng", 3))
    W.spot("pd_key", frame_pt(c, d, pp, 0, -12 * s, 10), (cx, cy, W.WALK_H + 1), 600, color=(1, 0.8, 0.65), size_deg=80, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 12.6, cy + facing[1] * 12.6), facing)

# ----------------------------------------------------------------------------- products
def mantis(stop):
    """Mantis HQ: a dark glass pavilion with an ontology of light inside."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    dark_glass = W.mat_glass("dark_glass", tint=(0.35, 0.35, 0.45, 1), rough=0.05)
    W.box("mt_floor", (14, 10, 0.3), (cx, cy, W.WALK_H + 0.15), W.yaw_of(d), m["concrete"])
    W.box("mt_glass", (13.6, 9.6, 5.2), (cx, cy, W.WALK_H + 2.9), W.yaw_of(d), dark_glass)
    W.box("mt_roof", (14.2, 10.2, 0.3), (cx, cy, W.WALK_H + 5.65), W.yaw_of(d), m["concrete"])
    for a in (-6.8, 6.8):
        for b in (-4.8, 4.8):
            W.cylinder(f"mt_col{a}{b}", 0.14, 5.4, frame_pt(c, d, pp, a, b, W.WALK_H + 3.0), m["pole"], segments=10)
    rng = random.Random(9)
    violet = W.mat_cluster("product", 6)
    hub = frame_pt(c, d, pp, 0, 0, W.WALK_H + 3.0)
    W.sphere("mt_hub", 0.55, hub, W.mat_cluster("product", 10))
    names = ["store", "customer", "sku", "visit", "zone", "supplier", "price", "event"]
    nodes = []
    for k, nm in enumerate(names):
        ang = 2 * math.pi * k / 8 + 0.4
        p = frame_pt(c, d, pp, math.cos(ang) * 4.6, math.sin(ang) * 2.9, W.WALK_H + 2.2 + 1.6 * ((k % 3) / 2))
        nodes.append(p)
        W.sphere(f"mt_node{k}", 0.25, p, violet)
        segment(f"mt_spoke{k}", hub, p, 0.02, W.mat_cluster("product", 1.8))
        label(f"mt_name{k}", nm, 0.3, (p[0] + facing[0] * 0.35, p[1] + facing[1] * 0.35, p[2] + 0.45), facing, W.mat_emit("lilac", (0.85, 0.83, 1.0, 1), 3))
        for j in range(3):
            q = (p[0] + rng.uniform(-1.2, 1.2), p[1] + rng.uniform(-0.8, 0.8), W.WALK_H + rng.uniform(0.7, 1.6))
            W.sphere(f"mt_ev{k}{j}", 0.1, q, W.mat_cluster("product", 2))
            segment(f"mt_evedge{k}{j}", p, q, 0.01, W.mat_cluster("product", 1.2))
    for z in (W.WALK_H + 0.32, W.WALK_H + 5.48):
        W.box(f"mt_strip{z}", (13.7, 0.05, 0.05), frame_pt(c, d, pp, 0, -4.82 * s, z), W.yaw_of(d), W.mat_cluster("product", 2.5))
    W.point("mt_inner", (cx, cy, W.WALK_H + 3.0), 120, color=(0.7, 0.6, 1.0), radius=0.6)
    label("mt_sign", "mantis", 0.9, (cx + facing[0] * 5.1, cy + facing[1] * 5.1, W.WALK_H + 6.4), facing, W.mat_emit("sign_violet", W.hex_rgb("#9085e9"), 5))
    screen("mt_screen", 3.6, 3.6, frame_pt(c, d, pp, 8.6, 2 * s, W.WALK_H + 2.4), facing, "ontology.png", strength=1.4)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def retail(stop):
    """A shop under wraps: a tarp dropped over the shell (cloth-simulated), warm light leaking through the seams, tape, coming soon."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    shell = W.mat_plain("shell", (0.06, 0.06, 0.07, 1), rough=0.8)
    W.box("rt_body", (11, 7, 5.5), (cx, cy, W.WALK_H + 2.75), W.yaw_of(d), shell)
    for z in (1.6, 3.4):   # warm seams that leak through the wrap
        W.box(f"rt_leak{z}", (11.6, 7.6, 0.05), (cx, cy, W.WALK_H + z), W.yaw_of(d), W.mat_emit("leak", (1, 0.8, 0.55, 1), 3))
    tarp = W.mat_pbr("tarpcloth", "fabric", tile=1.4, base=(0.09, 0.08, 0.2, 1), sheen=0.2, normal_strength=0.8)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=48, y_segments=24, size=1.0)
    me = bpy.data.meshes.new("rt_skin"); bm.to_mesh(me); bm.free()
    for k, (a, b, yaw_off, sx, sz) in enumerate(((0, -3.7, 0, 6.1, 3.2), (0, 3.7, 0, 6.1, 3.2), (-5.7, 0, math.pi / 2, 4.1, 3.2), (5.7, 0, math.pi / 2, 4.1, 3.2))):
        ob = bpy.data.objects.new(f"rt_tarp{k}", me.copy()); W.link(ob)
        ob.data.materials.append(tarp)
        ob.location = frame_pt(c, d, pp, a, b, W.WALK_H + 3.0)
        ob.scale = (sx, sz, 1)
        ob.rotation_euler = (math.pi / 2, 0, W.yaw_of(d) + yaw_off)
        disp = ob.modifiers.new("wave", "DISPLACE")
        tex = bpy.data.textures.new(f"rt_noise{k}", "CLOUDS"); tex.noise_scale = 0.6
        disp.texture = tex; disp.strength = 0.45; disp.mid_level = 0.5
        ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
    roof = bpy.data.objects.new("rt_tarp_roof", me.copy()); W.link(roof)
    roof.data.materials.append(tarp); roof.location = (cx, cy, W.WALK_H + 5.75); roof.scale = (6.1, 4.1, 1); roof.rotation_euler = (0, 0, W.yaw_of(d))
    disp = roof.modifiers.new("wave", "DISPLACE"); tex = bpy.data.textures.new("rt_noise_roof", "CLOUDS"); tex.noise_scale = 0.8
    disp.texture = tex; disp.strength = 0.5; disp.mid_level = 0.5
    W.point("rt_inside", (cx, cy, W.WALK_H + 3.0), 450, color=(1, 0.75, 0.5), radius=0.6)
    for a in (-6, -2, 2, 6):
        for b in (-4.2, 4.2):
            W.cylinder(f"rt_sc{a}{b}", 0.045, 6.5, frame_pt(c, d, pp, a, b * s, W.WALK_H + 3.25), m["steel"], segments=8)
    for z in (2.2, 4.4, 6.5):
        for b in (-4.2, 4.2):
            W.box(f"rt_rail{z}{b}", (12.2, 0.05, 0.05), frame_pt(c, d, pp, 0, b * s, W.WALK_H + z), W.yaw_of(d), m["steel"])
    # tape between two posts in front, and a work light on the sign
    for a in (-3.5, 3.5):
        W.cylinder(f"rt_tpost{a}", 0.04, 1.1, frame_pt(c, d, pp, a, -6.0 * s, W.WALK_H + 0.55), m["steel"], segments=8)
    hazard = W.mat_emit("hazard", (1, 0.7, 0.05, 1), 4)
    for k in range(24):
        t0, t1 = k / 24, (k + 1) / 24
        p0 = frame_pt(c, d, pp, -3.5 + 7 * t0, -6.0 * s, W.WALK_H + 1.05 - 0.12 * math.sin(math.pi * t0))
        p1 = frame_pt(c, d, pp, -3.5 + 7 * t1, -6.0 * s, W.WALK_H + 1.05 - 0.12 * math.sin(math.pi * t1))
        segment(f"rt_tape{k}", p0, p1, 0.04, hazard if k % 2 == 0 else m["dark"])
    W.box("rt_signbd", (6.4, 0.08, 1.1), frame_pt(c, d, pp, 0, -5.2 * s, W.WALK_H + 8.0), W.yaw_of(d), m["dark"])
    for a in (-3, 3):
        W.cylinder(f"rt_signpost{a}", 0.06, 8.0, frame_pt(c, d, pp, a, -5.2 * s, W.WALK_H + 4.0), m["steel"], segments=8)
    label("rt_soon", "PRÓXIMAMENTE", 0.62, frame_pt(c, d, pp, 0, -5.26 * s, W.WALK_H + 8.0), facing, W.mat_cluster("product", 4))
    W.cylinder("rt_wl_pole", 0.04, 1.6, frame_pt(c, d, pp, 5.5, -7 * s, W.WALK_H + 0.8), m["pole"], segments=8)
    W.box("rt_wl_head", (0.3, 0.2, 0.2), frame_pt(c, d, pp, 5.5, -7 * s, W.WALK_H + 1.7), W.yaw_of(d), m["lamp"])
    W.spot("rt_wl", frame_pt(c, d, pp, 5.5, -7 * s, W.WALK_H + 1.7), frame_pt(c, d, pp, 0, -5.2 * s, W.WALK_H + 8.0), 400, color=(1, 0.9, 0.75), size_deg=40, blend=0.5)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def glass(stop):
    """Glass as a giant transparent phone: the UI lives inside the slab, and the small leaks (gastos hormiga) trickle out of it."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=10, width=14, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("gl_plinth", (5.0, 2.6, 0.5), (cx, cy, W.WALK_H + 0.25), W.yaw_of(d), m["concrete"])
    slab = W.box("gl_slab", (3.4, 0.4, 6.6), (cx, cy, W.WALK_H + 0.5 + 3.3), W.yaw_of(d), m["glass"])
    bev = slab.modifiers.new("bevel", "BEVEL"); bev.width = 0.16; bev.segments = 5
    screen("gl_ui", 2.9, 5.9, (cx + facing[0] * 0.0, cy + facing[1] * 0.0, W.WALK_H + 0.5 + 3.3), facing, "glass_ui.png", strength=2.6, frame=False)
    W.box("gl_back", (3.0, 0.02, 6.0), (cx - facing[0] * 0.05, cy - facing[1] * 0.05, W.WALK_H + 0.5 + 3.3), W.yaw_of(d), m["dark"])
    rng = random.Random(4)
    for k in range(40):   # gastos hormiga leaking out of the bottom of the screen and across the plinth
        t = k / 39
        q = (cx + facing[0] * (0.25 + t * 3.2) + d[0] * (rng.uniform(-0.4, 0.4) + math.sin(t * 9) * 0.5), cy + facing[1] * (0.25 + t * 3.2) + d[1] * (rng.uniform(-0.4, 0.4) + math.sin(t * 9) * 0.5), W.WALK_H + 0.5 + max(0.06, 1.6 * (1 - t) ** 2))
        W.sphere(f"gl_ant{k}", 0.045, q, W.mat_cluster("product", 8))
    label("gl_sign", "glass", 0.9, (cx + facing[0] * 0.3, cy + facing[1] * 0.3, W.WALK_H + 7.8), facing, W.mat_emit("sign_violet", W.hex_rgb("#9085e9"), 5))
    label("gl_tag", "tus datos, en tu teléfono", 0.34, (cx + facing[0] * 2.7, cy + facing[1] * 2.7, W.WALK_H + 0.9), facing, m["sign_white"])
    W.spot("gl_key", (cx + facing[0] * 7, cy + facing[1] * 7, 7), (cx, cy, W.WALK_H + 3.5), 500, color=(0.9, 0.88, 1.0), size_deg=45, blend=0.6)
    W.point("gl_inner", (cx - facing[0] * 0.1, cy - facing[1] * 0.1, W.WALK_H + 4.0), 120, color=(0.75, 0.7, 1.0), radius=0.4)
    W.plaque(stop, (cx + facing[0] * 5.6, cy + facing[1] * 5.6), facing)

def cdmx_budget(stop):
    """A fountain with a giant peso standing in it, and where each peso goes on a board."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=16, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    water = W.mat_plain("fountain_water", (0.02, 0.05, 0.08, 1), rough=0.06)
    W.torus("cb_basin", 5.0, 0.45, (cx, cy, W.WALK_H + 0.4), m["concrete"], nu=96)
    W.cylinder("cb_water", 4.7, 0.2, (cx, cy, W.WALK_H + 0.55), water, segments=96)
    W.cylinder("cb_pedestal", 1.2, 1.4, (cx, cy, W.WALK_H + 0.7), m["concrete"], segments=32)
    coin = W.cylinder("cb_peso", 2.4, 0.3, (cx, cy, W.WALK_H + 1.4 + 2.4), m["gold"], segments=96, rot=(math.pi / 2, 0, W.yaw_of(W.perp(facing))))
    bev = coin.modifiers.new("bevel", "BEVEL"); bev.width = 0.04; bev.segments = 3
    goldlit = W.mat_emit("goldlit", (1, 0.75, 0.3, 1), 5)
    W.text("cb_dollar", "$", 2.6, (cx + facing[0] * 0.16, cy + facing[1] * 0.16, W.WALK_H + 3.75), (math.pi / 2, 0, W.yaw_of(W.perp(facing))), goldlit, extrude=0.05)
    ring = W.torus("cb_coinring", 2.4, 0.06, (cx + facing[0] * 0.16, cy + facing[1] * 0.16, W.WALK_H + 3.8), W.mat_emit("goldlit2", (1, 0.75, 0.3, 1), 4), nu=96)
    ring.rotation_euler = (math.pi / 2, 0, W.yaw_of(W.perp(facing)))
    cats = (("movilidad", 31), ("salud", 24), ("seguridad", 22), ("educación", 15), ("obras", 14), ("agua", 9), ("cultura", 4), ("deuda", 12))
    for k, (name, share) in enumerate(cats):
        ang = math.pi * (0.15 + 0.7 * k / 7) * (1 if s > 0 else -1) + (math.pi if s < 0 else 0)
        px, py = cx + math.cos(ang + W.yaw_of(d)) * 5.2, cy + math.sin(ang + W.yaw_of(d)) * 5.2
        W.cylinder(f"cb_post{k}", 0.05, 1.5, (px, py, W.WALK_H + 0.75), m["steel"], segments=8)
        segment(f"cb_jet{k}_a", (cx, cy, W.WALK_H + 6.1), (cx + (px - cx) * 0.5, cy + (py - cy) * 0.5, W.WALK_H + 6.1 + 1.4), 0.02 + 0.05 * share / 31, W.mat_cluster("product", 5))
        segment(f"cb_jet{k}_b", (cx + (px - cx) * 0.5, cy + (py - cy) * 0.5, W.WALK_H + 6.1 + 1.4), (px, py, W.WALK_H + 1.5), 0.02 + 0.05 * share / 31, W.mat_cluster("product", 5))
        label(f"cb_cat{k}", f"{name} {share}%", 0.3, (px + facing[0] * 0.2, py + facing[1] * 0.2, W.WALK_H + 1.85), facing, W.mat_emit("lilac", (0.85, 0.83, 1.0, 1), 3))
    rng = random.Random(8)
    for k in range(24):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(1.5, 4.4)
        W.cylinder(f"cb_c{k}", 0.16, 0.03, (cx + math.cos(a) * r, cy + math.sin(a) * r, W.WALK_H + 0.46), m["gold"], segments=16)
    for k in range(6):
        a = 2 * math.pi * k / 6
        W.spot(f"cb_uplight{k}", (cx + math.cos(a) * 3.6, cy + math.sin(a) * 3.6, W.WALK_H + 0.6), (cx, cy, W.WALK_H + 3.5), 120, color=(0.75, 0.7, 1.0), size_deg=35, blend=0.8)
    screen("cb_board", 7.0, 4.5, frame_pt(c, d, pp, 7.5, 6.5 * s, W.WALK_H + 3.2), facing, "budget.png", strength=2.4)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

BUILDERS = {
    "predator-prey": predator_prey, "fantasy-draft": fantasy_draft, "lp-solver": lp_solver,
    "btc-streaming": btc_streaming, "parallel-dbscan": parallel_dbscan,
    "mantis": mantis, "retail": retail, "glass": glass, "cdmx-budget": cdmx_budget,
}
