/**
 * Bottom sheet with detents (small / medium / large). It sits above the tool bar and never covers
 * the slide preview – the editor shrinks the preview using the shared `height` value.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReduceMotion } from './a11y';
import { Glass } from './Glass';
import { TYPE, UI } from './theme';

export type Detent = 'closed' | 'small' | 'medium' | 'large';
export type DetentHeights = Record<Exclude<Detent, 'closed'>, number>;

const ORDER: Detent[] = ['closed', 'small', 'medium', 'large'];

export function detentHeight(d: Detent, h: DetentHeights) {
  return d === 'closed' ? 0 : h[d];
}

type Props = {
  detent: Detent;
  onDetentChange: (d: Detent) => void;
  heights: DetentHeights;
  height: SharedValue<number>;
  bottom: SharedValue<number>;
  title: string;
  right?: ReactNode;
  children: ReactNode;
};

export function Sheet({ detent, onDetentChange, heights, height, bottom, title, right, children }: Props) {
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const target = detentHeight(detent, heights);
    height.set(reduceMotion ? withTiming(target, { duration: 160 }) : withSpring(target, { damping: 26, stiffness: 260, mass: 0.9 }));
  }, [detent, heights, height, reduceMotion]);

  const small = heights.small;
  const medium = heights.medium;
  const large = heights.large;
  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      height.set(Math.max(0, Math.min(large + 40, height.get() - e.changeY)));
    },
    onDeactivate: (e) => {
      'worklet';
      const projected = height.get() - e.velocityY * 0.12;
      const options = [0, small, medium, large];
      let best = 0;
      for (let i = 1; i < options.length; i++) if (Math.abs(options[i] - projected) < Math.abs(options[best] - projected)) best = i;
      height.set(withSpring(options[best], { damping: 26, stiffness: 260, mass: 0.9 }));
      scheduleOnRN(onDetentChange, ORDER[best]);
    },
  });

  const style = useAnimatedStyle(() => ({
    height: height.value,
    bottom: bottom.value,
    opacity: height.value < 8 ? 0 : 1,
  }));

  const cycle = () => {
    const i = ORDER.indexOf(detent);
    onDetentChange(i >= 3 ? 'small' : ORDER[i + 1]);
  };

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents={detent === 'closed' ? 'none' : 'auto'}>
      <Glass radius={UI.radiusLg} style={styles.glass}>
        <GestureDetector gesture={pan}>
          <View style={styles.head}>
            <Pressable
              onPress={cycle}
              accessibilityRole="adjustable"
              accessibilityLabel={`Panel ${title}`}
              accessibilityHint="Klepnutím změníte výšku panelu"
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => {
                const i = ORDER.indexOf(detent);
                if (e.nativeEvent.actionName === 'increment') onDetentChange(ORDER[Math.min(3, i + 1)]);
                else onDetentChange(ORDER[Math.max(0, i - 1)]);
              }}
              style={styles.grabArea}
            >
              <View style={styles.grabber} />
            </Pressable>
            <View style={styles.titleRow}>
              <Text style={TYPE.headline} accessibilityRole="header">
                {title}
              </Text>
              <View style={styles.right}>{right}</View>
            </View>
          </View>
        </GestureDetector>
        <View style={styles.body}>{children}</View>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 8, right: 8 },
  glass: { flex: 1 },
  head: { paddingHorizontal: UI.gutter, paddingBottom: 6 },
  grabArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 6 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  body: { flex: 1 },
});
