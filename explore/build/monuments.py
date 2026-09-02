"""Monuments, part A: energy, statistics, machine learning. Imported by world.py.

world.py calls install(namespace) so the geometry/material helpers defined there are
available here as W.<name>. Every builder takes the stop dict and places its monument on a
lot beside the stop's road (W.lot). Lot-local coordinates: `a` runs along the road
direction d, `b` along pp (away from the road is +b when s = +1); frame_pt() converts.
"""
import math
import random
from types import SimpleNamespace

import bmesh
import bpy

W = SimpleNamespace()
GEN = None

def install(ns):
    for k, v in ns.items():
        setattr(W, k, v)
    global GEN
    GEN = W.ASSETS / "gen"

# ----------------------------------------------------------------------------- shared pieces
def screen(name, w, h, loc, facing, image, strength=2.2, tilt=0.0):
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
    W.box(name + "_frame", (w + 0.12, 0.06, h + 0.12), (loc[0] - facing[0] * 0.04, loc[1] - facing[1] * 0.04, loc[2]), W.yaw_of(W.perp(facing)), W.M()["pole"])
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
    for b in (2.5, 5, 7.5):
        cable(f"batu_bus{b}", frame_pt(c, d, pp, -10, b * s, W.WALK_H + 7.6), frame_pt(c, d, pp, 10, b * s, W.WALK_H + 7.6), sag=0.6, r=0.035, mat=m["steel"])
    arms = pylon("batu_pylon", frame_pt(c, d, pp, 0, 9 * s, 0), W.yaw_of(d))
    for k, arm in enumerate(arms[2:4]):
        cable(f"batu_drop{k}", arm, frame_pt(c, d, pp, -10 + 20 * k, 5 * s, W.WALK_H + 8), sag=0.3, r=0.03, mat=m["steel"])
    amber = (1, 0.6, 0.15)
    for a in (-8, 8):
        W.spot(f"batu_flood{a}", frame_pt(c, d, pp, a, -9 * s, 9), frame_pt(c, d, pp, a, -1 * s, 1), 900, color=amber, size_deg=70, blend=0.6)
    label("batu_sign", "SUBESTACIÓN", 0.5, frame_pt(c, d, pp, 0, -10.1 * s, W.WALK_H + 2.6), facing, W.mat_cluster("energy", 3))
    W.plaque(stop, (cx + facing[0] * 12.4, cy + facing[1] * 12.4), facing)

