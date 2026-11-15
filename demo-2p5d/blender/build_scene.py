"""Implementation B: Blender-assisted 2.5D. Builds the scene from the derived plates and the
shared timeline, then (optionally) renders two RGBA passes per frame for Remotion:

    back/####.png   background plate (depth-displaced) + far ink motes
    front/####.png  the figure (bas-relief mesh, armature + wind modifiers, real light) + near motes

Remotion composites back -> slash -> front -> burst/seal/grade (src/B/BlenderShot.tsx).

    blender -b -P demo-2p5d/blender/build_scene.py -- [--render] [--frames 0-149] [--samples 32]

Units: 1 Blender unit = 100 canvas px. The figure plate sits at Z = 0, the background at
Z = -BG_DEPTH, scaled so that frame 0 projects exactly like the 2D window (and every
relief/depth offset is applied along the camera ray, so frame 0 still matches the painting).
"""
import bpy, json, math, os, sys, random

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
OUT = os.path.join(HERE, "out")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
RENDER = "--render" in argv
FR = (0, 149)
SAMPLES = 32
ENGINE = "eevee" if "--eevee" in argv else "cycles"
for i, a in enumerate(argv):
    if a == "--frames":
        FR = tuple(int(x) for x in argv[i + 1].split("-"))
    if a == "--samples":
        SAMPLES = int(argv[i + 1])

TL = json.load(open(os.path.join(HERE, "timeline.json")))
PL = json.load(open(os.path.join(ASSETS, "plates.json")))
CW, CH = PL["size"]               # 1344 x 856
WIN_W = 1320.0
CX0, CY0 = 672.0, 386.0           # camera centre at frame 0 (canvas px)
D0 = 20.0                         # camera distance at frame 0
BG_DEPTH = 17.6                   # background plane behind the figure
FOCAL = 36.0 * D0 / (WIN_W / 100) # mm, window fills the 36 mm sensor at D0
S = 0.01                          # canvas px -> BU


def to_world(x, y):
    return ((x - CX0) * S, -(y - CY0) * S)


# ---------------------------------------------------------------- reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.frame_start, scn.frame_end = FR
scn.render.fps = TL["fps"]
scn.render.resolution_x, scn.render.resolution_y = 1920, 1080
scn.render.engine = "CYCLES"
scn.cycles.device = "CPU"
scn.cycles.samples = SAMPLES
scn.cycles.use_adaptive_sampling = True
scn.cycles.use_denoising = False          # denoising smears painted grain: off for fidelity
scn.cycles.pixel_filter_width = 1.0
scn.cycles.max_bounces = 2
scn.cycles.transparent_max_bounces = 8
scn.render.film_transparent = True
scn.view_settings.view_transform = "Standard"   # no filmic curve: keep the painting's colours
scn.view_settings.look = "None"
scn.render.image_settings.file_format = "PNG"
scn.render.image_settings.color_mode = "RGBA"
if ENGINE == "eevee":
    # Eevee needs a GL context: run under xvfb-run (software Mesa is enough).
    scn.render.engine = "BLENDER_EEVEE"
    scn.eevee.taa_render_samples = SAMPLES
    scn.eevee.use_soft_shadows = True
    scn.eevee.use_gtao = False
    scn.eevee.use_bloom = False
world = bpy.data.worlds.new("w")
scn.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[1].default_value = 0.0


def load(name, non_color=False):
    img = bpy.data.images.load(os.path.join(ASSETS, name))
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


IMG_CHAR = load("char.png")
IMG_BG = load("bg.png")
IMG_DEPTH = load("bg_depth.png", True)
IMG_WTS = load("weights.png", True)
IMG_REL = load("relief.png", True)


def sampler(img):
    """Nearest sampler over image pixels in canvas px (y down). No numpy in this Blender."""
    w, h = img.size
    px = img.pixels[:]
    ch = img.channels

    def get(x, y, c=0):
        xi = min(w - 1, max(0, int(x)))
        yi = min(h - 1, max(0, int(y)))
        return px[((h - 1 - yi) * w + xi) * ch + c]
    return get


def collection(name):
    c = bpy.data.collections.new(name)
    scn.collection.children.link(c)
    return c


C_BG, C_CHAR, C_FAR, C_NEAR = (collection(n) for n in ("bg", "char", "motes_far", "motes_near"))


def grid(name, nx, ny, coll):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=nx, y_subdivisions=ny, size=1)
    ob = bpy.context.active_object
    ob.name = name
    for c in ob.users_collection:
        c.objects.unlink(ob)
    coll.objects.link(ob)
    return ob


