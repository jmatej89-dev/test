import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptic } from './haptics';
import { TYPE, UI } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = UI.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'plain' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hint?: string;
  compact?: boolean;
};

export function Button({ label, onPress, icon, kind = 'secondary', disabled, style, hint, compact }: ButtonProps) {
  const fg = kind === 'primary' ? UI.onAccent : kind === 'danger' ? UI.danger : kind === 'plain' ? UI.accent : UI.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        (kind === 'plain' || kind === 'danger') && styles.plain,
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={compact ? 18 : 20} color={fg} />}
      <Text style={[styles.btnText, compact && { fontSize: 15 }, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  active,
  size = 22,
  badge,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, active && styles.iconBtnActive, pressed && { opacity: 0.6 }, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={size} color={active ? UI.onAccent : UI.text} />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              if (!on) haptic.select();
              onChange(o.value);
            }}
            style={[styles.segItem, on && styles.segOn]}
          >
            <Text style={[styles.segText, on && { color: UI.onAccent, fontWeight: '600' }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Tag({ text, tone = 'warn', onPress, action }: { text: string; tone?: 'warn' | 'info' | 'ok'; onPress?: () => void; action?: string }) {
  const color = tone === 'warn' ? UI.warn : tone === 'ok' ? UI.ok : UI.accent;
  const bg = tone === 'warn' ? UI.warnBg : tone === 'ok' ? 'rgba(123,224,163,0.12)' : 'rgba(92,225,230,0.12)';
  const body = (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Icon name={tone === 'warn' ? 'alert-circle' : tone === 'ok' ? 'checkmark-circle' : 'information-circle'} size={16} color={color} />
      <Text style={[styles.tagText, { color }]}>{text}</Text>
      {action && <Text style={[styles.tagAction, { color }]}>{action}</Text>}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${text}. ${action ?? ''}`} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {body}
    </Pressable>
  );
}

export function Section({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      {(title || right) && (
        <View style={styles.sectionHead}>
          {title && <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: UI.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCompact: { minHeight: UI.hit, paddingHorizontal: 14 },
  primary: { backgroundColor: UI.accent },
  secondary: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: UI.lineStrong },
  plain: { backgroundColor: 'transparent' },
  btnText: { fontSize: 17, fontWeight: '600' },
  iconBtn: { width: UI.hit, height: UI.hit, borderRadius: UI.hit / 2, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: UI.accent },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: UI.warn,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: UI.onAccent, fontSize: 11, fontWeight: '700' },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3 },
  segItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 6 },
  segOn: { backgroundColor: UI.accent },
  segText: { color: UI.text, fontSize: 15 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start' },
  tagText: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
  tagAction: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  section: { gap: 10, marginBottom: 22 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...TYPE.footnote, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
});
