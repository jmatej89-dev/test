import { StyleSheet, Text, View } from 'react-native';
import { COVER, QUOTE, TEXT } from '../../../brand';
import type { HeaderHeight, Slide } from '../../../model/types';
import { Button, Section, Segmented } from '../../../ui/controls';
import { Slider } from '../../../ui/Slider';
import { TYPE, UI } from '../../../ui/theme';
import { useEditor } from '../EditorContext';

function range(type: Slide['type']) {
  if (type === 'cover') return { min: 44, max: 96 };
  if (type === 'text') return { min: 32, max: 72 };
  return { min: 30, max: 72 };
}

export function SizePanel() {
  const { slide, layout, updateSlide } = useEditor();
  const auto = slide.fsOverride === undefined;
  const fs = layout?.fs ?? (slide.type === 'cover' ? COVER.fsMax : TEXT.fsMax);
  const { min, max } = range(slide.type);

  const header = slide.type === 'cover' ? null : (slide.headerH ?? null);
  const headerOptions: { value: number; label: string }[] =
    slide.type === 'quote'
      ? [
          { value: 0, label: 'Auto' },
          { value: 420, label: 'Nižší' },
          { value: 547, label: 'Výchozí' },
          { value: 600, label: 'Vyšší' },
        ]
      : [
          { value: 420, label: 'Nižší' },
          { value: 547, label: 'Výchozí' },
          { value: 600, label: 'Vyšší' },
        ];

  return (
    <View style={{ gap: 6 }}>
      <Section
        title="Velikost písma"
        right={
          <Text style={[styles.badge, auto ? styles.auto : styles.manual]} accessibilityLabel={auto ? 'Automatická velikost' : 'Ruční velikost'}>
            {auto ? 'AUTO' : 'RUČNĚ'} · {fs} px
          </Text>
        }
      >
        <Slider
          label="Velikost písma"
          value={fs}
          min={min}
          max={max}
          step={2}
          format={(v) => `${v} pixelů`}
          onChange={(v) => updateSlide((s) => ({ ...s, fsOverride: v }), 'fs')}
        />
        <View style={styles.row}>
          <Button compact icon="remove" label="Menší" onPress={() => updateSlide((s) => ({ ...s, fsOverride: Math.max(min, fs - 2) }), 'fs')} style={{ flex: 1 }} />
          <Button compact icon="add" label="Větší" onPress={() => updateSlide((s) => ({ ...s, fsOverride: Math.min(max, fs + 2) }), 'fs')} style={{ flex: 1 }} />
        </View>
        {!auto && <Button kind="plain" icon="refresh" label="Obnovit auto" onPress={() => updateSlide((s) => ({ ...s, fsOverride: undefined }))} />}
        <Text style={TYPE.footnote}>
          {slide.type === 'cover'
            ? `Auto volí největší velikost ${COVER.fsMin}–${COVER.fsMax} px, aby se titulek vešel.`
            : slide.type === 'text'
              ? `Auto volí největší velikost ${TEXT.fsMin}–${TEXT.fsMax} px bez sirotka a nad spodním okrajem.`
              : `Auto zkouší ${QUOTE.fsMax}–${QUOTE.fsMin} px a podle potřeby zkrátí hlavičku.`}
        </Text>
      </Section>
      {slide.type !== 'cover' && (
        <Section title="Hlavička fotky">
          <Segmented
            label="Výška hlavičky s fotkou"
            value={header ?? (slide.type === 'quote' ? 0 : 547)}
            options={headerOptions}
            onChange={(v) => updateSlide((s) => ({ ...s, headerH: v === 0 ? undefined : (v as HeaderHeight) }))}
          />
          {layout && <Text style={TYPE.footnote}>Aktuálně {layout.header.h} px.</Text>}
        </Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', letterSpacing: 0.4 },
  auto: { color: UI.onAccent, backgroundColor: UI.accent },
  manual: { color: UI.onAccent, backgroundColor: UI.warn },
});
