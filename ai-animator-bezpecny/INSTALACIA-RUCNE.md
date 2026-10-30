# Ručná inštalácia (bez .bat a .sh skriptov)

Táto verzia neobsahuje žiadne inštalačné skripty (`instaluj.bat`, `instaluj.sh`) – ich si urobíš sám z oficiálnych zdrojov.

1. Nainštaluj **Python 3.12+** z https://www.python.org/downloads/ (zaškrtni „Add python.exe to PATH“).
2. Nainštaluj **ffmpeg** (Windows: https://www.gyan.dev/ffmpeg/builds/, Mac: `brew install ffmpeg`).
3. Nainštaluj **Blender 4.2 alebo novší** z https://www.blender.org/download/.
4. V priečinku projektu spusti:
   ```
   python -m venv .venv
   .venv/bin/python -m pip install -r requirements.txt      (Windows: .venv\Scripts\python)
   .venv/bin/python nastroje/kontrola.py
   ```
5. Ukážka: `python nastroje/render.py priklady/lietadla --nahlad`, potom celé `render.py` a `zloz.py`.
6. Otvor priečinok v Claude Code a napíš napr. `/animacia prečo holuby kývajú hlavou`.

Ak Blender nenájde, nastav premennú `BLENDER` na cestu k programu.