def plate_material(name, img, emit=0.82, diffuse=1.0, alpha=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Linear"
    tex.extension = "EXTEND"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[1].default_value = emit
    df = nt.nodes.new("ShaderNodeBsdfDiffuse")
    add = nt.nodes.new("ShaderNodeAddShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(tex.outputs["Color"], df.inputs["Color"])
    nt.links.new(em.outputs[0], add.inputs[0])
    nt.links.new(df.outputs[0], add.inputs[1])
    last = add.outputs[0]
    if alpha:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(tex.outputs["Alpha"], mix.inputs[0])
        nt.links.new(tr.outputs[0], mix.inputs[1])
        nt.links.new(last, mix.inputs[2])
        last = mix.outputs[0]
    nt.links.new(last, out.inputs[0])
    m.blend_method = "BLEND" if alpha else "OPAQUE"   # Eevee: real alpha on the figure
    m.shadow_method = "NONE"                          # no self-shadow acne on the relief
    m.show_transparent_back = False
    return m


def layout_plate(ob, height_fn, plane_z, scale):
    """Place grid verts over the canvas, at plane_z, then push each vertex toward the frame-0
    camera along its own ray by height_fn(x, y) BU (so frame 0 projects unchanged)."""
    me = ob.data
    uv = me.uv_layers.active.data
    cam0 = (0.0, 0.0, D0)
    # per-vertex canvas coordinates from the grid's own [-0.5, 0.5] layout
    canvas = []
    for v in me.vertices:
        u = v.co.x + 0.5
        t = 0.5 - v.co.y
        x, y = u * CW, t * CH
        canvas.append((x, y))
        wx, wy = to_world(x, y)
        p = (wx * scale, wy * scale, plane_z)
        hgt = height_fn(x, y)
        if hgt:
            d = [cam0[i] - p[i] for i in range(3)]
            L = math.sqrt(sum(c * c for c in d))
            p = tuple(p[i] + d[i] / L * hgt / (d[2] / L) for i in range(3))  # hgt = Z gain
        v.co = p
    for loop in me.loops:
        x, y = canvas[loop.vertex_index]
        uv[loop.index].uv = (x / CW, 1 - y / CH)
    return canvas


# ---------------------------------------------------------------- background
bg = grid("BG", 225, 144, C_BG)
dep = sampler(IMG_DEPTH)
bg_scale = (D0 + BG_DEPTH) / D0
# depth map: 0.15 = paper/moon, up to ~0.6 = misty trees. Trees come ~6 BU toward camera.
layout_plate(bg, lambda x, y: (dep(x, y) - 0.15) * 14.0, -BG_DEPTH, bg_scale)
bg.data.materials.append(plate_material("bg", IMG_BG))
bpy.ops.object.shade_smooth()

# ---------------------------------------------------------------- figure (bas-relief + rig)
ch = grid("Figure", 336, 214, C_CHAR)
rel = sampler(IMG_REL)
canvas = layout_plate(ch, lambda x, y: rel(x, y) * 0.32, 0.0, 1.0)
mat = plate_material("figure", IMG_CHAR, alpha=True)
ch.data.materials.append(mat)
for p in ch.data.polygons:
    p.use_smooth = True

wts = sampler(IMG_WTS)
vg_hair = ch.vertex_groups.new(name="hair")
vg_head = ch.vertex_groups.new(name="head")
vg_chest = ch.vertex_groups.new(name="chest")
vg_root = ch.vertex_groups.new(name="root")
for i, (x, y) in enumerate(canvas):
    wh, wd, wc = wts(x, y, 0), wts(x, y, 1), wts(x, y, 2)
    vg_hair.add([i], wh, "REPLACE")
    vg_head.add([i], wd, "REPLACE")
    vg_chest.add([i], wc, "REPLACE")
    vg_root.add([i], max(0.0, 1.0 - wd - wc), "REPLACE")

# armature: root (static), head (pivot at the neck), chest (breathing)
arm_data = bpy.data.armatures.new("rig")
arm = bpy.data.objects.new("Rig", arm_data)
C_CHAR.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
R = PL["rigs"]
for name, (x, y) in (("root", (672, 800)), ("head", R["neck_pivot"]), ("chest", R["chest_center"])):
    b = arm_data.edit_bones.new(name)
    wx, wy = to_world(x, y)
    b.head = (wx, wy, 0)
    b.tail = (wx, wy + 1.0, 0)
bpy.ops.object.mode_set(mode="OBJECT")
mod = ch.modifiers.new("rig", "ARMATURE")
mod.object = arm

# wind: three Displace modifiers whose band textures travel with animated empties. Same
# waves as A: y += A(sin(.021x + .006y + 3.1t) + .45 sin(.052x - .017y + 5.7t + 1.3)),
# x += .45A sin(.016y + .004x + 2.4t + .7), A = 5 px * wind, weighted by the hair group.
def wave(name, kx, ky, w_t, phase, direction, gain):
    # Wood BANDS + SIN noise: v = 0.5 + 0.5 sin(10 (lx + ly + lz)) in the empty's local space.
    tex = bpy.data.textures.new(name, "WOOD")
    tex.wood_type = "BANDS"
    tex.noise_basis_2 = "SIN"
    tex.turbulence = 0.0
    e = bpy.data.objects.new(name + "_drv", None)
    C_CHAR.objects.link(e)
    # local = world / scale -> 10 * (X/sx + Y/sy) ; want kx*100*X + ky*100*Y (canvas y down)
    e.scale = (10.0 / (kx * 100), -10.0 / (ky * 100) if ky else 1e6, 1e6)
    m = ch.modifiers.new(name, "DISPLACE")
    m.texture = tex
    m.texture_coords = "OBJECT"
    m.texture_coords_object = e
    m.direction = direction
    m.vertex_group = "hair"
    m.mid_level = 0.5
    return e, m, kx, w_t, phase, gain


waves = [
    wave("windY1", 0.021, 0.006, 3.1, 0.0, "Y", 1.0),
    wave("windY2", 0.052, -0.017, 5.7, 1.3, "Y", 0.45),
    wave("windX", 0.004, 0.016, 2.4, 0.7, "X", 0.45),
]

# ---------------------------------------------------------------- camera + light
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = FOCAL
cam_data.sensor_width = 36
cam_data.sensor_fit = "HORIZONTAL"
cam_data.clip_start = 0.1
cam_data.clip_end = 200
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 2.8
cam = bpy.data.objects.new("Camera", cam_data)
scn.collection.objects.link(cam)
scn.camera = cam

sun_data = bpy.data.lights.new("key", "SUN")
sun_data.energy = 0.30
sun_data.angle = math.radians(6)
sun = bpy.data.objects.new("Key", sun_data)
scn.collection.objects.link(sun)

# ---------------------------------------------------------------- ink motes (3D)
rnd = random.Random(4242)


def mote_mat(name, rgb, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*rgb, 1)
    em.inputs[1].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs[0])
    return m


def srgb2lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


M_DUST = mote_mat("dust", tuple(srgb2lin(c / 255) for c in (246, 240, 226)), 1.0)
M_INK = mote_mat("ink", tuple(srgb2lin(c / 255) for c in (22, 19, 15)), 1.0)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
SPH = bpy.context.active_object.data
bpy.data.objects.remove(bpy.context.active_object)

motes = []
for i in range(130):
    kind = "dust" if i < 96 else "ink"
    z = rnd.uniform(-12.0, 12.0)            # -12 between bg and figure .. +12 near the lens
    depth_scale = (D0 - z) / D0             # spread to cover the frustum at that depth
    x0 = rnd.uniform(-13, 13) * depth_scale
    y0 = rnd.uniform(-5.5, 5.5) * depth_scale
    r = (rnd.uniform(0.008, 0.02) if kind == "dust" else rnd.uniform(0.015, 0.05)) * depth_scale
    ob = bpy.data.objects.new(f"mote{i}", SPH)
    ob.scale = (r * 1.4, r, r)          # stretched a little along the wind
    (C_NEAR if z > 0.3 else C_FAR).objects.link(ob)
    motes.append((ob, kind, x0, y0, z, rnd.uniform(0, 6.28), depth_scale))
# one shared sphere mesh; each mote picks its material through an object-linked slot
SPH.materials.append(M_DUST)
for ob, kind, *_ in motes:
    ob.material_slots[0].link = "OBJECT"
    ob.material_slots[0].material = M_DUST if kind == "dust" else M_INK

# ---------------------------------------------------------------- keyframes from the timeline
wind_int = 0.0
pb = arm.pose.bones
for b in pb:
    b.rotation_mode = "XYZ"
for fr in TL["frames"]:
    f = fr["f"]
    if f < FR[0] - 1 or f > FR[1] + 1:
        wind_int += fr["perf"]["wind"] / TL["fps"]
        continue
    cam_p, perf, li = fr["cam"], fr["perf"], fr["light"]
    t = perf["time"]
    # physical dolly: the figure's magnification matches A's near-layer zoom
    zl = 1 + (cam_p["zoom"] - 1) * 1.1
    dist = D0 / zl
    cx, cy = to_world(cam_p["cx"] + cam_p["truckX"], cam_p["cy"] + cam_p["truckY"])
    cam.location = (cx, cy, dist)
    cam.rotation_euler = (0, 0, math.radians(-cam_p["shakeRot"]))
    cam_data.shift_x = -cam_p["shakeX"] / 1920
    cam_data.shift_y = cam_p["shakeY"] / 1920
    cam_data.dof.focus_distance = dist
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)
    cam_data.keyframe_insert("shift_x", frame=f)
    cam_data.keyframe_insert("shift_y", frame=f)
    cam_data.dof.keyframe_insert("focus_distance", frame=f)
    # key light: same angle as A, from the front-right so the relief catches it
    ang = math.atan2(li["dy"], li["dx"])
    lv = (math.cos(ang) * 0.8, math.sin(ang) * 0.8, 0.6)
    # a sun points down its local -Z: aim -Z at -lv
    yaw = math.atan2(lv[1], lv[0])
    pitch = math.acos(lv[2])
    sun.rotation_euler = (0, pitch, yaw)
    sun.keyframe_insert("rotation_euler", frame=f)
    sun_data.energy = 0.30 * li["intensity"]
    sun_data.keyframe_insert("energy", frame=f)
    # rig
    h = pb["head"]
    h.rotation_euler = (0, 0, math.radians(-perf["headRot"]))
    h.location = (0, perf["headLift"] * S, 0)
    h.keyframe_insert("rotation_euler", frame=f)
    h.keyframe_insert("location", frame=f)
    c = pb["chest"]
    b = perf["breath"]
    c.scale = (1, 1 + 0.010 * b, 1)
    c.location = (0.8 * b * S, 3.2 * b * S, 0)
    c.keyframe_insert("scale", frame=f)
    c.keyframe_insert("location", frame=f)
    # wind waves: phase travels with time, amplitude follows the wind
    A = 5.0 * perf["wind"] * S
    for e, m, kx, w_t, phase, gain in waves:
        # 10 * (X - ex)/sx = k*100*X - k*100*ex  -> shift ex so the phase is w_t*t + phase
        e.location = (-(w_t * t + phase) / (kx * 100), 0, 0)
        e.keyframe_insert("location", frame=f)
        m.strength = 2 * A * gain
        m.keyframe_insert("strength", frame=f)
    # motes ride the wind (same law as A's 2D particles: drift left, a little down, bob)
    for ob, kind, x0, y0, z, ph, ds in motes:
        x = x0 - wind_int * 1.2 * ds + math.sin(t * 1.3 + ph) * 0.1
        y = y0 - wind_int * 0.22 * ds + math.sin(t * 0.9 + ph * 2) * 0.08
        span = 26 * ds
        x = ((x + 13 * ds) % span) - 13 * ds
        ob.location = (x, y, z)
        ob.keyframe_insert("location", frame=f)
    wind_int += perf["wind"] / TL["fps"]

