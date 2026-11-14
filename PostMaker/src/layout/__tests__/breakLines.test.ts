import { approxMeasurer } from '../measure';
import { breakParagraph, lineText, measureChunk, tokenize } from '../breakLines';

const m = approxMeasurer;
const prep = (markup: string, size = 40) =>
  tokenize(markup).map((p) => p.map((c) => measureChunk(c, m, 700, size)));
const space = m.width(' ', 700, 40);

describe('tokenize', () => {
  test('manual line breaks and blank lines', () => {
    const p = tokenize('a b\n\nc');
    expect(p.length).toBe(3);
    expect(p[1].length).toBe(0);
  });
  test('hard spaces glue words into one chunk', () => {
    const [p] = tokenize('jdu v Praze 70 000 lidí');
    expect(p.map((c) => c.runs.map((r) => r.text).join(''))).toEqual(['jdu', 'v Praze', '70 000 lidí']);
    expect(p[1].words).toBe(2);
  });
  test('highlight spanning several words keeps per-run flags', () => {
    const [p] = tokenize('x {ab cd} y');
    expect(p.map((c) => c.runs[0].hl)).toEqual([false, true, true, false]);
  });
});

describe('breakParagraph', () => {
  test('never breaks inside a chunk and respects width', () => {
    const [p] = prep('Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor');
    const r = breakParagraph(p, space, 400);
    for (const l of r.lines) expect(l.width).toBeLessThanOrEqual(400.01);
  });

  test('fixes an orphan on the last line', () => {
    // Build a case where greedy leaves a single word on the last line.
    const words = 'aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii';
    const [p] = prep(words);
    const w = p[0].width;
    const maxW = 4 * w + 3 * space + 1; // four words per line → 4/4/1 greedy
    const greedyLines = breakParagraph(p, space, maxW, { fixOrphans: false });
    expect(greedyLines.orphan).toBe(true);
    const fixed = breakParagraph(p, space, maxW);
    expect(fixed.orphan).toBe(false);
    const last = fixed.lines[fixed.lines.length - 1];
    expect(last.chunks.length).toBeGreaterThanOrEqual(2);
  });

  test('orphan fix (c): glue when re-balancing cannot help', () => {
    const [p] = prep('aaaaaaaaaa bbbbbbbbbb c');
    const maxW = p[0].width + space + p[1].width + 1;
    const r = breakParagraph(p, space, maxW);
    expect(r.orphan).toBe(false);
    expect(lineText(r.lines[r.lines.length - 1])).toContain('c');
  });

  test('balanced mode evens out a title', () => {
    const [p] = prep('Vláda ruší závazná pravidla pro školní obědy');
    const greedy = breakParagraph(p, space, 600, { fixOrphans: false });
    const bal = breakParagraph(p, space, 600, { balance: true });
    expect(bal.lines.length).toBe(greedy.lines.length);
    const spread = (ls: { width: number }[]) => Math.max(...ls.map((l) => l.width)) - Math.min(...ls.map((l) => l.width));
    expect(spread(bal.lines)).toBeLessThanOrEqual(spread(greedy.lines));
  });

  test('flags a word wider than the line', () => {
    const [p] = prep('Supercalifragilisticexpialidocious');
    expect(breakParagraph(p, space, 100).tooWide).toBe(true);
  });
});
