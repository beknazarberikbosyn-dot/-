# zov_lib.py — procedural low-poly assets for «Зов из тумана» (run inside Blender)
# Authoring convention: Blender Z-up, models face -Y ("front view"). Export maps to game coords (x, z, -y);
# assets with flip=True (the creature) are turned 180° first so they face game -Z.
import bpy, bmesh, math, random, json, base64, os, struct, time
from math import sin, cos, pi, radians, atan2, sqrt, hypot
from mathutils import Vector as V, Matrix as M, Quaternion as Q, noise
from mathutils.bvhtree import BVHTree

OUT = os.path.expanduser('~/zov-iz-tumana-assets')
R = random.Random(7)

def hx(h):
    if not isinstance(h, str): return tuple(h)
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))
def mix(a, b, t): a, b = hx(a), hx(b); return tuple(a[i]+(b[i]-a[i])*t for i in range(3))
def Tr(x, y, z): return M.Translation((x, y, z))
def Rx(a): return M.Rotation(a, 4, 'X')
def Ry(a): return M.Rotation(a, 4, 'Y')
def Rz(a): return M.Rotation(a, 4, 'Z')
def Sc(x, y=None, z=None):
    y = x if y is None else y; z = x if z is None else z
    m = M.Identity(4); m[0][0] = x; m[1][1] = y; m[2][2] = z; return m

# ---------------------------------------------------------------- asset container
class A:
    def __init__(s, name, ground=True, flip=False, ao=1.0, aod=None):
        s.name = name; s.bm = bmesh.new(); s.mats = {}; s.ml = []; s.ground = ground; s.flip = flip; s.aok = ao; s.aod = aod
    def m(s, name, color, em=0.0):
        if name not in s.mats:
            s.mats[name] = len(s.ml); s.ml.append([name, hx(color), em])
        return s.mats[name]
    def add(s, bm2, mat, T=None):
        vm = {}
        for v in bm2.verts:
            p = v.co.copy()
            if T is not None: p = T @ p
            vm[v] = s.bm.verts.new(p)
        for f in bm2.faces:
            try: nf = s.bm.faces.new([vm[v] for v in f.verts])
            except ValueError: continue
            nf.material_index = mat(f) if callable(mat) else mat
        bm2.free(); return s

# ---------------------------------------------------------------- primitives (return new bmesh)
def _xf(bm, T):
    if T is not None: bmesh.ops.transform(bm, matrix=T, verts=bm.verts)
    return bm
def box(sx, sy, sz, at=(0, 0, 0), base=False, T=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
        v.co += V(at) + V((0, 0, sz/2 if base else 0))
    return _xf(bm, T)
def cyl(r1, r2, h, seg=8, at=(0, 0, 0), cap=True, T=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=max(r1, 1e-4), radius2=max(r2, 1e-4), depth=h)
    for v in bm.verts: v.co += V(at) + V((0, 0, h/2))
    if r2 < 1e-3: bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-4)
    return _xf(bm, T)
def sph(rx, ry=None, rz=None, at=(0, 0, 0), seg=8, rings=6, T=None):
    ry = rx if ry is None else ry; rz = rx if rz is None else rz
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    for v in bm.verts:
        v.co.x *= rx; v.co.y *= ry; v.co.z *= rz; v.co += V(at)
    return _xf(bm, T)
def ico(r, sub=1, at=(0, 0, 0), T=None):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts: v.co += V(at)
    return _xf(bm, T)
def lathe(prof, seg=10, rf=None, T=None, cap0=True, cap1=True):
    """prof: [(radius, z)...] bottom->top. rf(angle, z) -> radius multiplier."""
    bm = bmesh.new(); rings = []
    for (r, z) in prof:
        ring = []
        for i in range(seg):
            a = i/seg*2*pi; k = rf(a, z) if rf else 1.0
            ring.append(bm.verts.new((cos(a)*r*k, sin(a)*r*k, z)))
        rings.append(ring)
    for j in range(len(rings)-1):
        for i in range(seg):
            a, b = rings[j][i], rings[j][(i+1) % seg]; c, d = rings[j+1][(i+1) % seg], rings[j+1][i]
            try: bm.faces.new((a, b, c, d))
            except ValueError: pass
    if cap0 and prof[0][0] > 1e-4: bm.faces.new(list(reversed(rings[0])))
    if cap1 and prof[-1][0] > 1e-4: bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _xf(bm, T)
def loft(rings, cap0=True, cap1=True, T=None):
    """rings: list of lists of 3D points (same count), bottom->top, counter-clockwise seen from above"""
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in rings]; n = len(rings[0])
    for j in range(len(vs)-1):
        for i in range(n):
            try: bm.faces.new((vs[j][i], vs[j][(i+1) % n], vs[j+1][(i+1) % n], vs[j+1][i]))
            except ValueError: pass
    if cap0: bm.faces.new(list(reversed(vs[0])))
    if cap1: bm.faces.new(vs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _xf(bm, T)
def ell(rx, ry, z, n=10, cx=0, cy=0, f=None):
    return [V((cx+cos(i/n*2*pi)*rx*(f(i/n*2*pi) if f else 1), cy+sin(i/n*2*pi)*ry*(f(i/n*2*pi) if f else 1), z)) for i in range(n)]
def tube(pts, radii, seg=6, cap0=True, cap1=True, T=None, sq=1.0):
    """sweep a circle along a polyline with parallel-transport frames"""
    pts = [V(p) for p in pts]; rings = []; prev = None
    for i, p in enumerate(pts):
        t = (pts[min(i+1, len(pts)-1)] - pts[max(i-1, 0)]).normalized()
        if prev is None:
            a = V((1, 0, 0)) if abs(t.x) < .9 else V((0, 1, 0)); n = t.cross(a).normalized()
        else:
            n = prev - t*prev.dot(t); n.normalize()
        b = t.cross(n); prev = n; r = radii[i] if isinstance(radii, (list, tuple)) else radii
        rings.append([p + (n*cos(k/seg*2*pi) + b*sin(k/seg*2*pi)*sq)*r for k in range(seg)])
    return loft(rings, cap0, cap1, T)
def poly_extrude(poly, depth, T=None):
    """polygon in X/Z (list of (x,z)) extruded along Y, centred"""
    bm = bmesh.new(); f = [bm.verts.new((x, -depth/2, z)) for (x, z) in poly]; b = [bm.verts.new((x, depth/2, z)) for (x, z) in poly]
    n = len(poly); bm.faces.new(f); bm.faces.new(list(reversed(b)))
    for i in range(n):
        try: bm.faces.new((f[(i+1) % n], f[i], b[i], b[(i+1) % n]))
        except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _xf(bm, T)
def tri_fan(pts, T=None):
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in pts]
    for i in range(1, len(vs)-1):
        try: bm.faces.new((vs[0], vs[i], vs[i+1]))
        except ValueError: pass
    return _xf(bm, T)
def quadstrip(a_pts, b_pts, T=None):
    bm = bmesh.new(); A_ = [bm.verts.new(p) for p in a_pts]; B_ = [bm.verts.new(p) for p in b_pts]
    for i in range(len(A_)-1):
        try: bm.faces.new((A_[i], A_[i+1], B_[i+1], B_[i]))
        except ValueError: pass
    return _xf(bm, T)

# ---------------------------------------------------------------- operations
def nz(p, f=1.0, s=0):
    q = V(p)*f + V((s*13.1, s*7.7, s*3.3)); return noise.noise(q)
def fbm(p, f=1.0, s=0, o=3):
    a = 0; w = .5; t = 0
    for i in range(o): a += w*nz(p, f*(2**i), s+i); t += w; w *= .5
    return a/t
def displace(bm, amp, f=1.0, s=0, o=3, axes=(1, 1, 1), along_normal=True):
    bm.normal_update()
    for v in bm.verts:
        d = fbm(v.co, f, s, o)*amp
        if along_normal: v.co += v.normal*d
        else: v.co += V((nz(v.co, f, s)*axes[0], nz(v.co, f, s+5)*axes[1], nz(v.co, f, s+9)*axes[2]))*amp
    return bm
def jitter(bm, a, s=0):
    rr = random.Random(s)
    for v in bm.verts: v.co += V((rr.uniform(-a, a), rr.uniform(-a, a), rr.uniform(-a, a)))
    return bm
def xform(bm, T): bmesh.ops.transform(bm, matrix=T, verts=bm.verts); return bm
def modproc(bm, subsurf=0, ratio=None, target=None, planar=None):
    """run modifiers through a temporary object in the current scene"""
    me = bpy.data.meshes.new('zov_tmp'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('zov_tmp', me); bpy.context.scene.collection.objects.link(ob)
    if subsurf:
        m = ob.modifiers.new('S', 'SUBSURF'); m.levels = subsurf; m.render_levels = subsurf
    if target or ratio:
        m = ob.modifiers.new('D', 'DECIMATE')
        if target:
            # estimate tris after subdivision
            nt = sum(len(p.vertices)-2 for p in me.polygons)*(4**subsurf)
            m.ratio = min(1.0, target/max(nt, 1))
        else: m.ratio = ratio
    if planar:
        m = ob.modifiers.new('P', 'DECIMATE'); m.decimate_type = 'DISSOLVE'; m.angle_limit = radians(planar)
    dg = bpy.context.evaluated_depsgraph_get(); oe = ob.evaluated_get(dg); me2 = oe.to_mesh()
    out = bmesh.new(); out.from_mesh(me2); oe.to_mesh_clear()
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return out
def by_normal(rules, default):
    """material chooser from face normal / centre: rules = [(fn(face)->bool, mat), ...]"""
    def f(face):
        for fn, mi in rules:
            if fn(face): return mi
        return default
    return f
def up(th=.6): return lambda f: f.normal.z > th
def above(z): return lambda f: f.calc_center_median().z > z
def below(z): return lambda f: f.calc_center_median().z < z

# ---------------------------------------------------------------- AO bake + export
SUBD_CREASE = 52   # degrees: edges sharper than this (and material borders, open borders) stay crisp
def subsurf(a, levels=1):
    """Catmull-Clark smoothing of the whole asset: more, smaller polygons and rounded silhouettes; sharp edges and colour borders are creased"""
    bm = a.bm; bm.normal_update()
    me = bpy.data.meshes.new('zov_tmp_sub'); bm.to_mesh(me)
    cr = me.attributes.get('crease_edge') or me.attributes.new('crease_edge', 'FLOAT', 'EDGE')
    lim = math.radians(SUBD_CREASE); bm.edges.ensure_lookup_table()
    for e in bm.edges:
        lf = e.link_faces; k = 0.0
        if len(lf) != 2: k = 1.0
        elif lf[0].material_index != lf[1].material_index: k = 1.0
        elif e.calc_face_angle(0.0) > lim: k = 1.0
        cr.data[e.index].value = k
    ob = bpy.data.objects.new('zov_tmp_sub', me); sc = bpy.context.scene; sc.collection.objects.link(ob)
    md = ob.modifiers.new('sub', 'SUBSURF'); md.levels = levels; md.render_levels = levels; md.use_creases = True; md.boundary_smooth = 'PRESERVE_CORNERS'; md.use_limit_surface = False
    dg = bpy.context.evaluated_depsgraph_get(); me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    nb = bmesh.new(); nb.from_mesh(me2); bm.free(); a.bm = nb
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(me); bpy.data.meshes.remove(me2)
def finalize(a):
    if a.name in SUBD: subsurf(a)
    bm = a.bm
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    for f in list(bm.faces):
        if f.calc_area() < 1e-9: bm.faces.remove(f)
    for v in list(bm.verts):
        if not v.link_faces: bm.verts.remove(v)
    bm.verts.index_update(); bm.faces.index_update(); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table(); bm.normal_update()
    return bm
def bake_ao(a, bm, rays=18):
    verts = [v.co.copy() for v in bm.verts]; polys = [[v.index for v in f.verts] for f in bm.faces]
    mn = V((min(p.x for p in verts), min(p.y for p in verts), min(p.z for p in verts))); mx = V((max(p.x for p in verts), max(p.y for p in verts), max(p.z for p in verts)))
    diag = (mx-mn).length; D = a.aod or max(.25, min(diag*.22, 6.0))
    if a.ground:
        g0 = len(verts); e = diag*2+2
        verts += [V((mn.x-e, mn.y-e, 0)), V((mx.x+e, mn.y-e, 0)), V((mx.x+e, mx.y+e, 0)), V((mn.x-e, mx.y+e, 0))]
        polys.append([g0, g0+1, g0+2, g0+3])
    tree = BVHTree.FromPolygons(verts, polys, epsilon=0.0)
    rr = random.Random(3); dirs = []
    for i in range(rays):
        u1 = (i+.5)/rays; u2 = rr.random(); r = sqrt(u1); th = 2*pi*u2
        dirs.append(V((r*cos(th), r*sin(th), sqrt(max(0, 1-u1)))))
    out = []
    for v in bm.verts:
        n = v.normal if v.normal.length > .5 else V((0, 0, 1))
        t = (V((1, 0, 0)) if abs(n.x) < .9 else V((0, 1, 0))).cross(n).normalized(); b = n.cross(t)
        o = v.co + n*D*.02; hit = 0.0
        for d in dirs:
            w = t*d.x + b*d.y + n*d.z
            loc, nn, idx, dist = tree.ray_cast(o, w, D)
            if loc is not None: hit += 1.0 - (dist/D)*.5
        occ = min(1.0, hit/rays*1.25)*a.aok
        out.append(max(0, min(255, int(round((1-occ)*255)))))
    return out
def export_asset(a, store):
    bm = finalize(a); ao = bake_ao(a, bm)
    pts = []
    for v in bm.verts:
        x, y, z = v.co
        if a.flip: x, y = -x, -y
        pts.append((x, z, -y))
    idx = [v.index for f in bm.faces for v in f.verts]; tc = [f.material_index for f in bm.faces]
    lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
    o = [(lo[i]+hi[i])/2 for i in range(3)]; s = max(max(hi[i]-lo[i] for i in range(3))/2, 1e-6)
    q = []
    for p in pts: q += [int(round((p[i]-o[i])/s*32767)) for i in range(3)]
    nv = len(pts)
    pb = struct.pack('<%dh' % len(q), *q)
    ib = struct.pack(('<%dI' if nv > 65535 else '<%dH') % len(idx), *idx)
    used = sorted(set(tc)); remap = {m: i for i, m in enumerate(used)}
    cb = bytes(remap[t] for t in tc); ab = bytes(ao)
    pal = [[round(a.ml[m][1][0], 3), round(a.ml[m][1][1], 3), round(a.ml[m][1][2], 3), a.ml[m][2]] for m in used]
    store[a.name] = {'p': base64.b64encode(pb).decode(), 's': [round(s, 5)]+[round(c, 5) for c in o], 'i': base64.b64encode(ib).decode(),
                     'c': base64.b64encode(cb).decode(), 'a': base64.b64encode(ab).decode(), 'pal': pal, 'n': [a.ml[m][0] for m in used]}
    # keep a viewable copy for previews
    me = bpy.data.meshes.new('zov_'+a.name); bm.to_mesh(me); bm.free()
    for nm, colr, em in a.ml:
        mt = bpy.data.materials.get('zovm_'+nm+'_%02x%02x%02x' % tuple(int(c*255) for c in colr)) or bpy.data.materials.new('zovm_'+nm+'_%02x%02x%02x' % tuple(int(c*255) for c in colr))
        mt.diffuse_color = (*colr, 1.0); me.materials.append(mt)
    for p in me.polygons: p.use_smooth = False
    return me, len(idx)//3, nv

BUILDERS = {}
def asset(name, **kw):
    def deco(fn): BUILDERS[name] = (fn, kw); return fn
    return deco
def build(names, outfile, store=None):
    store = {} if store is None else store; info = {}; t0 = time.time()
    sc = bpy.data.scenes.get('ZOV') or bpy.data.scenes.new('ZOV')
    for nm in names:
        fn, kw = BUILDERS[nm]; a = A(nm, **kw); fn(a)
        me, nt, nv = export_asset(a, store); info[nm] = nt
        ob = bpy.data.objects.get('zov_'+nm)
        if ob: ob.data = me
        else:
            ob = bpy.data.objects.new('zov_'+nm, me); sc.collection.objects.link(ob)
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, outfile), 'w') as f: json.dump(store, f, separators=(',', ':'))
    return {'tris': info, 'sec': round(time.time()-t0, 1), 'bytes': os.path.getsize(os.path.join(OUT, outfile))}

def preview(names, outfile, cols=6, cell=None, view='front', res=(1600, 1000), dist=None):
    """lay out the given assets in a grid in the ZOV scene and render a Workbench contact sheet"""
    sc = bpy.data.scenes['ZOV']
    obs = [bpy.data.objects['zov_'+n] for n in names]
    sizes = [max(o.dimensions) for o in obs]; cell = cell or max(sizes)*1.15
    for o in sc.collection.objects:
        if o.name.startswith('zov_'): o.hide_render = True
    for i, o in enumerate(obs):
        o.hide_render = False; o.location = ((i % cols)*cell, 0, -(i//cols)*cell*.9); o.rotation_euler = (0, 0, radians(-25) if view == 'front' else 0)
    cam = bpy.data.objects.get('zov_cam')
    if not cam:
        cam = bpy.data.objects.new('zov_cam', bpy.data.cameras.new('zov_cam')); sc.collection.objects.link(cam)
    rows = (len(obs)+cols-1)//cols; w = cols*cell; h = rows*cell*.9
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(w, h*res[0]/res[1])*1.05
    cx = (cols-1)*cell/2; cz = -(rows-1)*cell*.9/2 + cell*.35
    cam.location = (cx, -60, cz+22); cam.rotation_euler = (radians(70), 0, 0)
    if view == 'top': cam.location = (cx, 0, 80); cam.rotation_euler = (0, 0, 0); cam.data.ortho_scale = max(w, h*res[0]/res[1])*1.1
    sc.camera = cam
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
    sc.display.shading.show_cavity = True; sc.display.shading.show_object_outline = True; sc.display.shading.show_shadows = True
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
    sc.world = sc.world or bpy.data.worlds.new('zovw'); sc.render.filepath = os.path.join(OUT, outfile)
    sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True, scene=sc.name)
    return os.path.join(OUT, outfile)

# ================================================================ NATURE
PINE = ['#1f4334', '#24493a', '#2a5041', '#1c3c30']
def pine(a, seed, tiers=4, h=6.4, wide=1.0, pts=11):
    rr = random.Random(seed); bark = a.m('bark', '#46382b'); bark2 = a.m('bark2', '#3a2f25')
    tr = cyl(.24*wide, .1, h*.55, 6); displace(tr, .04, 3, seed); a.add(tr, lambda f: bark if f.normal.z < .5 else bark2)
    for i in range(tiers):
        t = i/(tiers-1) if tiers > 1 else 0; z0 = h*(.16+t*.62); r = (1.75-t*1.15)*wide*rr.uniform(.92, 1.08); hh = h*(.36-t*.08)
        col = a.m('needle%d' % (i % 3), PINE[(i+seed) % 4])
        tip = a.m('needleL', '#3b6550')
        n = pts+rr.randint(0, 3 if pts > 8 else 0)
        def rf(ang, z, n=n, rr=rr): return 1.0 if z > .01 else (1.0 if int(ang/(2*pi)*n*2) % 2 == 0 else .7)
        bm = bmesh.new(); top = bm.verts.new((0, 0, z0+hh)); ring = []; inner = []
        for k in range(n*2):
            ang = k/(n*2)*2*pi; rk = r*(1.0 if k % 2 == 0 else .68)*rr.uniform(.9, 1.1); droop = -(.35 if k % 2 == 0 else .12)*r
            ring.append(bm.verts.new((cos(ang)*rk, sin(ang)*rk, z0+droop)))
            inner.append(bm.verts.new((cos(ang)*rk*.45, sin(ang)*rk*.45, z0+hh*.3)))
        m = len(ring)
        for k in range(m):
            bm.faces.new((ring[k], ring[(k+1) % m], inner[(k+1) % m], inner[k]))
            bm.faces.new((inner[k], inner[(k+1) % m], top))
        under = bm.verts.new((0, 0, z0+hh*.05)); [bm.faces.new((ring[(k+1) % m], ring[k], under)) for k in range(m)]
        jitter(bm, .06*r, seed+i)
        a.add(bm, lambda f, col=col, tip=tip: tip if f.normal.z > .55 and rr.random() < .35 else col)
@asset('pine_a')
def _(a): pine(a, 1, 4, 6.4)
@asset('pine_b')
def _(a): pine(a, 2, 5, 7.6, .92)
@asset('pine_c')
def _(a): pine(a, 3, 3, 5.2, 1.1)
@asset('pine_lo')
def _(a): pine(a, 4, 3, 6.6, 1.0, 6)
@asset('pine_dead')
def _(a):
    bark = a.m('bark', '#5a5046'); dk = a.m('bark2', '#3d3630'); rr = random.Random(9)
    pts = [(0, 0, 0), (.05, .02, 1.8), (-.06, .05, 3.6), (.08, -.02, 5.2)]
    a.add(displace(tube(pts, [.26, .2, .14, .05], 6), .05, 3, 2), bark)
    for i in range(7):
        z = rr.uniform(1.6, 4.8); ang = rr.uniform(0, 2*pi); L = rr.uniform(.6, 1.5)*(1.3-z/6)
        p0 = V((cos(ang)*.1, sin(ang)*.1, z)); p1 = p0 + V((cos(ang)*L, sin(ang)*L, rr.uniform(-.2, .5))); p2 = p1 + V((cos(ang+.5)*L*.4, sin(ang+.5)*L*.4, rr.uniform(-.1, .4)))
        a.add(tube([p0, p1, p2], [.06, .035, .01], 4), dk)

def blade(bm, base, ang, h, lean, w, segs=3):
    d = V((cos(ang), sin(ang), 0)); side = V((-sin(ang), cos(ang), 0))*w
    left = []; right = []
    for i in range(segs+1):
        t = i/segs; p = V(base) + d*lean*t*t + V((0, 0, h*t)); ww = 1-t*.95
        left.append(bm.verts.new(p-side*ww)); right.append(bm.verts.new(p+side*ww))
    for i in range(segs): bm.faces.new((left[i], right[i], right[i+1], left[i+1]))
def grass(a, seed, n, h, col):
    rr = random.Random(seed); g = a.m('grass', col); g2 = a.m('grass2', mix(col, '#8a8a5a', .35))
    for i in range(n):
        bm = bmesh.new(); ang = rr.uniform(0, 2*pi); r = rr.uniform(0, .12)
        blade(bm, (cos(ang)*r, sin(ang)*r, 0), ang+rr.uniform(-.5, .5), h*rr.uniform(.55, 1.1), h*rr.uniform(.15, .45), .026, 2)
        a.add(bm, g2 if rr.random() < .25 else g)
@asset('grass_a', ao=.6)
def _(a): grass(a, 1, 6, .42, '#4c6a43')
@asset('grass_b', ao=.6)
def _(a): grass(a, 2, 7, .34, '#58703f')
@asset('grass_c', ao=.6)
def _(a): grass(a, 3, 5, .55, '#6a7148')
@asset('reeds', ao=.5)
def _(a):
    rr = random.Random(4); g = a.m('reed', '#7a7650'); g2 = a.m('reed2', '#5f6a45'); hd = a.m('cattail', '#4a3426')
    for i in range(10):
        bm = bmesh.new(); ang = rr.uniform(0, 2*pi); r = rr.uniform(0, .18)
        blade(bm, (cos(ang)*r, sin(ang)*r, 0), ang, rr.uniform(.8, 1.35), rr.uniform(.1, .35), .025, 3); a.add(bm, g if i % 2 else g2)
    for i in range(3):
        x, y = rr.uniform(-.1, .1), rr.uniform(-.1, .1); h = rr.uniform(1.1, 1.5)
        a.add(cyl(.008, .008, h, 3, at=(x, y, 0)), g2); a.add(cyl(.03, .03, .16, 5, at=(x, y, h-.2)), hd)
@asset('fern', ao=.6)
def _(a):
    rr = random.Random(5); g = a.m('fern', '#3f6340'); g2 = a.m('fern2', '#4f7346')
    for i in range(7):
        ang = i/7*2*pi+rr.uniform(-.2, .2); L = rr.uniform(.55, .8); bm = bmesh.new()
        d = V((cos(ang), sin(ang), 0)); s = V((-sin(ang), cos(ang), 0))
        pts = [d*L*t + V((0, 0, sin(t*pi*.85)*.38*L)) for t in [k/6 for k in range(7)]]
        for k in range(6):
            w = .1*(1-k/6)+.02; p, q = pts[k], pts[k+1]
            for sg in (-1, 1):
                v0 = bm.verts.new(p); v1 = bm.verts.new(q); v2 = bm.verts.new((p+q)/2 + s*sg*w - V((0, 0, .03)))
                bm.faces.new((v0, v1, v2) if sg > 0 else (v1, v0, v2))
        a.add(bm, g if i % 2 else g2)
@asset('bush_a', ao=1.1)
def _(a):
    rr = random.Random(6); g = a.m('leaf', '#2e4d33'); g2 = a.m('leaf2', '#3b5c3b'); g3 = a.m('leaf3', '#24402c')
    for i in range(6):
        r = rr.uniform(.35, .6); p = (rr.uniform(-.45, .45), rr.uniform(-.45, .45), r*.7+rr.uniform(0, .25))
        bm = ico(r, 1, p); displace(bm, .12, 3.5, i); a.add(bm, lambda f: g2 if f.normal.z > .5 else (g3 if f.normal.z < -.2 else g))
@asset('bush_b', ao=1.1)
def _(a):
    rr = random.Random(7); g = a.m('leaf', '#34503a'); g2 = a.m('leaf2', '#455f3c'); b = a.m('berry', '#6a2a2a')
    for i in range(4):
        r = rr.uniform(.3, .45); p = (rr.uniform(-.35, .35), rr.uniform(-.35, .35), r*.75)
        bm = ico(r, 1, p); displace(bm, .1, 4, i+20); a.add(bm, lambda f: g2 if f.normal.z > .4 else g)
    for i in range(7): a.add(ico(.04, 0, (rr.uniform(-.5, .5), rr.uniform(-.5, .5), rr.uniform(.3, .7))), b)
@asset('flower', ao=.5)
def _(a):
    rr = random.Random(8); st = a.m('stem', '#4c6a43'); pet = a.m('petal', '#bdb79a'); c = a.m('center', '#8a7a3a')
    for i in range(4):
        x, y = rr.uniform(-.12, .12), rr.uniform(-.12, .12); h = rr.uniform(.25, .45)
        a.add(tube([(x, y, 0), (x+.03, y, h*.6), (x, y+.02, h)], [.008, .007, .006], 3), st)
        for k in range(5):
            ang = k/5*2*pi; a.add(tri_fan([V((x, y+.02, h)), V((x+cos(ang)*.06, y+.02+sin(ang)*.06, h+.015)), V((x+cos(ang+.6)*.06, y+.02+sin(ang+.6)*.06, h+.015))]), pet)
        a.add(sph(.015, at=(x, y+.02, h+.01), seg=5, rings=3), c)
@asset('mushroom', ao=.8)
def _(a):
    rr = random.Random(9); st = a.m('stalk', '#cfc4a8'); cap = a.m('cap', '#8a6a4a'); cap2 = a.m('cap2', '#b0a07a')
    for i in range(3):
        x, y = rr.uniform(-.1, .1), rr.uniform(-.1, .1); h = rr.uniform(.06, .14); r = h*.7
        a.add(cyl(.018, .014, h, 5, at=(x, y, 0)), st); a.add(lathe([(r, h), (r*.85, h+r*.35), (0, h+r*.55)], 7), cap if i % 2 else cap2)
def rock(a, seed, r, flat):
    g = a.m('rock', '#5f6563'); g2 = a.m('rock2', '#4e5452'); moss = a.m('moss', '#3c5236')
    bm = ico(r, 3); xform(bm, Sc(1, .85, flat)); displace(bm, r*.4, 1.5/r, seed, 3); jitter(bm, r*.03, seed)
    for v in bm.verts:
        if v.co.z < 0: v.co.z *= .3
    bm = modproc(bm, ratio=.3)
    a.add(bm, lambda f: moss if f.normal.z > .7 else (g if (f.index % 3) else g2))
@asset('rock_a')
def _(a): rock(a, 1, .45, .7)
@asset('rock_b')
def _(a): rock(a, 2, .7, .5)
@asset('rock_c')
def _(a): rock(a, 3, .3, .9)
NATURE = ['pine_a', 'pine_b', 'pine_c', 'pine_lo', 'pine_dead', 'grass_a', 'grass_b', 'grass_c', 'reeds', 'fern', 'bush_a', 'bush_b', 'flower', 'mushroom', 'rock_a', 'rock_b', 'rock_c']

# ================================================================ PROPS
def dbl(bm):
    """make a single-sided surface double sided"""
    fs = list(bm.faces)
    for f in fs:
        try: nf = bm.faces.new(list(reversed(f.verts))); nf.material_index = f.material_index
        except ValueError: pass
    return bm
WOOD = '#6b4f36'; WOODD = '#4a3626'; WOODL = '#7d6146'; IRON = '#2a2c2c'; BRASS = '#b08d3c'
def plank_box(a, sx, sy, sz, at, mats, n=4, axis='z', gap=.015, rr=None):
    rr = rr or R
    x, y, z = at
    if axis == 'z':
        h = sz/n
        for i in range(n): a.add(box(sx-.004, sy-.004, h-gap, (x, y, z+h*i+h/2+gap/2)), mats[rr.randint(0, len(mats)-1)])
    else:
        w = sx/n
        for i in range(n): a.add(box(w-gap, sy, sz, (x-sx/2+w*i+w/2, y, z+sz/2)), mats[rr.randint(0, len(mats)-1)])
@asset('crate_a')
def _(a):
    w = a.m('wood', WOOD); w2 = a.m('wood2', '#5e452f'); w3 = a.m('wood3', WOODL); fr = a.m('frame', WOODD); dk = a.m('inner', '#2a2018')
    s = 1.1; rr = random.Random(11)
    a.add(box(s-.06, s-.06, s-.06, (0, 0, s/2)), dk)
    for i in range(4):
        h = (s-.02)/4; z = .01+h*i+h/2
        a.add(box(s-.02, .04, h-.02, (0, -s/2+.02, z)), [w, w2, w3][rr.randint(0, 2)]); a.add(box(s-.02, .04, h-.02, (0, s/2-.02, z)), [w, w2, w3][rr.randint(0, 2)])
        a.add(box(.04, s-.02, h-.02, (-s/2+.02, 0, z)), [w, w2, w3][rr.randint(0, 2)]); a.add(box(.04, s-.02, h-.02, (s/2-.02, 0, z)), [w, w2, w3][rr.randint(0, 2)])
        a.add(box(s-.02, h-.02, .04, (0, -s/2+.01+h*i+h/2, s-.02)), [w, w2, w3][rr.randint(0, 2)])
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.1, .1, s, (sx*(s/2-.03), sy*(s/2-.03), s/2)), fr)
    for sy in (-1, 1):
        for z in (.05, s-.05): a.add(box(s, .1, .1, (0, sy*(s/2-.03), z)), fr)
    for sy in (-1, 1): a.add(box(.09, .05, s*1.3, (0, sy*(s/2+.005), s/2), T=None), fr)
    # diagonal braces on front/back
    for sy in (-1, 1):
        b = box(.09, .05, s*1.25, (0, 0, 0)); xform(b, Ry(radians(45))); xform(b, Tr(0, sy*(s/2+.01), s/2)); a.add(b, fr)
@asset('crate_b')
def _(a):
    BUILDERS['crate_a'][0](a); fr = a.m('frame', WOODD); w = a.m('wood', WOOD); st = a.m('stencil', '#2a2622')
    lid = box(1.06, 1.06, .06, (0, 0, 0)); xform(lid, Rz(.35)); xform(lid, Rx(.08)); xform(lid, Tr(.12, -.06, 1.16)); a.add(lid, w)
    for i in range(3): a.add(box(.18, .01, .08, (-.25+i*.25, -.585, .62)), st)
@asset('barrel')
def _(a):
    w = a.m('wood', '#5d4630'); w2 = a.m('wood2', '#6c533a'); ir = a.m('iron', IRON); top = a.m('top', '#4f3b28')
    prof = [(.36, 0), (.41, .2), (.45, .55), (.41, .9), (.36, 1.1)]
    bm = lathe(prof, 14, cap0=True, cap1=False)
    def mi(f):
        c = f.calc_center_median(); return w if int((atan2(c.y, c.x)+pi)/(2*pi)*14) % 2 else w2
    a.add(bm, mi)
    a.add(cyl(.33, .33, .03, 12, at=(0, 0, 1.06)), top)
    for z, r in ((.1, .395), (.32, .44), (.78, .44), (1.0, .375)): a.add(cyl(r, r, .06, 14, at=(0, 0, z)), ir)
