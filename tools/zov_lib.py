# zov_lib.py — procedural low-poly assets for «Зов из тумана» (run inside Blender)
# Authoring convention: Blender Z-up, models face -Y ("front view"). Export maps to game coords (x, z, -y);
# assets with flip=True (the creature) are turned 180° first so they face game -Z.
import bpy, bmesh, math, random, json, base64, os, struct, time
from math import sin, cos, pi, radians, atan2, sqrt, hypot
from mathutils import Vector as V, Matrix as M, noise
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
def finalize(a):
    bm = a.bm
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    for f in list(bm.faces):
        if f.calc_area() < 1e-9: bm.faces.remove(f)
    for v in list(bm.verts):
        if not v.link_faces: bm.verts.remove(v)
    bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table(); bm.normal_update()
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
HOUSES = [[-22, -22, -12, -13, {}], [-5, -23, 6, -13, {'wall': '#8f8468', 'roof': '#4b3a36', 'lit': 1}], [-24, -3, -14, 6, {}], [-8, -3, 3, 5, {}], [16, -3, 27, 5, {}], [-8, 12, 3, 20, {}], [16, 12, 27, 20, {}], [-24, 12, -14, 18, {}],
          [-24, 24, -9, 36, {'wall': '#5d5346', 'roof': '#35302c', 'h': 4, 'rh': 2.6, 'lit': 0, 'noCh': 1}], [18, 24, 28, 31, {}], [15, 34, 21, 39, {'wall': '#6f6a5a', 'roof': '#3a4450', 'h': 2.8, 'rh': 1.6, 'lit': 0, 'noCh': 1}]]
WALLS = ['#8a8271', '#7d8a86', '#93856a', '#75807a']; ROOFS = ['#4b3a36', '#3a4450', '#54463a', '#3f4a48']
def slope_rows(a, axis, half, length, h, rh, ov, mats, under, rr, holes=.05):
    """shingled gable roof. axis='x': ridge along X (slopes face ±Y)."""
    run = half+ov; L = sqrt(run*run + (rh+ov*rh/half)**2); ang = atan2(rh, half)
    for side in (-1, 1):
        if axis == 'x': base = Tr(0, 0, h+rh) @ (Rz(pi) if side > 0 else M.Identity(4)) @ Rx(ang)
        else: base = Tr(0, 0, h+rh) @ Rz(pi/2) @ (Rz(pi) if side > 0 else M.Identity(4)) @ Rx(ang)
        a.add(box(length+.6, L+.05, .08, (0, -L/2, -.05), T=base), under)
        rows = int(L/.34)+1
        for j in range(rows):
            y = -(j+.5)*L/rows; x = -(length+.6)/2
            while x < (length+.6)/2:
                sl = rr.uniform(1.3, 3.0); sl = min(sl, (length+.6)/2-x)
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
def house_build(a, w, d, h=3.2, rh=2.2, wall=None, roof=None, lit=.4, noCh=False, door_dx=0, seed=0):
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
    ang = slope_rows(a, 'x' if ridge_x else 'y', half, length, h, rh, ov, [r1, r1, r2, r3], und, rr)
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
for i, (x0, z0, x1, z1, o) in enumerate(HOUSES):
    def mk(i=i, x0=x0, z0=z0, x1=x1, z1=z1, o=o):
        def f(a): house_build(a, x1-x0, z1-z0, o.get('h', 3.2), o.get('rh', 2.2), o.get('wall'), o.get('roof'), o.get('lit', .4), o.get('noCh', 0), 0, i)
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

