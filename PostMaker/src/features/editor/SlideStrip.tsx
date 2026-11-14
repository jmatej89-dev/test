/**
 * Horizontal thumbnail strip. Tap = select, long-press then drag = reorder,
 * long-press and release = menu (Duplikovat / Smazat / Změnit typ).
 */
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { H, W } from '../../brand';
import type { SlideLayout } from '../../layout/slides';
import { SLIDE_TYPE_LABEL, type Slide, type SlideType } from '../../model/types';
import { SlideCanvas } from '../../render/SlideCanvas';
import { Icon } from '../../ui/controls';
import { haptic } from '../../ui/haptics';
import { UI } from '../../ui/theme';

const TW_ = 52;
const TH_ = (TW_ * H) / W;
const GAP = 10;
const STEP = TW_ + GAP;

type Props = {
  slides: Slide[];
  layouts: (SlideLayout | null)[];
  current: number;
  watermark: string;
  issuesBySlide: number[];
  onSelect: (i: number) => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onChangeType: (i: number, t: SlideType) => void;
  onAdd: () => void;
};

function menu(title: string, options: string[], destructive: number, onPick: (i: number) => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: [...options, 'Zrušit'], cancelButtonIndex: options.length, destructiveButtonIndex: destructive, userInterfaceStyle: 'dark' },
      (i) => i < options.length && onPick(i),
    );
  } else {
    Alert.alert(title, undefined, [...options.map((o, i) => ({ text: o, onPress: () => onPick(i), style: i === destructive ? ('destructive' as const) : ('default' as const) })), { text: 'Zrušit', style: 'cancel' as const }]);
  }
}

function Thumb({
  index,
  slide,
  layout,
  selected,
  watermark,
  issues,
  drag,
  count,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMenu,
}: {
  index: number;
  slide: Slide;
  layout: SlideLayout | null;
  selected: boolean;
  watermark: string;
  issues: number;
  drag: { from: number; dx: number } | null;
  count: number;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (dx: number) => void;
  onDragEnd: (dx: number) => void;
  onMenu: () => void;
}) {
  const pan = usePanGesture({
    runOnJS: true,
    activateAfterLongPress: 280,
    onActivate: () => {
      haptic.light();
      onDragStart();
    },
    onUpdate: (e) => onDragMove(e.translationX),
    onDeactivate: (e) => {
      if (Math.abs(e.translationX) < 8) onMenu();
      onDragEnd(e.translationX);
    },
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: onSelect });
  const gesture = useExclusiveGestures(pan, tap);

  let tx = 0;
  let lifted = false;
  if (drag) {
    const target = Math.max(0, Math.min(count - 1, Math.round(drag.from + drag.dx / STEP)));
    if (index === drag.from) {
      tx = drag.dx;
      lifted = true;
    } else if (drag.from < index && index <= target) tx = -STEP;
    else if (target <= index && index < drag.from) tx = STEP;
  }

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Slajd ${index + 1}, ${SLIDE_TYPE_LABEL[slide.type]}${issues ? `, ${issues} problémů` : ''}`}
        accessibilityState={{ selected }}
        accessibilityHint="Podržením otevřete menu nebo přetáhněte pro změnu pořadí"
        accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
        onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'longpress' ? onMenu() : onSelect())}
        style={[
          styles.thumb,
          selected && styles.thumbOn,
          { transform: [{ translateX: tx }, { scale: lifted ? 1.1 : 1 }], zIndex: lifted ? 10 : 0 },
        ]}
      >
        <SlideCanvas slide={slide} layout={layout} width={TW_} watermark={watermark} />
        <Text style={styles.num}>{index + 1}</Text>
        {issues > 0 && <View style={styles.dot} />}
      </View>
    </GestureDetector>
  );
}

export function SlideStrip(p: Props) {
  const [drag, setDrag] = useState<{ from: number; dx: number } | null>(null);
  const openMenu = (i: number) => {
    const types = (['cover', 'text', 'quote'] as SlideType[]).filter((t) => t !== p.slides[i].type);
    menu(`Slajd ${i + 1}`, ['Duplikovat', ...types.map((t) => `Změnit na: ${SLIDE_TYPE_LABEL[t]}`), 'Smazat'], types.length + 1, (k) => {
      if (k === 0) p.onDuplicate(i);
      else if (k <= types.length) p.onChangeType(i, types[k - 1]);
      else p.onDelete(i);
    });
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} scrollEnabled={!drag}>
      {p.slides.map((s, i) => (
        <Thumb
          key={s.id}
          index={i}
          slide={s}
          layout={p.layouts[i]}
          selected={i === p.current}
          watermark={p.watermark}
          issues={p.issuesBySlide[i] ?? 0}
          drag={drag}
          count={p.slides.length}
          onSelect={() => {
            haptic.select();
            p.onSelect(i);
          }}
          onDragStart={() => setDrag({ from: i, dx: 0 })}
          onDragMove={(dx) => setDrag({ from: i, dx })}
          onDragEnd={(dx) => {
            const to = Math.max(0, Math.min(p.slides.length - 1, Math.round(i + dx / STEP)));
            setDrag(null);
            if (to !== i) {
              haptic.select();
              p.onMove(i, to);
            }
          }}
          onMenu={() => openMenu(i)}
        />
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Přidat slajd" onPress={p.onAdd} style={({ pressed }) => [styles.add, pressed && { opacity: 0.6 }]}>
        <Icon name="add" size={26} color={UI.accent} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: UI.gutter, gap: GAP, alignItems: 'center', height: TH_ + 14 },
  thumb: { width: TW_, height: TH_, borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: UI.accent },
  num: {
    position: 'absolute',
    left: 3,
    top: 2,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 2,
  },
  dot: { position: 'absolute', right: 3, top: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: UI.warn },
  add: {
    width: TW_,
    height: TH_,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(92,225,230,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
