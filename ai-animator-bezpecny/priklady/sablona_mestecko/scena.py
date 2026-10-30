"""Šablóna formátu 5 – interaktívne mestečko (bez hlasu, 8 s). Údolie s riekou, chatrče s menami followerov, maskot.
V skutočnom videu nahraď časy (1.0, 2.5 …) časmi slov: T("follow"), T("chatrč") atď."""
import sys, os
sys.path.insert(0, os.environ["ANIM_KNIZNICA"])
from anim import *

init(dlzka=8.0, svetlo="zlata")
cam = kamera(lens=30)

teren("Udolie", velkost=(30, 30), deleni=48, kopce=0.5, plochy_stred=4.0, seed=4)
rieka("Rieka", [(-15, 6, 0.03), (-6, 3, 0.03), (0, 4.5, 0.03), (6, 2.5, 0.03), (15, 5, 0.03)], sirka=1.4)
cesta("Cesta", [(0, -12, 0), (0, -3, 0), (0.5, 0, 0), (2, 1.5, 0)], sirka=0.7)
for i, (x, y) in enumerate(((-11, 11), (0, 14), (12, 12))):
    hora(f"Hora{i}", (x, y, 0), vyska=7 + i, sirka=5, seed=i)
les("Les", (-7, 6, 0), 4, 14, seed=2)
les("Les2", (8, 7, 0), 4, 12, seed=9)
for i in range(3):
    m = mrak(f"Mrak{i}", (-9 + i * 9, 18, 9 + i % 2), s=1.6, seed=i)
    kolisanie(m, "X", 0.4, 0.1)
ohen = cyl("Ohnisko", (1.2, -0.8, 0.05), 0.35, 0.1, M("kamen2"), seg=10)
plamen = cone("Plamen", (1.2, -0.8, 0.35), 0.18, 0.5, mat("Ohen", "oranzova", svieti=(1.0, 0.5, 0.1), sila=4), seg=6)
kolisanie(plamen, "Z", 0.04, 2.5)
dym("Dym", (1.2, -0.8, 0.6), 0, 8, pocet=12, velkost=0.25, stupanie=2.5)

# chatrče followerov: každá vyskočí so svojou menovkou
mena = ["@ty", "@kamarat", "@sestra", "@brat"]
for i, meno in enumerate(mena):
    x = -2.4 + i * 1.6
    ch = chatrc(f"Chatrc{i}", (x, 1.4, 0), rot_z=0.15 * (i - 1.5), s=1.0)
    padni(ch, 1.0 + i * 0.5, vyska=2.5)
    st = stitok(f"Menovka{i}", meno, (x, 1.4, 1.75), velkost=0.2)
    ukaz_medzi(st, 1.3 + i * 0.5)
    zvuk("pop", 1.3 + i * 0.5, 0.45)

majster = postavicka("Majster", (0.2, -1.2, 0), tricko="oranzova", nohavice="modra", ciapka="zlta")
mavaj(majster, 0.3, 1.6)
chod(majster, 3.6, 5.6, [(0.2, -1.2, 0), (1.8, -0.4, 0), (2.6, 0.4, 0)])
poskoc(majster, 6.2)

kam_kluc(0, (0.5, -9, 3.2), (0.4, 0.5, 0.8))
kam_let(0, 3.5, (0.5, -9, 3.2), (0.2, -6.2, 2.4), (0.4, 0.5, 0.8), (0, 1.2, 0.8))
kam_orbit(3.5, 8.0, Vector((0.5, 0.8, 0.6)), 6.4, 2.6, 0, 22)
spusti()
