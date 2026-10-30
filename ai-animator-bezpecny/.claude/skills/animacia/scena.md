# Ako postaviť scénu (`projekty/<nazov>/scena.py`)

Scéna je obyčajný Python skript, ktorý beží v Blenderi a používa knižnicu `kniznica/anim.py`.
Spúšťa ho `nastroje/render.py` (nikdy nie priamo). Jednotky: 1 = cca 1 meter. Kamera spredu zo strany −Y, hore = +Z.

## Kostra

```python
import sys, os
sys.path.insert(0, os.environ["ANIM_KNIZNICA"])
from anim import *

init(dlzka=TE("posledné-slovo") + 0.6, svetlo="den")   # den | zlata | noc | studio ; pozadie=(r,g,b) = jednofarebné
cam = kamera(lens=35)                                     # ULOŽ si objekt (KAM po importe ostáva None)

# ... svet, postavy, animácie, kamera ...

spusti()
```
`dlzka` = koniec posledného slova + ~0,6 s (alebo `TE(...)`). `T("slovo")` vráti začiatok slova v sekundách, `TE` koniec, `T("ale", n=2)` druhý výskyt, `T("mapa", po=T("guľa"))` prvý výskyt po inom slove. Diakritika a veľké písmená sa ignorujú, stačí začiatok slova.

## Knižnica – čo máš k dispozícii

**Svet a svetlo:** `init(dlzka, svetlo, pozadie)`, paleta farieb `PAL` (`M("trava")`, `M("kov", kov=1, drsnost=0.3)`, `mat("Meno", (r,g,b), svieti=(r,g,b), sila=2)`), `sum_mat` (dvojfarebný šum), `obraz_mat` (textúra z obrázka).

**Tvary:** `box`, `sph`, `cyl`, `cone`, `torus`, `tube(body, r)`, `mesh_obj(verts, faces)`, `text3d`, `empty`, `skupina(name, [objekty])`, `parent(dieta, rodic)`, `plosne(o)` (low-poly vzhľad).

**Príroda:** `teren(...)`, `strom(...)`, `les(name, stred, polomer, pocet)`, `kamen`, `hora`, `mrak`, `rieka(body)`, `cesta(body)`.

**Stavby a veci:** `dom`, `chatrc`, `plot(od, do)`, `lietadlo`, `spendlik`, `stitok(name, text, loc)` (menovka otočená ku kamere – vytváraj až po `kamera()`).

**Rez pôdou (formát „jama na dvore“):** `rez_pody(name, x0, x1, y0, y1, hlbka)`, `diera(objekt, name, x0..z1)` → rezací kváder, ktorým môžeš hýbať (kopanie = animuj jeho mierku).

**Postavička / maskot:** `p = postavicka("Majster", loc, tricko="oranzova", ciapka="zlta")`, `mavaj(p, t0, t1)`, `ukaz_rukou(p, t)`, `poskoc(p, t)`, `chod(p, t0, t1, [body])`.

**Animácia (všetko v sekundách):** `kloc/krot/kscale(o, t, hodnota)`, `pohyb(o, t0, t1, z, do)`, `vyskoc(o, t)`, `zmizni(o, t)`, `padni(o, t)`, `rast(o, t0, t1)`, `ukaz_medzi(o, t0, t1)`, `tocenie(o, "Z", otacok_za_s)`, `kolisanie(o, "Z", amp, frekvencia)`, `sleduj(o, t0, t1, poz_fn, hore_fn)` (pohyb po krivke s natočením po smere), `vybuch(...)`, `dym(...)`.

**Kamera:** `kam_kluc(t, poz, ciel, lens)`, `kam_let(t0, t1, poz0, poz1, ciel0, ciel1)`, `kam_orbit(t0, t1, stred, polomer, vyska, uhol0, uhol1)`, `tras(t)` (otras).

**Mapa a glóbus:** `z = ZemMapa(sirka=8, lon0=-50)`, `z.morf(t, 0|1)` (0 mapa, 1 glóbus – kľúče daj PRED trasami a špendlíkmi), `z.poz(lat, lon, t)`, `z.trasa(name, body)` + `z.odkry(trasa, t0, t1)`, `gc_body(...)` (najkratšia cesta), `priamka_body(...)` (rovno na mape), `z.spendlik(name, lat, lon, farba, text=...)`.

**Strih (zapíše sa do udalosti.json, použije nastroje/zloz.py):** `zvuk("pop", t, 0.5)` (whoosh, swoosh, whoosh_long, pop, click, tick, stamp, chime, ding, riser, boom, flash, thump, paper, glitch, typing, notif), `pojem("text", t, trvanie, farba)` (zlta/modra/cervena/zelena/biela/cierna), `zablesk(t)`.

## Pravidlá kamery (aby to vyzeralo ako od štúdia)
1. Od prvej snímky sa niečo hýbe (kamera alebo objekt). Statický záber max 1,5 s.
2. Začni bližšie a pri prvej dôležitej informácii odhaľ celok (reveal). Pri pojme/pointe pomalý najazd.
3. Každá veta = nový záber alebo nový pohyb. Prechody plynulé (`kam_let` s ease), rýchle len pri „ale“ / zvrate.
4. Dôležité veci v hornej ~60 % obrazu (titulky sú okolo 62 % výšky, pojmy okolo 27 %). Nič dôležité pri okraji – menovky sa orežú.
5. Vertikálny záber 9:16 je úzky: na šírku vidíš málo. Radšej kamera vyššie a mierne zhora, ako z boku.

## Rýchlosť renderu
- EEVEE je nastavené na rýchlo (16 vzoriek, bez raytracingu). ~0,5–1,5 s na snímku.
- Veľa objektov = pomalšia stavba. Stromy/kamene opakuj radšej menej, ale väčšie.
- `sleduj`/`pohyb` kľúčujú po snímkach – pri 1–2 minútových videách je to v poriadku.

## Časté chyby
- `AttributeError: 'NoneType' … location` → používaš `KAM` namiesto `cam = kamera()`.
- Objekt nevidno → je za kamerou, je príliš malý, alebo ho `ukaz_medzi` skryl. Pozri náhľad v danom čase.
- Boolean diera nič nerobí → rezací objekt musí pretínať objekt celý; vytváraj ho cez `diera(...)`.
- Rodič + kľúče: `parent()` volaj skôr, ako rodiča animuješ.
- Žiara: sila 2–4 stačí, pri vyššej je všetko biele.
- Text s diakritikou: písmo Nunito Black má všetky slovenské aj české znaky – nemeň ho na systémové.
- Slovo `T("…")` nenájdené → pozri `slova.json`, ako je slovo napísané (napr. číslo „3D“ vs. „tri-dé“).

## Vzor
Celý funkčný príklad: `priklady/lietadla/scena.py` (mapa → glóbus → mapa, lietadlo po trase, menovky, pojmy, sledovanie kamerou).
