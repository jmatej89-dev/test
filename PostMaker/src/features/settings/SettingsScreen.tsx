import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_RISKY_WORDS, WATERMARK } from '../../brand';
import { useStore } from '../../store/projects';
import { normalizeHashtag } from '../../text/czech';
import { Button, Icon, IconButton, Section, Segmented } from '../../ui/controls';
import { Field } from '../../ui/Field';
import { TYPE, UI } from '../../ui/theme';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.settings);
  const set = useStore((st) => st.setSettings);
  const reset = useStore((st) => st.resetSettings);
  const [word, setWord] = useState('');
  const [repl, setRepl] = useState('');
  const [tags, setTags] = useState(s.defaultHashtags.join(' '));

  const addWord = () => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    set({ riskyWords: { ...s.riskyWords, [w]: repl.trim() || '—' } });
    setWord('');
    setRepl('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={[styles.head, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top }]}>
        <IconButton icon="chevron-down" label="Zavřít nastavení" onPress={() => router.back()} />
        <Text style={TYPE.headline} accessibilityRole="header">
          Nastavení
        </Text>
        <View style={{ width: UI.hit }} />
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Section title="Vodoznak">
          <Field value={s.watermark} onChangeText={(t) => set({ watermark: t })} placeholder={WATERMARK.defaultText} help="Vpravo dole na každém slajdu. Nejde vypnout." accessibilityLabel="Text vodoznaku" />
        </Section>

        <Section title="Fixní věty popisku">
          <Field label="Výzva ke komentářům" value={s.ctaComment} onChangeText={(t) => set({ ctaComment: t })} />
          <Field label="Výzva ke sledování" multiline value={s.ctaFollow} onChangeText={(t) => set({ ctaFollow: t })} />
        </Section>

        <Section title="Výchozí hashtagy">
          <Field
            value={tags}
            onChangeText={setTags}
            onEndEditing={() => {
              const list = tags.split(/[\s,]+/).map(normalizeHashtag).filter(Boolean).slice(0, 5);
              set({ defaultHashtags: list });
              setTags(list.join(' '));
            }}
            placeholder="#politika #cesko"
            autoCapitalize="none"
            autoCorrect={false}
            help="Předvyplní se do nových carouselů (max 5, malá písmena bez diakritiky)."
            accessibilityLabel="Výchozí hashtagy"
          />
        </Section>

        <Section title="Výchozí typ nového slajdu">
          <Segmented
            label="Výchozí typ nového slajdu"
            value={s.defaultSlideType}
            options={[
              { value: 'text', label: 'Text' },
              { value: 'quote', label: 'Citace' },
            ]}
            onChange={(v) => set({ defaultSlideType: v })}
          />
        </Section>

        <Section title="Rizikové výrazy (shadow-ban)">
          <Text style={TYPE.footnote}>Kořen slova → návrh náhrady. Hlídá se v popisku i na slajdech.</Text>
          {Object.entries(s.riskyWords).map(([k, v]) => (
            <View key={k} style={styles.wordRow}>
              <Text style={styles.word}>{k}</Text>
              <Icon name="arrow-forward" size={14} color={UI.textFaint} />
              <Text style={[styles.word, { color: UI.accent, flex: 1 }]} numberOfLines={1}>
                {v}
              </Text>
              <IconButton
                icon="trash-outline"
                label={`Odebrat ${k}`}
                size={18}
                onPress={() => {
                  const next = { ...s.riskyWords };
                  delete next[k];
                  set({ riskyWords: next });
                }}
              />
            </View>
          ))}
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field value={word} onChangeText={setWord} placeholder="slovo" autoCapitalize="none" accessibilityLabel="Rizikové slovo" />
            </View>
            <View style={{ flex: 1 }}>
              <Field value={repl} onChangeText={setRepl} placeholder="náhrada" autoCapitalize="none" accessibilityLabel="Náhrada" onSubmitEditing={addWord} />
            </View>
            <IconButton icon="add-circle" label="Přidat rizikové slovo" onPress={addWord} disabled={!word.trim()} />
          </View>
          <Button compact kind="plain" label="Obnovit výchozí seznam" onPress={() => set({ riskyWords: DEFAULT_RISKY_WORDS })} />
        </Section>

        <Section title="Ovládání">
          <View style={styles.switchRow}>
            <Text style={[TYPE.body, { flex: 1 }]}>Haptika</Text>
            <Switch value={s.haptics} onValueChange={(v) => set({ haptics: v })} trackColor={{ true: UI.accent }} accessibilityLabel="Haptika" />
          </View>
        </Section>

        <Section title="Nástroje">
          <Pressable style={styles.link} onPress={() => router.push(`/editor/${useStore.getState().createSeed()}`)} accessibilityRole="button">
            <Text style={TYPE.body}>Vytvořit ukázkový carousel</Text>
            <Icon name="chevron-forward" size={18} color={UI.textFaint} />
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.push('/debug')} accessibilityRole="button">
            <Text style={TYPE.body}>Debug renderu</Text>
            <Icon name="chevron-forward" size={18} color={UI.textFaint} />
          </Pressable>
        </Section>

        <Button
          kind="danger"
          label="Obnovit výchozí nastavení"
          onPress={() =>
            Alert.alert('Obnovit výchozí nastavení?', undefined, [
              { text: 'Zrušit', style: 'cancel' },
              { text: 'Obnovit', style: 'destructive', onPress: () => (reset(), setTags('')) },
            ])
          }
        />
        <Text style={[TYPE.caption, { textAlign: 'center', marginTop: 12 }]}>Vše zůstává jen v tomto telefonu. Žádné účty, žádná analytika.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 4 },
  body: { padding: UI.gutter },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: UI.hit },
  word: { color: UI.text, fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: UI.hit },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: UI.line },
});
