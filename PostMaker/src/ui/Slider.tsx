/** Minimal accessible slider (no extra native dependency, works in Expo Go). */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import { haptic } from './haptics';
import { UI } from './theme';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onEnd?: () => void;
  label: string;
  format?: (v: number) => string;
};

export function Slider({ value, min, max, step, onChange, onEnd, label, format = String }: Props) {
  const [w, setW] = useState(1);
  const last = useRef(value);
  const toValue = (x: number) => {
    const t = Math.max(0, Math.min(1, x / w));
    const v = Math.round((min + t * (max - min)) / step) * step;
    return Math.max(min, Math.min(max, Number(v.toFixed(4))));
  };
  const emit = (x: number) => {
    const v = toValue(x);
    if (v !== last.current) {
      last.current = v;
      haptic.select();
      onChange(v);
    }
  };
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => emit(e.x),
    onUpdate: (e) => emit(e.x),
    onFinalize: () => onEnd?.(),
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: (e) => emit(e.x) });
  const gesture = useSimultaneousGestures(pan, tap);
  const t = (value - min) / (max - min || 1);
  useEffect(() => {
    last.current = value;
  }, [value]);
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.hit}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: format(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const v = e.nativeEvent.actionName === 'increment' ? Math.min(max, value + step) : Math.max(min, value - step);
          onChange(Number(v.toFixed(4)));
        }}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${t * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: t * w - 14 }]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: { height: UI.hit, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: UI.accent },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
