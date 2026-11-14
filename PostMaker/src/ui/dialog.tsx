/**
 * Menus, confirmations and text prompts. Native iOS sheets/alerts on device; on the web
 * (where RN's Alert is a no-op) the same calls render an in-app glass dialog.
 */
import { useState } from 'react';
import { ActionSheetIOS, Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { create } from 'zustand';
import { Glass } from './Glass';
import { TYPE, UI } from './theme';

export type DialogOption = { label: string; destructive?: boolean; onPress: () => void };

type Pending =
  | { kind: 'choose'; title: string; message?: string; options: DialogOption[] }
  | { kind: 'prompt'; title: string; initial: string; onDone: (t: string) => void };

const useDialog = create<{ pending: Pending | null }>(() => ({ pending: null }));
const close = () => useDialog.setState({ pending: null });

export function chooseAction(title: string, options: DialogOption[], message?: string) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...options.map((o) => o.label), 'Zrušit'],
        cancelButtonIndex: options.length,
        destructiveButtonIndex: options.map((o, i) => (o.destructive ? i : -1)).filter((i) => i >= 0),
        userInterfaceStyle: 'dark',
      },
      (i) => i < options.length && options[i].onPress(),
    );
  } else if (Platform.OS === 'android') {
    Alert.alert(title, message, [
      ...options.map((o) => ({ text: o.label, onPress: o.onPress, style: o.destructive ? ('destructive' as const) : ('default' as const) })),
      { text: 'Zrušit', style: 'cancel' as const },
    ]);
  } else {
    useDialog.setState({ pending: { kind: 'choose', title, message, options } });
  }
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') useDialog.setState({ pending: { kind: 'choose', title, message, options: [] } });
  else Alert.alert(title, message);
}

export function askText(title: string, initial: string, onDone: (t: string) => void) {
  if (Platform.OS === 'ios') Alert.prompt(title, undefined, (t) => onDone(t ?? ''), 'plain-text', initial);
  else useDialog.setState({ pending: { kind: 'prompt', title, initial, onDone } });
}

function PromptBody({ p }: { p: Extract<Pending, { kind: 'prompt' }> }) {
  const [t, setT] = useState(p.initial);
  return (
    <>
      <TextInput
        value={t}
        onChangeText={setT}
        autoFocus
        style={styles.input}
        selectionColor={UI.accent}
        accessibilityLabel={p.title}
        onSubmitEditing={() => {
          close();
          p.onDone(t);
        }}
      />
      <Row label="Uložit" onPress={() => (close(), p.onDone(t))} />
    </>
  );
}

function Row({ label, onPress, destructive, muted }: { label: string; onPress: () => void; destructive?: boolean; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
      <Text style={[styles.rowText, destructive && { color: UI.danger }, muted && { color: UI.textDim, fontWeight: '500' }]}>{label}</Text>
    </Pressable>
  );
}

/** Mounted once in the root layout; renders web dialogs. */
export function DialogHost() {
  const p = useDialog((s) => s.pending);
  if (!p) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Zavřít" />
      <View style={styles.wrap} pointerEvents="box-none">
        <Glass radius={22} style={styles.card}>
          <View style={styles.head}>
            <Text style={[TYPE.headline, { textAlign: 'center' }]}>{p.title}</Text>
            {p.kind === 'choose' && p.message ? <Text style={[TYPE.footnote, { textAlign: 'center' }]}>{p.message}</Text> : null}
          </View>
          {p.kind === 'choose' &&
            p.options.map((o) => (
              <Row
                key={o.label}
                label={o.label}
                destructive={o.destructive}
                onPress={() => {
                  close();
                  o.onPress();
                }}
              />
            ))}
          {p.kind === 'prompt' && <PromptBody p={p} />}
          <Row label={p.kind === 'choose' && !p.options.length ? 'OK' : 'Zrušit'} onPress={close} muted />
        </Glass>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  wrap: { flex: 1, justifyContent: 'flex-end', padding: 10, paddingBottom: 24 },
  card: { overflow: 'hidden' },
  head: { padding: 16, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: UI.lineStrong },
  row: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: UI.line },
  rowText: { color: UI.accent, fontSize: 17, fontWeight: '600' },
  input: { margin: 14, color: UI.text, fontSize: 17, backgroundColor: UI.bgField, borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: UI.lineStrong },
});
