# Blender 5.2 headless plate: the clay Clawd mascot on a turntable (or still), rendered as an RGBA PNG sequence
# that Remotion/ffmpeg composite over anything. Run:
#   blender -b -P plate.py -- --out out/plate --frames 60 --res 1080x1920 --look cozy --engine EEVEE --shot turntable
# Looks: cozy (warm studio, soft shadows) | toon (cel shading via Shader-to-RGB + ColorRamp constant, black outline).
import bpy, math, sys, os, argparse

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="out/plate")
ap.add_argument("--frames", type=int, default=60)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--res", default="1080x1920")
ap.add_argument("--look", default="cozy", choices=["cozy", "toon"])
ap.add_argument("--engine", default="EEVEE", choices=["EEVEE", "CYCLES"])
ap.add_argument("--shot", default="turntable", choices=["turntable", "still", "hop"])
ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--blend", default="")          # also save the .blend here
a = ap.parse_args(argv)
W, H = (int(v) for v in a.res.lower().split("x"))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE" if a.engine == "EEVEE" else "CYCLES"
if a.engine == "CYCLES": sc.cycles.samples = a.samples; sc.cycles.use_denoising = True
else:
    try: sc.eevee.taa_render_samples = a.samples
    except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.fps = a.fps
sc.frame_start, sc.frame_end = 1, a.frames
sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "AgX" if a.look == "cozy" else "Standard"
if a.look == "cozy":
    try: sc.view_settings.look = "AgX - Punchy"
    except Exception: pass

CLAY, CLAY_DK, INK = (0.88, 0.40, 0.25, 1), (0.62, 0.27, 0.17, 1), (0.06, 0.03, 0.03, 1)

def mat(name, color, rough=0.6, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes.get("Principled BSDF")
    if a.look == "toon" and emit == 0.0:
        # cel shading: diffuse → Shader to RGB → constant ColorRamp (3 bands) → emission
        for n in list(nt.nodes):
            if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
        out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
        dif = nt.nodes.new("ShaderNodeBsdfDiffuse"); dif.inputs["Color"].default_value = color
        s2r = nt.nodes.new("ShaderNodeShaderToRGB")
        ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
        el = ramp.color_ramp.elements
        el[0].position, el[0].color = 0.0, tuple(c * 0.45 for c in color[:3]) + (1,)
        el[1].position, el[1].color = 0.55, color
        mid = el.new(0.2); mid.color = tuple(c * 0.75 for c in color[:3]) + (1,)
        em = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(dif.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs[0], ramp.inputs[0])
        nt.links.new(ramp.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
        return m
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    if emit > 0:
        bsdf.inputs["Emission Color"].default_value = color; bsdf.inputs["Emission Strength"].default_value = emit
    return m

def box(name, size, loc, m, bevel=0.1, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    bv = o.modifiers.new("bevel", "BEVEL"); bv.width = bevel; bv.segments = 6; bv.limit_method = "NONE"
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    if parent: o.parent = parent
    return o

def outline(o, thick=0.025):
    # inverted hull: solidify with flipped normals + black backface-only material
    s = o.modifiers.new("outline", "SOLIDIFY"); s.thickness = -thick; s.use_flip_normals = True; s.material_offset = 1
    ink = bpy.data.materials.get("INK") or mat("INK", INK, emit=1.0)
    ink.use_backface_culling = True
    o.data.materials.append(ink)

# ── Clawd
root = bpy.data.objects.new("Clawd", None); sc.collection.objects.link(root)
mC, mD = mat("clay", CLAY), mat("clay_dark", CLAY_DK, 0.7)
mInk = mat("face_ink", INK, 0.4, emit=0.0 if a.look == "cozy" else 1.0)
body = box("body", (1.1, 0.86, 0.86), (0, 0, 0.58), mC, 0.22, root)
arms = [box(f"arm{i}", (0.26, 0.3, 0.26), (s * 0.66, 0, 0.52), mC, 0.1, root) for i, s in enumerate((-1, 1))]
legs = [box(f"leg{i}", (0.2, 0.22, 0.3), (x, y, 0.15), mD, 0.07, root) for i, (x, y) in enumerate(((-0.32, -0.22), (0.32, -0.22), (-0.32, 0.22), (0.32, 0.22)))]
# face on the −Y side (camera looks +Y): eyes, smile, blush
for s in (-1, 1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(s * 0.2, -0.43, 0.68)); e = bpy.context.active_object
    e.scale = (0.8, 0.35, 1.15); e.data.materials.append(mInk); e.parent = root
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02, location=(s * 0.2 + 0.02, -0.455, 0.71)); hl = bpy.context.active_object
    hl.data.materials.append(mat("white", (1, 1, 1, 1), emit=1.0)); hl.parent = root
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(s * 0.33, -0.425, 0.56)); b = bpy.context.active_object
    b.scale = (1.3, 0.2, 0.7); b.data.materials.append(mat(f"blush{s}", (1.0, 0.45, 0.42, 1), 0.8)); b.parent = root
bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.018, location=(0, -0.435, 0.6), rotation=(math.pi / 2, 0, 0))
smile = bpy.context.active_object; smile.data.materials.append(mInk); smile.parent = root
# keep only the lower half of the torus as a smile
bpy.context.view_layer.objects.active = smile; bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
for v in smile.data.vertices: v.select = v.co.y > 0.0   # local y > 0 → upper half after rotation
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
if a.look == "toon":
    for o in [body, *arms, *legs]: outline(o)

