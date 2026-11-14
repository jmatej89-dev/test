/** Test-only helpers: load the bundled Montserrat files into Skia under Node (CanvasKit). */
import fs from 'fs';
import path from 'path';
import { Skia, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { FONT_FAMILY } from '../brand';
import { cachedMeasurer, type Measurer } from '../layout/measure';
import { skiaMeasurer } from '../render/drawSlide';

const FONT_FILES = ['Montserrat_400Regular.ttf', 'Montserrat_600SemiBold.ttf', 'Montserrat_700Bold.ttf'];

let cached: { fonts: SkTypefaceFontProvider; measurer: Measurer } | null = null;

export function loadNodeFonts() {
  if (cached) return cached;
  const fonts = Skia.TypefaceFontProvider.Make();
  for (const f of FONT_FILES) {
    const bytes = fs.readFileSync(path.join(__dirname, '../../assets/fonts', f));
    const tf = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(new Uint8Array(bytes)));
    if (!tf) throw new Error(`Font ${f} failed to load`);
    fonts.registerFont(tf, FONT_FAMILY);
  }
  cached = { fonts, measurer: cachedMeasurer(skiaMeasurer(fonts)) };
  return cached;
}
