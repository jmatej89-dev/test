/**
 * Pure slide layout: slide + measurer → everything the renderer needs (positions, sizes, colours)
 * plus layout issues for the checker. No Skia, no React.
 */
import {
  ACCENT_BAR_W,
  BASELINE_K,
  CAP_K,
  COVER,
  DESCENT_K,
  H,
  LEFT_X,
  MAXW,
  MIN_READABLE_FS,
  QUOTE,
  TEXT,
  TEXT_BOTTOM_LIMIT,
  TW,
  TX,
  W,
  WATERMARK,
  type BrandColor,
  type FontWeight,
} from '../brand';
import type { CoverSlide, PhotoRef, QuoteItem, QuoteSlide, Slide, TextSlide } from '../model/types';
import { NBSP } from '../text/markup';
import { breakParagraph, measureChunk, tokenize, type BrokenLine, type Chunk } from './breakLines';
import type { Measurer } from './measure';

export type TextRun = { text: string; color: BrandColor; weight: FontWeight };
export type TextLine = { x: number; baseline: number; size: number; runs: TextRun[] };
export type Rect = { x: number; y: number; w: number; h: number; color: BrandColor };

export type IssueCode = 'overflow' | 'orphan' | 'tooSmall' | 'tooWide' | 'empty' | 'sourceOnSlide';
export type LayoutIssue = { code: IssueCode; message: string };

export type SlideLayout = {
  type: Slide['type'];
  header: { h: number; fadeFrom: number; fadeTo: number };
  rects: Rect[];
  lines: TextLine[];
  arrows: TextLine | null;
  watermark: TextLine;
  /** Main font size used. */
  fs: number;
  auto: boolean;
  textTop: number;
  textBottom: number;
  issues: LayoutIssue[];
};

/** Ascent of Montserrat (fraction of size) – for elements placed by their top edge. */
const ASCENT_K = 0.968;

type Block = {
  lines: TextLine[];
  /** Visible bottom (last baseline + descent). */
  bottom: number;
  lastBaseline: number;
  firstBaseline: number;
  orphan: boolean;
  tooWide: boolean;
};

type BlockStyle = {
  weight: FontWeight;
  size: number;
  lead: number;
  x: number;
  maxW: number;
  color: (hl: boolean) => BrandColor;
  balance?: boolean;
};

function lineToRuns(line: BrokenLine, style: BlockStyle): TextRun[] {
  const runs: TextRun[] = [];
  line.chunks.forEach((c, ci) => {
    c.runs.forEach((r, ri) => {
      let text = r.text.split(NBSP).join(' ');
      if (ci < line.chunks.length - 1 && ri === c.runs.length - 1) text += ' ';
      const color = style.color(r.hl);
      const last = runs[runs.length - 1];
      if (last && last.color === color) last.text += text;
      else runs.push({ text, color, weight: style.weight });
    });
  });
  return runs;
}

/** Lay out paragraphs top-down starting with the first line's box at `top`. */
function layoutBlock(paras: Chunk[][], m: Measurer, style: BlockStyle, top: number): Block {
  const spaceW = m.width(' ', style.weight, style.size);
  const lines: TextLine[] = [];
  let y = top;
  let orphan = false;
  let tooWide = false;
  let lastBaseline = top;
  let firstBaseline = top + BASELINE_K * style.size;
  paras.forEach((para) => {
    if (para.length === 0) {
      y += style.lead * 0.5;
      return;
    }
    const measured = para.map((c) => measureChunk(c, m, style.weight, style.size));
    const r = breakParagraph(measured, spaceW, style.maxW, { balance: style.balance });
    orphan ||= r.orphan;
    tooWide ||= r.tooWide;
    for (const l of r.lines) {
      const baseline = y + BASELINE_K * style.size;
      if (lines.length === 0) firstBaseline = baseline;
      lines.push({ x: style.x, baseline, size: style.size, runs: lineToRuns(l, style) });
      lastBaseline = baseline;
      y += style.lead;
    }
  });
  const bottom = lines.length ? lastBaseline + DESCENT_K * style.size : top;
  return { lines, bottom, lastBaseline, firstBaseline, orphan, tooWide };
}

function fadeRange(h: number, from: number, to: number, photo: PhotoRef | null) {
  const strength = photo?.fade ?? 1;
  const minLen = 0.08;
  const len = Math.max(minLen, (to - from) * Math.min(1.5, Math.max(0, strength)));
  return { fadeFrom: h * Math.max(0.05, to - len), fadeTo: h * to };
}

