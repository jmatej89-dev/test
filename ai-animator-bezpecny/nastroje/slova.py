"""Časy slov z hlasu → projekty/<n>/slova.json (pre animácie aj titulky).

  python nastroje/slova.py projekty/moje-video                 (hlas.wav + skript.txt v projekte)
  python nastroje/slova.py projekty/moje-video --jazyk cs
  python nastroje/slova.py projekty/moje-video --model small    (rýchlejšie, menej presné)

Ak je v projekte skript.txt, slová sa zarovnajú na text skriptu → titulky majú presne tvoj pravopis
(prepis hlasu sa použije len na časy). *Hviezdičkami* v skripte označené slová budú v titulkoch žlté.
Prvé spustenie stiahne model (~1,6 GB pri large-v3-turbo).
"""
import argparse, difflib, json, os, re, sys, unicodedata

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn" and c.isalnum())


def skript_tokeny(path):
    txt = "\n".join(l for l in open(path, encoding="utf-8").read().splitlines() if not l.strip().startswith("#"))
    txt = re.sub(r"\[[^\]]*\]", " ", txt)  # [poznámky pre strih] sa nečítajú
    out = []
    for tok in txt.split():
        kluc = "*" in tok
        w = tok.replace("*", "")
        if norm(w):
            out.append({"w": w, "kluc": kluc})
        elif out:  # samostatná interpunkcia (napr. „–“) prilep k predošlému
            out[-1]["w"] += w if w not in "–—-" else ""
    return out


def prepis(audio, jazyk, model, gpu):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cuda" if gpu else "cpu", compute_type="float16" if gpu else "int8")
    segs, _ = m.transcribe(audio, language=jazyk, beam_size=5, word_timestamps=True, condition_on_previous_text=False, vad_filter=False)
    return [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words if w.word.strip()]


def zarovnaj(skript, hlas):
    a = [norm(x["w"]) for x in skript]
    b = [norm(x["w"]) for x in hlas]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    times = [None] * len(skript)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (hlas[j1 + k]["s"], hlas[j1 + k]["e"])
        elif tag == "replace" and j2 > j1:
            # rozdeľ časový úsek prepisu medzi slová skriptu podľa dĺžky
            s0, e0 = hlas[j1]["s"], hlas[j2 - 1]["e"]
            lens = [max(1, len(a[i])) for i in range(i1, i2)]
            tot = sum(lens)
            t = s0
            for k, ln in enumerate(lens):
                d = (e0 - s0) * ln / tot
                times[i1 + k] = (round(t, 3), round(t + d, 3))
                t += d
    # chýbajúce (slová, ktoré prepis vynechal) → medzi susedov
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt_i = next((j for j in range(i + 1, len(times)) if times[j]), None)
            nxt = times[nxt_i][0] if nxt_i is not None else prev + 0.4
            n_gap = (nxt_i if nxt_i is not None else i + 1) - i
            d = max(0.08, (nxt - prev) / (n_gap + 0))
            times[i] = (round(prev, 3), round(prev + d, 3))
    out = []
    for x, (s, e) in zip(skript, times):
        out.append({"w": x["w"], "s": s, "e": max(e, s + 0.05), "kluc": x["kluc"]})
    zhoda = sum(1 for t, *_ in sm.get_opcodes() if t == "equal")
    return out, sm.ratio()


def vety(slova):
    out, cur = [], []
    for w in slova:
        cur.append(w)
        if re.search(r"[.?!…]$", w["w"]):
            out.append({"text": " ".join(x["w"] for x in cur), "s": cur[0]["s"], "e": cur[-1]["e"]})
            cur = []
    if cur:
        out.append({"text": " ".join(x["w"] for x in cur), "s": cur[0]["s"], "e": cur[-1]["e"]})
    return out


def main():
    ap = argparse.ArgumentParser(description="Časy slov z hlasu → slova.json")
    ap.add_argument("projekt")
    ap.add_argument("--hlas", default=None, help="zvuk (predvolene <projekt>/hlas.wav)")
    ap.add_argument("--jazyk", default="sk")
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--gpu", action="store_true", help="NVIDIA grafika (rýchlejšie)")
    a = ap.parse_args()
    proj = os.path.abspath(a.projekt)
    audio = a.hlas or os.path.join(proj, "hlas.wav")
    if not os.path.exists(audio):
        sys.exit(f"Chyba: {audio} neexistuje (najprv nastroje/hlas.py).")
    hl = prepis(audio, a.jazyk, a.model, a.gpu)
    sk = os.path.join(proj, "skript.txt")
    if os.path.exists(sk):
        slova, ratio = zarovnaj(skript_tokeny(sk), hl)
        print(f"Zarovnané na skript: {len(slova)} slov, zhoda s prepisom {ratio * 100:.0f} %")
        if ratio < 0.6:
            print("POZOR: hlas sa veľmi líši od skriptu – skontroluj, či hlas.wav patrí k tomuto skriptu.")
    else:
        slova = [dict(w, kluc=False) for w in hl]
        print(f"Bez skriptu: {len(slova)} slov z prepisu (skontroluj pravopis v slova.json)")
    data = {"slova": slova, "vety": vety(slova)}
    json.dump(data, open(os.path.join(proj, "slova.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for v in data["vety"]:
        print(f"  {v['s']:6.2f}–{v['e']:6.2f}  {v['text']}")
    print("→", os.path.join(proj, "slova.json"))


if __name__ == "__main__":
    main()
