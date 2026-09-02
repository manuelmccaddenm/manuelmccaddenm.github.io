"""Build the night district and render one equirectangular panorama per road node.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P explore/build/world.py -- [flags]

    --nodes a,b,c   render only these node ids (default: all nodes in graph.json)
    --stops         render only the 23 stop nodes
    --samples N     cycles samples (default 96)
    --res W         panorama width in px, height is W/2 (default 3072)
    --test          1024x512, 16 samples, first node only
    --compass       add N/E/S/W markers around ITAM (viewer calibration)
    --save          also save explore/build/world.blend

World: x east, y north, z up, metres. The camera at every node faces north, so the
centre column of each panorama is bearing 0 and bearing grows to the right.
"""
import json
import math
import random
import sys
import time
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = HERE / "assets"
PANOS = ROOT / "explore" / "panos"
GRAPH = json.loads((ROOT / "explore" / "graph.json").read_text())

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def flag(name, default=None):
    if name in argv:
        i = argv.index(name)
        return argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith("--") else True
    return default

SAMPLES = int(flag("--samples", 96))
RES_W = int(flag("--res", 3072))
TEST = flag("--test", False)
if TEST:
    SAMPLES, RES_W = 16, 1024

CLUSTER_COLOR = {
    "energy": "#c98500", "stats": "#3987e5", "ml": "#d55181",
    "math": "#199e70", "dataeng": "#d95926", "product": "#9085e9", None: "#ded9cf",
}
CLUSTER_NAME = {
    "energy": "energy", "stats": "statistics", "ml": "machine learning",
    "math": "mathematics", "dataeng": "data engineering", "product": "products",
}
ROAD_W, WALK_W, WALK_H = 8.0, 2.0, 0.15
EYE = 1.65
random.seed(7)

# ----------------------------------------------------------------------------- helpers
def hex_rgb(h, gamma=True):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    if gamma:  # sRGB -> linear
        c = [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]
    return (*c, 1.0)

def unit(dx, dy):
    n = math.hypot(dx, dy) or 1.0
    return (dx / n, dy / n)

def perp(d):  # left-hand perpendicular
    return (-d[1], d[0])

def yaw_of(d):  # rotation about z so that local +x points along d
    return math.atan2(d[1], d[0])

COLL = None
def link(obj):
    COLL.objects.link(obj)
    return obj

def mesh_obj(name, verts, faces, mat=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    if mat:
        me.materials.append(mat)
    return link(ob)

def box(name, size, loc, rot_z=0.0, mat=None):
    sx, sy, sz = size[0] / 2, size[1] / 2, size[2] / 2
    v = [(-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
         (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz)]
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    ob = mesh_obj(name, v, f, mat)
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_z)
    return ob

def bmesh_obj(name, fn, mat=None, smooth=True):
    bm = bmesh.new()
    fn(bm)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    if mat:
        me.materials.append(mat)
    return link(ob)

def cylinder(name, radius, depth, loc, mat=None, segments=48, rot=(0, 0, 0)):
    ob = bmesh_obj(name, lambda bm: bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segments,
        radius1=radius, radius2=radius, depth=depth), mat)
    ob.location = loc; ob.rotation_euler = rot
    return ob

def sphere(name, radius, loc, mat=None):
    ob = bmesh_obj(name, lambda bm: bmesh.ops.create_uvsphere(
        bm, u_segments=32, v_segments=16, radius=radius), mat)
    ob.location = loc
    return ob