# ================================================================ PEOPLE (part rigs: body / arm / leg)
def head(a, c, skin, st):
    """st: hair, hat, beard, eyes ('normal'|'bulge'|'sunken'), ears, nose, brow, mouth"""
    cx, cy, cz = c; sk = a.m('skin', skin); dk = a.m('eyes', '#1a1410'); wh = a.m('eyewhite', st.get('white', '#d9d2c0')); hr = a.m('hair', st.get('hair', '#3a2a1e')); lip = a.m('lip', mix(skin, '#5a2a2a', .35))
    bm = sph(.1, .108, .122, (0, 0, 0), 10, 8)
    for v in bm.verts:
        if v.co.z < -.02: v.co.x *= 1+(v.co.z+.02)*st.get('jaw', 2.2); v.co.y *= 1+(v.co.z+.02)*1.2
        if v.co.y > .05: v.co.y *= .92
    xform(bm, Tr(cx, cy, cz)); a.add(bm, sk)
    if st.get('ears', True):
        for s in (-1, 1): a.add(sph(.018, .03, .042, (cx+s*.1, cy+.01, cz), 6, 4), sk)
    eyes = st.get('eyes', 'normal'); ey = cy-.094; ez = cz+.018
    for s in (-1, 1):
        if eyes == 'bulge':
            a.add(sph(.027, .022, .025, (cx+s*.045, ey-.004, ez), 7, 5), wh); a.add(sph(.012, .01, .014, (cx+s*.047, ey-.026, ez), 6, 4), dk)
        elif eyes == 'sunken':
            a.add(sph(.025, .015, .022, (cx+s*.038, ey+.006, ez), 6, 4), dk)
        else:
            a.add(sph(.02, .012, .014, (cx+s*.04, ey, ez), 6, 4), wh); a.add(sph(.009, .008, .009, (cx+s*.041, ey-.011, ez), 5, 3), dk)
        a.add(box(.05, .016, .012, (cx+s*.042, ey-.004, ez+.032), T=None), hr if st.get('brow', True) else sk)
    nz_ = st.get('nose', 'normal')
    if nz_ == 'flat': a.add(sph(.02, .014, .016, (cx, cy-.11, cz-.012), 6, 4), sk)
    elif nz_ == 'long': a.add(cyl(.018, .004, .07, 4, T=Tr(cx, cy-.1, cz-.005) @ Rx(-1.75)), sk)
    else: a.add(cyl(.016, .004, .055, 4, T=Tr(cx, cy-.103, cz-.002) @ Rx(-1.9)), sk)
    mw = .06 if st.get('wide_mouth') else .04; a.add(box(mw, .012, .009, (cx, cy-.1, cz-.052)), lip)
    hair = st.get('hair_style', 'short')
    if hair == 'short' or hair == 'side':
        hb = sph(.106, .112, .118, (0, 0, 0), 10, 7); bmesh.ops.delete(hb, geom=[f for f in hb.faces if f.calc_center_median().y < -.03 and f.calc_center_median().z < .07] + ([f for f in hb.faces if f.calc_center_median().z > .06] if hair == 'side' else []), context='FACES')
        xform(hb, Tr(cx, cy+.008, cz+.01)); a.add(dbl(hb), hr)
    beard = st.get('beard')
    if beard == 'full':
        b = sph(.1, .09, .09, (cx, cy-.035, cz-.08), 8, 6); displace(b, .012, 30, 3); a.add(b, hr); a.add(box(.07, .02, .014, (cx, cy-.112, cz-.035)), hr)
    elif beard == 'stubble':
        b = sph(.098, .1, .07, (cx, cy-.01, cz-.06), 8, 5); bmesh.ops.delete(b, geom=[f for f in b.faces if f.calc_center_median().z > cz-.045], context='FACES'); a.add(dbl(b), a.m('stubble', mix(skin, '#2a2420', .45)))
    elif beard == 'mustache':
        for s in (-1, 1): a.add(cyl(.012, .006, .05, 5, T=Tr(cx+s*.005, cy-.108, cz-.035) @ Ry(s*1.9)), hr)
    if st.get('gills'):
        for s in (-1, 1):
            for k in range(3): a.add(box(.004, .03, .006, (cx+s*.06, cy+.02, cz-.1-k*.016)), a.m('gill', mix(skin, '#3a2a2a', .5)))
    hat = st.get('hat'); hc = a.m('hat', st.get('hat_col', '#4a3a2a')); hb_ = a.m('hatband', st.get('band', '#1e1a16'))
    if hat == 'fedora':
        a.add(cyl(.2, .19, .016, 14, at=(cx, cy, cz+.08)), hc); a.add(lathe([(.118, cz+.09), (.112, cz+.15), (.1, cz+.19), (.05, cz+.2)], 10, rf=lambda ang, z: 1-.12*max(0, cos(ang*2)) if z > cz+.17 else 1, T=Tr(cx, cy, 0)), hc)
        a.add(cyl(.12, .118, .028, 12, at=(cx, cy, cz+.095)), hb_)
    elif hat == 'beanie':
        a.add(sph(.118, .124, .1, (cx, cy+.005, cz+.04), 10, 6, T=None), hc); a.add(cyl(.122, .122, .04, 12, at=(cx, cy+.005, cz+.03)), hb_)
    elif hat == 'captain':
        a.add(cyl(.118, .13, .07, 12, at=(cx, cy+.01, cz+.07)), hc); a.add(cyl(.13, .13, .02, 12, at=(cx, cy+.01, cz+.14)), hc)
        a.add(box(.17, .09, .012, (cx, cy-.11, cz+.075), T=Tr(cx, cy-.11, cz+.075) @ Rx(-.25) @ Tr(-cx, -(cy-.11), -(cz+.075))), hb_); a.add(box(.04, .01, .025, (cx, cy-.12, cz+.105)), a.m('badge', '#b08d3c', .3))
    elif hat == 'flatcap':
        b = sph(.125, .14, .05, (cx, cy-.015, cz+.085), 10, 5); a.add(b, hc); a.add(box(.16, .07, .015, (cx, cy-.13, cz+.07)), hc)
    if st.get('pipe'): a.add(tube([(cx+.02, cy-.1, cz-.055), (cx+.05, cy-.17, cz-.07), (cx+.06, cy-.19, cz-.04)], .008, 4), a.m('pipe', '#3a2a1e'))
    if st.get('glasses'):
        for s in (-1, 1): a.add(tube([V((cx+s*.042+cos(t)*.022, ey-.016, ez+sin(t)*.02)) for t in [k/8*2*pi for k in range(9)]], .003, 3, False, False), a.m('frames', '#2a2a2a'))