function watermarkLine(text: string, m: Measurer): TextLine {
  const t = text.trim() || WATERMARK.defaultText;
  const w = m.width(t, WATERMARK.weight, WATERMARK.size);
  return {
    x: W - WATERMARK.right - w,
    baseline: WATERMARK.baseline,
    size: WATERMARK.size,
    runs: [{ text: t, color: 'white45', weight: WATERMARK.weight }],
  };
}

function sizes(max: number, min: number, step: number): number[] {
  const out: number[] = [];
  for (let s = max; s >= min; s -= step) out.push(s);
  return out;
}

const cyanIf = (hl: boolean): BrandColor => (hl ? 'cyan' : 'white');

function commonIssues(fs: number, bottom: number, orphan: boolean, tooWide: boolean, text: string): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  if (bottom > TEXT_BOTTOM_LIMIT + 0.5)
    issues.push({ code: 'overflow', message: 'Text je moc dlouhý – zasahuje pod spodní okraj.' });
  if (orphan) issues.push({ code: 'orphan', message: 'Poslední řádek má jediné slovo (sirotek).' });
  if (tooWide) issues.push({ code: 'tooWide', message: 'Některé slovo je širší než řádek.' });
  if (fs < MIN_READABLE_FS) issues.push({ code: 'tooSmall', message: `Písmo je příliš malé (${fs} px).` });
  if (/(^|[^\p{L}])zdroj(e|em)?\s*:/iu.test(text))
    issues.push({ code: 'sourceOnSlide', message: 'Na slajdu je „Zdroj“ – patří jen do popisku.' });
  return issues;
}

// ───────────────────────────── Cover ─────────────────────────────

export function layoutCover(slide: CoverSlide, m: Measurer, watermark: string): SlideLayout {
  const header = { h: COVER.photoH, ...fadeRange(COVER.photoH, COVER.fadeFrom, COVER.fadeTo, slide.photo) };
  const eyebrowY = COVER.photoH - COVER.eyebrowAboveEnd;
  const top = eyebrowY + COVER.eyebrowH + COVER.eyebrowGap;
  const white = tokenize(slide.titleWhite);
  const cyan = tokenize(slide.titleCyan, { allHighlighted: true });
  const paras = [...white.filter((p) => p.length), ...cyan.filter((p) => p.length)];

  const run = (fs: number) =>
    layoutBlock(
      paras,
      m,
      { weight: 700, size: fs, lead: Math.round(fs * COVER.lineHeightK), x: LEFT_X, maxW: MAXW, color: cyanIf, balance: true },
      top,
    );

  let fs: number = COVER.fsMin;
  let block: Block;
  const auto = slide.fsOverride === undefined;
  if (!auto) {
    fs = slide.fsOverride!;
    block = run(fs);
  } else {
    const candidates = sizes(COVER.fsMax, COVER.fsMin, COVER.fsStep);
    const fits = (b: Block) => b.bottom <= TEXT_BOTTOM_LIMIT && !b.tooWide;
    let chosen: { fs: number; b: Block } | null = null;
    let fallback: { fs: number; b: Block } | null = null;
    for (const s of candidates) {
      const b = run(s);
      if (fits(b) && !b.orphan) {
        chosen = { fs: s, b };
        break;
      }
      if (fits(b) && !fallback) fallback = { fs: s, b };
    }
    const pick = chosen ?? fallback ?? { fs: COVER.fsMin, b: run(COVER.fsMin) };
    fs = pick.fs;
    block = pick.b;
  }

  const issues = commonIssues(fs, block.bottom, block.orphan, block.tooWide, slide.titleWhite + ' ' + slide.titleCyan);
  if (!paras.length) issues.push({ code: 'empty', message: 'Titulek je prázdný.' });
  // Title is allowed down to 56 px – only flag sizes below that.
  const filtered = issues.filter((i) => i.code !== 'tooSmall' || fs < COVER.fsMin);

  return {
    type: 'cover',
    header,
    rects: [{ x: LEFT_X, y: eyebrowY, w: COVER.eyebrowW, h: COVER.eyebrowH, color: 'cyan' }],
    lines: block.lines,
    arrows: {
      x: COVER.arrowsX,
      baseline: COVER.arrowsTop + ASCENT_K * COVER.arrowsSize,
      size: COVER.arrowsSize,
      runs: [{ text: COVER.arrows, color: 'white', weight: 700 }],
    },
    watermark: watermarkLine(watermark, m),
    fs,
    auto,
    textTop: top,
    textBottom: block.bottom,
    issues: filtered,
  };
}

// ───────────────────────────── Text ─────────────────────────────