# ── ground disc (shadow catcher in cozy, flat colour in toon)
bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=0.05, location=(0, 0, -0.025))
g = bpy.context.active_object; g.data.materials.append(mat("ground", (0.36, 0.22, 0.15, 1) if a.look == "cozy" else (0.37, 0.75, 0.29, 1), 0.8))
if a.look == "cozy": g.is_shadow_catcher = True

# ── lights
def light(kind, loc, energy, color, size=2.0):
    d = bpy.data.lights.new(kind, kind); d.energy = energy; d.color = color
    if kind == "AREA": d.size = size
    o = bpy.data.objects.new(kind, d); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (0, 0, 0); c = o.constraints.new("TRACK_TO"); c.target = body; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
light("AREA", (-2.5, -3.0, 3.2), 260, (1.0, 0.86, 0.7), 3)     # key, warm
light("AREA", (3.0, -1.5, 1.6), 70, (0.75, 0.8, 1.0), 2)       # fill, cool
light("AREA", (0.5, 3.0, 2.5), 220, (1.0, 0.7, 0.45), 1.5)     # rim
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.035, 0.03, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.4

# ── camera (portrait-friendly framing) + shot animation
cd = bpy.data.cameras.new("cam"); cd.lens = 50 if H > W else 40
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); sc.camera = cam
pivot = bpy.data.objects.new("pivot", None); sc.collection.objects.link(pivot); pivot.location = (0, 0, 0.5)
cam.parent = pivot; dist = 5.2 if H > W else 4.0
cam.location = (0, -dist, 0.9); cam.rotation_euler = (math.radians(84), 0, 0)
if a.shot == "turntable":
    root.rotation_euler = (0, 0, math.radians(-35)); root.keyframe_insert("rotation_euler", frame=1)
    root.rotation_euler = (0, 0, math.radians(325)); root.keyframe_insert("rotation_euler", frame=a.frames + 1)
    for fc in root.animation_data.action.fcurves if hasattr(root.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points: k.interpolation = "LINEAR"
elif a.shot == "hop":
    for f, z, sq in ((1, 0, 1.0), (8, 0, 0.85), (16, 0.45, 1.1), (24, 0, 0.8), (30, 0, 1.0)):
        root.location = (0, 0, z); root.scale = (1 / math.sqrt(sq), 1 / math.sqrt(sq), sq)
        root.keyframe_insert("location", frame=f); root.keyframe_insert("scale", frame=f)
    sc.frame_end = min(a.frames, 30)

os.makedirs(a.out, exist_ok=True)
sc.render.filepath = os.path.join(os.path.abspath(a.out), "f_")
if a.blend: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.blend))
if a.shot == "still":
    sc.frame_set(1); sc.render.filepath = os.path.join(os.path.abspath(a.out), "still.png"); bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print("PLATE_DONE", a.out, sc.frame_end, "frames")
