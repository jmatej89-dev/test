/**
 * The one renderer. Draws a SlideLayout onto any Skia canvas in 1080×1350 layout units:
 * the live preview (scaled down), the export surface (scaled ×2) and golden tests all use it.
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkParagraph,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import { COLORS, FONT_FAMILY, W, type FontWeight } from '../brand';
import type { PhotoRef } from '../model/types';
import type { SlideLayout, TextLine } from '../layout/slides';
import type { Measurer } from '../layout/measure';

export type RenderAssets = {
  fonts: SkTypefaceFontProvider;
  image: SkImage | null;
};

const color = (c: string) => Skia.Color(c);

/** Cover-fit source rectangle for the header, honouring zoom and focus point. */
export function photoSourceRect(photo: Pick<PhotoRef, 'zoom' | 'cx' | 'cy'>, iw: number, ih: number, dw: number, dh: number) {
  const scale = Math.max(dw / iw, dh / ih) * Math.max(1, photo.zoom);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = Math.min(Math.max(photo.cx * iw - sw / 2, 0), iw - sw);
  const sy = Math.min(Math.max(photo.cy * ih - sh / 2, 0), ih - sh);
  return { x: sx, y: sy, w: sw, h: sh, scale };
}

/** Effective pixels of the source image per layout pixel – < 1 means upscaling. */
export function photoResolutionRatio(photo: PhotoRef, headerH: number): number {
  const { scale } = photoSourceRect(photo, photo.width, photo.height, W, headerH);
  return 1 / scale;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function drawPlaceholder(canvas: SkCanvas, h: number, seed: number) {
  const palettes = [
    ['#33415C', '#7D8AA3'],
    ['#3B3F58', '#9C8F86'],
    ['#24405A', '#6E95A8'],
    ['#463A4F', '#A08A9E'],
    ['#2E4A45', '#86A39A'],
  ];
  const [a, b] = palettes[Math.abs(seed) % palettes.length];
  const p = Skia.Paint();
  p.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: W, y: h }, [color(b), color(a)], null, TileMode.Clamp));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, h), p);
  // A soft light source so the fade is visible on the placeholder.
  const glow = Skia.Paint();
  glow.setShader(
    Skia.Shader.MakeRadialGradient(
      { x: W * 0.68, y: h * 0.32 },
      h * 0.6,
      [color('rgba(255,255,255,0.28)'), color('rgba(255,255,255,0)')],
      null,
      TileMode.Clamp,
    ),
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, W, h), glow);
}

function drawHeader(canvas: SkCanvas, layout: SlideLayout, photo: PhotoRef | null, image: SkImage | null) {
  const h = layout.header.h;
  canvas.save();
  canvas.clipRect(Skia.XYWHRect(0, 0, W, h), 1 /* Intersect */, true);
  if (image && photo) {
    const iw = image.width();
    const ih = image.height();
    const src = photoSourceRect(photo, iw, ih, W, h);
    canvas.drawImageRectOptions(
      image,
      Skia.XYWHRect(src.x, src.y, src.w, src.h),
      Skia.XYWHRect(0, 0, W, h),
      FilterMode.Linear,
      MipmapMode.Linear,
      null,
    );
  } else {
    const seed = photo?.uri.startsWith('placeholder:') ? Number(photo.uri.slice(12)) || 0 : 0;
    drawPlaceholder(canvas, h, seed);
  }
  // Smoothstep fade into navy – many stops so it never bands or shows an edge.
  const { fadeFrom, fadeTo } = layout.header;
  const N = 16;
  const colors = [];
  const pos: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    colors.push(Skia.Color(`rgba(7,15,40,${smooth(t).toFixed(4)})`));
    pos.push(t);
  }
  const fade = Skia.Paint();
  fade.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: fadeFrom },
      { x: 0, y: fadeTo },
      colors,
      pos,
      TileMode.Clamp,
    ),
  );
  canvas.drawRect(Skia.XYWHRect(0, fadeFrom, W, h - fadeFrom + 1), fade);
  canvas.restore();
}

export function buildLineParagraph(line: TextLine, fonts: SkTypefaceFontProvider): SkParagraph {
  const b = Skia.ParagraphBuilder.Make({}, fonts);
  for (const r of line.runs) {
    b.pushStyle({
      color: color(COLORS[r.color]),
      fontFamilies: [FONT_FAMILY],
      fontSize: line.size,
      fontStyle: { weight: r.weight as number },
    });
    b.addText(r.text);
    b.pop();
  }
  const p = b.build();
  p.layout(100000);
  return p;
}

function drawLine(canvas: SkCanvas, line: TextLine, fonts: SkTypefaceFontProvider) {
  const p = buildLineParagraph(line, fonts);
  const metrics = p.getLineMetrics()[0];
  const baselineInPara = metrics ? metrics.baseline : line.size * 0.968;
  p.paint(canvas, line.x, line.baseline - baselineInPara);
}

export function drawSlide(canvas: SkCanvas, layout: SlideLayout, photo: PhotoRef | null, assets: RenderAssets) {
  canvas.drawColor(color(COLORS.navy));
  drawHeader(canvas, layout, photo, assets.image);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  for (const r of layout.rects) {
    paint.setColor(color(COLORS[r.color]));
    canvas.drawRect(Skia.XYWHRect(r.x, r.y, r.w, r.h), paint);
  }
  for (const l of layout.lines) drawLine(canvas, l, assets.fonts);
  if (layout.arrows) drawLine(canvas, layout.arrows, assets.fonts);
  drawLine(canvas, layout.watermark, assets.fonts);
}

/** Measurer backed by real shaped Skia paragraphs (kerning included) – matches drawing exactly. */
export function skiaMeasurer(fonts: SkTypefaceFontProvider): Measurer {
  return {
    width(text: string, weight: FontWeight, size: number) {
      if (!text) return 0;
      const b = Skia.ParagraphBuilder.Make({}, fonts);
      b.pushStyle({ fontFamilies: [FONT_FAMILY], fontSize: size, fontStyle: { weight: weight as number } });
      // Trailing spaces are not counted by getLongestLine – measure spaces via a sentinel pair.
      if (/^\s+$/.test(text)) {
        b.addText(`x${text}x`);
        const p = b.build();
        p.layout(100000);
        const b2 = Skia.ParagraphBuilder.Make({}, fonts);
        b2.pushStyle({ fontFamilies: [FONT_FAMILY], fontSize: size, fontStyle: { weight: weight as number } });
        b2.addText('xx');
        const p2 = b2.build();
        p2.layout(100000);
        return p.getMaxIntrinsicWidth() - p2.getMaxIntrinsicWidth();
      }
      b.addText(text);
      const p = b.build();
      p.layout(100000);
      return p.getMaxIntrinsicWidth();
    },
  };
}