def torso(a, cfg):
    k = cfg.get('k', 1.0); kz = cfg.get('kz', 1.0); cm = a.m('cloth', cfg['cloth']); c2 = a.m('cloth2', cfg.get('cloth2', mix(cfg['cloth'], '#000000', .2))); sk = cfg['skin']
    secs = [(.84, .165, .115, 0), (.98, .152, .104, 0), (1.12, .16, .11, -.008), (1.28, .182, .125, -.012), (1.4, .2, .122, -.006), (1.48, .17, .1, 0), (1.54, .06, .055, .005), (1.62, .052, .05, .01)]
    rings = [ell(rx*k, ry*k*cfg.get('kd', 1), z*kz, 12, 0, cy) for (z, rx, ry, cy) in secs]
    A_ = A('tmp'); A_.bm = loft(rings)
    for s in (-1, 1): A_.add(sph(.09*k, .085*k, .08, (s*.215*k, 0, 1.45*kz), 8, 6), 0)
    bm = modproc(A_.bm, subsurf=1); bm = modproc(bm, target=700)
    a.add(bm, lambda f: a.m('skin', sk) if f.calc_center_median().z > 1.535*kz else cm)
    head(a, (0, -.005, 1.745*kz), sk, cfg.get('head', {}))
    return cm, c2
@asset('hero_body')
def _(a):
    cm, c2 = torso(a, {'cloth': '#8a7450', 'cloth2': '#6f5c3e', 'skin': '#c9a183', 'head': {'hat': 'fedora', 'hat_col': '#4a3a2a', 'hair': '#3a2a1e', 'hair_style': 'short'}})
    shirt = a.m('shirt', '#c9c2b0'); tie = a.m('tie', '#a33a30'); bt = a.m('button', '#2a2016'); belt = a.m('belt', '#4a3a28')
    a.add(tri_fan([V((0, -.135, 1.47)), V((-.07, -.128, 1.5)), V((0, -.14, 1.3)), V((.07, -.128, 1.5))]), shirt)
    a.add(tri_fan([V((0, -.142, 1.47)), V((-.018, -.141, 1.44)), V((0, -.146, 1.29)), V((.018, -.141, 1.44))]), tie)
    for s in (-1, 1): a.add(tri_fan([V((s*.02, -.14, 1.3)), V((s*.09, -.128, 1.5)), V((s*.15, -.105, 1.47)), V((s*.08, -.13, 1.26))]), c2)
    a.add(tube([V((cos(t)*.168, sin(t)*.115, 1.0)) for t in [k/14*2*pi for k in range(15)]], .022, 4, False, False), belt)
    rings = [ell(.172, .12, 1.0), ell(.2, .14, .82), ell(.235, .165, .62)]
    a.add(dbl(loft(rings, False, False)), cm)
    for z in (1.18, 1.08, .9, .76): a.add(sph(.012, at=(.04, -.138 if z > 1 else -.15-(1-z)*.15, z), seg=5, rings=3), bt)
    for s in (-1, 1): a.add(box(.1, .02, .08, (s*.12, -.17, .78)), c2)
    a.add(tube([V((cos(t)*.07, sin(t)*.06, 1.56)) for t in [k/10*2*pi for k in range(11)]], .028, 4, False, False), c2)
def arm(a, sleeve, skin, k=1.0, cuff=None, wide=False, hold=None):
    sl = a.m('cloth', sleeve); sk = a.m('skin', skin); cf = a.m('cuff', cuff or mix(sleeve, '#000000', .2))
    if wide:
        a.add(lathe([(.085, 0), (.095, -.2), (.12, -.42), (.15, -.6)], 10, cap0=True, cap1=False, T=Sc(k)), sl)
        a.add(dbl(lathe([(.14, -.58), (.15, -.6)], 10, cap0=False, cap1=False, T=Sc(k))), cf)
        a.add(tube([(0, 0, -.1), (0, .01, -.4), (0, 0, -.6)], [.04*k, .033*k, .028*k], 6), sk)
    else:
        A_ = A('tmp'); A_.bm = tube([(0, 0, .04), (0, .006, -.15), (0, .012, -.3), (0, .0, -.45), (0, -.008, -.57)], [.075*k, .072*k, .06*k, .056*k, .05*k], 8); A_.add(sph(.064*k, at=(0, .01, -.3), seg=6, rings=4), 0)
        a.add(modproc(modproc(A_.bm, subsurf=1), target=150), sl); a.add(cyl(.058*k, .058*k, .05, 8, at=(0, -.008, -.6)), cf)
    hz = -.64
    a.add(box(.075*k, .04*k, .09, (0, -.01, hz)), sk); a.add(box(.07*k, .042*k, .06, (0, -.03, hz-.07), T=Tr(0, -.03, hz-.07) @ Rx(.35) @ Tr(0, .03, -(hz-.07))), sk)
    a.add(box(.022, .03, .05, (-.04*k, -.035, hz-.01), T=Tr(-.04*k, -.035, hz-.01) @ Ry(.4) @ Tr(.04*k, .035, -(hz-.01))), sk)
    if hold: hold(a, hz)
def leg(a, trousers, boot='#1c1a18', k=1.0):
    tr = a.m('trousers', trousers); bt = a.m('boot', boot); bt2 = a.m('sole', '#0e0d0c')
    A_ = A('tmp'); A_.bm = tube([(0, 0, .04), (0, -.012, -.2), (0, -.02, -.42), (0, -.01, -.6), (0, 0, -.78)], [.09*k, .082*k, .066*k, .058*k, .054*k], 8); A_.add(sph(.068*k, at=(0, -.024, -.42), seg=6, rings=4), 0)
    a.add(modproc(modproc(A_.bm, subsurf=1), target=170), tr)
    a.add(cyl(.058*k, .062*k, .12, 8, at=(0, 0, -.86)), bt); a.add(sph(.06*k, .1*k, .05, (0, -.07, -.86), 8, 5), bt); a.add(box(.12*k, .27*k, .03, (0, -.05, -.885)), bt2)