def hull(a, L, W, Hh, mats, seed):
    hullm, hull2, inner, trim = mats; rr = random.Random(seed); N = 9; secs = []
    for i in range(N):
        t = i/(N-1); y = -L/2+L*t
        wk = sin(pi*min(1, t*1.15))**.7 if t < .87 else max(.02, (1-t)/.13*.55)
        if t < .1: wk = .62+t*2.8
        w = W/2*wk; d = Hh*(.75+.25*sin(pi*t)); zr = Hh*(.18*(1-t)+.12*(t**3)*3)
        pts = [V((-w, y, Hh+zr*.6)), V((-w*.92, y, Hh*.45)), V((-w*.62, y, Hh*.12)), V((0, y, 0)), V((w*.62, y, Hh*.12)), V((w*.92, y, Hh*.45)), V((w, y, Hh+zr*.6))]
        secs.append(pts)
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in s] for s in secs]
    for i in range(N-1):
        for k in range(6): bm.faces.new((vs[i][k], vs[i+1][k], vs[i+1][k+1], vs[i][k+1]))
    bm.faces.new([vs[0][k] for k in range(7)])
    a.add(bm, lambda f: hull2 if (f.calc_center_median().z > Hh*.7 or abs(f.calc_center_median().z-Hh*.3) < .06) else hullm)
    # inner shell
    bm = bmesh.new(); vs = [[bm.verts.new(V((p.x*.88, p.y*(.96), p.z*.92+.05))) for p in s] for s in secs]
    for i in range(N-1):
        for k in range(6): bm.faces.new((vs[i][k], vs[i][k+1], vs[i+1][k+1], vs[i+1][k]))
    a.add(bm, inner)
    for s in (-1, 1):
        a.add(tube([V((s*sp[-1].x*.95, sp[-1].y, sp[-1].z+.02)) for sp in secs], .045, 4), trim)
    for t in (.3, .62): a.add(box(W*.78*sin(pi*t)**.7, .22, .05, (0, -L/2+L*t, Hh*.72)), inner)
@asset('boat_a')
def _(a):
    m = (a.m('hull', '#5a4a3a'), a.m('hull2', '#3f342a'), a.m('inner', '#6b5a44'), a.m('trim', '#2f2820'))
    hull(a, 3.4, 1.5, .62, m, 1); oar = a.m('oar', '#7a6a50')
    for s in (-1, 1):
        o = tube([(s*.3, -1.0, .32), (s*.35, .9, .36)], .025, 4); a.add(o, oar); a.add(box(.14, .4, .02, (s*.35, 1.05, .37)), oar)
@asset('boat_b')
def _(a):
    m = (a.m('hull', '#4f5a56'), a.m('hull2', '#3a403d'), a.m('inner', '#5f5444'), a.m('trim', '#2a2622'))
    hull(a, 3.0, 1.6, .7, m, 2); tarp = a.m('tarp', '#4b4a3e'); net = a.m('net', '#3d4a44')
    bm = ico(.55, 1, (0, .5, .55)); xform(bm, Sc(1.1, 1.6, .5)); displace(bm, .12, 3, 2); a.add(bm, tarp)
    bm = ico(.35, 1, (.15, -.7, .45)); xform(bm, Sc(1, 1.3, .5)); displace(bm, .1, 4, 3); a.add(bm, net)
@asset('fence')
def _(a):
    rr = random.Random(12); p = a.m('post', '#4a3a2a'); w = a.m('picket', '#6b5a44'); w2 = a.m('picket2', '#57493a'); rl = a.m('rail', '#5a4836')
    a.add(box(.15, .15, 1.38, (-1, 0, .69)), p); a.add(cyl(.09, 0, .12, 4, at=(-1, 0, 1.38)), p)
    for z in (.42, .95): a.add(box(2, .05, .09, (0, .05, z)), rl)
    for i in range(6):
        if rr.random() < .1: continue
        x = -.8+i*.32; h = rr.uniform(1.0, 1.18)
        pk = poly_extrude([(-.06, 0), (.06, 0), (.06, h-.08), (0, h), (-.06, h-.08)], .03); xform(pk, Ry(rr.uniform(-.06, .06))); xform(pk, Tr(x, -.01, .04)); a.add(pk, w if rr.random() < .6 else w2)
@asset('lamp')
def _(a):
    ir = a.m('iron', '#1e2324'); ir2 = a.m('iron2', '#2c3233'); gl = a.m('glass', '#f6cf70', 1.0); st = a.m('base', '#3f4544')
    a.add(cyl(.22, .18, .25, 8), st); a.add(cyl(.16, .1, .25, 8, at=(0, 0, .25)), ir)
    a.add(cyl(.075, .06, 2.45, 8, at=(0, 0, .5)), ir); a.add(cyl(.11, .11, .08, 8, at=(0, 0, 1.2)), ir2); a.add(cyl(.1, .14, .12, 8, at=(0, 0, 2.88)), ir2)
    a.add(box(.5, .06, .06, (0, 0, 2.62)), ir)
    a.add(box(.34, .34, .46, (0, 0, 3.24)), gl)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.05, .05, .5, (sx*.18, sy*.18, 3.24)), ir)
    a.add(lathe([(.32, 3.48), (.3, 3.54), (.06, 3.74), (0, 3.78)], 4, T=Rz(pi/4)), ir2); a.add(sph(.05, at=(0, 0, 3.82), seg=5, rings=3), ir)
    a.add(box(.42, .42, .05, (0, 0, 3.0)), ir2)
def headstone(a, seed, shape):
    rr = random.Random(seed); st = a.m('stone', '#6f7775'); st2 = a.m('stone2', '#5c6462'); moss = a.m('moss', '#4a5c40'); dk = a.m('engrave', '#3a4140'); mound = a.m('mound', '#2a3a2c')
    tilt = Rx(rr.uniform(-.12, .1)) @ Ry(rr.uniform(-.08, .08))
    if shape == 'a':
        poly = [(-.31, 0), (.31, 0), (.31, .66)] + [(cos(t)*.31, .66+sin(t)*.3) for t in [k/7*pi for k in range(1, 7)]] + [(-.31, .66)]
        bm = poly_extrude(poly, .15); xform(bm, tilt); a.add(bm, lambda f: moss if f.normal.z > .5 else st)
        a.add(box(.04, .02, .32, (0, -.08, .56), T=tilt), dk); a.add(box(.2, .02, .04, (0, -.08, .62), T=tilt), dk)
        for i in range(3): a.add(box(.32-i*.06, .02, .025, (0, -.08, .32-i*.07), T=tilt), dk)
    elif shape == 'b':
        a.add(box(.14, .14, 1.2, (0, 0, .6), T=tilt), st); a.add(box(.62, .14, .14, (0, 0, .82), T=tilt), st2); a.add(box(.4, .3, .18, (0, 0, .09)), st2)
    elif shape == 'c':
        a.add(box(.7, 1.5, .18, (0, -.55, .09)), st); a.add(box(.66, .06, .02, (0, -.4, .19)), dk)
        bm = poly_extrude([(-.28, 0), (.28, 0), (.28, .5), (.18, .62), (-.18, .62), (-.28, .5)], .13); xform(bm, tilt); xform(bm, Tr(0, .3, 0)); a.add(bm, lambda f: moss if f.normal.z > .5 else st2)
    else:
        a.add(lathe([(.08, 0), (.07, 1.05)], 4, T=Rz(pi/4) @ tilt), st)
        a.add(box(.5, .12, .1, (0, 0, .82), T=tilt), st)
        ring = tube([V((cos(t)*.17, 0, .82+sin(t)*.17)) for t in [k/12*2*pi for k in range(13)]], .025, 4, False, False); xform(ring, tilt); a.add(ring, st2)
        a.add(box(.36, .28, .16, (0, 0, .08)), st2)
    if shape != 'c':
        bm = sph(.38, .62, .14, (0, -.8, 0), 8, 5); displace(bm, .03, 5, seed); a.add(bm, mound)
@asset('grave_a')
def _(a): headstone(a, 1, 'a')
@asset('grave_b')
def _(a): headstone(a, 2, 'b')
@asset('grave_c')
def _(a): headstone(a, 3, 'c')
@asset('grave_d')
def _(a): headstone(a, 4, 'd')
@asset('obelisk')
def _(a):
    st = a.m('stone', '#59625f'); st2 = a.m('stone2', '#4c5452'); rn = a.m('rune', '#7fffe0', .55); moss = a.m('moss', '#3e5238')
    a.add(box(1.7, 1.7, .25, (0, 0, .125)), st2); a.add(box(1.35, 1.35, .25, (0, 0, .375)), st)
    a.add(lathe([(.58, .5), (.42, 3.6), (0, 4.25)], 4, T=Rz(pi/4)), lambda f: moss if f.calc_center_median().z < 1.2 and f.normal.z > -.1 and R.random() < .3 else st)
    for k in range(5): a.add(box(.18-.02*k, .012, .03, (0, -.36+.005*k, 1.3+k*.45)), rn)
    for k in range(4): a.add(box(.03, .012, .2, (-.09+.06*k, -.38, 1.08)), rn)
@asset('well')
def _(a):
    rr = random.Random(5); st = a.m('stone', '#6f7775'); st2 = a.m('stone2', '#5a605e'); wt = a.m('water', '#0c1a1e'); w = a.m('wood', WOODD); w2 = a.m('wood2', WOOD); rf = a.m('roof', '#4b3a36'); rope = a.m('rope', '#8a7a5a')
    for layer in range(3):
        for i in range(14):
            ang = (i+layer*.5)/14*2*pi; b = box(.46, .32, .28, (0, 0, 0)); jitter(b, .025, i+layer*20)
            xform(b, Rz(ang+pi/2)); xform(b, Tr(cos(ang)*1.0, sin(ang)*1.0, .14+layer*.29)); a.add(b, st if (i+layer) % 3 else st2)
    a.add(cyl(.82, .82, .05, 12, at=(0, 0, .55)), wt)
    for s in (-1, 1): a.add(box(.14, .14, 2.3, (s*1.05, 0, 1.15)), w)
    a.add(box(2.3, .12, .12, (0, 0, 2.05)), w); a.add(cyl(.08, .08, 1.9, 6, T=Tr(0, 0, 1.75) @ Ry(pi/2) @ Tr(0, 0, -.95)), w2)
    for s in (-1, 1):
        rb = box(2.5, .9, .07, (0, 0, 0)); xform(rb, Rx(s*.55)); xform(rb, Tr(0, s*.38, 2.55)); a.add(rb, rf)
    a.add(cyl(.01, .01, 1.1, 3, at=(.2, 0, .7)), rope); a.add(cyl(.14, .16, .22, 8, at=(.2, 0, .55)), w2)
    a.add(box(.06, .3, .06, (1.2, -.15, 1.75)), w2)
@asset('netrack')
def _(a):
    w = a.m('wood', WOODD); net = a.m('net', '#48564e'); fl = a.m('float', '#c9b26a')
    for s in (-1, 1): a.add(box(.13, .13, 2.05, (s*1.6, 0, 1.02)), w)
    a.add(box(3.5, .1, .1, (0, 0, 1.95)), w)
    cols, rows = 9, 6; pts = []
    for j in range(rows+1):
        row = []
        for i in range(cols+1):
            x = -1.55+3.1*i/cols; z = 1.9-1.45*j/rows - sin(pi*i/cols)*.25*(j/rows); y = sin(i*1.7+j)*.04
            row.append(V((x, y, z)))
        pts.append(row)
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in pts]
    for j in range(rows):
        for i in range(cols): bm.faces.new((vs[j][i], vs[j][i+1], vs[j+1][i+1], vs[j+1][i]))
    a.add(dbl(bm), net)
    for i in range(6): a.add(sph(.06, at=(-1.3+i*.52, -.03, 1.88), seg=6, rings=4), fl)
@asset('ropecoil')
def _(a):
    r = a.m('rope', '#8a7a5a'); r2 = a.m('rope2', '#6e6248')
    pts = [V((cos(t)*(.32-.05*(t//(2*pi))), sin(t)*(.32-.05*(t//(2*pi))), .05+.06*(t/(2*pi)))) for t in [k*.4 for k in range(48)]]
    a.add(tube(pts, .045, 5), lambda f: r if f.index % 2 else r2)
@asset('trap')
def _(a):
    w = a.m('wood', '#5e4a36'); net = a.m('mesh', '#3e4a44')
    for x in (-.4, .4):
        for y in (-.3, .3): a.add(box(.04, .04, .5, (x, y, .25)), w)
    for z in (.02, .48):
        for y in (-.3, .3): a.add(box(.84, .04, .04, (0, y, z)), w)
        for x in (-.4, .4): a.add(box(.04, .64, .04, (x, 0, z)), w)
    for t in (-.3, 0, .3): a.add(tube([V((-.4, cos(k/6*pi)*.3, .48+sin(k/6*pi)*.18)) for k in range(7)], .015, 3, False, False, T=Tr(.4+t, 0, 0)), w)
    a.add(dbl(quadstrip([V((-.4, -.3, .03)), V((.4, -.3, .03))], [V((-.4, -.3, .48)), V((.4, -.3, .48))])), net)
@asset('buoy')
def _(a):
    r = a.m('red', '#8a2a24'); wh = a.m('white', '#c9c2b0'); ir = a.m('iron', IRON)
    a.add(lathe([(.05, 0), (.25, .08), (.3, .3), (.25, .52), (.06, .6)], 10), lambda f: r if (int(f.calc_center_median().z/.15) % 2) else wh)
    a.add(tube([V((cos(t)*.08, 0, .68+sin(t)*.08)) for t in [k/8*2*pi for k in range(9)]], .015, 4, False, False), ir)
@asset('anchor')
def _(a):
    ir = a.m('rust', '#5a3a2a'); ir2 = a.m('rust2', '#3e2a20')
    s = tube([(0, 0, .05), (0, 0, 1.4)], .06, 6); xform(s, Rx(-1.35)); a.add(s, ir)
    arm = tube([V((cos(t)*.55, 0, .55-sin(t)*.55)) for t in [k/8*pi for k in range(9)]], .05, 5); xform(arm, Rx(-1.35)); a.add(arm, ir2)
    a.add(tube([V((cos(t)*.12, 0, 1.5+sin(t)*.12)) for t in [k/8*2*pi for k in range(9)]], .03, 4, False, False, T=Rx(-1.35)), ir)
@asset('cart')
def _(a):
    w = a.m('wood', WOOD); w2 = a.m('wood2', WOODD); ir = a.m('iron', IRON)
    plank_box(a, 1.6, 1.0, .08, (0, 0, .5), [w, w2], 5, 'x')
    for s in (-1, 1): a.add(box(1.6, .06, .3, (0, s*.5, .72)), w2); a.add(box(.06, 1.0, .3, (s*.8, 0, .72)), w2)
    for s in (-1, 1):
        wh = cyl(.38, .38, .07, 10, T=Tr(.1, s*.58, .38) @ Rx(pi/2) @ Tr(0, 0, -.035)); a.add(wh, ir)
        for k in range(4): a.add(box(.05, .03, .7, (0, 0, 0), T=Tr(.1, s*.58, .38) @ Ry(k*pi/4)), w2)
    for s in (-1, 1): a.add(box(1.1, .06, .06, (-1.3, s*.4, .62)), w2)
    a.add(box(.06, .06, .5, (.6, 0, .25)), w2)
@asset('bench')
def _(a):
    w = a.m('wood', WOOD); w2 = a.m('wood2', WOODD)
    plank_box(a, 1.8, .45, .05, (0, 0, .45), [w, w2], 1, 'x')
    for i in range(3): a.add(box(1.8, .12, .04, (0, -.16+i*.16, .47)), [w, w2][i % 2])
    for s in (-1, 1): a.add(box(.08, .4, .45, (s*.75, 0, .22)), w2)
    a.add(box(1.8, .04, .14, (0, .22, .8)), w); a.add(box(1.8, .04, .12, (0, .22, .64)), w2)
    for s in (-1, 1): a.add(box(.06, .06, .9, (s*.75, .22, .45)), w2)
@asset('seawall', ground=False)
def _(a):
    rr = random.Random(21); st = a.m('stone', '#4a4a44'); st2 = a.m('stone2', '#3a3a34'); st3 = a.m('stone3', '#55554c'); moss = a.m('moss', '#2e3a2c'); weed = a.m('weed', '#1f3324')
    for course, (z0, hh) in enumerate([(-1.15, .5), (-.65, .42), (-.23, .3)]):
        x = -96+rr.uniform(0, 1)
        while x < 96:
            w = rr.uniform(1.1, 2.2); b = box(w-.05, .55+course*.04, hh-.03, (x+w/2, rr.uniform(-.04, .04), z0+hh/2)); jitter(b, .03, int(x*10)+course)
            a.add(b, lambda f, c=course: moss if (f.normal.z > .5 and rr.random() < .4) else (weed if c == 0 and f.normal.y < -.5 and rr.random() < .5 else [st, st2, st3][rr.randint(0, 2)]))
            x += w
    for i in range(40):
        x = rr.uniform(-95, 95); b = ico(rr.uniform(.25, .5), 1, (x, rr.uniform(-.6, -.3), -.8)); displace(b, .1, 3, i); a.add(b, st2)
@asset('pier', ground=False)
def _(a):
    rr = random.Random(31); w = a.m('wood', '#5c4a38'); w2 = a.m('wood2', '#4e3e2f'); w3 = a.m('wood3', '#6a5640'); post = a.m('post', '#3a2e24'); rope = a.m('rope', '#7a6a50'); barn = a.m('barnacle', '#6a6a60'); weed = a.m('weed', '#203524'); ir = a.m('iron', IRON)
    def deck(x0, x1, y0, y1):
        y = y0
        while y < y1:
            pw = rr.uniform(.26, .34); a.add(box(x1-x0+rr.uniform(-.1, .1), pw-.04, .08, ((x0+x1)/2+rr.uniform(-.05, .05), y+pw/2, .01+rr.uniform(-.01, .01))), [w, w2, w3][rr.randint(0, 2)]); y += pw
    deck(-3, 3, -3, 17.4); deck(-8, 8, -17, -3)
    for x in (-2.6, -.9, .9, 2.6): a.add(box(.2, 20.4, .24, (x, 7.2, -.16)), post)
    for x in (-7.6, -4, 0, 4, 7.6): a.add(box(.24, 14, .26, (x, -10, -.17)), post)
    posts = [(x, y) for y in [16-4*i for i in range(5)] for x in (-2.7, 2.7)] + [(x, y) for y in (-4, -8, -12, -16) for x in (-7.6, 7.6)]
    for (x, y) in posts:
        p = cyl(.22, .24, 3.6, 7, at=(x, y, -3.2)); displace(p, .02, 4, int(x*7+y)); a.add(p, lambda f: barn if f.calc_center_median().z < -.9 and rr.random() < .4 else (weed if f.calc_center_median().z < -1.6 else post))
        for k in range(4): a.add(cyl(.06, 0, .08, 4, at=(x+rr.uniform(-.25, .25), y+rr.uniform(-.25, .25), rr.uniform(-1.5, -.7))), barn)
    for x in (-2.7, 2.7):
        for y in (16, 12, 8, 4):
            a.add(cyl(.15, .14, .9, 6, at=(x, y, .05)), post)
        a.add(tube([V((x, 16-t*12, .82-sin(pi*((t*3) % 1))*.18)) for t in [k/24 for k in range(25)]], .03, 4), rope)
    for s in (-1, 1): a.add(box(.2, .2, 2.2, (s*3, 16.6, 1.1)), post)
    a.add(box(6.2, .18, .18, (0, 16.6, 2.15)), post)
    for s in (-1, 1):
        for k in range(7): a.add(box(.1, .06, 1.6, (s*(.35+k*.38), 16.62, .9)), [w, w2][k % 2])
        a.add(box(2.8, .08, .1, (s*1.5, 16.62, 1.5)), w2); a.add(box(2.8, .08, .1, (s*1.5, 16.62, .35)), w2)
    a.add(tube([(-.3, 16.55, .95), (0, 16.5, .8), (.3, 16.55, .95)], .025, 4), ir)
    for (x, y) in ((-7.8, -3.4), (7.8, -3.4), (-7.8, -16.6), (7.8, -16.6), (2.9, 1.0), (-2.9, 9)):
        a.add(cyl(.18, .14, .45, 7, at=(x, y, .05)), ir); a.add(cyl(.22, .22, .06, 7, at=(x, y, .48)), ir)
@asset('altar')
def _(a):
    st = a.m('stone', '#555e5c'); st2 = a.m('stone2', '#3c4543'); rel = a.m('relief', '#48514f'); bl = a.m('blood', '#3a1210'); ir = a.m('iron', IRON); rn = a.m('rune', '#c0402a', .35)
    a.add(box(1.4, 2.8, 1.0, (0, 0, .5)), st); a.add(box(1.7, 3.1, .16, (0, 0, 1.08)), st2); a.add(box(1.6, 3.0, .12, (0, 0, .06)), st2)
    for s in (-1, 1):
        for k in range(3):
            pts = [V((s*.71, -1.1+k*1.1+.3*sin(t*3+k), .15+t*.7)) for t in [i/6 for i in range(7)]]
            a.add(tube(pts, [.07-.008*i for i in range(7)], 5), rel)
        for k in range(5): a.add(box(.01, .12, .12, (s*.705, -1.2+k*.6, .82)), rn)
    for i in range(4):
        b = cyl(rand_r := R.uniform(.12, .28), rand_r*.9, .012, 7, at=(R.uniform(-.5, .5), R.uniform(-1.2, 1.2), 1.16)); a.add(b, bl)
    for s in (-1, 1):
        for y in (-1.2, 1.2):
            a.add(tube([V((s*.86, y+cos(t)*.08, 1.0+sin(t)*.08)) for t in [k/8*2*pi for k in range(9)]], .015, 4, False, False), ir)
@asset('brazier')
def _(a):
    st = a.m('stone', '#4f5755'); ir = a.m('iron', '#1e2222'); coal = a.m('coal', '#ff6a20', 1.0); coal2 = a.m('ember', '#ffb040', 1.0)
    a.add(lathe([(.3, 0), (.24, .2), (.18, .3), (.2, 1.4), (.26, 1.55)], 8), st)
    a.add(lathe([(.12, 1.5), (.42, 1.75), (.46, 1.9), (.4, 1.92)], 10, cap1=False), ir)
    for i in range(7): a.add(ico(R.uniform(.08, .14), 0, (R.uniform(-.25, .25), R.uniform(-.25, .25), 1.82)), coal if i % 2 else coal2)
    a.add(lathe([(.22, 1.8), (.16, 2.05), (0, 2.4)], 6), coal2)
def text_mesh(body, size=.5, extrude=.02, font=None):
    cu = bpy.data.curves.new('zov_txt', 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.resolution_u = 1
    ob = bpy.data.objects.new('zov_txt', cu); bpy.context.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); oe = ob.evaluated_get(dg); me = oe.to_mesh(); bm = bmesh.new(); bm.from_mesh(me); oe.to_mesh_clear()
    bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    bmesh.ops.dissolve_limit(bm, angle_limit=radians(3), verts=bm.verts, edges=bm.edges); xform(bm, Rx(pi/2)); return bm   # text now stands in the XZ plane facing -Y
@asset('motel_sign')
def _(a):
    ir = a.m('iron', '#263238'); fr = a.m('frame', '#1a2226'); lt = a.m('neon', '#ff5a3a', 1.0); dim = a.m('dim', '#6a4030', .3); bd = a.m('board', '#2a3438')
    a.add(cyl(.1, .1, 3.7, 8), ir); a.add(box(2.7, .18, 1.1, (0, 0, 3.15)), fr); a.add(box(2.5, .2, .9, (0, 0, 3.15)), bd)
    for sy in (-1, 1):
        rot = Rz(pi) if sy > 0 else M.Identity(4)
        t = text_mesh('МОТЕЛЬ', .42, .02); xform(t, rot); xform(t, Tr(0, sy*.11, 3.27)); a.add(t, lt)
        t2 = text_mesh('МЕСТА ЕСТЬ', .16, .01); xform(t2, rot); xform(t2, Tr(0, sy*.11, 2.88)); a.add(t2, dim)
    a.add(box(.06, .06, .5, (.9, 0, 3.95)), ir); a.add(box(.06, .06, .5, (-.9, 0, 3.95)), ir)
@asset('door')
def _(a):
    w = a.m('wood', WOODD); w2 = a.m('wood2', '#5a4430'); br = a.m('brass', BRASS, .3)
    a.add(box(1.2, .1, 1.9, (0, 0, .95)), w)
    for z in (.5, 1.3): a.add(box(.8, .14, .55, (0, 0, z)), w2)
    a.add(sph(.05, at=(.45, -.08, .95), seg=6, rings=4), br); a.add(box(.12, .02, .16, (0, -.08, 1.65)), br)

# ---------------------------------------------------------------- interior & puzzle props
@asset('counter')
def _(a):
    w = a.m('wood', '#6b4f36'); w2 = a.m('wood2', '#5a4230'); top = a.m('top', '#3e2c1e'); pan = a.m('panel', '#7a5c40')
    a.add(box(5, .8, 1.0, (0, .05, .5)), w); a.add(box(5.25, 1.1, .08, (0, 0, 1.04)), top); a.add(box(5.1, .9, .1, (0, .05, .05)), w2)
    for i in range(6): a.add(box(.66, .04, .55, (-2.08+i*.83, -.36, .55)), pan)
    for i in range(7): a.add(box(.06, .05, .9, (-2.5+i*.833, -.37, .5)), w2)
@asset('keyboard')
def _(a):
    w = a.m('wood', WOODD); w2 = a.m('wood2', '#5a4430'); br = a.m('brass', '#c9a23a', .45); tag = a.m('tag', '#b9a98a')
    a.add(box(1.4, .45, .9, (0, 0, .45)), w); a.add(box(1.4, .12, 1.3, (0, .17, 1.55)), w2); a.add(box(1.5, .2, .08, (0, .1, 2.22)), w)
    for i in range(6):
        x = -.45+(i % 3)*.45; z = 1.25+(i//3)*.5
        a.add(cyl(.012, .012, .08, 4, T=Tr(x, .07, z) @ Rx(pi/2)), w); a.add(box(.05, .015, .14, (x, .02, z-.12)), br); a.add(box(.07, .01, .05, (x, .015, z-.24)), tag)
    for i in range(3): a.add(box(.38, .02, .25, (-.45+i*.45, -.23, .55)), w2)
@asset('bell')
def _(a):
    br = a.m('brass', '#c9a23a', .3); dk = a.m('base', '#2a2a2a')
    a.add(cyl(.09, .09, .02, 10), dk); a.add(lathe([(.075, .02), (.07, .06), (.04, .1), (0, .11)], 10), br); a.add(cyl(.008, .008, .03, 4, at=(0, 0, .11)), br)
@asset('ledger')
def _(a):
    cv = a.m('cover', '#4a1f1a'); pg = a.m('page', '#d9cdb0'); ink = a.m('ink', '#3a3028')
    for s in (-1, 1):
        a.add(box(.25, .34, .02, (s*.13, 0, .01), T=Ry(s*.08)), cv); a.add(box(.23, .32, .02, (s*.13, 0, .03), T=Ry(s*.08)), pg)
        for k in range(5): a.add(box(.17, .012, .002, (s*.13, -.11+k*.05, .042), T=Ry(s*.08)), ink)
@asset('table_lamp')
def _(a):
    b = a.m('base', '#3a3028'); br = a.m('brass', BRASS); sh = a.m('shade', '#e8c27a', .7)
    a.add(cyl(.1, .08, .04, 8), b); a.add(cyl(.015, .015, .32, 5, at=(0, 0, .04)), br); a.add(lathe([(.17, .26), (.09, .46)], 10, cap0=False, cap1=False), sh)
    a.add(dbl(lathe([(.17, .26), (.09, .46)], 10, cap0=False, cap1=False)), sh)
@asset('bed')
def _(a):
    w = a.m('wood', '#4a3626'); w2 = a.m('wood2', '#5a4430'); mat_ = a.m('mattress', '#a8a294'); bl = a.m('blanket', '#5a6a6a'); bl2 = a.m('blanket2', '#4a5858'); pil = a.m('pillow', '#c2bba8')
    a.add(box(2.0, 3.5, .25, (0, 0, .3)), w); a.add(box(1.9, 3.4, .2, (0, 0, .52)), mat_)
    for s in (-1, 1):
        for y in (-1.72, 1.72): a.add(box(.1, .1, .75 if y > 0 else .55, (s*.95, y, .38 if y > 0 else .28)), w)
    a.add(box(2.0, .08, .6, (0, 1.76, .75)), w2); a.add(box(2.0, .1, .1, (0, 1.76, 1.08)), w)
    for i in range(5): a.add(box(.08, .06, .5, (-.7+i*.35, 1.76, .75)), w)
    a.add(box(2.0, .08, .3, (0, -1.76, .5)), w2)
    bm = box(1.96, 2.5, .12, (0, -.45, .66)); jitter(bm, .02, 3); a.add(bm, bl); a.add(box(2.02, .5, .16, (0, -1.45, .66)), bl2)
    bm = sph(.45, .22, .1, (-.4, 1.3, .72), 8, 4); a.add(bm, pil); bm = sph(.45, .22, .1, (.45, 1.32, .72), 8, 4); a.add(bm, pil)
@asset('nightstand')
def _(a):
    w = a.m('wood', '#6b4f36'); w2 = a.m('wood2', '#5a4230'); br = a.m('knob', BRASS)
    a.add(box(1.1, .95, .7, (0, 0, .45)), w); a.add(box(1.2, 1.0, .06, (0, 0, .82)), w2)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.08, .08, .12, (sx*.48, sy*.4, .06)), w2)
    for z in (.3, .6): a.add(box(.95, .03, .24, (0, -.48, z)), w2); a.add(sph(.03, at=(0, -.51, z), seg=5, rings=3), br)
@asset('book')
def _(a):
    cv = a.m('leather', '#3a1f1f'); pg = a.m('page', '#c9bc98'); mt = a.m('metal', '#8a7a5a'); sg = a.m('sigil', '#c04a2a', .4)
    a.add(box(.5, .36, .03, (0, 0, .015)), cv); a.add(box(.5, .36, .03, (0, 0, .105)), cv); a.add(box(.47, .34, .06, (.01, 0, .06)), pg); a.add(box(.03, .36, .12, (-.25, 0, .06)), cv)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.05, .05, .125, (sx*.23, sy*.16, .06)), mt)
    a.add(box(.06, .02, .08, (.26, 0, .06)), mt)
    a.add(tube([V((cos(t)*.07, sin(t)*.07, .123)) for t in [k/10*2*pi for k in range(11)]], .008, 3, False, False), sg)
    for k in range(3): a.add(box(.01, .1, .004, (cos(k*2.1)*.035, sin(k*2.1)*.035, .124), T=None), sg)
@asset('candle')
def _(a):
    h = a.m('holder', '#5a4a3a'); c = a.m('wax', '#d8cfb4'); f = a.m('flame', '#ffd27a', 1.0)
    a.add(cyl(.06, .05, .02, 8), h); a.add(cyl(.025, .025, .14, 6, at=(0, 0, .02)), c); a.add(lathe([(.012, .16), (.018, .18), (0, .24)], 5), f)
@asset('wardrobe')
def _(a):
    w = a.m('wood', '#5e452f'); w2 = a.m('wood2', '#4a3626'); br = a.m('knob', BRASS)
    a.add(box(1.6, .8, 2.1, (0, 0, 1.1)), w); a.add(box(1.75, .9, .1, (0, 0, 2.2)), w2); a.add(box(1.65, .85, .1, (0, 0, .05)), w2)
    for s in (-1, 1): a.add(box(.74, .03, 1.85, (s*.39, -.41, 1.1)), w2); a.add(box(.55, .03, .7, (s*.39, -.43, 1.5)), w); a.add(box(.55, .03, .6, (s*.39, -.43, .65)), w); a.add(sph(.03, at=(s*.06, -.45, 1.15), seg=5, rings=3), br)
@asset('armchair')
def _(a):
    f = a.m('fabric', '#4a5a48'); f2 = a.m('fabric2', '#3c4a3a'); w = a.m('wood', WOODD)
    a.add(box(.9, .85, .35, (0, 0, .45)), f); a.add(box(.85, .2, .7, (0, .38, .85)), f2)
    for s in (-1, 1): a.add(box(.18, .8, .3, (s*.46, 0, .72)), f2)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(cyl(.04, .03, .28, 5, at=(sx*.4, sy*.36, 0)), w)
    bm = box(.75, .7, .12, (0, -.04, .68)); jitter(bm, .015, 2); a.add(bm, f)
@asset('chair')
def _(a):
    w = a.m('wood', WOOD); w2 = a.m('wood2', WOODD)
    a.add(box(.48, .48, .05, (0, 0, .46)), w)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.05, .05, .46, (sx*.2, sy*.2, .23)), w2)
    for sx in (-1, 1): a.add(box(.05, .05, .5, (sx*.2, .2, .73)), w2)
    for z in (.65, .85): a.add(box(.42, .04, .06, (0, .2, z)), w)
