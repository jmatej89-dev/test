---
name: animacia
description: Z jedného nápadu spraví hotové 3D animované video na Reels/TikTok/Shorts – scenár, hlas, 3D svet a animácie v Blenderi, titulky, zvuky a strih. Použi pri „/animacia <nápad>“, „sprav animované video / vysvetľovačku / príbeh o …“, „video ako Dude Facts / Zack D“ alebo keď používateľ chce animáciu z Blenderu.
---

# /animacia – nápad → hotové animované video

Pracuj v koreni projektu (priečinok `ai-animator`). Píš po slovensky (alebo jazykom používateľa), krátko a ľudsky.
Podrobnosti: `formaty.md` (ako písať skript), `scena.md` (ako stavať 3D scénu), `kontrola.md` (čo skontrolovať pred odovzdaním).
Hotový vzor celého postupu: `priklady/lietadla/` (skript, hlas, scéna, výsledok).

## 0. Zisti (pýtaj sa len na to, čo nevieš)
- **Nápad / téma** (povinné). Ak je vágna, navrhni 3 konkrétne uhly a nechaj vybrať.
- **Formát** – vyber sám podľa témy (`formaty.md`): vysvetľovačka „ako sa z X stane Y“, otázka „prečo…?“, príbeh s napätím, krátke podobenstvo, interaktívna séria.
- **Jazyk** (sk / cs / en), **dĺžka** (predvolene 30–45 s), **hlas**: vlastná nahrávka (najlepšie) / ElevenLabs (kľúč v `.env`) / Piper (zadarmo, dobrý len po česky).
- Názov projektu bez diakritiky a medzier → `projekty/<nazov>/`.

## 1. Skript → `projekty/<nazov>/skript.txt`
- Píš podľa vzorca formátu z `formaty.md`. Prvá veta = háčik (do 2 s je jasné, o čom to je a prečo pozerať ďalej).
- Krátke vety, jedno číslo na vetu, žiadna vata. *Hviezdičkami* označ 1 slovo na vetu, ktoré má svietiť v titulkoch.
- **Fakty si over** (výpočtom alebo z dôveryhodného zdroja). Nič si nevymýšľaj – radšej menej, ale pravdivo. Čísla v skripte píš slovami, ak ich hlas má čítať (napr. „tisíc päťsto“).
- Ukáž používateľovi skript + 1 vetu, ako to bude vyzerať. Počkaj na „ok“ (alebo uprav).

## 2. Hlas → `hlas.wav`
- Vlastná nahrávka: `python nastroje/hlas.py projekty/<n> --nahravka "<cesta>"` (oreže ticho, skráti pauzy). Ak sú v nahrávke zopakované vety, vystrihni ich najprv (nechaj vždy posledný pokus).
- ElevenLabs: `python nastroje/hlas.py projekty/<n> --elevenlabs [--hlas-id <id>]`
- Piper: `python nastroje/hlas.py projekty/<n> --piper --jazyk cs`
- Prípadne `--rychlost 1.08`, ak hlas znie pomaly.

## 3. Časy slov → `slova.json`
`python nastroje/slova.py projekty/<n> --jazyk sk` – zarovná slová na skript (pravopis zo skriptu). Pri zhode < 80 % skontroluj, či hlas sedí so skriptom.

## 4. Scéna → `projekty/<n>/scena.py`
- Skopíruj kostru zo `scena.md` (podľa formátu) alebo z `priklady/lietadla/scena.py` a postav svet z knižnice `kniznica/anim.py`.
- **Každý pohyb viaž na slová**: `T("Grónsko")`, `TE("oblúk")`, `T("ale", n=2)`. Nikdy nepíš časy natvrdo – po novom hlase by nesedeli.
- Na každú vetu zmena obrazu (pohyb kamery, nový objekt, prechod). Pojmy ako pečiatka: `pojem("ortodroma", T("oblúk"))`. Zvuky: `zvuk("pop", t)`.
- Dôležité veci drž v hornej 60 % obrazu (titulky sú okolo 62 % výšky).

## 5. Náhľad → skontroluj očami
`python nastroje/render.py projekty/<n> --nahlad` (alebo `--nahlad 1.5,4,7` na konkrétne časy) → **otvor `projekty/<n>/nahlad.jpg` (Read) a pozri sa naň**:
- Je hlavná vec v zábere a dosť veľká? Nie je nič orezané (menovky, objekty pri okraji)? Nie je to príliš tmavé/prázdne?
- Sedí obraz s tým, čo sa v tej chvíli hovorí?
Opravuj a opakuj náhľad, kým to nesedí (náhľad trvá sekundy, celý render minúty).

## 6. Render → `snimky/`
`python nastroje/render.py projekty/<n>` (predvolene 2 procesy; silný PC `--procesy 3`). Povedz používateľovi odhad: ~1 s na snímku / proces, 30 s video ≈ 900 snímok ≈ 5–15 min.

## 7. Strih → `hotove.mp4`
`python nastroje/zloz.py projekty/<n> [--titulky slovo|karaoke] [--nadpis "HÁČIK HORE"] [--hudba <súbor>]`
→ pozri `hotove_harok.jpg` (Read). Skontroluj podľa `kontrola.md`. Opravy: scéna → render (pokračuje, len zmazané/nové snímky treba `--odznova`) → zloz.

## 8. Odovzdaj
Povedz, kde je video (`projekty/<n>/hotove.mp4`), v 2–3 vetách čo v ňom je, a ponúkni: popis pod video + hashtagy, ďalší diel (pri sériách), inú verziu háčika.
Preferencie používateľa (štýl, hlas, farby, maskot) si zapíš do `CLAUDE.md` → „Moje preferencie“.
