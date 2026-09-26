"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export async function uploadFile(file: File): Promise<{ url: string } | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error ?? "Nahrání se nezdařilo." };
  return { url: data.url };
}

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true); setMsg(null);
    let ok = 0; const errors: string[] = [];
    for (const f of Array.from(files)) {
      const r = await uploadFile(f);
      if ("error" in r) errors.push(`${f.name}: ${r.error}`); else ok++;
    }
    setBusy(false);
    setMsg(`${ok} nahráno${errors.length ? ` · ${errors.join("; ")}` : ""}`);
    router.refresh();
  }

  return (
    <div
      className={`card border-dashed p-6 text-center transition-colors ${drag ? "border-ink bg-wash" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handle(e.target.files)} />
      <p className="text-sm text-ink-2">Přetáhněte obrázky sem, nebo</p>
      <button type="button" className="btn btn-primary mt-3" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Nahrávám…" : "Vybrat soubory"}</button>
      {msg && <p className="hint mt-3">{msg}</p>}
    </div>
  );
}
