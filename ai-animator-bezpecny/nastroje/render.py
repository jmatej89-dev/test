"""Render scény v Blenderi (bez okna). Nájde Blender sám.

  Náhľad (rýchly, 8 snímok v polovičnom rozlíšení + kontaktný hárok nahlad.jpg):
      python nastroje/render.py projekty/moje-video --nahlad
      python nastroje/render.py projekty/moje-video --nahlad 1.5,4,7.2      (konkrétne časy v s)
  Celé video (snímky do projekty/<n>/snimky, pokračuje tam, kde skončilo):
      python nastroje/render.py projekty/moje-video
      python nastroje/render.py projekty/moje-video --procesy 3              (viac naraz = rýchlejšie, viac RAM)
      python nastroje/render.py projekty/moje-video --odznova                (zmaže staré snímky)
  Uloženie .blend na kontrolu v Blenderi:
      python nastroje/render.py projekty/moje-video --blend
"""
import argparse, glob, os, re, shutil, subprocess, sys, time, json

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def najdi_blender():
    env = os.environ.get("BLENDER")
    if env and os.path.exists(env):
        return env
    w = shutil.which("blender")
    if w:
        return w
    kand = sorted(glob.glob(r"C:\Program Files\Blender Foundation\Blender*\blender.exe"), reverse=True)
    kand += sorted(glob.glob(os.path.expanduser(r"~\AppData\Local\Programs\Blender Foundation\Blender*\blender.exe")), reverse=True)
    kand += ["/Applications/Blender.app/Contents/MacOS/Blender", "/usr/bin/blender", "/snap/bin/blender"]
    for k in kand:
        if os.path.exists(k):
            return k
    sys.exit("Chyba: nenašiel som Blender. Nainštaluj ho (instaluj.bat / instaluj.sh) alebo nastav premennú BLENDER=cesta k blender.exe")


def blender_proc(blender, scena, proj, rezim, arg="", log=None):
    env = dict(os.environ, ANIM_KNIZNICA=os.path.join(KOREN, "kniznica"), PYTHONIOENCODING="utf-8")
    cmd = [blender, "-b", "--factory-startup", "--python", scena, "--", proj, rezim] + ([arg] if arg else [])
    return subprocess.Popen(cmd, stdout=log if log else subprocess.PIPE, stderr=subprocess.STDOUT, env=env,
                            text=log is None, encoding="utf-8" if log is None else None, errors="replace" if log is None else None)


def chyba_z_logu(text):
    lines = [l for l in text.splitlines() if l.strip()]
    tb = [i for i, l in enumerate(lines) if l.startswith("Traceback")]
    if tb:
        return "\n".join(lines[tb[-1]:tb[-1] + 40])
    errs = [l for l in lines if "Error" in l]
    return "\n".join(errs[-15:]) if errs else "\n".join(lines[-15:])


def chybajuce(proj, total):
    d = os.path.join(proj, "snimky")
    have = set()
    if os.path.isdir(d):
        for f in os.listdir(d):
            m = re.match(r"(\d+)\.png$", f)
            if m and os.path.getsize(os.path.join(d, f)) > 1000:
                have.add(int(m.group(1)))
    return [f for f in range(1, total + 1) if f not in have]


