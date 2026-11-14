/**
 * Highlighting by tapping words – the fastest way on a phone. Cover: tap the word where the
 * cyan part starts. Text / quotes: tap words to toggle cyan.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CoverSlide, QuoteSlide, TextSlide } from '../../../model/types';
import { highlightedWords, parseMarkup, toggleHighlight } from '../../../text/markup';
import { haptic } from '../../../ui/haptics';
import { TYPE, UI } from '../../../ui/theme';
import { useEditor } from '../EditorContext';

type Word = { text: string; start: number; end: number; hl: boolean };

function wordsOf(markup: string): Word[] {
  const r = parseMarkup(markup);
  const out: Word[] = [];
  const re = /[^\s~]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(r.text))) out.push({ text: m[0], start: m.index, end: m.index + m[0].length, hl: r.hl.slice(m.index, m.index + m[0].length).some(Boolean) });
  return out;
}

function Chip({ w, onPress }: { w: { text: string; hl: boolean }; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: w.hl }}
      accessibilityLabel={`${w.text}${w.hl ? ', zvýrazněno' : ''}`}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, w.hl && styles.chipOn, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.chipText, w.hl && styles.chipTextOn]}>{w.text}</Text>
    </Pressable>
  );
}

function WordToggles({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const words = wordsOf(value);
  if (!words.length) return <Text style={TYPE.footnote}>Nejdřív napiš text v nástroji Text.</Text>;
  return (
    <View style={styles.wrap}>
      {words.map((w, i) => (
        <Chip key={`${i}-${w.start}`} w={w} onPress={() => onChange(toggleHighlight(value, w.start, w.end))} />
      ))}
    </View>
  );
}

function CoverSplit({ slide }: { slide: CoverSlide }) {
  const { updateSlide } = useEditor();
  const white = slide.titleWhite.trim().split(/ +/).filter(Boolean);
  const cyan = slide.titleCyan.trim().split(/ +/).filter(Boolean);
  const all = [...white.map((t) => ({ text: t, hl: false })), ...cyan.map((t) => ({ text: t, hl: true }))];
  const split = (k: number) =>
    updateSlide((s) => {
      const words = [...white, ...cyan];
      // Tapping the first cyan word again turns the whole title white.
      const at = k === white.length ? words.length : k;
      return { ...(s as CoverSlide), titleWhite: words.slice(0, at).join(' '), titleCyan: words.slice(at).join(' ') };
    });
  return (
    <View style={{ gap: 12 }}>
      <Text style={TYPE.footnote}>Klepni na slovo, kterým začíná azurová část titulku.</Text>
      <View style={styles.wrap}>
        {all.map((w, i) => (
          <Chip key={i} w={w} onPress={() => split(i)} />
        ))}
      </View>
    </View>
  );
}

export function HighlightPanel() {
  const { slide, updateSlide } = useEditor();
  if (slide.type === 'cover') return <CoverSplit slide={slide} />;
  if (slide.type === 'text') {
    return (
      <View style={{ gap: 12 }}>
        <Text style={TYPE.footnote}>Klepni na slova, která mají být azurová. Štítek je azurový vždy.</Text>
        <WordToggles value={slide.body} onChange={(v) => updateSlide((s) => ({ ...(s as TextSlide), body: v }))} />
      </View>
    );
  }
  return (
    <View style={{ gap: 18 }}>
      {slide.quotes.map((q, i) => {
        const n = highlightedWords(q.text).length;
        return (
          <View key={i} style={{ gap: 10 }}>
            <Text style={TYPE.footnote}>
              {slide.quotes.length > 1 ? `Citace ${i + 1} · ` : ''}zvýrazněno {n} {n === 1 ? 'slovo' : n >= 2 && n <= 4 ? 'slova' : 'slov'} (doporučeno 2–3)
            </Text>
            <WordToggles
              value={q.text}
              onChange={(v) =>
                updateSlide((s) => {
                  const qs = s as QuoteSlide;
                  return { ...qs, quotes: qs.quotes.map((x, j) => (j === i ? { ...x, text: v } : x)) };
                })
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: UI.hit,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.lineStrong,
  },
  chipOn: { backgroundColor: 'rgba(92,225,230,0.18)', borderColor: UI.accent },
  chipText: { color: UI.text, fontSize: 17, fontWeight: '600' },
  chipTextOn: { color: UI.accent },
});
