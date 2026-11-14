import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { UI } from './theme';

type Props = TextInputProps & { label?: string; help?: string };

/** Plain labelled text field in the app's style. */
export function Field({ label, help, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={UI.textFaint}
        selectionColor={UI.accent}
        keyboardAppearance="dark"
        accessibilityLabel={label}
        style={[styles.input, rest.multiline && styles.multi, style]}
        {...rest}
      />
      {help && <Text style={styles.help}>{help}</Text>}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  input: {
    backgroundColor: UI.bgField,
    color: UI.text,
    fontSize: 17,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: UI.hit + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.lineStrong,
  },
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: UI.textDim },
  help: { fontSize: 13, color: UI.textFaint },
  input: fieldStyles.input,
  multi: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12, lineHeight: 23 },
});