def crowbar(a, hz):
    ir = a.m('steel', '#7d8388', .1); a.add(tube([(0, .1, hz-.02), (0, -.85, hz-.04), (0, -.95, hz+.04), (0, -.9, hz+.1)], .016, 5), ir)
def club(a, hz):
    w = a.m('club', '#6b5134'); a.add(tube([(0, .08, hz-.02), (0, -.45, hz-.03), (0, -.95, hz-.02)], [.026, .038, .06], 6), w)
    for i in range(3): a.add(sph(.022, at=(.03*(-1)**i, -.6-i*.12, hz-.02+.03*(-1)**i), seg=5, rings=3), w)
def torch(a, hz):
    w = a.m('shaft', '#3a2a1a'); c = a.m('wrap', '#2a2018'); e = a.m('ember', '#ff8a2a', .9)
    a.add(tube([(0, .08, hz-.02), (0, -.5, hz-.05), (0, -.82, hz-.08)], [.02, .022, .026], 5), w)
    a.add(cyl(.05, .058, .18, 7, T=Tr(0, -.82, hz-.08) @ Rx(pi/2) @ Tr(0, 0, -.16)), c)
    for i in range(5): a.add(ico(.016, 0, (cos(i*1.3)*.05, -.88-i*.015, hz-.08+sin(i*1.3)*.05)), e)
@asset('hero_arm')
def _(a): arm(a, '#8a7450', '#c9a183', cuff='#6f5c3e')
@asset('hero_armW')
def _(a): arm(a, '#8a7450', '#c9a183', cuff='#6f5c3e', hold=crowbar)
@asset('hero_leg')
def _(a): leg(a, '#3a3530')
VSKIN = '#a8a088'
@asset('vill_body_0')
def _(a):
    cm, c2 = torso(a, {'cloth': '#5a6b4a', 'skin': VSKIN, 'k': 1.08, 'head': {'hat': 'beanie', 'hat_col': '#2f3a3c', 'band': '#262e30', 'eyes': 'bulge', 'nose': 'flat', 'ears': False, 'wide_mouth': 1, 'gills': 1, 'beard': 'stubble', 'jaw': 1.2}})
    for z in (.9, 1.0, 1.1): a.add(tube([V((cos(t)*.176*1.08, sin(t)*.122*1.08, z)) for t in [k/14*2*pi for k in range(15)]], .012, 3, False, False), c2)
    a.add(tube([V((cos(t)*.075, sin(t)*.068, 1.56)) for t in [k/10*2*pi for k in range(11)]], .04, 5, False, False), c2)
    a.add(loft([ell(.19, .13, .86), ell(.2, .14, .78)], False, False), c2)
@asset('vill_body_1')
def _(a):
    cm, c2 = torso(a, {'cloth': '#6b5346', 'skin': VSKIN, 'head': {'hat': 'captain', 'hat_col': '#232a36', 'band': '#15181e', 'eyes': 'bulge', 'beard': 'full', 'hair': '#9a9588', 'pipe': 1, 'ears': False, 'gills': 1}})
    rings = [ell(.172, .12, 1.0), ell(.21, .15, .78), ell(.24, .17, .58)]; a.add(dbl(loft(rings, False, False)), cm)
    for z in (1.35, 1.2, 1.05, .9): a.add(box(.035, .02, .02, (0, -.142 if z > 1 else -.16, z)), a.m('toggle', '#c9b98a'))
    a.add(tube([V((cos(t)*.09, sin(t)*.08, 1.53)) for t in [k/10*2*pi for k in range(11)]], .035, 5, False, False), a.m('scarf', '#5a2a2a'))
@asset('vill_body_2')
def _(a):
    cm, c2 = torso(a, {'cloth': '#4f5d6b', 'skin': VSKIN, 'k': .92, 'kz': 1.05, 'head': {'hat': 'flatcap', 'hat_col': '#3a3a36', 'eyes': 'sunken', 'nose': 'long', 'wide_mouth': 1, 'ears': False, 'gills': 1, 'jaw': 2.8}})
    rings = [ell(.16, .112, 1.03), ell(.19, .13, .8), ell(.22, .15, .55)]; a.add(dbl(loft(rings, False, False)), cm)
    a.add(tube([V((cos(t)*.07, sin(t)*.062, 1.6)) for t in [k/10*2*pi for k in range(11)]], .025, 4, False, False), c2)
@asset('vill_body_3')
def _(a):
    cm, c2 = torso(a, {'cloth': '#77705f', 'skin': '#b8987e', 'k': 1.16, 'kd': 1.15, 'head': {'hair_style': 'side', 'hair': '#5a4a3a', 'beard': 'mustache', 'glasses': 1, 'eyes': 'normal'}})
    ap = a.m('apron', '#b9b4a4'); shirt = a.m('shirt', '#c9c2b0')
    a.add(quadstrip([V((-.15, -.158, 1.36)), V((.15, -.158, 1.36))], [V((-.2, -.2, .62)), V((.2, -.2, .62))]), ap)
    a.add(dbl(quadstrip([V((-.15, -.158, 1.36)), V((.15, -.158, 1.36))], [V((-.2, -.2, .62)), V((.2, -.2, .62))])), ap)
    a.add(tube([V((cos(t)*.2*1.16, sin(t)*.14*1.16, 1.05)) for t in [k/14*2*pi for k in range(15)]], .012, 3, False, False), ap)
    rings = [ell(.19, .14, .86), ell(.2, .15, .7)]; a.add(loft(rings, False, True), a.m('trousers2', '#33302c'))