for ob in bpy.data.objects:
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"

# ---------------------------------------------------------------- view layers + outputs
vl_back = scn.view_layers[0]
vl_back.name = "back"
vl_front = scn.view_layers.new("front")


def exclude(vl, names):
    for lc in vl.layer_collection.children:
        lc.exclude = lc.name in names


exclude(vl_back, {"char", "motes_near"})
exclude(vl_front, {"bg", "motes_far"})

scn.use_nodes = True
nt = scn.node_tree
nt.nodes.clear()
fo = nt.nodes.new("CompositorNodeOutputFile")
fo.base_path = OUT
fo.format.file_format = "PNG"
fo.format.color_mode = "RGBA"
fo.format.color_depth = "8"
fo.file_slots.clear()
for i, vl in enumerate((vl_back, vl_front)):
    rl = nt.nodes.new("CompositorNodeRLayers")
    rl.layer = vl.name
    fo.file_slots.new(f"{vl.name}/")
    nt.links.new(rl.outputs["Image"], fo.inputs[i])
comp = nt.nodes.new("CompositorNodeComposite")
nt.links.new(nt.nodes["Render Layers"].outputs["Image"], comp.inputs[0])
scn.render.filepath = os.path.join(OUT, "_beauty", "")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "scene.blend"))
print("scene built", FR)
if RENDER:
    bpy.ops.render.render(animation=True)
