import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import type { PhotoRef } from '../../../model/types';
import { clipboardHasImage, pastePhotoFromClipboard, pickPhotoFromLibrary } from '../../../store/photos';
import { Button, Section, Tag } from '../../../ui/controls';
import { Field } from '../../../ui/Field';
import { Slider } from '../../../ui/Slider';
import { TYPE, UI } from '../../../ui/theme';
import { isLowRes } from '../../check';
import { useEditor } from '../EditorContext';

export function PhotoPanel() {
  const { slide, layout, updateSlide, safeZone, setSafeZone, onFieldFocus } = useEditor();
  const photo = slide.photo;
  const [canPaste, setCanPaste] = useState(false);
  useEffect(() => {
    clipboardHasImage().then(setCanPaste);
  }, []);

  const setPhoto = (p: PhotoRef | null) =>
    updateSlide((s) => ({ ...s, photo: p ? { ...p, credit: p.credit ?? s.photo?.credit, fade: s.photo?.fade ?? 1 } : null }));
  const patch = (p: Partial<PhotoRef>, key?: string) => updateSlide((s) => (s.photo ? { ...s, photo: { ...s.photo, ...p } } : s), key);

  const pick = async () => {
    try {
      const p = await pickPhotoFromLibrary();
      if (p) setPhoto(p);
    } catch (e) {
      Alert.alert('Fotku se nepodařilo načíst', String((e as Error).message ?? e));
    }
  };
  const paste = async () => {
    try {
      const p = await pastePhotoFromClipboard();
      if (p) setPhoto(p);
      else Alert.alert('Ve schránce není obrázek', 'Zkopíruj fotku a zkus to znovu.');
    } catch (e) {
      Alert.alert('Vložení se nepovedlo', String((e as Error).message ?? e));
    }
  };

  if (!photo) {
    return (
      <View style={styles.col}>
        <Text style={TYPE.callout}>Slajd zatím nemá fotku. Vyber skutečnou fotku – obličeje musí být celé vidět.</Text>
        <Button kind="primary" icon="images" label="Vybrat fotku" onPress={pick} />
        <Button icon="clipboard" label="Vložit ze schránky" onPress={paste} disabled={!canPaste} hint={canPaste ? undefined : 'Ve schránce není obrázek'} />
      </View>
    );
  }

  const placeholder = photo.uri.startsWith('placeholder:');
  const low = layout ? isLowRes(slide, layout.header.h) : false;

  return (
    <View style={styles.col}>
      <Text style={TYPE.footnote}>Posuň a přibliž fotku dvěma prsty přímo v náhledu.</Text>
      {low && <Tag text="Nízké rozlišení, fotka bude měkká" />}
      {placeholder && <Tag tone="info" text="Ukázková výplň – vyber skutečnou fotku" />}
      <View style={styles.row}>
        <Button compact icon="images" label="Vyměnit" onPress={pick} style={styles.flex} />
        <Button compact icon="clipboard" label="Vložit" onPress={paste} disabled={!canPaste} style={styles.flex} />
      </View>
      <View style={styles.row}>
        <Button compact icon="scan" label="Vycentrovat" onPress={() => patch({ cx: 0.5, cy: 0.4, zoom: 1 })} style={styles.flex} />
        <Button
          compact
          kind="danger"
          icon="trash"
          label="Odebrat"
          onPress={() => setPhoto(null)}
          style={styles.flex}
        />
      </View>
      <Section title="Přiblížení">
        <Slider label="Přiblížení fotky" value={photo.zoom} min={1} max={4} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ zoom: v }, 'zoom')} />
      </Section>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={TYPE.headline}>Pomocník pro obličej</Text>
          <Text style={TYPE.footnote}>Ukáže, kde začíná přechod do tmavé. Obličej má být celý nad čarou.</Text>
        </View>
        <Switch value={safeZone} onValueChange={setSafeZone} trackColor={{ true: UI.accent }} accessibilityLabel="Pomocník pro obličej" />
      </View>
      <Field
        label="Zdroj fotky (jen do popisku)"
        placeholder="např. ČTK / Michal Krumphanzl"
        value={photo.credit ?? ''}
        onFocus={onFieldFocus}
        onChangeText={(t) => patch({ credit: t }, 'credit')}
        help="Na obrázku se nikdy nezobrazí."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
});
