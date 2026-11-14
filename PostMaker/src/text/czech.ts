/**
 * Czech typography helpers. All transforms that feed the layout keep the string length
 * unchanged (space → NBSP), so highlight masks stay aligned.
 */
import { NBSP } from './markup';

const SINGLE_LETTER = 'kKsSvVzZoOuUaAiI';

/**
 * Replace `~` and the spaces Czech typography forbids breaking at with NBSP.
 * Same length in, same length out.
 */
export function applyHardSpaces(text: string): string {
  const chars = text.split('');
  const setNb = (i: number) => {
    if (chars[i] === ' ') chars[i] = NBSP;
  };
  for (let i = 0; i < chars.length; i++) if (chars[i] === '~') chars[i] = NBSP;

  const s = chars.join('');
  const isBoundary = (c: string | undefined) => c === undefined || /[\s („‚"'«\-–—/]/.test(c);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    // Single-letter prepositions / conjunctions: "v Praze", "a tak".
    if (SINGLE_LETTER.includes(c) && isBoundary(s[i - 1]) && s[i + 1] === ' ') setNb(i + 1);
  }
  // Each rule matches exactly one space (via look-arounds).
  const rules: RegExp[] = [
    /(?<=\d) (?=\d{3}(?!\d))/g, // 70 000
    /(?<=\d) (?=%|‰|°|Kč|€|\$)/g, // 50 %, 20 Kč
    /(?<=\d\.) (?=\d)/g, // 22. 7. / 12. 11. 2026
    /(?<=\d) (?=\p{L})/gu, // 9,8 milionu, 5 let
    /(?<=\S) (?=[–—] )/g, // never start a line with a dash
    /(?<=(?:^|[\s\u00A0])(?:č|s|str|tzv|tj|např|mj|resp|cca|p|pí|MUDr|JUDr|Mgr|Ing|Bc|PhDr|doc|prof)\.) /g,
  ];
  for (const re of rules) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) setNb(m.index);
  }
  return chars.join('');
}

/** Typography clean-up offered after pasting text. Not length-preserving; used on plain text. */
export function fixTypography(input: string): string {
  let t = input;
  t = t.replace(/\r\n?/g, '\n');
  t = t.replace(/\.{3}/g, '…');
  // Straight double quotes → „ “ (opening after start / whitespace / bracket).
  t = t.replace(/(^|[\s(\[{~ ])"/g, '$1„').replace(/"/g, '“');
  // English curly quotes → Czech.
  t = t.replace(/(^|[\s(\[{~ ])“/g, '$1„').replace(/”/g, '“');
  // Straight single quotes used as quotation (not apostrophes inside words).
  t = t.replace(/(^|[\s(\[{~ ])'/g, '$1‚').replace(/(\p{L}|[.,!?…])'(?=[\s.,!?…]|$)/gu, '$1‘');
  // Hyphen used as a dash.
  t = t.replace(/ +[-–—] +/g, ' – ');
  // Space before punctuation, doubled spaces, trailing spaces.
  t = t.replace(/ +([,.!?:;])/g, '$1');
  t = t.replace(/[ \t]{2,}/g, ' ');
  t = t.replace(/ +\n/g, '\n').replace(/\n +/g, '\n');
  return t.trim();
}

export function needsTypographyFix(input: string): boolean {
  return fixTypography(input) !== input.trim();
}

/** Stems of vulgar words and their masked form. Suggestions only – never applied automatically. */
const PROFANITY: [RegExp, (m: string) => string][] = [
  [/zmrd/giu, (m) => mask(m, 2)],
  [/prdel/giu, (m) => m.slice(0, 2) + '*' + m.slice(2)],
  [/sra[čc]/giu, (m) => mask(m, 2)],
  [/kurv/giu, (m) => mask(m, 1)],
  [/píč/giu, (m) => mask(m, 1)],
  [/čurák/giu, (m) => mask(m, 1)],
  [/kokot/giu, (m) => mask(m, 1)],
  [/hovn/giu, (m) => mask(m, 1)],
  [/(?<![z\p{L}])mrd/giu, (m) => mask(m, 2)],
  [/(?<!\p{L})(?:vy|na|z|ro|po|ne)?jeb/giu, (m) => mask(m, m.length - 2)],
  [/debil/giu, (m) => mask(m, 1)],
];

function mask(word: string, at: number): string {
  return word.slice(0, at) + '*' + word.slice(at + 1);
}

export type Suggestion = { from: string; to: string; index: number };

export function profanitySuggestions(text: string): Suggestion[] {
  const out: Suggestion[] = [];
  for (const [re, fn] of PROFANITY) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      // Expand to the whole word for display.
      const start = wordStart(text, m.index);
      const end = wordEnd(text, m.index + m[0].length);
      const word = text.slice(start, end);
      const masked = word.slice(0, m.index - start) + fn(m[0]) + word.slice(m.index - start + m[0].length);
      if (!word.includes('*')) out.push({ from: word, to: masked, index: start });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

export function applySuggestion(text: string, s: Suggestion): string {
  if (text.slice(s.index, s.index + s.from.length) !== s.from) return text.replace(s.from, s.to);
  return text.slice(0, s.index) + s.to + text.slice(s.index + s.from.length);
}

const L = /[\p{L}\p{N}*]/u;
function wordStart(t: string, i: number) {
  while (i > 0 && L.test(t[i - 1])) i--;
  return i;
}
function wordEnd(t: string, i: number) {
  while (i < t.length && L.test(t[i])) i++;
  return i;
}

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Risky-word lookup: keys are lowercase stems (diacritics-insensitive prefix match on words). */
export function riskyWordHits(text: string, list: Record<string, string>): Suggestion[] {
  const out: Suggestion[] = [];
  const re = /[\p{L}]+/gu;
  let m: RegExpExecArray | null;
  const stems = Object.keys(list).map((k) => [stripDiacritics(k.toLowerCase()), k] as const);
  while ((m = re.exec(text))) {
    const w = stripDiacritics(m[0].toLowerCase());
    for (const [stem, key] of stems) {
      if (stem && w.startsWith(stem)) {
        out.push({ from: m[0], to: list[key], index: m.index });
        break;
      }
    }
  }
  return out;
}

/** `#Školní Obědy` → `#skolniobedy`. */
export function normalizeHashtag(tag: string): string {
  const body = stripDiacritics(tag.replace(/^#+/, ''))
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  return body ? '#' + body : '';
}

export function countSentences(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  const parts = t
    .split(/(?<!(?:^|[\s(])(?:mil|mld|tis|tzv|např|resp|atd|apod|mj|cca|č|s|p|pí|Ing|Mgr|Dr|MUDr|JUDr|Bc|doc|prof)\.)(?<=[.!?…])["“”»)]*\s+(?=[\p{Lu}„"0-9])/u).filter((p) => p.trim().length > 0);
  return parts.length;
}