def torus(name, R, r, loc, mat=None, rot=(0, 0, 0), nu=48, nv=16):
    verts, faces = [], []
    for i in range(nu):
        a = 2 * math.pi * i / nu
        for j in range(nv):
            b = 2 * math.pi * j / nv
            verts.append(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    for i in range(nu):
        for j in range(nv):
            a, b = i * nv + j, i * nv + (j + 1) % nv
            c, d = ((i + 1) % nu) * nv + (j + 1) % nv, ((i + 1) % nu) * nv + j
            faces.append((a, b, c, d))
    ob = mesh_obj(name, verts, faces, mat, smooth=True)
    ob.location = loc; ob.rotation_euler = rot
    return ob

def grid(name, size, subdiv, loc, mat=None):
    ob = bmesh_obj(name, lambda bm: bmesh.ops.create_grid(
        bm, x_segments=subdiv, y_segments=subdiv, size=size / 2), mat)
    ob.location = loc
    return ob

FONT = None
def text(name, body, size, loc, rot=(math.pi / 2, 0, 0), mat=None, extrude=0.0, align="CENTER", width=None):
    cu = bpy.data.curves.new(name, type="FONT")
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = "CENTER" if width is None else "TOP"
    if FONT:
        cu.font = FONT
    if width:
        cu.text_boxes[0].width = width
    ob = bpy.data.objects.new(name, cu)
    ob.location = loc; ob.rotation_euler = rot
    if mat:
        cu.materials.append(mat)
    return link(ob)

def spot(name, loc, target, power, color=(1, 0.78, 0.55), size_deg=70, blend=0.6, radius=0.15):
    li = bpy.data.lights.new(name, "SPOT")
    li.energy = power; li.color = color[:3]
    li.spot_size = math.radians(size_deg); li.spot_blend = blend
    li.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return link(ob)

def point(name, loc, power, color=(1, 0.78, 0.55), radius=0.1):
    li = bpy.data.lights.new(name, "POINT")
    li.energy = power; li.color = color[:3]; li.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    return link(ob)

# ----------------------------------------------------------------------------- materials
MATS = {}
def _new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    return m, nt, bsdf

def _img(path, non_color=True):
    img = bpy.data.images.load(str(path), check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img

def mat_pbr(key, prefix, tile=3.0, base=None, rough_default=0.8, normal_strength=1.0, sheen=0.0):
    """Principled material driven by Poly Haven maps, box-projected in object space (no UVs needed)."""
    if key in MATS:
        return MATS[key]
    m, nt, bsdf = _new_mat(key)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1 / tile)
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    def tex(short, non_color=True):
        p = ASSETS / f"{prefix}_{short}.jpg"
        if not p.exists():
            return None
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = _img(p, non_color); t.projection = "BOX"; t.projection_blend = 0.25
        nt.links.new(mapping.outputs["Vector"], t.inputs["Vector"])
        return t
    d = tex("diff", non_color=False)
    if d and base is None:
        nt.links.new(d.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = base or (0.5, 0.5, 0.5, 1)
    r = tex("rough")
    if r:
        nt.links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
    else:
        bsdf.inputs["Roughness"].default_value = rough_default
    n = tex("nor")
    if n:
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(n.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    if sheen:
        bsdf.inputs["Sheen Weight"].default_value = sheen
    MATS[key] = m
    return m

def mat_plain(key, color, rough=0.5, metallic=0.0, emit=0.0, emit_color=None):
    if key in MATS:
        return MATS[key]
    m, nt, bsdf = _new_mat(key)
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if emit:
        bsdf.inputs["Emission Color"].default_value = emit_color or color
        bsdf.inputs["Emission Strength"].default_value = emit
    MATS[key] = m
    return m

def mat_emit(key, color, strength):
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = color; e.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs["Emission"], out.inputs["Surface"])
    MATS[key] = m
    return m

def mat_glass(key="glass", tint=(0.85, 0.92, 0.95, 1), rough=0.02):
    if key in MATS:
        return MATS[key]
    m, nt, bsdf = _new_mat(key)
    bsdf.inputs["Base Color"].default_value = tint
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["IOR"].default_value = 1.45
    MATS[key] = m
    return m

def mat_gold():
    if "gold" in MATS:
        return MATS["gold"]
    m, nt, bsdf = _new_mat("gold")
    bsdf.inputs["Base Color"].default_value = (1.0, 0.71, 0.29, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 420; noise.inputs["Detail"].default_value = 6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.4; ramp.color_ramp.elements[0].color = (0.22, 0.22, 0.22, 1)
    ramp.color_ramp.elements[1].position = 0.6; ramp.color_ramp.elements[1].color = (0.34, 0.34, 0.34, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.02
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    MATS["gold"] = m
    return m

def M():
    """Material palette."""
    return dict(
        asphalt=mat_pbr("asphalt", "asphalt", tile=3.0),
        concrete=mat_pbr("concrete", "concrete", tile=2.2),
        brick=mat_pbr("brick", "brick", tile=2.4),
        paint_white=mat_plain("paint_white", (0.82, 0.82, 0.78, 1), rough=0.6),
        paint_yellow=mat_plain("paint_yellow", (0.85, 0.62, 0.12, 1), rough=0.6),
        steel=mat_plain("steel", (0.28, 0.29, 0.3, 1), rough=0.35, metallic=1.0),
        pole=mat_plain("pole", (0.06, 0.07, 0.07, 1), rough=0.45, metallic=0.6),
        sign_green=mat_plain("sign_green", (0.02, 0.22, 0.10, 1), rough=0.35),
        sign_white=mat_plain("sign_white", (0.92, 0.92, 0.9, 1), rough=0.3, emit=0.35),
        bronze=mat_plain("bronze", (0.35, 0.22, 0.10, 1), rough=0.4, metallic=1.0),
        lamp=mat_emit("lamp", (1.0, 0.8, 0.58, 1), 40),
        glass=mat_glass(),
        gold=mat_gold(),
        dark=mat_plain("dark", (0.02, 0.02, 0.02, 1), rough=0.9),
    )

def mat_cluster(cluster, strength=6.0):
    return mat_emit(f"emit_{cluster}_{strength}", hex_rgb(CLUSTER_COLOR[cluster]), strength)

# ----------------------------------------------------------------------------- scene
def reset():
    global COLL, FONT
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll_name in ("meshes", "materials", "lights", "cameras", "curves", "images"):
        for d in list(getattr(bpy.data, coll_name)):
            getattr(bpy.data, coll_name).remove(d)
    COLL = bpy.data.collections.new("district")
    bpy.context.scene.collection.children.link(COLL)
    for f in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        if Path(f).exists():
            FONT = bpy.data.fonts.load(f); break

def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
    except Exception as e:  # fall back to CPU
        print("GPU setup failed, using CPU:", e)
    sc.cycles.samples = SAMPLES
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    sc.cycles.max_bounces = 6
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.resolution_x = RES_W
    sc.render.resolution_y = RES_W // 2
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 88
    sc.render.image_settings.color_mode = "RGB"
    try:
        sc.view_settings.view_transform = "AgX"
        sc.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        sc.view_settings.view_transform = "Filmic"
    sc.view_settings.exposure = 1.3
    # glare on the lamps and signs
    try:
        tree = None
        if hasattr(sc, "compositing_node_group"):
            tree = bpy.data.node_groups.new("comp", "CompositorNodeTree")
            sc.compositing_node_group = tree
        else:
            sc.use_nodes = True
            tree = sc.node_tree
            for n in list(tree.nodes):
                tree.nodes.remove(n)
        rl = tree.nodes.new("CompositorNodeRLayers")
        glare = tree.nodes.new("CompositorNodeGlare")
        # Blender 5.x exposes the glare settings as sockets; 4.x as properties
        if "Type" in glare.inputs:
            for sock, val in (("Type", "Bloom"), ("Quality", "Medium"), ("Threshold", 1.0), ("Strength", 0.22), ("Size", 0.7), ("Saturation", 0.9)):
                try:
                    glare.inputs[sock].default_value = val
                except Exception as e:
                    print("glare socket", sock, e)
        else:
            glare.glare_type = "FOG_GLOW"
            glare.threshold = 1.0; glare.size = 7; glare.mix = -0.55
        if hasattr(sc, "compositing_node_group"):
            # 5.x: the compositor tree is a node group ending in a Group Output
            tree.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
            comp = tree.nodes.new("NodeGroupOutput")
        else:
            comp = tree.nodes.new("CompositorNodeComposite")
        tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
        tree.links.new(glare.outputs["Image"], comp.inputs["Image"])
        sc.render.use_compositing = True
    except Exception as e:
        print("compositor glare skipped:", e)

def setup_world():
    w = bpy.data.worlds.new("void") if not bpy.data.worlds else bpy.data.worlds[0]
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    # sparse point stars: Voronoi cells whose centre is close, only above the horizon
    coord = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 260
    vor.inputs["Randomness"].default_value = 1.0
    lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.035
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    up = nt.nodes.new("ShaderNodeMath"); up.operation = "GREATER_THAN"; up.inputs[1].default_value = 0.03
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    scale = nt.nodes.new("ShaderNodeMath"); scale.operation = "MULTIPLY"; scale.inputs[1].default_value = 1.4
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"; add.inputs[1].default_value = 0.0012
    nt.links.new(coord.outputs["Generated"], vor.inputs["Vector"])
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(vor.outputs["Distance"], lt.inputs[0])
    nt.links.new(sep.outputs["Z"], up.inputs[0])
    nt.links.new(lt.outputs["Value"], mul.inputs[0]); nt.links.new(up.outputs["Value"], mul.inputs[1])
    nt.links.new(mul.outputs["Value"], scale.inputs[0])
    nt.links.new(scale.outputs["Value"], add.inputs[0])
    nt.links.new(add.outputs["Value"], bg.inputs["Strength"])
    bg.inputs["Color"].default_value = (0.8, 0.85, 1.0, 1)
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

# ----------------------------------------------------------------------------- graph geometry
NODES = {n["id"]: n for n in GRAPH["nodes"]}
STOPS = [NODES[s] for s in GRAPH["stops"]]

def pos(nid):
    n = NODES[nid]
    return (n["x"], n["y"])

def road_dirs(stop_id):
    """Unit directions of the roads leaving a stop (via its first hop nodes)."""
    p = pos(stop_id)
    out = []
    for nb in NODES[stop_id]["neighbors"]:
        q = pos(nb)
        out.append(unit(q[0] - p[0], q[1] - p[1]))
    return out

def far_stop(stop_id, first_hop):
    """Follow a road from stop through first_hop to the stop at the other end; returns (stop, length)."""
    for r in GRAPH["roads"]:
        chain = r["nodes"]
        if chain[0] == stop_id and chain[1] == first_hop:
            return r["to"], r["length"]
        if chain[-1] == stop_id and chain[-2] == first_hop:
            return r["from"], r["length"]
    return None, 0

def dist_point_ray(p, o, d, length=60.0):
    """Distance from point p to the segment from o along unit d of given length."""
    vx, vy = p[0] - o[0], p[1] - o[1]
    t = max(0.0, min(length, vx * d[0] + vy * d[1]))
    cx, cy = o[0] + d[0] * t, o[1] + d[1] * t
    return math.hypot(p[0] - cx, p[1] - cy)

def free_side(stop_id, along=7.0, out=5.0):
    """Pick (road direction, side sign) at a stop whose sidewalk point is farthest from the other roads."""
    p = pos(stop_id)
    dirs = road_dirs(stop_id)
    best = None
    for d in dirs:
        for s in (1, -1):
            pp = perp(d)
            cand = (p[0] + d[0] * along + pp[0] * out * s, p[1] + d[1] * along + pp[1] * out * s)
            score = min([dist_point_ray(cand, p, e) for e in dirs if e is not d] or [99])
            if best is None or score > best[0]:
                best = (score, d, s)
    return best[1], best[2]

def lot(stop_id, depth, width, setback=6.0, along=7.0):
    """A concrete island beside a stop's road: returns (centre xy, facing dir toward road, road dir, side)."""
    d, s = free_side(stop_id)
    p = pos(stop_id)
    pp = perp(d)
    cx = p[0] + d[0] * along + pp[0] * s * (setback + depth / 2)
    cy = p[1] + d[1] * along + pp[1] * s * (setback + depth / 2)
    box(f"lot_{stop_id}", (width + 4, depth + 4, WALK_H), (cx, cy, WALK_H / 2), yaw_of(d), M()["concrete"])
    facing = (-pp[0] * s, -pp[1] * s)
    return (cx, cy), facing, d, s

# ----------------------------------------------------------------------------- streets
def build_roads():
    m = M()
    for i, r in enumerate(GRAPH["roads"]):
        a, b = pos(r["from"]), pos(r["to"])
        d = unit(b[0] - a[0], b[1] - a[1]); pp = perp(d)
        L = r["length"]
        c = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        yaw = yaw_of(d)
        z = i * 0.0004  # avoid coplanar slabs at intersections
        box(f"road_{i}", (L + ROAD_W, ROAD_W, 0.25), (c[0], c[1], -0.125 + z), yaw, m["asphalt"])
        # sidewalks stop short of intersections
        Ls = max(0.0, L - 2 * 6.5)
        if Ls > 1:
            for s in (1, -1):
                off = (ROAD_W / 2 + WALK_W / 2) * s
                box(f"walk_{i}_{s}", (Ls, WALK_W, WALK_H), (c[0] + pp[0] * off, c[1] + pp[1] * off, WALK_H / 2 + z), yaw, m["concrete"])
                eo = (ROAD_W / 2 - 0.25) * s
                box(f"edge_{i}_{s}", (Ls, 0.12, 0.004), (c[0] + pp[0] * eo, c[1] + pp[1] * eo, 0.002 + z), yaw, m["paint_white"])
            n = int(Ls // 9)
            for k in range(n):
                t = -Ls / 2 + 4.5 + 9 * k
                box(f"dash_{i}_{k}", (3.0, 0.15, 0.004), (c[0] + d[0] * t, c[1] + d[1] * t, 0.002 + z), yaw, m["paint_yellow"])
            nl = max(1, int(Ls // 24))
            for k in range(nl):
                t = -Ls / 2 + (k + 0.5) * (Ls / nl)
                s = 1 if k % 2 == 0 else -1
                off = (ROAD_W / 2 + 1.2) * s
                base = (c[0] + d[0] * t + pp[0] * off, c[1] + d[1] * t + pp[1] * off)
                lamp(f"lamp_{i}_{k}", base, (-pp[0] * s, -pp[1] * s))

def lamp(name, base, toward):
    m = M()
    h = 7.0
    cylinder(f"{name}_pole", 0.07, h, (base[0], base[1], h / 2 + WALK_H), m["pole"], segments=16)
    arm = 1.9
    ax, ay = base[0] + toward[0] * arm / 2, base[1] + toward[1] * arm / 2
    box(f"{name}_arm", (arm, 0.08, 0.08), (ax, ay, h + WALK_H - 0.1), yaw_of(toward), m["pole"])
    hx, hy = base[0] + toward[0] * arm, base[1] + toward[1] * arm
    box(f"{name}_head", (0.7, 0.3, 0.14), (hx, hy, h + WALK_H - 0.2), yaw_of(toward), m["pole"])
    box(f"{name}_glass", (0.55, 0.22, 0.02), (hx, hy, h + WALK_H - 0.28), yaw_of(toward), m["lamp"])
    spot(f"{name}_light", (hx, hy, h + WALK_H - 0.35), (hx, hy, 0), 2600, size_deg=150, blend=0.5, radius=0.2)

def signpost(stop):
    """Fingerpost at a stop: street-name plate on top, one blade per road pointing to where it goes."""
    m = M()
    sid = stop["id"]
    p = pos(sid)
    d, s = free_side(sid, along=3.6, out=4.7)
    pp = perp(d)
    base = (p[0] + d[0] * 3.6 + pp[0] * 4.7 * s, p[1] + d[1] * 3.6 + pp[1] * 4.7 * s)
    h = 4.4
    cylinder(f"sign_{sid}_pole", 0.055, h, (base[0], base[1], h / 2 + WALK_H), m["pole"], segments=16)
    dests = []
    for nb in NODES[sid]["neighbors"]:
        q = pos(nb)
        dd = unit(q[0] - p[0], q[1] - p[1])
        target, length = far_stop(sid, nb)
        if target is None:
            continue
        dests.append((dd, NODES[target]["label"] or target, length))
    z = 2.5 + WALK_H
    for k, (dd, label, length) in enumerate(dests):
        yaw = yaw_of(dd)
        bl = 1.9
        cx, cy = base[0] + dd[0] * (bl / 2 + 0.06), base[1] + dd[1] * (bl / 2 + 0.06)
        box(f"sign_{sid}_blade{k}", (bl, 0.035, 0.36), (cx, cy, z), yaw, m["sign_green"])
        box(f"sign_{sid}_tip{k}", (0.36, 0.035, 0.36), (base[0] + dd[0] * (bl + 0.12), base[1] + dd[1] * (bl + 0.12), z), yaw + math.pi / 4, m["sign_green"])
        body = f"{label}  {length:.0f} m"
        pq = perp(dd)
        for face in (1, -1):
            tx, ty = cx - pq[0] * 0.025 * face, cy - pq[1] * 0.025 * face
            rot_z = yaw + (math.pi if face == -1 else 0)
            text(f"sign_{sid}_txt{k}_{face}", body, 0.17, (tx, ty, z), (math.pi / 2, 0, rot_z), m["sign_white"], extrude=0.004)
        z += 0.46
    # street-name plate on top: the stop's own name in its colour, district below; plate faces the road
    name = (stop["label"] or sid).upper()
    cl = stop["cluster"]
    plate_w = max(1.6, 0.21 * len(name) + 0.5)
    pz = h + WALK_H - 0.05
    box(f"sign_{sid}_plate", (plate_w, 0.04, 0.56), (base[0], base[1], pz), yaw_of(d), m["sign_green"])
    for face in (1, -1):
        tx, ty = base[0] - pp[0] * 0.03 * face, base[1] - pp[1] * 0.03 * face
        rot_z = yaw_of(d) + (math.pi if face == -1 else 0)
        text(f"sign_{sid}_name_{face}", name, 0.27, (tx, ty, pz + 0.09), (math.pi / 2, 0, rot_z), mat_cluster(cl, 3.0) if cl else m["sign_white"], extrude=0.004)
        text(f"sign_{sid}_sub_{face}", CLUSTER_NAME.get(cl, "campus"), 0.11, (tx, ty, pz - 0.17), (math.pi / 2, 0, rot_z), m["sign_white"], extrude=0.003)
    point(f"sign_{sid}_light", (base[0] - pp[0] * s * 0.7, base[1] - pp[1] * s * 0.7, h + WALK_H + 0.5), 60, color=(1, 0.9, 0.8), radius=0.05)

def plaque(stop, at, facing):
    """Lectern plaque with the project's title, angled toward the reader."""
    m = M()
    sid = stop["id"]
    yaw = yaw_of(facing)
    box(f"plaque_{sid}_post", (0.12, 0.12, 1.0), (at[0], at[1], 0.5 + WALK_H), yaw, m["pole"])
    pl = box(f"plaque_{sid}_plate", (0.72, 0.5, 0.03), (at[0] + facing[0] * 0.05, at[1] + facing[1] * 0.05, 1.05 + WALK_H), yaw, m["bronze"])
    pl.rotation_euler = (0, math.radians(-55), yaw)
    title = stop["title"] or sid
    t = text(f"plaque_{sid}_title", title, 0.05, (0, 0, 0), (0, 0, 0), m["sign_white"], extrude=0.002, align="LEFT", width=0.62)
    t.parent = pl
    t.location = (-0.31, 0.19, 0.02)
    lab = text(f"plaque_{sid}_label", (stop["label"] or "").lower(), 0.04, (0, 0, 0), (0, 0, 0), mat_cluster(stop["cluster"], 2.5) if stop["cluster"] else m["sign_white"], extrude=0.002, align="LEFT")
    lab.parent = pl
    lab.location = (-0.31, -0.17, 0.02)
    spot(f"plaque_{sid}_light", (at[0] - facing[0] * 0.8, at[1] - facing[1] * 0.8, 3.2), (at[0], at[1], 1.1), 60, size_deg=40, blend=0.8, color=(1, 0.93, 0.85))

# ----------------------------------------------------------------------------- monuments
def placeholder(stop):
    """The map's dot, made physical: a plinth with a glowing orb (ring for writing, dashed ring for wip)."""
    m = M()
    sid = stop["id"]
    (cx, cy), facing, d, s = lot(sid, depth=6, width=8, along=5.0)
    box(f"plinth_{sid}", (3.2, 3.2, 1.2), (cx, cy, 0.6 + WALK_H), yaw_of(d), m["concrete"])
    cl = stop["cluster"]
    em = mat_cluster(cl, 3.0)
    z = 1.2 + WALK_H + 1.0
    ring_rot = (math.pi / 2, 0, yaw_of(facing))
    if stop["kind"] == "writing":
        torus(f"orb_{sid}", 0.7, 0.07, (cx, cy, z), em, rot=ring_rot)
    elif stop["kind"] == "wip":
        # dashed ring: eight beads on the circle, in the plane facing the road
        pq = perp(facing)
        for k in range(10):
            a0 = 2 * math.pi * k / 10
            sphere(f"orb_{sid}_{k}", 0.1, (cx + pq[0] * 0.7 * math.cos(a0), cy + pq[1] * 0.7 * math.cos(a0), z + 0.7 * math.sin(a0)), em)
    else:
        sphere(f"orb_{sid}", 0.62, (cx, cy, z), em)
    point(f"orb_{sid}_light", (cx, cy, z), 120, color=hex_rgb(CLUSTER_COLOR[cl])[:3], radius=0.6)
    text(f"orb_{sid}_label", stop["label"] or sid, 0.62, (cx, cy, z + 1.5), (math.pi / 2, 0, yaw_of(facing) + math.pi / 2), mat_cluster(cl, 2.5), extrude=0.02)
    plaque(stop, (cx + facing[0] * 4.6, cy + facing[1] * 4.6), facing)

def autoencoder_arch(stop):
    """Encoder-decoder bottleneck straddling the road toward negreira: frames narrow, then widen again."""
    m = M()
    sid = stop["id"]
    p = pos(sid)
    target_dir = None
    for nb in NODES[sid]["neighbors"]:
        if far_stop(sid, nb)[0] == "negreira":
            q = pos(nb); target_dir = unit(q[0] - p[0], q[1] - p[1])
    d = target_dir or road_dirs(sid)[0]
    yaw = yaw_of(d)
    pp = perp(d)
    green = mat_cluster("math", 5.0)
    n = 13
    for k in range(n):
        t = 5.0 + k * 1.55
        u = abs((k - (n - 1) / 2) / ((n - 1) / 2))   # 1 at the ends, 0 at the bottleneck
        w = 3.6 + 6.4 * u ** 1.4
        h = 3.4 + 4.0 * u ** 1.4
        cx, cy = p[0] + d[0] * t, p[1] + d[1] * t
        sec = 0.32
        box(f"ae_{k}_top", (sec, w + sec, sec), (cx, cy, h), yaw, m["steel"])
        for s in (1, -1):
            box(f"ae_{k}_side{s}", (sec, sec, h), (cx + pp[0] * (w / 2) * s, cy + pp[1] * (w / 2) * s, h / 2), yaw, m["steel"])
            box(f"ae_{k}_strip{s}", (0.04, 0.05, h - 0.4), (cx + pp[0] * (w / 2 - sec / 2 - 0.02) * s, cy + pp[1] * (w / 2 - sec / 2 - 0.02) * s, h / 2), yaw, green)
        box(f"ae_{k}_striptop", (0.04, w - sec, 0.05), (cx, cy, h - sec / 2 - 0.03), yaw, green)
    plaque(stop, (p[0] + d[0] * 3.0 + pp[0] * 5.0, p[1] + d[1] * 3.0 + pp[1] * 5.0), (-pp[0], -pp[1]))
    for k in (1, 6, 11):
        t = 5.0 + k * 1.55
        spot(f"ae_light_{k}", (p[0] + d[0] * t, p[1] + d[1] * t, 0.3), (p[0] + d[0] * t, p[1] + d[1] * t, 8), 250, color=hex_rgb("#199e70")[:3], size_deg=120, blend=0.9)

def coin_under_blanket(stop):
    """A giant coin on a plinth, half hidden by a blanket (cloth-simulated, then frozen)."""
    m = M()
    sid = stop["id"]
    (cx, cy), facing, d, s = lot(sid, depth=13, width=13, along=5.0)
    yaw = yaw_of(d)
    plinth = box(f"coin_plinth_{sid}", (10.0, 10.0, 0.7), (cx, cy, 0.35 + WALK_H), yaw, m["concrete"])
    top = 0.7 + WALK_H
    coin = cylinder(f"coin_{sid}", 3.4, 0.36, (cx, cy, top + 0.18), m["gold"], segments=128)
    bev = coin.modifiers.new("bevel", "BEVEL"); bev.width = 0.05; bev.segments = 4
    torus(f"coin_rim_{sid}", 3.15, 0.045, (cx, cy, top + 0.36), m["gold"], nu=128)
    text(f"coin_q_{sid}", "?", 3.2, (cx, cy, top + 0.36), (0, 0, yaw_of(facing) + math.pi / 2), m["gold"], extrude=0.03)
    # blanket: simulate a plane falling over the coin, then freeze it
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, 80
    pf = perp(facing)
    off = (-facing[0] * 1.35 + pf[0] * 0.5, -facing[1] * 1.35 + pf[1] * 0.5)
    cloth = grid(f"blanket_sim_{sid}", 7.2, 80, (cx + off[0] * 1.55, cy + off[1] * 1.55, top + 0.75), None)
    cloth.rotation_euler = (0, 0, yaw + 0.35)
    for ob in (coin, plinth):
        ob.modifiers.new("collision", "COLLISION")
        ob.collision.thickness_outer = 0.02
        ob.collision.cloth_friction = 60
    cmod = cloth.modifiers.new("cloth", "CLOTH")
    st = cmod.settings
    st.quality = 8; st.mass = 0.3
    st.tension_stiffness = 5; st.compression_stiffness = 5; st.shear_stiffness = 3; st.bending_stiffness = 0.05
    st.air_damping = 1.0
    cmod.collision_settings.distance_min = 0.012
    cmod.collision_settings.friction = 40
    cmod.collision_settings.use_self_collision = True
    cmod.point_cache.frame_start, cmod.point_cache.frame_end = 1, 80
    for f in range(1, 81):
        sc.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(cloth.evaluated_get(dg))
    frozen = bpy.data.objects.new(f"blanket_{sid}", me)
    frozen.matrix_world = cloth.matrix_world.copy()
    link(frozen)
    bpy.data.objects.remove(cloth, do_unlink=True)
    for ob in (coin, plinth):
        ob.modifiers.remove(ob.modifiers["collision"])
    sc.frame_set(1)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    sub = frozen.modifiers.new("subsurf", "SUBSURF"); sub.levels = 1; sub.render_levels = 2
    sol = frozen.modifiers.new("solidify", "SOLIDIFY"); sol.thickness = 0.012
    me.materials.append(mat_pbr("fabric", "fabric", tile=0.9, base=(0.03, 0.05, 0.14, 1), sheen=0.45, normal_strength=1.0))
    spot(f"coin_key_{sid}", (cx + facing[0] * 5 + pf[0] * 3, cy + facing[1] * 5 + pf[1] * 3, 6.5), (cx, cy, top + 0.3), 750, size_deg=60, blend=0.5, radius=0.4)
    spot(f"coin_fill_{sid}", (cx - facing[0] * 4 - pf[0] * 4, cy - facing[1] * 4 - pf[1] * 4, 4.5), (cx, cy, top + 0.3), 180, color=(0.6, 0.72, 1.0), size_deg=70, blend=0.7, radius=0.6)
    plaque(stop, (cx + facing[0] * 7.6, cy + facing[1] * 7.6), facing)

def itam(stop):
    """ITAM as a landmark: brick block, lit window grid, glazed entrance, letters on the parapet."""
    m = M()
    W, D, H = 34.0, 16.0, 13.0
    (cx, cy), facing, d, s = lot(stop["id"], depth=D + 14, width=W)
    yaw = yaw_of(d)
    bx, by = cx - facing[0] * 7, cy - facing[1] * 7
    box("itam_body", (W, D, H), (bx, by, H / 2 + WALK_H), yaw, m["brick"])
    box("itam_parapet", (W + 0.4, D + 0.4, 0.5), (bx, by, H + WALK_H + 0.25), yaw, m["concrete"])
    fx, fy = bx + facing[0] * (D / 2), by + facing[1] * (D / 2)
    warm = mat_emit("window_on", (1.0, 0.86, 0.66, 1), 3.2)
    dark_glass = m["glass"]
    rng = random.Random(3)
    for floor in range(3):
        zc = 2.4 + floor * 3.9
        for k in range(9):
            u = (k - 4) * 3.4
            if floor == 0 and abs(u) < 4.5:
                continue  # entrance
            wx, wy = fx + d[0] * u + facing[0] * 0.02, fy + d[1] * u + facing[1] * 0.02
            lit = rng.random() < 0.6
            box(f"itam_win_{floor}_{k}", (1.5, 0.05, 2.0), (wx, wy, zc + WALK_H), yaw, warm if lit else dark_glass)
            box(f"itam_sill_{floor}_{k}", (1.7, 0.25, 0.08), (wx + facing[0] * 0.12, wy + facing[1] * 0.12, zc + WALK_H - 1.05), yaw, m["concrete"])
    for side in (1, -1):
        sx, sy = bx + d[0] * (W / 2) * side, by + d[1] * (W / 2) * side
        for floor in range(3):
            zc = 2.4 + floor * 3.9
            for k in range(4):
                u = (k - 1.5) * 3.4
                wx, wy = sx + facing[0] * u + d[0] * 0.02 * side, sy + facing[1] * u + d[1] * 0.02 * side
                lit = rng.random() < 0.5
                box(f"itam_swin_{side}_{floor}_{k}", (0.05, 1.5, 2.0), (wx, wy, zc + WALK_H), yaw, warm if lit else dark_glass)
    ex, ey = fx + facing[0] * 0.4, fy + facing[1] * 0.4
    box("itam_door_glass", (7.5, 0.06, 4.4), (ex, ey, 2.2 + WALK_H + 0.3), yaw, dark_glass)
    for u in (-3.75, -1.25, 1.25, 3.75):
        box(f"itam_mullion_{u}", (0.1, 0.12, 4.4), (ex + d[0] * u, ey + d[1] * u, 2.2 + WALK_H + 0.3), yaw, m["pole"])
    box("itam_canopy", (10.0, 3.2, 0.3), (fx + facing[0] * 1.6, fy + facing[1] * 1.6, 4.9 + WALK_H), yaw, m["concrete"])
    box("itam_canopy_glow", (9.2, 2.6, 0.02), (fx + facing[0] * 1.6, fy + facing[1] * 1.6, 4.74 + WALK_H), yaw, mat_emit("canopy_light", (1.0, 0.9, 0.75, 1), 6))
    for k in range(3):
        box(f"itam_step_{k}", (9.0, 0.4, 0.1 * (k + 1)), (fx + facing[0] * (3.4 + 0.4 * k), fy + facing[1] * (3.4 + 0.4 * k), WALK_H + 0.05 * (k + 1)), yaw, m["concrete"])
    box("itam_lobby", (7.0, 6.0, 4.0), (fx - facing[0] * 3.2, fy - facing[1] * 3.2, 2.0 + WALK_H + 0.3), yaw, mat_plain("lobby", (0.7, 0.66, 0.6, 1), rough=0.6))
    point("itam_lobby_light", (fx - facing[0] * 3.2, fy - facing[1] * 3.2, 4.5), 600, color=(1, 0.9, 0.78), radius=0.5)
    text("itam_letters", "ITAM", 2.3, (fx + facing[0] * 0.3, fy + facing[1] * 0.3, H + WALK_H - 1.2), (math.pi / 2, 0, yaw_of(facing) + math.pi / 2), mat_emit("letters", (1, 1, 1, 1), 5), extrude=0.15)
    for u in (-12, 0, 12):
        spot(f"itam_up_{u}", (fx + d[0] * u + facing[0] * 2.5, fy + d[1] * u + facing[1] * 2.5, 0.3 + WALK_H), (fx + d[0] * u, fy + d[1] * u, 9), 500, color=(1, 0.85, 0.65), size_deg=50, blend=0.8)
    fpx, fpy = fx + facing[0] * 9 + d[0] * 10, fy + facing[1] * 9 + d[1] * 10
    cylinder("itam_flagpole", 0.06, 9, (fpx, fpy, 4.5 + WALK_H), m["pole"], segments=12)
    plaque(stop, (cx + facing[0] * (D / 2 + 7 + 3.5), cy + facing[1] * (D / 2 + 7 + 3.5)), facing)

def compass():
    p = pos("itam")
    for name, (dx, dy) in (("N", (0, 1)), ("E", (1, 0)), ("S", (0, -1)), ("W", (-1, 0))):
        text(f"compass_{name}", name, 6.0, (p[0] + dx * 70, p[1] + dy * 70, 8), (math.pi / 2, 0, math.atan2(dy, dx) + math.pi / 2), mat_emit("compass", (1, 0.2, 0.2, 1), 8), extrude=0.3)

# ----------------------------------------------------------------------------- build + render
def build():
    reset(); setup_render(); setup_world()
    M()
    build_roads()
    detailed = {"autoencoder": autoencoder_arch, "probability": coin_under_blanket, "itam": itam}
    for stop in STOPS:
        signpost(stop)
        (detailed.get(stop["id"]) or placeholder)(stop)
    if flag("--compass", False):
        compass()

def render(node_ids):
    sc = bpy.context.scene
    cam_data = bpy.data.cameras.new("pano")
    cam_data.type = "PANO"
    try:
        cam_data.panorama_type = "EQUIRECTANGULAR"
    except Exception:
        cam_data.cycles.panorama_type = "EQUIRECTANGULAR"
    cam_data.clip_end = 3000
    cam = bpy.data.objects.new("pano", cam_data)
    link(cam)
    sc.camera = cam
    PANOS.mkdir(parents=True, exist_ok=True)
    for i, nid in enumerate(node_ids):
        n = NODES[nid]
        cam.location = (n["x"], n["y"], EYE)
        cam.rotation_euler = (math.pi / 2, 0, 0)  # faces north (+y)
        sc.render.filepath = str(PANOS / f"{nid}.jpg")
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"[{i + 1}/{len(node_ids)}] {nid}: {time.time() - t0:.0f}s", flush=True)

if __name__ == "__main__":
    t0 = time.time()
    build()
    print(f"built {len(bpy.data.objects)} objects in {time.time() - t0:.0f}s", flush=True)
    if flag("--save", False):
        bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "world.blend"))
    if flag("--nodes"):
        ids = flag("--nodes").split(",")
    elif flag("--stops", False):
        ids = GRAPH["stops"]
    else:
        ids = [n["id"] for n in GRAPH["nodes"]]
    if TEST:
        ids = ids[:1]
    render(ids)
