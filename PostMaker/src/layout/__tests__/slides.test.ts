import { COVER, MAXW, QUOTE, TEXT, TEXT_BOTTOM_LIMIT, TW } from '../../brand';
import { seedSlides } from '../../model/seed';
import type { CoverSlide, QuoteSlide, TextSlide } from '../../model/types';
import { loadNodeFonts } from '../../testing/nodeSkia';
import { layoutCover, layoutQuote, layoutSlide, layoutText, quoteMarkup, type SlideLayout } from '../slides';

const { measurer } = loadNodeFonts();
const WM = 'Matěj Jankovič';
const lineWidth = (l: SlideLayout['lines'][number]) =>
  l.runs.reduce((s, r) => s + measurer.width(r.text.trimEnd(), r.weight, l.size), 0);
const words = (l: SlideLayout['lines'][number]) => l.runs.map((r) => r.text).join('').trim().split(/\s+/).length;
const photo = null;

describe('seed project fits the brand rules', () => {
  const slides = seedSlides();
  test.each(slides.map((s, i) => [i + 1, s] as const))('slide %i', (_i, slide) => {
    const l = layoutSlide(slide, measurer, WM);
    expect(l.issues).toEqual([]);
    expect(l.textBottom).toBeLessThanOrEqual(TEXT_BOTTOM_LIMIT);
    const last = l.lines.filter((x) => x.size === l.fs).pop()!;
    expect(words(last)).toBeGreaterThanOrEqual(2);
  });

  test('"Proč to vadí" fits without orphan above 1235', () => {
    const s = slides[2] as TextSlide;
    expect(s.body.length).toBeGreaterThan(200);
    const l = layoutText(s, measurer, WM);
    expect(l.issues.map((i) => i.code)).not.toContain('orphan');
    expect(l.textBottom).toBeLessThanOrEqual(1235);
  });
});

describe('cover', () => {
  const cover = (white: string, cyan: string): CoverSlide => ({ id: 'c', type: 'cover', photo, titleWhite: white, titleCyan: cyan });

  test('short title uses the max size, lines never exceed MAXW', () => {
    const l = layoutCover(cover('Krátký', 'titulek'), measurer, WM);
    expect(l.fs).toBe(COVER.fsMax);
    for (const line of l.lines) expect(lineWidth(line)).toBeLessThanOrEqual(MAXW + 0.5);
  });

  test('white lines come first, then cyan lines', () => {
    const l = layoutCover(cover('Vláda ruší závazná pravidla pro školní obědy,', 'ministr je nazval zlem'), measurer, WM);
    const colors = l.lines.map((x) => x.runs[0].color);
    const firstCyan = colors.indexOf('cyan');
    expect(firstCyan).toBeGreaterThan(0);
    expect(colors.slice(firstCyan).every((c) => c === 'cyan')).toBe(true);
    // No gap: cyan continues at the regular line pitch.
    const pitch = l.lines[1].baseline - l.lines[0].baseline;
    expect(l.lines[firstCyan].baseline - l.lines[firstCyan - 1].baseline).toBeCloseTo(pitch, 5);
  });

  test('long title shrinks but stays ≥ 56 and above 1235', () => {
    const l = layoutCover(
      cover('Vláda ruší závazná pravidla pro školní obědy a zároveň mění financování jídelen,', 'ministr pro prevenci a zdraví je nazval „zlem“'),
      measurer,
      WM,
    );
    expect(l.fs).toBeLessThan(COVER.fsMax);
    expect(l.fs).toBeGreaterThanOrEqual(COVER.fsMin);
    expect(l.textBottom).toBeLessThanOrEqual(1235);
  });

  test('arrows only on the cover', () => {
    expect(layoutCover(cover('a', 'b'), measurer, WM).arrows).not.toBeNull();
    const t: TextSlide = { id: 't', type: 'text', photo, body: 'x y' };
    expect(layoutText(t, measurer, WM).arrows).toBeNull();
  });

  test('manual line break is honoured', () => {
    const l = layoutCover(cover('První\nDruhý řádek', ''), measurer, WM);
    expect(l.lines[0].runs.map((r) => r.text).join('')).toBe('První');
  });
});