@asset('vill_arm')
def _(a): arm(a, '#808080', VSKIN)
@asset('vill_armW')
def _(a): arm(a, '#808080', VSKIN, hold=club)
@asset('vill_leg')
def _(a): leg(a, '#808080', '#1c1a18')
@asset('cult_body')
def _(a):
    rb = a.m('robe', '#4d1d22'); rb2 = a.m('robe2', '#32131a'); rb3 = a.m('robe3', '#5e262b'); inn = a.m('hood_in', '#0c0708'); face = a.m('skin', '#8f8f7a'); rope = a.m('rope', '#b9a36a'); sig = a.m('sigil', '#5fd6c0', .6)
    eye = a.m('eye', '#ffd27a', .75); sock = a.m('socket', '#0a0806')
    prof = [(.44, .01), (.4, .25), (.34, .6), (.27, .95), (.24, 1.2), (.23, 1.38), (.18, 1.5), (.09, 1.56)]
    fold = lambda ang, z: 1+.075*sin(ang*7+z*2.5)*max(0, 1-z/1.5)+.02*sin(ang*13)
    bm = lathe(prof, 18, rf=fold, cap0=True, cap1=True)
    a.add(bm, lambda f: (rb2 if sin(atan2(f.calc_center_median().y, f.calc_center_median().x)*7+f.calc_center_median().z*2.5) < -.3 else (rb3 if sin(atan2(f.calc_center_median().y, f.calc_center_median().x)*7) > .8 else rb)))
    a.add(lathe([(.34, 1.18), (.3, 1.32), (.2, 1.5), (.1, 1.56)], 14, rf=lambda ang, z: 1+.05*sin(ang*6), cap0=False, cap1=False), rb2)
    a.add(dbl(lathe([(.34, 1.18), (.3, 1.32)], 14, cap0=False, cap1=False)), rb2)
    # hood: shell with a front opening, double sided so the inside reads dark
    hood = sph(.2, .22, .24, (0, .02, 1.74), 14, 10)
    for v in hood.verts:
        if v.co.z > 1.8: v.co.y += (v.co.z-1.8)*.6
    bmesh.ops.delete(hood, geom=[f for f in hood.faces if f.calc_center_median().y < -.08 and 1.56 < f.calc_center_median().z < 1.9 and abs(f.calc_center_median().x) < .15], context='FACES')
    a.add(hood.copy(), rb2); hood2 = hood
    for v in hood2.verts: v.co = V((0, .02, 1.74)) + (v.co-V((0, .02, 1.74)))*.94
    for f in hood2.faces: f.normal_flip()
    a.add(hood2, inn)
    a.add(cyl(.02, 0, .22, 5, T=Tr(0, .16, 1.9) @ Rx(.9)), rb2)
    # gaunt face deep inside the hood
    hf = sph(.088, .095, .11, (0, -.03, 1.72), 10, 7)
    for v in hf.verts:
        if v.co.z < 1.7: v.co.x *= 1-(1.7-v.co.z)*3.0
    a.add(hf, face)
    for s in (-1, 1):
        a.add(sph(.026, .016, .022, (s*.034, -.112, 1.745), 6, 4), sock); a.add(sph(.008, .006, .008, (s*.034, -.124, 1.745), 4, 3), eye)
        a.add(sph(.02, .012, .03, (s*.055, -.1, 1.69), 5, 3), sock)
    a.add(cyl(.014, .002, .05, 4, T=Tr(0, -.118, 1.72) @ Rx(-1.8)), face); a.add(box(.04, .01, .006, (0, -.115, 1.655)), sock)
    a.add(tube([V((cos(t)*.255, sin(t)*.255, .98)) for t in [k/16*2*pi for k in range(17)]], .018, 4, False, False), rope)
    for s in (-1, 1): a.add(tube([(s*.06, -.25, .97), (s*.08, -.29, .7), (s*.07, -.31, .5)], [.014, .013, .02], 4), rope)
    a.add(cyl(.045, .045, .012, 10, T=Tr(0, -.215, 1.26) @ Rx(pi/2+.25)), rope); a.add(box(.06, .016, .012, (0, -.224, 1.265)), sig); a.add(box(.012, .016, .06, (0, -.224, 1.265)), sig)
@asset('cult_arm')
def _(a): arm(a, '#4d1d22', '#8f8f7a', wide=True, cuff='#32131a', k=1.05)
@asset('cult_armT')
def _(a): arm(a, '#4d1d22', '#8f8f7a', wide=True, cuff='#32131a', k=1.05, hold=torch)
@asset('flame', ground=False, ao=0)
def _(a):
    o = a.m('outer', '#ff7a1a', 1.0); i = a.m('inner', '#ffe08a', 1.0)
    a.add(lathe([(.09, 0), (.13, .08), (.1, .2), (.05, .3), (0, .4)], 7, rf=lambda ang, z: 1+.25*sin(ang*3+z*9)), o)
    a.add(lathe([(.05, .02), (.07, .08), (.04, .18), (0, .26)], 6), i)
