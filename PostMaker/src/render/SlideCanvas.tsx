/**
 * Live preview: records the exact export drawing into an SkPicture and shows it scaled.
 * No glass or UI ever overlaps the slide itself (overlays here are opt-in helpers only).
 */
import { Canvas, Picture, createPicture, useImage, type SkImage } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { H, W } from '../brand';
import { layoutSlide, slideAccessibilityText, type SlideLayout } from '../layout/slides';
import type { PhotoRef, Slide } from '../model/types';
import { drawSlide } from './drawSlide';
import { useRender } from './RenderContext';

export function usePhotoImage(photo: PhotoRef | null): SkImage | null {
  const uri = photo && !photo.uri.startsWith('placeholder:') ? photo.uri : null;
  return useImage(uri);
}

export function useSlideLayout(slide: Slide | undefined, watermark: string): SlideLayout | null {
  const r = useRender();
  return useMemo(() => (r && slide ? layoutSlide(slide, r.measurer, watermark) : null), [r, slide, watermark]);
}

type Props = {
  slide: Slide;
  width: number;
  watermark: string;
  safeZone?: boolean;
  /** Pass a precomputed layout to avoid laying out twice. */
  layout?: SlideLayout | null;
};

export const SlideCanvas = memo(function SlideCanvas({ slide, width, watermark, safeZone, layout: given }: Props) {
  const r = useRender();
  const image = usePhotoImage(slide.photo);
  const own = useSlideLayout(given ? undefined : slide, watermark);
  const layout = given ?? own;
  const height = (width * H) / W;
  const k = width / W;
  const picture = useMemo(() => {
    if (!r || !layout) return null;
    return createPicture(
      (canvas) => {
        canvas.scale(k, k);
        drawSlide(canvas, layout, slide.photo, { fonts: r.fonts, image });
      },
      { width, height },
    );
  }, [r, layout, slide.photo, image, k, width, height]);

  return (
    <View
      style={{ width, height, backgroundColor: '#070F28' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={slideAccessibilityText(slide)}
    >
      {picture && (
        <Canvas style={{ width, height }} pointerEvents="none">
          <Picture picture={picture} />
        </Canvas>
      )}
      {safeZone && layout && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.fadeZone, { top: layout.header.fadeFrom * k, height: (layout.header.h - layout.header.fadeFrom) * k }]} />
          <View style={[styles.faceLine, { top: layout.header.fadeFrom * k }]} />
          <Text style={[styles.faceLabel, { top: layout.header.fadeFrom * k - 22 }]}>Obličej celý nad čarou</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fadeZone: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(92,225,230,0.12)' },
  faceLine: { position: 'absolute', left: 0, right: 0, height: 0, borderTopWidth: 2, borderColor: '#5CE1E6', borderStyle: 'dashed' },
  faceLabel: {
    position: 'absolute',
    left: 8,
    color: '#070F28',
    backgroundColor: '#5CE1E6',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