describe('text slide', () => {
  const text = (body: string, extra: Partial<TextSlide> = {}): TextSlide => ({ id: 't', type: 'text', photo, label: 'Co se stalo.', body, ...extra });

  test('label is inline, cyan, same size as the body', () => {
    const l = layoutText(text('Vláda chce změnit pravidla.'), measurer, WM);
    const first = l.lines[0];
    expect(first.runs[0]).toMatchObject({ color: 'cyan', weight: 700 });
    expect(first.runs[0].text.trim()).toBe('Co se stalo.');
    expect(first.runs[1].color).toBe('white');
  });

  test('short text gets 62, long text shrinks, too long text warns at 40', () => {
    expect(layoutText(text('Krátce.'), measurer, WM).fs).toBe(TEXT.fsMax);
    const mid = layoutText(text('Slovo '.repeat(70).trim() + '.'), measurer, WM);
    expect(mid.fs).toBeLessThan(TEXT.fsMax);
    expect(mid.issues).toEqual([]);
    const huge = layoutText(text('Slovo '.repeat(400).trim() + '.'), measurer, WM);
    expect(huge.fs).toBe(TEXT.fsMin);
    expect(huge.issues.map((i) => i.code)).toContain('overflow');
  });

  test('all lines fit TW and start at TX with the accent bar spanning the block', () => {
    const l = layoutText(text('Vláda zrušila vyhlášku o nutričních pravidlech ve školních jídelnách a ministr ji označil za zlo.'), measurer, WM);
    for (const line of l.lines) {
      expect(line.x).toBe(104);
      expect(lineWidth(line)).toBeLessThanOrEqual(TW + 0.5);
    }
    const bar = l.rects[0];
    expect(bar.x).toBe(68);
    expect(bar.y).toBeLessThan(l.lines[0].baseline);
    expect(bar.y + bar.h).toBeGreaterThan(l.lines[l.lines.length - 1].baseline);
  });

  test('manual size override is used verbatim and flagged when tiny', () => {
    const l = layoutText(text('Ahoj světe.', { fsOverride: 36 }), measurer, WM);
    expect(l.fs).toBe(36);
    expect(l.auto).toBe(false);
    expect(l.issues.map((i) => i.code)).toContain('tooSmall');
  });

  test('header height option moves the text', () => {
    const a = layoutText(text('Ahoj.', { headerH: 420 }), measurer, WM);
    const b = layoutText(text('Ahoj.', { headerH: 600 }), measurer, WM);
    expect(b.textTop - a.textTop).toBe(180);
  });

  test('"Zdroj:" on the slide is flagged', () => {
    const l = layoutText(text('Nějaký text. Zdroj: ČTK'), measurer, WM);
    expect(l.issues.map((i) => i.code)).toContain('sourceOnSlide');
  });

  test('highlight across a line break stays cyan on both lines', () => {
    const body = 'Tohle je dost dlouhá věta, ve které je {zvýrazněná fráze, která se určitě musí zalomit na další řádek} a konec.';
    const l = layoutText(text(body, { label: '' }), measurer, WM);
    const cyanLines = l.lines.filter((x) => x.runs.some((r) => r.color === 'cyan'));
    expect(cyanLines.length).toBeGreaterThanOrEqual(2);
  });
});

describe('quote slide', () => {
  const q = (quotes: QuoteSlide['quotes'], extra: Partial<QuoteSlide> = {}): QuoteSlide => ({ id: 'q', type: 'quote', photo, quotes, ...extra });

  test('adds Czech quotation marks, keeps leading ellipsis', () => {
    expect(quoteMarkup('…nesmyslné {zlo}.')).toBe('„…nesmyslné {zlo}.“');
    expect(quoteMarkup('„Už mám“')).toBe('„Už mám“');
  });

  test('name and role sizes follow the quote size', () => {
    const l = layoutQuote(q([{ text: 'Krátká {citace}.', name: 'Jan Novák', role: 'ministr' }]), measurer, WM);
    const name = l.lines.find((x) => x.runs[0].color === 'cyan' && x.runs[0].weight === 600)!;
    const role = l.lines.find((x) => x.runs[0].color === 'white60')!;
    expect(name.size).toBe(Math.max(QUOTE.nameMin, Math.round(l.fs * QUOTE.nameK)));
    expect(role.size).toBeLessThan(name.size);
    expect(role.runs[0].weight).toBe(400);
  });

  test('two quotes look the same: same size, x, spacing pattern and one bar each', () => {
    const l = layoutQuote(
      q([
        { text: '…nesmyslné {progresivistické zlo}.', name: 'A B', role: 'r1' },
        { text: 'Stát má regulovat jen ty {nejnutnější věci}.', name: 'C D', role: 'r2' },
      ]),
      measurer,
      WM,
    );
    expect(l.rects.length).toBe(2);
    const quoteLines = l.lines.filter((x) => x.size === l.fs);
    expect(new Set(quoteLines.map((x) => x.x)).size).toBe(1);
    // Distance from the last quote line to the name line is identical for both quotes.
    const names = l.lines.filter((x) => x.runs[0].weight === 600);
    const gaps = names.map((n) => {
      const prev = l.lines[l.lines.indexOf(n) - 1];
      return n.baseline - prev.baseline;
    });
    expect(gaps[0]).toBeCloseTo(gaps[1], 5);
    expect(l.textBottom).toBeLessThanOrEqual(1235);
  });

  test('long quote shortens the header before shrinking text too much', () => {
    const long = 'Tohle je velmi dlouhá citace, která má otestovat, že se hlavička zkrátí dřív, než písmo spadne pod rozumnou velikost. '.repeat(3);
    const l = layoutQuote(q([{ text: long, name: 'Jméno', role: 'role' }, { text: long, name: 'Jméno', role: 'role' }]), measurer, WM);
    expect(l.header.h).toBeLessThan(547);
  });

  test('fixed header height is respected', () => {
    const l = layoutQuote(q([{ text: 'Ahoj.', name: '', role: '' }], { headerH: 450 }), measurer, WM);
    expect(l.header.h).toBe(450);
  });
});
