"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { saveArticleAction, deleteArticleAction, duplicateArticleAction } from "@/actions/articles";
import type { Article, Category, Media } from "@/lib/articles";
import { slugify } from "@/lib/slug";
import { toLocalInput } from "@/lib/format";
import { uploadFile } from "./MediaUploader";
import { ConfirmButton } from "./ConfirmButton";
import { articleState } from "./StatusBadge";

type Props = { article: Article | null; categories: Category[]; media: Media[]; defaultAuthor: string; justCreated?: boolean };

function countWords(md: string) {
  const t = md.replace(/[#>*_`~\-\[\]()!]/g, " ").trim();
  return t ? t.split(/\s+/).length : 0;
}

export function ArticleEditor({ article, categories, media, defaultAuthor, justCreated }: Props) {
  const [state, action, pending] = useActionState(saveArticleAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [content, setContent] = useState(article?.content ?? "");
  const [cover, setCover] = useState(article?.cover_image ?? "");
  const [tab, setTab] = useState<"write" | "preview" | "split">("write");
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(justCreated ? "Článek vytvořen." : null);
  const [seoOpen, setSeoOpen] = useState(Boolean(article?.seo_title || article?.seo_description));

  const currentState = article ? articleState(article) : "draft";
  const isPublished = article?.status === "published";

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (state?.ok) {
      setDirty(false);
      const d = new Date(state.savedAt ?? Date.now());
      setToast(`Uloženo ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        (formRef.current?.querySelector('button[data-primary="1"]') as HTMLButtonElement | null)?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const html = useMemo(() => (tab === "write" ? "" : (marked.parse(content, { async: false }) as string)), [content, tab]);
  const words = countWords(content);

  function wrap(before: string, after = before, placeholder = "text") {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = content.slice(s, e) || placeholder;
    const next = content.slice(0, s) + before + sel + after + content.slice(e);
    setContent(next); setDirty(true);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); });
  }
  function linePrefix(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", s - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next); setDirty(true);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + prefix.length, s + prefix.length); });
  }
  function insertBlock(text: string) {
    const ta = textareaRef.current;
    const s = ta ? ta.selectionStart : content.length;
    const pre = content.slice(0, s);
    const sep = pre.length && !pre.endsWith("\n\n") ? (pre.endsWith("\n") ? "\n" : "\n\n") : "";
    const next = pre + sep + text + "\n\n" + content.slice(s);
    setContent(next); setDirty(true);
  }

  async function uploadInline(file: File) {
    setUploading(true); setUploadError(null);
    const r = await uploadFile(file);
    setUploading(false);
    if ("error" in r) { setUploadError(r.error); return; }
    insertBlock(`![${file.name.replace(/\.[^.]+$/, "")}](${r.url})\n*Popisek obrázku*`);
  }
  async function uploadCover(file: File) {
    setUploading(true); setUploadError(null);
    const r = await uploadFile(file);
    setUploading(false);
    if ("error" in r) { setUploadError(r.error); return; }
    setCover(r.url); setDirty(true);
  }

  const toolbar: [string, () => void, string][] = [
    ["H2", () => linePrefix("## "), "Mezititulek"],
    ["H3", () => linePrefix("### "), "Menší mezititulek"],
    ["B", () => wrap("**"), "Tučně"],
    ["I", () => wrap("*"), "Kurzíva"],
    ["„ “", () => linePrefix("> "), "Citace"],
    ["• list", () => linePrefix("- "), "Odrážky"],
    ["1. list", () => linePrefix("1. "), "Číslovaný seznam"],
    ["Odkaz", () => wrap("[", "](https://)", "text odkazu"), "Odkaz"],
    ["—", () => insertBlock("---"), "Oddělovač"],
  ];

  return (
    <form ref={formRef} action={action} onChange={() => setDirty(true)} className="space-y-6">
      {article && <input type="hidden" name="id" value={article.id} />}

      {/* Horní lišta */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-paper/95 backdrop-blur border-b border-line flex flex-wrap items-center gap-3">
        <Link href="/admin/clanky" className="text-sm text-muted hover:text-ink">← Články</Link>
        <span className={`badge badge-${currentState}`}>{currentState === "draft" ? "Koncept" : currentState === "scheduled" ? "Naplánováno" : "Publikováno"}</span>
        {dirty && <span className="text-xs text-warn font-medium">Neuložené změny</span>}
        {toast && <span className="text-xs text-ok font-medium fade-in">{toast}</span>}
        {state?.error && <span className="text-xs text-accent font-medium">{state.error}</span>}
        <div className="ml-auto flex items-center gap-2">
          {article && isPublished && <Link href={`/clanek/${article.slug}`} target="_blank" className="btn btn-ghost btn-sm">Zobrazit ↗</Link>}
          {isPublished ? (
            <>
              <button type="submit" name="status" value="draft" className="btn btn-ghost btn-sm" disabled={pending}>Stáhnout do konceptu</button>
              <button type="submit" name="status" value="published" data-primary="1" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Ukládám…" : "Uložit změny"}</button>
            </>
          ) : (
            <>
              <button type="submit" name="status" value="draft" data-primary="1" className="btn btn-ghost btn-sm" disabled={pending}>{pending ? "Ukládám…" : "Uložit koncept"}</button>
              <button type="submit" name="status" value="published" className="btn btn-accent btn-sm" disabled={pending}>Publikovat</button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* Hlavní sloupec */}
        <div className="space-y-5 min-w-0">
          <div>
            <textarea
              name="title" value={title} onChange={(e) => setTitle(e.target.value)} rows={2} required
              placeholder="Titulek článku"
              className="w-full bg-transparent outline-none headline text-3xl sm:text-[2.4rem] placeholder:text-faint resize-none leading-tight"
            />
            <div className="flex items-center gap-2 text-xs text-muted mt-1">
              <span>/clanek/</span>
              <input name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="bg-transparent outline-none border-b border-dashed border-line-strong focus:border-ink flex-1 max-w-md py-0.5" placeholder="url-clanku" />
              {slugTouched && slug !== slugify(title) && <button type="button" className="text-xs underline" onClick={() => { setSlugTouched(false); setSlug(slugify(title)); setDirty(true); }}>obnovit z titulku</button>}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="perex">Perex</label>
            <textarea id="perex" name="perex" defaultValue={article?.perex ?? ""} rows={3} className="field font-serif text-[1.05rem]" placeholder="Jedna až dvě věty, které čtenáře vtáhnou do textu." />
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-line bg-wash/60">
              {toolbar.map(([label, fn, title]) => (
                <button key={label} type="button" className="toolbar-btn" title={title} onClick={fn}>{label}</button>
              ))}
              <label className="toolbar-btn cursor-pointer">
                {uploading ? "Nahrávám…" : "Obrázek"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadInline(f); e.target.value = ""; }} />
              </label>
              <div className="ml-auto flex gap-0.5 bg-surface rounded-md p-0.5 border border-line">
                {(["write", "split", "preview"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)} className={`px-2.5 py-1 rounded text-xs font-semibold ${tab === t ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
                    {t === "write" ? "Psaní" : t === "split" ? "Vedle sebe" : "Náhled"}
                  </button>
                ))}
              </div>
            </div>
            {uploadError && <p className="px-3 py-2 text-xs text-accent bg-accent-soft">{uploadError}</p>}
            <div className={`grid ${tab === "split" ? "md:grid-cols-2 md:divide-x md:divide-line" : ""}`}>
              <textarea
                ref={textareaRef} name="content" value={content} onChange={(e) => setContent(e.target.value)}
                className={`editor-textarea w-full p-4 outline-none bg-surface ${tab === "preview" ? "hidden" : ""}`}
                placeholder={"Pište v Markdownu.\n\n## Mezititulek\n\nOdstavce oddělujte prázdným řádkem. **Tučně**, *kurzíva*, > citace, - odrážky."}
                onDrop={(e) => { const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) { e.preventDefault(); uploadInline(f); } }}
                onPaste={(e) => { const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); uploadInline(f); } }}
              />
              {tab !== "write" && (
                <div className="p-5 overflow-auto max-h-[70vh] bg-paper">
                  {content.trim() ? <div className="prose-article prose-preview" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-sm text-muted">Náhled se zobrazí, jakmile něco napíšete.</p>}
                </div>
              )}
            </div>
            <div className="px-3 py-1.5 border-t border-line text-[0.7rem] text-muted flex justify-between">
              <span>{words} slov · {Math.max(1, Math.round(words / 200))} min čtení</span>
              <span>Ctrl/⌘ + S uloží · obrázek lze vložit přetažením nebo Ctrl+V</span>
            </div>
          </div>

          <div className="card">
            <button type="button" onClick={() => setSeoOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold">
              SEO a sdílení <span className="text-muted text-xs">{seoOpen ? "skrýt" : "zobrazit"}</span>
            </button>
            {seoOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
                <div><label className="label">SEO titulek</label><input name="seo_title" defaultValue={article?.seo_title ?? ""} className="field" placeholder={title || "Výchozí: titulek článku"} maxLength={70} /></div>
                <div><label className="label">Meta popis</label><textarea name="seo_description" defaultValue={article?.seo_description ?? ""} rows={2} className="field" placeholder="Výchozí: perex" maxLength={170} /></div>
              </div>
            )}
            {!seoOpen && (
              <div className="hidden">
                <input name="seo_title" defaultValue={article?.seo_title ?? ""} />
                <textarea name="seo_description" defaultValue={article?.seo_description ?? ""} />
              </div>
            )}
          </div>
        </div>

        {/* Boční panel */}
        <aside className="space-y-4 lg:sticky lg:top-16">
          <section className="card p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Publikace</h2>
            <div>
              <label className="label">Datum a čas publikace</label>
              <input type="datetime-local" name="published_at" defaultValue={toLocalInput(article?.published_at)} className="field" />
              <p className="hint">Prázdné = teď při publikování. Datum v budoucnu = naplánováno.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={Boolean(article?.featured)} className="h-4 w-4 accent-[#d42b1e]" />
              Hlavní článek na úvodní straně
            </label>
            <div>
              <label className="label">Autor</label>
              <input name="author" defaultValue={article?.author || defaultAuthor} className="field" />
            </div>
          </section>

          <section className="card p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Zařazení</h2>
            <div>
              <label className="label">Rubrika</label>
              <select name="category_id" defaultValue={article?.category_id ?? ""} className="field">
                <option value="">— bez rubriky —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Štítky</label>
              <input name="tags" defaultValue={article?.tags.map((t) => t.name).join(", ") ?? ""} className="field" placeholder="Praha, Doprava, Analýza" />
              <p className="hint">Oddělujte čárkou.</p>
            </div>
          </section>

          <section className="card p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Úvodní obrázek</h2>
            {cover ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="w-full aspect-[16/10] object-cover rounded-md bg-wash" />
                <button type="button" onClick={() => { setCover(""); setDirty(true); }} className="absolute top-2 right-2 btn btn-ghost btn-sm">Odebrat</button>
              </div>
            ) : (
              <label className="block border border-dashed border-line-strong rounded-md p-5 text-center text-sm text-muted cursor-pointer hover:border-ink hover:text-ink">
                {uploading ? "Nahrávám…" : "Nahrát obrázek"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
              </label>
            )}
            <input name="cover_image" value={cover} onChange={(e) => setCover(e.target.value)} className="field text-xs" placeholder="nebo vložte URL obrázku" />
            {media.length > 0 && (
              <select className="field text-xs" value="" onChange={(e) => { if (e.target.value) { setCover(e.target.value); setDirty(true); } }}>
                <option value="">Vybrat z knihovny médií…</option>
                {media.map((m) => <option key={m.id} value={`/uploads/${m.filename}`}>{m.original_name}</option>)}
              </select>
            )}
            <input name="cover_caption" defaultValue={article?.cover_caption ?? ""} className="field text-xs" placeholder="Popisek / zdroj fotografie" />
          </section>

          {article && (
            <section className="card p-4 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Další akce</h2>
              <p className="hint">Zobrazení: {article.views} · ID {article.id}</p>
              <div className="flex gap-2">
                <button type="submit" form="duplicate-form" className="btn btn-ghost btn-sm">Duplikovat</button>
                <ConfirmButton formId="delete-form" message={`Opravdu smazat článek „${article.title}“? Tuto akci nelze vrátit.`}>Smazat článek</ConfirmButton>
              </div>
            </section>
          )}
        </aside>
      </div>
    </form>
  );
}

export function ArticleSideForms({ id }: { id: number }) {
  return (
    <>
      <form id="delete-form" action={deleteArticleAction}><input type="hidden" name="id" value={id} /></form>
      <form id="duplicate-form" action={duplicateArticleAction}><input type="hidden" name="id" value={id} /></form>
    </>
  );
}
