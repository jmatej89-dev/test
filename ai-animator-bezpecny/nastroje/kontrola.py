"""Skontroluje, či je všetko nainštalované:  python nastroje/kontrola.py"""
import importlib, os, shutil, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ok_all = True


def riadok(ok, text, rada=""):
    global ok_all
    ok_all &= ok
    print(("✓ " if ok else "✗ ") + text + ("" if ok or not rada else f"\n    → {rada}"))


riadok(sys.version_info >= (3, 10), f"Python {sys.version.split()[0]}", "nainštaluj Python 3.10+ (instaluj.bat / instaluj.sh)")
for mod, pip in (("numpy", "numpy"), ("PIL", "pillow"), ("soundfile", "soundfile"), ("faster_whisper", "faster-whisper")):
    try:
        importlib.import_module(mod)
        riadok(True, f"balík {pip}")
    except Exception:
        riadok(False, f"balík {pip}", f"python -m pip install {pip}")
try:
    importlib.import_module("piper")
    print("✓ balík piper-tts (hlas zadarmo)")
except Exception:
    print("· balík piper-tts nie je (nevadí – potrebný len pre hlas zadarmo: python -m pip install piper-tts)")

riadok(bool(shutil.which("ffmpeg")), "ffmpeg", "nainštaluj ffmpeg (instaluj.bat / brew install ffmpeg)")
try:
    from render import najdi_blender
    b = None
    try:
        b = najdi_blender()
    except SystemExit:
        pass
    if b:
        v = subprocess.run([b, "--version"], capture_output=True, text=True, timeout=60).stdout.splitlines()[0]
        num = v.split()[1] if len(v.split()) > 1 else "0"
        major_minor = tuple(int(x) for x in num.split(".")[:2])
        riadok(major_minor >= (4, 2), f"{v}  ({b})", "potrebný je Blender 4.2 alebo novší")
    else:
        riadok(False, "Blender", "nainštaluj Blender (instaluj.bat / instaluj.sh) alebo nastav premennú BLENDER")
except Exception as e:
    riadok(False, f"Blender ({e})", "nainštaluj Blender")

for f in ("pisma/Nunito-Black.ttf", "pisma/Outfit-Black.ttf", "kniznica/textury/zem_2048.jpg", "sfx/pop.wav"):
    riadok(os.path.exists(os.path.join(KOREN, f)), f, "chýba súbor z balíka – rozbaľ ZIP znova (sfx: python nastroje/make_sfx.py sfx)")

kl = os.path.exists(os.path.join(KOREN, ".env")) and "ELEVENLABS_API_KEY" in open(os.path.join(KOREN, ".env"), encoding="utf-8").read()
print("✓ ElevenLabs kľúč v .env" if kl else "· ElevenLabs kľúč nie je (nevadí – môžeš použiť vlastnú nahrávku alebo Piper)")
print("\nVšetko pripravené ✅" if ok_all else "\nNiečo chýba – oprav riadky s ✗ a spusti kontrolu znova.")
sys.exit(0 if ok_all else 1)