def cfe_bills(stop):
    """The bill engine: a giant CFE bill feeding a gear machine that spits out glowing data cubes."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=14, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    screen("cfe_bill", 4.6, 6.4, frame_pt(c, d, pp, -5, 0, W.WALK_H + 3.6), facing, "bill.png", strength=1.1, tilt=-0.18)
    body = W.mat_plain("machine", (0.16, 0.18, 0.2, 1), rough=0.4, metallic=0.7)
    W.box("cfe_machine", (5, 3.2, 3.4), frame_pt(c, d, pp, 0.5, 0, W.WALK_H + 1.7), W.yaw_of(d), body)
    W.box("cfe_hopper", (2.2, 3.4, 1.2), frame_pt(c, d, pp, -2.1, 0, W.WALK_H + 3.0), W.yaw_of(d), body)
    for k, (a, z, r) in enumerate(((-0.6, 4.3, 1.0), (1.4, 4.6, 0.7), (0.4, 5.3, 0.45))):
        g = frame_pt(c, d, pp, a, -0.2 * s, W.WALK_H + z)
        W.cylinder(f"cfe_gear{k}", r, 0.3, g, m["steel"], segments=24, rot=(math.pi / 2, 0, W.yaw_of(d)))
        for t in range(10):
            ang = 2 * math.pi * t / 10
            W.box(f"cfe_tooth{k}{t}", (0.22, 0.3, 0.22), (g[0] + d[0] * math.cos(ang) * (r + 0.08), g[1] + d[1] * math.cos(ang) * (r + 0.08), g[2] + math.sin(ang) * (r + 0.08)), W.yaw_of(d), m["steel"])
    W.box("cfe_belt", (7, 1.0, 0.25), frame_pt(c, d, pp, 6.5, 0, W.WALK_H + 0.9), W.yaw_of(d), m["dark"])
    for k in range(2):
        W.cylinder(f"cfe_bleg{k}", 0.06, 0.8, frame_pt(c, d, pp, 3.6 + k * 5.6, 0, W.WALK_H + 0.4), m["pole"], segments=8)
    cube = W.mat_cluster("energy", 5)
    for k in range(5):
        W.box(f"cfe_cube{k}", (0.42, 0.42, 0.42), frame_pt(c, d, pp, 3.8 + k * 1.3, 0, W.WALK_H + 1.24), W.yaw_of(d) + 0.3 * k, cube)
    W.point("cfe_glow", frame_pt(c, d, pp, 6, 0, W.WALK_H + 2), 80, color=(1, 0.7, 0.3), radius=0.3)
    wall_light("cfe_key", frame_pt(c, d, pp, 2, 9 * s, 6), frame_pt(c, d, pp, 0, 0, 2), power=500)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def building_monitors(stop):
    """A monitored building: rooftop solar, an inverter at its foot, and its own baseline on the façade."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    Wd, Dp, H = 12.0, 9.0, 14.0
    back = 2.5 * s                     # building sits toward the back of the lot
    front = back - (Dp / 2) * s        # its front face (toward the road)
    W.box("bm_body", (Wd, Dp, H), frame_pt(c, d, pp, 0, back, W.WALK_H + H / 2), W.yaw_of(d), m["concrete"])
    warm = W.mat_emit("window_on", (1.0, 0.86, 0.66, 1), 3.2)
    rng = random.Random(11)
    for fl in range(4):
        for k in range(5):
            a = (k - 2) * 2.3
            W.box(f"bm_w{fl}{k}", (1.3, 0.05, 1.5), frame_pt(c, d, pp, a, front - 0.02 * s, W.WALK_H + 2.0 + fl * 3.2), W.yaw_of(d), warm if rng.random() < 0.55 else m["glass"])
    screen("bm_screen", 8.0, 3.0, frame_pt(c, d, pp, 0, front - 0.25 * s, W.WALK_H + H - 2.4), facing, "baseline.png", strength=1.8)
    panel = W.mat_glass("panel_glass", tint=(0.05, 0.08, 0.2, 1), rough=0.08)
    for r in range(3):
        for k in range(4):
            p = frame_pt(c, d, pp, (k - 1.5) * 2.6, back + (r - 1) * 2.4, W.WALK_H + H + 0.9)
            ob = W.box(f"bm_pv{r}{k}", (2.2, 1.4, 0.06), p, W.yaw_of(d), panel)
            ob.rotation_euler = (0.45 * s, 0, W.yaw_of(d))
            W.cylinder(f"bm_pvleg{r}{k}", 0.05, 0.9, (p[0], p[1], p[2] - 0.45), m["pole"], segments=8)
    inv = frame_pt(c, d, pp, 4.2, front - 1.2 * s, W.WALK_H + 0.9)
    W.box("bm_inv", (1.1, 0.7, 1.8), inv, W.yaw_of(d), W.mat_plain("cabinet", (0.75, 0.75, 0.72, 1), rough=0.5, metallic=0.2))
    W.sphere("bm_led", 0.05, (inv[0] + facing[0] * 0.38, inv[1] + facing[1] * 0.38, inv[2] + 0.5), W.mat_emit("led_green", (0.1, 1, 0.3, 1), 10))
    for a in (-5, 5):
        wall_light(f"bm_up{a}", frame_pt(c, d, pp, a, front - 3 * s, 0.3), frame_pt(c, d, pp, a, front, 9), power=350, size=45)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def solar_pipelines(stop):
    """A solar field whose pipes carry glowing pulses into a data tank."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=18, width=24, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    panel = W.mat_glass("panel_glass", tint=(0.05, 0.08, 0.2, 1), rough=0.08)
    for r in range(4):
        for k in range(6):
            p = frame_pt(c, d, pp, (k - 2.5) * 3.2, (-4 + r * 3.0) * s, W.WALK_H + 1.3)
            ob = W.box(f"sp_pv{r}{k}", (2.8, 1.6, 0.06), p, W.yaw_of(d), panel)
            ob.rotation_euler = (0.5 * s, 0, W.yaw_of(d))
            W.cylinder(f"sp_leg{r}{k}", 0.06, 1.3, (p[0], p[1], p[2] - 0.65), m["pole"], segments=8)
    pipe = W.mat_plain("pipe", (0.55, 0.56, 0.58, 1), rough=0.3, metallic=0.9)
    trunk = [frame_pt(c, d, pp, -9, 6.2 * s, W.WALK_H + 0.5), frame_pt(c, d, pp, 9, 6.2 * s, W.WALK_H + 0.5),
             frame_pt(c, d, pp, 9, 8.2 * s, W.WALK_H + 0.5), frame_pt(c, d, pp, 9, 8.2 * s, W.WALK_H + 2.5)]
    for i in range(len(trunk) - 1):
        segment(f"sp_trunk{i}", trunk[i], trunk[i + 1], 0.18, pipe)
    for k in range(6):
        segment(f"sp_branch{k}", frame_pt(c, d, pp, (k - 2.5) * 3.2, 5 * s, W.WALK_H + 0.5), frame_pt(c, d, pp, (k - 2.5) * 3.2, 6.2 * s, W.WALK_H + 0.5), 0.09, pipe)
    pulse = W.mat_cluster("energy", 9)
    for k in range(9):
        W.sphere(f"sp_pulse{k}", 0.12, frame_pt(c, d, pp, -8 + k * 2.1, 6.2 * s, W.WALK_H + 0.5), pulse)
    for a in (-7, 0, 7):
        lp = frame_pt(c, d, pp, a, 1 * s, W.WALK_H)
        W.cylinder(f"sp_lamp{a}", 0.06, 5.5, (lp[0], lp[1], lp[2] + 2.75), m["pole"], segments=8)
        W.box(f"sp_lamphead{a}", (0.5, 0.25, 0.1), (lp[0], lp[1], lp[2] + 5.5), W.yaw_of(d), m["lamp"])
        W.spot(f"sp_light{a}", (lp[0], lp[1], lp[2] + 5.4), (lp[0], lp[1], 0), 1200, color=(1, 0.85, 0.65), size_deg=130, blend=0.6, radius=0.3)
    tank = frame_pt(c, d, pp, 9, 8.2 * s, W.WALK_H + 2.5)
    W.cylinder("sp_tank", 1.6, 4.4, tank, m["glass"], segments=48)
    W.cylinder("sp_level", 1.5, 2.6, (tank[0], tank[1], tank[2] - 0.8), W.mat_cluster("energy", 1.6), segments=48)
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
        bad = k == 4
        led = W.mat_emit("led_red", (1, 0.05, 0.05, 1), 14) if bad else W.mat_emit("led_green", (0.1, 1, 0.3, 1), 10)
        W.sphere(f"ia_led{k}", 0.07, (base[0] + facing[0] * 0.42, base[1] + facing[1] * 0.42, base[2] + 1.7), led)
        if bad:
            W.point("ia_redlight", (base[0] + facing[0] * 1.2, base[1] + facing[1] * 1.2, base[2] + 1.6), 160, color=(1, 0.1, 0.1), radius=0.3)
    screen("ia_screen", 7.0, 2.6, frame_pt(c, d, pp, 0, 2.6 * s, W.WALK_H + 3.2), facing, "telemetry.png", strength=1.8)
    for a in (-6, 6):
        W.cylinder(f"ia_post{a}", 0.08, 3.2, frame_pt(c, d, pp, a, 2.6 * s, W.WALK_H + 1.6), m["pole"], segments=8)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

def critical_hours(stop):
    """A clock tower whose faces mark the 100 critical hours of the year in red."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=12, along=5.0)
    pp = W.perp(d)
    H = 24.0
    W.box("ch_tower", (5, 5, H), (cx, cy, W.WALK_H + H / 2), W.yaw_of(d), m["brick"])
    W.box("ch_cap", (5.8, 5.8, 0.6), (cx, cy, W.WALK_H + H + 0.3), W.yaw_of(d), m["concrete"])
    face = W.mat_plain("clock_face", (0.92, 0.9, 0.82, 1), rough=0.6, emit=0.8, emit_color=(1, 0.95, 0.8, 1))
    red = W.mat_emit("clock_red", (1, 0.08, 0.05, 1), 6)
    rng = random.Random(100)
    crit = set(rng.sample(range(120), 22))
    for fi, fdir in enumerate(((1, 0), (-1, 0), (0, 1), (0, -1))):
        n = (d[0] * fdir[0] + pp[0] * fdir[1], d[1] * fdir[0] + pp[1] * fdir[1])   # outward normal
        t = W.perp(n)                                                              # tangent along the face
        fc = (cx + n[0] * 2.52, cy + n[1] * 2.52, W.WALK_H + H - 4.5)
        rz = W.yaw_of(t)
        W.cylinder(f"ch_face{fi}", 1.9, 0.06, fc, face, segments=64, rot=(math.pi / 2, 0, rz))
        for k in range(120):
            ang = 2 * math.pi * k / 120
            r = 1.72
            p = (fc[0] + t[0] * math.cos(ang) * r + n[0] * 0.05, fc[1] + t[1] * math.cos(ang) * r + n[1] * 0.05, fc[2] + math.sin(ang) * r)
            W.box(f"ch_tick{fi}_{k}", (0.05, 0.05, 0.16 if k % 10 == 0 else 0.08), p, rz, red if k in crit else m["dark"])
        for L, wdt, ang in ((1.2, 0.09, 0.9), (1.55, 0.06, -2.1)):
            hp = (fc[0] + t[0] * math.cos(ang) * L / 2 + n[0] * 0.09, fc[1] + t[1] * math.cos(ang) * L / 2 + n[1] * 0.09, fc[2] + math.sin(ang) * L / 2)
            ob = W.box(f"ch_hand{fi}_{L}", (L, 0.05, wdt), hp, rz, m["dark"])
            ob.rotation_euler = (0, -ang, rz)
        W.spot(f"ch_facelight{fi}", (fc[0] + n[0] * 6, fc[1] + n[1] * 6, fc[2] - 2), fc, 220, color=(1, 0.9, 0.75), size_deg=40, blend=0.6)
    label("ch_num", "100", 0.9, (cx + facing[0] * 2.53, cy + facing[1] * 2.53, W.WALK_H + 5.5), facing, red)
    W.plaque(stop, (cx + facing[0] * 6.6, cy + facing[1] * 6.6), facing)

