/**
 * Export: every slide rendered with the preview's renderer at 2160×2700 (scale 2), PNG (lossless, sRGB),
 * written to the cache as `<name>_1.png …` in slide order.
 */
import { Skia } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { EXPORT_SCALE } from '../brand';
import type { Measurer } from '../layout/measure';
import type { Project } from '../model/types';
import { renderSlideImage } from '../render/renderSlide';
import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { stripDiacritics } from '../text/czech';
import { resolvePhotoUri } from '../store/photos';

export function exportBaseName(name: string): string {
  const s = stripDiacritics(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'carousel';
}

async function loadImage(uri: string | undefined) {
  if (!uri || uri.startsWith('placeholder:')) return null;
  const url = await resolvePhotoUri(uri);
  if (!url) return null;
  const data = await Skia.Data.fromURI(url);
  return Skia.Image.MakeImageFromEncoded(data);
}

export type RenderedSlide = { name: string; bytes: Uint8Array };

/** Render every slide to PNG bytes in slide order. */
export async function renderProjectBytes(
  project: Project,
  watermark: string,
  fonts: SkTypefaceFontProvider,
  measurer: Measurer,
  onProgress: (done: number, total: number) => void,
): Promise<RenderedSlide[]> {
  const base = exportBaseName(project.name);
  const out: RenderedSlide[] = [];
  const total = project.slides.length;
  for (let i = 0; i < total; i++) {
    onProgress(i, total);
    const slide = project.slides[i];
    const image = await loadImage(slide.photo?.uri);
    const { image: img } = renderSlideImage({ slide, watermark, measurer, fonts, image, scale: EXPORT_SCALE, offscreen: Platform.OS !== 'web' });
    out.push({ name: `${base}_${i + 1}.png`, bytes: img.encodeToBytes() });
    // Yield so the progress animation can render between slides.
    await new Promise((r) => setTimeout(r, 16));
  }
  onProgress(total, total);
  return out;
}

/** Native: write the PNGs to the cache directory (for Photos / share sheet). */
export function writePngFiles(slides: RenderedSlide[]): File[] {
  const dir = new Directory(Paths.cache, 'export');
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true, idempotent: true });
  return slides.map((s) => {
    const f = new File(dir, s.name);
    f.create({ overwrite: true });
    f.write(s.bytes);
    return f;
  });
}

export async function saveToPhotos(files: File[]): Promise<void> {
  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) throw new Error('Appka nemá povolení ukládat do Fotek. Povol ho v Nastavení iOS.');
  // Sequential so the Photos order matches the slide order.
  for (const f of files) await MediaLibrary.Asset.create(f.uri);
}
