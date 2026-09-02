"""Monuments, part A: energy, statistics, machine learning. Imported by world.py.

world.py calls install(namespace) so the geometry/material helpers defined there are
available here as W.<name>. Every builder takes the stop dict and places its monument on a
lot beside the stop's road (W.lot). Lot-local coordinates: `a` runs along the road
direction d, `b` along pp (away from the road is +b when s = +1); frame_pt() converts.
"""
import json
import math
import random
from types import SimpleNamespace

import bmesh
import bpy
from mathutils import Vector

W = SimpleNamespace()
GEN = None

def install(ns):
    for k, v in ns.items():
        setattr(W, k, v)
    global GEN
    GEN = W.ASSETS / "gen"

# ----------------------------------------------------------------------------- shared pieces
def screen(name, w, h, loc, facing, image, strength=2.2, tilt=0.0, frame=True):
    """A lit panel showing an image, its normal pointing along `facing` (xy unit vector)."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); W.link(ob)
    ob.scale = (w, h, 1)
    ob.location = loc
    ob.rotation_euler = (math.pi / 2 + tilt, 0, W.yaw_of(W.perp(facing)))
    key = f"screen_{image}_{strength}"
    m = W.MATS.get(key)
    if m is None:
        m = bpy.data.materials.new(key); m.use_nodes = True
        nt = m.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(GEN / image), check_existing=True)
        em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = strength
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(tex.outputs["Color"], em.inputs["Color"]); nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
        W.MATS[key] = m
    me.materials.append(m)
    if frame:
        fr = W.box(name + "_frame", (w + 0.12, 0.06, h + 0.12), (loc[0] - facing[0] * 0.04, loc[1] - facing[1] * 0.04, loc[2]), W.yaw_of(W.perp(facing)), W.M()["pole"])
        fr.rotation_euler = ob.rotation_euler
    return ob

def frame_pt(c, d, pp, a, b, z):
    """Point c + a*d + b*pp at height z (lot-local coordinates)."""
    return (c[0] + d[0] * a + pp[0] * b, c[1] + d[1] * a + pp[1] * b, z)

def segment(name, p, q, r, mat):
    """Cylinder from p to q."""
    from mathutils import Vector
    P, Q = Vector(p), Vector(q)
    mid = (P + Q) / 2; L = (Q - P).length
    ob = W.cylinder(name, r, L, tuple(mid), mat, segments=10)
    ob.rotation_euler = (Q - P).to_track_quat("Z", "Y").to_euler()
    return ob

def cable(name, p, q, sag=1.6, n=10, r=0.03, mat=None):
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append((p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t - sag * 4 * t * (1 - t)))
    for i in range(n):
        segment(f"{name}_{i}", pts[i], pts[i + 1], r, mat or W.M()["pole"])

def pylon(name, base, yaw, h=26.0, mat=None):
    """Lattice transmission tower, approximated: four leaning legs, braces, two cross-arms."""
    m = mat or W.M()["steel"]
    d = (math.cos(yaw), math.sin(yaw)); pp = W.perp(d)
    top_off, bot_off = 0.7, 2.6
    for sa in (1, -1):
        for sb in (1, -1):
            p = frame_pt(base, d, pp, sa * bot_off, sb * bot_off, W.WALK_H)
            q = frame_pt(base, d, pp, sa * top_off, sb * top_off, h)
            segment(f"{name}_leg{sa}{sb}", p, q, 0.09, m)
    for k in range(1, 6):
        z = k * h / 6; off = bot_off + (top_off - bot_off) * (z / h)
        for sa in (1, -1):
            W.box(f"{name}_brx{k}{sa}", (off * 2 + 0.2, 0.08, 0.08), frame_pt(base, d, pp, 0, sa * off, z), yaw, m)
            W.box(f"{name}_bry{k}{sa}", (0.08, off * 2 + 0.2, 0.08), frame_pt(base, d, pp, sa * off, 0, z), yaw, m)
    arms = []
    for k, (za, la) in enumerate(((h - 1.5, 9.0), (h - 5.5, 7.0))):
        W.box(f"{name}_arm{k}", (0.16, la, 0.16), (base[0], base[1], za), yaw, m)
        for sb in (1, -1):
            tip = frame_pt(base, d, pp, 0, sb * la / 2, za)
            for j in range(4):
                W.cylinder(f"{name}_ins{k}{sb}{j}", 0.16, 0.08, (tip[0], tip[1], za - 0.25 - j * 0.22), W.M()["dark"], segments=12)
            arms.append((tip[0], tip[1], za - 1.1))
    W.point(f"{name}_light", (base[0], base[1], h + 0.5), 25, color=(1, 0.2, 0.2), radius=0.1)
    W.sphere(f"{name}_beacon", 0.14, (base[0], base[1], h + 0.4), W.mat_emit("beacon_red", (1, 0.1, 0.1, 1), 12))
    return arms

def humanoid(name, base, yaw, mat, card=False):
    d = (math.cos(yaw), math.sin(yaw)); pp = W.perp(d)
    z0 = base[2]
    for s in (1, -1):
        W.cylinder(f"{name}_leg{s}", 0.11, 0.85, frame_pt(base, d, pp, 0, s * 0.14, z0 + 0.425), mat, segments=12)
    W.box(f"{name}_torso", (0.28, 0.44, 0.62), (base[0], base[1], z0 + 1.16), yaw, mat)
    W.sphere(f"{name}_head", 0.14, (base[0], base[1], z0 + 1.66), mat)
    W.cylinder(f"{name}_arm1", 0.06, 0.62, frame_pt(base, d, pp, 0, -0.32, z0 + 1.15), mat, segments=10)
    if card:
        top = frame_pt(base, d, pp, 0.05, 0.32, z0 + 1.75)
        segment(f"{name}_arm2", frame_pt(base, d, pp, 0, 0.3, z0 + 1.42), top, 0.06, mat)
        W.box(f"{name}_card", (0.03, 0.16, 0.22), (top[0] + d[0] * 0.05, top[1] + d[1] * 0.05, top[2] + 0.14), yaw, W.mat_emit("red_card", (1, 0.05, 0.05, 1), 4))
    else:
        W.cylinder(f"{name}_arm2", 0.06, 0.62, frame_pt(base, d, pp, 0, 0.32, z0 + 1.15), mat, segments=10)

def wall_light(name, at, target, power=180, color=(1, 0.85, 0.65), size=60):
    W.spot(name, at, target, power, color=color, size_deg=size, blend=0.7)

def label(name, body, size, loc, facing, mat):
    """Text standing upright, readable from the `facing` side."""
    return W.text(name, body, size, loc, (math.pi / 2, 0, W.yaw_of(W.perp(facing))), mat, extrude=0.01)

# ----------------------------------------------------------------------------- energy
def batu(stop):
    """Substation: transformer banks behind a fence, a gantry, and a transmission tower behind."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=24, width=26, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    gravel = W.mat_plain("gravel", (0.22, 0.21, 0.19, 1), rough=0.95)
    W.box("batu_yard", (24, 20, 0.08), (cx, cy, W.WALK_H + 0.04), W.yaw_of(d), gravel)
    for a in range(-12, 13, 3):
        for b in (-10, 10):
            W.cylinder(f"batu_fp{a}{b}", 0.04, 2.2, frame_pt(c, d, pp, a, b, W.WALK_H + 1.1), m["pole"], segments=8)
    for b in (-10, 10):
        for z in (0.9, 2.15):
            W.box(f"batu_rail{b}{z}", (24, 0.04, 0.04), frame_pt(c, d, pp, 0, b, W.WALK_H + z), W.yaw_of(d), m["pole"])
    tf = W.mat_plain("transformer", (0.42, 0.44, 0.40, 1), rough=0.55, metallic=0.3)
    for k, a in enumerate((-7, 0, 7)):
        base = frame_pt(c, d, pp, a, -2 * s, W.WALK_H)
        W.box(f"batu_tf{k}", (3.2, 2.2, 2.6), (base[0], base[1], base[2] + 1.3), W.yaw_of(d), tf)
        for j in range(7):
            W.box(f"batu_fin{k}{j}", (0.08, 1.0, 2.2), frame_pt(c, d, pp, a - 1.5 + j * 0.5, -3.4 * s, W.WALK_H + 1.2), W.yaw_of(d), tf)
        for j in range(3):
            bx = frame_pt(c, d, pp, a - 1 + j, -2 * s, W.WALK_H + 2.6)
            W.cylinder(f"batu_bush{k}{j}", 0.12, 1.4, (bx[0], bx[1], bx[2] + 0.7), m["dark"], segments=12)
            W.cylinder(f"batu_cap{k}{j}", 0.2, 0.08, (bx[0], bx[1], bx[2] + 1.42), m["steel"], segments=12)
    for a in (-10, 10):
        for b in (2, 8):
            W.cylinder(f"batu_gp{a}{b}", 0.12, 8, frame_pt(c, d, pp, a, b * s, W.WALK_H + 4), m["steel"], segments=10)
        W.box(f"batu_gb{a}", (0.14, 6.4, 0.14), frame_pt(c, d, pp, a, 5 * s, W.WALK_H + 8), W.yaw_of(d), m["steel"])
    corona = W.mat_emit("corona", (0.55, 0.75, 1.0, 1), 1.6)
    for b in (2.5, 5, 7.5):
        cable(f"batu_bus{b}", frame_pt(c, d, pp, -10, b * s, W.WALK_H + 7.6), frame_pt(c, d, pp, 10, b * s, W.WALK_H + 7.6), sag=0.6, r=0.045, mat=corona)
    W.point("batu_corona_l", frame_pt(c, d, pp, 0, 5 * s, W.WALK_H + 7.4), 120, color=(0.55, 0.75, 1.0), radius=1.5)
    arms = pylon("batu_pylon", frame_pt(c, d, pp, 0, 9 * s, 0), W.yaw_of(d))
    for k, arm in enumerate(arms[2:4]):
        cable(f"batu_drop{k}", arm, frame_pt(c, d, pp, -10 + 20 * k, 5 * s, W.WALK_H + 8), sag=0.3, r=0.03, mat=m["steel"])
    amber = (1, 0.6, 0.15)
    for a in (-8, 8):
        W.spot(f"batu_flood{a}", frame_pt(c, d, pp, a, -9 * s, 9), frame_pt(c, d, pp, a, -1 * s, 1), 900, color=amber, size_deg=70, blend=0.6)
    for a in (1.5, 6.5):
        W.cylinder(f"batu_gatepost{a}", 0.1, 4.2, frame_pt(c, d, pp, a, -10.2 * s, W.WALK_H + 2.1), m["pole"], segments=10)
    W.box("batu_gatebar", (5.4, 0.12, 0.7), frame_pt(c, d, pp, 4, -10.2 * s, W.WALK_H + 3.9), W.yaw_of(d), m["pole"])
    label("batu_sign", "SUBESTACIÓN", 0.5, frame_pt(c, d, pp, 4, -10.28 * s, W.WALK_H + 3.9), facing, W.mat_cluster("energy", 3))
    arc = W.mat_emit("arc", (0.85, 0.92, 1.0, 1), 60)
    rng = random.Random(77)
    a0 = frame_pt(c, d, pp, -1, -2 * s, W.WALK_H + 4.05); a1 = frame_pt(c, d, pp, 0, -2 * s, W.WALK_H + 4.05)
    pts = [a0] + [(a0[0] + (a1[0] - a0[0]) * t + rng.uniform(-0.12, 0.12) * pp[0], a0[1] + (a1[1] - a0[1]) * t + rng.uniform(-0.12, 0.12) * pp[1], a0[2] + rng.uniform(-0.15, 0.25)) for t in (0.2, 0.4, 0.6, 0.8)] + [a1]
    for i in range(len(pts) - 1):
        segment(f"batu_arc{i}", pts[i], pts[i + 1], 0.015, arc)
    W.point("batu_arclight", ((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, W.WALK_H + 4.2), 400, color=(0.6, 0.8, 1.0), radius=0.2)
    for k, a in enumerate((-7, 0, 7)):
        for j in range(3):
            bx = frame_pt(c, d, pp, a - 1 + j, -2 * s, W.WALK_H + 4.12)
            W.torus(f"batu_ring{k}{j}", 0.28, 0.02, bx, W.mat_emit("corona_ring", (0.6, 0.8, 1.0, 1), 18), nu=32)
    W.plaque(stop, (cx + facing[0] * 12.4, cy + facing[1] * 12.4), facing)

def cfe_bills(stop):
    """The bill engine: a giant CFE bill feeding a gear machine that spits out glowing data cubes."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    screen("cfe_bill", 4.6, 6.4, frame_pt(c, d, pp, -5, 0, W.WALK_H + 3.6), facing, "bill.png", strength=1.6, tilt=-0.18)
    wall_light("cfe_front", frame_pt(c, d, pp, 2, -8 * s, 7), frame_pt(c, d, pp, 0.5, 0, 2), power=600, size=60)
    body = W.mat_plain("machine", (0.16, 0.18, 0.2, 1), rough=0.4, metallic=0.7)
    W.box("cfe_machine", (5, 3.2, 3.4), frame_pt(c, d, pp, 0.5, 0, W.WALK_H + 1.7), W.yaw_of(d), body)
    W.box("cfe_hopper", (2.2, 3.4, 1.2), frame_pt(c, d, pp, -2.1, 0, W.WALK_H + 3.0), W.yaw_of(d), body)
    for k, (a, z, r) in enumerate(((-0.6, 4.3, 1.0), (1.4, 4.6, 0.7), (0.4, 5.3, 0.45))):
        g = frame_pt(c, d, pp, a, -1.75 * s, W.WALK_H + z)
        W.cylinder(f"cfe_gear{k}", r, 0.3, g, m["steel"], segments=24, rot=(math.pi / 2, 0, W.yaw_of(d)))
        rim = W.torus(f"cfe_gearrim{k}", r * 0.55, 0.03, (g[0] + facing[0] * 0.16, g[1] + facing[1] * 0.16, g[2]), W.mat_cluster("energy", 6), nu=32)
        rim.rotation_euler = (math.pi / 2, 0, W.yaw_of(d))
        for t in range(12):
            ang = 2 * math.pi * t / 12
            W.box(f"cfe_tooth{k}{t}", (0.3, 0.3, 0.3), (g[0] + d[0] * math.cos(ang) * (r + 0.1), g[1] + d[1] * math.cos(ang) * (r + 0.1), g[2] + math.sin(ang) * (r + 0.1)), W.yaw_of(d) + ang, m["steel"])
    seam = W.mat_cluster("energy", 4)
    for z in (W.WALK_H + 0.3, W.WALK_H + 3.3):
        W.box(f"cfe_seam{z}", (5.04, 3.24, 0.05), frame_pt(c, d, pp, 0.5, 0, z), W.yaw_of(d), seam)
    for a in (-1.95, 2.95):
        W.box(f"cfe_vseam{a}", (0.05, 3.24, 3.0), frame_pt(c, d, pp, a + 0.5 - 0.5, 0, W.WALK_H + 1.8), W.yaw_of(d), seam)
    W.point("cfe_hopperlight", frame_pt(c, d, pp, -2.1, 0, W.WALK_H + 3.9), 90, color=(1, 0.65, 0.25), radius=0.4)
    W.box("cfe_belt", (7, 1.0, 0.25), frame_pt(c, d, pp, 6.5, 0, W.WALK_H + 0.9), W.yaw_of(d), m["dark"])
    for k in range(2):
        W.cylinder(f"cfe_bleg{k}", 0.06, 0.8, frame_pt(c, d, pp, 3.6 + k * 5.6, 0, W.WALK_H + 0.4), m["pole"], segments=8)
    cube = W.mat_cluster("energy", 5)
    for k in range(5):
        W.box(f"cfe_cube{k}", (0.42, 0.42, 0.42), frame_pt(c, d, pp, 3.8 + k * 1.3, 0, W.WALK_H + 1.24), W.yaw_of(d) + 0.3 * k, cube)
    prng = random.Random(5)
    for k in range(28):   # cubes rise off the end of the belt in a plume
        t = k / 27
        W.box(f"cfe_plume{k}", (0.15 + 0.15 * (1 - t),) * 3, frame_pt(c, d, pp, 10 + prng.uniform(-0.6, 0.6) + t * 1.5, prng.uniform(-0.8, 0.8) * t, W.WALK_H + 1.3 + t * 5.5), prng.uniform(0, 3), cube)
    W.point("cfe_glow", frame_pt(c, d, pp, 10.5, 0, W.WALK_H + 6.5), 150, color=(1, 0.7, 0.3), radius=0.4)
    wall_light("cfe_key", frame_pt(c, d, pp, 2, 9 * s, 6), frame_pt(c, d, pp, 0, 0, 2), power=500)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def building_monitors(stop):
    """A building whose lit windows are its own load curve, hour by hour; the anomaly burns red. Its solar carport and inverter in front."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=20, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    Wd, Dp, H = 13.0, 9.0, 15.0
    back = 3.0 * s
    front = back - (Dp / 2) * s
    W.box("bm_body", (Wd, Dp, H), frame_pt(c, d, pp, 0, back, W.WALK_H + H / 2), W.yaw_of(d), m["concrete"])
    load = [1, 1, 2, 3, 4, 5, 6, 5, 3]
    warm = W.mat_emit("bm_window", (1.0, 0.86, 0.66, 1), 1.3)
    red = W.mat_emit("win_red", (1, 0.15, 0.1, 1), 2.5)
    for col in range(9):
        a = (col - 4) * 1.35
        for row in range(6):
            lit = row < load[col]
            mat = (red if (col == 6 and row >= 4) else warm) if lit else m["glass"]
            W.box(f"bm_w{col}{row}", (0.9, 0.05, 1.1), frame_pt(c, d, pp, a, front - 0.02 * s, W.WALK_H + 1.6 + row * 2.1), W.yaw_of(d), mat)
    label("bm_txt", "esperado 320 kW · observado 412 kW", 0.42, frame_pt(c, d, pp, 0, front - 0.1 * s, W.WALK_H + H - 0.9), facing, W.mat_cluster("energy", 2.5))
    # the load curve worn on the facade: observed as a white line, the expected band in amber
    pts = [frame_pt(c, d, pp, (col - 4) * 1.35, front - 0.35 * s, W.WALK_H + 1.1 + load[col] * 2.1) for col in range(9)]
    for i in range(8):
        segment(f"bm_curve{i}", pts[i], pts[i + 1], 0.04, W.mat_emit("curve_white", (1, 1, 1, 1), 5))
    for dz, name in ((0.9, "hi"), (-0.9, "lo")):
        band = [frame_pt(c, d, pp, (col - 4) * 1.35, front - 0.32 * s, W.WALK_H + 1.1 + min(load[col], 4) * 2.1 + dz) for col in range(9)]
        for i in range(8):
            segment(f"bm_band{name}{i}", band[i], band[i + 1], 0.02, W.mat_cluster("energy", 2))
    W.sphere("bm_flag", 0.16, pts[6], W.mat_emit("led_red", (1, 0.05, 0.05, 1), 14))
    # solar carport with the inverter under it, in front of the building
    panel = W.mat_glass("panel_glass", tint=(0.05, 0.08, 0.2, 1), rough=0.08)
    for a in (-3, 3):
        for b in (-1.6, 1.6):
            W.cylinder(f"bm_cp{a}{b}", 0.1, 3.2, frame_pt(c, d, pp, a, front - (4 + b) * s, W.WALK_H + 1.6), m["pole"], segments=10)
    for k in range(4):
        pv = W.box(f"bm_pv{k}", (1.9, 3.4, 0.06), frame_pt(c, d, pp, (k - 1.5) * 2.0, front - 4 * s, W.WALK_H + 3.4), W.yaw_of(d), panel)
        pv.rotation_euler = (0.35 * s, 0, W.yaw_of(d))
    W.box("bm_pvstrip", (7.8, 0.04, 0.04), frame_pt(c, d, pp, 0, front - 5.6 * s, W.WALK_H + 3.0), W.yaw_of(d), W.mat_emit("pv_blue", (0.4, 0.6, 1.0, 1), 4))
    inv = frame_pt(c, d, pp, 0, front - 4 * s, W.WALK_H + 0.9)
    W.box("bm_inv", (1.1, 0.7, 1.8), inv, W.yaw_of(d), W.mat_plain("cabinet", (0.75, 0.75, 0.72, 1), rough=0.5, metallic=0.2))
    W.sphere("bm_led", 0.06, (inv[0] + facing[0] * 0.38, inv[1] + facing[1] * 0.38, inv[2] + 0.5), W.mat_emit("led_green", (0.1, 1, 0.3, 1), 10))
    for a in (-5, 5):
        wall_light(f"bm_up{a}", frame_pt(c, d, pp, a, front - 2.5 * s, 0.3), frame_pt(c, d, pp, a, front, 10), power=350, size=45)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def solar_pipelines(stop):
    """A lit solar field; its data rides overhead pipes as rings of light into a database tank."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=18, width=24, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    panel = W.mat_glass("panel_glass", tint=(0.05, 0.08, 0.2, 1), rough=0.08)
    pvgrid = W.mat_plain("pvgrid", (0.06, 0.1, 0.25, 1), rough=0.3, emit=0.35, emit_color=(0.3, 0.45, 0.9, 1))
    for r in range(4):
        for k in range(6):
            p = frame_pt(c, d, pp, (k - 2.5) * 3.2, (-4 + r * 3.0) * s, W.WALK_H + 1.3)
            ob = W.box(f"sp_pv{r}{k}", (2.8, 1.6, 0.06), p, W.yaw_of(d), pvgrid if (r + k) % 2 else panel)
            ob.rotation_euler = (0.5 * s, 0, W.yaw_of(d))
            W.cylinder(f"sp_leg{r}{k}", 0.06, 1.3, (p[0], p[1], p[2] - 0.65), m["pole"], segments=8)
    for a in (-7, 0, 7):
        lp = frame_pt(c, d, pp, a, 1 * s, W.WALK_H)
        W.cylinder(f"sp_lamp{a}", 0.06, 5.5, (lp[0], lp[1], lp[2] + 2.75), m["pole"], segments=8)
        W.box(f"sp_lamphead{a}", (0.5, 0.25, 0.1), (lp[0], lp[1], lp[2] + 5.5), W.yaw_of(d), m["lamp"])
        W.spot(f"sp_light{a}", (lp[0], lp[1], lp[2] + 5.4), (lp[0], lp[1], 0), 1200, color=(1, 0.85, 0.65), size_deg=130, blend=0.6, radius=0.3)
    pipe = W.mat_plain("pipe", (0.55, 0.56, 0.58, 1), rough=0.3, metallic=0.9)
    zr = W.WALK_H + 3.4
    for a in (-9, -3, 3, 9):
        W.cylinder(f"sp_rack{a}", 0.08, zr, frame_pt(c, d, pp, a, -6.5 * s, zr / 2), m["pole"], segments=8)
    segment("sp_trunk", frame_pt(c, d, pp, -9.5, -6.5 * s, zr), frame_pt(c, d, pp, 9.5, -6.5 * s, zr), 0.18, pipe)
    for k in range(6):
        a = (k - 2.5) * 3.2
        segment(f"sp_branch{k}", frame_pt(c, d, pp, a, -4 * s, W.WALK_H + 1.4), frame_pt(c, d, pp, a, -6.5 * s, zr), 0.08, pipe)
        ring = W.torus(f"sp_bring{k}", 0.2, 0.035, frame_pt(c, d, pp, a, -5.3 * s, W.WALK_H + 2.4), W.mat_cluster("energy", 12), nu=32)
        ring.rotation_euler = Vector((0, -2.5 * s, zr - W.WALK_H - 1.4)).to_track_quat("Z", "Y").to_euler()
    for k in range(9):
        ring = W.torus(f"sp_ring{k}", 0.22, 0.035, frame_pt(c, d, pp, -8.5 + k * 2.1, -6.5 * s, zr), W.mat_cluster("energy", 12), nu=32)
        ring.rotation_euler = (0, math.pi / 2, W.yaw_of(d))
    tank = frame_pt(c, d, pp, 11.5, -6.5 * s, W.WALK_H + 2.6)
    segment("sp_drop", frame_pt(c, d, pp, 9.5, -6.5 * s, zr), (tank[0], tank[1], tank[2] + 2.2), 0.18, pipe)
    W.box("sp_tankbase", (3.6, 3.6, 0.6), (tank[0], tank[1], W.WALK_H + 0.3), W.yaw_of(d), m["concrete"])
    W.cylinder("sp_tank", 1.6, 4.4, tank, m["glass"], segments=48)
    for j in range(10):
        W.cylinder(f"sp_disc{j}", 1.45, 0.06, (tank[0], tank[1], tank[2] - 1.9 + j * 0.34), W.mat_cluster("energy", 1.4 + 0.1 * j), segments=48)
    label("sp_sites", "8 000 sitios", 0.5, (tank[0] + facing[0] * 1.85, tank[1] + facing[1] * 1.85, W.WALK_H + 0.3), facing, W.mat_cluster("energy", 3))
    W.point("sp_tank_light", tank, 120, color=(1, 0.7, 0.3), radius=0.5)
    W.plaque(stop, (cx + facing[0] * 10.6, cy + facing[1] * 10.6), facing)

def inverter_anomalies(stop):
    """Seven inverters in a row, one screaming red, and the telemetry that caught it."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=10, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    cab = W.mat_plain("cabinet", (0.75, 0.75, 0.72, 1), rough=0.5, metallic=0.2)
    W.box("ia_pad", (16, 3, 0.2), frame_pt(c, d, pp, 0, 0, W.WALK_H + 0.1), W.yaw_of(d), m["concrete"])
    for k in range(7):
        a = (k - 3) * 2.2
        base = frame_pt(c, d, pp, a, 0, W.WALK_H + 0.2)
        W.box(f"ia_inv{k}", (1.3, 0.8, 2.0), (base[0], base[1], base[2] + 1.0), W.yaw_of(d), cab)
        for g in range(6):
            W.box(f"ia_grille{k}{g}", (0.9, 0.03, 0.05), (base[0] + facing[0] * 0.41, base[1] + facing[1] * 0.41, base[2] + 0.5 + g * 0.16), W.yaw_of(d), m["dark"])
        bad = k == 2
        led = W.mat_emit("led_red", (1, 0.05, 0.05, 1), 14) if bad else W.mat_emit("led_green", (0.1, 1, 0.3, 1), 10)
        W.sphere(f"ia_led{k}", 0.07, (base[0] + facing[0] * 0.42, base[1] + facing[1] * 0.42, base[2] + 1.7), led)
        if bad:
            W.point("ia_redlight", (base[0] + facing[0] * 1.2, base[1] + facing[1] * 1.2, base[2] + 1.6), 300, color=(1, 0.1, 0.1), radius=0.3)
            W.cylinder("ia_beam", 0.06, 7.0, (base[0], base[1], base[2] + 2.0 + 3.5), W.mat_emit("alarm", (1, 0.08, 0.05, 1), 30), segments=12)
            segment("ia_link", (base[0] + facing[0] * 0.42, base[1] + facing[1] * 0.42, base[2] + 1.7), frame_pt(c, d, pp, 1.2, 2.55 * s, W.WALK_H + 3.2), 0.02, W.mat_emit("alarm", (1, 0.08, 0.05, 1), 20))
    screen("ia_screen", 7.0, 3.5, frame_pt(c, d, pp, 0, 2.6 * s, W.WALK_H + 3.4), facing, "telemetry.png", strength=2.2)
    for a in (-6, 6):
        W.cylinder(f"ia_post{a}", 0.08, 3.2, frame_pt(c, d, pp, a, 2.6 * s, W.WALK_H + 1.6), m["pole"], segments=8)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

def critical_hours(stop):
    """The year as a wall: 8,760 hours of reserve margin, the 100 lowest burning red and standing out as rods."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=10, width=26, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    Wd, H = 22.0, 4.4
    z0 = W.WALK_H + 1.6
    screen("ch_wall", Wd, H, frame_pt(c, d, pp, 0, 1.5 * s, z0 + H / 2), facing, "hours_wall.png", strength=1.4)
    W.box("ch_base", (Wd + 0.6, 0.9, 1.6), frame_pt(c, d, pp, 0, 1.55 * s, W.WALK_H + 0.8), W.yaw_of(d), m["concrete"])
    crit = json.loads((GEN / "critical_hours.json").read_text())
    red = W.mat_emit("clock_red", (1, 0.08, 0.05, 1), 10)
    for dd, hh in crit:
        u = (dd + 0.5) / 365 * (1 if s < 0 else -1); v = (hh + 0.5) / 24
        p = frame_pt(c, d, pp, (u - 0.5 * (1 if s < 0 else -1)) * Wd, 1.5 * s, z0 + v * H)
        W.box(f"ch_rod{dd}_{hh}", (0.16, 0.7, 0.16), (p[0] + facing[0] * 0.34, p[1] + facing[1] * 0.34, p[2]), W.yaw_of(d), W.mat_emit("rod_red", (1, 0.08, 0.05, 1), 16))
    for k, mon in enumerate(("ene", "abr", "jul", "oct")):
        a = (-0.5 + (k * 91 + 15) / 365) * Wd * (1 if s < 0 else -1)
        label(f"ch_mon{k}", mon, 0.36, frame_pt(c, d, pp, a, 1.42 * s, z0 - 0.35), facing, m["sign_white"])
    for hh, lab in ((0, "0 h"), (12, "12 h"), (23, "23 h")):
        label(f"ch_h{hh}", lab, 0.3, frame_pt(c, d, pp, -Wd / 2 * (1 if s < 0 else -1) - 0.9 * (1 if s < 0 else -1), 1.42 * s, z0 + (hh + 0.5) / 24 * H), facing, m["sign_white"])
    label("ch_100", "100", 1.6, frame_pt(c, d, pp, -7, 1.42 * s, z0 + H + 1.5), facing, red)
    label("ch_of", "de 8 760 horas", 0.55, frame_pt(c, d, pp, 2.5, 1.42 * s, z0 + H + 1.3), facing, m["sign_white"])
    label("ch_sub", "las de menor reserva deciden el cargo por capacidad", 0.34, frame_pt(c, d, pp, 0, 1.42 * s, z0 + H + 0.55), facing, W.mat_cluster("energy", 2.5))
    for a in (-8, 0, 8):
        W.point(f"ch_redglow{a}", frame_pt(c, d, pp, a, 0.6 * s, z0 + H * 0.75), 120, color=(1, 0.25, 0.15), radius=0.6)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

def air_quality(stop):
    """An overlook: a bench at a railing right by the road, and past the rail a basin of brown smog with a city glowing under it."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=4, width=14, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    wood = W.mat_plain("wood", (0.32, 0.2, 0.1, 1), rough=0.7)
    for k in range(4):
        W.box(f"aq_slat{k}", (2.2, 0.12, 0.04), frame_pt(c, d, pp, 0, (-1.4 + k * 0.14) * s, W.WALK_H + 0.48), W.yaw_of(d), wood)
    for k in range(3):
        W.box(f"aq_back{k}", (2.2, 0.04, 0.12), frame_pt(c, d, pp, 0, -1.62 * s, W.WALK_H + 0.75 + k * 0.16), W.yaw_of(d), wood)
    for a in (-0.95, 0.95):
        W.box(f"aq_bleg{a}", (0.08, 0.6, 0.46), frame_pt(c, d, pp, a, -1.2 * s, W.WALK_H + 0.23), W.yaw_of(d), m["pole"])
    edge = 1.6 * s
    for a in range(-7, 8, 2):
        W.cylinder(f"aq_rp{a}", 0.03, 1.1, frame_pt(c, d, pp, a, edge, W.WALK_H + 0.55), m["pole"], segments=8)
    W.box("aq_rail", (14, 0.05, 0.05), frame_pt(c, d, pp, 0, edge, W.WALK_H + 1.1), W.yaw_of(d), m["pole"])
    W.box("aq_rim", (16, 3.0, 0.4), frame_pt(c, d, pp, 0, edge + 1.6 * s, W.WALK_H - 0.2), W.yaw_of(d), m["concrete"])
    W.box("aq_plate", (2.6, 0.05, 0.6), frame_pt(c, d, pp, 0, edge, W.WALK_H + 1.5), W.yaw_of(d), m["sign_green"])
    label("aq_num", "PM2.5 · 4x OMS", 0.36, frame_pt(c, d, pp, 0, edge - 0.04 * s, W.WALK_H + 1.5), facing, W.mat_emit("clock_red", (1, 0.08, 0.05, 1), 4))
    smog = bpy.data.materials.new("smog"); smog.use_nodes = True
    nt = smog.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.45, 0.32, 0.18, 1); vol.inputs["Density"].default_value = 0.2
    vol.inputs["Emission Strength"].default_value = 0.03; vol.inputs["Emission Color"].default_value = (0.8, 0.5, 0.25, 1)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    W.box("aq_smog", (36, 26, 8), frame_pt(c, d, pp, 0, edge + 14.5 * s, -5.0), W.yaw_of(d), smog)
    rng = random.Random(5)
    lit = W.mat_emit("city_light", (1, 0.75, 0.45, 1), 25)
    for k in range(18):
        a = rng.uniform(-16, 16); b = rng.uniform(4, 24); h = rng.uniform(4, 9); w = rng.uniform(2, 4)
        base = frame_pt(c, d, pp, a, edge + b * s, -9.0)
        W.box(f"aq_bldg{k}", (w, w, h), (base[0], base[1], base[2] + h / 2), W.yaw_of(d), m["dark"])
        for j in range(int(h)):
            if rng.random() < 0.4:
                W.box(f"aq_win{k}{j}", (0.35, w + 0.04, 0.3), (base[0], base[1], base[2] + 0.8 + j), W.yaw_of(d), lit)
    for k in range(90):
        a = rng.uniform(-17, 17); b = rng.uniform(3, 25)
        W.box(f"aq_city{k}", (0.3, 0.3, 0.3), frame_pt(c, d, pp, a, edge + b * s, -7.8), 0, lit)
    for a in (-9, 0, 9):
        W.point(f"aq_cityglow{a}", frame_pt(c, d, pp, a, edge + 13 * s, -6.0), 2000, color=(1, 0.55, 0.2), radius=4.0)
    steel = m["steel"]
    W.cylinder("aq_binoc_post", 0.06, 1.3, frame_pt(c, d, pp, 2.4, 0.6 * s, W.WALK_H + 0.65), steel, segments=10)
    tube = W.cylinder("aq_binoc", 0.12, 0.6, frame_pt(c, d, pp, 2.4, 0.75 * s, W.WALK_H + 1.4), steel, segments=12)
    tube.rotation_euler = Vector((-facing[0], -facing[1], -0.3)).to_track_quat("Z", "Y").to_euler()
    W.spot("aq_lamp", frame_pt(c, d, pp, -2.5, -2.5 * s, 3.2), frame_pt(c, d, pp, 0, -1, 0.5), 120, color=(1, 0.85, 0.6), size_deg=70, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 3.4, cy + facing[1] * 3.4), facing)

