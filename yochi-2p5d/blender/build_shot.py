"""The Blender path, for the occasional shot that genuinely benefits from physical depth, light or camera
movement. It builds a scene from a prepared character and an exported ShotSpec, then renders two RGBA passes per
frame that Remotion's <BlenderPasses> stacks around the slash and finishes with the same overlays as every other
shot, so a Blender shot cuts seamlessly with CharacterShot shots.

    # 1. export the shot (same shotState() the Remotion components use)
    cd yochi-2p5d/remotion && node --experimental-strip-types tools/export-shot.mts untouchable916
    # 2. build and render (Eevee needs GL: under xvfb-run on a headless box)
    xvfb-run -a -s "-screen 0 1920x1080x24" blender -b -P ../blender/build_shot.py -- untouchable916 --render [--frames 0-149]
    # 3. composite: tools/sync-assets.sh, then render a <BlenderPasses spec=... passes="passes/untouchable916"/>

House rules this follows: the figure moves as ONE rigid object about its anchor (breath = scale, sway = rotation):
no armature, no limb or local warp (the impact gust is Remotion-only). The figure is pure emission (unlit) unless
spec.light.figure > 0 (OPEN_DECISIONS #7). Colour variant only (grey / silhouette shots use CharacterShot).

Units: 1 Blender unit = 100 card px. The figure plate sits at Z = 0, the ground plate BG_DEPTH behind, scaled so
frame 0 projects exactly like the 2D framing; relief and depth offsets run along frame-0 camera rays, so frame 0
still matches the painting.
"""
import bpy, json, math, os, sys, random

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(HERE, "..")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if not argv:
    raise SystemExit("usage: blender -b -P build_shot.py -- <shot> [--render] [--frames a-b] [--samples n] [--cycles]")
NAME = argv[0]
RENDER = "--render" in argv
ENGINE = "cycles" if "--cycles" in argv else "eevee"
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 16

SHOT = json.load(open(os.path.join(HERE, "shots", NAME + ".json")))
META, SPEC, FR = SHOT["meta"], SHOT["spec"], SHOT["frames"]
W, H = SHOT["size"]["width"], SHOT["size"]["height"]
FRAMES = tuple(int(x) for x in argv[argv.index("--frames") + 1].split("-")) if "--frames" in argv else (0, len(FR) - 1)
CDIR = os.path.join(PKG, "characters", META["id"], "build")
OUT = os.path.join(HERE, "out", NAME)

S = 0.01
D0 = 20.0
BG_DEPTH = 17.6
c0 = FR[0]["cam"]
X0, Y0 = c0["cx"] + c0["truckX"], c0["cy"] + c0["truckY"]
WIN_W = c0["winW"]
FOCAL = 36.0 * D0 / (WIN_W * S)
FIG_LIGHT = float(SPEC.get("light", {}).get("figure", 0) or 0)


def world(x, y):
    return ((x - X0) * S, -(y - Y0) * S)


bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.frame_start, scn.frame_end = FRAMES
scn.render.fps = SHOT["fps"]
scn.render.resolution_x, scn.render.resolution_y = W, H
scn.render.film_transparent = True
scn.view_settings.view_transform = "Standard"     # no filmic curve: keep the painting's colours
scn.view_settings.look = "None"
if ENGINE == "eevee":
    scn.render.engine = "BLENDER_EEVEE"
    scn.eevee.taa_render_samples = SAMPLES
    scn.eevee.use_gtao = False
    scn.eevee.use_bloom = False
    scn.render.filter_size = 0.75                 # sharper reconstruction (the 2.5D test measured 1.5 px as soft)
else:
    scn.render.engine = "CYCLES"
    scn.cycles.device = "CPU"
    scn.cycles.samples = SAMPLES
    scn.cycles.use_denoising = False
    scn.cycles.pixel_filter_width = 0.75
scn.world = bpy.data.worlds.new("w")
scn.world.use_nodes = True
scn.world.node_tree.nodes["Background"].inputs[1].default_value = 0.0


def img(name, non_color=False):
    i = bpy.data.images.load(os.path.join(CDIR, name))
    if non_color:
        i.colorspace_settings.name = "Non-Color"
    return i


IM_FIG, IM_BG, IM_DEPTH, IM_REL = img("fig.png"), img("bg.png"), img("depth.png", True), img("relief.png", True)


def sampler(im):
    w, h = im.size
    px = im.pixels[:]
    ch = im.channels
    P = META["plate"]

    def get(x, y):  # card px
        xi = min(w - 1, max(0, int(x - P["x"])))
        yi = min(h - 1, max(0, int(y - P["y"])))
        return px[((h - 1 - yi) * w + xi) * ch]
    return get


