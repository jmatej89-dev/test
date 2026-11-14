import { Skia, type SkImage, type SkSurface, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { H, W } from '../brand';
import type { Slide } from '../model/types';
import { layoutSlide, type SlideLayout } from '../layout/slides';
import type { Measurer } from '../layout/measure';
import { drawSlide } from './drawSlide';

export type RenderInput = {
  slide: Slide;
  watermark: string;
  measurer: Measurer;
  fonts: SkTypefaceFontProvider;
  image: SkImage | null;
  scale: number;
  /** Use a GPU offscreen surface on device; CPU raster in tests. */
  offscreen?: boolean;
};

/** Render one slide into an image of (1080·scale)×(1350·scale). */
export function renderSlideImage(input: RenderInput): { image: SkImage; layout: SlideLayout } {
  const w = Math.round(W * input.scale);
  const h = Math.round(H * input.scale);
  let surface: SkSurface | null = null;
  if (input.offscreen) surface = Skia.Surface.MakeOffscreen(w, h);
  if (!surface) surface = Skia.Surface.Make(w, h);
  if (!surface) throw new Error('Nelze vytvořit plochu pro vykreslení.');
  const canvas = surface.getCanvas();
  canvas.scale(input.scale, input.scale);
  const layout = layoutSlide(input.slide, input.measurer, input.watermark);
  drawSlide(canvas, layout, input.slide.photo, { fonts: input.fonts, image: input.image });
  surface.flush();
  const snap = surface.makeImageSnapshot();
  // Offscreen (GPU) snapshots must be copied to CPU memory before encoding on some devices.
  const image = (input.offscreen ? snap.makeNonTextureImage() : null) ?? snap;
  return { image, layout };
}
