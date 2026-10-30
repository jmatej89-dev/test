"""Kontaktný hárok (mriežka snímok s časmi) z obrázkov alebo z videa – na rýchlu vizuálnu kontrolu.

  python nastroje/nahlad.py projekty/moje-video/hotove.mp4            → hotove_harok.jpg (16 snímok)
  python nastroje/nahlad.py video.mp4 --casy 0.5,2,4.1 -o kontrola.jpg
"""
import argparse, io, os, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageDraw


def harok(obrazky, out, popisky=None, stlpce=8, sirka=216):
    ims = [Image.open(o).convert("RGB") if isinstance(o, str) else o for o in obrazky]
    if not ims:
        return
    vyska = int(sirka * ims[0].height / ims[0].width)
    rows = (len(ims) + stlpce - 1) // stlpce
    cols = min(stlpce, len(ims))
    S = Image.new("RGB", (sirka * cols, vyska * rows), "white")
    d = ImageDraw.Draw(S)
    for i, im in enumerate(ims):
        x, y = (i % stlpce) * sirka, (i // stlpce) * vyska
        S.paste(im.resize((sirka, vyska)), (x, y))
        if popisky:
            d.rectangle([x, y, x + 60, y + 16], fill="black")
            d.text((x + 3, y + 2), str(popisky[i]), fill="white")
    S.save(out, quality=88)
    return out


def snimky_z_videa(video, casy):
    out = []
    for t in casy:
        png = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        out.append(Image.open(io.BytesIO(png)))
    return out


def dlzka(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], capture_output=True, text=True)
    return float(r.stdout.strip())


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Kontaktný hárok z videa.")
    ap.add_argument("video")
    ap.add_argument("--casy", default="", help="časy v s oddelené čiarkou (predvolene 16 rovnomerne)")
    ap.add_argument("-o", "--out", default=None)
    a = ap.parse_args()
    casy = [float(x) for x in a.casy.split(",") if x.strip()] or [dlzka(a.video) * (i + 0.5) / 16 for i in range(16)]
    out = a.out or os.path.splitext(a.video)[0] + "_harok.jpg"
    harok(snimky_z_videa(a.video, casy), out, popisky=[f"{t:.1f} s" for t in casy])
    print("→", out)
