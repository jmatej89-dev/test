import * as Clipboard from 'expo-clipboard';
import type { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Project } from '../../model/types';
import { useRender } from '../../render/RenderContext';
import { useStore } from '../../store/projects';
import { Button, Icon } from '../../ui/controls';
import { Glass } from '../../ui/Glass';
import { haptic } from '../../ui/haptics';
import { TYPE, UI } from '../../ui/theme';
import { buildCaption } from '../caption';
import { renderProjectPngs, saveToPhotos } from '../exporter';

type Phase = { kind: 'idle' } | { kind: 'rendering'; done: number; total: number } | { kind: 'done'; message: string } | { kind: 'error'; message: string };

export function ExportSheet({ visible, onClose, project }: { visible: boolean; onClose: () => void; project: Project }) {
  const r = useRender();
  const settings = useStore((s) => s.settings);
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [shareNext, setShareNext] = useState<{ files: File[]; index: number } | null>(null);
  const files = useRef<{ key: string; files: File[] } | null>(null);
  const progress = useSharedValue(0);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const close = () => {
    setPhase({ kind: 'idle' });
    setShareNext(null);
    onClose();
  };

  const busy = phase.kind === 'rendering';
  const total = project.slides.length;

  const render = async (): Promise<File[]> => {
    if (!r) throw new Error('Písmo se ještě načítá.');
    progress.set(0);
    const key = `${project.updatedAt}|${settings.watermark}`;
    if (files.current?.key === key && files.current.files.every((f) => f.exists)) return files.current.files;
    const out = await renderProjectPngs(project, settings.watermark, r.fonts, r.measurer, (done, t) => {
      setPhase({ kind: 'rendering', done, total: t });
      progress.set(withTiming(done / t, { duration: 260 }));
    });
    files.current = { key, files: out };
    return out;
  };

  const run = async (action: 'save' | 'share') => {
    try {
      const out = await render();
      if (action === 'save') {
        await saveToPhotos(out);
        haptic.success();
        setPhase({ kind: 'done', message: `Uloženo do Fotek: ${out.length} ${out.length === 1 ? 'slajd' : out.length < 5 ? 'slajdy' : 'slajdů'} v pořadí.` });
      } else {
        setPhase({ kind: 'idle' });
        await shareFrom(out, 0);
      }
    } catch (e) {
      haptic.warning();
      setPhase({ kind: 'error', message: String((e as Error).message ?? e) });
    }
  };

  const shareFrom = async (out: File[], index: number) => {
    await Sharing.shareAsync(out[index].uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: `Slajd ${index + 1}/${out.length}` });
    if (index + 1 < out.length) setShareNext({ files: out, index: index + 1 });
    else {
      setShareNext(null);
      haptic.success();
      setPhase({ kind: 'done', message: 'Sdílení dokončeno.' });
    }
  };

  const copyCaption = async () => {
    await Clipboard.setStringAsync(buildCaption(project.caption, settings));
    haptic.success();
    setPhase({ kind: 'done', message: 'Popisek zkopírován.' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : close} accessibilityLabel="Zavřít export" />
      <View style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]}>
        <Glass radius={28} style={styles.card}>
          <View style={styles.head}>
            <Text style={TYPE.title} accessibilityRole="header">
              Exportovat
            </Text>
            <Pressable onPress={close} disabled={busy} accessibilityRole="button" accessibilityLabel="Zavřít" hitSlop={10} style={styles.close}>
              <Icon name="close" size={22} />
            </Pressable>
          </View>
          <Text style={TYPE.footnote}>
            {total} {total === 1 ? 'slajd' : total < 5 ? 'slajdy' : 'slajdů'} · PNG 2160×2700 · přesně jako v náhledu
          </Text>

          {busy && (
            <View style={styles.progressWrap} accessibilityLiveRegion="polite" accessibilityLabel={`Slajd ${Math.min(phase.done + 1, phase.total)} z ${phase.total}`}>
              <Text style={styles.progressText}>
                Slajd {Math.min(phase.done + 1, phase.total)}/{phase.total}
              </Text>
              <View style={styles.track}>
                <Animated.View style={[styles.fill, bar]} />
              </View>
            </View>
          )}
          {phase.kind === 'done' && (
            <View style={styles.status} accessibilityLiveRegion="polite">
              <Icon name="checkmark-circle" size={20} color={UI.ok} />
              <Text style={[styles.statusText, { color: UI.ok }]}>{phase.message}</Text>
            </View>
          )}
          {phase.kind === 'error' && (
            <View style={styles.status} accessibilityLiveRegion="polite">
              <Icon name="alert-circle" size={20} color={UI.danger} />
              <Text style={[styles.statusText, { color: UI.danger }]}>{phase.message}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button kind="primary" icon="download" label="Uložit do Fotek" onPress={() => run('save')} disabled={busy} />
            {shareNext ? (
              <Button icon="share-outline" label={`Sdílet další (${shareNext.index + 1}/${shareNext.files.length})`} onPress={() => shareFrom(shareNext.files, shareNext.index)} />
            ) : (
              <Button icon="share-outline" label="Sdílet" onPress={() => run('share')} disabled={busy} hint="Otevře sdílení pro každý slajd postupně" />
            )}
            <Button icon="copy-outline" label="Kopírovat popisek" onPress={copyCaption} disabled={busy} />
          </View>
        </Glass>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  wrap: { position: 'absolute', left: 8, right: 8, bottom: 0 },
  card: { padding: 20, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: UI.hit, height: UI.hit, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  progressWrap: { gap: 8, paddingVertical: 4 },
  progressText: { color: UI.text, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: UI.accent, borderRadius: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  actions: { gap: 10, marginTop: 6 },
});
