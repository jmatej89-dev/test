"""Ukážka: „Prečo lietadlá na mape nelietajú rovno“ (27 s). Mapa sveta → glóbus → mapa, lietadlo letí po ortodrome.
Fakty (prepočítané): Viedeň → Los Angeles najkratšie 9 854 km, rovná čiara na Mercatorovej mape 11 360 km (+1 506 km),
najsevernejší bod trasy 66,9° s. š. pri 44,8° z. d. = nad Grónskom."""
import sys, os
sys.path.insert(0, os.environ["ANIM_KNIZNICA"])
from anim import *

init(dlzka=27.6, svetlo="studio", pozadie=(0.025, 0.04, 0.10))

VIEDEN, LA = (48.11, 16.57), (33.94, -118.41)
z = ZemMapa(sirka=8, lon0=-50)
R = z.R

# --- prechod mapa ↔ glóbus (kľúče MUSIA byť pred trasami a špendlíkmi) ---
M1a, M1b = T("placka") - 0.2, T("guľa") + 0.1          # mapa → glóbus
M2a, M2b = T("prenesieš") - 0.1, T("ohne") + 0.3        # glóbus → mapa
z.morf(0, 0); z.morf(M1a, 0); z.morf(M1b, 1); z.morf(M2a, 1); z.morf(M2b, 0)

# --- trasy ---
gc = gc_body(*VIEDEN, *LA, n=160)                        # najkratšia (žltá)
rv = priamka_body(*VIEDEN, *LA, n=160)                    # „rovno na mape“ (červená, čiarkovaná)
trasa = z.trasa("Ortodroma", gc, sirka=0.055, farba="zlta", svieti=3.0)
rovno = z.trasa("Rovno", rv, sirka=0.045, farba="cervena", svieti=2.5, ciarkovana=True)
z.odkry(trasa, 0.15, 1.9)                                 # háčik: oblúk sa nakreslí hneď na začiatku
z.odkry(rovno, T("Vyzerá"), T("obchádzka") + 0.4)
zvuk("whoosh", 0.1, 0.4)
zvuk("swoosh", T("Vyzerá"), 0.35)

cam = kamera(lens=32)
MAPA = Vector((0, 1.25, 0))
GLOB = Vector((0, 0, R + 0.25))

# --- špendlíky a menovky (hýbu sa s mapou aj glóbusom) ---
sp_v, st_v = z.spendlik("Vieden", *VIEDEN, "cervena", s=0.55, text="VIEDEŇ")
sp_l, st_l = z.spendlik("LA", *LA, "modra", s=0.55, text="LOS ANGELES")
for o, t in ((sp_v, T("Viedne")), (st_v, T("Viedne")), (sp_l, T("Angeles")), (st_l, T("Angeles"))):
    ukaz_medzi(o, t)
zvuk("pop", T("Viedne"), 0.5); zvuk("pop", T("Angeles"), 0.5)

gr = stitok("Gronsko", "GRÓNSKO", z.poz(73, -40, m=0, h=0.35), velkost=0.13, farba_textu="biela")
ukaz_medzi(gr, T("Grónsko"), M1a)
zvuk("ding", T("Grónsko"), 0.45)

# --- lietadlo ---
let = lietadlo("Lietadlo", s=0.42)
apex = max(range(len(gc)), key=lambda i: gc[i][0]) / (len(gc) - 1)   # podiel trasy nad Grónskom


def let_po(obj, body, t0, t1, u_apex_t=None, h=0.14):
    """lietadlo letí po trase body medzi t0 a t1 (sleduje aj prechod mapa ↔ glóbus)"""
    def poz(u, t):
        la, lo = z.bod_na_trase(body, u)
        return z.poz(la, lo, t, h=0.0) + z.hore(la, lo, t) * h

    def hore(u, t):
        la, lo = z.bod_na_trase(body, u)
        return z.hore(la, lo, t)

    if u_apex_t:   # do apexu pomalšie, potom rýchlejšie (aby bol nad Grónskom pri slove „Grónsko“)
        ta = u_apex_t
        sleduj(obj, t0, ta, lambda u, t: poz(u * apex, t), lambda u, t: hore(u * apex, t), krivka=lambda x: x)
        sleduj(obj, ta, t1, lambda u, t: poz(apex + u * (1 - apex), t), lambda u, t: hore(apex + u * (1 - apex), t), krivka=ease_out)
    else:
        sleduj(obj, t0, t1, poz, hore)


t_let0 = T("Viedne")
let_po(let, gc, t_let0, TE("Grónsko") + 1.2, u_apex_t=T("Grónsko"))
ukaz_medzi(let, t_let0, M1a - 0.3)
zvuk("whoosh", t_let0, 0.3)