def air_quality(stop):
    """An overlook: a bench at a railing, and below it a basin filled with brown smog over city lights."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=8, width=14, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    wood = W.mat_plain("wood", (0.32, 0.2, 0.1, 1), rough=0.7)
    for k in range(4):
        W.box(f"aq_slat{k}", (2.2, 0.12, 0.04), frame_pt(c, d, pp, 0, (-1.7 + k * 0.14) * s, W.WALK_H + 0.48), W.yaw_of(d), wood)
    for k in range(3):
        W.box(f"aq_back{k}", (2.2, 0.04, 0.12), frame_pt(c, d, pp, 0, -1.92 * s, W.WALK_H + 0.75 + k * 0.16), W.yaw_of(d), wood)
    for a in (-0.95, 0.95):
        W.box(f"aq_bleg{a}", (0.08, 0.6, 0.46), frame_pt(c, d, pp, a, -1.5 * s, W.WALK_H + 0.23), W.yaw_of(d), m["pole"])
    edge = 6.0 * s
    for a in range(-7, 8, 2):
        W.cylinder(f"aq_rp{a}", 0.03, 1.1, frame_pt(c, d, pp, a, edge, W.WALK_H + 0.55), m["pole"], segments=8)
    W.box("aq_rail", (14, 0.05, 0.05), frame_pt(c, d, pp, 0, edge, W.WALK_H + 1.1), W.yaw_of(d), m["pole"])
    smog = bpy.data.materials.new("smog"); smog.use_nodes = True
    nt = smog.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.45, 0.32, 0.18, 1); vol.inputs["Density"].default_value = 0.06
    vol.inputs["Emission Strength"].default_value = 0.02; vol.inputs["Emission Color"].default_value = (0.8, 0.5, 0.25, 1)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    W.box("aq_smog", (40, 26, 7), frame_pt(c, d, pp, 0, edge + 15 * s, -4.5), W.yaw_of(d), smog)
    rng = random.Random(5)
    lit = W.mat_emit("city_light", (1, 0.75, 0.45, 1), 25)
    for k in range(140):
        a = rng.uniform(-19, 19); b = rng.uniform(3, 27)
        W.box(f"aq_city{k}", (0.3, 0.3, 0.3), frame_pt(c, d, pp, a, edge + b * s, -7.6), 0, lit)
    W.spot("aq_lamp", frame_pt(c, d, pp, 2.5, -2.5 * s, 3.2), frame_pt(c, d, pp, 0, -1 * s, 0.5), 120, color=(1, 0.85, 0.6), size_deg=70, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 5.4, cy + facing[1] * 5.4), facing)

# ----------------------------------------------------------------------------- statistics
def spacetime_bayes(stop):
    """Thirty-two states as a stepped relief, incidence as height, with the space-time heatmap beside it."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=16, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    rng = random.Random(32)
    top = W.mat_cluster("stats", 1.4)
    for i in range(8):
        for j in range(4):
            h = 0.6 + 2.6 * (0.3 + 0.7 * rng.random()) * (0.5 + 0.5 * (j / 3))
            p = frame_pt(c, d, pp, (i - 3.5) * 1.5, ((j - 1.5) * 1.5 - 1.5) * s, W.WALK_H + h / 2)
            W.box(f"sb_col{i}{j}", (1.3, 1.3, h), p, W.yaw_of(d), m["concrete"])
            W.box(f"sb_top{i}{j}", (1.1, 1.1, 0.04), (p[0], p[1], W.WALK_H + h + 0.02), W.yaw_of(d), top)
    screen("sb_heat", 7.0, 3.5, frame_pt(c, d, pp, 0, 5.4 * s, W.WALK_H + 3.0), facing, "spacetime.png", strength=1.6)
    label("sb_lbl", "32 estados · 2003 – 2024", 0.32, frame_pt(c, d, pp, 0, 5.3 * s, W.WALK_H + 0.9), facing, W.mat_cluster("stats", 2.5))
    W.spot("sb_light", frame_pt(c, d, pp, 6, -6 * s, 7), frame_pt(c, d, pp, 0, -1 * s, 1), 500, color=(0.75, 0.85, 1.0), size_deg=70, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def markov_chains(stop):
    """The delivery truck of the four-state model on a plinth, and the SEIR chain as a sculpture."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("mc_plinth", (8, 4, 1.0), frame_pt(c, d, pp, -3, 0, W.WALK_H + 0.5), W.yaw_of(d), m["concrete"])
    paint = W.mat_plain("truck_white", (0.85, 0.86, 0.84, 1), rough=0.35, metallic=0.1)
    z0 = W.WALK_H + 1.0
    W.box("mc_cab", (2.0, 2.2, 2.1), frame_pt(c, d, pp, -5.6, 0, z0 + 1.55), W.yaw_of(d), paint)
    W.box("mc_body", (4.4, 2.4, 2.6), frame_pt(c, d, pp, -2.3, 0, z0 + 1.9), W.yaw_of(d), paint)
    W.box("mc_chassis", (6.8, 2.0, 0.4), frame_pt(c, d, pp, -3.4, 0, z0 + 0.65), W.yaw_of(d), m["dark"])
    W.box("mc_windshield", (0.05, 1.8, 0.9), frame_pt(c, d, pp, -6.63, 0, z0 + 1.9), W.yaw_of(d), m["glass"])
    for a in (-5.9, -3.2, -1.6):
        for b in (1.05, -1.05):
            W.cylinder(f"mc_wheel{a}{b}", 0.5, 0.35, frame_pt(c, d, pp, a, b, z0 + 0.5), m["dark"], segments=24, rot=(math.pi / 2, 0, W.yaw_of(d)))
    for b in (0.7, -0.7):
        W.sphere(f"mc_hl{b}", 0.12, frame_pt(c, d, pp, -6.62, b, z0 + 1.1), W.mat_emit("headlight", (1, 0.95, 0.8, 1), 20))
    W.sphere("mc_warning", 0.16, frame_pt(c, d, pp, -5.6, 0, z0 + 2.75), W.mat_emit("amber_beacon", (1, 0.55, 0.05, 1), 15))
    W.point("mc_warning_l", frame_pt(c, d, pp, -5.6, 0, z0 + 3.0), 80, color=(1, 0.5, 0.05), radius=0.2)
    blue = W.mat_cluster("stats", 3.5)
    pts = []
    for k, lab in enumerate("SEIR"):
        p = frame_pt(c, d, pp, 2.2 + k * 2.0, 1.5 * s, W.WALK_H + 2.2)
        pts.append(p)
        W.sphere(f"mc_state{k}", 0.55, p, blue)
        label(f"mc_lbl{k}", lab, 0.55, (p[0] + facing[0] * 0.56, p[1] + facing[1] * 0.56, p[2]), facing, m["sign_white"])
        W.cylinder(f"mc_post{k}", 0.05, 2.2, (p[0], p[1], W.WALK_H + 1.1), m["pole"], segments=8)
    for k in range(3):
        segment(f"mc_edge{k}", pts[k], pts[k + 1], 0.06, m["steel"])
    W.spot("mc_key", frame_pt(c, d, pp, -3, -6 * s, 6), frame_pt(c, d, pp, -3, 0, 2), 500, color=(0.85, 0.9, 1.0), size_deg=60, blend=0.6)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

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
    W.box("ng_board", (6, 0.3, 2.2), frame_pt(c, d, pp, 0, 8.6 * s, W.WALK_H + 4.6), W.yaw_of(d), m["dark"])
    for a in (-2.6, 2.6):
        W.cylinder(f"ng_bpost{a}", 0.1, 3.5, frame_pt(c, d, pp, a, 8.6 * s, W.WALK_H + 1.75), m["pole"], segments=10)
    amber = W.mat_emit("score_amber", (1, 0.6, 0.1, 1), 8)
    label("ng_score", "BARÇA  2 – 1  RESTO", 0.55, frame_pt(c, d, pp, 0, 8.42 * s, W.WALK_H + 5.0), facing, amber)
    label("ng_xg", "xG  1.1 – 1.6   ·   ΔΔΔ", 0.32, frame_pt(c, d, pp, 0, 8.42 * s, W.WALK_H + 4.2), facing, m["sign_white"])
    W.box("ng_plinth", (1.6, 1.6, 0.5), frame_pt(c, d, pp, 6, -7.5 * s, W.WALK_H + 0.25), W.yaw_of(d), m["concrete"])
    humanoid("ng_ref", frame_pt(c, d, pp, 6, -7.5 * s, W.WALK_H + 0.5), W.yaw_of(facing), m["bronze"], card=True)
    for a in (-10, 10):
        W.cylinder(f"ng_mast{a}", 0.12, 9, frame_pt(c, d, pp, a, 8.2 * s, W.WALK_H + 4.5), m["pole"], segments=10)
        W.spot(f"ng_flood{a}", frame_pt(c, d, pp, a, 8.2 * s, W.WALK_H + 9), frame_pt(c, d, pp, a / 2, 0, 0), 1500, color=(0.95, 0.97, 1.0), size_deg=80, blend=0.5, radius=0.3)
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
        W.box(f"th_layer{L}", (0.12, 7, 5), frame_pt(c, d, pp, a, 0, W.WALK_H + 2.7), W.yaw_of(d), layer)
        row = []
        for i in range(6):
            for j in range(4):
                p = frame_pt(c, d, pp, a, (i - 2.5) * 1.1, W.WALK_H + 1.2 + j * 1.05)
                if rng.random() < 0.75:
                    W.sphere(f"th_tok{L}{i}{j}", 0.09, p, pink); row.append(p)
        tokens.append(row)
    for L in range(5):
        for k in range(14):
            if tokens[L] and tokens[L + 1]:
                segment(f"th_att{L}_{k}", rng.choice(tokens[L]), rng.choice(tokens[L + 1]), 0.012, thread)
    screen("th_attn", 3.6, 3.6, frame_pt(c, d, pp, 8.2, 0, W.WALK_H + 3.2), facing, "attention.png", strength=1.4)
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
    label("th_wip", "EN OBRA", 0.42, frame_pt(c, d, pp, -6, -4.6 * s, W.WALK_H + 5.6), facing, W.mat_emit("hazard", (1, 0.55, 0.05, 1), 5))
    W.spot("th_key", frame_pt(c, d, pp, 0, -7 * s, 8), frame_pt(c, d, pp, 0, 0, 2.5), 400, color=(1, 0.75, 0.85), size_deg=70, blend=0.7)
    W.plaque(stop, (cx + facing[0] * 9.6, cy + facing[1] * 9.6), facing)

def nutrition(stop):
    """A giant plate on a table, food heaps with their estimated grams floating above."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=16, width=16, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    tab = W.mat_plain("table", (0.3, 0.2, 0.12, 1), rough=0.6)
    W.cylinder("nt_table", 6.5, 0.25, (cx, cy, W.WALK_H + 1.0), tab, segments=64)
    W.cylinder("nt_tleg", 0.6, 0.9, (cx, cy, W.WALK_H + 0.45), tab, segments=24)
    china = W.mat_plain("china", (0.95, 0.95, 0.92, 1), rough=0.12)
    W.cylinder("nt_plate", 5.2, 0.12, (cx, cy, W.WALK_H + 1.18), china, segments=96)
    W.torus("nt_rim", 5.0, 0.12, (cx, cy, W.WALK_H + 1.3), W.mat_plain("china_blue", (0.2, 0.4, 0.75, 1), rough=0.2), nu=96)
    heaps = [
        ("rice", (-1.6, 0.8), (1.9, 1.5, 0.7), (0.93, 0.9, 0.8), "arroz  118 g · carbs 32 g"),
        ("chicken", (1.7, 1.1), (2.0, 1.2, 0.7), (0.62, 0.42, 0.25), "pollo  142 g · protein 31 g"),
        ("broccoli", (0.2, -1.9), (1.6, 1.6, 1.0), (0.12, 0.42, 0.14), "brócoli  76 g · carbs 5 g"),
        ("tomato", (-2.4, -1.2), (1.0, 1.0, 0.9), (0.8, 0.12, 0.08), "jitomate  40 g"),
    ]
    for name, (a, b), (sx, sy, sz), col, lab in heaps:
        p = frame_pt(c, d, pp, a, b * s, W.WALK_H + 1.24 + sz * 0.5)
        ob = W.sphere(f"nt_{name}", 1.0, p, W.mat_plain(f"food_{name}", (*col, 1), rough=0.7))
        ob.scale = (sx, sy, sz)
        label(f"nt_lbl_{name}", lab, 0.26, (p[0], p[1], W.WALK_H + 3.3 + sz), facing, W.mat_cluster("ml", 3))
        segment(f"nt_pin_{name}", (p[0], p[1], p[2] + sz * 0.5), (p[0], p[1], W.WALK_H + 3.1 + sz), 0.012, W.mat_cluster("ml", 1.5))
    steel = m["steel"]
    W.box("nt_knife", (0.5, 5.2, 0.05), frame_pt(c, d, pp, 5.9, 0, W.WALK_H + 1.15), W.yaw_of(d), steel)
    W.box("nt_fork", (0.5, 5.2, 0.05), frame_pt(c, d, pp, -5.9, 0, W.WALK_H + 1.15), W.yaw_of(d), steel)
    for k in range(4):
        W.box(f"nt_tine{k}", (0.09, 1.6, 0.05), frame_pt(c, d, pp, -5.9 - 0.18 + k * 0.12, 2.8, W.WALK_H + 1.15), W.yaw_of(d), steel)
    W.spot("nt_key", (cx, cy, W.WALK_H + 9), (cx, cy, W.WALK_H + 1.3), 900, color=(1, 0.95, 0.85), size_deg=60, blend=0.4, radius=0.5)
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

def model_picker(stop):
    """A workshop with three benches: data, model, eval, each with its robot and screen."""
    m = W.M()
    (cx, cy), facing, d, s = W.lot(stop["id"], depth=12, width=18, along=5.0)
    pp = W.perp(d); c = (cx, cy)
    W.box("mp_roof", (17, 10, 0.3), frame_pt(c, d, pp, 0, 0, W.WALK_H + 4.6), W.yaw_of(d), m["concrete"])
    for a in (-8, 8):
        for b in (-4.5, 4.5):
            W.cylinder(f"mp_col{a}{b}", 0.18, 4.5, frame_pt(c, d, pp, a, b, W.WALK_H + 2.25), m["concrete"], segments=12)
    robot = W.mat_plain("robot", (0.8, 0.8, 0.78, 1), rough=0.3, metallic=0.5)
    eyes = W.mat_cluster("ml", 12)
    for k, lab in enumerate(("DATA", "MODEL", "EVAL")):
        a = (k - 1) * 5.2
        bench = frame_pt(c, d, pp, a, 0.5 * s, W.WALK_H + 0.45)
        W.box(f"mp_bench{k}", (3.6, 1.4, 0.9), bench, W.yaw_of(d), W.mat_plain("bench", (0.35, 0.3, 0.25, 1), rough=0.7))
        mon = frame_pt(c, d, pp, a, 0.9 * s, W.WALK_H + 1.55)
        W.box(f"mp_mon{k}", (1.6, 0.08, 1.0), mon, W.yaw_of(d), m["dark"])
        label(f"mp_lbl{k}", lab, 0.34, (mon[0] + facing[0] * 0.06, mon[1] + facing[1] * 0.06, mon[2] + 0.05), facing, W.mat_cluster("ml", 4))
        rb = frame_pt(c, d, pp, a, 2.4 * s, W.WALK_H)
        W.cylinder(f"mp_rbody{k}", 0.42, 1.3, (rb[0], rb[1], rb[2] + 0.65), robot, segments=20)
        W.box(f"mp_rhead{k}", (0.6, 0.55, 0.5), (rb[0], rb[1], rb[2] + 1.6), W.yaw_of(d), robot)
        for e in (-0.14, 0.14):
            W.sphere(f"mp_eye{k}{e}", 0.06, (rb[0] + d[0] * e + facing[0] * 0.29, rb[1] + d[1] * e + facing[1] * 0.29, rb[2] + 1.62), eyes)
        W.point(f"mp_light{k}", frame_pt(c, d, pp, a, 0, W.WALK_H + 4.3), 140, color=(1, 0.9, 0.85), radius=0.25)
    W.box("mp_conveyor", (12, 0.5, 0.15), frame_pt(c, d, pp, 0, -1.2 * s, W.WALK_H + 0.8), W.yaw_of(d), m["dark"])
    for k in range(7):
        W.box(f"mp_csv{k}", (0.5, 0.36, 0.05), frame_pt(c, d, pp, -5.4 + k * 1.8, -1.2 * s, W.WALK_H + 0.9), W.yaw_of(d), m["sign_white"])
    W.plaque(stop, (cx + facing[0] * 8.6, cy + facing[1] * 8.6), facing)

BUILDERS = {
    "batu": batu, "cfe-bills": cfe_bills, "building-monitors": building_monitors,
    "solar-pipelines": solar_pipelines, "inverter-anomalies": inverter_anomalies,
    "critical-hours": critical_hours, "air-quality": air_quality,
    "spacetime-bayes": spacetime_bayes, "markov-chains": markov_chains, "negreira": negreira,
    "thesis": thesis, "nutrition": nutrition, "model-picker": model_picker,
}
