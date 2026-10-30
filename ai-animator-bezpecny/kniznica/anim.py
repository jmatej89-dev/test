"""AI Animátor – knižnica pre Blender (beží VO VNÚTRI Blenderu, cez nastroje/render.py).

Scéna videa = jeden súbor projekty/<nazov>/scena.py:

    import sys, os; sys.path.insert(0, os.environ["ANIM_KNIZNICA"])
    from anim import *
    init(dlzka=24.0, svetlo="den")
    ... postav svet, postavičky, kameru, animácie (časy berieš zo slov: T("Grónsko")) ...
    spusti()

Všetko, čo tu je, je rýchle (bmesh, žiadne bpy.ops okrem textu) a funguje v Blenderi 4.2 až 5.x.
Podrobný návod: .claude/skills/animacia/scena.md
"""
import bpy, bmesh, math, random, json, os, sys, unicodedata
from mathutils import Vector, Matrix, Euler, Quaternion

KNIZNICA = os.path.dirname(os.path.abspath(__file__))
KOREN = os.path.dirname(KNIZNICA)
PISMO = os.path.join(KOREN, "pisma", "Nunito-Black.ttf")
PISMO2 = os.path.join(KOREN, "pisma", "Outfit-Black.ttf")

# argumenty od render.py:  blender -b --python scena.py -- <projekt> <rezim> [arg]
_argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PROJ = os.path.abspath(_argv[0]) if _argv else os.getcwd()
REZIM = _argv[1] if len(_argv) > 1 else "nahlad"
REZIM_ARG = _argv[2] if len(_argv) > 2 else ""

FPS = 30
DLZKA = 10.0
W, H = 1080, 1920
coll = None
KAM = None
_cache = {}


def F(t):
    """čas v sekundách → číslo snímky (1 = začiatok)"""
    return int(round(t * FPS)) + 1


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def lerp(a, b, u):
    if isinstance(a, (tuple, list, Vector)):
        return Vector(a).lerp(Vector(b), u)
    return a + (b - a) * u


# ======================================================================
# slová z hlasu (slova.json od nastroje/slova.py) → časy pre animácie
# ======================================================================
def _norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn" and (c.isalnum() or c in "-%"))


class Slova:
    def __init__(self, path):
        self.w = []
        self.vety = []
        if os.path.exists(path):
            d = json.load(open(path, encoding="utf-8"))
            self.w = d.get("slova", d if isinstance(d, list) else [])
            self.vety = d.get("vety", [])

    def najdi(self, slovo, n=1, po=0.0):
        """n-tý výskyt slova (bez diakritiky, stačí začiatok slova) po čase `po` → (začiatok, koniec)"""
        k = _norm(slovo)
        c = 0
        for x in self.w:
            if x["s"] + 1e-6 < po:
                continue
            if _norm(x["w"]).startswith(k):
                c += 1
                if c == n:
                    return x["s"], x["e"]
        raise KeyError(f"slovo '{slovo}' (výskyt {n}, po {po:.2f} s) som v slova.json nenašiel")


SLOVA = None


def _slova():
    global SLOVA
    if SLOVA is None:
        SLOVA = Slova(os.path.join(PROJ, "slova.json"))
    return SLOVA


def T(slovo, n=1, po=0.0):
    """kedy začína slovo: T("Grónsko"), T("ale", n=2), T("mapa", po=T("guľa"))"""
    return _slova().najdi(slovo, n, po)[0]


def TE(slovo, n=1, po=0.0):
    """kedy slovo končí"""
    return _slova().najdi(slovo, n, po)[1]


def VETA(i):
    """(začiatok, koniec) i-tej vety (od 0)"""
    v = _slova().vety[i]
    return v["s"], v["e"]


# ======================================================================
# udalosti pre strih (zvuky, pojmy, záblesky) → udalosti.json, číta ich nastroje/zloz.py
# ======================================================================
UDALOSTI = {"zvuky": [], "pojmy": [], "zablesky": [], "otrasy": []}


def zvuk(meno, t, hlasitost=0.5):
    """zvukový efekt v strihu: whoosh, swoosh, pop, click, tick, stamp, chime, ding, riser, boom, thump, paper, glitch, notif…"""
    UDALOSTI["zvuky"].append({"meno": meno, "t": round(t, 3), "hlas": hlasitost})


def pojem(text, t, trvanie=1.5, farba="zlta"):
    """veľká „pečiatka“ s pojmom cez obraz (náš podpis namiesto „This is a…“)"""
    UDALOSTI["pojmy"].append({"text": text, "t": round(t, 3), "trvanie": trvanie, "farba": farba})


def zablesk(t):
    UDALOSTI["zablesky"].append(round(t, 3))


# ======================================================================
# scéna, svetlo, render
# ======================================================================
SVETLA = {
    #           obloha hore         obloha dole        slnko farba        sila  uhol (výška, azimut)  sila oblohy
    "den":    ((0.20, 0.45, 0.95), (0.62, 0.78, 0.98), (1.0, 0.95, 0.86), 5.5, (50, 35), 0.45),
    "zlata":  ((0.25, 0.40, 0.80), (1.0, 0.70, 0.45), (1.0, 0.72, 0.45), 6.0, (22, 60), 0.40),
    "noc":    ((0.01, 0.02, 0.07), (0.05, 0.07, 0.18), (0.6, 0.7, 1.0), 0.9, (40, 20), 0.6),
    "studio": ((0.85, 0.86, 0.92), (0.95, 0.95, 0.98), (1.0, 1.0, 1.0), 3.5, (60, 30), 0.5),
}


def _engine(sc):
    for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            sc.render.engine = e
            return
        except Exception:
            pass


def init(dlzka, svetlo="den", fps=30, pozadie=None, punchy=True):
    """Vyčistí scénu a nastaví rýchly EEVEE render 1080×1920. `pozadie` = (r,g,b) jednofarebné pozadie namiesto oblohy."""
    global coll, FPS, DLZKA, _cache, KAM
    FPS, DLZKA = fps, dlzka
    _cache = {}
    KAM = None
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    coll = sc.collection
    _engine(sc)
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, F(dlzka)
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "AgX"
    if punchy:
        try:
            sc.view_settings.look = "AgX - Punchy"
        except Exception:
            pass
    ee = sc.eevee
    for prop, val in (("taa_render_samples", 16), ("use_shadows", True), ("use_raytracing", False), ("use_fast_gi", False),
                      ("shadow_ray_count", 1), ("shadow_step_count", 4), ("use_gtao", True)):
        try:
            setattr(ee, prop, val)
        except Exception:
            pass
    sc.render.use_persistent_data = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.film_transparent = False
    _svet(svetlo, pozadie)
    return sc


def _svet(svetlo, pozadie):
    hore, dole, sfarba, ssila, (vys, azi), wsila = SVETLA[svetlo]
    w = bpy.data.worlds.new("Svet")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    if pozadie:
        bg.inputs["Color"].default_value = (*pozadie, 1)
        bg.inputs["Strength"].default_value = 1.0
    else:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        rmp = nt.nodes.new("ShaderNodeValToRGB")
        rmp.color_ramp.elements[0].position = 0.45
        rmp.color_ramp.elements[0].color = (*dole, 1)
        rmp.color_ramp.elements[1].position = 0.75
        rmp.color_ramp.elements[1].color = (*hore, 1)
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["From Min"].default_value = -1
        mr.inputs["From Max"].default_value = 1
        nt.links.new(tc.outputs["Generated"], sep.inputs[0])
        nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
        nt.links.new(mr.outputs["Result"], rmp.inputs["Fac"])
        nt.links.new(rmp.outputs["Color"], bg.inputs["Color"])
        bg.inputs["Strength"].default_value = wsila
    slnko = bpy.data.lights.new("Slnko", "SUN")
    slnko.energy = ssila
    slnko.color = sfarba
    slnko.angle = math.radians(3)
    o = link(bpy.data.objects.new("Slnko", slnko))
    o.rotation_euler = (math.radians(90 - vys), 0, math.radians(azi))
    fill = bpy.data.lights.new("Vypln", "SUN")
    fill.energy = ssila * 0.12
    fill.color = hore
    fill.use_shadow = False
    o2 = link(bpy.data.objects.new("Vypln", fill))
    o2.rotation_euler = (math.radians(60), 0, math.radians(azi + 180))