def coll(n):
    c = bpy.data.collections.new(n)
    scn.collection.children.link(c)
    return c


C_BG, C_FIG, C_FAR, C_NEAR = coll("bg"), coll("fig"), coll("motes_far"), coll("motes_near")


def plate_mesh(name, nx, ny, z, scale, height, co):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=nx, y_subdivisions=ny, size=1)
    ob = bpy.context.active_object
    ob.name = name
    for c in ob.users_collection:
        c.objects.unlink(ob)
    co.objects.link(ob)
    P = META["plate"]
    me = ob.data
    cardxy = []
    for v in me.vertices:
        x, y = P["x"] + (v.co.x + 0.5) * P["w"], P["y"] + (0.5 - v.co.y) * P["h"]
        cardxy.append((x, y))
        wx, wy = world(x, y)
        p = [wx * scale, wy * scale, z]
        hgt = height(x, y)
        if hgt:  # move toward the frame-0 camera along this vertex's ray, by hgt in Z
            d = [-p[0], -p[1], D0 - p[2]]
            k = hgt / d[2]
            p = [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + hgt]
        v.co = p
    uv = me.uv_layers.active.data
    for lp in me.loops:
        x, y = cardxy[lp.vertex_index]
        uv[lp.index].uv = ((x - P["x"]) / P["w"], 1 - (y - P["y"]) / P["h"])
    for p in me.polygons:
        p.use_smooth = True
    return ob


def material(name, im, lit, alpha):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = im
    tex.interpolation = "Cubic" if ENGINE == "cycles" else "Linear"
    tex.extension = "EXTEND"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[1].default_value = 1.0 - 0.18 * lit
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    last = em.outputs[0]
    if lit > 0:
        df = nt.nodes.new("ShaderNodeBsdfDiffuse")
        add = nt.nodes.new("ShaderNodeAddShader")
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
    m.blend_method = "BLEND" if alpha else "OPAQUE"
    m.shadow_method = "NONE"
    m.show_transparent_back = False
    return m


# ground plate: depth-displaced, world-lit (light on the ground is allowed)
dep = sampler(IM_DEPTH)
bg = plate_mesh("Ground", 220, 288 if H > W else 140, -BG_DEPTH, (D0 + BG_DEPTH) / D0, lambda x, y: (dep(x, y) - 0.15) * 14.0, C_BG)
bg.data.materials.append(material("ground", IM_BG, 1.0, False))

# figure: a shallow bas-relief, ONE rigid object parented to an empty at its anchor
rel = sampler(IM_REL)
fig = plate_mesh("Figure", 330, 430 if H > W else 215, 0.0, 1.0, lambda x, y: rel(x, y) * 0.32, C_FIG)
fig.data.materials.append(material("figure", IM_FIG, FIG_LIGHT, True))
pivot = bpy.data.objects.new("FigureAnchor", None)
C_FIG.objects.link(pivot)
ax, ay = world(*META["anchor"])
pivot.location = (ax, ay, 0)
bpy.context.view_layer.update()            # the empty's world matrix must be current before taking its inverse
fig.parent = pivot
fig.matrix_parent_inverse = pivot.matrix_world.inverted()

# camera and key light
cd = bpy.data.cameras.new("cam")
cd.lens, cd.sensor_width, cd.sensor_fit = FOCAL, 36, "HORIZONTAL"
cd.clip_start, cd.clip_end = 0.1, 200
cd.dof.use_dof, cd.dof.aperture_fstop = True, 2.8
cam = bpy.data.objects.new("Camera", cd)
scn.collection.objects.link(cam)
scn.camera = cam
sd = bpy.data.lights.new("key", "SUN")
sd.angle = math.radians(6)
sun = bpy.data.objects.new("Key", sd)
scn.collection.objects.link(sun)

# atmosphere: 3D dust and ink motes at true depth (real DOF turns the near ones to bokeh)
atm = SPEC.get("atmosphere") or {}
rnd = random.Random(4242)


