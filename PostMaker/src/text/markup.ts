/**
 * Markup handling: `{…}` = highlight, `~` = non-breaking space.
 * Everything here is pure and works on per-character highlight masks so that
 * text edits and highlight toggles never lose track of which words are cyan.
 */

export const NBSP = ' ';

export type Rich = { text: string; hl: boolean[] };
export type Run = { text: string; hl: boolean };

/** Parse markup into plain text (still containing `~`) plus a per-char highlight mask. */
export function parseMarkup(markup: string): Rich {
  let text = '';
  const hl: boolean[] = [];
  let on = false;
  for (const ch of markup) {
    if (ch === '{') {
      on = true;
      continue;
    }
    if (ch === '}') {
      on = false;
      continue;
    }
    // Iterating by code point; store each UTF-16 unit with the same flag.
    for (let i = 0; i < ch.length; i++) hl.push(on);
    text += ch;
  }
  return { text, hl };
}

/** Build markup back from plain text + mask. Braces in the text are dropped (they are reserved). */
export function toMarkup(rich: Rich): string {
  let out = '';
  let on = false;
  for (let i = 0; i < rich.text.length; i++) {
    const ch = rich.text[i];
    if (ch === '{' || ch === '}') continue;
    const h = !!rich.hl[i];
    if (h !== on) {
      out += h ? '{' : '}';
      on = h;
    }
    out += ch;
  }
  if (on) out += '}';
  // Highlights that only wrap whitespace are meaningless.
  return out.replace(/\{(\s*)\}/g, '$1');
}

export function plainOf(markup: string): string {
  return parseMarkup(markup).text;
}

/** Characters whose highlight state is never shown (spaces) – used to keep ranges tidy. */
const isSpace = (c: string) => c === ' ' || c === '\n' || c === NBSP || c === '~';

/**
 * Apply an edit made on the plain text (as typed in a TextInput) to a markup string,
 * keeping highlights attached to the characters they belonged to.
 */
export function applyPlainEdit(markup: string, newPlain: string): string {
  const old = parseMarkup(markup);
  const a = old.text;
  const b = newPlain.replace(/[{}]/g, '');
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  const insertedLen = b.length - p - s;
  if (insertedLen === 0) {
    // Pure deletion: among equivalent alignments pick the left-most one, which keeps
    // whole words together ("one {two} three" minus "two " keeps "three" plain).
    let start = p;
    let end = a.length - s;
    while (start > 0 && a[start - 1] === a[end - 1]) {
      start--;
      end--;
    }
    return toMarkup({ text: b, hl: [...old.hl.slice(0, start), ...old.hl.slice(end)] });
  }
  // Inserted text continues a highlight only when typed strictly inside one.
  const before = p > 0 ? old.hl[p - 1] : false;
  const after = p + (a.length - p - s) < a.length ? old.hl[a.length - s] : false;
  const inherit = before && after;
  const hl = [
    ...old.hl.slice(0, p),
    ...new Array<boolean>(insertedLen).fill(inherit),
    ...old.hl.slice(a.length - s),
  ];
  return toMarkup({ text: b, hl });
}

/** Expand a selection to whole words (so a sloppy finger selection still marks complete words). */
export function expandToWords(text: string, start: number, end: number): [number, number] {
  let a = Math.min(start, end);
  let b = Math.max(start, end);
  const wordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}'’\-]/u.test(c);
  if (a === b) {
    // Caret only: take the word under the caret.
    if (!wordChar(text[a]) && wordChar(text[a - 1])) a--;
    if (!wordChar(text[a])) return [start, end];
    b = a;
  }
  // Only grow edges that cut through a word.
  if (wordChar(text[a])) while (a > 0 && wordChar(text[a - 1])) a--;
  if (wordChar(text[b - 1])) while (b < text.length && wordChar(text[b])) b++;
  // Trim surrounding spaces from the range.
  while (a < b && isSpace(text[a])) a++;
  while (b > a && isSpace(text[b - 1])) b--;
  return [a, b];
}

/** Toggle highlight on [start,end): if the whole range is already cyan it is cleared, else it is set. */
export function toggleHighlight(markup: string, start: number, end: number): string {
  const rich = parseMarkup(markup);
  const [a, b] = expandToWords(rich.text, start, end);
  if (a >= b) return markup;
  let all = true;
  for (let i = a; i < b; i++) if (!isSpace(rich.text[i]) && !rich.hl[i]) all = false;
  const hl = rich.hl.slice();
  for (let i = a; i < b; i++) hl[i] = !all;
  return toMarkup({ text: rich.text, hl });
}

export function highlightedWords(markup: string): string[] {
  const out: string[] = [];
  const re = /\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup))) {
    for (const w of m[1].split(/[\s~]+/)) if (w.trim()) out.push(w);
  }
  return out;
}

/** Split plain text + mask into runs of equal highlight. */
export function runsOf(text: string, hl: boolean[]): Run[] {
  const runs: Run[] = [];
  for (let i = 0; i < text.length; i++) {
    const h = !!hl[i];
    const last = runs[runs.length - 1];
    if (last && last.hl === h) last.text += text[i];
    else runs.push({ text: text[i], hl: h });
  }
  return runs;
}
