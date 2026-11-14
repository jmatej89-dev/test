import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../ui/controls';
import { TYPE, UI } from '../../../ui/theme';
import type { Issue } from '../../check';

export function CheckPanel({ issues, onJump }: { issues: Issue[]; onJump: (i: Issue) => void }) {
  if (!issues.length) {
    return (
      <View style={styles.ok}>
        <Icon name="shield-checkmark" size={36} color={UI.ok} />
        <Text style={TYPE.headline}>Vše sedí</Text>
        <Text style={TYPE.footnote}>Žádný sirotek, přetečení ani chybějící zdroj.</Text>
      </View>
    );
  }
  const sorted = [...issues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warn' ? -1 : 1));
  return (
    <View style={{ gap: 8 }}>
      {sorted.map((i) => (
        <Pressable
          key={i.id}
          onPress={() => onJump(i)}
          accessibilityRole="button"
          accessibilityLabel={`${i.slideIndex !== null ? `Slajd ${i.slideIndex + 1}: ` : 'Popisek: '}${i.message}`}
          accessibilityHint="Přejde na místo problému"
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Icon name={i.severity === 'warn' ? 'alert-circle' : 'information-circle'} size={20} color={i.severity === 'warn' ? UI.warn : UI.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.where}>{i.slideIndex !== null ? `Slajd ${i.slideIndex + 1}` : 'Popisek'}</Text>
            <Text style={styles.msg}>{i.message}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={UI.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ok: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  where: { ...TYPE.caption, fontWeight: '600' },
  msg: { color: UI.text, fontSize: 15 },
});
