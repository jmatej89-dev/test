"""Strih: snímky z Blenderu + hlas + titulky + pojmy + zvukové efekty + hudba → hotové video na Reels/TikTok/Shorts.

  python nastroje/zloz.py projekty/moje-video
  python nastroje/zloz.py projekty/moje-video --titulky karaoke            (2–3 slová dole, aktuálne slovo v rámčeku)
  python nastroje/zloz.py projekty/moje-video --titulky slovo --titulky-y 0.5   (po jednom slove v strede – štýl Dude Facts)
  python nastroje/zloz.py projekty/moje-video --nadpis "PREČO LIETADLÁ NELETIA ROVNO?"   (háčik hore na prvé 2,5 s)
  python nastroje/zloz.py projekty/moje-video --hudba C:\\hudba\\podklad.mp3 --hudba-hlasitost 0.12

Výstup: projekty/<n>/hotove.mp4 (1080×1920, −14 LUFS) + hotove_harok.jpg na kontrolu.
Hudbu si daj vlastnú (bez autorských práv) – Instagram/TikTok hudbu radšej pridaj až v appke pri uverejnení.
"""
import argparse, json, math, os, re, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
PISMO = os.path.join(KOREN, "pisma", "Nunito-Black.ttf")
PISMO2 = os.path.join(KOREN, "pisma", "Outfit-Black.ttf")
W, H, SR = 1080, 1920, 48000
FARBY = {"zlta": ((255, 201, 77), (20, 22, 38)), "modra": ((43, 59, 255), (255, 255, 255)), "cervena": ((240, 74, 43), (255, 255, 255)),
         "zelena": ((31, 157, 85), (255, 255, 255)), "biela": ((255, 255, 255), (20, 22, 38)), "cierna": ((20, 22, 38), (255, 255, 255))}
ZLTA = (255, 210, 60)


def ease_out_back(x):
    x = max(0.0, min(1.0, x))
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


_font = {}


def font(path, size):
    k = (path, size)
    if k not in _font:
        _font[k] = ImageFont.truetype(path, size)
    return _font[k]


def clean(w):
    return re.sub(r"[.,?!:;…„“\"»«]+", "", w).strip()


# ---------------- titulky: po jednom slove ----------------
_cache = {}