@asset('rug', ground=False)
def _(a):
    r = a.m('rug', '#5a2f2a'); r2 = a.m('rug2', '#7a5a3a'); r3 = a.m('rug3', '#3a2420')
    a.add(box(3.0, 2.0, .02, (0, 0, .01)), r); a.add(box(2.6, 1.6, .022, (0, 0, .012)), r2); a.add(box(2.3, 1.3, .024, (0, 0, .013)), r)
    for i in range(5): a.add(box(.2, .2, .026, (-.8+i*.4, 0, .014), T=Rz(pi/4)), r3)
@asset('sculptor_table')
def _(a):
    w = a.m('wood', WOOD); w2 = a.m('wood2', WOODD); clay = a.m('clay', '#9a8a68'); clay2 = a.m('clay2', '#7f7155'); tool = a.m('tool', '#8a8f92')
    a.add(box(1.7, .7, .08, (0, 0, .86)), w)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.07, .07, .82, (sx*.78, sy*.28, .41)), w2)
    a.add(box(1.5, .05, .07, (0, .28, .4)), w2)
    T = Tr(0, .15, 1.2) @ Rx(-.35); a.add(box(.75, .08, .62, (0, 0, 0), T=T), clay)
    for k in range(4): a.add(tube([V((-.2+k*.13, -.045, .15)), V((-.25+k*.13, -.05, -.05)), V((-.2+k*.14, -.045, -.25))], .018, 4, T=T), clay2)
    for i in range(5): b = ico(.05, 0, (R.uniform(-.7, .7), R.uniform(-.25, .25), .93)); xform(b, Sc(1, 1, .5)); a.add(b, clay2)
    a.add(cyl(.008, .008, .25, 4, T=Tr(-.5, -.1, .91) @ Ry(pi/2)), tool); a.add(cyl(.01, .002, .18, 4, T=Tr(.5, -.15, .91) @ Ry(pi/2)), tool)
    a.add(box(.25, .02, .2, (0, .27, 1.38), T=Tr(.55, 0, 0) @ Rx(-.4)), clay2)
@asset('lectern')
def _(a):
    w = a.m('wood', WOODD); w2 = a.m('wood2', WOOD); pg = a.m('page', '#d9cdb0', .2); br = a.m('brass', '#b08d3c', .2); ink = a.m('ink', '#3a3028')
    a.add(box(.5, .45, .08, (0, 0, .04)), w); a.add(box(.14, .14, .95, (0, 0, .5)), w)
    T = Tr(0, 0, 1.05) @ Rx(.35); a.add(box(.62, .48, .05, (0, 0, 0), T=T), w2)
    for s in (-1, 1):
        a.add(box(.26, .4, .03, (s*.14, 0, .04), T=T @ Ry(s*.06)), pg)
        for k in range(5): a.add(box(.18, .012, .003, (s*.14, -.13+k*.06, .058), T=T @ Ry(s*.06)), ink)
    S_ = Tr(.42, -.05, 1.0)
    a.add(tube([V((cos(t)*.16, 0, sin(t)*.16)) for t in [pi*.15+k/8*pi*.7 for k in range(9)]], .01, 4, False, False, T=S_), br)
    a.add(tube([(0, 0, 0), (cos(pi*.3)*.16, 0, sin(pi*.3)*.16)], .008, 3, T=S_), br); a.add(tube([(0, 0, 0), (cos(pi*.7)*.16, 0, sin(pi*.7)*.16)], .008, 3, T=S_), br)
    a.add(cyl(.02, .02, .06, 6, T=S_ @ Tr(0, 0, -.03)), br)
@asset('idol_shelf')
def _(a):
    st = a.m('stone', '#6f7775'); st2 = a.m('stone2', '#5a605e'); jade = a.m('jade', '#5c8a6a', .25); jade2 = a.m('jade2', '#4a7058', .2); bone = a.m('bone', '#b9b09a')
    a.add(box(2.8, .6, .9, (0, 0, .45)), st); a.add(box(2.95, .7, .1, (0, 0, .95)), st2)
    xs = [-1, -.33, .33, 1]
    # sleeper (spiral), star, moon, eye — the four idols of the puzzle
    for i, x in enumerate(xs):
        a.add(cyl(.12, .14, .08, 6, at=(x, 0, 1.0)), st2); a.add(lathe([(.11, 1.08), (.09, 1.3), (.06, 1.42)], 6, T=Tr(x, 0, 0)), jade2)
        if i == 0: a.add(tube([V((x+cos(t)*.012*t, -.02, 1.48+sin(t)*.012*t)) for t in [k*.5 for k in range(16)]], .022, 4), jade)
        elif i == 1:
            pts = [V((x+cos(pi/2+k*pi/5)*(.12 if k % 2 == 0 else .05), 0, 1.52+sin(pi/2+k*pi/5)*(.12 if k % 2 == 0 else .05))) for k in range(10)]
            bm = poly_extrude([(p.x-x, p.z-1.52) for p in pts], .05, T=Tr(x, 0, 1.52)); a.add(bm, jade)
        elif i == 2:
            a.add(tube([V((x+cos(t)*.1, 0, 1.52+sin(t)*.1)) for t in [pi*.35+k/8*pi*1.3 for k in range(9)]], [.02+.02*sin(k/8*pi) for k in range(9)], 5), jade)
        else:
            a.add(sph(.1, .05, .065, (x, 0, 1.52), 8, 5), jade); a.add(sph(.035, .02, .035, (x, -.045, 1.52), 6, 4), bone)
    for i in range(3): a.add(tube([(-1.35+i*.08, -.25, .99), (-1.25+i*.08, -.05, .99)], .006, 3), bone)
@asset('safe')
def _(a):
    ir = a.m('iron', '#3a4448'); ir2 = a.m('iron2', '#2a3236'); br = a.m('brass', '#b08d3c', .3); w = a.m('wood', WOODD); w2 = a.m('wood2', '#5a4430')
    a.add(box(.56, .56, .8, (0, 0, .4)), ir); a.add(box(.48, .03, .7, (0, -.29, .42)), ir2)
    a.add(cyl(.1, .1, .04, 12, T=Tr(0, -.31, .5) @ Rx(pi/2)), br); a.add(box(.05, .04, .18, (.15, -.32, .42)), br)
    for z in (.15, .7): a.add(box(.06, .05, .08, (-.26, -.3, z)), ir2)
    a.add(box(.9, .1, 1.95, (-1.3, .25, .97)), w)
    plank_box(a, 1.4, .5, .05, (.0, .6, .9), [w, w2], 4, 'x')
    for s in (-1, 1): a.add(box(.06, .45, .9, (s*.67, .6, .45)), w2)
@asset('mailbox')
def _(a):
    p = a.m('post', '#2a2e2e'); bx_ = a.m('box', '#7a3a30'); fl = a.m('flag', '#b03a2a')
    a.add(box(.1, .1, 1.1, (0, 0, .55)), p); a.add(box(.32, .5, .2, (0, 0, 1.2)), bx_)
    a.add(cyl(.16, .16, .5, 8, T=Tr(0, .25, 1.3) @ Rx(pi/2)), bx_); a.add(box(.02, .04, .2, (.18, .1, 1.35)), p); a.add(box(.02, .12, .07, (.18, .14, 1.42)), fl)
@asset('noticeboard')
def _(a):
    w = a.m('wood', WOODD); cork = a.m('board', WOOD); pp = a.m('paper', '#e8dfc4', .3); pp2 = a.m('paper2', '#d8cfa4', .25); ink = a.m('ink', '#3a3028'); rf = a.m('roof', '#3a3a36')
    for s in (-1, 1): a.add(box(.1, .1, 2.1, (s*.82, 0, 1.05)), w)
    a.add(box(1.7, .07, 1.0, (0, 0, 1.25)), cork); a.add(box(1.9, .5, .06, (0, 0, 1.98), T=Tr(0, 0, 0)), rf)
    for (x, z, sw, sh, m_) in ((-.45, 1.35, .4, .5, pp), (.15, 1.45, .32, .3, pp2), (.5, 1.15, .36, .4, pp), (-.1, 1.0, .3, .25, pp2)):
        a.add(box(sw, .02, sh, (x, -.05, z), T=Tr(x, 0, z) @ Ry(R.uniform(-.08, .08)) @ Tr(-x, 0, -z)), m_)
        for k in range(3): a.add(box(sw*.7, .01, .015, (x, -.065, z+sh*.25-k*sh*.2)), ink)
@asset('idol')
def _(a):
    st = a.m('jade', '#5c9a72', .45); st2 = a.m('jade2', '#3f7356', .35); dk = a.m('glyph', '#2a4a38', .2)
    a.add(box(.2, .18, .12, (0, 0, .06)), st2)
    for k in range(4): a.add(box(.03, .005, .05, (-.06+k*.04, -.091, .06)), dk)
    a.add(sph(.08, .065, .09, (0, 0, .21), 8, 5), st); a.add(sph(.065, .07, .075, (0, -.01, .33), 8, 5), st)
    for k in range(5): a.add(tube([(-.04+k*.02, -.06, .3), (-.045+k*.022, -.07, .24), (-.04+k*.02, -.06, .2)], .008, 3), st2)
    for s in (-1, 1):
        a.add(tri_fan([V((s*.05, .04, .3)), V((s*.16, .07, .42)), V((s*.15, .08, .2)), V((s*.07, .05, .16))]), st2); a.add(tri_fan([V((s*.05, .04, .3)), V((s*.07, .05, .16)), V((s*.15, .08, .2)), V((s*.16, .07, .42))]), st2)
        a.add(sph(.03, .04, .05, (s*.07, -.03, .14), 5, 3), st)
@asset('wreck')
def _(a):
    m = (a.m('hull', '#4a4038'), a.m('hull2', '#3a322c'), a.m('inner', '#2e2822'), a.m('trim', '#2a2420')); hull(a, 4.4, 2.2, 1.1, m, 7)
    for v in a.bm.verts:
        if v.co.y > .6: v.co.z -= (v.co.y-.6)*.9
    xform(a.bm, Ry(.45) @ Tr(0, 0, -.25)); w = a.m('mast', '#4a3a2c'); nm = a.m('name', '#c9c2b0', .25)
    a.add(cyl(.09, .06, 3.8, 6, T=Tr(.2, -.3, .3) @ Ry(.9)), w)
    t = text_mesh('ALERT', .26, .01); xform(t, Tr(0, -2.25, .62)); xform(t, Ry(.45)); a.add(t, nm)
PROPS = ['crate_a', 'crate_b', 'barrel', 'boat_a', 'boat_b', 'fence', 'lamp', 'grave_a', 'grave_b', 'grave_c', 'grave_d', 'obelisk', 'well', 'netrack', 'ropecoil', 'trap', 'buoy', 'anchor', 'cart', 'bench', 'seawall', 'pier', 'altar', 'brazier', 'motel_sign', 'door',
         'counter', 'keyboard', 'bell', 'ledger', 'table_lamp', 'bed', 'nightstand', 'book', 'candle', 'wardrobe', 'armchair', 'chair', 'rug', 'sculptor_table', 'lectern', 'idol_shelf', 'safe', 'mailbox', 'noticeboard', 'idol', 'wreck']

# ================================================================ BUILDINGS
HOUSES = [[-25.2, -27, -8, -12.6, {'kind': 'pub', 'wall': '#6b5f52', 'roof': '#3a3230', 'h': 3.6, 'rh': 2.6, 'lit': 1, 'door': -13.2}],
          [-5, -23, 6, -13, {'wall': '#8f8468', 'roof': '#4b3a36', 'lit': 1}], [-24, -3, -14, 6, {}], [-8, -3, 3, 5, {}], [16, -3, 27, 5, {}], [-8, 12, 3, 20, {}], [16, 12, 27, 20, {}], [-24, 12, -14, 18, {}],
          [-24, 24, -9, 36, {'wall': '#5d5346', 'roof': '#35302c', 'h': 4, 'rh': 2.6, 'lit': 0, 'noCh': 1}], [18, 24, 28, 31, {}], [15, 34, 21, 39, {'wall': '#6f6a5a', 'roof': '#3a4450', 'h': 2.8, 'rh': 1.6, 'lit': 0, 'noCh': 1}],
          # --- the western district (market street, Holmovaya street, the school, the church, the port)
          [-134, -24, -123, -13, {'kind': 'bakery', 'wall': '#8a7a62', 'roof': '#54463a', 'lit': 1}], [-122, -25, -113, -14, {}],
          [-118, -44, -102, -35, {'kind': 'doctor', 'wall': '#7a7f78', 'roof': '#2f3a3c', 'h': 5.8, 'rh': 2.6, 'lit': 1, 'door': -110}], [-106.5, -26, -98, -14, {}],
          [-94, -32, -80, -12, {'kind': 'church', 'wall': '#c9c4b4', 'roof': '#3a4450', 'h': 5, 'rh': 3.4, 'lit': 1, 'noCh': 1, 'door': -87}],
          [-78, -22, -67, -12, {'kind': 'shop', 'wall': '#7d8a86', 'lit': 1}], [-136, -3, -118, 8, {'kind': 'school', 'wall': '#8a5a48', 'roof': '#3f4a48', 'lit': 1, 'noCh': 1, 'door': -127}],
          [-114, -3, -104, 6, {}], [-60, -2, -48, 7, {'kind': 'post', 'wall': '#75807a', 'lit': 1}], [-62, 12, -51, 20, {}], [-45, 12, -35, 20, {}],
          [-128, 22, -104, 36, {'kind': 'cannery', 'wall': '#6a5248', 'roof': '#3a3a36', 'h': 5.5, 'rh': 2.2, 'lit': .6, 'noCh': 1, 'door': -116}],
          [-96, 26, -84, 37, {'kind': 'boathouse', 'wall': '#5d5346', 'roof': '#35302c', 'h': 4, 'rh': 2.4, 'lit': 0, 'noCh': 1}], [-77, 24, -67, 33, {}], [-58, 24, -47, 32, {}], [-77, -3, -67, 6, {}]]
WALLS = ['#8a8271', '#7d8a86', '#93856a', '#75807a']; ROOFS = ['#4b3a36', '#3a4450', '#54463a', '#3f4a48']
def slope_rows(a, axis, half, length, h, rh, ov, mats, under, rr, holes=.05, lod=1.0):
    """shingled gable roof. axis='x': ridge along X (slopes face ±Y)."""
    run = half+ov; L = sqrt(run*run + (rh+ov*rh/half)**2); ang = atan2(rh, half)
    for side in (-1, 1):
        if axis == 'x': base = Tr(0, 0, h+rh) @ (Rz(pi) if side > 0 else M.Identity(4)) @ Rx(ang)
        else: base = Tr(0, 0, h+rh) @ Rz(pi/2) @ (Rz(pi) if side > 0 else M.Identity(4)) @ Rx(ang)
        a.add(box(length+.6, L+.05, .08, (0, -L/2, -.05), T=base), under)
        rows = int(L/(.34*lod))+1
        for j in range(rows):
            y = -(j+.5)*L/rows; x = -(length+.6)/2
            while x < (length+.6)/2:
                sl = rr.uniform(1.3, 3.0)*lod; sl = min(sl, (length+.6)/2-x)
                if rr.random() > holes:
                    b = box(sl-.03, L/rows+.06, .06, (x+sl/2, y-.03, .02+rr.uniform(0, .015)), T=base)
                    a.add(b, mats[rr.randint(0, len(mats)-1)])
                x += sl
    return ang
def window(a, x, y, z, nrm, lit, rr, trim, wood, glass_l, glass_u, shut, boarded=False):
    """window on a wall whose outward normal is nrm ('-y','+y','-x','+x'); (x,y,z) = centre on the wall surface"""
    rot = {'-y': M.Identity(4), '+y': Rz(pi), '-x': Rz(-pi/2), '+x': Rz(pi/2)}[nrm]; T = Tr(x, y, z) @ rot
    a.add(box(1.1, .1, 1.12, (0, -.02, 0), T=T), trim); a.add(box(.86, .1, .9, (0, -.05, 0), T=T), glass_l if lit else glass_u)
    a.add(box(.06, .12, .9, (0, -.08, 0), T=T), trim); a.add(box(.86, .12, .06, (0, -.08, .05), T=T), trim); a.add(box(1.3, .2, .08, (0, -.08, -.6), T=T), trim)
    if boarded:
        for k in range(3): a.add(box(1.25, .05, .14, (0, -.13, -.3+k*.3), T=T @ Ry(rr.uniform(-.25, .25))), wood)
    for s in (-1, 1):
        r_ = rr.random()
        if r_ < .15: continue
        op = rr.uniform(.05, .5) if r_ < .8 else 1.2
        a.add(box(.45, .05, 1.08, (.225*s, 0, 0), T=T @ Tr(s*.56, -.07, 0) @ Rz(-s*op) @ (Ry(.25*s) if r_ > .93 else M.Identity(4))), shut)
def house_build(a, w, d, h=3.2, rh=2.2, wall=None, roof=None, lit=.4, noCh=False, door_dx=0, seed=0, lod=1.0):
    rr = random.Random(seed*31+7); wall = wall or WALLS[rr.randint(0, 3)]; roof = roof or ROOFS[rr.randint(0, 3)]
    wm = a.m('wall', wall); wm2 = a.m('wall2', mix(wall, '#000000', .14)); wm3 = a.m('wall3', mix(wall, '#d8d0b8', .1)); core = a.m('core', mix(wall, '#000000', .4))
    trim = a.m('trim', mix(wall, '#c9c2b0', .45)); wood = a.m('wood', WOODD); stn = a.m('stone', '#6f7775'); stn2 = a.m('stone2', '#5a6260')
    r1 = a.m('roof', roof); r2 = a.m('roof2', mix(roof, '#000000', .18)); r3 = a.m('roof3', mix(roof, '#8a8a7a', .15)); und = a.m('under', '#1c1816')
    gl = a.m('lit', '#e2a94a', .95); gu = a.m('unlit', '#1b2b30'); shut = a.m('shutter', rr.choice(['#3f4a3c', '#4a3a30', '#3a4250', '#5a4a3a'])); dr = a.m('door', '#3e2c1e'); br = a.m('brass', BRASS); brick = a.m('brick', '#6a4a3e'); brick2 = a.m('brick2', '#58402f')
    a.add(box(w-.1, d-.1, h, (0, 0, h/2)), core)
    # foundation stones
    for (x0, y0, x1, y1) in ((-w/2, -d/2, w/2, -d/2), (-w/2, d/2, w/2, d/2), (-w/2, -d/2, -w/2, d/2), (w/2, -d/2, w/2, d/2)):
        L = hypot(x1-x0, y1-y0); t = 0
        while t < L:
            sl = min(rr.uniform(.5, 1.1), L-t); cx = x0+(x1-x0)*(t+sl/2)/L; cy = y0+(y1-y0)*(t+sl/2)/L
            b = box(sl-.03 if x0 != x1 else .26, sl-.03 if y0 != y1 else .26, .45, (cx, cy, .225)); jitter(b, .02, int(t*31+cx*7)); a.add(b, stn if rr.random() < .6 else stn2); t += sl
    ridge_x = w >= d
    # clapboard walls (gables carry boards up to the ridge)
    bh = .3; nb = int((h-.45)/bh)+int(rh/bh)+1
    for side in ('-y', '+y', '-x', '+x'):
        along_x = side in ('-y', '+y'); span = w if along_x else d; off = (d/2 if along_x else w/2)+.03
        gable = (not along_x) if ridge_x else along_x
        for k in range(nb):
            z = .45+bh*k+bh/2
            if z > h:
                if not gable: break
                frac = 1-(z-h)/rh
                if frac <= .05: break
                L = span*frac
            else: L = span
            mat = [wm, wm, wm2, wm3][rr.randint(0, 3)]
            if along_x: b = box(L, .05, bh+.02, (0, 0, 0), T=Tr(0, (-off if side == '-y' else off), z) @ Rx(.07 if side == '-y' else -.07))
            else: b = box(.05, L, bh+.02, (0, 0, 0), T=Tr((-off if side == '-x' else off), 0, z) @ Ry(-.07 if side == '-x' else .07))
            a.add(b, mat)
    for sx in (-1, 1):
        for sy in (-1, 1): a.add(box(.16, .16, h-.45, (sx*(w/2+.02), sy*(d/2+.02), .45+(h-.45)/2)), trim)
    # roof
    ov = .45
    length = (w if ridge_x else d)+.5; half = (d if ridge_x else w)/2
    ang = slope_rows(a, 'x' if ridge_x else 'y', half, length, h, rh, ov, [r1, r1, r2, r3], und, rr, lod=lod)
    a.add(box(length+.7, .26, .2, (0, 0, h+rh+.04), T=Rz(0) if ridge_x else Rz(pi/2)), r2)
    # door, porch roof, steps
    dx = door_dx; fy = -d/2-.05
    a.add(box(1.3, .14, 2.25, (dx, fy, 1.125+.45*0)), trim); a.add(box(1.0, .12, 1.95, (dx, fy-.04, .98)), dr)
    for k in range(4): a.add(box(.02, .14, 1.9, (dx-.36+k*.24, fy-.06, .98)), wood)
    a.add(sph(.045, at=(dx+.36, fy-.12, 1.0), seg=5, rings=3), br)
    a.add(box(1.7, .9, .08, (dx, fy-.4, 2.45), T=Tr(dx, fy-.4, 2.45) @ Rx(.25) @ Tr(-dx, -(fy-.4), -2.45)), r2)
    for s in (-1, 1): a.add(tube([(dx+s*.75, fy-.02, 2.0), (dx+s*.75, fy-.75, 2.32)], .04, 4), wood)
    a.add(box(1.5, .6, .18, (dx, fy-.35, .09)), stn); a.add(box(1.3, .35, .16, (dx, fy-.25, .26)), stn2)
    # windows
    wins = []
    for wx in (-w/2+1.5, w/2-1.5):
        if abs(wx-dx) > 1.3: wins.append((wx, -d/2-.06, '-y'))
    for wx in ((-w/2+1.6, w/2-1.6) if w > 5 else (0,)): wins.append((wx, d/2+.06, '+y'))
    for wy in ((-d/2+1.8, d/2-1.8) if d > 6.5 else (0,)): wins.append((-w/2-.06, wy, '-x')); wins.append((w/2+.06, wy, '+x'))
    for (x, y, n) in wins:
        window(a, x, y, 1.85, n, rr.random() < (lit if n == '-y' else lit*.5), rr, trim, wood, gl, gu, shut, boarded=(n == '+y' and rr.random() < .45))
    # chimney
    if not noCh:
        cx, cy = -w/2+1.2, .5; zb = h+rh*(1-abs(cy if ridge_x else cx)/half)-.6
        for k in range(int((h+rh+1.0-zb)/.16)):
            a.add(box(.72, .72, .15, (cx, cy, zb+k*.16+.08)), brick if k % 2 else brick2)
        a.add(box(.86, .86, .1, (cx, cy, h+rh+1.05)), stn2); a.add(box(.5, .5, .06, (cx, cy, h+rh+1.12)), und)
    # drainpipe, lantern
    a.add(tube([(w/2+.12, -d/2-.12, h-.05), (w/2+.12, -d/2-.12, .1), (w/2+.3, -d/2-.3, .05)], .05, 5), a.m('pipe', '#3a3e3e'))
    if lit >= 1: a.add(box(.18, .18, .26, (dx+.9, fy-.15, 2.0)), a.m('lamp', '#f6cf70', 1.0))
