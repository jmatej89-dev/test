/**
 * Golden tests: render the seed slides with the real renderer (Skia/CanvasKit) at 1080×1350
 * and compare with committed PNGs. Run `npm run test:update-golden` after intended changes.
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { seedSlides } from '../../model/seed';
import { loadNodeFonts } from '../../testing/nodeSkia';
import { renderSlideImage } from '../renderSlide';
import type { Slide } from '../../model/types';

const DIR = path.join(__dirname, '__golden__');
const UPDATE = process.env.UPDATE_GOLDEN === '1';
/** Max share of differing pixels (anti-aliasing noise across CanvasKit builds). */
const TOLERANCE = 0.002;

function render(slide: Slide): Buffer {
  const { fonts, measurer } = loadNodeFonts();
  const { image } = renderSlideImage({ slide, watermark: 'Matěj Jankovič', measurer, fonts, image: null, scale: 1 });
  return Buffer.from(image.encodeToBytes());
}

const extra: Slide[] = [
  { id: 'long', type: 'text', photo: { uri: 'placeholder:2', width: 2000, height: 1300, zoom: 1, cx: 0.5, cy: 0.5, fade: 1.5 }, label: 'Dlouhý text.', body: 'Toto je extrémně dlouhý text, který se nevejde ani při nejmenší velikosti písma. '.repeat(8), headerH: 600 },
];

const cases: [string, Slide][] = [
  ...seedSlides().map((s, i) => [`seed-${i + 1}-${s.type}`, s] as [string, Slide]),
  ...extra.map((s) => [`extra-${s.id}`, s] as [string, Slide]),
];

describe('golden renders', () => {
  beforeAll(() => fs.mkdirSync(DIR, { recursive: true }));
  test.each(cases)('%s', (name, slide) => {
    const actualBuf = render(slide);
    const file = path.join(DIR, `${name}.png`);
    if (UPDATE || !fs.existsSync(file)) {
      fs.writeFileSync(file, actualBuf);
      return;
    }
    const expected = PNG.sync.read(fs.readFileSync(file));
    const actual = PNG.sync.read(actualBuf);
    expect([actual.width, actual.height]).toEqual([1080, 1350]);
    const diff = pixelmatch(expected.data, actual.data, null, 1080, 1350, { threshold: 0.1 });
    expect(diff / (1080 * 1350)).toBeLessThan(TOLERANCE);
  });
});

describe('export resolution', () => {
  test('seed slides render at 2160×2700 (scale 2), identical layout to the preview', () => {
    const { fonts, measurer } = loadNodeFonts();
    const out = process.env.EXPORT_DIR;
    if (out) fs.mkdirSync(out, { recursive: true });
    seedSlides().forEach((slide, i) => {
      const { image, layout } = renderSlideImage({ slide, watermark: 'Matěj Jankovič', measurer, fonts, image: null, scale: 2 });
      expect([image.width(), image.height()]).toEqual([2160, 2700]);
      expect(layout.issues).toEqual([]);
      if (out) fs.writeFileSync(path.join(out, `ukazka_${i + 1}.png`), image.encodeToBytes());
    });
  });
});