def rozsahy(frames, n):
    """rozdelí zoznam snímok na n súvislých kúskov"""
    if not frames:
        return []
    k = max(1, -(-len(frames) // n))
    out = []
    for i in range(0, len(frames), k):
        part = frames[i:i + k]
        out.append(f"{part[0]}-{part[-1]}")
    return out


def main():
    ap = argparse.ArgumentParser(description="Render scény projektu v Blenderi.")
    ap.add_argument("projekt", help="priečinok projektu, napr. projekty/moje-video (musí obsahovať scena.py)")
    ap.add_argument("--nahlad", nargs="?", const="", default=None, help="len náhľad: voliteľne časy oddelené čiarkou")
    ap.add_argument("--blend", action="store_true", help="ulož scena.blend (na otvorenie v Blenderi)")
    ap.add_argument("--procesy", type=int, default=2, help="koľko Blenderov naraz pri celom renderi (2–3)")
    ap.add_argument("--odznova", action="store_true", help="zmaž staré snímky a renderuj všetko znova")
    a = ap.parse_args()

    proj = os.path.abspath(a.projekt)
    scena = os.path.join(proj, "scena.py")
    if not os.path.exists(scena):
        sys.exit(f"Chyba: {scena} neexistuje.")
    blender = najdi_blender()

    if a.nahlad is not None or a.blend:
        rezim = "blend" if a.blend else "nahlad"
        if rezim == "nahlad":
            for f in glob.glob(os.path.join(proj, "nahlad", "t_*.png")):
                os.remove(f)
        t0 = time.time()
        p = blender_proc(blender, scena, proj, rezim, a.nahlad or "")
        out, _ = p.communicate()
        open(os.path.join(proj, f"{rezim}.log"), "w", encoding="utf-8").write(out)
        if p.returncode != 0 or "Traceback" in out:
            sys.exit("Scéna spadla:\n" + chyba_z_logu(out))
        print(f"{rezim} hotový za {time.time() - t0:.0f} s")
        if rezim == "nahlad":
            from nahlad import harok
            subory = sorted(glob.glob(os.path.join(proj, "nahlad", "t_*.png")))
            harok(subory, os.path.join(proj, "nahlad.jpg"), popisky=[os.path.basename(s)[2:-4].lstrip("0") + " s" for s in subory])
            print("→", os.path.join(proj, "nahlad.jpg"))
        return

    if a.odznova and os.path.isdir(os.path.join(proj, "snimky")):
        shutil.rmtree(os.path.join(proj, "snimky"))
    # 1. snímka zároveň povie, koľko ich je spolu (a odhalí chyby v scéne skôr, ako pustíme viac procesov)
    t0 = time.time()
    p = blender_proc(blender, scena, proj, "render", "1-1")
    out, _ = p.communicate()
    open(os.path.join(proj, "render.log"), "w", encoding="utf-8").write(out)
    if p.returncode != 0 or "Traceback" in out:
        sys.exit("Scéna spadla:\n" + chyba_z_logu(out))
    total = json.load(open(os.path.join(proj, "snimky_info.json")))["frames"]
    t1 = time.time() - t0
    for pokus in range(2):
        miss = chybajuce(proj, total)
        if not miss:
            break
        parts = rozsahy(miss, a.procesy if pokus == 0 else 1)
        print(f"Renderujem {len(miss)} snímok v {len(parts)} procesoch (prvá snímka aj so stavbou scény trvala {t1:.0f} s)…", flush=True)
        procs = []
        for i, r in enumerate(parts):
            log = open(os.path.join(proj, f"render_{i}.log"), "w", encoding="utf-8", errors="replace")
            procs.append((blender_proc(blender, scena, proj, "render", r, log), log))
            time.sleep(3)
        last = time.time()
        while any(pp.poll() is None for pp, _ in procs):
            time.sleep(5)
            if time.time() - last > 30:
                hotovo = total - len(chybajuce(proj, total))
                print(f"  {hotovo}/{total} snímok ({hotovo / total * 100:.0f} %)", flush=True)
                last = time.time()
        for pp, log in procs:
            log.close()
    miss = chybajuce(proj, total)
    if miss:
        logs = "".join(open(f, encoding="utf-8", errors="replace").read() for f in glob.glob(os.path.join(proj, "render_*.log")))
        sys.exit(f"Chýba {len(miss)} snímok (napr. {miss[:5]}). Posledná chyba:\n" + chyba_z_logu(logs))
    print(f"Hotovo: {total} snímok za {(time.time() - t0) / 60:.1f} min → {os.path.join(proj, 'snimky')}")


if __name__ == "__main__":
    main()