def slovo_img(text, kluc, max_w=940):
    k = ("s", text, kluc)
    if k in _cache:
        return _cache[k]
    size = 150
    while size > 60:
        f = font(PISMO, size)
        bb = f.getbbox(text, stroke_width=14)
        if bb[2] - bb[0] <= max_w:
            break
        size -= 8
    pad = 40
    img = Image.new("RGBA", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((pad - bb[0], pad - bb[1] + 10), text, font=f, fill=(0, 0, 0, 140), stroke_width=16, stroke_fill=(0, 0, 0, 140))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(img).text((pad - bb[0], pad - bb[1]), text, font=f, fill=(*ZLTA, 255) if kluc else (255, 255, 255, 255), stroke_width=14, stroke_fill=(10, 10, 14, 255))
    _cache[k] = img
    return img


# ---------------- titulky: karaoke (2–3 slová, aktuálne v rámčeku) ----------------
def chunky(slova, max_slov=3, max_znakov=18, medzera=0.35):
    out, cur = [], []
    for i, w in enumerate(slova):
        cur.append(w)
        nxt = slova[i + 1] if i + 1 < len(slova) else None
        chars = len(" ".join(clean(x["w"]) for x in cur))
        if (not nxt or re.search(r"[.,?!…:;]$", w["w"]) or nxt["s"] - w["e"] > medzera or len(cur) >= max_slov
                or chars + len(clean(nxt["w"])) + 1 > max_znakov):
            out.append(cur)
            cur = []
    res = []
    for i, c in enumerate(out):
        nxt = out[i + 1][0]["s"] if i + 1 < len(out) else c[-1]["e"] + 0.5
        res.append({"slova": c, "s": c[0]["s"], "e": min(nxt, c[-1]["e"] + 0.5)})
    return res


def karaoke_img(chunk, aktivne, size=78):
    k = ("k", tuple(clean(w["w"]) for w in chunk["slova"]), aktivne, size)
    if k in _cache:
        return _cache[k]
    f = font(PISMO, size)
    gap, padx, pady = 16, 18, 10
    words = [clean(w["w"]) for w in chunk["slova"]]
    widths = [f.getbbox(w)[2] - f.getbbox(w)[0] for w in words]
    hh = size + 2 * pady
    tot = sum(widths) + 2 * padx * len(words) + gap * (len(words) - 1) + 40
    img = Image.new("RGBA", (tot, hh + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 20
    for i, (w, ww) in enumerate(zip(words, widths)):
        box = (x, 20, x + ww + 2 * padx, 20 + hh)
        on = i == aktivne
        kl = chunk["slova"][i].get("kluc")
        if on:
            d.rounded_rectangle(box, radius=16, fill=(43, 59, 255, 255))
        bb = f.getbbox(w)
        d.text((x + padx - bb[0], 20 + pady - bb[1] + (size - (bb[3] - bb[1])) // 2), w, font=f,
               fill=(255, 255, 255, 255) if on else ((*ZLTA, 255) if kl else (255, 255, 255, 255 if i <= aktivne else 150)),
               stroke_width=0 if on else 8, stroke_fill=(10, 10, 14, 255))
        x += ww + 2 * padx + gap
    _cache[k] = img
    return img


# ---------------- pojem (pečiatka) ----------------
def pojem_img(text, farba):
    k = ("p", text, farba)
    if k in _cache:
        return _cache[k]
    bg, fg = FARBY.get(farba, FARBY["zlta"])
    size = 104
    f = font(PISMO2, size)
    while (f.getbbox(text.upper())[2] - f.getbbox(text.upper())[0]) > 860 and size > 50:
        size -= 6
        f = font(PISMO2, size)
    t = text.upper()
    bb = f.getbbox(t)
    pw, ph = bb[2] - bb[0] + 90, bb[3] - bb[1] + 70
    img = Image.new("RGBA", (pw + 80, ph + 80), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((40, 52, 40 + pw, 52 + ph), radius=34, fill=(0, 0, 0, 120))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, 40 + pw, 40 + ph), radius=34, fill=(*bg, 255))
    d.text((40 + 45 - bb[0], 40 + 35 - bb[1]), t, font=f, fill=(*fg, 255))
    img = img.rotate(4, resample=Image.BICUBIC, expand=True)
    _cache[k] = img
    return img


def nadpis_img(text):
    k = ("n", text)
    if k in _cache:
        return _cache[k]
    f = font(PISMO2, 92)
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if f.getbbox(test)[2] > 920 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = test
    lines.append(cur)
    lh = 104
    img = Image.new("RGBA", (1000, lh * len(lines) + 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, l in enumerate(lines):
        bb = f.getbbox(l)
        x = (1000 - (bb[2] - bb[0])) // 2 - bb[0]
        d.text((x, 30 + i * lh - bb[1]), l, font=f, fill=(255, 255, 255, 255), stroke_width=12, stroke_fill=(10, 10, 14, 255))
    _cache[k] = img
    return img


def paste_c(frame, img, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0.01 or alpha <= 0.01:
        return
    if abs(scale - 1) > 0.01:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
    if alpha < 0.999:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


# ---------------- zvuk ----------------
def nacitaj_wav(path):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(1)
    if sr != SR:
        n = int(len(x) * SR / sr)
        x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
    return x


def nacitaj_hocico(path):
    """mp3/m4a → wav cez ffmpeg"""
    tmp = os.path.join(os.path.dirname(os.path.abspath(path)), "_tmp_hudba.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), tmp], check=True)
    x = nacitaj_wav(tmp)
    os.remove(tmp)
    return x


def mix_audio(proj, dlzka, udalosti, hudba, hudba_vol):
    n = int(dlzka * SR) + SR
    out = np.zeros(n, np.float32)
    vo = nacitaj_wav(os.path.join(proj, "hlas.wav"))
    out[:len(vo)] += vo[:n]
    sfx_dir = os.path.join(KOREN, "sfx")
    for z in udalosti.get("zvuky", []):
        p = os.path.join(sfx_dir, z["meno"] + ".wav")
        if not os.path.exists(p):
            print(f"  (zvuk {z['meno']} nemám, preskakujem)")
            continue
        s = nacitaj_wav(p) * float(z.get("hlas", 0.5)) * 0.6
        i = int(z["t"] * SR)
        if 0 <= i < n:
            out[i:i + len(s)] += s[:n - i]
    if hudba:
        mu = nacitaj_hocico(hudba)
        if len(mu) < n:
            mu = np.tile(mu, n // len(mu) + 1)
        mu = mu[:n] * hudba_vol
        fade = int(0.8 * SR)
        mu[-fade:] *= np.linspace(1, 0, fade)
        # jemné stíšenie pod hlasom
        env = np.abs(np.convolve(np.pad(vo, (0, max(0, n - len(vo))))[:n], np.ones(4800) / 4800, mode="same"))
        duck = 1 - 0.45 * np.clip(env / (env.max() + 1e-9) * 6, 0, 1)
        out += mu * duck
    end = int(dlzka * SR)
    out = out[:end]
    pk = np.abs(out).max()
    if pk > 0.98:
        out *= 0.98 / pk
    return out


def main():
    ap = argparse.ArgumentParser(description="Zostrihá hotové video z projektu.")
    ap.add_argument("projekt")
    ap.add_argument("--titulky", default="slovo", choices=["slovo", "karaoke", "ziadne"])
    ap.add_argument("--titulky-y", type=float, default=None, help="výška titulkov 0–1 (slovo 0.62, karaoke 0.78)")
    ap.add_argument("--nadpis", default="", help="háčik hore na prvé sekundy")
    ap.add_argument("--nadpis-dlzka", type=float, default=2.6)
    ap.add_argument("--hudba", default="")
    ap.add_argument("--hudba-hlasitost", type=float, default=0.12)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("-o", "--out", default=None)
    a = ap.parse_args()

    proj = os.path.abspath(a.projekt)
    info = json.load(open(os.path.join(proj, "snimky_info.json")))
    fps = info["fps"]
    snimky = os.path.join(proj, "snimky")
    frames = sorted(f for f in os.listdir(snimky) if f.endswith(".png"))
    if len(frames) < info["frames"]:
        sys.exit(f"Chýbajú snímky ({len(frames)}/{info['frames']}) – najprv dokonči nastroje/render.py")
    slova = json.load(open(os.path.join(proj, "slova.json"), encoding="utf-8"))["slova"]
    ud = json.load(open(os.path.join(proj, "udalosti.json"), encoding="utf-8")) if os.path.exists(os.path.join(proj, "udalosti.json")) else {}
    vo_len = sf.info(os.path.join(proj, "hlas.wav")).duration
    dlzka = max(info["frames"] / fps, vo_len + 0.4)
    nf = int(round(dlzka * fps))
    y_tit = a.titulky_y if a.titulky_y is not None else (0.62 if a.titulky == "slovo" else 0.78)
    chunks = chunky(slova) if a.titulky == "karaoke" else None
    zablesky = ud.get("zablesky", [])
    pojmy = ud.get("pojmy", [])

    print(f"Strihám {nf} snímok ({dlzka:.1f} s)…", flush=True)
    audio = mix_audio(proj, dlzka, ud, a.hudba, a.hudba_hlasitost)
    wav = os.path.join(proj, "_mix.wav")
    sf.write(wav, audio, SR, subtype="PCM_16")
    tmp_mp4 = os.path.join(proj, "_video.mp4")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", tmp_mp4], stdin=subprocess.PIPE)
    last = None
    for i in range(nf):
        t = i / fps
        fi = min(i, len(frames) - 1)
        if fi != last:
            base = Image.open(os.path.join(snimky, frames[fi])).convert("RGBA")
            if base.size != (W, H):
                base = base.resize((W, H), Image.BICUBIC)
            last = fi
        fr = base.copy()
        # titulky
        if a.titulky == "slovo":
            cur = None
            for k, w in enumerate(slova):
                nxt = slova[k + 1]["s"] if k + 1 < len(slova) else w["e"] + 0.6
                if w["s"] <= t < min(nxt, w["e"] + 0.7):
                    cur = w
                    break
            if cur and clean(cur["w"]):
                p = (t - cur["s"]) / 0.09
                paste_c(fr, slovo_img(clean(cur["w"]).upper(), cur.get("kluc")), W / 2, H * y_tit, 0.82 + 0.18 * min(1, p))
        elif chunks:
            c = next((c for c in chunks if c["s"] <= t < c["e"]), None)
            if c:
                akt = max([k for k, w in enumerate(c["slova"]) if w["s"] <= t] or [0])
                p = (t - c["s"]) / 0.1
                paste_c(fr, karaoke_img(c, akt), W / 2, H * y_tit, 0.92 + 0.08 * min(1, p))
        # nadpis (háčik)
        if a.nadpis and t < a.nadpis_dlzka:
            al = min(1, (a.nadpis_dlzka - t) / 0.2)
            paste_c(fr, nadpis_img(a.nadpis), W / 2, 330, ease_out_back(t / 0.3) if t < 0.3 else 1.0, al)
        # pojmy
        for pj in pojmy:
            dt = t - pj["t"]
            if 0 <= dt < pj["trvanie"]:
                sc = ease_out_back(dt / 0.28)
                al = min(1, (pj["trvanie"] - dt) / 0.18)
                paste_c(fr, pojem_img(pj["text"], pj.get("farba", "zlta")), W / 2, H * 0.27, sc, al)
        # záblesky
        for z in zablesky:
            dt = t - z
            if -0.04 <= dt < 0.25:
                al = (1 - dt / 0.25) if dt >= 0 else (dt + 0.04) / 0.04
                fr.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * max(0, min(1, al))))))
        enc.stdin.write(fr.convert("RGB").tobytes())
        if i % 150 == 0:
            print(f"  {i}/{nf}", flush=True)
    enc.stdin.close()
    enc.wait()
    out = a.out or os.path.join(proj, "hotove.mp4")
    # hlasitosť pre sociálne siete: −14 LUFS, špička −1.5 dB
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp_mp4, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out],
                       capture_output=True, text=True)
    if r.returncode:
        sys.exit("ffmpeg chyba: " + r.stderr[-600:])
    os.remove(tmp_mp4)
    os.remove(wav)
    from nahlad import harok, snimky_z_videa
    casy = [dlzka * (k + 0.5) / 16 for k in range(16)]
    harok(snimky_z_videa(out, casy), os.path.splitext(out)[0] + "_harok.jpg", popisky=[f"{c:.1f} s" for c in casy])
    print(f"Hotovo → {out}\nKontrola → {os.path.splitext(out)[0]}_harok.jpg")


if __name__ == "__main__":
    main()
