"""Hlas k videu → projekty/<n>/hlas.wav. Tri možnosti:

  1) Vlastná nahrávka (najlepšie znie, zadarmo) – nahraj skript na mobil a daj cestu k súboru:
       python nastroje/hlas.py projekty/moje-video --nahravka C:\\Users\\ty\\Downloads\\nahravka.m4a
     (oreže ticho na začiatku a konci, skráti dlhé pauzy, zjednotí hlasitosť)
  2) ElevenLabs (najlepší AI hlas, platený účet od ~5 $/mes.) – kľúč daj do súboru .env v koreni projektu:
       ELEVENLABS_API_KEY=sk_...
       python nastroje/hlas.py projekty/moje-video --elevenlabs
       python nastroje/hlas.py projekty/moje-video --elevenlabs --hlas-id <id hlasu z ElevenLabs>
  3) Piper (zadarmo, offline) – čeština znie dobre, slovenčina len na skúšku:
       python nastroje/hlas.py projekty/moje-video --piper --jazyk cs

Voľby: --rychlost 1.08 (zrýchli bez zmeny výšky hlasu), --jazyk sk|cs|en
Text sa berie zo skript.txt (riadky s # a [poznámky] sa nečítajú, *hviezdičky* sa ignorujú).
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HLASY = os.path.join(KOREN, "kniznica", "hlasy")
PIPER = {
    "cs": "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium",
    "sk": "sk/sk_SK/lili/medium/sk_SK-lili-medium",
    "en": "en/en_US/ryan/high/en_US-ryan-high",
}
ELEVEN_PREDVOLENY = "pNInz6obpgDQGcFmaJgB"  # „Adam“ – hlboký mužský rozprávač, funguje aj po slovensky/česky (multilingual v2)


def text_skriptu(proj):
    p = os.path.join(proj, "skript.txt")
    if not os.path.exists(p):
        sys.exit(f"Chyba: {p} neexistuje – najprv napíš skript.")
    lines = [l for l in open(p, encoding="utf-8").read().splitlines() if l.strip() and not l.strip().startswith("#")]
    t = " ".join(lines)
    t = re.sub(r"\[[^\]]*\]", " ", t).replace("*", "")
    return re.sub(r"\s+", " ", t).strip()


def env_kluc(meno):
    if os.environ.get(meno):
        return os.environ[meno]
    p = os.path.join(KOREN, ".env")
    if os.path.exists(p):
        for l in open(p, encoding="utf-8"):
            if l.strip().startswith(meno + "="):
                return l.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def ffmpeg(*args):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit("ffmpeg chyba: " + r.stderr[-800:])


def dokonci(src, out, rychlost=1.0, orez=True, pauzy=False):
    """→ 48 kHz mono WAV, orezané ticho, zjednotená hlasitosť (−16 LUFS), voliteľne zrýchlenie a skrátenie páuz"""
    f = []
    if orez:
        f.append("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05")
        f.append("areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse")
    if pauzy:
        f.append("silenceremove=stop_periods=-1:stop_duration=0.32:stop_threshold=-42dB:stop_silence=0.22")
    if abs(rychlost - 1.0) > 1e-3:
        f.append(f"atempo={rychlost}")
    f.append("loudnorm=I=-16:TP=-1.5:LRA=11")
    ffmpeg("-i", src, "-af", ",".join(f), "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", out)


def elevenlabs(text, out_mp3, hlas_id, jazyk):
    kluc = env_kluc("ELEVENLABS_API_KEY")
    if not kluc:
        sys.exit("Chýba ELEVENLABS_API_KEY. Vytvor v koreni projektu súbor .env s riadkom  ELEVENLABS_API_KEY=tvoj_kluc  "
                 "(kľúč nájdeš na elevenlabs.io → Profile → API Keys).")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{hlas_id}?output_format=mp3_44100_128"
    body = {"text": text, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True}}
    if jazyk in ("sk", "cs", "en"):
        body["language_code"] = jazyk
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"xi-api-key": kluc, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            open(out_mp3, "wb").write(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")[:400]
        if "language_code" in msg:  # starší model nepozná language_code → skús bez neho
            body.pop("language_code", None)
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"xi-api-key": kluc, "Content-Type": "application/json", "Accept": "audio/mpeg"})
            with urllib.request.urlopen(req, timeout=180) as r:
                open(out_mp3, "wb").write(r.read())
        else:
            sys.exit(f"ElevenLabs vrátil chybu {e.code}: {msg}")


def piper(text, out_wav, jazyk, rychlost):
    try:
        from piper import PiperVoice, SynthesisConfig
    except ImportError:
        sys.exit("Chýba balík piper-tts: python -m pip install piper-tts")
    if jazyk not in PIPER:
        sys.exit(f"Piper hlas pre jazyk '{jazyk}' nemám (mám: {', '.join(PIPER)}).")
    os.makedirs(HLASY, exist_ok=True)
    rel = PIPER[jazyk]
    model = os.path.join(HLASY, os.path.basename(rel) + ".onnx")
    if not os.path.exists(model):
        print("Sťahujem hlas Piper (~60 MB, len raz)…", flush=True)
        base = "https://huggingface.co/rhasspy/piper-voices/resolve/main/" + rel
        urllib.request.urlretrieve(base + ".onnx", model)
        urllib.request.urlretrieve(base + ".onnx.json", model + ".json")
    if jazyk == "sk":
        print("Pozor: slovenský Piper hlas znie dosť roboticky – na zverejnenie radšej vlastná nahrávka alebo ElevenLabs.")
    import wave
    v = PiperVoice.load(model)
    with wave.open(out_wav, "wb") as wf:
        v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=1.0 / max(0.5, rychlost)))


def main():
    ap = argparse.ArgumentParser(description="Hlas k videu → hlas.wav")
    ap.add_argument("projekt")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--nahravka", help="tvoja nahrávka (m4a/mp3/wav)")
    g.add_argument("--elevenlabs", action="store_true")
    g.add_argument("--piper", action="store_true")
    ap.add_argument("--hlas-id", default=ELEVEN_PREDVOLENY, help="ElevenLabs voice id")
    ap.add_argument("--jazyk", default="sk")
    ap.add_argument("--rychlost", type=float, default=1.0)
    a = ap.parse_args()
    proj = os.path.abspath(a.projekt)
    os.makedirs(proj, exist_ok=True)
    out = os.path.join(proj, "hlas.wav")
    tmp = tempfile.mkdtemp()
    if a.nahravka:
        if not os.path.exists(a.nahravka):
            sys.exit(f"Chyba: {a.nahravka} neexistuje.")
        dokonci(a.nahravka, out, a.rychlost, orez=True, pauzy=True)
    elif a.elevenlabs:
        mp3 = os.path.join(tmp, "el.mp3")
        elevenlabs(text_skriptu(proj), mp3, a.hlas_id, a.jazyk)
        dokonci(mp3, out, a.rychlost)
    else:
        wav = os.path.join(tmp, "piper.wav")
        piper(text_skriptu(proj), wav, a.jazyk, a.rychlost)
        dokonci(wav, out, 1.0)
    shutil.rmtree(tmp, ignore_errors=True)
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True)
    print(f"Hotovo: {out} ({float(r.stdout):.1f} s). Ďalší krok: python nastroje/slova.py {a.projekt}")


if __name__ == "__main__":
    main()
