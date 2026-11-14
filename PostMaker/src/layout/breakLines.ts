/**
 * Tokenising and line breaking. A "chunk" is an unbreakable unit: a word, or several words
 * glued together with non-breaking spaces. Lines only ever break between chunks – no hyphenation.
 */
import type { FontWeight } from '../brand';
import { NBSP, parseMarkup, runsOf, type Run } from '../text/markup';
import { applyHardSpaces } from '../text/czech';
import type { Measurer } from './measure';

export type Chunk = { runs: Run[]; words: number; width: number };
export type BrokenLine = { chunks: Chunk[]; width: number };
export type BreakResult = {
  lines: BrokenLine[];
  /** Last line holds a single word although the paragraph has more lines. */
  orphan: boolean;
  /** A single chunk is wider than the line. */
  tooWide: boolean;
};

/**
 * Markup → paragraphs (split on manual line breaks) → chunks.
 * An empty paragraph represents a blank line.
 */
export function tokenize(markup: string, opts: { allHighlighted?: boolean } = {}): Chunk[][] {
  const rich = parseMarkup(markup);
  const text = applyHardSpaces(rich.text);
  const hl = opts.allHighlighted ? rich.hl.map(() => true) : rich.hl;
  const paras: Chunk[][] = [];
  let para: Chunk[] = [];
  let cur = '';
  let curHl: boolean[] = [];
  const flush = () => {
    if (cur.length) {
      para.push({
        runs: runsOf(cur, curHl),
        words: cur.split(NBSP).filter((w) => w.length > 0).length,
        width: 0,
      });
    }
    cur = '';
    curHl = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\n') {
      flush();
      paras.push(para);
      para = [];
    } else if (c === ' ' || c === '\t') {
      flush();
    } else {
      cur += c;
      curHl.push(hl[i]);
    }
  }
  flush();
  paras.push(para);
  // Drop leading/trailing blank paragraphs.
  while (paras.length > 1 && paras[0].length === 0) paras.shift();
  while (paras.length > 1 && paras[paras.length - 1].length === 0) paras.pop();
  return paras;
}

export function measureChunk(c: Chunk, m: Measurer, weight: FontWeight, size: number): Chunk {
  let w = 0;
  for (const r of c.runs) w += m.width(r.text.split(NBSP).join(' '), weight, size);
  return { ...c, width: w };
}

/** Join two chunks with a non-breaking space (orphan fix (c)). */
function glue(a: Chunk, b: Chunk, spaceW: number): Chunk {
  const runs = a.runs.map((r) => ({ ...r }));
  const last = runs[runs.length - 1];
  last.text += NBSP;
  for (const r of b.runs) {
    const tail = runs[runs.length - 1];
    if (tail.hl === r.hl) tail.text += r.text;
    else runs.push({ ...r });
  }
  return { runs, words: a.words + b.words, width: a.width + spaceW + b.width };
}

const lineWidth = (chunks: Chunk[], spaceW: number) =>
  chunks.reduce((s, c) => s + c.width, 0) + Math.max(0, chunks.length - 1) * spaceW;

export function greedy(chunks: Chunk[], spaceW: number, maxW: number): BrokenLine[] {
  const lines: BrokenLine[] = [];
  let cur: Chunk[] = [];
  let w = 0;
  for (const c of chunks) {
    const next = cur.length ? w + spaceW + c.width : c.width;
    if (cur.length && next > maxW + 0.01) {
      lines.push({ chunks: cur, width: w });
      cur = [c];
      w = c.width;
    } else {
      cur.push(c);
      w = next;
    }
  }
  if (cur.length) lines.push({ chunks: cur, width: w });
  return lines;
}

/**
 * Minimum-raggedness breaking into exactly `k` lines (dynamic programming).
 * When `includeLast` is false the last line's slack is free (body text);
 * when true every line counts (titles look balanced).
 */
export function balanced(
  chunks: Chunk[],
  spaceW: number,
  maxW: number,
  k: number,
  opts: { includeLast: boolean; lastMinWords: number },
): BrokenLine[] | null {
  const n = chunks.length;
  if (k < 1 || n < k) return null;
  const pre = [0];
  for (const c of chunks) pre.push(pre[pre.length - 1] + c.width);
  const width = (i: number, j: number) => pre[j] - pre[i] + (j - i - 1) * spaceW;
  const wordsIn = (i: number, j: number) => {
    let s = 0;
    for (let t = i; t < j; t++) s += chunks[t].words;
    return s;
  };
  const INF = Number.POSITIVE_INFINITY;
  // dp[l][j]: best cost to set chunks[0..j) on l lines.
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(INF));
  const from: number[][] = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(-1));
  dp[0][0] = 0;
  for (let l = 1; l <= k; l++) {
    for (let j = l; j <= n; j++) {
      const last = l === k && j === n;
      for (let i = l - 1; i < j; i++) {
        if (dp[l - 1][i] === INF) continue;
        const w = width(i, j);
        if (w > maxW + 0.01) continue;
        if (last && wordsIn(i, j) < opts.lastMinWords) continue;
        const slack = maxW - w;
        const cost = last && !opts.includeLast ? 0 : slack * slack;
        const total = dp[l - 1][i] + cost;
        if (total < dp[l][j]) {
          dp[l][j] = total;
          from[l][j] = i;
        }
      }
    }
  }
  if (dp[k][n] === INF) return null;
  const lines: BrokenLine[] = [];
  let j = n;
  for (let l = k; l >= 1; l--) {
    const i = from[l][j];
    const cs = chunks.slice(i, j);
    lines.unshift({ chunks: cs, width: lineWidth(cs, spaceW) });
    j = i;
  }
  return lines;
}

const isOrphan = (lines: BrokenLine[]) =>
  lines.length > 1 && lines[lines.length - 1].chunks.reduce((s, c) => s + c.words, 0) < 2;

/**
 * Break one paragraph. Orphans are fixed by (b) re-balancing with the same number of lines,
 * then (c) gluing the last two words with a non-breaking space.
 * Shrinking the font (a) is the auto-fit's job – it prefers sizes without orphans.
 */
export function breakParagraph(
  chunks: Chunk[],
  spaceW: number,
  maxW: number,
  opts: { balance?: boolean; fixOrphans?: boolean } = {},
): BreakResult {
  const tooWide = chunks.some((c) => c.width > maxW + 0.01);
  if (chunks.length === 0) return { lines: [], orphan: false, tooWide: false };
  let lines = greedy(chunks, spaceW, maxW);
  const fix = opts.fixOrphans !== false;
  if (opts.balance && !tooWide && lines.length > 1) {
    const b = balanced(chunks, spaceW, maxW, lines.length, {
      includeLast: true,
      lastMinWords: fix ? 2 : 1,
    });
    if (b) lines = b;
  }
  if (fix && isOrphan(lines) && !tooWide) {
    const b = balanced(chunks, spaceW, maxW, lines.length, { includeLast: false, lastMinWords: 2 });
    if (b) lines = b;
    else if (chunks.length >= 2) {
      const glued = [...chunks.slice(0, -2), glue(chunks[chunks.length - 2], chunks[chunks.length - 1], spaceW)];
      if (glued[glued.length - 1].width <= maxW) lines = greedy(glued, spaceW, maxW);
    }
  }
  return { lines, orphan: isOrphan(lines), tooWide };
}

export function lineText(line: BrokenLine): string {
  return line.chunks.map((c) => c.runs.map((r) => r.text).join('')).join(' ');
}