# ----------------------------------------------------------------------------- statistics
def spacetime_bayes(stop):
    """Mexico itself, in 3D: every state raised by its incidence and glowing with it, tilted toward the road,
    with the 22 years behind it as bars of light (they quadruple, with the 2020 dip)."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=26, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    polys = json.loads((GEN / "mexico.json").read_text())
    states = sorted({p["state"] for p in polys})
    rng = random.Random(32)
    lat_of = {}
    for st in states:
        pts = [q for p in polys if p["state"] == st for q in p["ring"]]
        lat_of[st] = sum(q[1] for q in pts) / len(pts)
    inc = {st: 0.35 + 0.65 * rng.random() * (0.55 + 0.45 * (lat_of[st] - 14.5) / 18) for st in states}
    lon0, lat0 = -102.5, 23.6
    scale = 0.72
    tilt = math.radians(34)
    pivot = bpy.data.objects.new("sb_pivot", None); W.link(pivot)
    pivot.location = frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 3.9)
    nrm = Vector((facing[0] * math.sin(tilt), facing[1] * math.sin(tilt), math.cos(tilt)))
    pivot.rotation_euler = nrm.to_track_quat("Z", "Y").to_euler()
    base = W.mat_plain("mx_stone", (0.16, 0.17, 0.2, 1), rough=0.8)
    sx = 1 if s < 0 else -1   # keep the map un-mirrored for a viewer on the road side
    for k, poly in enumerate(polys):
        ring = poly["ring"]
        h = 0.25 + 2.2 * inc[poly["state"]]
        verts = [((x - lon0) * scale * sx, (y - lat0) * scale, 0.0) for x, y in ring]
        n = len(verts)
        verts += [(vx, vy, h) for vx, vy, _ in verts]
        faces = [tuple(range(n))[::-1], tuple(range(n, 2 * n))]
        faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        ob = W.mesh_obj(f"sb_state{k}", verts, faces, base)
        ob.parent = pivot
        cap = W.mesh_obj(f"sb_cap{k}", [(vx, vy, h + 0.01) for vx, vy, _ in verts[:n]], [tuple(range(n))], W.mat_cluster("stats", 0.6 + 2.4 * inc[poly["state"]]))
        cap.parent = pivot
    plate = W.box("sb_plate", (30, 20, 0.3), (0, 0, -0.16), 0, m["concrete"]); plate.parent = pivot
    W.box("sb_stand", (6, 2.0, 3.0), frame_pt(c, d, pp, 0, 2.5 * s, W.WALK_H + 1.5), W.yaw_of(d), m["concrete"])
    for k in range(22):
        h = 0.8 + 2.6 * (k / 21) * (0.7 if k == 17 else 1.0)
        W.box(f"sb_year{k}", (0.3, 0.06, h), frame_pt(c, d, pp, (k - 10.5) * 0.5, 9.5 * s, W.WALK_H + h / 2), W.yaw_of(d), W.mat_cluster("stats", 2.0))
    label("sb_y0", "2003", 0.6, frame_pt(c, d, pp, -6.6, 9.4 * s, W.WALK_H + 0.9), facing, W.mat_cluster("stats", 2.5))
    label("sb_y1", "2024", 0.6, frame_pt(c, d, pp, 6.6, 9.4 * s, W.WALK_H + 0.9), facing, W.mat_cluster("stats", 2.5))
    label("sb_lbl", "incidencia por estado · 2003 – 2024", 0.5, frame_pt(c, d, pp, 0, -6.6 * s, W.WALK_H + 0.6), facing, W.mat_cluster("stats", 2.5))
    W.spot("sb_light", frame_pt(c, d, pp, 8, -8 * s, 9), frame_pt(c, d, pp, 0, 0.5 * s, 4), 700, color=(0.75, 0.85, 1.0), size_deg=65, blend=0.6)
    W.spot("sb_light2", frame_pt(c, d, pp, -8, -8 * s, 9), frame_pt(c, d, pp, 0, 0.5 * s, 4), 500, color=(0.9, 0.95, 1.0), size_deg=65, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 10.6, cy + facing[1] * 10.6), facing)

def markov_chains(stop):
    """The delivery truck with its four states as a lit dashboard, and a wall of simulated epidemics: the cloud an ODE hides."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=22, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("mc_plinth", (8, 4, 1.0), frame_pt(c, d, pp, -5, 0, W.WALK_H + 0.5), W.yaw_of(d), m["concrete"])
    paint = W.mat_plain("truck_white", (0.85, 0.86, 0.84, 1), rough=0.35, metallic=0.1)
    z0 = W.WALK_H + 1.0
    W.box("mc_cab", (2.0, 2.2, 2.1), frame_pt(c, d, pp, -7.6, 0, z0 + 1.55), W.yaw_of(d), paint)
    W.box("mc_body", (4.4, 2.4, 2.6), frame_pt(c, d, pp, -4.3, 0, z0 + 1.9), W.yaw_of(d), paint)
    W.box("mc_chassis", (6.8, 2.0, 0.4), frame_pt(c, d, pp, -5.4, 0, z0 + 0.65), W.yaw_of(d), m["dark"])
    W.box("mc_windshield", (0.05, 1.8, 0.9), frame_pt(c, d, pp, -8.63, 0, z0 + 1.9), W.yaw_of(d), m["glass"])
    for a in (-7.9, -5.2, -3.6):
        for b in (1.05, -1.05):
            W.cylinder(f"mc_wheel{a}{b}", 0.5, 0.35, frame_pt(c, d, pp, a, b, z0 + 0.5), m["dark"], segments=24, rot=(math.pi / 2, 0, W.yaw_of(d)))
    for b in (0.7, -0.7):
        W.sphere(f"mc_hl{b}", 0.12, frame_pt(c, d, pp, -8.62, b, z0 + 1.1), W.mat_emit("headlight", (1, 0.95, 0.8, 1), 20))
    # the four states as lamps on the plinth face toward the road
    states = (("OK", (0.1, 1, 0.3)), ("WARNING", (1, 0.55, 0.05)), ("BROKEN", (1, 0.08, 0.05)), ("REPAIR", (0.3, 0.55, 1)))
    W.box("mc_dash", (7.4, 0.1, 1.3), frame_pt(c, d, pp, -5, -2.05 * s, W.WALK_H + 0.65), W.yaw_of(d), m["dark"])
    for k, (name, col) in enumerate(states):
        a = -7.6 + k * 1.75
        W.sphere(f"mc_lamp{k}", 0.28, frame_pt(c, d, pp, a, -2.25 * s, W.WALK_H + 0.85), W.mat_emit(f"lamp_{name}", (*col, 1), 4))
        label(f"mc_lamplbl{k}", name, 0.22, frame_pt(c, d, pp, a, -2.12 * s, W.WALK_H + 0.35), facing, m["sign_white"])
        if k < 3:
            segment(f"mc_arrow{k}", frame_pt(c, d, pp, a + 0.35, -2.25 * s, W.WALK_H + 0.85), frame_pt(c, d, pp, a + 1.4, -2.25 * s, W.WALK_H + 0.85), 0.03, W.mat_cluster("stats", 1.5))
    W.sphere("mc_warning", 0.18, frame_pt(c, d, pp, -7.6, 0, z0 + 2.75), W.mat_emit("amber_beacon", (1, 0.55, 0.05, 1), 15))
    W.point("mc_warning_l", frame_pt(c, d, pp, -7.6, 0, z0 + 3.0), 80, color=(1, 0.5, 0.05), radius=0.2)
    # wall of stochastic SEIR runs: I(t) curves as tubes of light, some going extinct
    rng = random.Random(19)
    fw, fh = 7.0, 3.2
    fx0 = 1.2
    for a in (fx0, fx0 + fw):
        W.cylinder(f"mc_fpost{a}", 0.06, fh + 0.6, frame_pt(c, d, pp, a, 1.0 * s, W.WALK_H + (fh + 0.6) / 2), m["pole"], segments=8)
    W.box("mc_ftop", (fw + 0.2, 0.06, 0.06), frame_pt(c, d, pp, fx0 + fw / 2, 1.0 * s, W.WALK_H + fh + 0.6), W.yaw_of(d), m["pole"])
    blue = W.mat_cluster("stats", 1.3)
    for run in range(48):
        peak = rng.uniform(0.25, 1.0); tpk = rng.uniform(0.3, 0.7); extinct = rng.random() < 0.18
        pts = []
        for i in range(13):
            t = i / 12
            if extinct:
                y = 0.08 * math.exp(-((t - 0.05) / 0.08) ** 2) if t < 0.3 else 0.0
            else:
                y = peak * math.exp(-((t - tpk) / (0.16 + 0.1 * peak)) ** 2)
            y += rng.uniform(-0.02, 0.02)
            pts.append(frame_pt(c, d, pp, fx0 + t * fw, 1.0 * s, W.WALK_H + 0.4 + max(0.0, y) * fh))
        for i in range(12):
            segment(f"mc_run{run}_{i}", pts[i], pts[i + 1], 0.012, blue)
    label("mc_It", "I(t)", 0.5, frame_pt(c, d, pp, fx0 - 0.6, 1.0 * s, W.WALK_H + fh + 0.2), facing, m["sign_white"])
    label("mc_t", "t", 0.5, frame_pt(c, d, pp, fx0 + fw + 0.5, 1.0 * s, W.WALK_H + 0.4), facing, m["sign_white"])
    W.spot("mc_key", frame_pt(c, d, pp, -5, -6 * s, 6), frame_pt(c, d, pp, -5, 0, 2), 500, color=(0.85, 0.9, 1.0), size_deg=60, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def negreira(stop):
    """A small pitch, a scoreboard, and a referee statue holding up the card."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=18, width=26, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    grass = W.mat_plain("grass", (0.08, 0.28, 0.1, 1), rough=0.95)
    W.box("ng_pitch", (24, 15, 0.05), frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.03), W.yaw_of(d), grass)
    line = m["paint_white"]
    for a in (-11.5, 11.5):
        W.box(f"ng_goalline{a}", (0.12, 14.5, 0.01), frame_pt(c, d, pp, a, 0.5 * s, W.WALK_H + 0.06), W.yaw_of(d), line)
    for b in (-6.75, 7.75):
        W.box(f"ng_side{b}", (23, 0.12, 0.01), frame_pt(c, d, pp, 0, b * s, W.WALK_H + 0.06), W.yaw_of(d), line)
    W.box("ng_half", (0.12, 14.5, 0.01), frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.06), W.yaw_of(d), line)
    W.torus("ng_circle", 2.6, 0.06, frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.06), line, nu=64)
    for a in (-11.5, 11.5):
        for b in (-1.8, 2.8):
            W.cylinder(f"ng_post{a}{b}", 0.06, 2.4, frame_pt(c, d, pp, a, b * s, W.WALK_H + 1.2), line, segments=10)
        W.box(f"ng_bar{a}", (0.12, 4.7, 0.12), frame_pt(c, d, pp, a, 0.5 * s, W.WALK_H + 2.4), W.yaw_of(d), line)
    W.box("ng_board", (8.4, 0.3, 2.8), frame_pt(c, d, pp, 0, 8.6 * s, W.WALK_H + 4.9), W.yaw_of(d), m["dark"])
    for a in (-3.6, 3.6):
        W.cylinder(f"ng_bpost{a}", 0.1, 3.5, frame_pt(c, d, pp, a, 8.6 * s, W.WALK_H + 1.75), m["pole"], segments=10)
    amber = W.mat_emit("score_amber", (1, 0.6, 0.1, 1), 6)
    label("ng_liga", "LA LIGA", 0.5, frame_pt(c, d, pp, -2.2, 8.42 * s, W.WALK_H + 5.75), facing, m["sign_white"])
    label("ng_ucl", "CHAMPIONS", 0.5, frame_pt(c, d, pp, 2.2, 8.42 * s, W.WALK_H + 5.75), facing, m["sign_white"])
    label("ng_eff1", "+0.6", 0.9, frame_pt(c, d, pp, -2.2, 8.42 * s, W.WALK_H + 4.7), facing, amber)
    label("ng_eff2", "0.0", 0.9, frame_pt(c, d, pp, 2.2, 8.42 * s, W.WALK_H + 4.7), facing, amber)
    label("ng_design", "triple diferencias · 15 000 partidos", 0.36, frame_pt(c, d, pp, 0, 8.42 * s, W.WALK_H + 3.85), facing, m["sign_white"])
    for a, word in ((-6, "LIGA"), (6, "PLACEBO")):
        W.text(f"ng_half_{word}", word, 1.1, frame_pt(c, d, pp, a, 0.5 * s, W.WALK_H + 0.07), (0, 0, W.yaw_of(d) + (math.pi if s > 0 else 0)), line, extrude=0.0)
    # the referee, three times life size, at the centre spot, bathed in his own red card
    W.box("ng_plinth", (2.4, 2.4, 0.5), frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.25), W.yaw_of(d), m["concrete"])
    ref = frame_pt(c, d, pp, 0, 0.5 * s, W.WALK_H + 0.5)
    humanoid("ng_ref", ref, W.yaw_of(facing), m["bronze"], card=True)
    for ob in list(bpy.data.objects):
        if ob.name.startswith("ng_ref"):
            ob.location = (ref[0] + (ob.location.x - ref[0]) * 2.5, ref[1] + (ob.location.y - ref[1]) * 2.5, ref[2] + (ob.location.z - ref[2]) * 2.5)
            ob.scale = (ob.scale.x * 2.5, ob.scale.y * 2.5, ob.scale.z * 2.5)
    W.point("ng_cardlight", (ref[0], ref[1], ref[2] + 5.0), 300, color=(1, 0.1, 0.1), radius=0.4)
    W.spot("ng_reflight", frame_pt(c, d, pp, 0, -5.5 * s, W.WALK_H + 0.3), (ref[0], ref[1], ref[2] + 2.5), 250, color=(1, 0.85, 0.65), size_deg=35, blend=0.6)
    for a in (-10, 10):
        W.cylinder(f"ng_mast{a}", 0.12, 9, frame_pt(c, d, pp, a, 8.2 * s, W.WALK_H + 4.5), m["pole"], segments=10)
        W.spot(f"ng_flood{a}", frame_pt(c, d, pp, a, 8.2 * s, W.WALK_H + 9), frame_pt(c, d, pp, a * 0.6, 0.5 * s, 0), 1500, color=(1, 0.85, 0.6) if a < 0 else (0.7, 0.8, 1.0), size_deg=70, blend=0.5, radius=0.3)
    W.plaque(stop, (cx + facing[0] * 11.6, cy + facing[1] * 11.6), facing)

# ----------------------------------------------------------------------------- machine learning
def thesis(stop):
    """A transformer hall under scaffolding: layers as lit panels, attention as threads between them."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    pink = W.mat_cluster("ml", 4)
    thread = W.mat_cluster("ml", 1.6)
    layer = W.mat_glass("layer_glass", tint=(0.9, 0.7, 0.8, 1), rough=0.15)
    rng = random.Random(21)
    tokens = []
    for L in range(6):
        a = (L - 2.5) * 2.4
        last = L == 5
        if not last:
            W.box(f"th_layer{L}", (0.12, 7, 5), frame_pt(c, d, pp, a, 0, W.WALK_H + 2.7), W.yaw_of(d), layer)
        else:   # the last layer is still going up: a panel hanging from the top rail, half the tokens
            segment("th_hook", frame_pt(c, d, pp, a, 0, W.WALK_H + 7.0), frame_pt(c, d, pp, a, 0, W.WALK_H + 4.6), 0.02, m["steel"])
            hang = W.box("th_layer5", (0.12, 3.2, 2.2), frame_pt(c, d, pp, a, 0, W.WALK_H + 3.5), W.yaw_of(d), layer)
            hang.rotation_euler = (0.12, 0, W.yaw_of(d))
        row = []
        for i in range(6):
            for j in range(4):
                p = frame_pt(c, d, pp, a, (i - 2.5) * 1.1, W.WALK_H + 1.2 + j * 1.05)
                if rng.random() < (0.4 if last else 0.75):
                    W.sphere(f"th_tok{L}{i}{j}", 0.09, p, pink); row.append(p)
        tokens.append(row)
    faint = W.mat_cluster("ml", 0.9)
    for L in range(5):
        spread = 0.05 + 0.05 * L    # deeper layers: wider posterior
        for k in range(12):
            if tokens[L] and tokens[L + 1]:
                a0, b0 = rng.choice(tokens[L]), rng.choice(tokens[L + 1])
                segment(f"th_att{L}_{k}", a0, b0, 0.014, thread)
                for j in range(4):
                    jb = (b0[0] + rng.uniform(-spread, spread), b0[1] + rng.uniform(-spread, spread), b0[2] + rng.uniform(-spread, spread))
                    segment(f"th_attj{L}_{k}_{j}", a0, jb, 0.006, faint)
    screen("th_attn", 5.0, 5.0, frame_pt(c, d, pp, 0, 4.4 * s, W.WALK_H + 3.4), facing, "attention.png", strength=1.0)
    for a in (-8, -4, 0, 4, 8):
        for b in (-4.5, 4.5):
            W.cylinder(f"th_sc{a}{b}", 0.045, 7, frame_pt(c, d, pp, a, b, W.WALK_H + 3.5), m["steel"], segments=8)
    for z in (2.3, 4.6, 6.9):
        for b in (-4.5, 4.5):
            W.box(f"th_rail{z}{b}", (16.2, 0.05, 0.05), frame_pt(c, d, pp, 0, b, W.WALK_H + z), W.yaw_of(d), m["steel"])
        for a in (-8, 0, 8):
            W.box(f"th_cross{z}{a}", (0.05, 9.1, 0.05), frame_pt(c, d, pp, a, 0, W.WALK_H + z), W.yaw_of(d), m["steel"])
    plank = W.mat_plain("plank", (0.45, 0.35, 0.2, 1), rough=0.8)
    for a in (-6, -2, 2, 6):
        W.box(f"th_plank{a}", (3.6, 0.6, 0.06), frame_pt(c, d, pp, a, 4.5 * s, W.WALK_H + 4.63), W.yaw_of(d), plank)
    hazard = W.mat_emit("hazard", (1, 0.55, 0.05, 1), 3)
    W.box("th_board", (4.4, 0.08, 1.0), frame_pt(c, d, pp, 0, -4.55 * s, W.WALK_H + 7.2), W.yaw_of(d), m["dark"])
    label("th_wip", "EN OBRA", 0.62, frame_pt(c, d, pp, 0, -4.6 * s, W.WALK_H + 7.2), facing, hazard)
    for a in (-5.5, 5.5):   # hazard trestles with roadwork lamps across the front
        for leg in (-0.7, 0.7):
            W.box(f"th_tleg{a}{leg}", (0.08, 0.5, 1.0), frame_pt(c, d, pp, a + leg, -6.2 * s, W.WALK_H + 0.5), W.yaw_of(d), m["pole"])
        for k in range(6):
            W.box(f"th_tbar{a}{k}", (0.3, 0.1, 0.12), frame_pt(c, d, pp, a - 0.75 + k * 0.3, -6.2 * s, W.WALK_H + 1.0), W.yaw_of(d), hazard if k % 2 == 0 else m["dark"])
        W.sphere(f"th_tlamp{a}", 0.15, frame_pt(c, d, pp, a, -6.2 * s, W.WALK_H + 1.25), W.mat_emit("amber_beacon", (1, 0.55, 0.05, 1), 12))
        W.point(f"th_tlight{a}", frame_pt(c, d, pp, a, -6.2 * s, W.WALK_H + 1.5), 60, color=(1, 0.5, 0.1), radius=0.2)
    W.spot("th_key", frame_pt(c, d, pp, 0, -7 * s, 8), frame_pt(c, d, pp, 0, 0, 2.5), 400, color=(1, 0.75, 0.85), size_deg=70, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def nutrition(stop):
    """A giant plate tilted toward the road like a food photo, and the model's receipt: grams per ingredient."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    tilt = math.radians(32)
    # everything on the dish is parented to an empty tilted about the road direction, top edge away from the road
    pivot = bpy.data.objects.new("nt_pivot", None); W.link(pivot)
    pivot.location = (cx, cy, W.WALK_H + 2.4)
    nrm = Vector((facing[0] * math.sin(tilt), facing[1] * math.sin(tilt), math.cos(tilt)))
    pivot.rotation_euler = nrm.to_track_quat("Z", "Y").to_euler()
    tab = W.mat_plain("table", (0.3, 0.2, 0.12, 1), rough=0.6)
    W.cylinder("nt_tleg", 0.7, 2.0, (cx, cy, W.WALK_H + 1.0), tab, segments=24)
    china = W.mat_plain("china", (0.95, 0.95, 0.92, 1), rough=0.12)
    parts = []
    parts.append(W.cylinder("nt_table", 6.2, 0.25, (0, 0, -0.2), tab, segments=64))
    parts.append(W.cylinder("nt_plate", 5.2, 0.12, (0, 0, 0.0), china, segments=96))
    parts.append(W.torus("nt_rim", 5.0, 0.12, (0, 0, 0.1), W.mat_plain("china_blue", (0.2, 0.4, 0.75, 1), rough=0.2), nu=96))
    heaps = [
        ("rice", (-1.7, 0.9), (1.9, 1.5, 0.7), (0.93, 0.9, 0.8)),
        ("chicken", (1.7, 1.2), (2.0, 1.2, 0.7), (0.62, 0.42, 0.25)),
        ("broccoli", (0.2, -1.9), (1.6, 1.6, 1.0), (0.12, 0.42, 0.14)),
        ("tomato", (-2.4, -1.3), (1.0, 1.0, 0.9), (0.8, 0.12, 0.08)),
    ]
    for name, (a, b), (sx, sy, sz), col in heaps:
        ob = W.sphere(f"nt_{name}", 1.0, (a, b, 0.06 + sz * 0.5), W.mat_plain(f"food_{name}", (*col, 1), rough=0.7))
        ob.scale = (sx, sy, sz); parts.append(ob)
    steel = m["steel"]
    parts.append(W.box("nt_knife", (0.5, 5.2, 0.05), (5.9, 0, 0.0), 0, steel))
    parts.append(W.box("nt_fork", (0.5, 5.2, 0.05), (-5.9, 0, 0.0), 0, steel))
    for k in range(4):
        parts.append(W.box(f"nt_tine{k}", (0.09, 1.6, 0.05), (-5.9 - 0.18 + k * 0.12, 2.9, 0.0), 0, steel))
    for ob in parts:
        ob.parent = pivot
    pivot.rotation_euler = (pivot.rotation_euler.x, pivot.rotation_euler.y, pivot.rotation_euler.z)
    # the receipt: what the model read off the photo
    W.box("nt_receipt", (3.0, 0.06, 4.2), frame_pt(c, d, pp, 8.2, 1.5 * s, W.WALK_H + 3.0), W.yaw_of(d), W.mat_plain("paper", (0.92, 0.9, 0.84, 1), rough=0.7, emit=0.55, emit_color=(1, 0.97, 0.9, 1)))
    ink = W.mat_plain("ink", (0.05, 0.05, 0.06, 1), rough=0.8)
    rows = ["nutrition5k", "", "arroz      118 g", "pollo      142 g", "brócoli     76 g", "jitomate    40 g", "", "carbs  43 ± 7.6 g", "protein     31 g"]
    for i, r in enumerate(rows):
        if r:
            W.text(f"nt_row{i}", r, 0.3 if i else 0.4, frame_pt(c, d, pp, 8.2 - 1.3 * (1 if s > 0 else -1) * 0, 1.46 * s, W.WALK_H + 4.85 - i * 0.42), (math.pi / 2, 0, W.yaw_of(W.perp(facing))), ink, extrude=0.003, align="CENTER")
    for a in (7.0, 9.4):
        W.cylinder(f"nt_rpost{a}", 0.05, 1.0, frame_pt(c, d, pp, a, 1.5 * s, W.WALK_H + 0.5), m["pole"], segments=8)
    W.spot("nt_key", (cx + facing[0] * 4, cy + facing[1] * 4, W.WALK_H + 9), (cx, cy, W.WALK_H + 2.6), 900, color=(1, 0.95, 0.85), size_deg=55, blend=0.4, radius=0.5)
    W.spot("nt_rlight", frame_pt(c, d, pp, 8.2, -2 * s, W.WALK_H + 5.5), frame_pt(c, d, pp, 8.2, 1.5 * s, W.WALK_H + 3), 120, color=(1, 0.95, 0.85), size_deg=45, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def model_picker(stop):
    """Three agents under a canopy, the evaluate-mutate loop as a ring of light feeding a memory cabinet, and 13 h on the fascia."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=20, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("mp_roof", (19, 12, 0.3), frame_pt(c, d, pp, 0, 0, W.WALK_H + 5.8), W.yaw_of(d), m["concrete"])
    for a in (-9, 9):
        for b in (-5.5, 5.5):
            W.cylinder(f"mp_col{a}{b}", 0.2, 5.7, frame_pt(c, d, pp, a, b, W.WALK_H + 2.85), m["concrete"], segments=12)
    robot = W.mat_plain("robot", (0.8, 0.8, 0.78, 1), rough=0.3, metallic=0.5)
    eyes = W.mat_cluster("ml", 12)
    for k, (lab, letter) in enumerate((("DATA", "D"), ("MODEL", "M"), ("EVAL", "E"))):
        a = (k - 1) * 5.6
        bench = frame_pt(c, d, pp, a, -0.5 * s, W.WALK_H + 0.45)
        W.box(f"mp_bench{k}", (3.6, 1.4, 0.9), bench, W.yaw_of(d), W.mat_plain("bench", (0.35, 0.3, 0.25, 1), rough=0.7))
        mon = frame_pt(c, d, pp, a, -0.1 * s, W.WALK_H + 1.25)
        W.box(f"mp_mon{k}", (1.6, 0.08, 0.7), mon, W.yaw_of(d), m["dark"])
        label(f"mp_lbl{k}", lab, 0.32, (mon[0] + facing[0] * 0.06, mon[1] + facing[1] * 0.06, mon[2]), facing, W.mat_cluster("ml", 3))
        rb = frame_pt(c, d, pp, a, 1.6 * s, W.WALK_H)
        W.cylinder(f"mp_rbody{k}", 0.55, 1.8, (rb[0], rb[1], rb[2] + 0.9), robot, segments=20)
        W.box(f"mp_rhead{k}", (0.8, 0.7, 0.7), (rb[0], rb[1], rb[2] + 2.3), W.yaw_of(d), robot)
        for e in (-0.18, 0.18):
            W.sphere(f"mp_eye{k}{e}", 0.09, (rb[0] + d[0] * e + facing[0] * 0.36, rb[1] + d[1] * e + facing[1] * 0.36, rb[2] + 2.36), eyes)
        W.point(f"mp_eyelight{k}", (rb[0] + facing[0] * 0.9, rb[1] + facing[1] * 0.9, rb[2] + 2.3), 40, color=(1, 0.4, 0.6), radius=0.2)
        label(f"mp_chest{k}", letter, 0.5, (rb[0] + facing[0] * 0.56, rb[1] + facing[1] * 0.56, rb[2] + 1.2), facing, W.mat_cluster("ml", 4))
        W.point(f"mp_light{k}", frame_pt(c, d, pp, a, 0, W.WALK_H + 5.5), 140, color=(1, 0.9, 0.85), radius=0.25)
    # the loop: a ring of light around the benches, model cards hanging from it, dropping into memory
    ring = W.torus("mp_ring", 6.8, 0.1, (cx, cy, W.WALK_H + 3.8), W.mat_cluster("ml", 1.5), nu=96)
    ring.scale = (1.0, 0.65, 1.0); ring.rotation_euler = (0, 0, W.yaw_of(d))
    card = W.mat_plain("card", (0.95, 0.95, 0.92, 1), rough=0.5, emit=0.4)
    for k in range(6):
        ang = 2 * math.pi * k / 6 + 0.3
        p = frame_pt(c, d, pp, math.cos(ang) * 6.8, math.sin(ang) * 6.8 * 0.65, W.WALK_H + 3.8)
        segment(f"mp_wire{k}", p, (p[0], p[1], p[2] - 0.6), 0.008, m["pole"])
        W.box(f"mp_card{k}", (0.6, 0.04, 0.4), (p[0], p[1], p[2] - 0.85), W.yaw_of(d) + ang, card)
    mem = frame_pt(c, d, pp, 8.6, 1.0 * s, W.WALK_H + 1.0)
    W.box("mp_memory", (1.4, 0.9, 2.0), mem, W.yaw_of(d), m["dark"])
    label("mp_memlbl", "MEMORY", 0.28, (mem[0] + facing[0] * 0.47, mem[1] + facing[1] * 0.47, mem[2] + 0.4), facing, W.mat_cluster("ml", 4))
    segment("mp_drop", frame_pt(c, d, pp, 6.8, 0, W.WALK_H + 3.8), (mem[0], mem[1], mem[2] + 1.0), 0.06, W.mat_cluster("ml", 2.5))
    # the hackathon on the fascia
    W.box("mp_fascia", (4.0, 0.08, 1.2), frame_pt(c, d, pp, 0, -6.06 * s, W.WALK_H + 5.2), W.yaw_of(d), m["dark"])
    label("mp_13h", "13 h", 0.7, frame_pt(c, d, pp, 0, -6.11 * s, W.WALK_H + 5.42), facing, W.mat_cluster("ml", 4))
    label("mp_hack", "OpenAI × Kavak · finalista", 0.26, frame_pt(c, d, pp, 0, -6.11 * s, W.WALK_H + 4.85), facing, m["sign_white"])
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

BUILDERS = {
    "batu": batu, "cfe-bills": cfe_bills, "building-monitors": building_monitors,
    "solar-pipelines": solar_pipelines, "inverter-anomalies": inverter_anomalies,
    "critical-hours": critical_hours, "air-quality": air_quality,
    "spacetime-bayes": spacetime_bayes, "markov-chains": markov_chains, "negreira": negreira,
    "thesis": thesis, "nutrition": nutrition, "model-picker": model_picker,
}
