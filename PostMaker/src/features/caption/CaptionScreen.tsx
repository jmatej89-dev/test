import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { todayCz } from '../../model/factory';
import type { Caption } from '../../model/types';
import { useStore } from '../../store/projects';
import { countSentences, normalizeHashtag, riskyWordHits } from '../../text/czech';
import { Button, Icon, IconButton, Section, Tag } from '../../ui/controls';
import { Field } from '../../ui/Field';
import { Glass } from '../../ui/Glass';
import { haptic } from '../../ui/haptics';
import { TYPE, UI } from '../../ui/theme';
import { buildCaption, photoCreditsFromSlides } from '../caption';

function Chips({ items, onRemove, label }: { items: string[]; onRemove: (i: number) => void; label: string }) {
  if (!items.length) return null;
  return (
    <View style={styles.chips}>
      {items.map((t, i) => (
        <Pressable
          key={`${t}${i}`}
          onPress={() => {
            haptic.select();
            onRemove(i);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${t}, klepnutím odeberete`}
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.chipText}>{t}</Text>
          <Icon name="close" size={14} color={UI.textDim} />
        </Pressable>
      ))}
    </View>
  );
}

function replaceWord(text: string, from: string, to: string) {
  return text.replace(new RegExp(`(?<![\\p{L}])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'gu'), (m) =>
    m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to,
  );
}

export function CaptionScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const project = useStore((s) => s.projects[id]);
  const settings = useStore((s) => s.settings);
  const updateCaption = useStore((s) => s.updateCaption);
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [copied, setCopied] = useState(false);

  // Prefill photo credit from slides the first time.
  useEffect(() => {
    if (project && !project.caption.photoCredit.trim()) {
      const credits = photoCreditsFromSlides(project);
      if (credits) updateCaption(id, { photoCredit: credits });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!project) return null;
  const c = project.caption;
  const set = (patch: Partial<Caption>, key?: string) => {
    setCopied(false);
    updateCaption(id, patch, key);
  };

  const sentences = countSentences(c.body);
  const badTags = c.hashtags.some((h) => normalizeHashtag(h) !== h);
  const risky = riskyWordHits(`${c.body}\n${c.question}`, settings.riskyWords);
  const text = buildCaption(c, settings);

  const addSource = () => {
    const parts = source.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) set({ sources: [...c.sources, ...parts.filter((p) => !c.sources.includes(p))] });
    setSource('');
  };
  const addTags = () => {
    const parts = tag.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith('#') ? t : `#${t}`));
    if (parts.length) set({ hashtags: [...c.hashtags, ...parts.filter((p) => !c.hashtags.includes(p))] });
    setTag('');
  };

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    haptic.success();
    setCopied(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={[styles.head, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top }]}>
        <IconButton icon="chevron-down" label="Zavřít popisek" onPress={() => router.back()} />
        <Text style={TYPE.headline} accessibilityRole="header">
          Popisek
        </Text>
        <View style={{ width: UI.hit }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Section title="Hlavní text" right={<Text style={[styles.counter, (sentences < 2 || sentences > 5) && { color: UI.warn }]}>{sentences} {sentences === 1 ? 'věta' : sentences >= 2 && sentences <= 4 ? 'věty' : 'vět'} · ideál 2–5</Text>}>
          <Field multiline value={c.body} onChangeText={(t) => set({ body: t }, 'body')} placeholder="1–5 vět, neformálně, o čem příspěvek je." />
          {c.body.trim().length > 0 && sentences < 2 && <Tag text="Jen 1 věta – přidej aspoň jednu" />}
          {sentences > 5 && <Tag text={`${sentences} vět – zkrať na max 5`} />}
        </Section>

        <Section title="Otázka">
          <Field value={c.question} onChangeText={(t) => set({ question: t }, 'question')} placeholder="Měly by školy dodržovat pravidla?" help={`Appka doplní: „${settings.ctaComment}“`} />
        </Section>

        {risky.length > 0 && (
          <Section title="Riziko omezení dosahu">
            {risky.map((r, i) => (
              <Tag
                key={`${r.from}${i}`}
                text={`„${r.from}“ → „${r.to}“`}
                action="Nahradit"
                onPress={() => set({ body: replaceWord(c.body, r.from, r.to), question: replaceWord(c.question, r.from, r.to) })}
              />
            ))}
          </Section>
        )}

        <Section title="Zdroje">
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field value={source} onChangeText={setSource} placeholder="např. ČTK, iROZHLAS" onSubmitEditing={addSource} returnKeyType="done" accessibilityLabel="Nový zdroj" />
            </View>
            <Button compact icon="add" label="Přidat" onPress={addSource} disabled={!source.trim()} />
          </View>
          <Chips items={c.sources} label="Zdroj" onRemove={(i) => set({ sources: c.sources.filter((_, j) => j !== i) })} />
          {!c.sources.length && <Tag text="Chybí zdroj" />}
        </Section>

        <Section title="Datum" right={<Button compact kind="plain" label="Dnes" onPress={() => set({ date: todayCz() })} />}>
          <Field value={c.date} onChangeText={(t) => set({ date: t }, 'date')} placeholder="14. 11. 2026" accessibilityLabel="Datum" />
        </Section>

        <Section
          title="Foto"
          right={<Button compact kind="plain" label="Ze slajdů" onPress={() => set({ photoCredit: photoCreditsFromSlides(project) })} disabled={!photoCreditsFromSlides(project)} />}
        >
          <Field value={c.photoCredit} onChangeText={(t) => set({ photoCredit: t }, 'photo')} placeholder="ČTK / jméno fotografa" accessibilityLabel="Zdroj fotek" />
          {!c.photoCredit.trim() && <Tag text="Chybí zdroj fotek" />}
        </Section>

        <Section title="Hashtagy" right={<Text style={[styles.counter, c.hashtags.length > 5 && { color: UI.warn }]}>{c.hashtags.length}/5</Text>}>
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field value={tag} onChangeText={setTag} placeholder="#politika" autoCapitalize="none" autoCorrect={false} onSubmitEditing={addTags} returnKeyType="done" accessibilityLabel="Nový hashtag" />
            </View>
            <Button compact icon="add" label="Přidat" onPress={addTags} disabled={!tag.trim()} />
          </View>
          <Chips items={c.hashtags} label="Hashtag" onRemove={(i) => set({ hashtags: c.hashtags.filter((_, j) => j !== i) })} />
          {(badTags || c.hashtags.length > 5) && (
            <Tag
              text={c.hashtags.length > 5 ? 'Víc než 5 hashtagů, velká písmena nebo diakritika' : 'Hashtagy mají velká písmena nebo diakritiku'}
              action="Opravit"
              onPress={() => {
                const fixed: string[] = [];
                for (const h of c.hashtags.map(normalizeHashtag)) if (h && !fixed.includes(h)) fixed.push(h);
                set({ hashtags: fixed.slice(0, 5) });
              }}
            />
          )}
        </Section>

        <Section title="Náhled">
          <View style={styles.preview}>
            <Text style={styles.previewText} selectable>
              {text || 'Vyplň hlavní text.'}
            </Text>
          </View>
        </Section>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <Glass radius={28} style={{ padding: 8 }}>
          <Button kind="primary" icon={copied ? 'checkmark' : 'copy-outline'} label={copied ? 'Zkopírováno' : 'Kopírovat'} onPress={copy} disabled={!text} />
        </Glass>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 4 },
  body: { padding: UI.gutter, paddingBottom: 140 },
  counter: { ...TYPE.footnote, fontVariant: ['tabular-nums'] },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(92,225,230,0.14)' },
  chipText: { color: UI.text, fontSize: 15 },
  preview: { backgroundColor: UI.bgRaised, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: UI.line },
  previewText: { color: UI.text, fontSize: 15, lineHeight: 22 },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 0 },
});