def emit(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[0].default_value = (*[(c / 255) ** 2.2 for c in rgb], 1)
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


M_DUST, M_INK = emit("dust", (246, 240, 226)), emit("ink", (22, 19, 15))
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
SPH = bpy.context.active_object.data
bpy.data.objects.remove(bpy.context.active_object)
SPH.materials.append(M_DUST)
motes = []
n_dust, n_ink = int(atm.get("dust", 96)), int(atm.get("ink", 34))
span_x = WIN_W * S / 2 + 1.5
span_y = span_x * H / W
for i in range(n_dust + n_ink):
    kind = "dust" if i < n_dust else "ink"
    z = rnd.uniform(-12.0, 12.0)
    ds = (D0 - z) / D0
    r = (rnd.uniform(0.008, 0.02) if kind == "dust" else rnd.uniform(0.015, 0.05)) * ds
    ob = bpy.data.objects.new(f"mote{i}", SPH)
    ob.scale = (r * 1.4, r, r)
    (C_NEAR if z > 0.3 else C_FAR).objects.link(ob)
    ob.material_slots[0].link = "OBJECT"
    ob.material_slots[0].material = M_DUST if kind == "dust" else M_INK
    motes.append((ob, rnd.uniform(-span_x, span_x) * ds, rnd.uniform(-span_y, span_y) * ds, z, rnd.uniform(0, 6.28), ds))

# keys
wind = 0.0
for fr in FR:
    f = fr["f"]
    t = fr["t"]
    if True:  # key every frame (cheap); --frames only limits what renders
        c = fr["cam"]
        dist = D0 / fr["nearZoom"]
        cx, cy = world(c["cx"] + c["truckX"], c["cy"] + c["truckY"])
        cam.location = (cx, cy, dist)
        cam.rotation_euler = (0, 0, math.radians(-c["shakeRot"]))
        cd.shift_x = -c["shakeX"] / max(W, H)
        cd.shift_y = c["shakeY"] / max(W, H)
        cd.dof.focus_distance = dist
        for ob, path in ((cam, "location"), (cam, "rotation_euler"), (cd, "shift_x"), (cd, "shift_y"), (cd.dof, "focus_distance")):
            ob.keyframe_insert(path, frame=f)
        L = fr["light"]
        ang = math.atan2(L["dy"], L["dx"])
        lv = (math.cos(ang) * 0.8, math.sin(ang) * 0.8, 0.6)
        sun.rotation_euler = (0, math.acos(lv[2]), math.atan2(lv[1], lv[0]))
        sd.energy = 0.30 * L["intensity"]
        sun.keyframe_insert("rotation_euler", frame=f)
        sd.keyframe_insert("energy", frame=f)
        g = fr["fig"]
        pivot.scale = (g["scaleX"], g["scaleY"], 1)
        pivot.rotation_euler = (0, 0, -g["rot"])
        pivot.keyframe_insert("scale", frame=f)
        pivot.keyframe_insert("rotation_euler", frame=f)
        for ob, x0, y0, z, ph, ds in motes:
            x = x0 - wind * 1.2 * ds + math.sin(t * 1.3 + ph) * 0.1
            y = y0 - wind * 0.22 * ds + math.sin(t * 0.9 + ph * 2) * 0.08
            sx = 2 * span_x * ds
            x = ((x + span_x * ds) % sx) - span_x * ds
            ob.location = (x, y, z)
            ob.keyframe_insert("location", frame=f)
    # motes ride the wind on ambient time (they freeze in a hit-stop, like the Remotion atmosphere)
    wind += (fr["t"] - (FR[f - 1]["t"] if f else 0.0)) * 0.55 * float(atm.get("wind", 1))

for ob in list(bpy.data.objects) + [cd, sd]:
    ad = getattr(ob, "animation_data", None)
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"

# passes: back (ground + far motes) and front (figure + near motes)
vb = scn.view_layers[0]
vb.name = "back"
vf = scn.view_layers.new("front")
for vl, hide in ((vb, {"fig", "motes_near"}), (vf, {"bg", "motes_far"})):
    for lc in vl.layer_collection.children:
        lc.exclude = lc.name in hide
scn.use_nodes = True
nt = scn.node_tree
nt.nodes.clear()
fo = nt.nodes.new("CompositorNodeOutputFile")
fo.base_path = OUT
fo.format.file_format, fo.format.color_mode, fo.format.color_depth = "PNG", "RGBA", "8"
fo.file_slots.clear()
for i, vl in enumerate((vb, vf)):
    rl = nt.nodes.new("CompositorNodeRLayers")
    rl.layer = vl.name
    fo.file_slots.new(f"{vl.name}/")
    nt.links.new(rl.outputs["Image"], fo.inputs[i])
comp = nt.nodes.new("CompositorNodeComposite")
nt.links.new(nt.nodes["Render Layers"].outputs["Image"], comp.inputs[0])
scn.render.filepath = os.path.join(OUT, "_beauty", "")
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "out", NAME + ".blend"))
print(f"built {NAME}: {META['id']} {W}x{H}, frames {FRAMES}, {ENGINE}")
if RENDER:
    bpy.ops.render.render(animation=True)