function accentBar(firstBaseline: number, lastBaseline: number, fsFirst: number, fsLast: number): Rect {
  const y = firstBaseline - CAP_K * fsFirst;
  const bottom = lastBaseline + 0.12 * fsLast;
  return { x: LEFT_X, y, w: ACCENT_BAR_W, h: Math.max(0, bottom - y), color: 'cyan' };
}

export function textParas(slide: TextSlide): Chunk[][] {
  const body = tokenize(slide.body);
  const label = slide.label?.trim() ? tokenize(slide.label.trim(), { allHighlighted: true }).flat() : [];
  if (!label.length) return body;
  const [first = [], ...rest] = body;
  return [[...label, ...first], ...rest];
}

export function layoutText(slide: TextSlide, m: Measurer, watermark: string): SlideLayout {
  const mh = slide.headerH ?? TEXT.headerDefault;
  const header = { h: mh, ...fadeRange(mh, TEXT.fadeFrom, TEXT.fadeTo, slide.photo) };
  const top = mh + TEXT.topGap;
  const paras = textParas(slide);
  const run = (fs: number) =>
    layoutBlock(paras, m, { weight: 700, size: fs, lead: fs + TEXT.leadExtra, x: TX, maxW: TW, color: cyanIf }, top);

  const auto = slide.fsOverride === undefined;
  let fs: number;
  let block: Block;
  if (!auto) {
    fs = slide.fsOverride!;
    block = run(fs);
  } else {
    let chosen: { fs: number; b: Block } | null = null;
    let fallback: { fs: number; b: Block } | null = null;
    for (const s of sizes(TEXT.fsMax, TEXT.fsMin, TEXT.fsStep)) {
      const b = run(s);
      const fits = b.bottom <= TEXT_BOTTOM_LIMIT && !b.tooWide;
      if (fits && !b.orphan) {
        chosen = { fs: s, b };
        break;
      }
      if (fits && !fallback) fallback = { fs: s, b };
    }
    const pick = chosen ?? fallback ?? { fs: TEXT.fsMin, b: run(TEXT.fsMin) };
    fs = pick.fs;
    block = pick.b;
  }

  const issues = commonIssues(fs, block.bottom, block.orphan, block.tooWide, `${slide.label ?? ''} ${slide.body}`);
  if (!block.lines.length) issues.push({ code: 'empty', message: 'Slajd nemá žádný text.' });
  return {
    type: 'text',
    header,
    rects: block.lines.length ? [accentBar(block.firstBaseline, block.lastBaseline, fs, fs)] : [],
    lines: block.lines,
    arrows: null,
    watermark: watermarkLine(watermark, m),
    fs,
    auto,
    textTop: top,
    textBottom: block.bottom,
    issues,
  };
}

// ───────────────────────────── Quote ─────────────────────────────

