import { StyleSheet, Text, View } from 'react-native';
import type { CoverSlide, QuoteItem, QuoteSlide, TextSlide } from '../../../model/types';
import { applySuggestion, fixTypography, needsTypographyFix, profanitySuggestions } from '../../../text/czech';
import { plainOf } from '../../../text/markup';
import { Segmented, Tag } from '../../../ui/controls';
import { Field } from '../../../ui/Field';
import { RichField } from '../../../ui/RichField';
import { TYPE } from '../../../ui/theme';
import { useEditor } from '../EditorContext';

/** Suggestions under a field: typography fix and masking of vulgar words (never automatic). */
export function TextHelpers({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const plain = plainOf(value);
  const prof = profanitySuggestions(plain);
  const typo = plain.trim().length > 0 && needsTypographyFix(plain);
  if (!typo && !prof.length) return null;
  return (
    <View style={styles.helpers}>
      {typo && <Tag tone="info" text="Typografie (uvozovky, …, pomlčky)" action="Opravit" onPress={() => onChange(fixTypography(value))} />}
      {prof.map((s) => (
        <Tag key={`${s.from}${s.index}`} tone="info" text={`„${s.from}“ → „${s.to}“`} action="Maskovat" onPress={() => onChange(applySuggestion(value, s))} />
      ))}
    </View>
  );
}

function CoverText({ slide }: { slide: CoverSlide }) {
  const { updateSlide, onFieldFocus } = useEditor();
  const set = (k: 'titleWhite' | 'titleCyan', v: string) => updateSlide((s) => ({ ...s, [k]: v.replace(/[{}]/g, '') }) as CoverSlide, k);
  return (
    <View style={styles.col}>
      <RichField big label="Titulek – bílá část" value={slide.titleWhite} highlight={false} placeholder="Vláda ruší závazná pravidla…" onChange={(v) => set('titleWhite', v)} onFocus={onFieldFocus} />
      <TextHelpers value={slide.titleWhite} onChange={(v) => set('titleWhite', v)} />
      <RichField big allCyan label="Titulek – azurová část" value={slide.titleCyan} highlight={false} placeholder="…ministr je nazval „zlem“" onChange={(v) => set('titleCyan', v)} onFocus={onFieldFocus} />
      <TextHelpers value={slide.titleCyan} onChange={(v) => set('titleCyan', v)} />
      <Text style={TYPE.footnote}>Řádky se zalomí samy. Nový řádek (Enter) vynutí zalomení, znak ~ je pevná mezera.</Text>
    </View>
  );
}

function TextText({ slide }: { slide: TextSlide }) {
  const { updateSlide, onFieldFocus } = useEditor();
  return (
    <View style={styles.col}>
      <Field
        label="Štítek (azurově na začátku)"
        placeholder="Co se stalo."
        value={slide.label ?? ''}
        onFocus={onFieldFocus}
        onChangeText={(t) => updateSlide((s) => ({ ...s, label: t.replace(/[{}]/g, '') }) as TextSlide, 'label')}
      />
      <RichField
        label="Text"
        value={slide.body}
        placeholder="Vlož nebo napiš text slajdu…"
        onFocus={onFieldFocus}
        onChange={(v) => updateSlide((s) => ({ ...s, body: v }) as TextSlide, 'body')}
      />
      <TextHelpers value={slide.body} onChange={(v) => updateSlide((s) => ({ ...s, body: v }) as TextSlide)} />
    </View>
  );
}

function QuoteText({ slide }: { slide: QuoteSlide }) {
  const { updateSlide, onFieldFocus } = useEditor();
  const setQ = (i: number, patch: Partial<QuoteItem>, key: string) =>
    updateSlide((s) => {
      const q = s as QuoteSlide;
      return { ...q, quotes: q.quotes.map((x, j) => (j === i ? { ...x, ...patch } : x)) };
    }, `${key}${i}`);
  const setCount = (n: 1 | 2) =>
    updateSlide((s) => {
      const q = s as QuoteSlide;
      if (n === 1) return { ...q, quotes: q.quotes.slice(0, 1) };
      return { ...q, quotes: [q.quotes[0], q.quotes[1] ?? { text: '', name: '', role: '' }] };
    });
  return (
    <View style={styles.col}>
      <Segmented
        label="Počet citací"
        value={slide.quotes.length >= 2 ? 2 : 1}
        options={[
          { value: 1, label: '1 citace' },
          { value: 2, label: '2 citace' },
        ]}
        onChange={(v) => setCount(v as 1 | 2)}
      />
      {slide.quotes.map((q, i) => (
        <View key={i} style={styles.quote}>
          {slide.quotes.length > 1 && <Text style={TYPE.headline}>Citace {i + 1}</Text>}
          <RichField label="Citace (uvozovky doplní appka)" value={q.text} placeholder="…nesmyslné progresivistické zlo." onFocus={onFieldFocus} onChange={(v) => setQ(i, { text: v }, 'text')} />
          <TextHelpers value={q.text} onChange={(v) => setQ(i, { text: v }, 'fix')} />
          <Field label="Jméno" placeholder="Jan Novák" value={q.name} onFocus={onFieldFocus} onChangeText={(t) => setQ(i, { name: t.replace(/[{}]/g, '') }, 'name')} />
          <Field label="Role / datum" placeholder="ministr, 12. 11. 2026" value={q.role} onFocus={onFieldFocus} onChangeText={(t) => setQ(i, { role: t.replace(/[{}]/g, '') }, 'role')} />
        </View>
      ))}
    </View>
  );
}

export function TextPanel() {
  const { slide } = useEditor();
  if (slide.type === 'cover') return <CoverText slide={slide} />;
  if (slide.type === 'text') return <TextText slide={slide} />;
  return <QuoteText slide={slide} />;
}

const styles = StyleSheet.create({
  col: { gap: 12 },
  quote: { gap: 10, paddingTop: 4 },
  helpers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
