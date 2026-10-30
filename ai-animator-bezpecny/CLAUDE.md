# AI Animátor – pokyny pre Claude

Tento priečinok robí z nápadu hotové 3D animované krátke video (Reels / TikTok / Shorts): skript → hlas → 3D scéna v Blenderi → render → titulky, zvuky, strih.
Hlavný postup je skill **`/animacia`** (`.claude/skills/animacia/SKILL.md`). Používateľ nemusí vedieť nič o Blenderi ani programovaní – rob všetko sám, komunikuj po slovensky, krátko.

## Kde je čo
- `kniznica/anim.py` – knižnica pre Blender (svet, postavičky, kamera, mapa/glóbus, animácie). Návod: `.claude/skills/animacia/scena.md`.
- `nastroje/` – `hlas.py`, `slova.py`, `render.py`, `zloz.py`, `nahlad.py`, `kontrola.py`, `make_sfx.py`.
- `projekty/<nazov>/` – každé video: `skript.txt`, `hlas.wav`, `slova.json`, `scena.py`, `snimky/`, `hotove.mp4`.
- `priklady/lietadla/` – kompletný vzor (otvor si ho, keď nevieš ako).
- `sfx/` – zvukové efekty (vlastné, bez autorských práv), `pisma/` – písma (OFL licencia), `kniznica/textury/zem_2048.jpg` – mapa Zeme (NASA, voľné dielo).

## Pravidlá
1. Pred celým renderom vždy náhľad (`render.py --nahlad`) a **pozri sa na `nahlad.jpg`** (Read). Celý render až keď náhľad sedí.
2. Časy v scéne len cez `T("slovo")` / `TE(...)`, nikdy natvrdo.
3. Fakty over. Čísla vo videu musia byť pravdivé.
4. Žiadne cudzie postavy, logá, značky ani hudba s autorskými právami.
5. Nikdy nemaž ani neprepisuj existujúce projekty používateľa bez opýtania (nový pokus = nový priečinok alebo `scena_v2.py`).
6. Na Macu spúšťaj nástroje cez `.venv/bin/python`.

## Časté problémy
- Render spadne → `render.py` vypíše chybu zo scény (riadok v scena.py). Oprav a spusti znova; hotové snímky sa nerenderujú znova (`--odznova` = všetko nanovo, treba po zmene scény).
- Titulky majú zlé slovo → oprav `skript.txt` a pusti `slova.py` znova.
- Pomalý render → menej objektov, `--procesy 3`, kratšie video.

## Moje preferencie
(sem si zapisuj, čo sa používateľovi páči: štýl, maskot, farby, hlas, dĺžka, formát…)