def wall_windows(a, w, d, dx, z, rr, lit, step=3.2, sides=('-y', '+y'), skip=1.4, boarded=0):
    """extra rows of windows for long walls and upper floors"""
    m = lambda n: a.m(n, '#000000')
    for side in sides:
        along = side in ('-y', '+y'); span = w if along else d; n = int((span-2.4)//step)
        for k in range(n+1):
            t = -span/2+1.2+(span-2.4)*(k/max(n, 1) if n else .5)
            if side == '-y' and z < 3 and abs(t-dx) < skip: continue
            x, y = (t, (-d/2-.06 if side == '-y' else d/2+.06)) if along else ((-w/2-.06 if side == '-x' else w/2+.06), t)
            window(a, x, y, z, side, rr.random() < lit, rr, m('trim'), m('wood'), m('lit'), m('unlit'), m('shutter'), boarded=rr.random() < boarded)
def awning(a, x, y, w, z, depth, cols):
    """striped cloth awning sloping out over a shop front (front = -y)"""
    n = max(2, int(w/.5)); sw = w/n
    for k in range(n): a.add(box(sw, depth, .04, (x-w/2+sw*(k+.5), y-depth/2, z), T=Tr(x-w/2+sw*(k+.5), y, z) @ Rx(-.35) @ Tr(-(x-w/2+sw*(k+.5)), -y, -z)), cols[k % 2])
    for k in range(n): a.add(box(sw, .03, .22, (x-w/2+sw*(k+.5), y-depth*.95, z-depth*.34-.1)), cols[k % 2])
def signboard(a, x, y, z, w, h, col, ink):
    a.add(box(w+.12, .08, h+.12, (x, y, z)), a.m('wood', WOODD)); a.add(box(w, .1, h, (x, y-.02, z)), a.m('sign', col))
    for k in range(int(w/.32)): a.add(box(.18, .11, h*.42, (x-w/2+.25+k*.32, y-.03, z+(.06 if k % 2 else -.04))), a.m('ink', ink))
def house_extra(a, kind, w, d, h, rh, dx, rr):
    if not kind: return
    m = lambda n: a.m(n, '#000000'); fy = -d/2-.05; wood = m('wood'); trim = m('trim'); dr = m('door'); stn = m('stone'); und = m('under')
    if kind == 'pub':
        wall_windows(a, w, d, dx, 1.85, rr, .9, sides=('-y',), skip=2.6)
        by = .7; a.add(box(.14, 1.3, 2.25, (w/2+.05, by, 1.125)), trim); a.add(box(.12, 1.0, 1.95, (w/2+.09, by, .98)), dr); a.add(box(.6, 1.5, .12, (w/2+.3, by, .06)), stn)   # back door: east wall, into the alley
        for s_ in (-1, 1): a.add(box(.2, .2, .3, (dx+s_*1.0, fy-.15, 2.2)), a.m('lamp', '#f6cf70', 1.0))
    elif kind in ('bakery', 'shop'):
        cols = [a.m('awn1', '#7a2a24' if kind == 'bakery' else '#2f4a5a'), a.m('awn2', '#d8cfb0')]
        for x in (-w/2+1.5, w/2-1.5):
            if abs(x-dx) > 1.3: awning(a, x, fy-.05, 2.2, 2.75, 1.1, cols)
        signboard(a, dx, fy-.12, 3.0 if h > 3 else 2.85, 2.6, .55, '#2a2620', '#d9b85a')
    elif kind == 'post':
        signboard(a, dx, fy-.12, 2.85, 2.2, .45, '#2a3a4a', '#e8dfc4'); wall_windows(a, w, d, dx, 1.85, rr, .6, sides=('-y',), skip=2.4)
    elif kind == 'school':
        wall_windows(a, w, d, dx, 1.85, rr, .5, step=2.6, sides=('-y', '+y'), skip=1.6); signboard(a, dx, fy-.12, 2.9, 3.2, .5, '#e8dfc4', '#2a2016')
        bx, by, bz = 0, 0, h+rh-.4
        a.add(box(1.3, 1.3, 1.4, (bx, by, bz+.7)), m('wall')); a.add(lathe([(1.0, bz+1.4), (0, bz+2.6)], 4, T=Tr(bx, by, 0) @ Rz(pi/4)), m('roof'))
        for (ox, oy) in ((0, -.66), (0, .66), (-.66, 0), (.66, 0)): a.add(box(.7 if oy else .1, .1 if oy else .7, .7, (bx+ox, by+oy, bz+.85)), und)
        a.add(lathe([(.16, bz+.55), (.24, bz+.95), (.05, bz+1.15)], 8), a.m('brass', BRASS))
    elif kind == 'church':
        st2 = a.m('stone2', '#5a6260'); gl = a.m('glow', '#f0c27a', .85); fr = a.m('frame', '#3a3a36')
        for sx in (-1, 1):
            for y in [-d/2+3+k*3.2 for k in range(int((d-5)//3.2)+1)]:
                a.add(poly_extrude(arch_poly(1.0, 2.6), .18, T=Tr(sx*(w/2+.04), y, 1.2) @ Rz(pi/2)), gl)
                a.add(poly_extrude(arch_poly(1.3, 2.95), .16, T=Tr(sx*(w/2+.01), y, 1.05) @ Rz(pi/2)), fr)
        tx, ty, top = dx, -d/2+1.3, h+rh+1.4
        a.add(box(3.0, 3.0, top, (tx, ty, top/2)), m('wall')); a.add(box(3.1, 3.1, .2, (tx, ty, top)), trim)
        for (ox, oy) in ((-1.3, -1.3), (1.3, -1.3), (-1.3, 1.3), (1.3, 1.3)): a.add(box(.32, .32, 2.2, (tx+ox, ty+oy, top+1.1)), trim)
        a.add(box(2.4, 2.4, 2.1, (tx, ty, top+1.05)), und); a.add(lathe([(.45, top+.4), (.55, top+1.2), (.12, top+1.6)], 8, T=Tr(tx, ty, 0)), a.m('brass', BRASS))
        a.add(box(3.3, 3.3, .2, (tx, ty, top+2.25)), trim); a.add(lathe([(2.2, top+2.3), (0, top+7.5)], 4, T=Tr(tx, ty, 0) @ Rz(pi/4)), m('roof'))
        a.add(box(.1, .1, 1.2, (tx, ty, top+8.0)), a.m('iron', IRON)); a.add(box(.6, .1, .1, (tx, ty, top+8.25)), a.m('iron', IRON))
        a.add(poly_extrude(arch_poly(2.0, 3.0), .3, T=Tr(tx, ty-1.55, 0)), fr); a.add(poly_extrude(arch_poly(1.6, 2.7), .3, T=Tr(tx, ty-1.62, 0)), dr)
        a.add(poly_extrude(arch_poly(.9, 1.5), .2, T=Tr(tx, ty-1.55, top-2.6)), gl)
        for k in range(3): a.add(box(3.4-k*.4, .5, .16, (tx, ty-1.6-.5*(2-k), .08+k*.16)), stn)
    elif kind == 'doctor':
        wall_windows(a, w, d, dx, 4.3, rr, .55, step=2.8, sides=('-y', '+y', '-x', '+x'), skip=-1)
        wall_windows(a, w, d, dx, 1.85, rr, .7, step=2.8, sides=('-y',), skip=2.2)
        for s_ in (-1, 1): a.add(box(.22, .22, 2.9, (dx+s_*1.5, fy-1.6, 1.45+.45)), trim)
        a.add(box(3.6, 2.0, .14, (dx, fy-.9, 3.4)), m('roof2')); a.add(box(3.7, 2.1, .1, (dx, fy-.9, 3.3)), trim)
        a.add(box(3.2, 1.8, .3, (dx, fy-.9, .15)), stn); a.add(box(3.2, .4, .45, (dx, fy-1.95, .22)), stn)
        a.add(box(.22, .22, .32, (dx+1.0, fy-.15, 2.25)), a.m('lamp', '#f6cf70', 1.0))
    elif kind == 'cannery':
        brick = a.m('brick', '#6a4a3e'); brick2 = a.m('brick2', '#58402f')
        wall_windows(a, w, d, dx, 1.9, rr, .5, step=3.0, sides=('-y', '+y', '-x', '+x'), skip=3.2, boarded=.25); wall_windows(a, w, d, dx, 4.1, rr, .35, step=3.0, sides=('-y', '+y'), skip=-1, boarded=.3)
        a.add(box(4.2, .2, 3.6, (dx, fy-.02, 1.8)), und); a.add(box(4.6, .24, .3, (dx, fy-.05, 3.75)), trim)
        for k in range(6): a.add(box(.06, .22, 3.5, (dx-1.9+k*.76, fy-.08, 1.8)), wood)
        cx_, cy_ = w/2-2.2, d/2-2.0
        for k in range(int(13/.52)): a.add(cyl(.95-k*.006, .95-k*.006, .52, 8, at=(cx_, cy_, k*.52)), brick if k % 2 else brick2)
        a.add(cyl(1.1, 1.1, .3, 10, at=(cx_, cy_, 13)), stn); signboard(a, dx, fy-.12, 4.5, 6, .7, '#2a2620', '#c9b98a')
    elif kind == 'boathouse':
        a.add(box(5.4, .22, 3.3, (0, fy-.02, 1.65)), und); a.add(box(5.8, .26, .3, (0, fy-.05, 3.4)), trim)
        for s_ in (-1, 1): a.add(box(.3, .3, 3.4, (s_*2.85, fy-.08, 1.7)), wood)
        for k in range(7): a.add(box(5.2, .3, .08, (0, fy-.6-k*.32, .04-k*.05)), wood)
for i, (x0, z0, x1, z1, o) in enumerate(HOUSES):
    def mk(i=i, x0=x0, z0=z0, x1=x1, z1=z1, o=o):
        def f(a):
            dx = o.get('door', (x0+x1)/2)-(x0+x1)/2
            house_build(a, x1-x0, z1-z0, o.get('h', 3.2), o.get('rh', 2.2), o.get('wall'), o.get('roof'), o.get('lit', .4), o.get('noCh', 0), dx, i, lod=1.0 if i < 11 else 1.7)
            house_extra(a, o.get('kind'), x1-x0, z1-z0, o.get('h', 3.2), o.get('rh', 2.2), dx, random.Random(i*13+5))
        return f
    BUILDERS['house_%d' % i] = (mk(), {})
def stone_wall(a, x0, y0, x1, y1, z0, z1, mats, rr, row=.42, depth=.5):
    L = hypot(x1-x0, y1-y0); ang = atan2(y1-y0, x1-x0); z = z0; k = 0
    while z < z1-.05:
        hh = min(row, z1-z); t = -(rr.uniform(0, .5) if k % 2 else 0)
        while t < L:
            sl = rr.uniform(.6, 1.3); s0 = max(t, 0); s1 = min(t+sl, L)
            if s1-s0 > .08:
                c = (s0+s1)/2; b = box(s1-s0-.04, depth, hh-.03, (0, 0, 0)); jitter(b, .02, int(z*100+t*10))
                xform(b, Rz(ang)); xform(b, Tr(x0+cos(ang)*c, y0+sin(ang)*c, z+hh/2)); a.add(b, mats[rr.randint(0, len(mats)-1)])
            t += sl
        z += hh; k += 1
def arch_poly(w, h, n=6):
    r = w/2; return [(-r, 0), (r, 0), (r, h-r*1.2)] + [(r - r*(1-cos(t*pi/2))*1.0, h-r*1.2+sin(t*pi/2)*r*1.2) for t in [k/n for k in range(1, n)]] + [(0, h)] + [(-r + r*(1-cos(t*pi/2)), h-r*1.2+sin(t*pi/2)*r*1.2) for t in [k/n for k in range(n-1, 0, -1)]] + [(-r, h-r*1.2)]
@asset('chapel')
def _(a):
    rr = random.Random(41); st = a.m('stone', '#6c7472'); st2 = a.m('stone2', '#5c6462'); st3 = a.m('stone3', '#7a807c'); core = a.m('core', '#2a3030'); gl = a.m('glow', '#57c79a', .85); fr = a.m('frame', '#3a4240')
    r1 = a.m('slate', '#2f3a3c'); r2 = a.m('slate2', '#263032'); r3 = a.m('slate3', '#3a4648'); und = a.m('under', '#141818'); dr = a.m('door', '#3a2a1e'); ir = a.m('iron', IRON); br = a.m('brass', '#b08d3c', .35)
    W_, D_, H_ = 12, 15, 4.6
    a.add(box(W_-.2, D_-.2, H_, (0, 0, H_/2)), core)
    for (x0, y0, x1, y1) in ((-6, -7.5, 6, -7.5), (6, 7.5, -6, 7.5), (-6, 7.5, -6, -7.5), (6, -7.5, 6, 7.5)): stone_wall(a, x0, y0, x1, y1, 0, H_, [st, st, st2, st3], rr)
    # gables (front/back) in stone rows
    for sy in (-1, 1):
        z = H_; k = 0
        while z < H_+3.6:
            hh = .42; half = 6*(1-(z+hh/2-H_)/3.6)
            if half < .2: break
            stone_wall(a, -half, sy*7.5, half, sy*7.5, z, z+hh, [st, st2, st3], rr); z += hh
    slope_rows(a, 'y', 6, 15.4, H_, 3.6, .5, [r1, r1, r2, r3], und, rr, holes=.02)
    a.add(box(.3, 16.2, .24, (0, 0, H_+3.64)), r2)
    # buttresses + lancet windows
    for sx in (-1, 1):
        for y in (-4.5, 0, 4.5): a.add(box(.7, .8, 3.2, (sx*6.3, y, 1.6)), st2); a.add(box(.5, .7, 1.2, (sx*6.2, y, 3.6)), st2)
        for y in (-2.25, 2.25, 6.3):
            wp = poly_extrude(arch_poly(1.0, 2.4), .2, T=Tr(sx*6.33, y, 1.3) @ Rz(pi/2)); a.add(wp, gl)
            a.add(poly_extrude(arch_poly(1.3, 2.75), .2, T=Tr(sx*6.27, y, 1.15) @ Rz(pi/2)), fr)
    # front: door arch, puzzle lock, rose window, steps
    a.add(poly_extrude(arch_poly(2.4, 3.4), .35, T=Tr(0, -7.62, 0)), fr); a.add(poly_extrude(arch_poly(2.0, 3.0), .3, T=Tr(0, -7.7, 0)), dr)
    for z in (.6, 1.5, 2.3): a.add(box(1.9, .05, .1, (0, -7.88, z)), ir)
    a.add(box(.04, .06, 2.9, (0, -7.88, 1.45)), ir)
    for k, r_ in enumerate((.34, .24, .14)): a.add(cyl(r_, r_, .05+.02*k, 16, T=Tr(0, -7.9-.02*k, 1.05) @ Rx(pi/2)), br)
    a.add(cyl(.9, .9, .2, 12, T=Tr(0, -7.62, 5.6) @ Rx(pi/2)), fr); a.add(cyl(.72, .72, .22, 12, T=Tr(0, -7.66, 5.6) @ Rx(pi/2)), gl)
    for k in range(6): a.add(box(.06, .06, 1.44, (0, -7.8, 5.6), T=Tr(0, -7.8, 5.6) @ Ry(k*pi/6) @ Tr(0, 7.8, -5.6)), fr)
    for k in range(3): a.add(box(3.4-k*.4, .5, .16, (0, -8.0-.5*(2-k)+.5, .08+k*.16)), st2)
    # bell tower (front-left) with spire
    tx, ty = -4, -5.5
    for (x0, y0, x1, y1) in ((tx-1.7, ty-1.7, tx+1.7, ty-1.7), (tx+1.7, ty+1.7, tx-1.7, ty+1.7), (tx-1.7, ty+1.7, tx-1.7, ty-1.7), (tx+1.7, ty-1.7, tx+1.7, ty+1.7)): stone_wall(a, x0, y0, x1, y1, 0, 8.5, [st, st2, st3], rr, depth=.4)
    a.add(box(3.2, 3.2, 8.4, (tx, ty, 4.2)), core)
    for (dx_, dy_, rz) in ((0, -1.72, 0), (0, 1.72, pi), (-1.72, 0, -pi/2), (1.72, 0, pi/2)):
        a.add(poly_extrude(arch_poly(1.0, 1.6), .2, T=Tr(tx+dx_, ty+dy_, 6.3) @ Rz(rz)), gl if dy_ < 0 else und)
    a.add(box(3.7, 3.7, .3, (tx, ty, 8.6)), st2)
    a.add(lathe([(2.4, 8.7), (0, 12.9)], 4, T=Tr(tx, ty, 0) @ Rz(pi/4)), lambda f: r1 if f.index % 2 else r2)
    a.add(tube([(tx, ty, 12.8), (tx, ty, 13.9)], .05, 4), ir)
    for s in (-1, 1): a.add(tube([(tx, ty, 13.5), (tx+s*.25, ty, 13.65), (tx+s*.3, ty, 13.95), (tx+s*.15, ty, 14.1)], [.04, .035, .025, .01], 4), ir)
@asset('lighthouse')
def _(a):
    wh = a.m('white', '#b9b4a4'); wh2 = a.m('white2', '#a8a394'); rd = a.m('red', '#8c3a32'); rd2 = a.m('red2', '#7a302a'); st = a.m('stone', '#5a605e'); st2 = a.m('stone2', '#4c5250'); ir = a.m('iron', '#1e2224')
    gl = a.m('glass', '#f3e6a0', 1.0); win = a.m('win', '#1b2b30'); dr = a.m('door', '#3e2c1e'); rr = random.Random(51)
    for k in range(10):
        ang = k/10*2*pi; b = box(2.2, 1.0, .6, (0, 0, 0)); jitter(b, .03, k); xform(b, Rz(ang+pi/2)); xform(b, Tr(cos(ang)*2.8, sin(ang)*2.8, .3)); a.add(b, st if k % 2 else st2)
    a.add(cyl(3.0, 3.0, .6, 10), st2)
    prof = [(2.85, .6), (2.6, 4), (2.4, 7), (2.2, 10), (2.0, 13)]
    a.add(lathe(prof, 16, cap0=False), lambda f: (rd if f.index % 3 else rd2) if 5 < f.calc_center_median().z < 9 else (wh if f.index % 3 else wh2))
    for (z, ang) in ((3.5, 0), (6.5, 2.2), (9.5, 4.1), (11.5, 1.0)):
        r_ = 2.85-(z-.6)*.065; a.add(box(.5, .3, .8, (0, 0, 0), T=Tr(cos(ang)*r_, sin(ang)*r_, z) @ Rz(ang+pi/2)), win)
    a.add(poly_extrude(arch_poly(1.2, 2.2), .4, T=Tr(-2.85, 0, .6) @ Rz(pi/2)), wh2); a.add(poly_extrude(arch_poly(.9, 1.9), .4, T=Tr(-2.95, 0, .6) @ Rz(pi/2)), dr)
    a.add(box(.8, 1.6, .2, (-3.35, 0, .1)), st)
    a.add(cyl(2.8, 2.8, .3, 16, at=(0, 0, 13)), ir)
    for k in range(18):
        ang = k/18*2*pi; a.add(cyl(.035, .035, .9, 4, at=(cos(ang)*2.65, sin(ang)*2.65, 13.3)), ir)
    a.add(tube([V((cos(t)*2.65, sin(t)*2.65, 14.2)) for t in [k/24*2*pi for k in range(25)]], .04, 4, False, False), ir)
    a.add(cyl(1.6, 1.6, .25, 12, at=(0, 0, 13.3)), ir); a.add(cyl(1.45, 1.45, 1.7, 12, at=(0, 0, 13.55)), gl)
    for k in range(8):
        ang = k/8*2*pi; a.add(box(.09, .09, 1.7, (cos(ang)*1.47, sin(ang)*1.47, 14.4)), ir)
    a.add(lathe([(1.9, 15.25), (1.6, 15.6), (.9, 16.3), (0, 16.7)], 12), rd); a.add(sph(.2, at=(0, 0, 16.85), seg=6, rings=4), ir); a.add(cyl(.02, .02, 1.0, 3, at=(0, 0, 16.9)), ir)
BUILDINGS = ['house_%d' % i for i in range(len(HOUSES))] + ['chapel', 'lighthouse']

# ================================================================ PEOPLE — segmented rigs
# Every character is <id>_body (torso + clothes, origin at the feet), <id>_body_head (skull, face, hair, hat; turns at the neck),
# <id>_body_jaw (lower lip + chin cover: drops while talking) and <id>_body_lids (closed eyelids: blinking).
# Limbs are shared segments recoloured in the game by palette: arm_up / arm_lo ('cloth', 'cuff', 'skin'), robe_up / robe_lo,
# hand_R / hand_L + fing_R / fing_L ('skin'), leg_up / leg_lo / foot ('trousers', 'boot'), stock_lo / shoe (women), weapons wpn_*.
# Segment convention: origin at the proximal joint, the bone hangs along -Z (game -Y), the front is -Y (game +Z).
# Lengths must match RIG in src/3-game.js.
from math import exp, copysign
ARM_L = (.29, .27); HAND_L = .095; LEG_L = (.42, .40); ANKLE = .085
HN = 16
def G_(d, s): return exp(-(d/s)**2)
def pw_(xs, ys, x):
    if x <= xs[0]: return ys[0]
    for i in range(len(xs)-1):
        if x <= xs[i+1]: t = (x-xs[i])/(xs[i+1]-xs[i]); return ys[i]+(ys[i+1]-ys[i])*t
    return ys[-1]
def mirror_x(bm):
    for v in bm.verts: v.co.x = -v.co.x
    bmesh.ops.reverse_faces(bm, faces=list(bm.faces)); return bm
def face_away(bm, c):
    bm.normal_update()
    for f in bm.faces:
        if f.normal.dot(f.calc_center_median()-c) < 0: f.normal_flip()
    return bm
def cband(a, bvh, C, top, bot, mat, off, side=0):
    """conforming decal strip: two polylines (same count) of 2D points projected onto the surface (front: (x, z); side s: (y, z))"""
    bm = bmesh.new()
    if side == 0: ax = V((0, 1, 0)); org = lambda p: C+V((p[0], -.45, p[1]))
    else: ax = V((-side, 0, 0)); org = lambda p: C+V((side*.45, p[0], p[1]))
    def pr(p):
        loc, n, i_, d_ = bvh.ray_cast(org(p), ax, 1.2)
        return None if loc is None else bm.verts.new(loc + n*off)
    T = [pr(p) for p in top]; B = [pr(p) for p in bot]
    for i in range(len(T)-1):
        for tri in ((T[i], T[i+1], B[i+1]), (T[i], B[i+1], B[i])):
            if None in tri or len(set(tri)) < 3: continue
            try: bm.faces.new(tri)
            except ValueError: pass
    bm.normal_update()
    for f in bm.faces:
        if f.normal.dot(ax) > 0: f.normal_flip()
    a.add(bm, mat)
def clumps(a, name, col):
    m1 = a.m(name, col); m2 = a.m(name+'2', mix(col, '#000000', .14)); m3 = a.m(name+'3', mix(col, '#ffffff', .08))
    return lambda f: (m1, m1, m2, m3)[int(abs(f.calc_center_median().x*977+f.calc_center_median().z*613+f.calc_center_median().y*331)) % 4]
def shell(a, src, C, inreg, thick, mat, jit=0.0, seed=0, post=None):
    """hair / beard grown out of the skin: the faces of src selected by inreg are lifted along their normals into a closed-edge shell"""
    rr = random.Random(seed); src.normal_update()
    faces = [f for f in src.faces if inreg(f.calc_center_median()-C)]
    if not faces: return
    fs = set(faces); vs = []
    for f in faces:
        for v in f.verts:
            if v not in vs: vs.append(v)
    bnd = set()
    for f in faces:
        for e in f.edges:
            if sum(1 for lf in e.link_faces if lf in fs) == 1: bnd.update(e.verts)
    bm = bmesh.new(); top = {}; bot = {}
    for v in vs:
        d = v.co - C; b = v in bnd; n = v.normal
        p = v.co + n*thick(d, b)
        if jit and not b: p = p + V((rr.uniform(-1, 1), rr.uniform(-1, 1), rr.uniform(-1, 1)))*jit
        if post: p = post(p, d, b, rr)
        top[v] = bm.verts.new(p); bot[v] = bm.verts.new(v.co - n*.002)
    for f in faces:
        try: bm.faces.new([top[v] for v in f.verts])
        except ValueError: pass
        loop = list(f.verts)
        for i in range(len(loop)):
            u_, w_ = loop[i], loop[(i+1) % len(loop)]
            e = [e for e in f.edges if u_ in e.verts and w_ in e.verts]
            if e and sum(1 for lf in e[0].link_faces if lf in fs) == 1:
                try: bm.faces.new((bot[u_], bot[w_], top[w_], top[u_]))
                except ValueError: pass
    a.add(bm, mat)

# ---------------------------------------------------------------- heads
HEAD_BASE = [(-.175, .052, .05, .054), (-.14, .052, .054, .056), (-.118, .053, .068, .054), (-.1, .066, .088, .062), (-.078, .078, .096, .072),
             (-.055, .085, .1, .082), (-.03, .09, .103, .09), (-.005, .093, .104, .096), (.03, .097, .101, .103), (.06, .097, .099, .107),
             (.09, .092, .092, .105), (.115, .084, .08, .097), (.137, .07, .062, .082), (.153, .048, .04, .058), (.162, .022, .018, .028)]
def head_geo(C, st):
    """faceted skull + face: 16-sided rings shaped by the character's proportions (no spheres; every bump is a moved ring vertex)"""
    fl, cr, hw, hd, jw = st.get('fl', 1.), st.get('cr', 1.), st.get('hw', 1.), st.get('hd', 1.), st.get('jw', 1.)
    fat, ck, ho, chn, br, jc, sock = st.get('fat', 0.), st.get('cheek', .4), st.get('hollow', 0.), st.get('chin', 0.), st.get('brow_r', .5), st.get('jc', .5), st.get('socket', 1.)
    bm = bmesh.new(); rings = []
    for (dz, w, fd, bd) in HEAD_BASE:
        z = .03+(dz-.03)*(fl if dz < .03 else cr)
        lw = min(1, max(0, (-.02-dz)/.08))
        w = w*hw*(1+(jw-1)*lw)
        if -.13 < dz < -.03: w += fat*.012*G_(dz+.08, .04)
        if -.13 < dz < -.09: fd += fat*.016
        if dz > -.02: fd *= hd
        bd *= hd
        row = []
        for i in range(HN):
            t = 2*pi*i/HN; sx, cy_ = sin(t), cos(t)
            x = copysign(abs(sx)**.85, sx)*w; y = -copysign(abs(cy_)**.85, cy_)*(fd if cy_ > 0 else bd)
            at = abs(atan2(sx, cy_))
            b = ck*.008*G_(dz, .025)*G_(at-.95, .35) - ho*.012*G_(dz+.045, .03)*G_(at-1.0, .35) + jc*.008*G_(dz+.085, .02)*G_(at-1.15, .3)
            b += chn*.012*G_(dz+.095, .022)*G_(at, .35) + br*.007*G_(dz-.058, .014)*G_(at-.35, .4) - .004*G_(dz-.07, .03)*G_(at-1.35, .25)
            b += fat*.01*G_(dz+.07, .04)*G_(at-.9, .6) - sock*.005*G_(dz-.03, .013)*G_(at-.42, .2)
            d = V((x, y, 0)); d = d.normalized() if d.length > 1e-6 else d
            row.append(bm.verts.new(C + V((x, y, z)) + d*b))
        rings.append(row)
    for j in range(len(rings)-1):
        for i in range(HN): bm.faces.new((rings[j][i], rings[j][(i+1) % HN], rings[j+1][(i+1) % HN], rings[j+1][i]))
    tp = bm.verts.new(C + V((0, .006, .03+(.166-.03)*cr)))
    for i in range(HN): bm.faces.new((rings[-1][i], rings[-1][(i+1) % HN], tp))
    bo = bm.verts.new(C + V((0, 0, .03+(-.18-.03)*fl)))
    for i in range(HN): bm.faces.new((rings[0][(i+1) % HN], rings[0][i], bo))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update()
    return bm
def ang_(d): return abs(atan2(d.x, -d.y))
def head(a, C, skin, st, part='head'):
    """part: 'head' (everything static), 'jaw' (lower lip + chin cover), 'lids' (closed eyelids for blinking)"""
    C = V(C); fl = st.get('fl', 1.); hv = st.get('hv', .012); hair_c = st.get('hair', '#3a2a1e')
    sk = a.m('skin', skin); skd = a.m('skin2', mix(skin, '#000000', .14))
    bm = head_geo(C, st); bvh = BVHTree.FromBMesh(bm)
    ez = .03 + st.get('ey', 0.); es = st.get('es', .04); ew = st.get('ew', .021); eh = st.get('eh', .0098); tilt = st.get('tilt', .04)
    mz = .03 - .082*fl + st.get('my', 0.); mw = st.get('mw', .02); lu = st.get('lu', .004); ll = st.get('ll', .0055); sm = st.get('smile', 0.)
    nbz = .03 - .045*fl*st.get('nl', 1.)   # nose base
    eyes = st.get('eyes', 'normal'); lidh = st.get('lid', .2); age = st.get('age', .2)
    lid_c = mix(skin, '#000000', .07); lash_c = mix(st.get('brow_c', hair_c), '#000000', .45)
    lip_c = st.get('lip_c', mix(skin, '#8a3a34', .38))
    def mouth_y(u): return mz + sm*u*u
    def lo_lip(u): return mz - ll*(.2+.8*(1-u*u)**.6) + sm*u*u
    us = [-1+2*i/8 for i in range(9)]
    def EP(s, u, v, sc=1.0):
        X = u*ew*s*sc; Z = v*eh; an = s*tilt
        return (s*es + X*cos(an) - Z*sin(an), ez + X*sin(an) + Z*cos(an))
    def etop(u): return .95*(1-u*u)**.55*(1-.18*u)
    def ebot(u): return -.8*(1-u*u)**.65*(1+.2*u)
    if part == 'jaw':
        cband(a, bvh, C, [(u*mw, mouth_y(u)-.0002) for u in us], [(u*mw*1.02, lo_lip(u)) for u in us], a.m('fd_lip', lip_c), .0034)
        cband(a, bvh, C, [(u*mw*1.15, lo_lip(u)+.001) for u in us], [(u*mw*1.25, mz-.027) for u in us], a.m('fd_chin', skin), .0026)
        bm.free(); return
    if part == 'lids':
        lm = a.m('fd_lidc', lid_c); lk = a.m('fd_lash', lash_c)
        for s in (-1, 1):
            if eyes == 'glow':   # the glowing pupils go dark for a moment
                cband(a, bvh, C, [EP(s, u*.6, .55) for u in us], [EP(s, u*.6, -.55) for u in us], a.m('fd_hollow', '#0a0806'), .0036); continue
            sc = 1.35 if eyes == 'bulge' else 1.0
            cband(a, bvh, C, [EP(s, u*1.06, etop(u)*1.55*sc+.18) for u in us], [EP(s, u*1.06, ebot(u)*1.12*sc-.04) for u in us], lm, .0056)
            cband(a, bvh, C, [EP(s, u, ebot(u)*.25+.06) for u in us], [EP(s, u, ebot(u)*.25-.1) for u in us], lk, .0058)
        bm.free(); return
    # ---- skin materials: shadow under the jaw, blush, stubble
    stub = st.get('stubble', 0.); blush = st.get('blush', 0.)
    stm = a.m('stubble', mix(skin, '#2a2420', .5*stub)) if stub else sk; chm = a.m('skin_ch', mix(skin, '#b85a48', blush)) if blush else sk
    def hmat(f):
        c = f.calc_center_median()-C; at = ang_(c); n = f.normal
        if n.z < -.55 or (c.z < .03-.13*fl and at < 2.4): return skd
        if stub and c.z < nbz-.004 and c.z > .03-.14*fl and at < 1.7 and not (at < .9 and c.z > mz-.012 and abs(c.x) < mw+.006 and c.z < mz+.008): return stm
        if blush and -.045 < c.z < .012 and .5 < at < 1.25: return chm
        return sk
    keep = bm.copy(); a.add(bm, hmat)
    # ---- nose: faceted wedge built on the face surface
    def S(x, z):
        loc, n, i_, d_ = bvh.ray_cast(C+V((x, -.45, z)), V((0, 1, 0)), 1.2); return loc if loc is not None else C+V((x, -.1, z))
    nl = st.get('nl', 1.); npj = st.get('np', .021)*.85; nw = st.get('nw', .014)*1.18; tw = st.get('tw', .007)*1.3; nb = st.get('nb', .008)*1.35; up = st.get('nup', 0.); hump = st.get('hump', 0.)
    fw = V((0, -1, 0)); rz = ez - .006; tz = .03 - .039*fl*nl; bz = tz - .014
    nm = bmesh.new(); P_ = lambda p: nm.verts.new(p)
    r0 = P_(S(0, rz)+fw*.002); rl = P_(S(-nb, rz-.006)); rr_ = P_(S(nb, rz-.006))
    mz_ = (rz+tz)/2; mid = P_(S(0, mz_)+fw*(npj*.5+hump)); ml = P_(S(-nb*1.1, mz_)+fw*npj*.25); mr = P_(S(nb*1.1, mz_)+fw*npj*.25)
    tc = P_(S(0, tz)+fw*npj+V((0, 0, up*.004))); tl = P_(S(-tw, tz-.002)+fw*npj*.82); tr = P_(S(tw, tz-.002)+fw*npj*.82)
    wl = P_(S(-nw, tz-.006)+fw*npj*.35); wr = P_(S(nw, tz-.006)+fw*npj*.35); cl = P_(S(-nw*1.05, tz+.005)); cr = P_(S(nw*1.05, tz+.005))
    bs = P_(S(0, bz+.004)+fw*npj*.45+V((0, 0, up*.006))); bl = P_(S(-.007, bz)); brr = P_(S(.007, bz))
    for f in ((r0, mid, ml), (r0, mr, mid), (r0, ml, rl), (r0, rr_, mr), (mid, tc, tl), (mid, tr, tc), (mid, tl, ml), (mid, mr, tr),
              (ml, tl, wl), (mr, wr, tr), (ml, wl, cl), (mr, cr, wr), (rl, ml, cl), (rr_, cr, mr), (tl, tc, bs), (tc, tr, bs), (tl, bs, wl), (tr, wr, bs),
              (wl, bs, bl), (bs, wr, brr), (bs, brr, bl), (wl, bl, cl), (wr, cr, brr)):
        try: nm.faces.new(f)
        except ValueError: pass
    face_away(nm, C+V((0, .01, tz-.004)))
    a.add(nm, lambda f: skd if f.normal.z < -.35 else sk)
    # ---- ears
    if st.get('ears', True) and st.get('hair_style') != 'kerchief' and not st.get('hood'):
        ek = st.get('ear', 1.); eo = st.get('eo', 0.)
        for s in (-1, 1):
            loc, n, i_, d_ = bvh.ray_cast(C+V((s*.4, .012, .005)), V((-s, 0, 0)), 1.0); ex = (loc.x if loc else s*.095) - s*.004
            a.add(f_loft([C+V((ex, .01, .038*ek)), C+V((ex+s*(.012+eo), .02, .006)), C+V((ex+s*(.004+eo*.6), .016, -.03*ek))], [(.005, .017*ek), (.007, .021*ek), (.005, .012*ek)], ref=(s, 0, 0), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), skd)
    # ---- eyes: socket, white, iris, pupil, glint, lash line, upper lid, crease, lower lid, bags; brows
    big = eyes == 'bulge'; esc = 1.35 if big else 1.0
    m_sock = a.m('fd_socket', mix(skin, '#000000', .07*st.get('socket', 1.))); m_ew = a.m('fd_eyewhite', st.get('white', '#e2dccb'))
    m_ir = a.m('fd_iris', st.get('iris', '#3a2a1c')); m_pu = a.m('fd_pupil', '#120d0a'); m_gl = a.m('fd_glint', '#f4efe2', .3)
    m_lk = a.m('fd_lash', lash_c); m_ld = a.m('fd_lid', lid_c); m_cr = a.m('fd_crease', mix(skin, '#000000', .22)); m_ll = a.m('fd_lidl', mix(skin, '#000000', .03))
    m_bg = a.m('fd_bag', mix(skin, '#3a2a30', .2)); m_bw = a.m('fd_brow', st.get('brow_c', hair_c)); m_wr = a.m('fd_wrinkle', mix(skin, '#000000', .2))
    for s in (-1, 1):
        if eyes == 'glow':
            cband(a, bvh, C, [EP(s, u*1.05, etop(u)*1.6+.15) for u in us], [EP(s, u*1.05, ebot(u)*1.7-.15) for u in us], a.m('fd_hollow', '#0a0806'), .002)
            r = .35
            cband(a, bvh, C, [EP(s, cos(t)*r*eh/ew, sin(t)*r) for t in [k/6*pi for k in range(7)]], [EP(s, cos(t)*r*eh/ew, -sin(t)*r) for t in [k/6*pi for k in range(7)]], a.m('fd_glow', '#ffd27a', .8), .003)
        else:
            if not big: cband(a, bvh, C, [EP(s, u*1.3, etop(u)*1.6*esc+.25) for u in us], [EP(s, u*1.3, ebot(u)*1.5*esc-.15) for u in us], m_sock, .0015)
            cband(a, bvh, C, [EP(s, u, etop(u)*esc) for u in us], [EP(s, u, ebot(u)*esc) for u in us], m_ew, .0025)
            ri = (.42 if big else .78); uc = -.04 + st.get('look', 0.)
            ring_ = [k/6*pi for k in range(7)]
            cband(a, bvh, C, [EP(s, uc+cos(t)*ri*eh/ew, sin(t)*ri) for t in ring_], [EP(s, uc+cos(t)*ri*eh/ew, -sin(t)*ri) for t in ring_], m_ir, .0034)
            rp = ri*.45
            cband(a, bvh, C, [EP(s, uc+cos(t)*rp*eh/ew, sin(t)*rp) for t in ring_], [EP(s, uc+cos(t)*rp*eh/ew, -sin(t)*rp) for t in ring_], m_pu, .0038)
            g = ri*.22; gu = uc+ri*.35*eh/ew
            cband(a, bvh, C, [EP(s, gu-g*eh/ew, .3), EP(s, gu, .3+g), EP(s, gu+g*eh/ew, .3)], [EP(s, gu-g*eh/ew, .3), EP(s, gu, .3-g), EP(s, gu+g*eh/ew, .3)], m_gl, .0043)
            lo_ = lambda u: etop(u)*esc - lidh*(etop(u)-ebot(u))*esc*.5
            cband(a, bvh, C, [EP(s, u*1.05, lo_(u)+.12) for u in us], [EP(s, u*1.05, lo_(u)-.16) for u in us], m_lk, .0042)
            cband(a, bvh, C, [EP(s, u*1.08, etop(u)*1.45*esc+.15) for u in us], [EP(s, u*1.05, lo_(u)) for u in us], m_ld, .0045)
            cu = [u*.85 for u in us]
            if not big and age > .3: cband(a, bvh, C, [EP(s, u, etop(u)*1.55*esc+.36+lidh*.2) for u in cu], [EP(s, u, etop(u)*1.55*esc+.2+lidh*.2) for u in cu], m_cr, .0047)
            cband(a, bvh, C, [EP(s, u*1.02, ebot(u)*esc+.08) for u in us], [EP(s, u*1.02, ebot(u)*1.22*esc-.12) for u in us], m_ll, .003)
            if age > .35:
                cband(a, bvh, C, [EP(s, u*.8, ebot(u)*1.45-.18) for u in us], [EP(s, u*.8, ebot(u)*1.45-.18-.25*age) for u in us], m_bg, .002)
            if age > .5:
                for k in range(2):
                    cband(a, bvh, C, [EP(s, 1.15, .1-k*.45), EP(s, 1.6, .35-k*.7)], [EP(s, 1.15, -.02-k*.45), EP(s, 1.6, .23-k*.7)], m_wr, .0019)
        # brow
        if st.get('brow', True):
            bt = st.get('bt', .0045)/eh; by = st.get('by', 1.9); barc = st.get('barc', .3); bang = st.get('bang', 0.)
            bu = [-1.1+2.15*i/7 for i in range(8)]
            cen = lambda u: by + barc*(1-u*u) - bang*u
            th = lambda u: bt*(1-.45*(u+1.1)/2.15)
            cband(a, bvh, C, [EP(s, u*1.12, cen(u)+th(u)*.5) for u in bu], [EP(s, u*1.12, cen(u)-th(u)*.5) for u in bu], m_bw, .0062)
    # ---- mouth: dark interior, teeth, upper lip, shadow under the lower lip
    cband(a, bvh, C, [(u*mw*.96, mouth_y(u)+lu*.18) for u in us], [(u*mw*.92, mz-.024) for u in us], a.m('fd_mouth', '#2a1414'), .0016)
    cband(a, bvh, C, [(u*mw*.62, mouth_y(u*.62)+lu*.18) for u in us], [(u*mw*.62, mouth_y(u*.62)-.0012) for u in us], a.m('fd_teeth', '#d6cfbd'), .0022)
    def up_lip(u): return mz + lu*(.25+.75*(1-u*u)**.5)*(1-.3*G_(u, .22)) + sm*u*u
    cband(a, bvh, C, [(u*mw, up_lip(u)) for u in us], [(u*mw, mouth_y(u)+.0002) for u in us], a.m('fd_lip', lip_c), .0034)
    if age > .4:   # nasolabial folds, forehead lines
        for s in (-1, 1):
            pts = [(s*(nw+.006), nbz+.004), (s*(mw+.004), mz+.006), (s*(mw+.008), mz-.01)]
            cband(a, bvh, C, pts, [(x+s*.0016, z) for (x, z) in pts], m_wr, .0019)
        for k in range(2 if age < .8 else 3):
            zz = .1 + k*.012
            cband(a, bvh, C, [(-.03, zz+.0012), (0, zz+.0022), (.03, zz+.0012)], [(-.03, zz), (0, zz+.001), (.03, zz)], m_wr, .0019)
    if st.get('freckles'):
        rr = random.Random(11); fm = a.m('fd_freckle', mix(skin, '#7a4a2a', .45))
        for k in range(16):
            x = rr.uniform(-.05, .05); z = rr.uniform(-.02, .012); q = .0016
            if abs(x) < .012 and z > -.005: continue
            cband(a, bvh, C, [(x-q, z), (x, z+q), (x+q, z)], [(x-q, z), (x, z-q), (x+q, z)], fm, .0021)
    if st.get('gills'):
        gm = a.m('fd_gill', mix(skin, '#3a2a2a', .5))
        for s in (-1, 1):
            for k in range(3):
                z = -.085-k*.013
                cband(a, bvh, C, [(-.0, z+.001), (.025, z+.003)], [(-.0, z-.001), (.025, z+.0005)], gm, .0018, side=s)
    # ---- hair grown from the scalp
    hs = st.get('hair_style', 'short'); hat = st.get('hat'); hr = a.m('hair', hair_c); hrc = clumps(a, 'hair', hair_c)
    part_ = st.get('part', 0.); rec = st.get('recede', 0.); tous = st.get('tousle', 0.)
    if hs in ('short', 'side', 'bun', 'braids', 'long', 'tousled', 'kerchief', 'slick'):
        kerch = hs == 'kerchief'
        if kerch: xs, zs = [0, .6, 1.2, 1.6, 2.2, pi], [.072, .06, -.02, -.07, -.12, -.12]
        else:
            hf = .088 + rec*.022; ht = .072 + rec*.045
            xs, zs = [0, .6, 1.0, 1.35, 1.75, 2.2, pi], [hf, ht, (ht+.035)/2, .035, .02, -.1, -.11]
        def inreg(d):
            at = ang_(d); lim = pw_(xs, zs, at)
            if not kerch and at < .9: lim -= part_*.014*(1 if d.x > 0 else -1)*(1-at/.9)
            return d.z > lim
        crown = lambda d: max(0, min(1, (d.z-.05)/.09))
        if kerch:
            sc_ = st.get('scarf', '#6a3a34'); col = a.m('kerchief', sc_); k2 = a.m('kerchief2', mix(sc_, '#e8dcc0', .3)); k3 = a.m('kerchief3', mix(sc_, '#000000', .25))
            kpat = lambda f: (col, k2, col, k3)[(int((f.calc_center_median().x+1)*70)+int((f.calc_center_median().z+1)*70)) % 4]   # printed cotton
            shell(a, keep, C, inreg, lambda d, b: .009 if b else .016+.004*crown(d), kpat, jit=.0015, seed=3)
            a.add(f_loft([C+V((0, .09, -.06)), C+V((0, .13, -.14)), C+V((0, .1, -.2))], [(.04, .012), (.035, .01), (.012, .006)], ref=(0, 1, 0), kind='oct', cap0='flat', cap1='chamfer', smooth=0), col)
        else:
            th0 = {'slick': .007, 'tousled': .016, 'side': .013}.get(hs, hv)
            sw_ = lambda d: .006*max(0, 1-ang_(d)/.9)*(1 if d.x*part_ < 0 else 0)*min(1, abs(part_)*2) if part_ else 0
            shell(a, keep, C, inreg, lambda d, b: .0015 if b else th0*(1+.35*crown(d))+sw_(d), hrc, jit=.0025*(tous+.3 if hs != 'slick' else 0), seed=5)
        if hs == 'bun': a.add(f_loft([C+V((0, .085, .07)), C+V((0, .115, .085)), C+V((0, .135, .08))], [.03, .042, .03], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), hr)
        elif hs == 'braids':
            for s in (-1, 1):
                pts = [C+V((s*.1, .035, -.0)), C+V((s*.112, .035, -.05)), C+V((s*.112, .03, -.1)), C+V((s*.106, .022, -.15)), C+V((s*.1, .015, -.2)), C+V((s*.095, .01, -.25))]
                a.add(f_loft(pts, [.018, .021, .016, .02, .015, .01], kind='oct', cap0='chamfer', cap1='point', smooth=0), hr)
                a.add(f_loft([C+V((s*.096, .01, -.24)), C+V((s*.096, .01, -.27))], [.014, .014], kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), a.m('ribbon', st.get('ribbon', '#7a2a2a')))
        elif hs == 'long': a.add(f_loft([C+V((0, .075, .03)), C+V((0, .09, -.12)), C+V((0, .075, -.22))], [(.085, .03), (.09, .03), (.07, .02)], ref=(0, 1, 0), kind='oct', cap0='flat', cap1='chamfer', smooth=0), hr)
    # ---- beards grown from the jaw
    beard = st.get('beard'); bcol = clumps(a, 'beard', st.get('beard_c', hair_c))
    if beard in ('full', 'goatee', 'chops', 'mustache'):
        bl = st.get('blen', .03)
        def mus(d): return abs(d.x) < mw+.012 and mz+lu*.6 < d.z < nbz-.002 and ang_(d) < .8
        def hole(d): return abs(d.x) < mw*1.05 and mz-ll-.004 < d.z < mz+lu*.6
        if beard == 'full':
            bxs, bzs = [0, .35, .7, 1.0, 1.35, 1.6, 1.8], [nbz-.002, nbz-.005, mz-.002, -.012, .012, .035, .035]
            def inb(d): at = ang_(d); return at < 1.8 and -.16 < d.z < pw_(bxs, bzs, at) and not hole(d)
        elif beard == 'goatee':
            def inb(d): return (mus(d) or (ang_(d) < .5 and -.15 < d.z < mz-ll-.002)) and not hole(d)
        elif beard == 'chops':
            def inb(d): return (mus(d) or (1.0 < ang_(d) < 1.75 and -.08 < d.z < .035)) and not hole(d)
        else: inb = lambda d: mus(d) and not hole(d)
        def bth(d, b):
            if b: return .0015
            near = max(0, 1-(abs(d.x)/(mw*2.2))**2-((d.z-mz)/.022)**2)
            return (.005 + .016*max(0, min(1, (-.03-d.z)/.08))*(beard in ('full', 'goatee')))*(1-.75*near)
        def bpost(p, d, b, rr):
            at = ang_(d)
            if not b and d.z < -.075 and at < 1.25 and beard in ('full', 'goatee'):
                drop = bl*(1-at/1.25)*(.55+.45*rr.random()); p = p + V((0, -drop*.3, -drop))
            if mus(d) and abs(d.x) > mw*.8: p = p + V((0, 0, -.006))
            return p
        shell(a, keep, C, inb, bth, bcol, jit=.0045, seed=9, post=bpost)
    keep.free()
    # ---- hats (sized from the head, sit over the hair)
    hwk = st.get('hw', 1.); sx = .097*hwk + hv + .006; sy = .101*st.get('hd', 1.) + hv + .006
    hc = a.m('hat', st.get('hat_col', '#4a3a2a')); hb_ = a.m('hatband', st.get('band', '#1e1a16')); hz = .03+((.072 if hat == 'fedora' else .088)-.03)*st.get('cr', 1.)
    if hat == 'fedora':
        br_ = f_loft([C+V((0, .004, hz+.01)), C+V((0, .004, hz+.02))], [(sx*1.62, sy*1.58), (sx*1.56, sy*1.52)], n=14, cap0='flat', cap1='flat', smooth=0)
        for v in br_.verts:
            q = v.co - C; r_ = hypot(q.x/sx, (q.y-.004)/sy)
            if r_ > 1.3: v.co.z += .012*abs(q.x)/(sx*1.6) - .008*max(0, -q.y)/(sy*1.6)   # sides up, front down
        a.add(br_, hc)
        cw = f_loft([C+V((0, .004, hz+.015)), C+V((0, .004, hz+.075)), C+V((0, .01, hz+.105))], [(sx*1.0, sy*.98), (sx*.95, sy*.9), (sx*.7, sy*.58)], n=12, cap0='flat', cap1='flat', smooth=0)
        for v in cw.verts:
            q = v.co - C
            if q.z > hz+.09 and abs(q.x) < sx*.3: v.co.z -= .012   # the crease along the crown
        a.add(cw, hc)
        a.add(f_loft([C+V((0, .004, hz+.018)), C+V((0, .004, hz+.04))], [(sx*1.02, sy*1.0), (sx*1.0, sy*.97)], n=12, cap0=None, cap1=None, smooth=0), hb_)
    elif hat == 'beanie':
        a.add(f_loft([C+V((0, .006, hz-.005)), C+V((0, .008, hz+.045)), C+V((0, .012, hz+.08)), C+V((0, .016, hz+.093))], [(sx*1.0, sy*1.0), (sx*.88, sy*.9), (sx*.55, sy*.58), (sx*.2, sy*.22)], n=12, cap0='flat', cap1='flat', smooth=0), hc)
        a.add(f_loft([C+V((0, .006, hz-.02)), C+V((0, .006, hz+.012))], [(sx*1.04, sy*1.04), (sx*1.03, sy*1.03)], n=12, cap0='chamfer', cap1='chamfer', smooth=0), hb_)
    elif hat == 'captain':
        a.add(f_loft([C+V((0, .01, hz-.01)), C+V((0, .01, hz+.05)), C+V((0, .015, hz+.068))], [(sx*1.0, sy*1.0), (sx*1.1, sy*1.08), (sx*1.1, sy*1.08)], n=12, cap0='flat', cap1='flat', smooth=0), hc)
        a.add(f_loft([C+V((0, -sy*.8, hz+.0)), C+V((0, -sy*1.55, hz-.018))], [(sx*.85, .008), (sx*.7, .006)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), hb_)
        a.add(f_loft([C+V((0, -sy*1.02, hz+.025)), C+V((0, -sy*1.06, hz+.045))], [(.02, .004), (.016, .004)], ref=(0, -1, 0), kind='oct', cap0='flat', cap1='flat', smooth=0), a.m('badge', '#b08d3c', .3))
    elif hat == 'flatcap':
        a.add(f_loft([C+V((0, .008, hz-.008)), C+V((0, -.004, hz+.026)), C+V((0, -.012, hz+.044))], [(sx*1.0, sy*1.0), (sx*1.02, sy*1.06), (sx*.82, sy*.92)], n=12, cap0='flat', cap1='flat', smooth=0), hc)
        a.add(f_loft([C+V((0, -sy*.82, hz-.004)), C+V((0, -sy*1.32, hz-.016))], [(sx*.78, .006), (sx*.62, .005)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), hc)
    if st.get('pipe'):
        x0 = mw*.8
        a.add(f_loft([C+V((x0, -.1, mz-.002)), C+V((x0+.025, -.15, mz-.016))], [.0045, .0045], kind='n', n=6, cap0='chamfer', cap1=None, smooth=0), a.m('pipe', '#3a2a1e'))
        a.add(f_loft([C+V((x0+.026, -.155, mz-.028)), C+V((x0+.026, -.155, mz+.0))], [.009, .011], kind='n', n=7, cap0='flat', cap1=None, smooth=0), a.m('pipe', '#3a2a1e'))
    if st.get('glasses'):
        fr = a.m('fd_frames', '#2a2a2a')
        for s in (-1, 1):
            loc, n, i_, d_ = bvh.ray_cast(C+V((s*es, -.45, ez)), V((0, 1, 0)), 1.2); gy = (loc.y if loc else C.y-.1) - .007
            a.add(tube([V((C.x+s*es+cos(t)*ew*1.2, gy, C.z+ez+sin(t)*eh*1.9)) for t in [k/8*2*pi for k in range(9)]], .0025, 3, False, False), fr)
            a.add(tube([V((C.x+s*(es+ew*1.2), gy, C.z+ez+.002)), V((C.x+s*(.1*hwk+.002), C.y+.02, C.z+ez+.004))], .0022, 3, False, False), fr)
        a.add(tube([V((C.x-es+ew*1.2, C.y-.112, C.z+ez+.004)), V((C.x+es-ew*1.2, C.y-.112, C.z+ez+.004))], .0022, 3, False, False), fr)
    if st.get('hood'):   # faceted hood shell with a front opening, dark inside
        rb2 = a.m('robe2', '#32131a'); inn = a.m('hood_in', '#0c0708')
        lv = [(-.22, .2, .16, .2, .03), (-.13, .155, .15, .175, .02), (-.03, .148, .155, .165, .0), (.06, .14, .15, .158, -.01), (.13, .12, .12, .145, -.01), (.19, .085, .07, .11, .0), (.225, .035, .02, .06, .02)]
        hm = bmesh.new(); rs = []
        for (dz, w, fd, bd, sh_) in lv:
            row = []
            for i in range(12):
                t = 2*pi*i/12; sx_, cy_ = sin(t), cos(t)
                row.append(hm.verts.new(C+V((sx_*w, -cy_*(fd if cy_ > 0 else bd)+sh_, dz))))
            rs.append(row)
        for j in range(len(rs)-1):
            for i in range(12): hm.faces.new((rs[j][i], rs[j][(i+1) % 12], rs[j+1][(i+1) % 12], rs[j+1][i]))
        tip = hm.verts.new(C+V((0, .2, .19)))
        for i in range(12): hm.faces.new((rs[-1][i], rs[-1][(i+1) % 12], tip))
        bmesh.ops.recalc_face_normals(hm, faces=hm.faces)
        bmesh.ops.delete(hm, geom=[f for f in hm.faces if (f.calc_center_median()-C).y < -.07 and -.16 < (f.calc_center_median()-C).z < .12 and abs((f.calc_center_median()-C).x) < .11], context='FACES')
        inner = hm.copy()
        for v in inner.verts: v.co = C + (v.co-C)*.94
        bmesh.ops.reverse_faces(inner, faces=list(inner.faces))
        a.add(hm, rb2); a.add(inner, inn)

# ---------------------------------------------------------------- torsos (no head, no limbs: shoulders and hips are sockets the limb caps sit in)
def tlevels(cfg):
    k, kd, kz = cfg.get('k', 1.), cfg.get('kd', 1.), cfg.get('kz', 1.); fat = cfg.get('fat', 0.)
    if cfg.get('sex') == 'f':
        L = [(.76, .13, .1, 0), (.84, .17, .115, 0), (.92, .176, .118, 0), (1.02, .142, .1, -.004), (1.12, .148, .105, -.01), (1.22, .16, .124, -.026), (1.3, .165, .118, -.02),
             (1.37, .17, .102, -.006), (1.43, .17, .09, .004), (1.485, .124, .082, .01), (1.53, .074, .064, .012), (1.575, .055, .052, .012), (1.64, .05, .048, .014)]
    else:
        L = [(.74, .13, .095, 0), (.8, .165, .108, 0), (.88, .176, .114, 0), (.98, .162, .108, -.004), (1.1, .168, .115, -.01), (1.24, .182, .125, -.014), (1.34, .192, .12, -.01),
             (1.42, .196, .105, 0), (1.48, .152, .092, .01), (1.525, .09, .075, .012), (1.57, .064, .06, .012), (1.64, .058, .054, .014)]
    out = []
    for (z, rx, ry, yo) in L:
        if fat: b = fat*G_(z-1.02, .16); rx += b*.035; ry += b*.055; yo -= b*.04
        out.append((z*kz, rx*k, ry*k*kd, yo*k))
    return out
def tring(z, rx, ry, yo, n=16, grow=0.0, fold=0.0):
    pts = []
    for i in range(n):
        t = 2*pi*i/n; c, s = cos(t), sin(t); g = grow*(1+fold*sin(t*7+z*5))
        pts.append(V((copysign(abs(c)**.7, c)*(rx+g), copysign(abs(s)**.7, s)*(ry+g)+yo, z)))
    return pts
def tring_at(cfg, z, grow=0.0, n=16, fold=0.0):
    L = tlevels(cfg)
    if z <= L[0][0]: q = L[0]
    elif z >= L[-1][0]: q = L[-1]
    else:
        for i in range(len(L)-1):
            if L[i][0] <= z <= L[i+1][0]:
                t = (z-L[i][0])/(L[i+1][0]-L[i][0]); q = tuple(L[i][j]+(L[i+1][j]-L[i][j])*t for j in range(4)); break
    return tring(z, q[1], q[2], q[3], n, grow, fold)
def torso(a, cfg):
    kz = cfg.get('kz', 1.); cm = a.m('cloth', cfg['cloth']); c2 = a.m('cloth2', cfg.get('cloth2', mix(cfg['cloth'], '#000000', .2)))
    sk = a.m('skin', cfg['skin']); tr = a.m('trousers', cfg.get('trousers', '#33302c'))
    rings = [tring(z, rx, ry, yo) for (z, rx, ry, yo) in tlevels(cfg)]
    bm = loft(rings, True, True); female = cfg.get('sex') == 'f'
    a.add(bm, lambda f: sk if f.calc_center_median().z > 1.505*kz else (tr if f.calc_center_median().z < .94*kz and not female and not cfg.get('robe') else cm))
    if not female and not cfg.get('nobelt'):
        a.add(loft([tring_at(cfg, .935*kz, .008), tring_at(cfg, .975*kz, .008)], False, False), a.m('belt', cfg.get('belt', '#3a2e22')))
    return cm, c2
def skirtl(a, cfg, zs, grows, mat, fold=.0, cut=None, inner=None):
    """a garment hanging from the torso: rings offset from the body at heights zs (top -> bottom), open, double sided"""
    rings = [tring_at(cfg, z, g, 16, fold) for z, g in zip(zs, grows)]
    bm = loft(list(reversed(rings)), False, False)
    if cut: bmesh.ops.delete(bm, geom=[f for f in bm.faces if cut(f.calc_center_median())], context='FACES')
    a.add(dbl(bm), mat)
def collar(a, cfg, z0, z1, g, mat):
    a.add(loft([tring_at(cfg, z0, g), tring_at(cfg, z1, g*.8)], True, True), mat)
def buttons(a, bv, pts, mat, r=.009, off=.004):
    for (x, z) in pts: cband(a, bv, V((0, 0, 0)), [(x-r, z), (x, z+r), (x+r, z)], [(x-r, z), (x, z-r), (x+r, z)], mat, off)
def body_bvh(a): a.bm.normal_update(); return BVHTree.FromBMesh(a.bm)
NSKIN = '#c9a183'; VSKIN = '#a8a088'
HEADS = {
 'hero_body': ('#c9a183', 1., {'hat': 'fedora', 'hat_col': '#4a3a2a', 'hair': '#3a2a1e', 'hair_style': 'short', 'fl': 1.03, 'jw': 1.05, 'jc': .9, 'chin': .4, 'cheek': .5,
               'nl': 1.05, 'np': .022, 'es': .041, 'eh': .0095, 'tilt': .05, 'lid': .25, 'iris': '#4a5a66', 'bt': .0048, 'barc': .22, 'bang': -.15, 'mw': .02, 'stubble': .3, 'age': .25}),
 'vill_body_0': (VSKIN, 1., {'hat': 'beanie', 'hat_col': '#2f3a3c', 'band': '#262e30', 'eyes': 'bulge', 'hw': 1.08, 'hd': .95, 'fl': .92, 'jw': 1.2, 'cr': .9, 'chin': -.6, 'cheek': 0.,
               'es': .047, 'ew': .023, 'eh': .0105, 'tilt': -.1, 'lid': 0., 'iris': '#2a2a1c', 'nl': .8, 'np': .011, 'nw': .019, 'mw': .027, 'lu': .003, 'll': .0042, 'smile': -.004,
               'ears': False, 'gills': 1, 'stubble': .5, 'bt': .003, 'barc': .1, 'age': .45, 'hair': '#2a2622'}),
 'vill_body_1': (VSKIN, 1., {'hat': 'captain', 'hat_col': '#232a36', 'band': '#15181e', 'beard': 'full', 'blen': .05, 'hair': '#c9c4b8', 'beard_c': '#d6d1c4', 'brow_c': '#d0cbbe', 'pipe': 1, 'gills': 1,
               'hw': 1.03, 'jw': 1.05, 'nl': 1.08, 'np': .026, 'tw': .011, 'nw': .017, 'eh': .0082, 'ew': .019, 'lid': .45, 'bt': .007, 'by': 2.0, 'barc': .15, 'bang': .25,
               'ear': 1.2, 'age': .95, 'mw': .02, 'iris': '#4a4a3a'}),
 'vill_body_2': (VSKIN, 1., {'hat': 'flatcap', 'hat_col': '#3a3a36', 'eyes': 'sunken', 'hw': .9, 'hd': 1.05, 'fl': 1.15, 'jw': .92, 'cr': 1.05, 'hollow': 1.2, 'cheek': 1.2,
               'lid': .35, 'socket': 2., 'es': .038, 'nl': 1.25, 'np': .028, 'hump': .004, 'nw': .012, 'lu': .0028, 'll': .0035, 'mw': .021, 'smile': -.002,
               'ear': 1.05, 'eo': .012, 'age': .6, 'gills': 1, 'iris': '#3a3a2a', 'bt': .004, 'bang': .2, 'hair': '#3a342c'}),
 'vill_body_3': ('#b8987e', 1., {'hair_style': 'side', 'part': .8, 'recede': .4, 'hair': '#5a4a3a', 'beard': 'mustache', 'glasses': 1, 'fat': .9, 'hw': 1.12, 'fl': .95, 'jw': 1.2,
               'chin': -.2, 'cheek': 0., 'eh': .0085, 'ew': .019, 'es': .042, 'lid': .3, 'nw': .019, 'np': .02, 'tw': .01, 'nl': .95, 'lu': .0035, 'll': .006, 'age': .6,
               'bt': .0055, 'barc': .1, 'iris': '#3a2a1c', 'blush': .15}),
 'cult_body': ('#8f8f7a', 1., {'hood': 1, 'hair_style': 'none', 'eyes': 'glow', 'hw': .88, 'fl': 1.1, 'hollow': 1.5, 'cheek': 1.4, 'nl': 1.1, 'np': .02, 'lu': .0022, 'll': .003,
               'brow': False, 'age': .8, 'ears': False}),
 'wom_body_0': (NSKIN, .9, {'hair_style': 'bun', 'hair': '#4a3424', 'hw': .94, 'hd': .97, 'fl': .98, 'jw': .88, 'chin': .1, 'cheek': .9, 'ew': .021, 'eh': .0105, 'es': .04,
               'tilt': .1, 'lid': .2, 'iris': '#4a3a2a', 'nl': .95, 'np': .018, 'nw': .011, 'tw': .006, 'mw': .019, 'lu': .0045, 'll': .006, 'bt': .0032, 'barc': .5,
               'blush': .18, 'age': .4, 'lip_c': '#9a5248'}),
 'wom_body_1': (NSKIN, .9, {'hair_style': 'kerchief', 'scarf': '#5a3a34', 'hair': '#3a2a1e', 'hw': .96, 'hd': .96, 'fl': .9, 'jw': .9, 'chin': -.05, 'fat': .25, 'cheek': .3,
               'ew': .022, 'eh': .0115, 'tilt': .04, 'iris': '#4a5a3a', 'nl': .85, 'np': .015, 'nw': .012, 'nup': 1., 'mw': .019, 'lu': .005, 'll': .0068, 'blush': .3,
               'bt': .0035, 'barc': .4, 'age': .1, 'lip_c': '#a8524a'}),
 'wom_body_2': (NSKIN, .9, {'hair_style': 'kerchief', 'scarf': '#2a2a30', 'hair': '#9a9588', 'hw': .9, 'fl': 1.02, 'jw': .85, 'hollow': .8, 'chin': .5, 'eh': .0085, 'lid': .5,
               'nl': 1.1, 'np': .024, 'hump': .003, 'lu': .0025, 'll': .0035, 'smile': -.003, 'age': 1., 'bt': .003, 'brow_c': '#8a857a', 'iris': '#4a4a44'}),
 'kid_body_0': (NSKIN, .74, {'hat': 'flatcap', 'hat_col': '#3a3a36', 'hair': '#5a3a24', 'hw': 1.0, 'fl': .82, 'cr': 1.05, 'jw': .86, 'chin': -.1, 'cheek': .1, 'ew': .023,
               'eh': .012, 'es': .039, 'nl': .7, 'np': .012, 'nw': .011, 'nup': 1., 'mw': .016, 'blush': .22, 'ear': 1.1, 'eo': .006, 'age': 0., 'iris': '#4a3424', 'bt': .0035}),
 'kid_body_1': (NSKIN, .74, {'hair_style': 'braids', 'hair': '#8a6a3a', 'fl': .8, 'hw': .98, 'jw': .84, 'cheek': .1, 'ew': .023, 'eh': .0125, 'tilt': .06, 'iris': '#3a5a7a',
               'nl': .7, 'np': .012, 'nw': .011, 'nup': 1., 'mw': .015, 'lu': .004, 'll': .005, 'freckles': 1, 'blush': .3, 'age': 0., 'bt': .003, 'barc': .4}),
 'doc_body': ('#c4a088', 1., {'hair_style': 'side', 'part': -.8, 'recede': .7, 'hair': '#2a2018', 'glasses': 1, 'eyes': 'sunken', 'hw': .95, 'hd': 1.04, 'fl': 1.08, 'jw': .95,
               'cr': 1.08, 'cheek': 1.0, 'hollow': .7, 'lid': .45, 'socket': 1.6, 'es': .039, 'iris': '#5a6a6a', 'nl': 1.12, 'np': .024, 'nw': .012, 'lu': .003, 'll': .004,
               'mw': .019, 'age': .5, 'bt': .0035, 'barc': .1, 'bang': -.1, 'stubble': .15}),
    'paul_body': ('#bfa08a', .95, {'hair_style': 'side', 'part': .5, 'recede': .9, 'hair': '#a6a298', 'beard': 'goatee', 'beard_c': '#b4b0a6', 'blen': .02, 'fl': 1.1, 'hw': .92, 'jw': .88,
               'hollow': .9, 'cheek': 1.1, 'eh': .0085, 'ew': .02, 'lid': .55, 'socket': 1.6, 'nl': 1.2, 'np': .027, 'hump': .005, 'nw': .013, 'lu': .0025, 'll': .0032, 'smile': -.004,
               'age': 1.0, 'bt': .005, 'brow_c': '#c0bcb2', 'barc': .1, 'bang': -.2, 'iris': '#5a5a44', 'ear': 1.15}),
    'matt_body': ('#c8a68c', 1., {'hair_style': 'side', 'part': .6, 'hair': '#4a3626', 'fl': 1.0, 'hw': .98, 'jw': 1.0, 'cheek': .6, 'chin': .2, 'eh': .0105, 'lid': .15, 'tilt': .02,
               'iris': '#4a6a7a', 'nl': 1.0, 'np': .02, 'mw': .021, 'lu': .004, 'll': .0055, 'smile': .002, 'age': .35, 'bt': .004, 'barc': .35, 'blush': .08}),
}
def head_kz(n): return {'kid_body_0': .66, 'kid_body_1': .66, 'vill_body_2': 1.05}.get(n, 1.)
HEAD_Z = 1.725
def head_asset(name, part):
    skin, k, st = HEADS[name]
    def fn(a): head(a, (0, -.005, HEAD_Z*head_kz(name)), skin, st, part)
    return fn
for _n in HEADS:
    for _p in ('head', 'jaw', 'lids'):
        BUILDERS[_n+'_'+_p] = (head_asset(_n, _p), {'ao': .8 if _p == 'head' else 0.})

@asset('hero_body')
def _(a):
    cfg = {'cloth': '#8a7450', 'cloth2': '#6f5c3e', 'skin': '#c9a183', 'trousers': '#3a3530'}
    cm, c2 = torso(a, cfg)
    skirtl(a, cfg, [.99, .82, .62], [.014, .03, .055], cm)
    collar(a, cfg, 1.49, 1.54, .016, c2)
    bv = body_bvh(a); O = V((0, 0, 0))
    shirt = a.m('shirt', '#c9c2b0'); tie = a.m('tie', '#a33a30'); bt = a.m('button', '#2a2016')
    cband(a, bv, O, [(-.065, 1.47), (0, 1.47), (.065, 1.47)], [(-.0, 1.3), (0, 1.29), (.0, 1.3)], shirt, .003)
    cband(a, bv, O, [(-.016, 1.45), (0, 1.455), (.016, 1.45)], [(-.006, 1.3), (0, 1.285), (.006, 1.3)], tie, .005)
    for s in (-1, 1): cband(a, bv, O, [(s*.065, 1.47), (s*.15, 1.45)], [(s*.004, 1.28), (s*.09, 1.25)], c2, .006)
    buttons(a, bv, [(.04, 1.18), (.04, 1.08), (.04, .9), (.04, .78)], bt)
    for s in (-1, 1): cband(a, bv, O, [(s*.07, .82), (s*.17, .82)], [(s*.07, .76), (s*.17, .76)], c2, .006)
@asset('vill_body_0')
def _(a):
    cfg = {'cloth': '#5a6b4a', 'skin': VSKIN, 'k': 1.08, 'trousers': '#33302c'}
    cm, c2 = torso(a, cfg)
    for z in (.9, 1.0, 1.1, 1.2): a.add(loft([tring_at(cfg, z-.012, .006), tring_at(cfg, z+.012, .006)], False, False), c2)
    collar(a, cfg, 1.48, 1.6, .03, c2)
    skirtl(a, cfg, [.99, .86], [.012, .02], c2)
@asset('vill_body_1')
def _(a):
    cfg = {'cloth': '#6b5346', 'skin': VSKIN, 'trousers': '#3a342e'}
    cm, c2 = torso(a, cfg)
    skirtl(a, cfg, [1.0, .8, .58], [.016, .035, .06], cm)
    bv = body_bvh(a); tg = a.m('toggle', '#c9b98a')
    for z in (1.35, 1.2, 1.05): cband(a, bv, V((0, 0, 0)), [(-.02, z+.008), (.02, z+.008)], [(-.02, z-.008), (.02, z-.008)], tg, .005)
    collar(a, cfg, 1.47, 1.56, .04, a.m('scarf', '#5a2a2a'))
@asset('vill_body_2')
def _(a):
    cfg = {'cloth': '#4f5d6b', 'skin': VSKIN, 'k': .92, 'kz': 1.05, 'trousers': '#2e2c2a'}
    cm, c2 = torso(a, cfg)
    skirtl(a, cfg, [1.04, .82, .56], [.014, .03, .055], cm)
    collar(a, cfg, 1.56, 1.62, .016, c2)
@asset('vill_body_3')
def _(a):
    cfg = {'cloth': '#77705f', 'skin': '#b8987e', 'k': 1.16, 'kd': 1.05, 'fat': 1.0, 'trousers': '#33302c'}
    cm, c2 = torso(a, cfg)
    ap = a.m('apron', '#b9b4a4')
    skirtl(a, cfg, [1.36, 1.1, .95, .62], [.012, .012, .02, .06], ap, cut=lambda c: c.y > -.02)
    a.add(loft([tring_at(cfg, 1.035, .016), tring_at(cfg, 1.06, .016)], False, False), ap)
    collar(a, cfg, 1.49, 1.54, .014, c2)
@asset('cult_body')
def _(a):
    rb = a.m('robe', '#4d1d22'); rb2 = a.m('robe2', '#32131a'); rb3 = a.m('robe3', '#5e262b'); rope = a.m('rope', '#b9a36a'); sig = a.m('sigil', '#5fd6c0', .6)
    prof = [(.44, .01), (.4, .25), (.34, .6), (.27, .95), (.24, 1.2), (.23, 1.38), (.18, 1.5), (.09, 1.56)]
    fold = lambda ang, z: 1+.075*sin(ang*7+z*2.5)*max(0, 1-z/1.5)+.02*sin(ang*13)
    bm = lathe(prof, 18, rf=fold, cap0=True, cap1=True)
    a.add(bm, lambda f: (rb2 if sin(atan2(f.calc_center_median().y, f.calc_center_median().x)*7+f.calc_center_median().z*2.5) < -.3 else (rb3 if sin(atan2(f.calc_center_median().y, f.calc_center_median().x)*7) > .8 else rb)))
    a.add(lathe([(.34, 1.18), (.3, 1.32), (.2, 1.5), (.1, 1.58)], 14, rf=lambda ang, z: 1+.05*sin(ang*6), cap0=False, cap1=False), rb2)
    a.add(dbl(lathe([(.34, 1.18), (.3, 1.32)], 14, cap0=False, cap1=False)), rb2)
    a.add(tube([V((cos(t)*.255, sin(t)*.255, .98)) for t in [k/16*2*pi for k in range(17)]], .018, 4, False, False), rope)
    for s in (-1, 1): a.add(tube([(s*.06, -.25, .97), (s*.08, -.29, .7), (s*.07, -.31, .5)], [.014, .013, .02], 4), rope)
    a.add(cyl(.045, .045, .012, 10, T=Tr(0, -.215, 1.26) @ Rx(pi/2+.25)), rope); a.add(box(.06, .016, .012, (0, -.224, 1.265)), sig); a.add(box(.012, .016, .06, (0, -.224, 1.265)), sig)
def woman(a, cloth, skirt_col, apron=None, shawl=None):
    cfg = {'cloth': cloth, 'skin': NSKIN, 'k': .9, 'kd': .95, 'sex': 'f'}
    cm, c2 = torso(a, cfg); sm = a.m('skirt', skirt_col)
    skirtl(a, cfg, [1.0, .85, .6, .3, .07], [.008, .05, .09, .125, .145], sm, fold=.25)
    a.add(loft([tring_at(cfg, .98, .01), tring_at(cfg, 1.02, .012)], False, False), sm)
    if apron:
        skirtl(a, cfg, [1.0, .8, .5, .2], [.022, .07, .115, .15], a.m('apron', apron), cut=lambda c: c.y > -.06 or abs(c.x) > .16)
        skirtl(a, cfg, [1.32, 1.1, 1.0], [.006, .008, .014], a.m('apron', apron), cut=lambda c: c.y > -.04 or abs(c.x) > .11)
    if shawl:
        sw = a.m('shawl', shawl)
        skirtl(a, cfg, [1.52, 1.47, 1.38, 1.24], [.02, .03, .03, .028], sw, fold=.3)
        a.add(dbl(tri_fan([V((-.16, .105, 1.42)), V((.16, .105, 1.42)), V((0, .14, 1.02))])), sw)
    collar(a, cfg, 1.5, 1.53, .01, c2)
@asset('wom_body_0')
def _(a): woman(a, '#5a4a5a', '#3a3440', shawl='#7a6a58')
@asset('wom_body_1')
def _(a): woman(a, '#6a5a44', '#4a3a2e', apron='#cfc8b4')
@asset('wom_body_2')
def _(a): woman(a, '#3a3a3e', '#2a2a2e', shawl='#4a4a46')
@asset('kid_body_0')
def _(a):
    cfg = {'cloth': '#4a5a6a', 'skin': NSKIN, 'k': .74, 'kz': .66, 'trousers': '#3a3836'}
    cm, c2 = torso(a, cfg); skirtl(a, cfg, [.66, .56], [.01, .02], cm); collar(a, cfg, .985, 1.02, .012, c2)
    bv = body_bvh(a); buttons(a, bv, [(0, .9), (0, .82), (0, .74)], a.m('button', '#2a2016'), r=.007)
@asset('kid_body_1')
def _(a):
    cfg = {'cloth': '#7a4a44', 'skin': NSKIN, 'k': .74, 'kz': .66, 'sex': 'f'}
    cm, c2 = torso(a, cfg); dm = a.m('skirt', '#6a3e3a')
    skirtl(a, cfg, [.66, .55, .42, .32], [.006, .04, .075, .09], dm, fold=.25)
    collar(a, cfg, .99, 1.01, .012, a.m('collar', '#d8d0c0'))
@asset('doc_body')
def _(a):
    cfg = {'cloth': '#2e3034', 'cloth2': '#202226', 'skin': '#c4a088', 'trousers': '#2a2a2e'}
    cm, c2 = torso(a, cfg)
    bv = body_bvh(a); O = V((0, 0, 0))
    shirt = a.m('shirt', '#d8d2c2'); tie = a.m('tie', '#1e2a2a'); coat = a.m('labcoat', '#cfcab8'); coat2 = a.m('labcoat2', '#b8b3a2')
    cband(a, bv, O, [(-.07, 1.47), (0, 1.47), (.07, 1.47)], [(-.0, 1.28), (0, 1.27), (.0, 1.28)], shirt, .003)
    cband(a, bv, O, [(-.015, 1.45), (0, 1.455), (.015, 1.45)], [(-.006, 1.3), (0, 1.285), (.006, 1.3)], tie, .005)
    skirtl(a, cfg, [1.49, 1.44, 1.3, 1.1, .95, .75, .5], [.012, .024, .026, .03, .036, .055, .075], coat, fold=.15, cut=lambda c: c.y < -.06 and abs(c.x) < (.075 if c.z > 1.2 else .05))
    collar(a, cfg, 1.49, 1.55, .02, coat2)
    for s in (-1, 1): a.add(dbl(tri_fan([V((s*.075, -.15, 1.47)), V((s*.15, -.11, 1.47)), V((s*.06, -.16, 1.22))])), coat2)
    for s in (-1, 1): a.add(box(.08, .02, .1, (s*.16, -.175, .85)), coat2)
    a.add(box(.012, .03, .1, (.13, -.17, 1.33)), a.m('pen', '#2a2a2a'))

def cassock(a, cloth, skin, k=1.0):
    cfg = {'cloth': cloth, 'skin': skin, 'k': k, 'robe': 1, 'nobelt': 1}
    cm, c2 = torso(a, cfg)
    skirtl(a, cfg, [.99, .8, .5, .25, .07], [.01, .04, .07, .09, .1], cm, fold=.15)
    return cfg, cm, c2
@asset('paul_body')
def _(a):
    cfg, cm, c2 = cassock(a, '#1e1a1c', '#bfa08a', .95)
    collar(a, cfg, 1.47, 1.56, .016, c2)
    a.add(loft([tring_at(cfg, .94, .016), tring_at(cfg, .97, .016)], False, False), a.m('rope', '#7a6a4a'))
    for s in (-1, 1): a.add(tube([(s*.05, -.13, .95), (s*.07, -.15, .7), (s*.06, -.17, .5)], [.01, .009, .014], 4), a.m('rope', '#7a6a4a'))
    bv = body_bvh(a); O = V((0, 0, 0))
    a.add(tube([V((cos(t)*.075, sin(t)*.07-.005, 1.53)) for t in [k_/10*2*pi for k_ in range(11)]], .005, 3, False, False), a.m('chain', '#6a6458', .1))
    for (x0, z0) in ((-.05, 1.5), (.05, 1.5)): a.add(tube([V((x0, -.11, z0)), V((0, -.135, 1.3))], .004, 3, False, False), a.m('chain', '#6a6458', .1))
    cband(a, bv, O, [(-.028, 1.3), (0, 1.33), (.028, 1.3)], [(-.028, 1.27), (0, 1.24), (.028, 1.27)], a.m('amulet', '#2a4a44', .2), .012)
    cband(a, bv, O, [(-.016, 1.296), (0, 1.315), (.016, 1.296)], [(-.016, 1.276), (0, 1.256), (.016, 1.276)], a.m('sigil', '#5fd6c0', .7), .016)
    buttons(a, bv, [(0, z) for z in (1.42, 1.34, 1.18, 1.1, 1.02)], a.m('button', '#0e0c0c'), r=.007)
@asset('matt_body')
def _(a):
    cfg, cm, c2 = cassock(a, '#16161a', '#c8a68c')
    wc = a.m('whitecollar', '#e8e4d8')
    collar(a, cfg, 1.49, 1.56, .014, cm)
    a.add(loft([tring_at(cfg, 1.555, .02), tring_at(cfg, 1.585, .018)], False, False), wc)
    bv = body_bvh(a); O = V((0, 0, 0))
    cband(a, bv, O, [(-.014, 1.56), (.014, 1.56)], [(-.014, 1.53), (.014, 1.53)], wc, .03)
    sv = a.m('silver', '#b8bcc0', .15)
    a.add(tube([V((cos(t)*.07, sin(t)*.065-.004, 1.52)) for t in [k_/10*2*pi for k_ in range(11)]], .0035, 3, False, False), sv)
    cband(a, bv, O, [(-.004, 1.36), (.004, 1.36)], [(-.004, 1.26), (.004, 1.26)], sv, .012)
    cband(a, bv, O, [(-.022, 1.33), (.022, 1.33)], [(-.022, 1.32), (.022, 1.32)], sv, .012)
    buttons(a, bv, [(0, z) for z in (1.44, 1.36, 1.2, 1.12, 1.04, .96)], a.m('button', '#0a0a0c'), r=.0065)
# ---------------------------------------------------------------- limb segments
def seg_loft(pts, sizes, kind='oct', n=8, c0='chamfer', c1='chamfer'):
    return f_loft([V(p) for p in pts], sizes, ref=(0, -1, 0), kind=kind, n=n, cap0=c0, cap1=c1, smooth=0)
@asset('arm_up', ao=.6)
def _(a):
    cl = a.m('cloth', '#808080')
    a.add(seg_loft([(0, .0, .055), (0, 0, .02), (0, .004, -.06), (0, .004, -.18), (0, 0, -ARM_L[0]-.01)], [(.05, .048), (.074, .07), (.07, .066), (.06, .057), (.054, .052)]), cl)
    a.add(seg_loft([(0, .01, -.05), (0, .01, -.16)], [(.05, .056), (.044, .05)], c0='point', c1='point'), cl)   # biceps plate
@asset('arm_lo', ao=.6)
def _(a):
    cl = a.m('cloth', '#808080'); cf = a.m('cuff', '#606060'); sk = a.m('skin', NSKIN)
    a.add(seg_loft([(0, 0, .045), (0, 0, 0), (0, -.006, -.1), (0, -.006, -.215)], [(.045, .045), (.058, .056), (.054, .052), (.047, .045)]), cl)
    a.add(seg_loft([(0, -.006, -.2), (0, -.004, -.245)], [(.052, .05), (.05, .048)], c0='flat', c1='chamfer'), cf)
    a.add(seg_loft([(0, -.004, -.22), (0, 0, -ARM_L[1]-.012)], [(.03, .026), (.028, .024)]), sk)
@asset('robe_up', ao=.6)
def _(a):
    cl = a.m('cloth', '#4d1d22')
    a.add(seg_loft([(0, 0, .055), (0, 0, .02), (0, .0, -.15), (0, 0, -ARM_L[0]-.01)], [(.06, .058), (.085, .08), (.088, .085), (.095, .09)]), cl)
@asset('robe_lo', ao=.6)
def _(a):
    cl = a.m('cloth', '#4d1d22'); cf = a.m('cuff', '#32131a'); sk = a.m('skin', '#8f8f7a'); inn = a.m('hood_in', '#0c0708')
    a.add(seg_loft([(0, 0, .05), (0, 0, 0), (0, -.01, -.14), (0, -.012, -.25)], [(.07, .07), (.09, .088), (.11, .11), (.14, .135)], c1=None), cl)
    a.add(seg_loft([(0, -.012, -.24), (0, -.012, -.262)], [(.145, .14), (.146, .141)], c0=None, c1=None), cf)
    inner = seg_loft([(0, -.01, -.14), (0, -.012, -.262)], [(.1, .1), (.135, .13)], c0=None, c1=None); bmesh.ops.reverse_faces(inner, faces=list(inner.faces)); a.add(inner, inn)
    a.add(seg_loft([(0, 0, -.12), (0, 0, -ARM_L[1]-.012)], [(.032, .03), (.028, .025)]), sk)
def hand(a, side):
    sk = a.m('skin', NSKIN); sd = a.m('skin2', mix(NSKIN, '#000000', .12)); bm = bmesh.new(); A_ = A('tmp')
    # palm faces +x (the body's centre line for a right hand hanging at -x); thumb on the front (-y)
    A_.add(f_loft([V((0, .0, .012)), V((0, -.002, -.035)), V((.002, -.002, -HAND_L))], [(.017, .034), (.02, .041), (.016, .043)], ref=(0, -1, 0), kind='oct', ch=.45, cap0='chamfer', cap1='chamfer', smooth=0), 0)
    A_.add(f_loft([V((.008, -.03, -.016)), V((.02, -.05, -.045)), V((.03, -.058, -.072)), V((.034, -.058, -.088))], [(.012, .013), (.012, .012), (.01, .01), (.008, .008)], ref=(1, 0, 0), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), 0)
    bm = A_.bm
    if side > 0: mirror_x(bm)
    a.add(bm, sk)
def fingers(a, side):
    sk = a.m('skin', NSKIN); A_ = A('tmp')
    for (y, L) in ((-.031, .068), (-.011, .076), (.01, .071), (.029, .057)):
        A_.add(f_loft([V((0, y, .008)), V((.006, y, -L*.52)), V((.017, y, -L*.92)), V((.022, y, -L))], [(.0105, .0095), (.0095, .009), (.008, .0078), (.006, .006)], ref=(0, -1, 0), kind='n', n=6, cap0='chamfer', cap1='chamfer', smooth=0), 0)
    bm = A_.bm
    if side > 0: mirror_x(bm)
    a.add(bm, sk)
def fist(a, side):
    """fingers rolled into the palm (knuckle frame): they wrap a grip that runs front-to-back just past the knuckles"""
    sk = a.m('skin', NSKIN); A_ = A('tmp')
    for (y, k) in ((-.031, 1.0), (-.011, 1.06), (.01, 1.0), (.029, .86)):
        A_.add(f_loft([V((-.002, y, .01)), V((.004, y, -.024*k)), V((.026, y, -.036*k)), V((.042*k, y, -.018*k)), V((.04*k, y, .006))],
                      [(.0105, .0095), (.0105, .0095), (.0095, .009), (.0085, .0082), (.007, .007)], ref=(0, -1, 0), kind='n', n=6, cap0='chamfer', cap1='chamfer', smooth=0), 0)
    bm = A_.bm
    if side > 0: mirror_x(bm)
    a.add(bm, sk)
@asset('fist_R', ao=.4)
def _(a): fist(a, -1)
@asset('fist_L', ao=.4)
def _(a): fist(a, 1)
@asset('hand_R', ao=.5)
def _(a): hand(a, -1)
@asset('hand_L', ao=.5)
def _(a): hand(a, 1)
@asset('fing_R', ao=.4)
def _(a): fingers(a, -1)
@asset('fing_L', ao=.4)
def _(a): fingers(a, 1)
@asset('leg_up', ao=.6)
def _(a):
    tr = a.m('trousers', '#808080')
    a.add(seg_loft([(0, 0, .07), (0, 0, .02), (0, -.01, -.15), (0, -.012, -.3), (0, -.004, -LEG_L[0]-.01)], [(.066, .064), (.09, .088), (.082, .08), (.068, .066), (.06, .058)]), tr)
@asset('leg_lo', ao=.6)
def _(a):
    tr = a.m('trousers', '#808080'); bt = a.m('boot', '#1c1a18')
    a.add(seg_loft([(0, 0, .05), (0, -.004, 0), (0, .006, -.12), (0, .004, -.27)], [(.052, .052), (.064, .062), (.062, .06), (.052, .05)]), tr)
    a.add(seg_loft([(0, -.006, .012), (0, -.012, -.03)], [(.03, .012), (.034, .012)], kind='oct', c0='chamfer', c1='chamfer'), tr)   # kneecap plate
    a.add(seg_loft([(0, .004, -.25), (0, .002, -LEG_L[1]-.01)], [(.056, .056), (.054, .054)], c0='flat'), bt)
def foot_(a, boot, sole, k=1.0):
    bt = a.m('boot', boot); so = a.m('sole', sole)
    a.add(seg_loft([(0, .0, .03), (0, 0, -.04)], [(.05*k, .05*k), (.052*k, .056*k)]), bt)
    a.add(f_loft([V((0, .045, -.045)), V((0, -.03, -.05)), V((0, -.11, -.058)), V((0, -.165*k, -.062))], [(.05*k, .038), (.052*k, .036), (.05*k, .028), (.038*k, .02)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), bt)
    a.add(f_loft([V((0, .06, -ANKLE+.011)), V((0, -.17*k, -ANKLE+.011))], [(.055*k, .011), (.045*k, .011)], ref=(0, 0, 1), kind='oct', ch=.6, cap0='chamfer', cap1='chamfer', smooth=0), so)
@asset('foot', ao=.6)
def _(a): foot_(a, '#1c1a18', '#0e0d0c')
@asset('shoe', ao=.6)
def _(a): foot_(a, '#2a221c', '#141210', .85)
@asset('stock_lo', ao=.6)
def _(a):
    s = a.m('stock', '#2a2624')
    a.add(seg_loft([(0, 0, .04), (0, .004, -.1), (0, .002, -.25), (0, 0, -LEG_L[1]-.01)], [(.046, .046), (.05, .05), (.038, .038), (.034, .034)]), s)
# weapons, held in the fist: origin at the grip, shaft along -Y (game +Z)
@asset('wpn_crowbar', ao=.3)
def _(a): a.add(tube([(0, .1, 0), (0, -.85, -.02), (0, -.95, .06), (0, -.9, .12)], .016, 5), a.m('steel', '#7d8388', .1))
@asset('wpn_club', ao=.3)
def _(a):
    w = a.m('club', '#6b5134'); a.add(tube([(0, .08, 0), (0, -.45, -.01), (0, -.95, .0)], [.026, .038, .06], 6), w)
    for i in range(3): a.add(ico(.022, 0, (.03*(-1)**i, -.6-i*.12, .03*(-1)**i)), w)
@asset('wpn_torch', ao=.3)
def _(a):
    w = a.m('shaft', '#3a2a1a'); c = a.m('wrap', '#2a2018'); e = a.m('ember', '#ff8a2a', .9)
    a.add(tube([(0, .08, 0), (0, -.5, -.03), (0, -.82, -.06)], [.02, .022, .026], 5), w)
    a.add(cyl(.05, .058, .18, 7, T=Tr(0, -.82, -.06) @ Rx(pi/2) @ Tr(0, 0, -.16)), c)
    for i in range(5): a.add(ico(.016, 0, (cos(i*1.3)*.05, -.88-i*.015, -.06+sin(i*1.3)*.05)), e)
@asset('flame', ground=False, ao=0)
def _(a):
    o = a.m('outer', '#ff7a1a', 1.0); i = a.m('inner', '#ffe08a', 1.0)
    a.add(lathe([(.09, 0), (.13, .08), (.1, .2), (.05, .3), (0, .4)], 7, rf=lambda ang, z: 1+.25*sin(ang*3+z*9)), o)
    a.add(lathe([(.05, .02), (.07, .08), (.04, .18), (0, .26)], 6), i)
@asset('stall')
def _(a):
    rr = random.Random(5); w = a.m('wood', WOOD); wd = a.m('woodd', WOODD); c1 = a.m('awn1', '#7a3a2a'); c2 = a.m('awn2', '#cfc6a8'); fish = a.m('fish', '#8a9a94'); fish2 = a.m('fish2', '#6a7a76'); ice = a.m('ice', '#9fb4b8', .05); veg = a.m('veg', '#6a7a3a'); veg2 = a.m('veg2', '#8a5a2a')
    a.add(box(2.6, 1.1, .08, (0, 0, .85)), w); a.add(box(2.5, 1.0, .75, (0, .05, .42)), wd)
    for sx in (-1.25, 1.25):
        for sy in (-.5, .5): a.add(box(.08, .08, 2.2 if sy < 0 else 2.5, (sx, sy, 1.1 if sy < 0 else 1.25)), wd)
    n = 6
    for k in range(n):
        x = -1.35+2.7/n*(k+.5); a.add(box(2.7/n, 1.4, .04, (x, -.15, 2.35), T=Tr(x, -.15, 2.35) @ Rx(-.25) @ Tr(-x, .15, -2.35)), c1 if k % 2 else c2)
    a.add(box(2.4, .9, .08, (0, -.02, .93)), ice)
    for i in range(14): a.add(sph(.06, .2, .04, (rr.uniform(-1.1, 1.1), rr.uniform(-.35, .3), .99), 6, 4), fish if i % 3 else fish2)
    for (x, y) in ((-1.6, .1), (1.6, .2)):
        a.add(box(.5, .4, .3, (x, y, .15)), w)
        for j in range(6): a.add(sph(.06, .06, .06, (x+rr.uniform(-.18, .18), y+rr.uniform(-.12, .12), .32), 5, 3), veg if x < 0 else veg2)
@asset('schooner', ground=False)
def _(a):
    m = (a.m('hull', '#3e3a34'), a.m('hull2', '#2a2622'), a.m('inner', '#6b5a44'), a.m('trim', '#7a2a24'))
    hull(a, 15, 4.4, 2.2, m, 7); wd = a.m('wood', WOOD); wdd = a.m('woodd', WOODD); sail = a.m('sail', '#b8ae94'); rope = a.m('rope', '#4a4034'); win = a.m('win', '#e2a94a', .8)
    a.add(box(3.4, 2.6, .12, (0, 2.0, 2.2)), wd); a.add(box(2.4, 2.2, 1.3, (0, 2.8, 2.85)), wdd); a.add(box(2.7, 2.5, .14, (0, 2.8, 3.55)), wd)
    for x in (-1.21, 1.21): a.add(box(.06, .5, .4, (x, 2.8, 3.0)), win)
    for (y, hgt) in ((-2.6, 10), (2.0, 8.5)):
        a.add(tube([(0, y, 2.0), (0, y, 2.0+hgt)], [.14, .08], 6), wdd)
        a.add(tube([(0, y, 3.2), (0, y+4.0, 3.0)], .07, 5), wdd)
        a.add(tube([(0, y+.2, 3.25), (0, y+3.8, 3.1)], .2, 6, sq=.6), sail)
        for s_ in (-1, 1): a.add(tube([(0, y, 2.0+hgt-.3), (s_*2.0, y+.5, 2.4)], .02, 3), rope)
    a.add(tube([(0, -2.6, 11.7), (0, -7.4, 2.6)], .025, 3), rope); a.add(tube([(0, 2.0, 10.3), (0, 7.2, 2.9)], .025, 3), rope)
    a.add(tube([(0, -7.0, 2.4), (0, -9.6, 3.0)], [.1, .05], 5), wdd)
    rr = random.Random(8)
    for i in range(5):
        b = ico(.45, 1, (rr.uniform(-1, 1), rr.uniform(-5, -3.5), 2.4)); xform(b, Sc(1, 1, .5)); displace(b, .1, 3, i); a.add(b, a.m('net', '#3d4a44'))
# ================================================================ THE SERUM: a man turning into a deep one, four stages (deep_1 .. deep_4)
# 1: patches of real scales (angled overlapping plates) on the neck, cheek, forearms, hands
# 2: wider scales, little fins on the forearms, webs between the fingers, small gill slits
# 3: fish face (no lips, no hair, bulging eyes, flat nose), crest and dorsal ridge, gill flaps, torn and ragged clothes
# 4: a fish-mutant that is still man-shaped: hunched, huge fins and spines, gill fans, barbels, teeth, clawed webbed hands and feet
def scale_cover(a, bvh, p0, p1, r0, s, mats, seed=0, ang=(-pi, pi), keep=None, R=.6, lift=.2, edge=.3):
    """overlapping fish scales over the surface around the axis p0 -> p1 (scales point towards p0)"""
    rr = random.Random(seed); p0 = V(p0); p1 = V(p1); ax = (p1-p0); L = ax.length; ax.normalize()
    ref = V((0, 1, 0)) if abs(ax.z) >= .9 else V((0, 0, 1)); u = ref.cross(ax).normalized(); w = ax.cross(u).normalized()
    bm = bmesh.new(); row = 0; t = 0.0
    while t <= L:
        da = s/r0; a0 = ang[0] + (da*.5 if row % 2 else 0); an = a0
        while an <= ang[1]:
            # ragged patch edges
            ea = min(an-ang[0], ang[1]-an)/max(.01, ang[1]-ang[0]); et = min(t, L-t)/max(.01, L)
            if min(ea, et) < edge*rr.random()*.6: an += da; continue
            c = p0 + ax*t; d = u*cos(an) + w*sin(an)
            loc, nn, i_, d_ = bvh.ray_cast(c + d*R + V((rr.uniform(-1, 1), rr.uniform(-1, 1), rr.uniform(-1, 1)))*s*.12, -d, R*1.2)
            if loc is not None and ((loc-c) - ax*(loc-c).dot(ax)).length > r0*2.6: loc = None   # hit some other part (clothes, another limb)
            if loc is not None and (keep is None or keep(loc)):
                nn = nn.normalized(); uu = ax.cross(nn)
                if uu.length > 1e-3:
                    uu.normalize(); vv = nn.cross(uu)
                    k = s*(.78+rr.uniform(0, .14)); b = loc + nn*.0015   # a flat shield of angled plates, tip down, overlapping the row below
                    ring = [b + vv*k*.5 + nn*k*.02, b + uu*k*.52 + vv*k*.12, b + uu*k*.38 - vv*k*.45, b - vv*k*.85 + nn*k*lift*.6, b - uu*k*.38 - vv*k*.45, b - uu*k*.52 + vv*k*.12]
                    vs = [bm.verts.new(p) for p in ring]; ap = bm.verts.new(b - vv*k*.25 + nn*k*lift); m = mats[rr.randrange(len(mats))]
                    for i in range(6):
                        f = bm.faces.new((vs[i], vs[(i+1) % 6], ap)); f.material_index = m
            an += da
        t += s*.62; row += 1
    bm.normal_update()
    for f in bm.faces:
        cc = f.calc_center_median(); tt = (cc-p0).dot(ax); out = cc - (p0 + ax*tt)
        if f.normal.dot(out) < 0: f.normal_flip()
    a.add(bm, lambda f: f.material_index)
def fin(a, base, tops, mat, ray=None):
    """a thin fin (double sided) between a base line and a jagged top line, with darker rays"""
    bm = bmesh.new(); B = [bm.verts.new(V(p)) for p in base]; T = [bm.verts.new(V(p)) for p in tops]
    for i in range(len(B)-1): bm.faces.new((B[i], B[i+1], T[i+1], T[i]))
    a.add(dbl(bm), mat)
    if ray is not None:
        for b, t in zip(base, tops): a.add(f_loft([V(b), V(t)], [(.006, .006), (.0025, .0025)], kind='n', n=4, cap0='flat', cap1=1.2, smooth=0), ray)
def surf_hit(bvh, o, d, far=2.0):
    loc, n, i_, d_ = bvh.ray_cast(V(o), V(d).normalized(), far); return (loc, n) if loc is not None else (None, None)
def limbL(a, pts, rad, mat): a.add(f_loft([V(p) for p in pts], rad, kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), mat)
def deep_hand(a, w, d, s, sk, nail, web, stage):
    """palm faces the body (normal (-s,0,0)); fingers curl a little towards the palm; webs and claws by stage"""
    w = V(w); d = V(d).normalized(); pn = V((-s, 0, 0)); fr = V((0, -1, 0)); k = 1 + .14*max(0, stage-2)
    a.add(f_loft([w + d*.005, w + d*.05, w + d*.095*k], [(.018, .036), (.021, .042), (.018, .045)], ref=(0, -1, 0), kind='oct', ch=.45, cap0='chamfer', cap1='chamfer', smooth=0), sk)
    K = w + d*.095*k; tips = []; mids = []; bases = []
    for j, (y, L) in enumerate(((-.031, .07), (-.011, .078), (.011, .073), (.03, .06))):   # y<0: index finger at the front, next to the thumb
        L *= 1 + .3*max(0, stage-2); b = K - fr*y*k; m = b + d*L*.52 + pn*.008; t = b + d*L + pn*.022
        a.add(f_loft([b, m, t], [(.0105, .0095), (.0095, .009), (.007, .007)], ref=(0, -1, 0), kind='n', n=6, cap0='chamfer', cap1='chamfer' if stage < 4 else 2.2, smooth=0), sk)
        if stage >= 3: a.add(f_loft([t - d*.004, t + d*(.018 if stage == 3 else .034) + pn*.012], [(.0065, .006), (.001, .001)], kind='n', n=5, cap0='flat', cap1='point', smooth=0), nail)
        tips.append(t); mids.append(m); bases.append(b)
    th = [w + d*.02 + fr*.03 + pn*.01, w + d*.05 + fr*.052 + pn*.025, w + d*.08 + fr*.06 + pn*.035]   # the thumb on the front edge
    a.add(f_loft(th, [(.012, .012), (.011, .011), (.008, .008)], kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk)
    if stage >= 2:   # webs between the fingers (and the thumb), a little behind the palm line
        reach = {2: .45, 3: .75, 4: .95}[stage]
        for i in range(3):
            bm = bmesh.new(); p = [bases[i], bases[i+1], bases[i+1].lerp(tips[i+1], reach), bases[i].lerp(tips[i], reach)]
            mid = (p[2]+p[3])/2 - d*.006; vs = [bm.verts.new(q + pn*.002) for q in p]; mv = bm.verts.new(mid)
            bm.faces.new((vs[0], vs[1], vs[2], mv)); bm.faces.new((vs[0], mv, vs[3])); a.add(dbl(bm), web)
        bm = bmesh.new(); vs = [bm.verts.new(q) for q in (w + d*.03 + fr*.03, th[-1], bases[0].lerp(tips[0], reach*.6), bases[0])]; bm.faces.new(vs); a.add(dbl(bm), web)
    return tips
DEEP_SKIN = {1: '#bba893', 2: '#a8a48c', 3: '#8a9884', 4: '#5f7468'}
DEEP_HEAD = {
 1: {'hair_style': 'short', 'hair': '#3a2e24', 'stubble': .35, 'fl': 1.02, 'jw': 1.06, 'iris': '#4a4a3a', 'age': .35, 'bt': .005},
 2: {'hair_style': 'short', 'recede': .6, 'hair': '#3a2e24', 'stubble': .2, 'fl': 1.0, 'jw': 1.1, 'eh': .012, 'ew': .022, 'lid': .05, 'es': .043, 'nw': .016, 'np': .017,
     'iris': '#2a2a1c', 'age': .4, 'bt': .004, 'gills': 1, 'lip_c': '#8a6a5e'},
 3: {'hair_style': 'none', 'eyes': 'bulge', 'ew': .027, 'eh': .017, 'es': .05, 'tilt': -.12, 'nl': .65, 'np': .007, 'nw': .021, 'mw': .033, 'lu': .0012, 'll': .0014,
     'lip_c': '#5e6a5a', 'brow': False, 'ears': False, 'gills': 1, 'hw': 1.12, 'hd': 1.02, 'jw': 1.28, 'chin': -.8, 'fl': .95, 'cheek': 0., 'cr': .92, 'socket': 0., 'iris': '#1a1a10'},
 4: {'hair_style': 'none', 'eyes': 'bulge', 'ew': .032, 'eh': .021, 'es': .058, 'tilt': -.18, 'nl': .45, 'np': .003, 'nw': .024, 'mw': .046, 'lu': .001, 'll': .001,
     'lip_c': '#2a3a30', 'brow': False, 'ears': False, 'gills': 1, 'hw': 1.3, 'hd': 1.14, 'jw': 1.5, 'chin': -1.1, 'fl': .9, 'cheek': 0., 'cr': .84, 'socket': 0., 'iris': '#e0c040',
     'white': '#c8c49a'}}
def deep_one(a, stage):
    rr = random.Random(stage*31); skin = DEEP_SKIN[stage]
    sk = a.m('skin', skin); sk2 = a.m('skin2', mix(skin, '#000000', .14)); belly = a.m('belly', mix(skin, '#e8e2c8', .35 if stage == 4 else .18))
    sc = [a.m('scale%d' % i, c) for i, c in enumerate([mix(skin, '#2a4a44', .25+.1*stage), mix(skin, '#6a8a7a', .2+.08*stage), mix(skin, '#1e2e2a', .2+.12*stage)])]
    finm = a.m('fin', mix(skin, '#7a5a4a' if stage < 4 else '#3a5a52', .45)); ray = a.m('finray', mix(skin, '#1a1410', .5)); web = a.m('web', mix(skin, '#c89a8a', .35))
    nail = a.m('claw', '#2a2620'); shirt_c = '#7a6248'; tr_c = '#34363c'
    clothed_torso = stage <= 2
    cfg = {'cloth': shirt_c if clothed_torso else skin, 'skin': skin, 'k': 1.0 + .08*max(0, stage-2), 'trousers': tr_c if stage < 4 else skin, 'nobelt': stage >= 3}
    torso(a, cfg)
    C = V((0, -.005, 1.725)); head(a, C, skin, DEEP_HEAD[stage]); head(a, C, skin, DEEP_HEAD[stage], 'jaw') if stage < 4 else None
    # arms: shoulder → elbow → wrist; rolled sleeves (1, 2), a torn stump of a sleeve (3), bare (4)
    arms = []
    for s in (-1, 1):
        S_ = V((s*.2, 0, 1.4)); E = V((s*.3, -.03, 1.12)); W_ = V((s*.335, -.1, .885))
        wd = 1 + .08*max(0, stage-2)
        if stage <= 2:
            limbL(a, [S_ + V((0, 0, .05)), S_, (S_+E)/2, E], [(.06*wd, .06), (.074, .07), (.066, .064), (.058, .056)], a.m('cloth', shirt_c))
            limbL(a, [E + (E-S_).normalized()*-.02, E + (W_-E)*.18], [(.066, .064), (.064, .062)], a.m('cloth2', mix(shirt_c, '#000000', .2)))
        else:
            limbL(a, [S_ + V((0, 0, .05)), S_, (S_+E)/2, E], [(.06*wd, .06*wd), (.076*wd, .072*wd), (.068*wd, .066*wd), (.058*wd, .056*wd)], sk)
        limbL(a, [E, (E+W_)/2 + V((s*.004, 0, 0)), W_], [(.052*wd, .05*wd), (.048*wd, .046*wd), (.034*wd, .03*wd)], sk)
        arms.append((s, S_, E, W_))
    tips = {}
    for (s, S_, E, W_) in arms: tips[s] = deep_hand(a, W_, (W_-E), s, sk, nail, web, stage)
    # legs (trousers; stage 3 ragged; stage 4 bare scaled legs)
    legm = a.m('trousers', tr_c) if stage < 4 else sk
    for s in (-1, 1):
        H_ = V((s*.095, 0, .9)); K_ = V((s*.1, -.03, .48)); A_ = V((s*.1, 0, .085))
        limbL(a, [H_ + V((0, 0, .06)), H_, (H_+K_)/2, K_], [(.07, .068), (.09, .088), (.078, .076), (.064, .062)], legm)
        limbL(a, [K_ + V((0, 0, .04)), K_, (K_+A_)/2 + V((0, .01, 0)), A_ + V((0, 0, .02))], [(.056, .056), (.064, .062), (.058, .056), (.05, .05)], legm)
    a.bm.normal_update(); bvh = BVHTree.FromBMesh(a.bm)
    # ---- scales (on the skin, under the clothes that come later)
    notface = lambda p: not ((p - C).y < -.06 and abs((p-C).x) < .065 and -.11 < (p-C).z < .06)
    if stage == 1:
        scale_cover(a, bvh, (0, 0, 1.5), (0, 0, 1.64), .06, .016, sc, 1, ang=(-.4, .9))
        scale_cover(a, bvh, C + V((0, 0, -.075)), C + V((0, 0, .01)), .1, .015, sc, 2, ang=(-1.15, -.45))
        for j, (s, S_, E, W_) in enumerate(arms):
            scale_cover(a, bvh, W_ + (E-W_)*.15, W_ + (E-W_)*.7, .05, .018, sc, 3+j, ang=(-2.4, .6) if j else (-.6, 2.4))
            scale_cover(a, bvh, W_ + (W_-E).normalized()*.08, W_ + (W_-E).normalized()*.01, .03, .013, sc, 5+j, ang=(-1.2, 1.2))
        scale_cover(a, bvh, C + V((0, 0, .03)), C + V((0, 0, .1)), .1, .015, sc, 7, ang=(-2.9, -2.1))
    elif stage == 2:
        scale_cover(a, bvh, (0, 0, 1.48), (0, 0, 1.64), .06, .018, sc, 1, ang=(-1.4, 1.6))
        scale_cover(a, bvh, (0, 0, 1.48), (0, 0, 1.64), .06, .018, sc, 11, ang=(1.9, 3.6))
        for i, (a0, a1) in enumerate(((-1.25, -.35), (-2.8, -1.9))): scale_cover(a, bvh, C + V((0, 0, -.09)), C + V((0, 0, .06)), .1, .017, sc, 20+i, ang=(a0, a1))
        scale_cover(a, bvh, C + V((0, 0, .02)), C + V((0, 0, .16)), .1, .018, sc, 25, ang=(1.0, 2.6))
        for j, (s, S_, E, W_) in enumerate(arms): scale_cover(a, bvh, W_, E, .05, .017, sc, 30+j, ang=(-pi, pi))
        for j, (s, S_, E, W_) in enumerate(arms): scale_cover(a, bvh, W_ + (W_-E).normalized()*.09, W_, .03, .012, sc, 40+j, ang=(-pi, pi))
    else:
        big = .024 if stage == 3 else .028
        belly_ = lambda p: not (stage == 4 and abs(p.x) < .1 and p.y < 0 and .96 < p.z < 1.42)
        scale_cover(a, bvh, (0, 0, .95 if stage == 4 else 1.0), (0, 0, 1.66), .16, big, sc, 1, R=.7, keep=belly_)
        if stage == 4:   # pale ventral plates down the belly
            for k in range(7):
                z = 1.4 - k*.062; w_ = .085 - k*.004
                cband(a, bvh, V((0, 0, 0)), [(-w_, z), (0, z+.012), (w_, z)], [(-w_*.9, z-.05), (0, z-.04), (w_*.9, z-.05)], belly, .006)
        scale_cover(a, bvh, C + V((0, 0, -.16)), C + V((0, 0, .2)), .11, big*.8, sc, 2, R=.5, keep=notface, lift=.3)
        for j, (s, S_, E, W_) in enumerate(arms):
            scale_cover(a, bvh, E, S_ + V((0, 0, .04)), .07, big*.85, sc, 30+j); scale_cover(a, bvh, W_, E, .055, big*.75, sc, 40+j)
            scale_cover(a, bvh, W_ + (W_-E).normalized()*.1, W_, .03, .013, sc, 50+j)
        if stage == 4:
            for s in (-1, 1): scale_cover(a, bvh, V((s*.1, 0, .1)), V((s*.095, 0, .96)), .07, big*.85, sc, 60+s)
    if stage >= 3:
        hs_ = DEEP_HEAD[stage]; es_, ew_, eh_ = hs_['es'], hs_['ew'], hs_['eh']; ez_ = C.z + .03; mz_ = C.z + .03 - .082*hs_['fl']; fl_ = a.m('face_ridge', mix(skin, '#000000', .1))
        ewm = a.m('eyeball', hs_.get('white', '#d8d4bc')); irm = a.m('eye_iris', hs_['iris']); pum = a.m('eye_pupil', '#0a0a08'); lidm = a.m('eye_lid', mix(skin, '#000000', .2))
        for s in (-1, 1):
            loc, nn = surf_hit(bvh, V((s*es_, -.5, ez_)), V((0, 1, 0)))
            if loc is None: continue
            o = V((s*.45, -1, 0)).normalized(); bulge = ew_*(1.05 if stage == 3 else 1.25)
            a.add(f_loft([loc - o*.006, loc + o*bulge*.55, loc + o*bulge*.95], [(ew_*1.12, eh_*1.35), (ew_*1.05, eh_*1.25), (ew_*.7, eh_*.8)], ref=(0, 0, 1), kind='n', n=10, cap0=None, cap1='chamfer', smooth=0), ewm)
            tip = loc + o*bulge*1.02
            a.add(f_loft([tip - o*.004, tip + o*.004], [(eh_*.62, eh_*.62), (eh_*.5, eh_*.5)], ref=(0, 0, 1), kind='n', n=8, cap0=None, cap1='flat', smooth=0), irm)
            a.add(f_loft([tip + o*.003, tip + o*.006], [(eh_*.18, eh_*.42), (eh_*.14, eh_*.36)], ref=(0, 0, 1), kind='n', n=6, cap0=None, cap1='flat', smooth=0), pum)
            a.add(f_loft([loc - o*.004, loc + o*bulge*.35], [(ew_*1.32, eh_*1.6), (ew_*1.22, eh_*1.48)], ref=(0, 0, 1), kind='n', n=10, cap0=None, cap1=None, smooth=0), lidm)   # the socket rim
            a.add(f_loft([loc + V((s*-.012, -.012, eh_*1.7)), loc + V((s*.012, -.016, eh_*1.95)), loc + V((s*.032, -.006, eh_*1.6))], [(.006, .01), (.008, .012), (.005, .008)], ref=(0, -1, 0), kind='oct', cap0='chamfer', cap1='point', smooth=0), fl_)   # brow ridge
            a.add(f_loft([C + V((s*.03, -.09, -.03)), C + V((s*.065, -.07, -.045)), C + V((s*.085, -.03, -.07))], [(.008, .008), (.01, .009), (.006, .006)], kind='oct', cap0='chamfer', cap1='point', smooth=0), fl_)   # cheek ridge
            loc2, nn2 = surf_hit(bvh, V((s*.009, -.5, mz_ + .028)), V((0, 1, 0)))
            if loc2 is not None: a.add(f_loft([loc2 + V((0, -.004, .004)), loc2 + V((s*.004, -.009, -.006))], [(.0035, .002), (.002, .0015)], kind='n', n=5, cap0='flat', cap1='flat', smooth=0), pum)   # nostril slit
        loc, nn = surf_hit(bvh, V((0, -.5, mz_ - .02)), V((0, 1, 0)))
        if loc is not None:   # jutting lower jaw and a lipless upper ridge: the mouth sits in a snout, not on a flat face
            jw_ = hs_['mw']*1.35
            a.add(f_loft([loc + V((-jw_, .02, .006)), loc + V((-jw_*.45, -.01, -.004)), loc + V((0, -.016, -.008)), loc + V((jw_*.45, -.01, -.004)), loc + V((jw_, .02, .006))], [(.012, .016), (.014, .02), (.015, .022), (.014, .02), (.012, .016)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk)
            a.add(f_loft([loc + V((-jw_*.9, .012, .03)), loc + V((0, -.012, .028)), loc + V((jw_*.9, .012, .03))], [(.007, .008), (.009, .009), (.007, .008)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk2)
    # ---- gills, fins, spines
    for s in (-1, 1):
        for k in range(3 if stage < 4 else 4):
            z = 1.6 - k*.024; g = .2 + .25*stage
            if stage == 2:
                a.add(f_loft([V((s*.058, -.01+k*.004, z)), V((s*.062, .03, z-.012))], [(.004, .006), (.003, .004)], kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk2)
            elif stage >= 3:
                base = [V((s*.056, -.02, z)), V((s*.058, .01, z-.004)), V((s*.056, .04, z-.01))]
                tops = [b + V((s*(.012 + .012*(stage-3)), .012, -.016*g)) for b in base]; fin(a, base, tops, sk2 if stage == 3 else finm, None)
    def outward_fin(p0, p1, nrm, h, n, spike=1.0, back=V((0, 0, 0))):
        base, tops = [], []
        for i in range(n):
            t = i/(n-1); b = V(p0).lerp(V(p1), t); loc, nn = surf_hit(bvh, b + V(nrm)*.5, -V(nrm), 1.0)
            if loc is None: continue
            hh = h*sin(pi*min(1, t*1.15+.05))**.6*(1 + (.35*spike if i % 2 else -.1))
            base.append(loc - V(nrm)*.004); tops.append(loc + V(nrm)*hh + back*hh)
        if len(base) > 2: fin(a, base, tops, finm, ray)
    if stage >= 2:   # forearm fins on the outer edge
        for (s, S_, E, W_) in arms: outward_fin(E + (W_-E)*.15, E + (W_-E)*.8, V((s, .3, 0)).normalized(), {2: .03, 3: .055, 4: .1}[stage], 7, back=(E-W_).normalized()*.4)
    if stage >= 3:   # dorsal ridge along the spine, crest over the skull
        outward_fin(V((0, 0, .98 if stage == 3 else .9)), V((0, 0, 1.52)), V((0, 1, .15)), .06 if stage == 3 else .2, 11 if stage == 3 else 15, back=V((0, 0, .25)))
        outward_fin(C + V((0, -.07, .1)), C + V((0, .12, .02)), V((0, .1, 1)), .04 if stage == 3 else .11, 8, back=V((0, .4, 0)))
    if stage == 4:   # cheek frills, calf fins, barbels, teeth
        for s in (-1, 1):
            outward_fin(C + V((s*.08, -.02, .06)), C + V((s*.085, .04, -.08)), V((s, .4, 0)), .09, 7, back=V((0, .6, 0)))
            outward_fin(V((s*.1, 0, .44)), V((s*.1, 0, .14)), V((s*.2, 1, 0)), .08, 7, back=V((0, 0, -.3)))
            mz = .03 - .082*.9
            for k in range(2):
                p = C + V((s*(.03+k*.012), -.105, mz-.012)); a.add(f_loft([p, p + V((s*.02, -.03, -.06)), p + V((s*.035, -.02, -.13-.03*k))], [.006, .004, .0015], kind='n', n=5, cap0='flat', cap1='point', smooth=0), finm)
            # webbed feet with claws
        fy = .085
        for s in (-1, 1):
            A_ = V((s*.1, 0, .085)); a.add(f_loft([A_ + V((0, .03, -.02)), A_ + V((0, -.08, -.06)), A_ + V((0, -.2, -.075))], [(.05, .03), (.065, .022), (.08, .01)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk)
            for j in (-1, 0, 1): p = A_ + V((j*.035, -.2, -.075)); a.add(f_loft([p, p + V((j*.012, -.05, -.004))], [(.008, .006), (.001, .001)], kind='n', n=5, cap0='flat', cap1='point', smooth=0), nail)
        mzw = C + V((0, -.1, .03-.082*.9))
        for k in range(9):
            x = (k-4)/4*.04; loc, nn = surf_hit(bvh, mzw + V((x, -.4, .004)), V((0, 1, 0)))
            if loc is None: continue
            a.add(f_loft([loc + V((0, -.004, 0)), loc + V((0, -.006, -.016))], [.0035, .0008], kind='n', n=4, cap0='flat', cap1='point', smooth=0), a.m('teeth', '#d8d0b0'))
            loc, nn = surf_hit(bvh, mzw + V((x*.9, -.4, -.014)), V((0, 1, 0)))
            if loc is not None: a.add(f_loft([loc + V((0, -.004, 0)), loc + V((0, -.006, .013))], [.003, .0008], kind='n', n=4, cap0='flat', cap1='point', smooth=0), a.m('teeth', '#d8d0b0'))
    # ---- clothes over the skin
    if stage <= 2:
        a.add(loft([tring_at(cfg, 1.49, .014), tring_at(cfg, 1.54, .011)], True, True), a.m('cloth2', mix(shirt_c, '#000000', .2)))
        skirtl(a, cfg, [.99, .84], [.012, .02], a.m('cloth', shirt_c))
        for s in (-1, 1): place(a, lambda t: foot_(t, '#1c1a18', '#0e0d0c'), Tr(s*.1, 0, .085))
    elif stage == 3:
        rag = a.m('rag', mix(shirt_c, '#5a4a38', .3)); rag2 = a.m('rag2', mix(tr_c, '#2a2a26', .2)); rin = a.m('rag_in', mix(shirt_c, '#000000', .45)); rdk = a.m('rag_dirt', mix(shirt_c, '#3a3020', .5))
        def shred(rings_z, grows, n, holes, seed, cut=None, fringe=3):
            # fine cloth: many small facets, crumpled, holes torn in clusters, the hem cut into hanging strips; dark inside
            r_ = random.Random(seed); rings = [tring_at(cfg, z, g, n) for z, g in zip(rings_z, grows)]
            bm = bmesh.new(); P_ = [[p + V((r_.uniform(-1, 1)*.004, r_.uniform(-1, 1)*.004, r_.uniform(-1, 1)*.006)) for p in r] for r in rings]
            V_ = [[bm.verts.new(p) for p in r] for r in P_]; Vi = [[bm.verts.new(V((p.x*.985, p.y*.985, p.z))) for p in r] for r in P_]   # inner layer
            F = {}; Fi = {}
            for jz in range(len(V_)-1):
                for ia in range(n):
                    F[(jz, ia)] = (V_[jz+1][ia], V_[jz+1][(ia+1) % n], V_[jz][(ia+1) % n], V_[jz][ia]); Fi[(jz, ia)] = (Vi[jz][ia], Vi[jz][(ia+1) % n], Vi[jz+1][(ia+1) % n], Vi[jz+1][ia])
            gone = set()
            for (hz, ha, hr) in holes:
                for (jz, ia) in F:
                    da = min(abs(ia-ha), n-abs(ia-ha)); dz = abs(jz-hz)
                    if (da/hr[0])**2 + (dz/hr[1])**2 < 1 + r_.uniform(-.5, .3): gone.add((jz, ia))
            last = len(V_)-2
            for ia in range(n):   # the hem: strips of uneven length
                ln = r_.choice([0, 0, 1, 2, 3][:fringe+2])
                for q in range(ln): gone.add((last-q, ia)) if (ia % 3 == 0 or r_.random() < .3) else None
            for key, vs in F.items():
                if key in gone or (cut and cut(sum((v.co for v in vs), V())/4)): continue
                f = bm.faces.new(vs); f.material_index = rdk if r_.random() < .12 else rag
                g = bm.faces.new(Fi[key]); g.material_index = rin
            for v in bm.verts:
                if not v.link_faces: bm.verts.remove(v)
            a.add(bm, lambda f: f.material_index)
        zs = [1.5 - k*.036 for k in range(15)]; gs = [.018 + .004*min(1, k/3) for k in range(15)]
        shred(zs, gs, 34, [(4, 6, (3.2, 2.2)), (8, 22, (2.6, 2)), (2, 27, (2, 1.6)), (10, 12, (4, 2.4)), (6, 30, (2.2, 3)), (11, 2, (2.5, 2)), (3, 15, (1.6, 1.4))], 7)
        for (s, S_, E, W_) in arms:   # sleeve stumps of the same cloth, frayed
            dirv = (E-S_).normalized(); r_ = random.Random(int(s*5+9)); n = 14; bm = bmesh.new(); rows = []
            for k in range(6):
                c_ = S_ + V((0, 0, .05)) + dirv*(k*.03); rad = .082 - k*.002
                u_ = V((1, 0, 0)) if abs(dirv.x) < .9 else V((0, 1, 0)); u_ = (u_ - dirv*u_.dot(dirv)).normalized(); w_ = dirv.cross(u_)
                pts_ = [c_ + (u_*cos(t*2*pi/n) + w_*sin(t*2*pi/n))*rad*(1 + r_.uniform(-.06, .06)) for t in range(n)]
                rows.append(([bm.verts.new(p) for p in pts_], [bm.verts.new(c_ + (p-c_)*.95) for p in pts_]))
            for k in range(5):
                for t in range(n):
                    if k >= 3 and (t % 2 or r_.random() < .35) and k >= 3 + r_.randrange(2): continue
                    if r_.random() < .1: continue
                    o_, i_ = (rows[k][0], rows[k+1][0]), (rows[k][1], rows[k+1][1])
                    f = bm.faces.new((o_[0][t], o_[0][(t+1) % n], o_[1][(t+1) % n], o_[1][t])); f.material_index = rag
                    g = bm.faces.new((i_[1][t], i_[1][(t+1) % n], i_[0][(t+1) % n], i_[0][t])); g.material_index = rin
            bm.normal_update()
            for f in bm.faces:
                cc = f.calc_center_median(); out = cc - (S_ + dirv*(cc-S_).dot(dirv))
                if (f.material_index == rag) != (f.normal.dot(out) > 0): f.normal_flip()
            for v in [v for v in bm.verts if not v.link_faces]: bm.verts.remove(v)
            a.add(bm, lambda f: f.material_index)
        for s in (-1, 1):   # trousers torn off at the shins, bare webbed feet
            ring = f_loft([V((s*.1, -.03, .5)), V((s*.1, -.02, .32))], [(.072, .07), (.07, .068)], kind='oct', cap0=None, cap1=None, smooth=0)
            for v in ring.verts:
                if v.co.z < .4: v.co.z += rr.uniform(-.03, .07)
            a.add(dbl(ring), rag2)
            A_ = V((s*.1, 0, .085)); a.add(f_loft([A_ + V((0, .03, -.02)), A_ + V((0, -.08, -.06)), A_ + V((0, -.17, -.072))], [(.048, .03), (.058, .022), (.064, .012)], ref=(0, 0, 1), kind='oct', cap0='chamfer', cap1='chamfer', smooth=0), sk)
            for j in (-1, 0, 1): p = A_ + V((j*.03, -.17, -.072)); a.add(f_loft([p, p + V((j*.008, -.03, -.004))], [(.007, .005), (.001, .001)], kind='n', n=5, cap0='flat', cap1='point', smooth=0), nail)
    else:
        rag = a.m('rag', '#3a3a32')
        bm = loft(list(reversed([tring_at(cfg, z, g, 16) for z, g in ((.98, .03), (.86, .04), (.72, .06))])), False, False)
        for v in bm.verts:
            if v.co.z < .73: v.co.z += rr.uniform(0, .12)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if rr.random() < .3], context='FACES'); a.add(dbl(bm), rag)
        a.add(loft([tring_at(cfg, .96, .036), tring_at(cfg, .99, .036)], False, False), a.m('rope', '#6a5a3a'))
    # ---- stage 4: hunch the upper body forward, a bigger frame
    if stage == 4:
        piv = V((0, 0, .92)); M_ = Tr(0, 0, .92) @ Rx(.34) @ Tr(0, 0, -.92)
        for v in a.bm.verts:
            if not (abs(v.co.x) < .19 and v.co.z < .92): v.co = M_ @ v.co   # everything but the legs
        for v in a.bm.verts: v.co = V((v.co.x*1.12, v.co.y*1.12, v.co.z*1.1))
def place(a, fn, T, recol=None):
    t = A('tmp'); fn(t); idx = {}
    for i, (nm, col, em) in enumerate(t.ml):
        c = recol[nm] if recol and nm in recol else '#%02x%02x%02x' % tuple(int(v*255) for v in col)
        idx[i] = a.m(nm, c, em)
    a.add(t.bm, lambda f: idx[f.material_index], T)
for _i in (1, 2, 3, 4):
    BUILDERS['deep_%d' % _i] = ((lambda st: (lambda a: deep_one(a, st)))(_i), {'ao': .8})
DEEP = ['deep_1', 'deep_2', 'deep_3', 'deep_4']
PEOPLE = list(HEADS) + [n+'_'+p for n in HEADS for p in ('head', 'jaw', 'lids')]
PEOPLE += ['arm_up', 'arm_lo', 'robe_up', 'robe_lo', 'hand_R', 'hand_L', 'fing_R', 'fing_L', 'fist_R', 'fist_L', 'leg_up', 'leg_lo', 'foot', 'shoe', 'stock_lo', 'wpn_crowbar', 'wpn_club', 'wpn_torch', 'flame']
TOWNPROPS = ['stall', 'schooner']

# ================================================================ THE GREAT OLD ONE — «Рифовый колосс» (variant E)
# Part rig; authored facing -Y, exported with flip. Design rules: no spheres or round primitives —
# every form is lofted from irregular polygon sections (carved plates); every end tapers to a
# chamfer or a point (no blunt cut-offs). Eyes are small almond slits; brows form a V scowl.
CC = {'skin': '#1b3d3a', 'skin2': '#142f2e', 'skinL': '#28524c', 'belly': '#3a5846', 'plate': '#2c4a3c', 'barn': '#7a7d72',
      'weed': '#1c3622', 'claw': '#181512', 'socket': '#040706', 'mem': '#17302d', 'vein': '#0e2120', 'spike': '#22302b',
      'coral': '#7a2c1e', 'tube': '#a39d8c', 'rock': '#2c3632', 'sucker': '#5a6a5c'}
def cmats(a): return {k: a.m(k, v) for k, v in CC.items()}
def skin_pick(m, rr, z_belly=None):
    def f(face):
        c = face.calc_center_median(); n = face.normal
        if z_belly is not None and n.y < -.45 and c.z < z_belly: return m['plate'] if int(c.z/2.1) % 2 else m['belly']
        r = rr.random()
        return m['skinL'] if (n.z > .55 and r < .5) else (m['skin2'] if r < .35 else m['skin'])
    return f

# ---- faceted loft toolkit
def f_shape(kind, n=8, ch=.42):
    if kind == 'oct': return [(1, -ch), (1, ch), (ch, 1), (-ch, 1), (-1, ch), (-1, -ch), (-ch, -1), (ch, -1)]
    if kind == 'keel': return [(1, -.2), (.9, .55), (.35, 1), (-.35, 1), (-.9, .55), (-1, -.2), (-.45, -1), (.45, -1)]
    return [(cos(2*pi*i/n + pi/n), sin(2*pi*i/n + pi/n)) for i in range(n)]
def f_cat(pts, sizes, k):
    P = [V(p) for p in pts]; out, osz = [], []
    for i in range(len(P)-1):
        p0 = P[max(i-1, 0)]; p1 = P[i]; p2 = P[i+1]; p3 = P[min(i+2, len(P)-1)]; s1, s2 = sizes[i], sizes[i+1]
        for j in range(k):
            t = j/k; t2 = t*t; t3 = t2*t
            out.append(.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3))
            osz.append((s1[0]+(s2[0]-s1[0])*t, s1[1]+(s2[1]-s1[1])*t))
    out.append(P[-1]); osz.append(sizes[-1]); return out, osz
def f_loft(pts, sizes, ref=(0, -1, 0), kind='n', n=8, cap0='chamfer', cap1='chamfer', jit=0.0, smooth=3, seed=0, ch=.42):
    """loft polygon sections along a path (parallel transport). caps: None|'flat'|'chamfer'|'point'|float(point length)"""
    rr = random.Random(seed); bm = bmesh.new()
    sizes = [(s, s) if not isinstance(s, (tuple, list)) else tuple(s) for s in sizes]
    if smooth and len(pts) > 2: pts, sizes = f_cat(pts, sizes, smooth)
    else: pts = [V(p) for p in pts]
    sh = f_shape(kind, n, ch); N = len(sh); T = []
    for i in range(len(pts)): T.append((pts[min(i+1, len(pts)-1)] - pts[max(i-1, 0)]).normalized())
    w = V(ref) - T[0]*V(ref).dot(T[0])
    if w.length < 1e-4: w = V((1, 0, 0)) - T[0]*T[0].x
    w.normalize(); rings = []
    for i, p in enumerate(pts):
        if i > 0: w = T[i-1].rotation_difference(T[i]) @ w; w = (w - T[i]*w.dot(T[i])).normalized()
        u = T[i].cross(w).normalized(); sx, sy = sizes[i]
        rings.append([bm.verts.new(p + u*(x*sx*(1+rr.uniform(-jit, jit))) + w*(y*sy*(1+rr.uniform(-jit, jit)))) for (x, y) in sh])
    for j in range(len(rings)-1):
        for i in range(N):
            try: bm.faces.new((rings[j][i], rings[j][(i+1) % N], rings[j+1][(i+1) % N], rings[j+1][i]))
            except ValueError: pass
    def capit(ring, p, t, sz, mode, sign):
        if mode is None: return
        if mode == 'flat':
            try: bm.faces.new(ring)
            except ValueError: pass
            return
        m_ = (sz[0]+sz[1])/2
        if mode == 'chamfer':
            inner = [bm.verts.new(p + (v.co-p)*.55 + t*sign*m_*.42) for v in ring]
            for i in range(N):
                try: bm.faces.new((ring[i], ring[(i+1) % N], inner[(i+1) % N], inner[i]))
                except ValueError: pass
            ring = inner; tip = bm.verts.new(p + t*sign*m_*.62)
        else: tip = bm.verts.new(p + t*sign*m_*(mode if isinstance(mode, float) else 1.6))
        for i in range(N):
            try: bm.faces.new((ring[i], ring[(i+1) % N], tip))
            except ValueError: pass
    capit(rings[-1], pts[-1], T[-1], sizes[-1], cap1, 1); capit(rings[0], pts[0], T[0], sizes[0], cap0, -1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def f_perp(v):
    v = V(v).normalized(); a = V((0, 0, 1)) if abs(v.z) < .9 else V((1, 0, 0)); return v.cross(a).normalized()
def f_horn(base, d, L, r, bend=.5, sides=5, axis=None):
    d = V(d).normalized(); ax = V(axis).normalized() if axis is not None else f_perp(d); p = V(base); pts, sz = [p - d*r*.5], [r]
    for i in range(1, 5): d = Q(ax, bend/4) @ d; p = p + d*L/4; pts.append(p.copy()); sz.append(r*(1-i/4.6))
    return f_loft(pts, sz, ref=ax, n=sides, cap0='flat', cap1=2.5, smooth=2)
def f_tent(start, d, L, r0, seed, n=9, curl=2.0, grav=.25, sides=5, axis=None, tip=.02):
    rr = random.Random(seed); d = V(d).normalized(); p = V(start)
    ax = V(axis).normalized() if axis is not None else f_perp(d); ax = Q(d, rr.uniform(-.4, .4)) @ ax
    pts, sz = [p.copy()], [r0]
    for i in range(1, n+1):
        f = i/n; d = Q(ax, curl/n*(f**1.4)*2.2) @ d
        d = (d + V((0, 0, -grav/n*2)) + V((rr.uniform(-1, 1), rr.uniform(-1, 1), rr.uniform(-1, 1)))*.06).normalized()
        p = p + d*(L/n); pts.append(p.copy()); sz.append(max(r0*(1-f)**.85, r0*tip))
    return f_loft(pts, sz, ref=ax, n=sides, cap0='flat', cap1='point', smooth=2)
def f_barnacle(a, m, base, nrm, r, seed):
    rr = random.Random(seed); n = V(nrm).normalized(); h = r*rr.uniform(.6, 1.0)
    a.add(f_loft([base - n*r*.3, base + n*h*.55, base + n*h*.85], [r*1.05, r*.78, r*.55], ref=f_perp(n), n=6, cap0='flat', cap1=None, smooth=0, jit=.12, seed=seed), m['barn'])
    a.add(f_loft([base + n*h*.86, base + n*h*.35], [r*.5, r*.22], ref=f_perp(n), n=6, cap0=None, cap1='flat', smooth=0), m['socket'])
def f_worms(a, m, base, nrm, r, seed):
    rr = random.Random(seed); n = V(nrm).normalized()
    for i in range(rr.randint(3, 5)):
        off = (Q(n, rr.uniform(0, 2*pi)) @ f_perp(n))*rr.uniform(0, r*1.6)
        d = (n + f_perp(n)*rr.uniform(-.4, .4) + V((0, 0, .3))).normalized(); L = r*rr.uniform(2.5, 5)
        p0 = base + off - n*r*.3; p1 = p0 + d*L
        a.add(f_loft([p0, p0 + d*L*.5, p1], [r*.32, r*.3, r*.36], ref=f_perp(d), n=6, cap0='flat', cap1=None, smooth=0), m['tube'])
        a.add(f_loft([p1 - d*.01, p1 + d*r*.35], [r*.3, r*.05], ref=f_perp(d), n=6, cap0='flat', cap1='point', smooth=0), m['coral'])
def f_fuse(bm, voxel, target):
    """union every overlapping loft into one surface, then re-facet it into large carved plates"""
    me = bpy.data.meshes.new('zov_tmp'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('zov_tmp', me); bpy.context.scene.collection.objects.link(ob)
    r = ob.modifiers.new('R', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel; r.adaptivity = 0
    dg = bpy.context.evaluated_depsgraph_get(); n = len(ob.evaluated_get(dg).data.polygons)*2
    d = ob.modifiers.new('D', 'DECIMATE'); d.ratio = min(1, target/max(n, 1)); d.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get(); oe = ob.evaluated_get(dg); me2 = oe.to_mesh()
    out = bmesh.new(); out.from_mesh(me2); oe.to_mesh_clear(); bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return out
def f_ray(bvh, o, d, maxd=40):
    loc, nrm, i, dist = bvh.ray_cast(V(o), V(d).normalized(), maxd); return (loc, nrm) if loc is not None else (None, None)
def f_scatter(bm, rr, count, ok, mind):
    bm.faces.ensure_lookup_table(); fs = [(f.calc_center_median(), f.normal.copy()) for f in bm.faces]; out = []; tries = 0
    while len(out) < count and tries < count*300:
        tries += 1; c, n = fs[rr.randrange(len(fs))]
        if not ok(c, n) or any((c-o).length < mind for o, _ in out): continue
        out.append((c, n))
    return out
def f_dress(a, m, bm, rr, barn=0, worms=0, mini=0, horns=0, ok=lambda c, n: True, scale=1.0, seed=0):
    """barnacles, tube worms, mini tentacles and growths scattered over a fused surface"""
    for i, (c, n) in enumerate(f_scatter(bm, rr, barn, ok, 1.4*scale)):
        for j in range(rr.randint(1, 4)):
            off = (Q(n, rr.uniform(0, 2*pi)) @ f_perp(n))*rr.uniform(0, 1.1*scale); f_barnacle(a, m, c + off, n, rr.uniform(.32, .7)*scale, seed+i*10+j)
    for i, (c, n) in enumerate(f_scatter(bm, rr, worms, ok, 2*scale)): f_worms(a, m, c, n, rr.uniform(.28, .42)*scale, seed+500+i)
    for i, (c, n) in enumerate(f_scatter(bm, rr, mini, ok, 1.2*scale)):
        d = (n + V((0, 0, -.7)) + V((rr.uniform(-.3, .3), rr.uniform(-.3, .3), 0))).normalized()
        a.add(f_tent(c - n*.25*scale, d, rr.uniform(3, 7.5)*scale, rr.uniform(.3, .55)*scale, seed+900+i, n=7, curl=rr.uniform(1.5, 3.5), grav=.4), m['skin2'] if i % 3 else m['skinL'])
    for i, (c, n) in enumerate(f_scatter(bm, rr, horns, ok, 2*scale)):
        a.add(f_horn(c - n*.3*scale, (n + V((0, .4, .3))).normalized(), rr.uniform(1.8, 3.6)*scale, rr.uniform(.4, .65)*scale, bend=.6, sides=5), m['spike'])

# ---- torso
TORSO_SECS = [(-7, 9.5, 8.2, 0), (-2, 12, 9.6, -.5), (4, 12.2, 10.0, -1.4), (10, 13.4, 11.0, -2.2), (16, 15.2, 11.6, -1.4),
              (21, 17.0, 11.6, .3), (25.5, 17.4, 10.8, 1.7), (29, 14.6, 9.8, 2.6), (32, 9.6, 7.9, 2.0), (34.5, 6.9, 6.3, .6)]
@asset('cth_torso', ground=False, flip=True, ao=1.3, aod=6)
def _(a):
    m = cmats(a); rr = random.Random(61)
    path = [V((0, cy, z)) for (z, rx, ry, cy) in TORSO_SECS]; sz = [(rx, ry) for (z, rx, ry, cy) in TORSO_SECS]
    core = f_loft(path, sz, n=10, jit=.05, seed=1, smooth=2)
    helper = f_loft(path, sz, n=10, cap0='flat', cap1='flat', smooth=2)
    A_ = A('tmp'); A_.bm = core
    for s_ in (-1, 1):
        A_.add(f_loft([V((s_*3, 3, 33)), V((s_*9, 2.5, 32.5)), V((s_*15.5, 1.5, 30))], [(3.2, 3.4), (4.4, 4.2), (4.6, 4.6)], ref=(0, 0, 1), n=9, jit=.06, seed=2+s_), 0)           # trapezius
        A_.add(f_loft([V((s_*11, .5, 33)), V((s_*16.5, .8, 29)), V((s_*18.2, .5, 23))], [(5.4, 5.6), (6.6, 6.4), (4.6, 4.6)], ref=(s_, 0, 0), kind='keel', jit=.05, seed=4+s_), 0)  # shoulder cap
        A_.add(f_loft([V((s_*1.2, -8.6, 25.5)), V((s_*6.5, -9.6, 24)), V((s_*12, -7.2, 23))], [(2.6, 2.2), (3.6, 3.0), (2.6, 2.2)], kind='keel', seed=6+s_), 0)                    # pectoral plates
        A_.add(f_loft([V((s_*12.5, 6, 25)), V((s_*13.5, 7.5, 17)), V((s_*11, 6.5, 9))], [(3.4, 3.0), (3.8, 3.6), (2.4, 2.4)], ref=(s_, 0, 0), kind='keel', seed=8+s_), 0)          # lats
    bm = f_fuse(A_.bm, .45, 4600)
    a.add(bm.copy(), skin_pick(m, rr, 21))
    hb = BVHTree.FromBMesh(helper)
    # flank ribs: slope down toward the sternum, flattened against the skin
    for s_ in (-1, 1):
        for i in range(5):
            z = 12.5 + i*2.6; pts = []
            for k in range(9):
                th = radians(150 - k*11); zz = z - 5.5*(k/8)**1.2 + 1
                loc, nrm = f_ray(hb, (0, 0, zz), (s_*sin(th), -cos(th), 0))
                if loc is not None: pts.append(loc)
            if len(pts) > 4: a.add(f_loft(pts, [(.95*(1-.4*abs(j/(len(pts)-1)-.4)), .62) for j in range(len(pts))], ref=(0, 0, 1), kind='keel', cap0='point', cap1='point', smooth=2), m['skin2'])
    # ventral scutes down the belly
    for i in range(6):
        z = -1 + i*2.5; pts = []
        for k in range(7):
            th = radians(-55 + k*18.3); loc, nrm = f_ray(hb, (0, 0, z + .6*abs(k-3)/3), (sin(th), -cos(th), -.15))
            if loc is not None: pts.append(loc + nrm*.05)
        if len(pts) > 4: a.add(f_loft(pts, [(.75, .5)]*len(pts), ref=(0, -.3, -1), kind='keel', cap0='point', cap1='point', smooth=2), m['plate'] if i % 2 else m['belly'])
    # dorsal spine plates along the hunched back
    for i in range(11):
        z = 6+i*2.6; y = 10.3+sin(i*.5)*.8+(2.2 if z > 22 else 0); h = 2.4+1.8*sin(i/10*pi)
        a.add(f_horn(V((0, y, z)), (0, 1, .55), h, 1.0, bend=.6, sides=4, axis=(1, 0, 0)), m['spike'])
        if i % 2 == 0:
            for s_ in (-1, 1): a.add(f_horn(V((s_*4.5, y-1.3, z+.6)), (s_*.4, 1, .5), h*.55, .55, bend=.5, sides=4), m['spike'])
    f_dress(a, m, bm, rr, barn=26, worms=8, mini=22, horns=8, seed=60,
            ok=lambda c, n: (n.y > -.35 or c.z > 26 or abs(c.x) > 13) and n.z > -.4 and c.z > 4)
    for i in range(14):   # kelp hanging from the shoulders
        s_ = rr.choice((-1, 1)); x0 = s_*rr.uniform(6, 20); y0 = rr.uniform(-3, 10); z0 = rr.uniform(24, 33); L = rr.uniform(5, 11)
        pts = [V((x0+sin(k*.9)*.6, y0+cos(k*.7)*.4-k*.1, z0-k*L/5)) for k in range(6)]
        a.add(tube(pts, [.5, .45, .38, .3, .2, .05], 4, sq=.25), m['weed'])

# ---- head: face + octopoid mantle swept back, V brows, deep sockets, crest fins
HEAD_PATH = [(0, -4.6, -.2), (0, -4.4, 3.6), (0, -3.4, 7.8), (0, -.4, 12.4), (0, 5.2, 15.8), (0, 11.5, 17.6)]
HEAD_SIZE = [(3.6, 3.0), (5.8, 4.8), (6.9, 6.0), (9.0, 8.4), (8.0, 7.7), (3.4, 3.4)]
HEAD_C = V((0, -2.6, 7.6))
EYE_DIR = (.5, -1, .02)
def head_bvh():
    return BVHTree.FromBMesh(f_loft([V(p) for p in HEAD_PATH], HEAD_SIZE, n=10, cap0='flat', cap1='flat', smooth=3))
def eye_pos():
    """eye centres (Blender coords) — the game's CL.eyes is derived from these"""
    hb = head_bvh(); out = []
    for s_ in (-1, 1):
        loc, nrm = f_ray(hb, HEAD_C, (s_*EYE_DIR[0], EYE_DIR[1], EYE_DIR[2]))
        n = (nrm*.6 + V((s_*EYE_DIR[0], EYE_DIR[1], EYE_DIR[2])).normalized()*.4).normalized(); out.append((loc - n*.15, n))
    return out
def tent_roots():
    hb = head_bvh(); out = []
    for row in range(2):
        m_ = 7 - row
        for i in range(m_):
            u = (i/(m_-1) - .5)*2; loc, nrm = f_ray(hb, HEAD_C + V((0, .5, -1.6)), (u*.9, -1, -.2 - row*.32 - .1*(1-abs(u))))
            if loc is not None: out.append(loc - nrm*.5)
    return out
@asset('cth_head', ground=False, flip=True, ao=1.3, aod=4)
def _(a):
    m = cmats(a); rr = random.Random(62)
    A_ = A('tmp'); A_.bm = f_loft([V(p) for p in HEAD_PATH], HEAD_SIZE, n=10, jit=.06, seed=11, cap1='point', smooth=3)
    for s_ in (-1, 1):   # cheek/jaw masses where the beard roots, temple plates
        A_.add(f_loft([V((s_*2.5, -7.8, 1.2)), V((s_*5.2, -6.2, 3.5)), V((s_*6.4, -3.2, 5.4))], [(1.8, 1.6), (2.4, 2.1), (1.8, 1.6)], n=8, jit=.06, seed=13+s_), 0)
        A_.add(f_loft([V((s_*6.0, -4.5, 10.5)), V((s_*7.6, -1.0, 11.5)), V((s_*8.0, 3.0, 12.0))], [(1.6, 1.3), (2.0, 1.6), (1.2, 1.0)], kind='keel', ref=(s_, 0, 0), seed=15+s_), 0)
    bm = f_fuse(A_.bm, .24, 3000)
    a.add(bm.copy(), skin_pick(m, rr))
    hb = head_bvh()
    # carved V-shaped brow blades: meet low between the eyes, sweep up to the temples -> permanent scowl
    for s_ in (-1, 1):
        ridge = []
        for i in range(6):
            u = i/5; loc, nrm = f_ray(hb, HEAD_C, (s_*(.04 + u*1.0), -1, .08 + .55*u**1.1))
            if loc is not None: ridge.append(loc + nrm*(.3 + .35*(1-u)))
        if len(ridge) > 3: a.add(f_loft(ridge, [(.6 + .45*(1-j/(len(ridge)-1)), .8 + .8*(1-j/(len(ridge)-1))) for j in range(len(ridge))], ref=(0, -1, .5), kind='keel', cap1='point', smooth=2), m['skin2'])
    # deep dark sockets behind the eyes (pointed toward the outer-top corner)
    for (c, n) in eye_pos():
        s_ = 1 if c.x > 0 else -1; lat = V((s_, 0, 0)); lat = (lat - n*lat.dot(n)).normalized(); up_ = n.cross(lat).normalized()
        if up_.z < 0: up_ = -up_
        ang = .45; lu = lat*cos(ang) + up_*sin(ang); uu = up_*cos(ang) - lat*sin(ang)
        sv = [(1.5, .22), (.6, .62), (-.55, .5), (-1.35, -.1), (-.5, -.5), (.65, -.42)]
        bm2 = bmesh.new(); vs = [bm2.verts.new(c + n*.25 + lu*(x*1.75) + uu*(y*1.75)) for x, y in sv]; ctr = bm2.verts.new(c - n*1.2)
        for k in range(6): bm2.faces.new((vs[k], vs[(k+1) % 6], ctr))
        bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces); a.add(bm2, m['socket'])
    # crest fins along the mantle ridge
    for i in range(6):
        t = .15 + i/6*.8; p = V(HEAD_PATH[2]).lerp(V(HEAD_PATH[-1]), t)
        loc, nrm = f_ray(hb, p - V((0, 0, 3)), (0, .15, 1))
        if loc is not None: a.add(f_horn(loc - nrm*.5, (0, .6, 1), 7.5*(1-.6*t), .8, bend=.5, sides=4, axis=(1, 0, 0)), m['spike'])
    # gill slits low on the sides
    for s_ in (-1, 1):
        for g in range(3):
            loc, nrm = f_ray(hb, V((0, -1 + g*1.4, 3.5 - g*.5)), (s_, .15, -.25))
            if loc is None: continue
            a.add(f_loft([loc - V((0, 0, 1.2)), loc + V((0, 0, 1.3))], [(.35, .14), (.35, .14)], ref=nrm, kind='oct', smooth=0, cap0='point', cap1='point'), m['socket'])
            a.add(f_loft([loc + nrm*.1 - V((0, .45, 1.5)), loc + nrm*.45 - V((0, .35, 0)), loc + nrm*.1 - V((0, .45, -1.7))], [(.4, .5), (.45, .75), (.35, .5)], ref=nrm, kind='keel', smooth=2, cap0='point', cap1='point'), m['skin2'])
    a.add(f_loft([V((0, -6.6, .6)), V((0, -7.6, 1.6))], [(2.6, 1.6), (3.0, 1.9)], kind='oct', cap0='flat', cap1=None, smooth=0), m['socket'])   # maw behind the beard
    f_dress(a, m, bm, rr, barn=8, worms=3, mini=6, horns=0, scale=.8, seed=620,
            ok=lambda c, n: n.y > -.2 and c.z > 4)
@asset('cth_eye', ground=False, flip=True, ao=0)
def _(a):
    """small almond slit (long axis X, faces -Y); the game tilts it so the outer corner rises"""
    e = a.m('eye', '#ff3a1a', 1.0); p = a.m('pupil', '#140402', .0); g = a.m('glow', '#ffb060', 1.0)
    lens = [(1.0, .05), (.4, .36), (-.45, .3), (-1.0, -.06), (-.4, -.3), (.42, -.28)]
    def almond(sx, sz, y0, bulge, mat):
        bm = bmesh.new(); vs = [bm.verts.new((x*sx, y0, z*sz)) for x, z in lens]; c = bm.verts.new((0, y0-bulge, 0))
        for k in range(6): bm.faces.new((vs[k], vs[(k+1) % 6], c))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces); a.add(bm, mat)
    almond(1.25, 1.0, 0, .35, e); almond(.7, .5, -.2, .22, g)
    slit = [(1, 0), (.4, 1), (-.4, 1), (-1, 0), (-.4, -1), (.4, -1)]
    bm = bmesh.new(); vs = [bm.verts.new((x*.78, -.5, z*.09)) for x, z in slit]; bm.faces.new(list(reversed(vs))); a.add(bm, p)
@asset('cth_tent', ground=False, flip=True, ao=.6, aod=1.5)
def _(a):
    m = cmats(a)
    a.add(f_loft([V((0, 0, .35)), V((0, 0, -1.9)), V((0, 0, -4.15))], [1.0, .97, .9], n=7, jit=.05, seed=31, cap0='chamfer', cap1='chamfer', smooth=0),
          lambda f: m['skinL'] if f.normal.y < -.5 else m['skin'])
    for k in range(3):   # hexagonal suckers on the inner side
        c = V((0, .86, -.7-k*1.15)); r = .3-.02*k
        bm = bmesh.new(); vs = [bm.verts.new(c + V((cos(i/6*2*pi)*r, .05, sin(i/6*2*pi)*r))) for i in range(6)]; ctr = bm.verts.new(c + V((0, .18, 0)))
        for i in range(6): bm.faces.new((vs[i], vs[(i+1) % 6], ctr))
        a.add(dbl(bm), m['sucker'])
def f_limb(a, top, L, sizes, seed, spikes=0, dress=None):
    m = cmats(a); rr = random.Random(seed); n_ = len(sizes)
    pts = [V((0, 0, top - (L+top)*i/(n_-1))) for i in range(n_)]
    bm = f_loft(pts, sizes, n=9, jit=.06, seed=seed, smooth=2)
    a.add(bm.copy(), skin_pick(m, rr))
    for i in range(spikes):   # forearm blades on the back side
        z = -L*(.15+.7*i/max(1, spikes-1)); r = sizes[0][0]*(1-.3*i/max(1, spikes))
        a.add(f_horn(V((0, r*.75, z)), (0, 1, .6), r*.95, r*.22, bend=.7, sides=4, axis=(1, 0, 0)), m['spike'])
    if dress: f_dress(a, m, bm, rr, seed=seed*10, **dress)
@asset('cth_uarm', ground=False, flip=True, ao=1.0, aod=5)
def _(a): f_limb(a, 2.5, 26, [(6.0, 5.8), (6.6, 6.3), (6.0, 5.6), (5.2, 4.9), (4.6, 4.3)], 71, 3, dict(barn=10, worms=2, mini=5, ok=lambda c, n: n.y > -.2 and c.z > -18))
@asset('cth_farm', ground=False, flip=True, ao=1.0, aod=4)
def _(a): f_limb(a, 2.0, 24, [(4.8, 4.6), (5.3, 4.8), (4.6, 4.1), (3.8, 3.4), (3.2, 2.9)], 72, 5, dict(barn=6, worms=3, mini=4, ok=lambda c, n: n.y > 0 and c.z < -2))
@asset('cth_thigh', ground=False, flip=True, ao=1.0, aod=5)
def _(a): f_limb(a, 3.0, 24, [(7.2, 7.0), (7.6, 7.2), (6.4, 6.0), (5.4, 5.2), (4.8, 4.6)], 73, 0, dict(barn=14, worms=4, mini=0, ok=lambda c, n: True))
@asset('cth_palm', ground=False, flip=True, ao=1.1, aod=2.5)
def _(a):
    m = cmats(a); rr = random.Random(74)
    bm = f_loft([V((0, 0, .8)), V((0, 0, -1.5)), V((0, -.1, -3.4)), V((0, -.1, -5.1))], [(2.9, 1.9), (3.2, 1.8), (3.5, 1.45), (3.35, 1.2)], kind='oct', jit=.05, seed=74, cap0='chamfer', cap1='chamfer', smooth=0)
    a.add(bm, lambda f: m['belly'] if f.normal.y < -.6 else (m['skin2'] if rr.random() < .3 else m['skin']))
    for x in (-2.5, -.85, .85, 2.5):   # knuckle plates
        a.add(f_loft([V((x, .2, -4.2)), V((x, .3, -5.3)), V((x, .2, -6.1))], [(.9, .8), (1.05, .95), (.8, .7)], kind='keel', ref=(0, 1, 0), smooth=0), m['skin2'])
    for i in range(3):
        x = -1.7+i*1.7; a.add(dbl(tri_fan([V((x, -.2, -4.6)), V((x-.85, -.1, -6.6)), V((x+.85, -.1, -6.6))])), m['mem'])
@asset('cth_finger_a', ground=False, flip=True, ao=.8, aod=1.5)
def _(a):
    m = cmats(a)
    a.add(f_loft([V((0, 0, .7)), V((0, 0, -.4)), V((0, 0, -2.0)), V((0, 0, -3.95))], [(1.0, .95), (1.08, 1.0), (.9, .84), (.86, .8)], n=7, jit=.05, seed=81, smooth=0),
          lambda f: m['belly'] if f.normal.y < -.6 else m['skin'])
@asset('cth_finger_b', ground=False, flip=True, ao=.8, aod=1.5)
def _(a):
    m = cmats(a)
    a.add(f_loft([V((0, 0, .5)), V((0, 0, -1.2)), V((0, 0, -3.0))], [(.82, .76), (.74, .7), (.56, .52)], n=7, jit=.05, seed=82, cap1='flat', smooth=0),
          lambda f: m['belly'] if f.normal.y < -.6 else m['skin'])
    a.add(f_horn(V((0, 0, -2.6)), (0, -.25, -1), 3.9, .58, bend=1.0, sides=4, axis=(1, 0, 0)), m['claw'])   # claw curls toward the palm (-Y)
def wing(a, side, P_=None, scale=1.0, tatter=.12, seed=80, bone=1.0):
    m = cmats(a); rr = random.Random(seed)
    P = lambda x, y, z: V((side*x*scale, y*scale, z*scale))
    root = P(0, 0, 0); W = P(14, 10, 24); tips = [P(22, 12, 46), P(42, 16, 30), P(44, 14, 4)]; B = P(8, 4, -16)
    a.add(f_loft([root, (root+W)/2+P(0, 1.5, 0), W], [1.9*scale*bone, 1.6*scale*bone, 1.2*scale*bone], kind='oct', ref=(0, 0, 1), cap0='chamfer', cap1='chamfer', smooth=2), m['skin2'])
    for t in tips:
        mid = W+(t-W)*.5+P(0, 1.2, 0)
        a.add(f_loft([W, mid, t], [1.15*scale*bone, .6*scale*bone, .12*scale*bone], kind='oct', ref=(0, 0, 1), cap0='flat', cap1='point', smooth=2), m['spike'])
        a.add(f_horn(t, (t-mid).normalized(), 2.5*scale, .2*scale*bone, bend=.4, sides=4), m['claw'])
    a.add(f_horn(W, (P(-1, -1.5, 3.5)).normalized(), 4.5*scale, .6*scale*bone, bend=.6, sides=4), m['claw'])
    fingers = tips + [B]; K, U = 6, 8; mem = bmesh.new()
    for i in range(len(fingers)-1):
        A0, B0 = fingers[i], fingers[i+1]; last = i == len(fingers)-2
        hub = root.lerp(W, .5) if last else W
        grid = []
        for j in range(K+1):
            row = []
            for k in range(U+1):
                u = k/U; e = A0.lerp(B0, u); depth = (.3 + rr.uniform(-.04, .06))*sin(pi*u)*(.75 if not last else .4)
                e = e.lerp(hub, depth)
                if tatter and j == K and 0 < k < U: e = e.lerp(hub, rr.uniform(0, tatter))
                p = hub.lerp(e, j/K); p = p + P(0, sin(pi*u)*sin(pi*j/K*.9)*1.6, 0)
                row.append(mem.verts.new(p))
            grid.append(row)
        for j in range(K):
            for k in range(U):
                if tatter and j >= K-2 and rr.random() < tatter*.9: continue   # rips near the trailing edge
                try: mem.faces.new((grid[j][k], grid[j][k+1], grid[j+1][k+1], grid[j+1][k]))
                except ValueError: pass
    bmesh.ops.triangulate(mem, faces=mem.faces); a.add(dbl(mem), m['mem'])
    for i in range(len(tips)-1):   # veins
        e = tips[i].lerp(tips[i+1], .5).lerp(W, .3)
        a.add(tube([W, W.lerp(e, .55), e], [.35*scale, .25*scale, .05*scale], 4), m['vein'])
@asset('cth_wing_L', ground=False, flip=True, ao=.8, aod=6)
def _(a): wing(a, 1)
@asset('cth_wing_R', ground=False, flip=True, ao=.8, aod=6)
def _(a): wing(a, -1)

# ================================================================ IMPS («бесы») — the Old One's winged spawn
# origin = chest; faces -Y; arms reach forward-down (grabbing pose); ~2 m tall, 4 m wingspan.
IC = {'skin': '#1a302d', 'skin2': '#122523', 'skinL': '#24433e', 'belly': '#3a4a3c', 'plate': '#2c3c33', 'claw': '#14110f',
      'socket': '#040505', 'mem': '#24191b', 'vein': '#120c0d', 'spike': '#1f2a26', 'barn': '#6a6d64', 'coral': '#7a2c1e', 'tube': '#a39d8c',
      'weed': '#1c3622', 'rock': '#2c3632', 'sucker': '#4a5a4c', 'mouth': '#3a0c0c'}
@asset('imp_body', ground=False, flip=True, ao=1.0, aod=.5)
def _(a):
    m = {k: a.m(k, v) for k, v in IC.items()}; rr = random.Random(91)
    eye = a.m('eye', '#ff2a14', 1.0)
    A_ = A('tmp')
    A_.bm = f_loft([V((0, .12, -.62)), V((0, .04, -.3)), V((0, -.02, .12)), V((0, .06, .42))], [(.17, .14), (.21, .17), (.29, .21), (.15, .13)], n=8, jit=.05, seed=1, smooth=2)
    A_.add(f_loft([V((0, -.02, .38)), V((0, -.04, .6)), V((0, .1, .82)), V((0, .34, .98)), V((0, .55, 1.04))], [(.11, .1), (.16, .15), (.19, .19), (.15, .15), (.06, .06)], n=8, jit=.06, seed=2, cap1='point', smooth=2), 0)
    for s_ in (-1, 1):
        S = V((s_*.27, .02, .3)); E = V((s_*.42, -.28, -.02)); Wr = V((s_*.3, -.62, -.26))
        A_.add(f_loft([S + V((-s_*.06, 0, .05)), S.lerp(E, .5), E, E.lerp(Wr, .5), Wr], [.09, .075, .055, .05, .04], n=6, jit=.05, seed=3+s_, cap1='flat', smooth=2), 0)
        Hp = V((s_*.12, .06, -.55)); K = V((s_*.2, -.22, -.72)); An = V((s_*.17, .08, -.98))
        A_.add(f_loft([Hp, Hp.lerp(K, .5), K, K.lerp(An, .5), An], [.1, .08, .055, .045, .035], n=6, jit=.05, seed=6+s_, smooth=2), 0)
    bm = f_fuse(A_.bm, .022, 1500)
    a.add(bm, skin_pick(m, rr, -.1))
    for s_ in (-1, 1):
        Wr = V((s_*.3, -.62, -.26)); d0 = (Wr - V((s_*.42, -.28, -.02))).normalized()
        for k, o in enumerate((-1, 0, 1)):   # three long hooked talons per hand
            d = (d0 + V((o*.25, 0, 0)) + V((0, -.2, 0))).normalized()
            a.add(f_horn(Wr - d*.02 + V((o*.035, 0, 0)), d, .34, .028, bend=1.1, sides=4, axis=d.cross(V((0, 0, -1)))), m['claw'])
        An = V((s_*.17, .08, -.98))
        for o in (-1, 0, 1): a.add(f_horn(An + V((o*.04, 0, 0)), (o*.3, -1, -.5), .2, .022, bend=1.0, sides=4, axis=(1, 0, 0)), m['claw'])
        a.add(f_horn(V((s_*.24, .12, .4)), (s_*.4, .5, 1), .22, .04, bend=.5, sides=4), m['spike'])   # shoulder horns
        # V brows and slit eyes
        c = V((s_*.085, -.17, .66)); n = V((s_*.35, -1, .05)).normalized()
        lu = V((s_, 0, .45)).normalized(); uu = V((-s_*.45, 0, 1)).normalized()
        lens = [(1.0, .05), (.4, .36), (-.45, .3), (-1.0, -.06), (-.4, -.3), (.42, -.28)]
        b2 = bmesh.new(); vs = [b2.verts.new(c + n*.01 + lu*(x*.045) + uu*(y*.04)) for x, y in lens]; ct = b2.verts.new(c + n*.025)
        for k in range(6): b2.faces.new((vs[k], vs[(k+1) % 6], ct))
        a.add(dbl(b2), eye)
        a.add(f_loft([c + V((-s_*.05, -.02, .03)), c + V((s_*.02, -.03, .07)), c + V((s_*.09, -.01, .1))], [(.022, .03), (.026, .035), (.012, .015)], ref=(0, -1, .5), kind='keel', cap1='point', smooth=0), m['skin2'])
    for i in range(6):   # short face tentacles
        u = (i/5 - .5)*2
        a.add(f_tent(V((u*.08, -.16, .52)), (u*.3, -.3, -1), rr.uniform(.3, .45), .028, 950+i, n=6, curl=2.2, grav=.2), m['skin2'])
    tp = [V((0, .14, -.6)), V((0, .4, -.8)), V((0, .75, -.85)), V((0, 1.05, -.7)), V((0, 1.3, -.78))]   # spined tail
    a.add(f_loft(tp, [.07, .05, .035, .022, .012], n=6, cap1='point', smooth=2), m['skin'])
    for i in range(1, 4): a.add(f_horn(tp[i] + V((0, 0, .02)), (0, .3, 1), .1, .015, bend=.4, sides=4), m['spike'])
    for i in range(4): a.add(f_horn(V((0, .2 - i*.02, .3 - i*.2)), (0, 1, .4), .14, .025, bend=.5, sides=4, axis=(1, 0, 0)), m['spike'])
    for s_ in (-1, 1):   # little ribs
        for i in range(3):
            z = .05 - i*.11
            a.add(f_loft([V((s_*.2, .1, z)), V((s_*.28, -.05, z-.04)), V((s_*.2, -.17, z-.09))], [(.018, .012)]*3, kind='keel', ref=(0, 0, 1), cap0='point', cap1='point', smooth=0), m['skin2'])
def imp_wing(a, side):
    m = {k: a.m(k, v) for k, v in IC.items()}; rr = random.Random(95)
    P = lambda x, y, z: V((side*x, y, z))
    root = P(0, 0, 0); W = P(.6, .3, .45); tips = [P(1.0, .35, 1.15), P(1.95, .4, .55), P(1.8, .3, -.2)]; B = P(.25, .05, -.5)
    a.add(f_loft([root, W], [.05, .04], kind='oct', ref=(0, 0, 1), cap0='chamfer', cap1='chamfer', smooth=0), m['skin2'])
    for t in tips: a.add(f_loft([W, W.lerp(t, .5)+P(0, .03, 0), t], [.03, .018, .004], kind='oct', ref=(0, 0, 1), cap0='flat', cap1='point', smooth=2), m['spike'])
    a.add(f_horn(W, P(-.1, -.1, .4), .14, .02, bend=.6, sides=4), m['claw'])
    fingers = tips + [B]; mem = bmesh.new()
    for i in range(len(fingers)-1):
        A0, B0 = fingers[i], fingers[i+1]; hub = W if i < len(fingers)-2 else root.lerp(W, .5); grid = []
        for j in range(5):
            row = []
            for k in range(7):
                u = k/6; e = A0.lerp(B0, u).lerp(hub, .32*sin(pi*u));
                if j == 4 and 0 < k < 6: e = e.lerp(hub, rr.uniform(0, .12))
                row.append(mem.verts.new(hub.lerp(e, j/4) + P(0, .06*sin(pi*u)*sin(pi*j/4), 0)))
            grid.append(row)
        for j in range(4):
            for k in range(6): mem.faces.new((grid[j][k], grid[j][k+1], grid[j+1][k+1], grid[j+1][k]))
    bmesh.ops.triangulate(mem, faces=mem.faces); a.add(dbl(mem), m['mem'])
@asset('imp_wing_L', ground=False, flip=True, ao=.5, aod=.4)
def _(a): imp_wing(a, 1)
@asset('imp_wing_R', ground=False, flip=True, ao=.5, aod=.4)
def _(a): imp_wing(a, -1)
CTHULHU = ['cth_torso', 'cth_head', 'cth_eye', 'cth_tent', 'cth_uarm', 'cth_farm', 'cth_thigh', 'cth_palm', 'cth_finger_a', 'cth_finger_b', 'cth_wing_L', 'cth_wing_R', 'imp_body', 'imp_wing_L', 'imp_wing_R']

# faces (head, jaw, eyelids) keep their exact plates: subdividing them swallows the eyes and opens a seam at the jaw; engine smooth normals round them
SUBD = set(n for n in NATURE + PEOPLE + CTHULHU if not n.endswith(('_head', '_jaw', '_lids')))
ALL = [('nature.json', NATURE), ('props.json', PROPS+TOWNPROPS), ('buildings.json', BUILDINGS), ('people.json', PEOPLE), ('cthulhu.json', CTHULHU)]
def build_all():
    out = {}
    for fn, names in ALL: out[fn] = build(names, fn)
    return {k: {'sec': v['sec'], 'bytes': v['bytes'], 'tris': sum(v['tris'].values())} for k, v in out.items()}

@asset('car')
def _(a):
    body = a.m('body', '#80858a'); body2 = a.m('body2', '#6c7176'); glass = a.m('glass', '#22383e', .08); chrome = a.m('chrome', '#b8bcbe', .1); tire = a.m('tire', '#15191b'); dk = a.m('dark', '#1e2224')
    hl = a.m('headlight', '#ffe9a8', 1.0); tl = a.m('taillight', '#d0352a', .9)
    # (y, half width, bottom z, shoulder z, top half width, top z)
    secs = [(-2.12, .8, .3, .74, .74, .78), (-1.98, .88, .22, .82, .82, .87), (-1.0, .9, .2, .86, .84, .92), (-.62, .9, .2, .88, .82, .96), (-.2, .9, .2, .9, .68, 1.44), (.72, .9, .2, .9, .68, 1.45), (1.2, .9, .2, .89, .8, 1.0), (1.95, .88, .22, .86, .8, .93), (2.12, .8, .3, .8, .74, .84)]
    rings = [[V((-w, y, zb)), V((w, y, zb)), V((w, y, zs)), V((wt, y, zt)), V((-wt, y, zt)), V((-w, y, zs))] for (y, w, zb, zs, wt, zt) in secs]
    bm = loft(rings); a.add(bm, lambda f: body2 if f.calc_center_median().z < .45 else body)
    # glass: windshield, rear window, side windows
    a.add(dbl(quadstrip([V((-.8, -.6, .97)), V((.8, -.6, .97))], [V((-.66, -.23, 1.42)), V((.66, -.23, 1.42))])), glass)
    a.add(dbl(quadstrip([V((-.66, .76, 1.42)), V((.66, .76, 1.42))], [V((-.78, 1.17, 1.0)), V((.78, 1.17, 1.0))])), glass)
    for s in (-1, 1):
        a.add(dbl(quadstrip([V((s*.905, -.55, .98)), V((s*.905, 1.1, 1.0))], [V((s*.7, -.2, 1.38)), V((s*.7, .72, 1.39))])), glass)
        a.add(box(.02, .04, .4, (s*.84, .26, 1.17)), dk)
        for (yy, zz) in ((-.05, .62), (.85, .62)): a.add(box(.03, .14, .03, (s*.915, yy, zz)), chrome)
        a.add(box(.012, .02, .62, (s*.91, .3, .55)), dk); a.add(box(.012, .02, .62, (s*.91, -.62, .55)), dk)
        a.add(box(.08, .14, .08, (s*.98, -.52, .98)), body2)
        for yy in (-1.35, 1.35):
            a.add(cyl(.36, .36, .24, 12, T=Tr(s*.84, yy, .36) @ Ry(pi/2) @ Tr(0, 0, -.12)), tire)
            a.add(cyl(.2, .2, .03, 10, T=Tr(s*.97, yy, .36) @ Ry(pi/2) @ Tr(0, 0, -.015)), chrome)
            a.add(lathe([(.42, 0), (.42, .02)], 10, T=Tr(s*.9, yy, .36) @ Ry(pi/2) @ Tr(0, 0, -.01)), dk) if False else None
        a.add(cyl(.12, .12, .04, 10, T=Tr(s*.58, -2.12, .64) @ Rx(pi/2) @ Tr(0, 0, -.02)), hl)
        a.add(box(.3, .04, .12, (s*.6, 2.13, .64)), tl)
    a.add(box(1.84, .12, .12, (0, -2.18, .36)), chrome); a.add(box(1.84, .12, .12, (0, 2.18, .36)), chrome)
    a.add(box(.8, .04, .26, (0, -2.14, .58)), dk)
    for k in range(5): a.add(box(.76, .05, .02, (0, -2.16, .48+k*.05)), chrome)
    a.add(box(.42, .03, .12, (0, 2.15, .48)), a.m('plate', '#d8d2c0'))
    a.add(box(1.74, 4.1, .06, (0, 0, .23)), dk)
PROPS.append('car')
