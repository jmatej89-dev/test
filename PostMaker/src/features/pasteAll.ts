/**
 * "Vložit celý příspěvek": one pasted text → slides.
 * Blocks are separated by a line with `---` (or, when no `---` is present, by blank lines).
 * First block = cover, the rest = text slides; a block starting with a quotation mark becomes a quote.
 */
import { newId } from '../model/factory';
import type { Slide } from '../model/types';
import { fixTypography } from '../text/czech';

export function splitBlocks(input: string): string[] {
  const t = input.replace(/\r\n?/g, '\n').trim();
  if (!t) return [];
  const parts = /^\s*-{3,}\s*$/m.test(t) ? t.split(/^\s*-{3,}\s*$/m) : t.split(/\n\s*\n/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Leading short sentence ("Co se stalo.") → label, if it has fewer than 4 words. */
export function extractLabel(block: string): { label: string; body: string } {
  const m = /^([^.!?:\n]{1,60}[.:])(?:\s+|$)/.exec(block);
  if (m) {
    const words = m[1].trim().split(/\s+/).length;
    if (words < 4 && block.length > m[0].length) return { label: m[1].trim(), body: block.slice(m[0].length).trim() };
  }
  return { label: '', body: block };
}

function coverFrom(block: string): Slide {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  let white = lines[0] ?? '';
  let cyan = lines.slice(1).join(' ');
  const brace = /\{([^}]*)\}?/.exec(white);
  if (!cyan && brace) {
    cyan = white.slice(brace.index).replace(/[{}]/g, '').trim();
    white = white.slice(0, brace.index).trim();
  }
  return { id: newId(), type: 'cover', photo: null, titleWhite: white.replace(/[{}]/g, ''), titleCyan: cyan.replace(/[{}]/g, '') };
}

function quoteFrom(block: string): Slide {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const textLines: string[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    textLines.push(lines[i]);
    if (/[“"”]\s*$/.test(lines[i])) {
      i++;
      break;
    }
  }
  const text = textLines.join(' ').replace(/^[„"“]/, '').replace(/[“"”]$/, '');
  return {
    id: newId(),
    type: 'quote',
    photo: null,
    quotes: [{ text, name: (lines[i] ?? '').replace(/^[–—-]\s*/, ''), role: lines.slice(i + 1).join(', ') }],
  };
}

export function parsePost(input: string, opts: { fixTypo?: boolean } = {}): Slide[] {
  const blocks = splitBlocks(opts.fixTypo === false ? input : fixTypography(input));
  return blocks.map((b, i) => {
    if (i === 0) return coverFrom(b);
    if (/^[„"“]/.test(b)) return quoteFrom(b);
    const { label, body } = extractLabel(b);
    return { id: newId(), type: 'text', photo: null, label, body: body.replace(/\n+/g, ' ') };
  });
}
