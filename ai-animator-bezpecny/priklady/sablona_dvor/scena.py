"""Šablóna formátu 1 – „ako sa jama na dvore stane …“ (bez hlasu, 8 s). Dvor s rezom pôdy, dom, plot, maskot,
kopanie jamy (boolean), oceľová rúra padne do jamy, hlina sa rozletí, pojem ako pečiatka.
V skutočnom videu nahraď časy časmi slov: T("vykopeš"), T("rúru"), T("kryt") atď."""
import sys, os
sys.path.insert(0, os.environ["ANIM_KNIZNICA"])
from anim import *

init(dlzka=8.0, svetlo="den")
cam = kamera(lens=32)

# trávnik + blok zeme s vrstvami (kamera sa pozerá na prednú stenu rezu)
vrstvy = rez_pody("Zem", -4, 4, -2, 4, hlbka=3.0)
vrch = vrstvy[0]                                  # tráva – do nej kopeme
hlina = vrstvy[1]
c1 = diera(vrch, "Jama1", -0.9, 0.9, -1.0, 0.4, -0.2, 0.3)
c2 = diera(hlina, "Jama2", -0.9, 0.9, -1.0, 0.4, -1.4, 0.0)
# kopanie: rezací kváder rastie do hĺbky (jama sa prehlbuje)
for c in (c1, c2):
    c.scale = (1, 1, 0.01)
    kscale(c, 0.6, (1, 1, 0.01))
    kscale(c, 1.8, (1, 1, 1))
vybuch("Hlina", (0, -0.3, 0.1), 0.7, pocet=18, rozptyl=0.6, hore=(2, 4))
zvuk("thump", 0.7, 0.5)

dom("Dom", (-2.4, 2.6, 0), rot_z=0.0, s=1.0)
plot("Plot", (-4, 3.8, 0), (4, 3.8, 0))
strom("Strom", (2.8, 2.8, 0), s=1.3)
strom("Strom2", (3.5, 1.2, 0), s=0.9, typ="ihlicnan")

# rúra padne do jamy
rura = cyl("Rura", (0, -0.3, -0.8), 0.55, 1.2, M("kov", kov=0.9, drsnost=0.35), rot=(math.radians(90), 0, 0), seg=20)
padni(rura, 3.0, vyska=4.0, dur=0.5)
tras(3.5, sila=0.12)
pojem("oceľová rúra", 3.6, 1.6, "zlta")

majster = postavicka("Majster", (1.6, -1.2, 0), tricko="oranzova", nohavice="modra", ciapka="zlta")
ukaz_rukou(majster, 2.2, strana="L")
poskoc(majster, 4.2)
mavaj(majster, 5.0, 6.5)

kam_kluc(0, (2.5, -7.5, 3.5), (0, 0, -0.4))
kam_let(0, 3.0, (2.5, -7.5, 3.5), (1.2, -6.0, 2.2), (0, 0, -0.4), (0, -0.2, -0.6))
kam_let(3.8, 8.0, (1.2, -6.0, 2.2), (-1.5, -6.8, 3.2), (0, -0.2, -0.6), (0, 0.4, -0.2))
spusti()