PEOPLE = ['hero_body', 'hero_arm', 'hero_armW', 'hero_leg', 'vill_body_0', 'vill_body_1', 'vill_body_2', 'vill_body_3', 'vill_arm', 'vill_armW', 'vill_leg', 'cult_body', 'cult_arm', 'cult_armT', 'flame']

# ================================================================ THE GREAT OLD ONE (part rig; authored facing -Y, exported with flip)
CC = {'skin': '#1d4240', 'skin2': '#163536', 'skinL': '#2a5650', 'belly': '#3a5846', 'plate': '#2c4a3c', 'barn': '#6a6e66', 'weed': '#1c3622', 'claw': '#181512', 'socket': '#050807', 'mem': '#16302e', 'vein': '#0e2120', 'spike': '#24302c'}
def cmats(a): return {k: a.m(k, v) for k, v in CC.items()}
def skin_pick(m, rr, z_belly=None):
    def f(face):
        c = face.calc_center_median(); n = face.normal
        if z_belly is not None and n.y < -.45 and c.z < z_belly: return m['plate'] if int(c.z/2.1) % 2 else m['belly']
        r = rr.random()
        return m['skinL'] if (n.z > .55 and r < .5) else (m['skin2'] if r < .35 else m['skin'])
    return f
@asset('cth_torso', ground=False, flip=True, ao=1.3, aod=6)
def _(a):
    m = cmats(a); rr = random.Random(61)
    secs = [(-7, 9.5, 8, 0), (-2, 12, 9.5, -.5), (4, 13.2, 10.5, -1.6), (10, 13.8, 11.2, -2.2), (16, 14.6, 11.2, -1.2), (21, 16.0, 11.0, .4), (25.5, 16.8, 10.4, 1.8), (29, 14.5, 9.5, 2.6), (32, 9.5, 7.8, 2.0), (34.5, 6.8, 6.2, .6)]
    rings = [ell(rx, ry, z, 24, 0, cy) for (z, rx, ry, cy) in secs]
    bm = loft(rings)
    A_ = A('tmp'); A_.bm = bm
    for s_ in (-1, 1):
        for b in (sph(8.2, 7.6, 7.4, (s_*15.5, 1.0, 28.0), 12, 9), sph(8.5, 7.0, 5.2, (s_*8.0, 3.5, 32.0), 10, 7), sph(6.5, 5.5, 8.5, (s_*11, 2.5, 13), 9, 7)):
            A_.add(b, 0)
    A_.add(sph(9, 6, 7, (0, 7.5, 27), 12, 8), 0)
    bm = modproc(A_.bm, subsurf=1)
    displace(bm, 1.5, .08, 3, 3); displace(bm, .45, .4, 9, 2)
    bm = modproc(bm, target=5200)
    a.add(bm, skin_pick(m, rr, 21))
    for s_ in (-1, 1):
        for k in range(5): a.add(tube([V((s_*8.5, -7.5+k*.4, 14+k*2.2)), V((s_*13.2, -2+k*.3, 13.5+k*2.2)), V((s_*14.2, 4, 13+k*2.2))], [.55, .7, .3], 5), m['skin2'])
    # dorsal spines and ridges along the hunched back
    for i in range(11):
        z = 6+i*2.6; y = 10.3+sin(i*.5)*.8+(2.2 if z > 22 else 0); h = 2.2+1.6*sin(i/10*pi)
        a.add(cyl(1.1, 0, h, 5, T=Tr(0, y, z) @ Rx(-1.0-.15*i/10)), m['spike'])
        for s_ in (-1, 1):
            if i % 2 == 0: a.add(cyl(.6, 0, h*.55, 4, T=Tr(s_*4.5, y-1.3, z+.6) @ Rx(-1.1) @ Ry(s_*.4)), m['spike'])
    # barnacles, coral and sea-weed on the shoulders and back
    for i in range(70):
        s_ = rr.choice((-1, 1)); ang = rr.uniform(0, 2*pi); p = V((s_*15.5, .5, 28.5)) + V((cos(ang)*7*rr.uniform(.6, 1), sin(ang)*6.5*rr.uniform(.3, 1), rr.uniform(-1, 6.5)))
        if i > 40: p = V((rr.uniform(-12, 12), rr.uniform(6, 11), rr.uniform(4, 30)))
        a.add(cyl(rr.uniform(.35, .8), rr.uniform(.15, .35), rr.uniform(.4, 1.1), 5, at=tuple(p)), m['barn'])
    for i in range(16):
        s_ = rr.choice((-1, 1)); x0 = s_*rr.uniform(6, 20); y0 = rr.uniform(-3, 10); z0 = rr.uniform(24, 33); L = rr.uniform(5, 11)
        pts = [V((x0+sin(k*.9)*.6, y0+cos(k*.7)*.4-k*.1, z0-k*L/5)) for k in range(6)]
        a.add(tube(pts, [.5, .45, .38, .3, .2, .05], 4, sq=.25), m['weed'])