/** Wrap quote text in Czech quotation marks unless it already has them. */
export function quoteMarkup(text: string): string {
  let t = text.trim();
  if (!t) return t;
  const plainStart = t.replace(/^\{/, '');
  if (!/^[„"“‚]/.test(plainStart)) t = '„' + t;
  const plainEnd = t.replace(/\}$/, '');
  if (!/[“"”‘]$/.test(plainEnd)) t = t + '“';
  return t;
}

export function quoteSizes(fs: number) {
  const nameFs = Math.max(QUOTE.nameMin, Math.round(fs * QUOTE.nameK));
  const roleFs = Math.max(QUOTE.roleMin, nameFs - QUOTE.roleStep);
  return { nameFs, roleFs };
}

type QuoteBlock = { lines: TextLine[]; rects: Rect[]; bottom: number; orphan: boolean; tooWide: boolean };

function layoutQuotes(quotes: QuoteItem[], m: Measurer, fs: number, top: number): QuoteBlock {
  const { nameFs, roleFs } = quoteSizes(fs);
  const lines: TextLine[] = [];
  const rects: Rect[] = [];
  let y = top;
  let orphan = false;
  let tooWide = false;
  let bottom = top;
  quotes.forEach((q, qi) => {
    if (qi > 0) y = bottom + QUOTE.betweenQuotesK * fs;
    const text = layoutBlock(
      tokenize(quoteMarkup(q.text)),
      m,
      { weight: 700, size: fs, lead: fs + QUOTE.leadExtra, x: TX, maxW: TW, color: cyanIf },
      y,
    );
    orphan ||= text.orphan;
    tooWide ||= text.tooWide;
    lines.push(...text.lines);
    let cursor = text.lines.length ? text.bottom : y;
    let lastBaseline = text.lastBaseline;
    let lastFs = fs;
    if (q.name.trim()) {
      const name = layoutBlock(
        tokenize(q.name.trim()),
        m,
        { weight: 600, size: nameFs, lead: Math.round(nameFs * 1.25), x: TX, maxW: TW, color: () => 'cyan' },
        cursor + QUOTE.nameGapK * fs,
      );
      lines.push(...name.lines);
      cursor = name.bottom;
      lastBaseline = name.lastBaseline;
      lastFs = nameFs;
    }
    if (q.role.trim()) {
      const role = layoutBlock(
        tokenize(q.role.trim()),
        m,
        { weight: 400, size: roleFs, lead: Math.round(roleFs * 1.3), x: TX, maxW: TW, color: () => 'white60' },
        cursor + QUOTE.roleGapK * fs,
      );
      lines.push(...role.lines);
      cursor = role.bottom;
      lastBaseline = role.lastBaseline;
      lastFs = roleFs;
    }
    if (text.lines.length) rects.push(accentBar(text.firstBaseline, lastBaseline, fs, lastFs));
    bottom = cursor;
  });
  return { lines, rects, bottom, orphan, tooWide };
}

export function layoutQuote(slide: QuoteSlide, m: Measurer, watermark: string): SlideLayout {
  const quotes = slide.quotes.slice(0, 2).filter((q, i) => i === 0 || q.text.trim() || q.name.trim());
  const headers = slide.headerH ? [slide.headerH] : [...QUOTE.headerTries];
  const auto = slide.fsOverride === undefined;
  const run = (mh: number, fs: number) => layoutQuotes(quotes, m, fs, mh + TEXT.topGap);

  let pick: { mh: number; fs: number; b: QuoteBlock } | null = null;
  if (!auto) {
    const mh = headers[0];
    pick = { mh, fs: slide.fsOverride!, b: run(mh, slide.fsOverride!) };
  } else {
    let best: { mh: number; fs: number; b: QuoteBlock } | null = null;
    for (const mh of headers) {
      let found: { mh: number; fs: number; b: QuoteBlock } | null = null;
      let fallback: { mh: number; fs: number; b: QuoteBlock } | null = null;
      for (const s of sizes(QUOTE.fsMax, QUOTE.fsMin, QUOTE.fsStep)) {
        const b = run(mh, s);
        const fits = b.bottom <= TEXT_BOTTOM_LIMIT && !b.tooWide;
        if (fits && !b.orphan) {
          found = { mh, fs: s, b };
          break;
        }
        if (fits && !fallback) fallback = { mh, fs: s, b };
      }
      const cand = found ?? fallback;
      if (cand && (!best || cand.fs > best.fs)) best = cand;
      if (found && found.fs >= QUOTE.comfortableFs) {
        best = found;
        break;
      }
    }
    const lastMh = headers[headers.length - 1];
    pick = best ?? { mh: lastMh, fs: QUOTE.fsMin, b: run(lastMh, QUOTE.fsMin) };
  }

  const header = { h: pick.mh, ...fadeRange(pick.mh, TEXT.fadeFrom, TEXT.fadeTo, slide.photo) };
  const allText = quotes.map((q) => `${q.text} ${q.name} ${q.role}`).join(' ');
  const issues = commonIssues(pick.fs, pick.b.bottom, pick.b.orphan, pick.b.tooWide, allText);
  if (!quotes.some((q) => q.text.trim())) issues.push({ code: 'empty', message: 'Citace je prázdná.' });
  return {
    type: 'quote',
    header,
    rects: pick.b.rects,
    lines: pick.b.lines,
    arrows: null,
    watermark: watermarkLine(watermark, m),
    fs: pick.fs,
    auto,
    textTop: pick.mh + TEXT.topGap,
    textBottom: pick.b.bottom,
    issues,
  };
}

export function layoutSlide(slide: Slide, m: Measurer, watermark: string): SlideLayout {
  switch (slide.type) {
    case 'cover':
      return layoutCover(slide, m, watermark);
    case 'text':
      return layoutText(slide, m, watermark);
    case 'quote':
      return layoutQuote(slide, m, watermark);
  }
}

/** Plain-language description for VoiceOver. */
export function slideAccessibilityText(slide: Slide): string {
  const clean = (s: string) => s.replace(/[{}]/g, '').replace(/~/g, ' ');
  switch (slide.type) {
    case 'cover':
      return `Titulní slajd: ${clean(slide.titleWhite)} ${clean(slide.titleCyan)}`;
    case 'text':
      return `Textový slajd: ${clean(slide.label ?? '')} ${clean(slide.body)}`;
    case 'quote':
      return `Citace: ${slide.quotes.map((q) => `${clean(q.text)}, ${q.name}, ${q.role}`).join('. ')}`;
  }
}

export const LAYOUT_HEIGHT = H;
