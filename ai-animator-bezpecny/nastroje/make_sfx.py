"""Vyrobí sadu zvukových efektov (48 kHz WAV) syntézou – žiadne nahrávky, žiadne autorské práva, sú tvoje.

Použitie:  python tools/make_sfx.py public/sfx      (alebo: npm run sfx)

Efekty: whoosh, swoosh, whoosh_long, pop, click, tick, stamp, chime, ding, riser, boom, flash, thump, paper, glitch, typing, notif.
Chceš iný zvuk? Daj do public/sfx vlastný .wav s rovnakým názvom (napr. svoj obľúbený pop) – engine ho použije.
"""
import argparse, os, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

ap = argparse.ArgumentParser(description="Vyrobí zvukové efekty do zadaného priečinka (predvolene public/sfx).")
ap.add_argument("out", nargs="?", default="public/sfx", help="cieľový priečinok")
out = ap.parse_args().out
SR = 48000; os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR
def norm(x, peak=0.9): return x / (np.abs(x).max() + 1e-9) * peak
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)
def save(name, x): sf.write(os.path.join(out, name + ".wav"), norm(x).astype(np.float32), SR); print(name, f"{len(x)/SR:.2f}s")

# whoosh: noise through a sweeping band-pass, swell then fade (0.45 s)
d = 0.45; t = t_(d); n = rng.standard_normal(len(t)); y = np.zeros_like(n); blk = 480
for i in range(0, len(n), blk):
    p = i / len(n); fc = 300 + 2600 * np.sin(np.pi * p) ** 1.5
    y[i:i+blk] = bp(n[max(0, i-2000):i+blk], fc * 0.6, fc * 1.6)[-len(n[i:i+blk]):]
env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
save("whoosh", y * env)
# short swoosh (0.25 s) for quick slides
d = 0.25; t = t_(d); y = hp(bp(rng.standard_normal(len(t)), 900, 6000), 600) * np.sin(np.pi * t / d) ** 3
save("swoosh", y)
# pop: pitch drop sine + tiny click (70 ms)
d = 0.09; t = t_(d); f = 1100 * np.exp(-t * 30) + 260; ph = 2 * np.pi * np.cumsum(f) / SR
y = np.sin(ph) * np.exp(-t * 45); y[:60] += rng.standard_normal(60) * 0.4
save("pop", y)
# click (mouse/UI), 25 ms
d = 0.03; t = t_(d); y = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300) + 0.5 * np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 250)
save("click", y)
# tick (very short, bright), for hard cuts
d = 0.02; t = t_(d); y = np.sin(2 * np.pi * 4600 * t) * np.exp(-t * 400)
save("tick", y)
# stamp: low thump + noise slap (0.35 s)
d = 0.35; t = t_(d); f = 120 * np.exp(-t * 12) + 45; y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
y += lp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 60) * 0.8
save("stamp", y)
# chime: two partials + soft attack (0.7 s)
d = 0.7; t = t_(d); y = (np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 6) * (1 - np.exp(-t * 400))
save("chime", y)
# ding (single bright, for counters) 0.4 s
d = 0.4; t = t_(d); y = (np.sin(2 * np.pi * 1760 * t) + 0.3 * np.sin(2 * np.pi * 3520 * t)) * np.exp(-t * 10) * (1 - np.exp(-t * 600))
save("ding", y)
# riser: noise + rising sine (0.6 s), ends abrupt
d = 0.6; t = t_(d); f = 200 + 1800 * (t / d) ** 2; y = 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) + hp(rng.standard_normal(len(t)), 1500) * (t / d) ** 2
save("riser", y * (t / d) ** 1.5)
# boom: sub drop (0.8 s)
d = 0.8; t = t_(d); f = 70 * np.exp(-t * 3) + 32; y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5) * (1 - np.exp(-t * 300))
y += lp(rng.standard_normal(len(t)), 800) * np.exp(-t * 25) * 0.5
save("boom", y)
# paper: rustle/tear — crackly band-limited noise bursts with a swell (0.5 s)
d = 0.5; t = t_(d); n = rng.standard_normal(len(t)); crack = (rng.random(len(t)) < 0.02) * rng.standard_normal(len(t)) * 6
y = hp(bp(n + crack, 1200, 9000), 900) * (np.sin(np.pi * t / d) ** 1.2) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t)))
save("paper", y)
# glitch: stuttered digital buzz (0.3 s)
d = 0.3; t = t_(d); sq = np.sign(np.sin(2 * np.pi * 180 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 1240 * t)) * 0.3
gate = (np.floor(t * 40) % 3 != 1).astype(float); y = bp(sq * gate + rng.standard_normal(len(t)) * 0.2, 150, 7000) * np.exp(-t * 4)
save("glitch", y)
# typing: 6 key clicks
d = 0.6; y = np.zeros(int(d * SR))
for k in range(6):
    s = int((0.04 + k * 0.085 + rng.random() * 0.02) * SR); tt = np.arange(900) / SR
    y[s:s + 900] += hp(rng.standard_normal(900), 2000) * np.exp(-tt * 180) * (0.7 + 0.3 * rng.random())
save("typing", y)

# whoosh_long: 1,2 s švih na prelínanie hudby; vrchol presne o 0,94 s (spúšťaj v T − 0,94)
d = 1.25; t = t_(d); n = rng.standard_normal(len(t)); y = np.zeros_like(n); blk = 480; peak = 0.94
for i in range(0, len(n), blk):
    tt = i / SR; p = np.clip(tt / peak, 0, 1) if tt < peak else max(0.0, 1 - (tt - peak) / (d - peak))
    fc = 250 + 3200 * p ** 1.6
    y[i:i+blk] = bp(n[max(0, i-2000):i+blk], fc * 0.55, min(fc * 1.7, 20000))[-len(n[i:i+blk]):]
env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) * 14))
save("whoosh_long", y * env)
# flash: biely blesk – svetlý šum + basový úder (0,6 s), na drop hudby
d = 0.6; t = t_(d); f = 95 * np.exp(-t * 9) + 38
y = 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * (1 - np.exp(-t * 500))
y += hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 9) * 0.55
save("flash", y)
# thump: tupý úder, niečo dopadne (0,4 s)
d = 0.4; t = t_(d); f = 85 * np.exp(-t * 18) + 40
y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * (1 - np.exp(-t * 800)) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 40) * 0.6
save("thump", y)
# notif: dvojtónová notifikácia (0,5 s)
d = 0.5; t = t_(d); y = np.zeros_like(t)
for k, (f0, st) in enumerate([(1046.5, 0.0), (1568.0, 0.11)]):
    m = t >= st; tt = t[m] - st
    y[m] += (np.sin(2 * np.pi * f0 * tt) + 0.25 * np.sin(2 * np.pi * 2 * f0 * tt)) * np.exp(-tt * 12) * (1 - np.exp(-tt * 600))
save("notif", y)
print("hotovo →", out)
