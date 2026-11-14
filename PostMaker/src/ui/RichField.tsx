/**
 * Text field that edits markup: highlighted words show in cyan right in the field.
 * Select text → floating glass "Zvýraznit" button above the keyboard toggles the highlight.
 */
import { useId, useRef, useState } from 'react';
import { InputAccessoryView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { applyPlainEdit, parseMarkup, runsOf, toggleHighlight } from '../text/markup';
import { Glass } from './Glass';
import { Icon } from './controls';
import { haptic } from './haptics';
import { fieldStyles } from './Field';
import { UI } from './theme';

type Props = {
  label: string;
  value: string;
  onChange: (markup: string) => void;
  placeholder?: string;
  multiline?: boolean;
  /** Highlight is disabled for name / role fields etc. */
  highlight?: boolean;
  /** Everything in this field renders cyan (cover's cyan part). */
  allCyan?: boolean;
  big?: boolean;
  onFocus?: () => void;
};

export function RichField({ label, value, onChange, placeholder, multiline = true, highlight = true, allCyan, big, onFocus }: Props) {
  const rich = parseMarkup(value);
  const sel = useRef({ start: 0, end: 0 });
  const [hasSel, setHasSel] = useState(false);
  const accessoryId = useId().replace(/:/g, '');

  const spans = runsOf(rich.text, rich.hl).flatMap((r, i) =>
    // Show hard spaces (~) faintly so they are discoverable but quiet.
    r.text.split(/(~)/).map((part, j) =>
      part === '~' ? (
        <Text key={`${i}-${j}`} style={{ color: UI.textFaint }}>
          ~
        </Text>
      ) : (
        <Text key={`${i}-${j}`} style={{ color: r.hl || allCyan ? UI.accent : UI.text }}>
          {part}
        </Text>
      ),
    ),
  );

  const toggle = () => {
    const { start, end } = sel.current;
    const next = toggleHighlight(value, start, end);
    if (next !== value) {
      haptic.select();
      onChange(next);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={UI.textFaint}
        selectionColor={UI.accent}
        keyboardAppearance="dark"
        accessibilityLabel={label}
        accessibilityHint={highlight ? 'Vyberte slova a klepněte na Zvýraznit' : undefined}
        inputAccessoryViewID={highlight && Platform.OS === 'ios' ? accessoryId : undefined}
        onFocus={onFocus}
        onChangeText={(t) => onChange(applyPlainEdit(value, t))}
        onSelectionChange={(e) => {
          sel.current = e.nativeEvent.selection;
          setHasSel(e.nativeEvent.selection.end !== e.nativeEvent.selection.start);
        }}
        style={[fieldStyles.input, multiline && styles.multi, big && styles.big]}
        scrollEnabled={false}
        // Styled children are an iOS/Android feature; the web preview shows plain text.
        value={Platform.OS === 'web' ? rich.text : undefined}
      >
        {Platform.OS === 'web' ? undefined : spans}
      </TextInput>
      {highlight && Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId} backgroundColor="transparent">
          <View style={styles.accessory}>
            <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Zvýraznit vybraná slova" style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Glass tinted={hasSel} radius={22} interactive style={styles.hlBtn}>
                <Icon name="color-wand" size={18} color={hasSel ? UI.text : UI.textDim} />
                <Text style={[styles.hlText, !hasSel && { color: UI.textDim }]}>Zvýraznit</Text>
              </Glass>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
      {highlight && Platform.OS !== 'ios' && (
        <Pressable onPress={toggle} style={styles.inlineBtn} accessibilityRole="button" accessibilityLabel="Zvýraznit vybraná slova">
          <Icon name="color-wand" size={16} color={UI.accent} />
          <Text style={{ color: UI.accent, fontWeight: '600' }}>Zvýraznit výběr</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: UI.textDim },
  multi: { minHeight: 92, textAlignVertical: 'top', paddingTop: 12, lineHeight: 23 },
  big: { fontSize: 19, lineHeight: 26, fontWeight: '600' },
  accessory: { alignItems: 'center', paddingVertical: 8 },
  hlBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 44 },
  hlText: { color: UI.text, fontSize: 16, fontWeight: '600' },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: UI.hit, alignSelf: 'flex-start' },
});
