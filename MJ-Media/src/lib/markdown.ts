import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Převede Markdown redakčního obsahu na HTML. Obsah píše pouze přihlášený redaktor. */
export function renderMarkdown(md: string): string {
  return marked.parse(md ?? "", { async: false }) as string;
}

export function stripMarkdown(md: string): string {
  return (md ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(md: string): number {
  const t = stripMarkdown(md);
  return t ? t.split(/\s+/).length : 0;
}

export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(wordCount(md) / 200));
}
