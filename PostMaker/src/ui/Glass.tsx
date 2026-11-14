/**
 * Glass material: iOS 26 Liquid Glass when available, otherwise a system blur,
 * otherwise (Reduce Transparency) a solid dark surface. Layout is identical in all three.
 */
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceTransparency } from './a11y';
import { UI } from './theme';

const liquid = (() => {
  try {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  interactive?: boolean;
  /** Slight cyan tint for the primary floating action. */
  tinted?: boolean;
};

export function Glass({ children, style, radius = UI.radiusLg, interactive, tinted }: Props) {
  const reduce = useReduceTransparency();
  const shape: ViewStyle = { borderRadius: radius, overflow: 'hidden' };
  if (reduce) {
    return (
      <View style={[shape, styles.solid, tinted && styles.solidTinted, style]}>{children}</View>
    );
  }
  if (liquid) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        isInteractive={interactive}
        tintColor={tinted ? 'rgba(92,225,230,0.35)' : 'rgba(7,15,40,0.35)'}
        style={[shape, style]}
      >
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[shape, styles.edge, style]}>
      <BlurView tint="systemThinMaterialDark" intensity={80} style={StyleSheet.absoluteFill} />
      {tinted && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(92,225,230,0.22)' }]} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  solid: { backgroundColor: UI.bgRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: UI.lineStrong },
  solidTinted: { backgroundColor: '#123B52' },
  edge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});
