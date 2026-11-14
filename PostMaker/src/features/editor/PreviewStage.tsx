/**
 * The slide preview with direct photo manipulation (drag / pinch) and a three-finger swipe
 * for undo (←) / redo (→). The preview shrinks smoothly while the tool sheet is open so the
 * sheet never covers the slide.
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { H, W } from '../../brand';
import type { SlideLayout } from '../../layout/slides';
import type { PhotoRef, Slide } from '../../model/types';
import { SlideCanvas } from '../../render/SlideCanvas';
import { haptic } from '../../ui/haptics';

type Props = {
  slide: Slide;
  layout: SlideLayout | null;
  watermark: string;
  baseWidth: number;
  /** Live scale (0..1) of the preview, driven by the sheet. */
  scale: SharedValue<number>;
  safeZone: boolean;
  onPhoto: (patch: Partial<PhotoRef>) => void;
  onUndo: () => void;
  onRedo: () => void;
};

function clampFocus(p: PhotoRef, headerH: number, cx: number, cy: number, zoom: number) {
  const s = Math.max(W / p.width, headerH / p.height) * zoom;
  const hw = W / s / 2 / p.width;
  const hh = headerH / s / 2 / p.height;
  return {
    cx: Math.min(Math.max(cx, hw), 1 - hw),
    cy: Math.min(Math.max(cy, hh), 1 - hh),
  };
}

export function PreviewStage({ slide, layout, watermark, baseWidth, scale, safeZone, onPhoto, onUndo, onRedo }: Props) {
  const baseH = (baseWidth * H) / W;
  const start = useRef<PhotoRef | null>(null);
  const live = useRef<PhotoRef | null>(null);
  useEffect(() => {
    live.current = slide.photo;
  }, [slide.photo]);
  const headerH = layout?.header.h ?? 547;

  const layoutPerPoint = () => W / (baseWidth * Math.max(0.2, scale.get()));

  const pan = usePanGesture({
    runOnJS: true,
    maxPointers: 2,
    minDistance: 4,
    onActivate: () => {
      start.current = live.current;
    },
    onUpdate: (e) => {
      const p0 = start.current;
      const cur = live.current;
      if (!p0 || !cur || p0.uri.startsWith('placeholder:')) return;
      const k = layoutPerPoint();
      const s = Math.max(W / p0.width, headerH / p0.height) * cur.zoom;
      const cx = p0.cx - (e.translationX * k) / (s * p0.width);
      const cy = p0.cy - (e.translationY * k) / (s * p0.height);
      onPhoto(clampFocus(cur, headerH, cx, cy, cur.zoom));
    },
  });

  const pinchStart = useRef(1);
  const pinch = usePinchGesture({
    runOnJS: true,
    onActivate: () => {
      pinchStart.current = live.current?.zoom ?? 1;
    },
    onUpdate: (e) => {
      const cur = live.current;
      if (!cur || cur.uri.startsWith('placeholder:')) return;
      const zoom = Math.min(5, Math.max(1, pinchStart.current * e.scale));
      onPhoto({ zoom, ...clampFocus(cur, headerH, cur.cx, cur.cy, zoom) });
    },
  });

  const threeFinger = usePanGesture({
    runOnJS: true,
    minPointers: 3,
    onDeactivate: (e) => {
      if (e.translationX < -60) {
        haptic.light();
        onUndo();
      } else if (e.translationX > 60) {
        haptic.light();
        onRedo();
      }
    },
  });

  const photoGestures = useSimultaneousGestures(pan, pinch);
  const gesture = useExclusiveGestures(threeFinger, photoGestures);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: -(baseH * (1 - scale.value)) / 2 }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.stage, { height: baseH }]} collapsable={false}>
        <Animated.View style={[styles.card, animated]}>
          <SlideCanvas slide={slide} layout={layout} width={baseWidth} watermark={watermark} safeZone={safeZone} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center' },
  card: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
});
