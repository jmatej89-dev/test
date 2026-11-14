import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import type { Slide } from '../../model/types';
import { SLIDE_TYPE_LABEL } from '../../model/types';
import { Button, IconButton } from '../../ui/controls';
import { chooseAction } from '../../ui/dialog';
import { Field } from '../../ui/Field';
import { TYPE, UI } from '../../ui/theme';
import { parsePost } from '../pasteAll';

const EXAMPLE = `Vláda ruší pravidla pro školní obědy,
ministr je nazval „zlem“

---

Co se stalo. Vláda zrušila vyhlášku…

---

Proč to vadí. Pravidla chránila děti…`;

export function PasteAllSheet({
  visible,
  onClose,
  onApply,
  hasContent,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (slides: Slide[], replace: boolean) => void;
  hasContent: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const slides = text.trim() ? parsePost(text) : [];

  const apply = () => {
    if (!slides.length) return;
    if (!hasContent) {
      onApply(slides, true);
      setText('');
      return;
    }
    chooseAction(
      'Vložit slajdy',
      [
        { label: 'Přidat na konec', onPress: () => (onApply(slides, false), setText('')) },
        { label: 'Nahradit vše', destructive: true, onPress: () => (onApply(slides, true), setText('')) },
      ],
      'Carousel už obsahuje text.',
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { paddingBottom: insets.bottom }]}>
        <View style={styles.head}>
          <IconButton icon="close" label="Zavřít" onPress={onClose} />
          <Text style={TYPE.headline}>Vložit celý příspěvek</Text>
          <View style={{ width: UI.hit }} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={TYPE.callout}>
            Slajdy odděl řádkem <Text style={{ color: UI.accent, fontWeight: '700' }}>---</Text>. První blok je titulní (1. řádek bílý, 2. azurový), další jsou textové.
            Krátká první věta („Co se stalo.“) se stane štítkem. Blok začínající uvozovkami je citace (pod ní jméno a role).
          </Text>
          <Button
            compact
            icon="clipboard"
            label="Vložit ze schránky"
            onPress={async () => {
              const t = await Clipboard.getStringAsync();
              if (t) setText(t);
            }}
          />
          <Field multiline value={text} onChangeText={setText} placeholder={EXAMPLE} style={{ minHeight: 240 }} label="Text příspěvku" />
          {slides.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={TYPE.footnote}>Vznikne {slides.length} slajdů:</Text>
              {slides.map((s, i) => (
                <Text key={s.id} style={styles.preview} numberOfLines={1}>
                  {i + 1}. {SLIDE_TYPE_LABEL[s.type]} –{' '}
                  {s.type === 'cover' ? `${s.titleWhite} ${s.titleCyan}` : s.type === 'text' ? `${s.label ? `[${s.label}] ` : ''}${s.body}` : s.quotes[0].text}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button kind="primary" icon="albums" label={slides.length ? `Vytvořit ${slides.length} slajdů` : 'Vytvořit slajdy'} onPress={apply} disabled={!slides.length} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 56 },
  body: { padding: UI.gutter, gap: 14 },
  preview: { color: UI.textDim, fontSize: 14 },
  footer: { paddingHorizontal: UI.gutter, paddingTop: 8 },
});
