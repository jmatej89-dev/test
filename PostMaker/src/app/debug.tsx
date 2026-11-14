/** Debug: renders the seed project with the production renderer and lists layout numbers. */
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { seedSlides } from '../model/seed';
import { SlideCanvas, useSlideLayout } from '../render/SlideCanvas';
import { useStore } from '../store/projects';
import { IconButton } from '../ui/controls';
import { TYPE, UI } from '../ui/theme';
import type { Slide } from '../model/types';

function Row({ slide, width, watermark }: { slide: Slide; width: number; watermark: string }) {
  const layout = useSlideLayout(slide, watermark);
  return (
    <View style={styles.row}>
      <SlideCanvas slide={slide} width={width} watermark={watermark} layout={layout} />
      <Text style={styles.meta}>
        {slide.type} · písmo {layout?.fs} px{layout?.auto ? ' (auto)' : ''} · hlavička {layout?.header.h} · spodek {layout?.textBottom.toFixed(0)}
        {layout?.issues.length ? `\n⚠︎ ${layout.issues.map((i) => i.message).join(' ')}` : '\n✓ bez problémů'}
      </Text>
    </View>
  );
}

export default function Debug() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const watermark = useStore((s) => s.settings.watermark);
  const slides = useMemo(() => seedSlides(), []);
  return (
    <View style={{ flex: 1, backgroundColor: UI.bg, paddingTop: insets.top }}>
      <View style={styles.head}>
        <IconButton icon="chevron-back" label="Zpět" onPress={() => router.back()} />
        <Text style={TYPE.headline}>Debug renderu</Text>
        <View style={{ width: UI.hit }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: UI.gutter, paddingBottom: insets.bottom + 40, gap: 28 }}>
        {slides.map((s) => (
          <Row key={s.id} slide={s} width={width - UI.gutter * 2} watermark={watermark} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 52 },
  row: { gap: 8 },
  meta: { ...TYPE.footnote },
});
