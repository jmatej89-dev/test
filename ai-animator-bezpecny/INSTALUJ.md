# Inštalácia AI Animátora – pokyny pre Claude

Tento súbor číta **Claude Code**, keď ho kupujúci požiada o inštaláciu (prompt z e-mailu).
Rob všetko sám, používateľ nemusí nič vedieť. Píš mu **po slovensky**, krátko a ľudsky.

## Cieľ
Na konci: projekt je v `Dokumenty/ai-animator` (Windows `%USERPROFILE%\Documents\ai-animator`, Mac `~/Documents/ai-animator`), `python nastroje/kontrola.py` je celé ✓, ukážka `priklady/lietadla` sa vyrenderovala a používateľ vie, čo spraviť ďalej.

## Postup
1. **Zisti systém** (Windows / macOS). Linux: Blender a ffmpeg nainštaluj cez správcu balíkov, ostatné rovnako.
2. **Rozbaľ ZIP**, ak ešte nie je (súbor `AI-Animator-*.zip`, obvykle v Stiahnutých):
   - Windows: `powershell -NoProfile -Command "Expand-Archive -Force '<cesta k zip>' '$env:USERPROFILE\Documents'"` → vznikne `Documents\AI-Animator`; premenuj na `ai-animator` (ak už existuje, nepremazávaj – opýtaj sa).
   - Mac: `unzip -o '<cesta k zip>' -d ~/Documents && mv ~/Documents/AI-Animator ~/Documents/ai-animator`
3. **Nainštaluj:**
   - **Windows:** `Set-Location "$env:USERPROFILE\Documents\ai-animator"; cmd /c ".\instaluj.bat auto"` – nainštaluje Python, ffmpeg a Blender (~400 MB) cez winget a Python balíky. Povedz vopred: *„Ak sa objaví okno, či povoliť zmeny, klikni Áno.“* Ak chýba `winget`, nech si z Microsoft Store nainštaluje **App Installer**.
   - **Mac:** ak chýba Homebrew (`command -v brew`), daj používateľovi príkaz na vloženie do Terminálu (pýta heslo, nemôžeš ho spraviť za neho):
     `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` → potom `bash instaluj.sh`. Na Macu potom používaj `.venv/bin/python` namiesto `python`.
4. **Kontrola:** `python nastroje/kontrola.py` – každé ✗ oprav (hláška hovorí ako). ElevenLabs a Piper nie sú povinné.
5. **Ukážka:** `python nastroje/render.py priklady/lietadla --nahlad` (pár sekúnd) a potom celé: `python nastroje/render.py priklady/lietadla` (5–15 min podľa PC) a `python nastroje/zloz.py priklady/lietadla`. Prvý prepis hlasu (slova.py) stiahne model ~1,6 GB – ukážka ho nepotrebuje, slova.json je pribalený.
6. **Na záver povedz:**
   > Hotovo ✅ AI Animátor je v priečinku Dokumenty/ai-animator a ukážkové video je v priklady/lietadla/hotove.mp4.
   > Otvor v Claude Code **nový chat v priečinku ai-animator** a napíš napríklad: `/animacia prečo holuby kývajú hlavou`.
   > Hlas: najlepšie je nahrať sa na mobil. Ak chceš AI hlas, založ si ElevenLabs a kľúč mi pošli – uložím ho do .env.

## Keď niečo zlyhá
- Prečítaj chybu, oprav ju sám a pokračuj. Nikdy nemeň systémové nastavenia ani nezadávaj heslá za používateľa.
- Blender nenájdený → `winget install -e --id BlenderFoundation.Blender` alebo nastav `BLENDER=<cesta k blender.exe>`.
- `faster-whisper` na Windows bez NVIDIA ide na procesore (pomalšie, ale ide).
