import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Project } from '../../model/types';
import { SlideCanvas } from '../../render/SlideCanvas';
import { prunePhotos } from '../../store/photos';
import { useStore } from '../../store/projects';
import { Button, Icon, IconButton } from '../../ui/controls';
import { chooseAction } from '../../ui/dialog';
import { Glass } from '../../ui/Glass';
import { haptic } from '../../ui/haptics';
import { TYPE, UI } from '../../ui/theme';

const ACTIONS_W = 120;

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

function Card({ project, width, watermark, onOpen, onDuplicate, onDelete }: { project: Project; width: number; watermark: string; onOpen: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const tx = useSharedValue(0);
  const start = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      start.set(tx.get());
    },
    onUpdate: (e) => {
      'worklet';
      tx.set(Math.max(-ACTIONS_W - 20, Math.min(0, start.get() + e.translationX)));
    },
    onDeactivate: (e) => {
      'worklet';
      const shouldOpen = tx.get() < -ACTIONS_W / 2 || e.velocityX < -400;
      tx.set(withSpring(shouldOpen ? -ACTIONS_W : 0, { damping: 22, stiffness: 240 }));
      scheduleOnRN(setOpen, shouldOpen);
    },
  });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const close = () => {
    tx.set(withTiming(0));
    setOpen(false);
  };
  const first = project.slides[0];
  const thumbW = width;
  return (
    <View style={{ width }}>
      <View style={styles.actions} pointerEvents={open ? 'auto' : 'none'}>
        <Pressable
          style={styles.action}
          onPress={() => {
            close();
            onDuplicate();
          }}
          accessibilityRole="button"
          accessibilityLabel="Duplikovat"
        >
          <Icon name="copy-outline" size={22} color={UI.accent} />
          <Text style={[styles.actionText, { color: UI.accent }]}>Duplikovat</Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() => {
            close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel="Smazat"
        >
          <Icon name="trash-outline" size={22} color={UI.danger} />
          <Text style={[styles.actionText, { color: UI.danger }]}>Smazat</Text>
        </Pressable>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, style]}>
          <Pressable
            onPress={open ? close : onOpen}
            accessibilityRole="button"
            accessibilityLabel={`${project.name}, ${project.slides.length} slajdů, ${formatDate(project.updatedAt)}`}
            accessibilityActions={[{ name: 'activate' }, { name: 'duplicate', label: 'Duplikovat' }, { name: 'delete', label: 'Smazat' }]}
            onAccessibilityAction={(e) => {
              if (e.nativeEvent.actionName === 'duplicate') onDuplicate();
              else if (e.nativeEvent.actionName === 'delete') onDelete();
              else onOpen();
            }}
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            <View style={styles.thumb}>{first && <SlideCanvas slide={first} width={thumbW} watermark={watermark} />}</View>
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={styles.date}>
                {formatDate(project.updatedAt)} · {project.slides.length} {project.slides.length === 1 ? 'slajd' : project.slides.length < 5 ? 'slajdy' : 'slajdů'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const projects = useStore((s) => s.projects);
  const order = useStore((s) => s.order);
  const watermark = useStore((s) => s.settings.watermark);
  const { createProject, createSeed, duplicate, remove } = useStore.getState();
  const list = useMemo(() => order.map((id) => projects[id]).filter(Boolean), [order, projects]);
  const cardW = Math.floor((width - UI.gutter * 3) / 2);

  useEffect(() => {
    const refs = new Set<string>();
    for (const p of Object.values(useStore.getState().projects)) for (const s of p.slides) if (s.photo) refs.add(s.photo.uri);
    prunePhotos(refs);
  }, []);

  const openNew = (paste = false) => {
    haptic.light();
    const id = createProject();
    router.push(paste ? `/editor/${id}?paste=1` : `/editor/${id}`);
  };

  const confirmDelete = (p: Project) =>
    chooseAction(`Smazat „${p.name}“?`, [{ label: 'Smazat', destructive: true, onPress: () => (haptic.warning(), remove(p.id)) }], 'Tuto akci nelze vrátit.');

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={TYPE.largeTitle} accessibilityRole="header">
          Carousely
        </Text>
        <Glass radius={22} interactive style={styles.circle}>
          <IconButton icon="settings-outline" label="Nastavení" onPress={() => router.push('/settings')} />
        </Glass>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="albums-outline" size={48} color={UI.accent} />
          <Text style={[TYPE.title, { textAlign: 'center' }]}>Zatím žádný carousel</Text>
          <Text style={[TYPE.callout, { textAlign: 'center' }]}>Vyber fotku, vlož text a za pár minut máš hotové slajdy.</Text>
          <Button kind="plain" icon="sparkles-outline" label="Otevřít ukázku" onPress={() => router.push(`/editor/${createSeed()}`)} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: UI.gutter }}
          contentContainerStyle={{ padding: UI.gutter, gap: 22, paddingBottom: insets.bottom + 140 }}
          renderItem={({ item }) => (
            <Card
              project={item}
              width={cardW}
              watermark={watermark}
              onOpen={() => router.push(`/editor/${item.id}`)}
              onDuplicate={() => {
                haptic.light();
                duplicate(item.id);
              }}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <Glass radius={28} style={styles.bottomGlass}>
          <Button kind="primary" icon="add" label="Nový carousel" onPress={() => openNew(false)} style={{ flex: 1 }} />
          <Pressable
            onPress={() => openNew(true)}
            accessibilityRole="button"
            accessibilityLabel="Vložit celý příspěvek"
            style={({ pressed }) => [styles.pasteBtn, pressed && { opacity: 0.7 }]}
          >
            <Icon name="document-text-outline" size={22} color={UI.accent} />
          </Pressable>
        </Glass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: UI.gutter, paddingBottom: 6 },
  circle: { width: UI.hit, height: UI.hit, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40, paddingBottom: 120 },
  card: { backgroundColor: UI.bg },
  thumb: { borderRadius: 10, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: UI.line },
  meta: { paddingTop: 8, gap: 2 },
  name: { color: UI.text, fontSize: 15, fontWeight: '600' },
  date: { color: UI.textFaint, fontSize: 13 },
  actions: { position: 'absolute', right: 0, top: 0, bottom: 40, width: ACTIONS_W, justifyContent: 'center', gap: 8 },
  action: { alignItems: 'center', justifyContent: 'center', minHeight: 64, gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  bottomGlass: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  pasteBtn: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(92,225,230,0.12)' },
});