@asset('cth_head', ground=False, flip=True, ao=1.3, aod=4)
def _(a):
    m = cmats(a); rr = random.Random(62)
    face = sph(7.8, 7.6, 7.2, (0, -3.2, 7.4), 16, 12)
    mant = loft([ell(r*1.05, r*.95, z, 20, 0, y) for (z, y, r) in ((8.5, 0, 7.6), (12, 3, 9.2), (15.5, 6.5, 9.8), (18.8, 10.5, 9.0), (21.4, 15, 7.4), (23, 19.5, 5.4), (23.6, 23.5, 3.2), (23.2, 26.2, 1.2), (22.6, 27.2, .2))])
    for v in mant.verts: v.co.z += sin(v.co.y*.35)*.4 - max(0, v.co.y-15)*.18
    A_ = A('tmp'); A_.bm = face; A_.add(mant, 0)
    for s_ in (-1, 1):
        br = cyl(1.6, .3, 5.2, 5, T=Tr(s_*1.2, -9.4, 9.8) @ Ry(s_*(1.9)) @ Rx(.15)); A_.add(br, 0)
        A_.add(sph(3.0, 3.2, 3.4, (s_*6.6, -5.0, 5.0), 9, 7), 0)
        A_.add(sph(2.4, 4.0, 2.0, (s_*7.8, 2.0, 12.5), 8, 6), 0)
    bm = modproc(A_.bm, subsurf=1)
    displace(bm, .55, .2, 5, 3); displace(bm, .18, .9, 6, 2)
    bm = modproc(bm, target=3800)
    a.add(bm, skin_pick(m, rr))
    for s_ in (-1, 1):
        a.add(sph(2.5, 1.4, 1.4, (s_*3.6, -9.2, 8.4), 10, 6), m['socket'])
        for k in range(4): a.add(box(.25, 2.6, .9, (s_*8.0, -1.0+k*1.0, 5.2-k*.4), T=Tr(s_*8.0, -1.0+k*1.0, 5.2-k*.4) @ Rz(s_*.25) @ Tr(-s_*8.0, 1.0-k*1.0, -(5.2-k*.4))), m['socket'])
        for k in range(3): a.add(cyl(.9, 0, 3.2, 5, T=Tr(s_*(6.5+k*.6), 6+k*3, 15-k*.8) @ Rx(-1.2) @ Ry(s_*.6)), m['spike'])
    a.add(sph(3.4, 1.8, 2.2, (0, -7.2, 2.8), 10, 6), m['socket'])
    for i in range(8):
        s_ = -1 if i % 2 else 1; x0 = s_*(3.2+(i//2)*1.3); z0 = 5.5-(i//2)*.9
        pts = [V((x0, -8.5, z0)), V((x0*1.25, -9.6, z0-2.2)), V((x0*1.35, -9.2, z0-4.2)), V((x0*1.1, -8.4, z0-5.6))]
        a.add(tube(pts, [.75, .55, .35, .1], 5), m['skin2'])
@asset('cth_eye', ground=False, flip=True, ao=0)
def _(a):
    e = a.m('eye', '#ff3a1a', 1.0); p = a.m('pupil', '#140402', .0); g = a.m('glow', '#ffb060', 1.0)
    a.add(sph(1.95, .8, .98, (0, 0, 0), 12, 8), e); a.add(sph(.9, .5, .5, (0, -.5, 0), 8, 5), g); a.add(box(.32, .3, 1.55, (0, -.72, 0)), p)
@asset('cth_tent', ground=False, flip=True, ao=.6, aod=1.5)
def _(a):
    m = cmats(a); suck = a.m('sucker', '#4a6a5a')
    bm = lathe([(1.0, .25), (1.0, 0), (.97, -1.3), (.93, -2.6), (.9, -3.95)], 10); displace(bm, .05, 2, 4)
    a.add(bm, lambda f: m['skinL'] if f.normal.y < -.5 else m['skin'])
    for k in range(3): a.add(cyl(.27-.02*k, .2-.02*k, .1, 6, T=Tr(0, .9, -.7-k*1.15) @ Rx(-pi/2) @ Tr(0, 0, -.05)), suck)
def limb(a, name_len, radii, seg, seed, spikes=0, bulges=()):
    m = cmats(a); rr = random.Random(seed); L = name_len
    n = len(radii); pts = [V((0, 0, -L*i/(n-1))) for i in range(n)]
    bm = tube(pts, radii, seg)
    A_ = A('tmp'); A_.bm = bm
    for (z, rx, ry, rz, y) in bulges: A_.add(sph(rx, ry, rz, (0, y, z), 10, 7), 0)
    bm = modproc(A_.bm, subsurf=1); displace(bm, radii[0]*.08, .5/radii[0], seed, 3)
    bm = modproc(bm, target=900); a.add(bm, skin_pick(m, rr))
    for i in range(spikes):
        z = -L*(.15+.7*i/max(1, spikes-1)); r = radii[0]*(1-.3*i/max(1, spikes))
        a.add(cyl(r*.22, 0, r*.85, 5, T=Tr(0, r*.85, z) @ Rx(-1.9)), m['spike'])
@asset('cth_uarm', ground=False, flip=True, ao=1.0, aod=5)
def _(a): limb(a, 26, [5.8, 5.6, 5.2, 4.9, 4.5], 14, 71, 3, bulges=((-2, 6.6, 6.4, 6.0, 0), (-11, 4.2, 4.6, 6.5, -2.2)))
@asset('cth_farm', ground=False, flip=True, ao=1.0, aod=4)
def _(a): limb(a, 24, [4.7, 4.5, 4.0, 3.5, 3.1], 12, 72, 5, bulges=((-5, 4.4, 4.0, 6, .5),))
@asset('cth_thigh', ground=False, flip=True, ao=1.0, aod=5)
def _(a): limb(a, 24, [7.0, 6.8, 6.0, 5.2, 4.6], 14, 73, 0, bulges=((-6, 7.2, 7.0, 8, -1),))
@asset('cth_palm', ground=False, flip=True, ao=1.1, aod=2.5)
def _(a):
    m = cmats(a); rr = random.Random(74)
    rings = [ell(3.0, 1.9, -z, 14, 0, 0, f=(lambda ang, z=z: 1+.12*sin(ang*2))) for z in (0, 1.5)] + [ell(3.4, 1.4, -3.4, 14), ell(3.3, 1.2, -5.0, 14)]
    bm = loft(rings); bm = modproc(bm, subsurf=1); displace(bm, .18, .6, 7, 2); bm = modproc(bm, target=700)
    a.add(bm, lambda f: m['belly'] if f.normal.y < -.6 else (m['skin2'] if rr.random() < .3 else m['skin']))
    for x in (-2.5, -.85, .85, 2.5): a.add(sph(.95, 1.1, .9, (x, 0, -5.3), 8, 6), m['skin2'])
    for i in range(3):
        x = -1.7+i*1.7; a.add(dbl(tri_fan([V((x, -.2, -4.6)), V((x-.85, -.1, -6.6)), V((x+.85, -.1, -6.6))])), m['mem'])
@asset('cth_finger_a', ground=False, flip=True, ao=.8, aod=1.5)
def _(a):
    m = cmats(a); bm = lathe([(.95, .2), (1.02, -.4), (.88, -2.0), (.8, -3.3), (.86, -3.75)], 9); displace(bm, .05, 2.5, 8)
    a.add(bm, lambda f: m['belly'] if f.normal.y < -.6 else m['skin']); a.add(sph(1.0, 1.0, .9, (0, 0, -.1), 8, 6), m['skin2'])
@asset('cth_finger_b', ground=False, flip=True, ao=.8, aod=1.5)
def _(a):
    m = cmats(a); bm = lathe([(.78, .15), (.72, -1.2), (.6, -2.6), (.5, -3.1)], 8); displace(bm, .04, 3, 9)
    a.add(bm, lambda f: m['belly'] if f.normal.y < -.6 else m['skin']); a.add(sph(.8, .8, .7, (0, 0, -.05), 8, 5), m['skin2'])
    pts = [V((0, 0, -2.9)), V((0, -.3, -4.2)), V((0, -1.1, -5.4)), V((0, -2.2, -6.0))]
    a.add(tube(pts, [.5, .38, .22, .02], 6), m['claw'])
def wing(a, side):
    m = cmats(a); rr = random.Random(80)
    P = lambda x, y, z: V((side*x, y, z))
    root = P(0, 0, 0); W = P(14, 10, 24); tips = [P(22, 12, 46), P(42, 16, 30), P(44, 14, 4)]; B = P(8, 4, -16)
    bone = m['spike']; mem = m['mem']; vein = m['vein']
    a.add(tube([root, (root+W)/2+P(0, 1.5, 0), W], [1.9, 1.6, 1.2], 7), m['skin2'])
    for t in tips: a.add(tube([W, W+(t-W)*.5+P(0, 1.2, 0), t], [1.15, .6, .12], 6), bone)
    a.add(tube([W, W+P(-1, -1.5, 3.5), W+P(-2.5, -3.5, 4.5)], [.6, .3, .02], 5), m['claw'])
    edge = [tips[0]]
    for i in range(2):
        a_, b_ = tips[i], tips[i+1]
        for k in range(1, 7):
            t = k/7; p = a_.lerp(b_, t); p = p.lerp(W, sin(t*pi)*.3); edge.append(p)
        edge.append(b_)
    for k in range(1, 8):
        t = k/8; p = tips[2].lerp(B, t); p = p.lerp(W.lerp(root, .5), sin(t*pi)*.28); edge.append(p)
    edge.append(B)
    bm = bmesh.new(); w0 = bm.verts.new(W); r0 = bm.verts.new(root); ev = [bm.verts.new(p) for p in edge]
    for i in range(len(ev)-1):
        if i < 14: bm.faces.new((w0, ev[i], ev[i+1]))
        else: bm.faces.new((r0, ev[i], ev[i+1]))
    bm.faces.new((w0, ev[14], r0))
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=2, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    for v in bm.verts: v.co += V((0, nz(v.co, .12, 4)*1.2, 0))
    a.add(dbl(bm), mem)
    for i in range(0, len(edge), 3):
        if i < 14: a.add(tube([W, W.lerp(edge[i], .55), edge[i]], [.35, .25, .05], 4), vein)
@asset('cth_wing_L', ground=False, flip=True, ao=.8, aod=6)
def _(a): wing(a, 1)
@asset('cth_wing_R', ground=False, flip=True, ao=.8, aod=6)
def _(a): wing(a, -1)
CTHULHU = ['cth_torso', 'cth_head', 'cth_eye', 'cth_tent', 'cth_uarm', 'cth_farm', 'cth_thigh', 'cth_palm', 'cth_finger_a', 'cth_finger_b', 'cth_wing_L', 'cth_wing_R']

ALL = [('nature.json', NATURE), ('props.json', PROPS), ('buildings.json', BUILDINGS), ('people.json', PEOPLE), ('cthulhu.json', CTHULHU)]
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