# na glóbuse znova (najkratšia cesta = oblúk)
t_g0, t_g1 = T("najkratšia") - 0.3, TE("oblúk") + 0.3
let2 = lietadlo("Lietadlo2", s=0.30)
let_po(let2, gc, t_g0, t_g1)
ukaz_medzi(let2, t_g0, M2a)
pojem("najkratšia cesta", T("najkratšia"), 1.6, "zlta")
zvuk("stamp", T("najkratšia"), 0.5)

# na konci: pilot letí najkratšou cestou
let3 = lietadlo("Lietadlo3", s=0.42)
t_k0, t_k1 = T("pilot") - 0.2, TE("cestou") + 0.4
let_po(let3, gc, t_k0, t_k1)
ukaz_medzi(let3, t_k0)
zvuk("whoosh", t_k0, 0.3)

# --- vzdialenosti ---
mid_r = z.bod_na_trase(rv, 0.5)
mid_g = z.bod_na_trase(gc, 0.38)
km_r = stitok("KmRovno", "11 360 km", z.poz(mid_r[0] - 4, mid_r[1], m=0, h=0.25), velkost=0.15, farba_textu="cervena")
km_g = stitok("KmOblouk", "9 854 km", z.poz(mid_g[0] + 3, mid_g[1], m=0, h=0.35), velkost=0.15, farba_textu="zlta")
ukaz_medzi(km_r, T("Rovná") + 0.2, T("Takže"))
ukaz_medzi(km_g, T("skutočnosti"), T("Takže"))
zvuk("pop", T("Rovná") + 0.2, 0.45); zvuk("pop", T("skutočnosti"), 0.45)
pojem("+1 500 km", T("tisíc"), 1.8, "cervena")
zvuk("stamp", T("tisíc"), 0.55)

# --- kamera ---
W0 = (Vector((0.0, -2.95, 8.9)), Vector((0, 0.55, 0)))           # celá trasa Viedeň – LA, mapa vypĺňa záber
C0 = (Vector((0.9, -1.2, 5.6)), Vector((0.6, 1.4, 0)))           # bližšie na Európu (háčik)
G0 = (GLOB + Vector((0, -4.6, 3.6)), GLOB)                        # glóbus
kam_kluc(0, *C0)
kam_let(0, 2.2, C0[0], C0[0] + Vector((-0.3, -0.3, 0.6)), C0[1], C0[1] + Vector((-0.2, 0, 0)))
kam_let(T("Viedne") - 0.2, T("Grónsko"), C0[0] + Vector((-0.3, -0.3, 0.6)), W0[0], C0[1] + Vector((-0.2, 0, 0)), W0[1])
kam_kluc(T("placka") - 0.6, *W0)
kam_let(T("placka") - 0.6, M1b, W0[0], G0[0], W0[1], G0[1])
kam_orbit(M1b, M2a, GLOB, 4.6, 3.6, 0, 18)
G1 = GLOB + Vector((4.6 * math.cos(math.radians(18) - math.pi / 2), 4.6 * math.sin(math.radians(18) - math.pi / 2), 3.6))
kam_let(M2a, M2b + 0.2, G1, W0[0], GLOB, W0[1])
kam_kluc(T("Takže") - 0.1, *W0)
# pilot: kamera sa priblíži k lietadlu a sleduje ho
blizko = lambda p: (p + Vector((0.5, -2.6, 3.4)), p)
p_start = z.poz(*z.bod_na_trase(gc, 0.25), m=0)
kam_let(T("Takže") - 0.1, t_k0 + 0.8, W0[0], blizko(p_start)[0], W0[1], p_start)


for f in range(F(t_k0 + 0.8), F(t_k1 - 0.4) + 1):
    t = (f - 1) / FPS
    u = ease((f - F(t_k0)) / max(1, F(t_k1) - F(t_k0)))
    la, lo = z.bod_na_trase(gc, u)
    p = z.poz(la, lo, m=0)
    cam_p, cam_c = blizko(p)
    cam.location = cam.location.lerp(cam_p, 0.25) if f > F(t_k0 + 0.8) else cam_p
    cam.keyframe_insert("location", frame=f)
    c = bpy.data.objects["KAM_CIEL"]
    c.location = cam_c
    c.keyframe_insert("location", frame=f)
kam_let(TE("cestou") - 0.2, T("mapa", po=T("Klame")) + 0.3, blizko(z.poz(*LA, m=0))[0], W0[0] + Vector((0, -1.0, 1.5)), z.poz(*LA, m=0), W0[1])
zvuk("swoosh", TE("cestou") - 0.2, 0.35)
zablesk(T("placka") - 0.05)
zvuk("whoosh", M1a, 0.45); zvuk("whoosh", M2a, 0.45)
zvuk("chime", T("guľa"), 0.4)

spusti()
