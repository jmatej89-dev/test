import { Switch, Text, View } from 'react-native';
import { convertSlide } from '../../../model/factory';
import { SLIDE_TYPE_LABEL, type SlideType } from '../../../model/types';
import { Button, Section, Segmented } from '../../../ui/controls';
import { Slider } from '../../../ui/Slider';
import { TYPE, UI } from '../../../ui/theme';
import { useEditor } from '../EditorContext';

export function StylePanel() {
  const { slide, updateSlide } = useEditor();
  const fade = slide.photo?.fade ?? 1;
  const fadeOn = fade > 0;
  const setFade = (v: number, key?: string) => updateSlide((s) => (s.photo ? { ...s, photo: { ...s.photo, fade: v } } : s), key);
  return (
    <View style={{ gap: 4 }}>
      <Section title="Typ slajdu">
        <Segmented
          label="Typ slajdu"
          value={slide.type}
          options={(['cover', 'text', 'quote'] as SlideType[]).map((t) => ({ value: t, label: SLIDE_TYPE_LABEL[t] }))}
          onChange={(t) => updateSlide((s) => convertSlide(s, t))}
        />
      </Section>
      <Section title="Přechod fotky do tmavé">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={TYPE.headline}>Plný přechod</Text>
            <Text style={TYPE.footnote}>Vypnutý = jen krátký měkký okraj, nikdy ostrý řez.</Text>
          </View>
          <Switch
            value={fadeOn}
            disabled={!slide.photo}
            onValueChange={(v) => setFade(v ? 1 : 0)}
            trackColor={{ true: UI.accent }}
            accessibilityLabel="Plný přechod fotky"
          />
        </View>
        {fadeOn && slide.photo && (
          <Slider label="Intenzita přechodu" value={fade} min={0.4} max={1.5} step={0.05} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFade(v, 'fade')} />
        )}
      </Section>
      <Section title="Značka">
        <Text style={TYPE.footnote}>Barvy, písmo Montserrat, vodoznak a rozložení jsou pevně dané značkou. Vodoznak lze přejmenovat v Nastavení.</Text>
        <Button
          icon="refresh"
          label="Výchozí nastavení slajdu"
          onPress={() =>
            updateSlide((s) => {
              const next = { ...s, fsOverride: undefined, photo: s.photo ? { ...s.photo, fade: 1 } : null };
              if (next.type !== 'cover') delete (next as { headerH?: number }).headerH;
              return next;
            })
          }
        />
      </Section>
    </View>
  );
}
