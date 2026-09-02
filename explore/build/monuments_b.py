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
    """A dark pond with the limit cycle laid as lit stepping stones, the phase portrait on a board, fox and hare."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=18, width=20, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    water = W.mat_plain("pond", (0.01, 0.03, 0.04, 1), rough=0.05)
    W.cylinder("pp_pond", 7.5, 0.3, (cx, cy, W.WALK_H + 0.15), water, segments=96)
    W.torus("pp_bank", 7.5, 0.35, (cx, cy, W.WALK_H + 0.3), m["concrete"], nu=96)
    green = W.mat_cluster("math", 4)
    stone = W.mat_plain("stone", (0.4, 0.4, 0.38, 1), rough=0.9)
    r, ang = 1.2, 0.0
    for k in range(40):
        rad = 5.2 - (5.2 - r) * math.exp(-k / 9.0)
        ang += 0.55
        p = (cx + math.cos(ang) * rad, cy + math.sin(ang) * rad, W.WALK_H + 0.32)
        W.cylinder(f"pp_stone{k}", 0.42, 0.08, p, stone, segments=16)
        W.cylinder(f"pp_glow{k}", 0.34, 0.02, (p[0], p[1], p[2] + 0.05), green, segments=16)
    for k in range(60):
        a = 2 * math.pi * k / 60
        W.sphere(f"pp_cyc{k}", 0.09, (cx + math.cos(a) * 5.2, cy + math.sin(a) * 5.2, W.WALK_H + 0.42), W.mat_cluster("math", 8))
    screen("pp_board", 6.4, 4.0, frame_pt(c, d, pp, 0, 8.4 * s, W.WALK_H + 3.0), facing, "phase_portrait.png", strength=1.5)
    bronze = m["bronze"]
    hb = frame_pt(c, d, pp, -6.5, -3 * s, W.WALK_H + 0.75)
    W.box("pp_hare_plinth", (1.4, 1.4, 0.4), (hb[0], hb[1], W.WALK_H + 0.2), W.yaw_of(d), m["concrete"])
    ob = W.sphere("pp_hare_body", 0.42, (hb[0], hb[1], hb[2] + 0.1), bronze); ob.scale = (1.4, 0.9, 1.0)
    W.sphere("pp_hare_head", 0.26, (hb[0] + d[0] * 0.65, hb[1] + d[1] * 0.65, hb[2] + 0.5), bronze)
    for e in (-0.12, 0.12):
        ear = W.box(f"pp_ear{e}", (0.08, 0.1, 0.55), (hb[0] + d[0] * 0.7 + pp[0] * e, hb[1] + d[1] * 0.7 + pp[1] * e, hb[2] + 0.95), W.yaw_of(d), bronze)
        ear.rotation_euler = (0, -0.25, W.yaw_of(d))
    fb = frame_pt(c, d, pp, 6.5, -3 * s, W.WALK_H + 0.75)
    W.box("pp_fox_plinth", (2.2, 1.4, 0.4), (fb[0], fb[1], W.WALK_H + 0.2), W.yaw_of(d), m["concrete"])
    ob = W.sphere("pp_fox_body", 0.42, (fb[0], fb[1], fb[2] + 0.15), bronze); ob.scale = (2.0, 0.8, 0.9)
    head = W.bmesh_obj("pp_fox_head", lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.28, radius2=0.02, depth=0.7), bronze)
    head.location = (fb[0] - d[0] * 1.1, fb[1] - d[1] * 1.1, fb[2] + 0.35)
    head.rotation_euler = Vector((-d[0], -d[1], 0.15)).to_track_quat("Z", "Y").to_euler()
    tail = W.bmesh_obj("pp_fox_tail", lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.2, radius2=0.04, depth=1.0), bronze)
    tail.location = (fb[0] + d[0] * 1.3, fb[1] + d[1] * 1.3, fb[2] + 0.5)
    tail.rotation_euler = Vector((d[0], d[1], 0.6)).to_track_quat("Z", "Y").to_euler()
    for a in (-6.5, 6.5):
        W.spot(f"pp_statlight{a}", frame_pt(c, d, pp, a, -6 * s, 3.5), frame_pt(c, d, pp, a, -3 * s, 0.8), 140, color=(1, 0.9, 0.75), size_deg=45, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 10.6, cy + facing[1] * 10.6), facing)

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
    screen("fd_board", 9.0, 6.0, frame_pt(c, d, pp, 0, 11.5 * s, W.WALK_H + 7.5), facing, "draft_board.png", strength=1.6)
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
    W.sphere("lp_opt", 0.22, (centre[0] + top.x, centre[1] + top.y, centre[2] + top.z), W.mat_emit("optimum", (1, 1, 1, 1), 10))
    W.point("lp_inner", centre, 90, color=(0.4, 1, 0.7), radius=0.4)
    W.spot("lp_key", (cx + facing[0] * 6, cy + facing[1] * 6, 7), centre, 400, color=(0.9, 1, 0.95), size_deg=50, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

# ----------------------------------------------------------------------------- data engineering
def btc_streaming(stop):
    """A canal of dark water under a viaduct carrying a stream of light, with the price and the market on a screen."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=28, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    water = W.mat_plain("canal", (0.01, 0.02, 0.04, 1), rough=0.04)
    W.box("bs_canal", (26, 5, 0.1), frame_pt(c, d, pp, 0, 1 * s, W.WALK_H + 1.0), W.yaw_of(d), water)
    W.box("bs_bed", (26.4, 5.6, 0.9), frame_pt(c, d, pp, 0, 1 * s, W.WALK_H + 0.5), W.yaw_of(d), m["concrete"])
    for b in (-2.6, 2.6):
        W.box(f"bs_wall{b}", (26.4, 0.4, 1.4), frame_pt(c, d, pp, 0, (1 + b) * s, W.WALK_H + 0.7), W.yaw_of(d), m["concrete"])
    W.spot("bs_waterlight", frame_pt(c, d, pp, 0, 1 * s, W.WALK_H + 5.0), frame_pt(c, d, pp, 0, 1 * s, W.WALK_H + 1), 400, color=(0.6, 0.75, 1.0), size_deg=110, blend=0.8)
    for k in range(6):
        a = -12.5 + k * 5
        for b in (-1.6, 1.6):
            W.cylinder(f"bs_pillar{k}{b}", 0.35, 6, frame_pt(c, d, pp, a, (1 + b) * s, W.WALK_H + 2.4), m["concrete"], segments=16)
    W.box("bs_deck", (27, 4.2, 0.6), frame_pt(c, d, pp, 0, 1 * s, W.WALK_H + 5.7), W.yaw_of(d), m["concrete"])
    W.box("bs_stream", (26.6, 0.06, 0.25), frame_pt(c, d, pp, 0, (1 - 2.12) * s, W.WALK_H + 5.7), W.yaw_of(d), W.mat_cluster("dataeng", 3.5))
    for k in range(14):
        W.box(f"bs_pulse{k}", (0.5, 0.5, 0.5), frame_pt(c, d, pp, -12 + k * 1.85, 1 * s, W.WALK_H + 5.1), W.yaw_of(d) + 0.785, W.mat_cluster("dataeng", 9))
        W.point(f"bs_pl{k}", frame_pt(c, d, pp, -12 + k * 1.85, 1 * s, W.WALK_H + 4.8), 30, color=(1, 0.5, 0.25), radius=0.2)
    for a in (-10, 0, 10):
        segment(f"bs_drop{a}", frame_pt(c, d, pp, a, 1 * s, W.WALK_H + 5.4), frame_pt(c, d, pp, a, 1 * s, W.WALK_H - 0.4), 0.12, m["steel"])
    rack = W.mat_plain("rack", (0.1, 0.1, 0.11, 1), rough=0.4, metallic=0.4)
    for k in range(3):
        rb = frame_pt(c, d, pp, 11 + k * 0.9, -3.2 * s, W.WALK_H + 1.0)
        W.box(f"bs_rack{k}", (0.7, 0.9, 2.0), rb, W.yaw_of(d), rack)
        for j in range(8):
            W.sphere(f"bs_rled{k}{j}", 0.025, (rb[0] + facing[0] * 0.46, rb[1] + facing[1] * 0.46, rb[2] - 0.8 + j * 0.22), W.mat_emit("led_green", (0.1, 1, 0.3, 1), 10))
    screen("bs_screen", 8.0, 3.0, frame_pt(c, d, pp, -6, 5.6 * s, W.WALK_H + 3.4), facing, "btc_chart.png", strength=1.6)
    for a in (-9.5, -2.5):
        W.cylinder(f"bs_spost{a}", 0.08, 3.4, frame_pt(c, d, pp, a, 5.6 * s, W.WALK_H + 1.7), m["pole"], segments=8)
    W.spot("bs_key", frame_pt(c, d, pp, 0, -7 * s, 7), frame_pt(c, d, pp, 0, 1 * s, 0), 500, color=(1, 0.8, 0.6), size_deg=70, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def parallel_dbscan(stop):
    """A plaza whose floor is the dataset: clusters, noise, the grid of regions and the buffer strips; a column per thread."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=22, width=22, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    floor = screen("pd_floor", 20, 20, (cx, cy, W.WALK_H + 0.02), facing, "dbscan_floor.png", strength=0.9)
    floor.rotation_euler = (0, 0, W.yaw_of(W.perp(facing)))
    orange = W.mat_cluster("dataeng", 3)
    for i in range(4):
        for j in range(4):
            p = frame_pt(c, d, pp, (i - 1.5) * 5, (j - 1.5) * 5, W.WALK_H + 1.6)
            W.cylinder(f"pd_col{i}{j}", 0.28, 3.2, p, m["concrete"], segments=16)
            W.cylinder(f"pd_cap{i}{j}", 0.34, 0.12, (p[0], p[1], W.WALK_H + 3.26), orange, segments=16)
            W.point(f"pd_light{i}{j}", (p[0], p[1], W.WALK_H + 3.6), 45, color=(1, 0.55, 0.3), radius=0.15)
    for g in (-5, 0, 5):
        W.box(f"pd_bufx{g}", (0.8, 20, 0.03), frame_pt(c, d, pp, g, 0, W.WALK_H + 0.04), W.yaw_of(d), W.mat_cluster("dataeng", 0.6))
        W.box(f"pd_bufy{g}", (20, 0.8, 0.03), frame_pt(c, d, pp, 0, g, W.WALK_H + 0.04), W.yaw_of(d), W.mat_cluster("dataeng", 0.6))
    label("pd_lbl", "16 threads · buffer strips shared read-only", 0.3, frame_pt(c, d, pp, 0, 10.4 * s, W.WALK_H + 2.2), facing, orange)
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
    nodes = []
    for k in range(18):
        p = frame_pt(c, d, pp, rng.uniform(-5.5, 5.5), rng.uniform(-3.6, 3.6), W.WALK_H + rng.uniform(1.2, 4.6))
        nodes.append(p)
        W.sphere(f"mt_node{k}", 0.16 + 0.1 * rng.random(), p, violet)
    for i in range(18):
        for j in range(i + 1, 18):
            if (Vector(nodes[i]) - Vector(nodes[j])).length < 3.2 and rng.random() < 0.7:
                segment(f"mt_edge{i}_{j}", nodes[i], nodes[j], 0.015, W.mat_cluster("product", 1.8))
    W.point("mt_inner", (cx, cy, W.WALK_H + 3.0), 120, color=(0.7, 0.6, 1.0), radius=0.6)
    label("mt_sign", "mantis", 0.9, (cx + facing[0] * 5.1, cy + facing[1] * 5.1, W.WALK_H + 6.4), facing, W.mat_emit("sign_violet", W.hex_rgb("#9085e9"), 5))
    screen("mt_screen", 3.6, 3.6, frame_pt(c, d, pp, 8.6, 2 * s, W.WALK_H + 2.4), facing, "ontology.png", strength=1.4)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def retail(stop):
    """A shop under wraps: tarps over a shell, scaffolding, coming-soon."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=16, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    tarp = W.mat_plain("tarp", (0.18, 0.16, 0.3, 1), rough=0.75, metallic=0.05)
    W.box("rt_body", (11, 7, 5.5), (cx, cy, W.WALK_H + 2.75), W.yaw_of(d), tarp)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=40, y_segments=20, size=1.0)
    me = bpy.data.meshes.new("rt_skin"); bm.to_mesh(me); bm.free()
    for k, (a, b, yaw_off, sx) in enumerate(((0, -3.55, 0, 5.9), (0, 3.55, 0, 5.9), (-5.55, 0, math.pi / 2, 3.9), (5.55, 0, math.pi / 2, 3.9))):
        ob = bpy.data.objects.new(f"rt_tarp{k}", me.copy()); W.link(ob)
        ob.data.materials.append(tarp)
        ob.location = frame_pt(c, d, pp, a, b, W.WALK_H + 2.9)
        ob.scale = (sx, 3.0, 1)
        ob.rotation_euler = (math.pi / 2, 0, W.yaw_of(d) + yaw_off)
        disp = ob.modifiers.new("wave", "DISPLACE")
        tex = bpy.data.textures.new(f"rt_noise{k}", "CLOUDS"); tex.noise_scale = 0.35
        disp.texture = tex; disp.strength = 0.25; disp.mid_level = 0.5
    for a in (-6, -2, 2, 6):
        for b in (-4.2, 4.2):
            W.cylinder(f"rt_sc{a}{b}", 0.045, 6.5, frame_pt(c, d, pp, a, b * s, W.WALK_H + 3.25), m["steel"], segments=8)
    for z in (2.2, 4.4, 6.5):
        for b in (-4.2, 4.2):
            W.box(f"rt_rail{z}{b}", (12.2, 0.05, 0.05), frame_pt(c, d, pp, 0, b * s, W.WALK_H + z), W.yaw_of(d), m["steel"])
    hazard = W.mat_emit("hazard", (1, 0.55, 0.05, 1), 5)
    for k in range(9):
        W.box(f"rt_tape{k}", (0.9, 0.06, 0.18), frame_pt(c, d, pp, -6 + k * 1.5, -4.3 * s, W.WALK_H + 1.1), W.yaw_of(d), hazard if k % 2 == 0 else m["dark"])
    label("rt_soon", "PRÓXIMAMENTE", 0.5, frame_pt(c, d, pp, 0, -4.5 * s, W.WALK_H + 4.2), facing, W.mat_cluster("product", 4))
    W.spot("rt_key", frame_pt(c, d, pp, 4, -8 * s, 6), (cx, cy, W.WALK_H + 3), 350, color=(0.9, 0.85, 1.0), size_deg=70, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def glass(stop):
    """A glass pavilion, lit from inside: your money, visible only to you."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=14, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("gl_floor", (10, 8, 0.3), (cx, cy, W.WALK_H + 0.15), W.yaw_of(d), m["concrete"])
    W.box("gl_box", (9.6, 7.6, 4.2), (cx, cy, W.WALK_H + 2.4), W.yaw_of(d), m["glass"])
    W.box("gl_roof", (10.2, 8.2, 0.25), (cx, cy, W.WALK_H + 4.65), W.yaw_of(d), m["concrete"])
    for a in (-4.7, 4.7):
        for b in (-3.7, 3.7):
            W.cylinder(f"gl_col{a}{b}", 0.1, 4.4, frame_pt(c, d, pp, a, b, W.WALK_H + 2.5), m["pole"], segments=10)
    W.box("gl_table", (4, 1.6, 0.08), (cx, cy, W.WALK_H + 1.1), W.yaw_of(d), W.mat_plain("oak", (0.5, 0.36, 0.2, 1), rough=0.6))
    for a in (-1.8, 1.8):
        for b in (-0.6, 0.6):
            W.cylinder(f"gl_tleg{a}{b}", 0.04, 0.8, frame_pt(c, d, pp, a, b, W.WALK_H + 0.7), m["pole"], segments=8)
    W.box("gl_phone", (1.2, 0.05, 2.4), frame_pt(c, d, pp, -1.0, 0, W.WALK_H + 2.4), W.yaw_of(d), m["dark"])
    label("gl_ui", "cuentas · 3\ngastos hormiga\nsplit con amigos", 0.17, frame_pt(c, d, pp, -1.0, -0.04 * s, W.WALK_H + 2.9), facing, W.mat_cluster("product", 4))
    rng = random.Random(4)
    gold = m["gold"]
    for k in range(6):
        n = rng.randint(2, 9)
        for j in range(n):
            W.cylinder(f"gl_coin{k}{j}", 0.22, 0.05, frame_pt(c, d, pp, 0.4 + k * 0.5, 0.2 * s, W.WALK_H + 1.17 + j * 0.055), gold, segments=24)
    W.point("gl_inner", (cx, cy, W.WALK_H + 3.6), 260, color=(1, 0.92, 0.8), radius=0.5)
    label("gl_sign", "glass", 0.8, (cx + facing[0] * 3.9, cy + facing[1] * 3.9, W.WALK_H + 5.3), facing, W.mat_emit("sign_violet", W.hex_rgb("#9085e9"), 5))
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

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
    W.text("cb_dollar", "$", 2.6, (cx + facing[0] * 0.16, cy + facing[1] * 0.16, W.WALK_H + 3.75), (math.pi / 2, 0, W.yaw_of(W.perp(facing))), m["gold"], extrude=0.05)
    rng = random.Random(8)
    for k in range(24):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(1.5, 4.4)
        W.cylinder(f"cb_c{k}", 0.16, 0.03, (cx + math.cos(a) * r, cy + math.sin(a) * r, W.WALK_H + 0.46), m["gold"], segments=16)
    for k in range(6):
        a = 2 * math.pi * k / 6
        W.spot(f"cb_uplight{k}", (cx + math.cos(a) * 3.6, cy + math.sin(a) * 3.6, W.WALK_H + 0.6), (cx, cy, W.WALK_H + 3.5), 120, color=(0.75, 0.7, 1.0), size_deg=35, blend=0.8)
    screen("cb_board", 6.0, 4.0, frame_pt(c, d, pp, 0, 7.4 * s, W.WALK_H + 3.0), facing, "budget.png", strength=1.5)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

BUILDERS = {
    "predator-prey": predator_prey, "fantasy-draft": fantasy_draft, "lp-solver": lp_solver,
    "btc-streaming": btc_streaming, "parallel-dbscan": parallel_dbscan,
    "mantis": mantis, "retail": retail, "glass": glass, "cdmx-budget": cdmx_budget,
}