def spusti():
    """Volaj na konci scena.py. Podľa režimu od render.py: nahlad (pár snímok v polovičnom rozlíšení), render (rozsah snímok), blend (uloží .blend)."""
    sc = bpy.context.scene
    os.makedirs(PROJ, exist_ok=True)
    json.dump(UDALOSTI, open(os.path.join(PROJ, "udalosti.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"frames": sc.frame_end, "fps": FPS, "dlzka": DLZKA}, open(os.path.join(PROJ, "snimky_info.json"), "w"))
    print(f"SNIMKY_SPOLU {sc.frame_end}", flush=True)
    if KAM is None:
        raise RuntimeError("V scéne chýba kamera – zavolaj kamera() a nastav jej pohyb.")
    if REZIM == "nahlad":
        out = os.path.join(PROJ, "nahlad")
        os.makedirs(out, exist_ok=True)
        sc.render.resolution_percentage = 50
        casy = [float(x) for x in REZIM_ARG.split(",") if x.strip()] or [DLZKA * i / 7 for i in range(8)]
        for t in casy:
            sc.frame_set(min(sc.frame_end, F(t)))
            sc.render.filepath = os.path.join(out, f"t_{t:06.2f}.png")
            bpy.ops.render.render(write_still=True)
            print(f"NAHLAD {t:.2f}s hotovo", flush=True)
    elif REZIM == "render":
        a, b = (int(x) for x in REZIM_ARG.split("-")) if REZIM_ARG else (sc.frame_start, sc.frame_end)
        out = os.path.join(PROJ, "snimky")
        os.makedirs(out, exist_ok=True)
        for f in range(a, min(b, sc.frame_end) + 1):
            p = os.path.join(out, f"{f:05d}.png")
            if os.path.exists(p) and os.path.getsize(p) > 1000:
                continue
            sc.frame_set(f)
            sc.render.filepath = p
            bpy.ops.render.render(write_still=True)
            print(f"SNIMKA {f}", flush=True)
    elif REZIM == "blend":
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PROJ, "scena.blend"))
        print("ULOZENE scena.blend")


# ======================================================================
# geometria
# ======================================================================
def link(o):
    if o.name not in coll.objects:
        coll.objects.link(o)
    return o


def setmat(o, m):
    if m is not None and o.data is not None and hasattr(o.data, "materials"):
        o.data.materials.clear()
        o.data.materials.append(m)
    return o


def _obj(name, bm, loc=(0, 0, 0), rot=(0, 0, 0), hladke=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.location = loc
    o.rotation_euler = rot
    for p in me.polygons:
        p.use_smooth = hladke
    return o


def box(name, loc, size, m=None, bevel=0.0, rot=(0, 0, 0)):
    """kváder: size = (šírka, hĺbka, výška) – celé rozmery"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    o = _obj(name, bm, loc, rot)
    if bevel:
        b = o.modifiers.new("bev", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
    return setmat(o, m)


def sph(name, loc, r, m=None, sub=2, scale=(1, 1, 1), hladke=True):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    o = _obj(name, bm, loc, hladke=hladke)
    o.scale = scale
    return setmat(o, m)


def cyl(name, loc, r, depth, m=None, rot=(0, 0, 0), seg=24, r2=None, hladke=True):
    """valec (r2 = iný polomer hore → kužeľ)"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=depth)
    o = _obj(name, bm, loc, rot)
    if hladke:
        for p in o.data.polygons:
            p.use_smooth = len(p.vertices) == 4
    return setmat(o, m)


def cone(name, loc, r, depth, m=None, rot=(0, 0, 0), seg=8):
    return cyl(name, loc, r, depth, m, rot, seg=seg, r2=0.0, hladke=False)


def torus(name, loc, R, r, m=None, rot=(0, 0, 0), seg=32, mseg=12):
    verts, faces = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for j in range(mseg):
            b = 2 * math.pi * j / mseg
            rr = R + r * math.cos(b)
            verts.append((rr * math.cos(a), rr * math.sin(a), r * math.sin(b)))
    for i in range(seg):
        for j in range(mseg):
            i2, j2 = (i + 1) % seg, (j + 1) % mseg
            faces.append((i * mseg + j, i2 * mseg + j, i2 * mseg + j2, i * mseg + j2))
    o = mesh_obj(name, verts, faces, m)
    o.location = loc
    o.rotation_euler = rot
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def mesh_obj(name, verts, faces, m=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    return setmat(o, m)


def tube(name, body, r, m=None, uzavrete=False, res=6):
    """hrubá krivka cez body (laná, rúry, cesty)"""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    cu.resolution_u = res
    sp = cu.splines.new("NURBS")
    sp.points.add(len(body) - 1)
    for i, p in enumerate(body):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_endpoint_u = True
    sp.order_u = 3
    sp.use_cyclic_u = uzavrete
    o = link(bpy.data.objects.new(name, cu))
    if m:
        cu.materials.append(m)
    return o


def empty(name, loc=(0, 0, 0)):
    o = link(bpy.data.objects.new(name, None))
    o.location = loc
    return o


def parent(child, par, keep=True):
    """pripni objekt k rodičovi (keep=True zachová polohu; rodič ešte nesmie mať kľúče)"""
    bpy.context.view_layer.update()
    child.parent = par
    if keep:
        child.matrix_parent_inverse = par.matrix_world.inverted()
    return child


def skupina(name, objekty, loc=None):
    """prázdny objekt ako rodič skupiny – hýbeš/škáluješ celok"""
    e = empty(name, loc or (0, 0, 0))
    for o in objekty:
        parent(o, e)
    return e


def text3d(name, text, loc, size, m=None, pismo=None, rot=(math.radians(90), 0, 0), hrubka=0.01, zarovnanie="CENTER"):
    """3D text (predvolene stojí zvisle, čelom k -Y)"""
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = text
    cu.font = bpy.data.fonts.load(pismo or PISMO, check_existing=True)
    cu.size = size
    cu.extrude = hrubka
    cu.align_x = zarovnanie
    cu.align_y = "CENTER"
    o = link(bpy.data.objects.new(name, cu))
    o.location = loc
    o.rotation_euler = rot
    if m:
        cu.materials.append(m)
    return o


def plosne(o):
    """ploché tieňovanie (low-poly vzhľad)"""
    if o.type == "MESH":
        for p in o.data.polygons:
            p.use_smooth = False
    return o


# ======================================================================
# materiály a paleta (pastelový low-poly štýl)
# ======================================================================
PAL = {
    "trava": (0.24, 0.55, 0.13), "trava2": (0.34, 0.63, 0.17), "trava3": (0.17, 0.42, 0.11),
    "zem": (0.40, 0.24, 0.12), "zem2": (0.31, 0.18, 0.09), "zem3": (0.22, 0.13, 0.07), "hlina": (0.50, 0.32, 0.17),
    "kamen": (0.55, 0.55, 0.57), "kamen2": (0.40, 0.40, 0.43), "skala": (0.62, 0.58, 0.52),
    "voda": (0.20, 0.55, 0.85), "piesok": (0.90, 0.80, 0.56), "sneh": (0.95, 0.97, 1.0),
    "drevo": (0.55, 0.35, 0.18), "drevo2": (0.40, 0.25, 0.13), "koruna": (0.25, 0.55, 0.22), "ihlicie": (0.13, 0.38, 0.22),
    "stena": (0.95, 0.90, 0.80), "strecha": (0.70, 0.22, 0.16), "okno": (0.55, 0.75, 0.95),
    "kov": (0.72, 0.74, 0.78), "zlato": (0.95, 0.72, 0.25), "cierna": (0.04, 0.04, 0.05), "biela": (0.95, 0.95, 0.95),
    "cervena": (0.85, 0.15, 0.12), "modra": (0.15, 0.35, 0.85), "zlta": (0.98, 0.78, 0.10), "zelena": (0.20, 0.70, 0.30),
    "oranzova": (0.98, 0.50, 0.10), "ruzova": (0.95, 0.50, 0.65), "fialova": (0.50, 0.30, 0.80), "tyrkys": (0.15, 0.75, 0.75),
    "plet": (0.96, 0.76, 0.62), "plet2": (0.78, 0.55, 0.40), "plet3": (0.45, 0.30, 0.20), "vlasy": (0.25, 0.15, 0.08),
}


def mat(name, farba, drsnost=0.6, kov=0.0, svieti=None, sila=0.0, alfa=1.0):
    """materiál; `farba` = (r,g,b) alebo meno z PAL; `svieti` = farba žiary (sila 2–4)"""
    if isinstance(farba, str):
        farba = PAL[farba]
    key = (name, tuple(farba), drsnost, kov, svieti, sila, alfa)
    if key in _cache:
        return _cache[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*farba, 1)
    b.inputs["Roughness"].default_value = drsnost
    b.inputs["Metallic"].default_value = kov
    if svieti:
        b.inputs["Emission Color"].default_value = (*svieti, 1)
        b.inputs["Emission Strength"].default_value = sila
    if alfa < 1:
        b.inputs["Alpha"].default_value = alfa
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    _cache[key] = m
    return m


def M(meno, **k):
    """materiál z palety: M("trava"), M("kov", kov=1, drsnost=0.3)"""
    return mat(meno, meno, **k)


def sum_mat(name, c1, c2, mierka=6.0, drsnost=0.9, hrbol=0.25):
    """dvojfarebný šum (tráva, hlina, skala)"""
    if isinstance(c1, str):
        c1 = PAL[c1]
    if isinstance(c2, str):
        c2 = PAL[c2]
    m = mat(name, c1, drsnost)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = mierka
    nz.inputs["Detail"].default_value = 4.0
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    rmp = nt.nodes.new("ShaderNodeValToRGB")
    rmp.color_ramp.elements[0].position = 0.35
    rmp.color_ramp.elements[0].color = (*c1, 1)
    rmp.color_ramp.elements[1].position = 0.65
    rmp.color_ramp.elements[1].color = (*c2, 1)
    nt.links.new(nz.outputs["Fac"], rmp.inputs["Fac"])
    nt.links.new(rmp.outputs["Color"], b.inputs["Base Color"])
    if hrbol:
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = hrbol
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def obraz_mat(name, cesta, drsnost=0.7, svieti=0.0):
    """materiál z obrázka (UV); svieti > 0 = obrázok svieti sám (mapy, obrazovky)"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tx = nt.nodes.new("ShaderNodeTexImage")
    tx.image = bpy.data.images.load(cesta, check_existing=True)
    tx.extension = "REPEAT"
    nt.links.new(tx.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = drsnost
    if svieti:
        nt.links.new(tx.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = svieti
    return m


def kval(sock, t, v):
    """kľúč na hodnotu v materiáli (napr. farba, sila žiary) v čase t"""
    sock.default_value = v
    sock.keyframe_insert("default_value", frame=F(t))


# ======================================================================
# animácia
# ======================================================================
def kloc(o, t, v):
    o.location = v
    o.keyframe_insert("location", frame=F(t))


def krot(o, t, v):
    o.rotation_euler = v
    o.keyframe_insert("rotation_euler", frame=F(t))


def kscale(o, t, v):
    o.scale = v if isinstance(v, (tuple, list, Vector)) else (v, v, v)
    o.keyframe_insert("scale", frame=F(t))


def _kvis(o, f, visible):
    for x in [o] + list(o.children_recursive):
        x.hide_render = not visible
        x.hide_viewport = not visible
        x.keyframe_insert("hide_render", frame=f)
        x.keyframe_insert("hide_viewport", frame=f)


def ukaz_medzi(o, t0, t1=None):
    """objekt je viditeľný len od t0 (do t1)"""
    _kvis(o, 1, False)
    _kvis(o, max(1, F(t0)), True)
    if t1 is not None:
        _kvis(o, F(t1), False)


def vyskoc(o, t, dur=0.35, mierka=None):
    """objekt „vyskočí“ (mierka 0 → 1.15 → 1) v čase t"""
    s = Vector(mierka or o.scale)
    kscale(o, max(0, t - 1 / FPS), (0, 0, 0))
    kscale(o, t + dur * 0.6, s * 1.15)
    kscale(o, t + dur, s)
    ukaz_medzi(o, t)


def zmizni(o, t, dur=0.25):
    s = Vector(o.scale)
    kscale(o, t, s)
    kscale(o, t + dur, (0, 0, 0))
    _kvis(o, F(t + dur) + 1, False)


def pohyb(o, t0, t1, z, do, krivka=ease):
    """plynulý presun z → do (s ease). krok = 1 snímka, takže sedí aj s inými kľúčmi."""
    f0, f1 = F(t0), F(t1)
    for f in range(f0, f1 + 1):
        u = krivka((f - f0) / max(1, f1 - f0))
        o.location = lerp(z, do, u)
        o.keyframe_insert("location", frame=f)


def padni(o, t, vyska=3.0, dur=0.45, odraz=0.12):
    """padne zhora na svoje miesto a jemne odskočí"""
    ciel = Vector(o.location)
    hore = ciel + Vector((0, 0, vyska))
    kloc(o, max(0, t - 1 / FPS), hore)
    pohyb(o, t, t + dur, hore, ciel, ease_in)
    kloc(o, t + dur + 0.08, ciel + Vector((0, 0, odraz * vyska * 0.15)))
    kloc(o, t + dur + 0.16, ciel)
    ukaz_medzi(o, t)


def rast(o, t0, t1, os_="Z"):
    """vyrastie zo zeme (mierka na osi z 0 → 1)"""
    s = Vector(o.scale)
    s0 = s.copy()
    setattr(s0, os_.lower(), 0.001)
    kscale(o, t0, s0)
    kscale(o, t1, s)
    ukaz_medzi(o, t0)


def tocenie(o, os_, otacok_za_s, offset=0.0):
    """nekonečné otáčanie (driver)"""
    idx = "XYZ".index(os_)
    d = o.driver_add("rotation_euler", idx).driver
    d.type = "SCRIPTED"
    d.expression = f"{offset} + frame * {otacok_za_s * 2 * math.pi / FPS}"


def kolisanie(o, os_, amp, frekvencia=1.0, cesta="location"):
    """jemné hojdanie/vlnenie okolo aktuálnej hodnoty (driver)"""
    idx = "XYZ".index(os_)
    base = getattr(o, cesta)[idx]
    d = o.driver_add(cesta, idx).driver
    d.type = "SCRIPTED"
    d.expression = f"{base} + {amp} * sin(frame * {2 * math.pi * frekvencia / FPS})"


def sleduj(o, t0, t1, poz_fn, hore_fn=None, natoc=True, krivka=ease):
    """kľúčuje polohu (a natočenie po smere pohybu) po snímkach: poz_fn(u, t) → Vector, u = 0..1 (s krivkou).
    hore_fn(u, t) → smer „hore“ (napr. normála glóbusu). Hodí sa na lietadlo po trase, auto po ceste…"""
    f0, f1 = F(t0), F(t1)
    o.rotation_mode = "QUATERNION"
    prev_q = None
    for f in range(f0, f1 + 1):
        t = (f - 1) / FPS
        u = krivka((f - f0) / max(1, f1 - f0))
        p = Vector(poz_fn(u, t))
        o.location = p
        o.keyframe_insert("location", frame=f)
        if natoc:
            u2 = min(1.0, u + 0.01)
            u1 = max(0.0, u2 - 0.02)
            d = Vector(poz_fn(u2, t)) - Vector(poz_fn(u1, t))
            if d.length > 1e-6:
                up = Vector(hore_fn(u, t)) if hore_fn else Vector((0, 0, 1))
                q = _look(d, up)
                if prev_q is not None and prev_q.dot(q) < 0:
                    q.negate()
                prev_q = q
                o.rotation_quaternion = q
                o.keyframe_insert("rotation_quaternion", frame=f)


def _look(smer, hore):
    """kvaternión: os +X objektu pozerá po `smer`, +Z čo najbližšie k `hore`"""
    x = smer.normalized()
    z = (Vector(hore) - x * Vector(hore).dot(x))
    if z.length < 1e-6:
        z = Vector((0, 0, 1))
    z.normalize()
    y = z.cross(x)
    return Matrix(((x.x, y.x, z.x), (x.y, y.y, z.y), (x.z, y.z, z.z))).to_quaternion()


# ======================================================================
# kamera
# ======================================================================
def kamera(lens=35, poz=(0, -10, 6), ciel=(0, 0, 0)):
    """vytvorí kameru, ktorá stále mieri na prázdny objekt KAM_CIEL (hýbeš kamerou aj cieľom).
    Vráti objekt kamery – ulož si ho:  cam = kamera()  (premenná KAM po `from anim import *` ostane None)"""
    global KAM
    cd = bpy.data.cameras.new("Kamera")
    cd.lens = lens
    cd.sensor_fit = "VERTICAL"
    cd.clip_end = 500
    k = link(bpy.data.objects.new("Kamera", cd))
    k.location = poz
    c = empty("KAM_CIEL", ciel)
    tr = k.constraints.new("TRACK_TO")
    tr.target = c
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    bpy.context.scene.camera = k
    KAM = k
    return k


def kam_kluc(t, poz=None, ciel=None, lens=None):
    """kľúč kamery v čase t (poloha, kam pozerá, ohnisko)"""
    if poz is not None:
        kloc(KAM, t, poz)
    if ciel is not None:
        kloc(bpy.data.objects["KAM_CIEL"], t, ciel)
    if lens is not None:
        KAM.data.lens = lens
        KAM.data.keyframe_insert("lens", frame=F(t))


def kam_let(t0, t1, poz0, poz1, ciel0=None, ciel1=None, krivka=ease):
    """plynulý let kamery (aj cieľa) medzi dvoma bodmi"""
    pohyb(KAM, t0, t1, poz0, poz1, krivka)
    if ciel0 is not None:
        pohyb(bpy.data.objects["KAM_CIEL"], t0, t1, ciel0, ciel1 if ciel1 is not None else ciel0, krivka)


def kam_orbit(t0, t1, stred, polomer, vyska, uhol0, uhol1, krivka=ease):
    """kamera krúži okolo stredu (uhly v stupňoch, 0 = spredu z -Y)"""
    stred = Vector(stred)
    f0, f1 = F(t0), F(t1)
    for f in range(f0, f1 + 1):
        u = krivka((f - f0) / max(1, f1 - f0))
        a = math.radians(lerp(uhol0, uhol1, u)) - math.pi / 2
        KAM.location = stred + Vector((polomer * math.cos(a), polomer * math.sin(a), vyska))
        KAM.keyframe_insert("location", frame=f)
    kloc(bpy.data.objects["KAM_CIEL"], t0, stred)


def tras(t, sila=0.08, trvanie=0.35):
    """otras kamery (náraz, výbuch) – pridá šum na rotáciu kamery"""
    zvuk("thump", t, 0.4)
    UDALOSTI["otrasy"].append({"t": t, "sila": sila, "trvanie": trvanie})
    for i in range(int(trvanie * FPS) + 1):
        f = F(t) + i
        k = 1 - i / max(1, trvanie * FPS)
        KAM.delta_rotation_euler = (random.uniform(-1, 1) * sila * k * 0.15, random.uniform(-1, 1) * sila * k * 0.15, 0)
        KAM.keyframe_insert("delta_rotation_euler", frame=f)
    KAM.delta_rotation_euler = (0, 0, 0)
    KAM.keyframe_insert("delta_rotation_euler", frame=F(t + trvanie) + 1)


# ======================================================================
# príroda
# ======================================================================
def teren(name, velkost=(20, 20), deleni=40, kopce=0.4, mierka=0.25, seed=1, m=None, plochy_stred=0.0):
    """low-poly terén (plocha s kopčekmi); plochy_stred = polomer rovného stredu (na stavby)"""
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 100) for _ in range(6)]
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=deleni, y_segments=int(deleni * velkost[1] / velkost[0]), size=0.5)
    for v in bm.verts:
        v.co.x *= velkost[0]
        v.co.y *= velkost[1]
        x, y = v.co.x * mierka, v.co.y * mierka
        h = (math.sin(x * 1.3 + ph[0]) * math.cos(y * 1.1 + ph[1]) + 0.5 * math.sin(x * 2.7 + ph[2]) * math.sin(y * 2.3 + ph[3])
             + 0.25 * math.cos(x * 5.1 + ph[4] + y * 4.7 + ph[5]))
        r = math.hypot(v.co.x, v.co.y)
        if plochy_stred:
            h *= ease(clamp((r - plochy_stred) / (plochy_stred + 1e-6)))
        v.co.z = h * kopce
    o = _obj(name, bm)
    return setmat(o, m or sum_mat("Trava", "trava", "trava2", mierka=0.6))


def strom(name, loc, s=1.0, typ="listnac", seed=0):
    """low-poly strom: listnac (guľatá koruna) / ihlicnan (smrek)"""
    rnd = random.Random(seed)
    loc = Vector(loc)
    kmen = cyl(name + "_kmen", loc + Vector((0, 0, 0.45 * s)), 0.09 * s, 0.9 * s, M("drevo2"), seg=6, hladke=False)
    casti = [kmen]
    if typ == "ihlicnan":
        for i, (r, z) in enumerate(((0.62, 0.95), (0.48, 1.45), (0.32, 1.9))):
            casti.append(cone(f"{name}_k{i}", loc + Vector((0, 0, z * s)), r * s, 0.85 * s, M("ihlicie"), seg=7))
    else:
        for i in range(3):
            off = Vector((rnd.uniform(-0.2, 0.2), rnd.uniform(-0.2, 0.2), rnd.uniform(0, 0.3))) * s
            casti.append(plosne(sph(f"{name}_k{i}", loc + Vector((0, 0, 1.25 * s)) + off, rnd.uniform(0.42, 0.55) * s, M("koruna"), sub=1)))
    g = skupina(name, casti, loc)
    g.rotation_euler.z = rnd.uniform(0, 6.28)
    return g


def les(name, stred, polomer, pocet, s=(0.8, 1.3), typ="mix", seed=3, vynechaj=0.0):
    """kopa stromov v kruhu (vynechaj = prázdny stred)"""
    rnd = random.Random(seed)
    out = []
    for i in range(pocet):
        a = rnd.uniform(0, 6.28)
        r = rnd.uniform(vynechaj, polomer)
        t = typ if typ != "mix" else rnd.choice(("listnac", "ihlicnan"))
        out.append(strom(f"{name}{i}", (stred[0] + r * math.cos(a), stred[1] + r * math.sin(a), stred[2]), rnd.uniform(*s), t, seed + i))
    return out


def kamen(name, loc, s=0.4, seed=0, m=None):
    rnd = random.Random(seed)
    o = plosne(sph(name, loc, s, m or M("kamen"), sub=1))
    for v in o.data.vertices:
        v.co *= rnd.uniform(0.75, 1.2)
    o.scale = (1, rnd.uniform(0.7, 1.1), rnd.uniform(0.5, 0.8))
    return o


def hora(name, loc, vyska=6, sirka=5, sneh=True, seed=0):
    rnd = random.Random(seed)
    o = cone(name, Vector(loc) + Vector((0, 0, vyska / 2)), sirka, vyska, M("skala"), seg=7)
    for v in o.data.vertices:
        if v.co.z < vyska / 2 - 0.01:
            v.co.x *= rnd.uniform(0.8, 1.2)
            v.co.y *= rnd.uniform(0.8, 1.2)
    casti = [o]
    if sneh:
        casti.append(cone(name + "_sneh", Vector(loc) + Vector((0, 0, vyska * 0.86)), sirka * 0.3, vyska * 0.3, M("sneh"), seg=7))
    return skupina(name + "_g", casti, loc)


def mrak(name, loc, s=1.0, seed=0):
    rnd = random.Random(seed)
    biela = mat("Mrak", "biela", drsnost=1.0, svieti=(1, 1, 1), sila=0.6)
    casti = [plosne(sph(f"{name}{i}", Vector(loc) + Vector((i * 0.7 - 1, rnd.uniform(-0.2, 0.2), rnd.uniform(0, 0.3))) * s, rnd.uniform(0.5, 0.8) * s, biela, sub=1)) for i in range(4)]
    return skupina(name, casti, loc)


def rieka(name, body, sirka=1.2, m=None, vyska=0.02):
    """plochá rieka/cesta po bodoch (x, y)"""
    verts, faces = [], []
    for i, p in enumerate(body):
        a = Vector(body[max(0, i - 1)][:2])
        b = Vector(body[min(len(body) - 1, i + 1)][:2])
        d = (b - a).normalized()
        n = Vector((-d.y, d.x))
        z = p[2] if len(p) > 2 else vyska
        verts += [(p[0] + n.x * sirka / 2, p[1] + n.y * sirka / 2, z), (p[0] - n.x * sirka / 2, p[1] - n.y * sirka / 2, z)]
        if i:
            faces.append((2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i))
    return mesh_obj(name, verts, faces, m or mat("Voda", "voda", drsnost=0.15))


def cesta(name, body, sirka=0.8):
    return rieka(name, body, sirka, M("hlina", drsnost=1.0), vyska=0.015)


# ======================================================================
# stavby a veci
# ======================================================================
def dom(name, loc, rot_z=0.0, s=1.0, stena="stena", strecha="strecha"):
    loc = Vector(loc)
    tel = box(name + "_telo", loc + Vector((0, 0, 0.75 * s)), (2.0 * s, 1.6 * s, 1.5 * s), M(stena))
    v = [(-1.1, -0.9, 0), (1.1, -0.9, 0), (1.1, 0.9, 0), (-1.1, 0.9, 0), (0, -0.9, 0.9), (0, 0.9, 0.9)]
    st = mesh_obj(name + "_strecha", [Vector(p) * s for p in v], [(0, 1, 4), (2, 3, 5), (0, 4, 5, 3), (1, 2, 5, 4)], M(strecha))
    st.location = loc + Vector((0, 0, 1.5 * s))
    dvere = box(name + "_dvere", loc + Vector((0.45 * s, -0.81 * s, 0.4 * s)), (0.38 * s, 0.04 * s, 0.8 * s), M("drevo"))
    o1 = box(name + "_okno1", loc + Vector((-0.45 * s, -0.81 * s, 0.9 * s)), (0.45 * s, 0.04 * s, 0.4 * s), mat("Okno", "okno", drsnost=0.1, svieti=(0.6, 0.8, 1.0), sila=0.3))
    kom = box(name + "_komin", loc + Vector((0.55 * s, 0.3 * s, 2.15 * s)), (0.25 * s, 0.25 * s, 0.6 * s), M("kamen2"))
    g = skupina(name, [tel, st, dvere, o1, kom], loc)
    g.rotation_euler.z = rot_z
    return g


def chatrc(name, loc, rot_z=0.0, s=1.0):
    """drevená chatrč (ako v interaktívnom mestečku)"""
    loc = Vector(loc)
    tel = box(name + "_telo", loc + Vector((0, 0, 0.35 * s)), (1.0 * s, 0.9 * s, 0.7 * s), M("drevo"))
    v = [(-0.62, -0.55, 0), (0.62, -0.55, 0), (0.62, 0.55, 0), (-0.62, 0.55, 0), (0, -0.55, 0.6), (0, 0.55, 0.6)]
    st = mesh_obj(name + "_strecha", [Vector(p) * s for p in v], [(0, 1, 4), (2, 3, 5), (0, 4, 5, 3), (1, 2, 5, 4)], M("drevo2"))
    st.location = loc + Vector((0, 0, 0.7 * s))
    dv = box(name + "_dvere", loc + Vector((0, -0.46 * s, 0.25 * s)), (0.28 * s, 0.03 * s, 0.5 * s), M("zem3"))
    g = skupina(name, [tel, st, dv], loc)
    g.rotation_euler.z = rot_z
    return g


def plot(name, od, do, vyska=0.6, rozostup=0.35):
    od, do = Vector(od), Vector(do)
    n = max(2, int((do - od).length / rozostup))
    casti = []
    for i in range(n + 1):
        p = od.lerp(do, i / n)
        casti.append(box(f"{name}_k{i}", p + Vector((0, 0, vyska / 2)), (0.07, 0.07, vyska), M("biela")))
    d = do - od
    ang = math.atan2(d.y, d.x)
    for z in (0.25, 0.5):
        casti.append(box(f"{name}_l{z}", (od + do) / 2 + Vector((0, 0, vyska * z / 0.6 * 0.6)), (d.length, 0.04, 0.06), M("biela"), rot=(0, 0, ang)))
    return skupina(name, casti, (od + do) / 2)


def lietadlo(name, loc=(0, 0, 0), s=1.0, farba="modra"):
    """low-poly lietadlo, nos smeruje po +X"""
    biela = mat("LietadloBiela", "biela", drsnost=0.35, svieti=(1, 1, 1), sila=0.35)
    casti = [
        cyl(name + "_trup", (0, 0, 0), 0.12 * s, 1.2 * s, biela, rot=(0, math.radians(90), 0), seg=12),
        cone(name + "_nos", (0.68 * s, 0, 0), 0.12 * s, 0.18 * s, biela, rot=(0, math.radians(90), 0), seg=12),
        box(name + "_kridla", (0.05 * s, 0, -0.02 * s), (0.28 * s, 1.3 * s, 0.03 * s), biela),
        box(name + "_chvost", (-0.52 * s, 0, 0.14 * s), (0.2 * s, 0.03 * s, 0.28 * s), M(farba)),
        box(name + "_vyskovka", (-0.55 * s, 0, 0.02 * s), (0.14 * s, 0.45 * s, 0.025 * s), biela),
        box(name + "_pas", (0.1 * s, 0, 0.0), (0.9 * s, 0.245 * s, 0.03 * s), M(farba)),
    ]
    for side in (-1, 1):
        casti.append(cyl(f"{name}_motor{side}", (0.12 * s, side * 0.3 * s, -0.07 * s), 0.045 * s, 0.18 * s, M("kov", kov=0.8, drsnost=0.3), rot=(0, math.radians(90), 0), seg=10))
    g = skupina(name, casti)
    g.location = loc
    return g


def spendlik(name, loc, farba="cervena", s=1.0):
    """špendlík na mapu (hrot dole na loc)"""
    loc = Vector(loc)
    hl = sph(name + "_hlava", loc + Vector((0, 0, 0.42 * s)), 0.13 * s, mat(name + "M", farba, drsnost=0.3))
    ih = cone(name + "_ihla", loc + Vector((0, 0, 0.17 * s)), 0.035 * s, 0.34 * s, M("kov", kov=0.9, drsnost=0.2), rot=(math.pi, 0, 0), seg=8)
    return skupina(name, [hl, ih], loc)


def stitok(name, text, loc, velkost=0.25, farba_textu="biela", farba_podkladu=(0.08, 0.09, 0.14), vzdy_ku_kamere=True):
    """menovka nad objektom (text na zaoblenej tabuľke), otáča sa ku kamere"""
    loc = Vector(loc)
    t = text3d(name + "_t", text, (0, 0, 0), velkost, mat(name + "_tm", farba_textu, svieti=PAL[farba_textu] if isinstance(farba_textu, str) else farba_textu, sila=1.5), rot=(math.radians(90), 0, 0), hrubka=0.0)
    bpy.context.view_layer.update()
    sirka = max(0.4, t.dimensions.x + velkost * 0.9)
    vys = velkost * 1.5
    pod = box(name + "_p", (0, 0.012, 0), (sirka, 0.01, vys), mat(name + "_pm", farba_podkladu, drsnost=0.6), bevel=vys * 0.35)
    g = empty(name, loc)
    parent(t, g, keep=False)
    parent(pod, g, keep=False)
    if vzdy_ku_kamere and KAM is not None:
        c = g.constraints.new("DAMPED_TRACK")
        c.target = KAM
        c.track_axis = "TRACK_NEGATIVE_Y"
    return g


# ======================================================================
# rez pôdou (formát „jama na dvore“)
# ======================================================================
def rez_pody(name, x0, x1, y0, y1, hlbka=3.0, vrstvy=(("trava", 0.15), ("hlina", 0.8), ("zem", 1.0), ("zem2", 1.05))):
    """blok zeme s viditeľnými vrstvami na prednej stene (kamera spredu z -Y). Vráti zoznam vrstiev."""
    out = []
    z = 0.0
    for i, (farba, h) in enumerate(vrstvy):
        h = min(h, hlbka + z) if i == len(vrstvy) - 1 else h
        out.append(box(f"{name}_{i}", ((x0 + x1) / 2, (y0 + y1) / 2, z - h / 2), (x1 - x0, y1 - y0, h), sum_mat(f"Vrstva{i}", farba, farba, mierka=3) if farba != "trava" else M("trava")))
        z -= h
    return out


def diera(ciel_obj, name, x0, x1, y0, y1, z0, z1):
    """vyreže do objektu dieru (boolean). Vráti rezací objekt – môžeš ho animovať (napr. mierka z = kopanie)."""
    c = box(name, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (x1 - x0, y1 - y0, z1 - z0))
    c.display_type = "WIRE"
    c.hide_render = True
    mod = ciel_obj.modifiers.new(name, "BOOLEAN")
    mod.object = c
    mod.operation = "DIFFERENCE"
    try:
        mod.solver = "EXACT"
    except Exception:
        pass
    return c


# ======================================================================
# postavička (maskot)
# ======================================================================
def postavicka(name, loc=(0, 0, 0), tricko="modra", nohavice="cierna", plet="plet", vlasy="vlasy", ciapka=None, s=1.0):
    """jednoduchá figúrka (~1.1 m pri s=1). Vráti koreň; ruky sú name_rukaL / name_rukaP (na mávanie)."""
    loc = Vector(loc)
    root = empty(name, loc)
    nohy = [box(f"{name}_noha{i}", (i * 0.09 * s, 0, 0.2 * s), (0.11 * s, 0.13 * s, 0.4 * s), M(nohavice), bevel=0.02 * s) for i in (-1, 1)]
    telo = box(name + "_telo", (0, 0, 0.58 * s), (0.34 * s, 0.2 * s, 0.4 * s), M(tricko), bevel=0.04 * s)
    hlava = sph(name + "_hlava", (0, 0, 0.94 * s), 0.17 * s, M(plet), sub=2)
    oci = [sph(f"{name}_oko{i}", (i * 0.06 * s, -0.155 * s, 0.97 * s), 0.022 * s, M("cierna"), sub=1) for i in (-1, 1)]
    vl = sph(name + "_vlasy", (0, 0.02 * s, 1.02 * s), 0.17 * s, M(vlasy), sub=2, scale=(1.03, 1.03, 0.62))
    casti = nohy + [telo, hlava, vl] + oci
    if ciapka:
        casti.append(cyl(name + "_ciapka", (0, 0, 1.1 * s), 0.18 * s, 0.1 * s, M(ciapka), seg=16))
        casti.append(cyl(name + "_stitok", (0, -0.12 * s, 1.06 * s), 0.12 * s, 0.03 * s, M(ciapka), seg=16))
    for o in casti:
        parent(o, root, keep=False)
    for side, nm in ((-1, "rukaL"), (1, "rukaP")):
        rame = empty(f"{name}_{nm}", (side * 0.21 * s, 0, 0.75 * s))
        parent(rame, root, keep=False)
        r = box(f"{name}_{nm}_m", (0, 0, -0.17 * s), (0.09 * s, 0.1 * s, 0.36 * s), M(tricko), bevel=0.02 * s)
        dl = sph(f"{name}_{nm}_dlan", (0, 0, -0.37 * s), 0.055 * s, M(plet), sub=1)
        parent(r, rame, keep=False)
        parent(dl, rame, keep=False)
    return root


def _ruka(p, strana):
    return bpy.data.objects[f"{p.name}_ruka{strana}"]


def mavaj(p, t0, t1, strana="P"):
    """mávanie rukou od t0 do t1"""
    r = _ruka(p, strana)
    sgn = 1 if strana == "P" else -1
    krot(r, t0, (0, 0, 0))
    t = t0 + 0.15
    i = 0
    while t < t1 - 0.1:
        krot(r, t, (0, sgn * math.radians(150 if i % 2 == 0 else 120), 0))
        t += 0.18
        i += 1
    krot(r, t1, (0, 0, 0))


def ukaz_rukou(p, t, smer=(1, 0, 0), strana="P", trvanie=1.0):
    """zdvihne ruku smerom (ukazuje na niečo)"""
    r = _ruka(p, strana)
    sgn = 1 if strana == "P" else -1
    krot(r, t, (0, 0, 0))
    krot(r, t + 0.2, (0, sgn * math.radians(95), 0))
    krot(r, t + trvanie, (0, sgn * math.radians(95), 0))
    krot(r, t + trvanie + 0.2, (0, 0, 0))


def poskoc(p, t, vyska=0.35, dur=0.4):
    z = Vector(p.location)
    kloc(p, t, z)
    kloc(p, t + dur / 2, z + Vector((0, 0, vyska)))
    kloc(p, t + dur, z)


def chod(p, t0, t1, body, krok_vyska=0.04):
    """kráča po bodoch (lineárne po úsekoch), natočená po smere, s pohupovaním"""
    body = [Vector(b) for b in body]
    dlz = [0.0]
    for a, b in zip(body, body[1:]):
        dlz.append(dlz[-1] + (b - a).length)
    tot = dlz[-1] or 1

    def poz(u, t):
        d = u * tot
        for i in range(1, len(body)):
            if d <= dlz[i] or i == len(body) - 1:
                k = (d - dlz[i - 1]) / max(1e-6, dlz[i] - dlz[i - 1])
                p_ = body[i - 1].lerp(body[i], clamp(k))
                return p_ + Vector((0, 0, abs(math.sin(t * 9)) * krok_vyska))
        return body[-1]

    f0, f1 = F(t0), F(t1)
    p.rotation_mode = "XYZ"
    for f in range(f0, f1 + 1):
        t = (f - 1) / FPS
        u = (f - f0) / max(1, f1 - f0)
        loc = poz(u, t)
        p.location = loc
        p.keyframe_insert("location", frame=f)
        nxt = poz(min(1, u + 0.02), t)
        d = nxt - loc
        if d.length > 1e-4:
            p.rotation_euler = (0, 0, math.atan2(d.y, d.x) + math.pi / 2)
            p.keyframe_insert("rotation_euler", frame=f)


# ======================================================================
# častice (jednoduché, kľúčované)
# ======================================================================
def vybuch(name, stred, t, pocet=24, m=None, rozptyl=1.0, hore=(3, 6), velkost=(0.06, 0.15), trvanie=1.0, gravitacia=9.8, seed=5):
    """kúsky hliny/kameňov vyletia a dopadnú (balistika po snímkach)"""
    rnd = random.Random(seed)
    stred = Vector(stred)
    m = m or M("zem")
    out = []
    for i in range(pocet):
        o = plosne(sph(f"{name}{i}", stred, rnd.uniform(*velkost), m, sub=1))
        v = Vector((rnd.uniform(-1, 1) * rozptyl * 2, rnd.uniform(-1, 1) * rozptyl * 2, rnd.uniform(*hore)))
        f0 = F(t)
        for k in range(int(trvanie * FPS) + 1):
            tt = k / FPS
            p = stred + v * tt + Vector((0, 0, -0.5 * gravitacia * tt * tt))
            if p.z < stred.z - 0.5:
                p.z = stred.z - 0.5
            o.location = p
            o.keyframe_insert("location", frame=f0 + k)
        ukaz_medzi(o, t, t + trvanie)
        out.append(o)
    return out


def dym(name, stred, t0, t1, pocet=10, farba=(0.85, 0.85, 0.85), velkost=0.5, stupanie=2.0, seed=2):
    """obláčiky dymu, ktoré stúpajú a rastú"""
    rnd = random.Random(seed)
    stred = Vector(stred)
    out = []
    for i in range(pocet):
        ts = t0 + (t1 - t0) * i / pocet
        o = plosne(sph(f"{name}{i}", stred, velkost, mat(name + "M", farba, drsnost=1.0, svieti=farba, sila=0.4), sub=2))
        dr = Vector((rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 0))
        kloc(o, ts, stred)
        kloc(o, ts + 1.5, stred + dr + Vector((0, 0, stupanie)))
        kscale(o, ts, 0.2)
        kscale(o, ts + 1.2, 1.0)
        kscale(o, ts + 1.5, 0.0)
        ukaz_medzi(o, ts, ts + 1.55)
        out.append(o)
    return out


# ======================================================================
# Zem: plochá mapa (Mercator) ↔ glóbus s plynulým prechodom
# ======================================================================
def _merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def gc_body(lat1, lon1, lat2, lon2, n=120):
    """body najkratšej cesty po guli (ortodroma) ako (lat, lon)"""
    p1, l1, p2, l2 = map(math.radians, (lat1, lon1, lat2, lon2))
    a = Vector((math.cos(p1) * math.cos(l1), math.cos(p1) * math.sin(l1), math.sin(p1)))
    b = Vector((math.cos(p2) * math.cos(l2), math.cos(p2) * math.sin(l2), math.sin(p2)))
    d = math.acos(clamp(a.dot(b), -1, 1))
    out = []
    for i in range(n + 1):
        f = i / n
        v = (a * math.sin((1 - f) * d) + b * math.sin(f * d)) / math.sin(d)
        out.append((math.degrees(math.asin(v.z)), math.degrees(math.atan2(v.y, v.x))))
    # spojitá zemepisná dĺžka (bez skoku cez 180°)
    fixed = [out[0]]
    for la, lo in out[1:]:
        while lo - fixed[-1][1] > 180:
            lo -= 360
        while lo - fixed[-1][1] < -180:
            lo += 360
        fixed.append((la, lo))
    return fixed


def priamka_body(lat1, lon1, lat2, lon2, n=120):
    """rovná čiara na Mercatorovej mape (loxodroma) ako (lat, lon)"""
    y1, y2 = _merc(lat1), _merc(lat2)
    out = []
    for i in range(n + 1):
        f = i / n
        y = y1 + (y2 - y1) * f
        out.append((math.degrees(2 * math.atan(math.exp(y)) - math.pi / 2), lon1 + (lon2 - lon1) * f))
    return out


class ZemMapa:
    """Mapa sveta, ktorá sa vie zvinúť do glóbusu (a späť).
        z = ZemMapa(sirka=8, lon0=-50)          # lon0 = stred mapy / strana glóbusu ku kamere
        z.morf(t, 0) ; z.morf(t2, 1)            # 0 = plochá mapa, 1 = glóbus (kľúče)
        p = z.poz(lat, lon, t=…)                # poloha bodu v čase t (sleduje prechod)
        tr = z.trasa("Let", body, farba="zlta"); z.odkry(tr, t0, t1)
    Mapa leží v rovine XY so stredom v (0,0,0), sever = +Y. Glóbus sedí na rovine, stred v (0,0,R)."""

    def __init__(self, sirka=8.0, lon0=-50.0, lat_max=80.0, textura=None, deleni=(160, 90), svieti=0.5):
        self.R = sirka / (2 * math.pi)
        self.lon0, self.lat_max = lon0, lat_max
        self.objekty = []
        nx, ny = deleni
        verts, faces, uvs, gl = [], [], [], []
        for j in range(ny + 1):
            lat = -90 + 180 * j / ny          # až po póly (na ploche sa riadky nad lat_max zlejú s okrajom)
            for i in range(nx + 1):
                lon = lon0 - 180 + 360 * i / nx
                verts.append(self._plocha(lat, lon))
                gl.append(self._gula(lat, lon))
                uvs.append(((lon + 180) / 360, (lat + 90) / 180))
        for j in range(ny):
            for i in range(nx):
                a = j * (nx + 1) + i
                faces.append((a, a + 1, a + nx + 2, a + nx + 1))
        me = bpy.data.meshes.new("Zem")
        me.from_pydata(verts, [], faces)
        uv = me.uv_layers.new(name="UV")
        for poly in me.polygons:
            poly.use_smooth = True
            for li in poly.loop_indices:
                uv.data[li].uv = uvs[me.loops[li].vertex_index]
        self.obj = link(bpy.data.objects.new("Zem", me))
        self.obj.shape_key_add(name="Plocha")
        k = self.obj.shape_key_add(name="Glob")
        for i, p in enumerate(gl):
            k.data[i].co = p
        tex = textura or os.path.join(KNIZNICA, "textury", "zem_2048.jpg")
        setmat(self.obj, obraz_mat("ZemMat", tex, drsnost=0.65, svieti=svieti))
        self.objekty.append(self.obj)
        self._keys = []

    def _plocha(self, lat, lon, h=0.0):
        lat = clamp(lat, -self.lat_max, self.lat_max)
        return Vector((self.R * math.radians(lon - self.lon0), self.R * _merc(lat), h))

    def _gula(self, lat, lon, h=0.0):
        p, a = math.radians(lat), math.radians(lon - self.lon0)
        r = self.R + h
        return Vector((r * math.cos(p) * math.sin(a), -r * math.cos(p) * math.cos(a), self.R + r * math.sin(p)))

    def _normala(self, lat, lon, m):
        g = (self._gula(lat, lon, 1.0) - self._gula(lat, lon, 0.0))
        return Vector((0, 0, 1)).lerp(g, m).normalized()

    def morf(self, t, hodnota):
        """kľúč prechodu: 0 = mapa, 1 = glóbus (všetky trasy sa hýbu s ním)"""
        self._keys.append((t, hodnota))
        for o in self.objekty:
            kb = o.data.shape_keys.key_blocks["Glob"]
            kb.value = hodnota
            kb.keyframe_insert("value", frame=F(t))

    def m(self, t):
        """hodnota prechodu v čase t (z kľúčov)"""
        if not self._keys:
            return 0.0
        ks = sorted(self._keys)
        if t <= ks[0][0]:
            return ks[0][1]
        for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
            if t <= t1:
                return lerp(v0, v1, ease((t - t0) / max(1e-6, t1 - t0)))
        return ks[-1][1]

    def poz(self, lat, lon, t=None, h=0.03, m=None):
        """poloha bodu na mape/glóbuse v čase t (alebo pri hodnote m)"""
        mm = self.m(t) if m is None else m
        return self._plocha(lat, lon, h).lerp(self._gula(lat, lon, h), mm)

    def hore(self, lat, lon, t):
        return self._normala(lat, lon, self.m(t))

    def trasa(self, name, body, sirka=0.05, farba="zlta", h=0.03, svieti=2.5, ciarkovana=False):
        """pás po trase (zoznam (lat, lon)); kreslí sa postupne cez odkry()"""
        verts_p, verts_g, faces, uvx = [], [], [], []
        n = len(body)
        for i, (la, lo) in enumerate(body):
            a = body[max(0, i - 1)]
            b = body[min(n - 1, i + 1)]
            for src, out in ((self._plocha, verts_p), (self._gula, verts_g)):
                pa, pb, pc = src(*a, h), src(*b, h), src(la, lo, h)
                d = (pb - pa).normalized()
                up = Vector((0, 0, 1)) if src == self._plocha else (self._gula(la, lo, 1) - self._gula(la, lo, 0)).normalized()
                side = d.cross(up).normalized() * sirka / 2
                out += [pc + side, pc - side]
            uvx += [i / (n - 1)] * 2
            if i:
                faces.append((2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i))
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts_p, [], faces)
        uv = me.uv_layers.new(name="UV")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uv.data[li].uv = (uvx[vi], 0.5)
        o = link(bpy.data.objects.new(name, me))
        o.shape_key_add(name="Plocha")
        k = o.shape_key_add(name="Glob")
        for i, p in enumerate(verts_g):
            k.data[i].co = p
        # materiál: svieti, kreslí sa podľa hodnoty ODKRY (0..1), voliteľne čiarkovaný
        col = PAL[farba] if isinstance(farba, str) else farba
        m = bpy.data.materials.new(name + "M")
        m.use_nodes = True
        nt = m.node_tree
        b = nt.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*col, 1)
        b.inputs["Emission Color"].default_value = (*col, 1)
        b.inputs["Emission Strength"].default_value = svieti
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["UV"], sep.inputs[0])
        val = nt.nodes.new("ShaderNodeValue")
        val.name = "ODKRY"
        val.outputs[0].default_value = 1.0
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        nt.links.new(sep.outputs["X"], lt.inputs[0])
        nt.links.new(val.outputs[0], lt.inputs[1])
        alpha = lt.outputs[0]
        if ciarkovana:
            mul = nt.nodes.new("ShaderNodeMath")
            mul.operation = "MULTIPLY"
            mul.inputs[1].default_value = 40.0
            nt.links.new(sep.outputs["X"], mul.inputs[0])
            fr = nt.nodes.new("ShaderNodeMath")
            fr.operation = "FRACT"
            nt.links.new(mul.outputs[0], fr.inputs[0])
            lt2 = nt.nodes.new("ShaderNodeMath")
            lt2.operation = "LESS_THAN"
            lt2.inputs[1].default_value = 0.55
            nt.links.new(fr.outputs[0], lt2.inputs[0])
            both = nt.nodes.new("ShaderNodeMath")
            both.operation = "MULTIPLY"
            nt.links.new(lt.outputs[0], both.inputs[0])
            nt.links.new(lt2.outputs[0], both.inputs[1])
            alpha = both.outputs[0]
        nt.links.new(alpha, b.inputs["Alpha"])
        try:
            m.surface_render_method = "DITHERED"
        except Exception:
            m.blend_method = "CLIP"
        setmat(o, m)
        self.objekty.append(o)
        for (t, v) in self._keys:
            kb = o.data.shape_keys.key_blocks["Glob"]
            kb.value = v
            kb.keyframe_insert("value", frame=F(t))
        o["body"] = [list(p) for p in body]
        return o

    def odkry(self, trasa, t0, t1, krivka=ease):
        """trasa sa nakreslí od začiatku po koniec medzi t0 a t1"""
        node = trasa.data.materials[0].node_tree.nodes["ODKRY"].outputs[0]
        f0, f1 = F(t0), F(t1)
        for f in range(f0, f1 + 1, 2):
            node.default_value = krivka((f - f0) / max(1, f1 - f0)) * 1.001
            node.keyframe_insert("default_value", frame=f)
        node.default_value = 1.001
        node.keyframe_insert("default_value", frame=f1)
        if f0 > 1:
            node.default_value = 0.0
            node.keyframe_insert("default_value", frame=1)
            node.default_value = 0.0
            node.keyframe_insert("default_value", frame=f0)

    def bod_na_trase(self, body, u):
        """(lat, lon) v podiele u (0..1) trasy"""
        k = u * (len(body) - 1)
        i = min(len(body) - 2, int(k))
        f = k - i
        return (lerp(body[i][0], body[i + 1][0], f), lerp(body[i][1], body[i + 1][1], f))

    def spendlik(self, name, lat, lon, farba="cervena", s=0.6, text=None):
        """špendlík (a menovka), ktorý sa hýbe s mapou/glóbusom – polohu kľúčuje po snímkach"""
        sp = spendlik(name, (0, 0, 0), farba, s)
        st = stitok(name + "_stitok", text, (0, 0, 0), velkost=0.16 * s / 0.6) if text else None
        self._sleduj_bod(sp, lat, lon, 0.0, otacaj=True)
        if st:
            self._sleduj_bod(st, lat, lon, 0.42 * s / 0.6 + 0.25, otacaj=False)
        return sp, st

    def _sleduj_bod(self, o, lat, lon, h, otacaj):
        ks = sorted(self._keys)
        t_end = DLZKA
        o.rotation_mode = "QUATERNION"
        for f in range(1, F(t_end) + 1, 1):
            t = (f - 1) / FPS
            n = self.hore(lat, lon, t)
            o.location = self.poz(lat, lon, t, h=0.0) + n * h
            o.keyframe_insert("location", frame=f)
            if otacaj:
                o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(n)
                o.keyframe_insert("rotation_quaternion", frame=f)
            if not ks:
                break
