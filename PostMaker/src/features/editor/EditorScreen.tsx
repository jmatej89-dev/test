import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { convertSlide, duplicateSlide, newSlide } from '../../model/factory';
import type { PhotoRef, Slide, SlideType } from '../../model/types';
import { useHistoryFlags, useStore } from '../../store/projects';
import { Icon, IconButton, type IconName } from '../../ui/controls';
import { Glass } from '../../ui/Glass';
import { haptic } from '../../ui/haptics';
import { askText, chooseAction, notify } from '../../ui/dialog';
import { Sheet, type Detent, type DetentHeights } from '../../ui/Sheet';
import { TYPE, UI } from '../../ui/theme';
import { checkProject, type Issue, type Tool } from '../check';
import { EditorCtx, type EditorCtxValue } from './EditorContext';
import { ExportSheet } from './ExportSheet';
import { PasteAllSheet } from './PasteAllSheet';
import { CheckPanel } from './panels/CheckPanel';
import { HighlightPanel } from './panels/HighlightPanel';
import { PhotoPanel } from './panels/PhotoPanel';
import { SizePanel } from './panels/SizePanel';
import { StylePanel } from './panels/StylePanel';
import { TextPanel } from './panels/TextPanel';
import { PreviewStage } from './PreviewStage';
import { SlideStrip } from './SlideStrip';
import { useLayouts } from './useProject';

type Panel = Tool | 'check';

const TOOLS: { key: Tool; label: string; icon: IconName }[] = [
  { key: 'photo', label: 'Foto', icon: 'image' },
  { key: 'text', label: 'Text', icon: 'text' },
  { key: 'highlight', label: 'Zvýraznění', icon: 'color-wand' },
  { key: 'size', label: 'Velikost', icon: 'resize' },
  { key: 'style', label: 'Styl', icon: 'options' },
];
const PANEL_TITLE: Record<Panel, string> = {
  photo: 'Foto',
  text: 'Text',
  highlight: 'Zvýraznění',
  size: 'Velikost',
  style: 'Styl',
  check: 'Kontrola',
};

const TOP_BAR = 52;
const STRIP_H = 86;
const TOOLBAR_H = 64;

export function EditorScreen({ id, startWithPaste }: { id: string; startWithPaste?: boolean }) {
  const project = useStore((s) => s.projects[id]);
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.update);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const { canUndo, canRedo } = useHistoryFlags(id);
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [current, setCurrent] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [detent, setDetent] = useState<Detent>('closed');
  const [safeZone, setSafeZone] = useState(false);
  const [kb, setKb] = useState(0);
  const [area, setArea] = useState<{ y: number; h: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(!!startWithPaste);

  const layouts = useLayouts(project, settings.watermark);
  const issues = useMemo(() => (project ? checkProject(project, layouts, settings) : []), [project, layouts, settings]);
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const issuesBySlide = useMemo(() => {
    const arr: number[] = [];
    for (const i of issues) if (i.slideIndex !== null && i.severity === 'warn') arr[i.slideIndex] = (arr[i.slideIndex] ?? 0) + 1;
    return arr;
  }, [issues]);

  const slideCount = project?.slides.length ?? 0;
  const idx = Math.min(current, Math.max(0, slideCount - 1));
  const slide = project?.slides[idx];
  const layout = layouts[idx] ?? null;

  // ── Keyboard: the sheet rides on top of it ──
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const toolbarBottom = insets.bottom + TOOLBAR_H + 6;
  const sheetH = useSharedValue(0);
  const sheetBottom = useSharedValue(toolbarBottom);
  useEffect(() => {
    sheetBottom.set(withTiming(kb ? kb + 6 : toolbarBottom, { duration: 220 }));
  }, [kb, toolbarBottom, sheetBottom]);

  const stageTop = area?.y ?? insets.top + TOP_BAR;
  const stageH = area?.h ?? screenH - stageTop - toolbarBottom - STRIP_H;
  const baseWidth = Math.max(160, Math.min(screenW - UI.gutter * 2, (stageH - 12) * 0.8));
  const baseH = baseWidth * 1.25;

  const heights: DetentHeights = useMemo(() => {
    if (kb) {
      const typing = Math.max(200, screenH - kb - 6 - stageTop - 210);
      return { small: typing, medium: typing, large: typing };
    }
    return {
      small: 200,
      medium: Math.round(screenH * 0.42),
      large: Math.round(Math.min(screenH * 0.68, screenH - stageTop - toolbarBottom - 150)),
    };
  }, [kb, screenH, stageTop, toolbarBottom]);

  const stageBottom = stageTop + stageH;
  const previewScale = useDerivedValue(() => {
    const sheetTop = screenH - sheetBottom.value - sheetH.value;
    const limit = sheetH.value > 8 ? Math.min(stageBottom, sheetTop - 10) : stageBottom;
    return Math.max(0.25, Math.min(1, (limit - stageTop - 6) / baseH));
  });

  const openPanel = useCallback(
    (p: Panel) => {
      if (panel === p && detent !== 'closed') {
        Keyboard.dismiss();
        setDetent('closed');
        return;
      }
      haptic.select();
      setPanel(p);
      if (detent === 'closed') setDetent('medium');
    },
    [panel, detent],
  );

  const updateSlide = useCallback(
    (fn: (s: Slide) => Slide, key?: string) => {
      if (slide) useStore.getState().updateSlide(id, slide.id, fn, key);
    },
    [id, slide],
  );

  const ctx: EditorCtxValue | null = useMemo(
    () =>
      slide
        ? {
            projectId: id,
            slide,
            layout,
            settings,
            updateSlide,
            safeZone,
            setSafeZone,
            onFieldFocus: () => setDetent((d) => (d === 'closed' ? 'medium' : d)),
          }
        : null,
    [id, slide, layout, settings, updateSlide, safeZone],
  );

  if (!project || !slide || !ctx) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Text style={TYPE.headline}>Carousel nebyl nalezen.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={{ color: UI.accent, fontSize: 17 }}>Zpět na projekty</Text>
        </Pressable>
      </View>
    );
  }

  const onPhoto = (patch: Partial<PhotoRef>) => updateSlide((s) => (s.photo ? { ...s, photo: { ...s.photo, ...patch } } : s), 'photo-gesture');

  const mutateSlides = (fn: (slides: Slide[]) => Slide[]) => update(id, (p) => ({ ...p, slides: fn(p.slides) }));

  const addSlide = () => {
    const make = (t: SlideType) => {
      const s = newSlide(t);
      // New slides reuse the current photo credit expectations but start without a photo.
      mutateSlides((sl) => [...sl.slice(0, idx + 1), s, ...sl.slice(idx + 1)]);
      setCurrent(idx + 1);
      setPanel(t === 'cover' ? 'text' : 'photo');
      setDetent('medium');
    };
    const opts: { label: string; run: () => void }[] = [
      { label: settings.defaultSlideType === 'quote' ? 'Citace' : 'Textový slajd', run: () => make(settings.defaultSlideType) },
      { label: settings.defaultSlideType === 'quote' ? 'Textový slajd' : 'Citace', run: () => make(settings.defaultSlideType === 'quote' ? 'text' : 'quote') },
      { label: 'Titulní slajd', run: () => make('cover') },
      { label: 'Vložit celý příspěvek…', run: () => setPasteOpen(true) },
    ];
    chooseAction('Přidat', opts.map((o) => ({ label: o.label, onPress: o.run })));
  };

  const jumpTo = (issue: Issue) => {
    if (issue.tool === 'caption') {
      router.push(`/caption/${id}`);
      return;
    }
    if (issue.slideIndex !== null) setCurrent(issue.slideIndex);
    setPanel(issue.tool);
    setDetent('medium');
  };

  const rename = () => {
    askText('Název carouselu', project.name, (t) => {
      if (t.trim()) update(id, (p) => ({ ...p, name: t.trim() }));
    });
  };

  const panelBody = (() => {
    switch (panel) {
      case 'photo':
        return <PhotoPanel />;
      case 'text':
        return <TextPanel />;
      case 'highlight':
        return <HighlightPanel />;
      case 'size':
        return <SizePanel />;
      case 'style':
        return <StylePanel />;
      case 'check':
        return <CheckPanel issues={issues} onJump={jumpTo} />;
      default:
        return null;
    }
  })();

  return (
    <EditorCtx.Provider value={ctx}>
      <View style={styles.root}>
        {/* Top bar */}
        <View style={[styles.top, { paddingTop: insets.top, height: insets.top + TOP_BAR }]}>
          <Glass radius={22} interactive style={styles.circle}>
            <IconButton icon="chevron-back" label="Zpět na projekty" onPress={() => router.back()} />
          </Glass>
          <Pressable onPress={rename} style={styles.titleWrap} accessibilityRole="button" accessibilityLabel={`Název: ${project.name}. Klepnutím přejmenujete.`}>
            <Text style={styles.title} numberOfLines={1}>
              {project.name}
            </Text>
            <Text style={styles.subtitle}>
              Slajd {idx + 1} / {slideCount}
            </Text>
          </Pressable>
          <Glass radius={22} interactive style={styles.capsule}>
            <IconButton icon="arrow-undo" label="Zpět" onPress={() => undo(id)} disabled={!canUndo} />
            <IconButton icon="arrow-redo" label="Znovu" onPress={() => redo(id)} disabled={!canRedo} />
            <IconButton
              icon={warnCount ? 'shield-outline' : 'shield-checkmark'}
              label={warnCount ? `Kontrola: ${warnCount} problémů` : 'Kontrola: bez problémů'}
              onPress={() => openPanel('check')}
              active={panel === 'check' && detent !== 'closed'}
              badge={warnCount}
            />
          </Glass>
        </View>

        {/* Preview */}
        <View
          style={[styles.stageArea, { marginBottom: toolbarBottom + STRIP_H }]}
          onLayout={(e: LayoutChangeEvent) => {
            const { y, height } = e.nativeEvent.layout;
            if (!area || Math.abs(area.y - y) > 1 || Math.abs(area.h - height) > 1) setArea({ y, h: height });
          }}
        >
          <PreviewStage
            slide={slide}
            layout={layout}
            watermark={settings.watermark}
            baseWidth={baseWidth}
            scale={previewScale}
            safeZone={safeZone}
            onPhoto={onPhoto}
            onUndo={() => undo(id)}
            onRedo={() => redo(id)}
          />
          {!slide.photo && detent === 'closed' && (
            <Pressable style={styles.emptyHint} onPress={() => openPanel('photo')} accessibilityRole="button" accessibilityLabel="Vyber fotku">
              <View style={styles.emptyHintInner}>
                <Icon name="add-circle-outline" size={30} color={UI.text} />
                <Text style={styles.emptyHintText}>Vyber fotku</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Strip + caption */}
        <View style={[styles.stripRow, { height: STRIP_H, bottom: toolbarBottom }]}>
          <View style={{ flex: 1 }}>
            <SlideStrip
              slides={project.slides}
              layouts={layouts}
              current={idx}
              watermark={settings.watermark}
              issuesBySlide={issuesBySlide}
              onSelect={setCurrent}
              onMove={(from, to) =>
                mutateSlides((sl) => {
                  const next = sl.slice();
                  const [m] = next.splice(from, 1);
                  next.splice(to, 0, m);
                  if (from === idx) setCurrent(to);
                  return next;
                })
              }
              onDuplicate={(i) => {
                mutateSlides((sl) => [...sl.slice(0, i + 1), duplicateSlide(sl[i]), ...sl.slice(i + 1)]);
                setCurrent(i + 1);
              }}
              onDelete={(i) => {
                if (slideCount <= 1) {
                  notify('Carousel musí mít aspoň jeden slajd.');
                  return;
                }
                mutateSlides((sl) => sl.filter((_, j) => j !== i));
                setCurrent((c) => Math.max(0, c >= i ? c - 1 : c));
              }}
              onChangeType={(i, t) => mutateSlides((sl) => sl.map((s, j) => (j === i ? convertSlide(s, t) : s)))}
              onAdd={addSlide}
            />
          </View>
          <Pressable
            onPress={() => router.push(`/caption/${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Popisek"
            style={({ pressed }) => [styles.captionBtn, pressed && { opacity: 0.7 }]}
          >
            <Icon name="chatbox-ellipses" size={20} color={UI.accent} />
            <Text style={styles.captionText}>Popisek</Text>
          </Pressable>
        </View>

        {/* Tool bar */}
        <View style={[styles.toolbarRow, { bottom: insets.bottom + 6 }]}>
          <Glass radius={32} style={styles.toolbar}>
            {TOOLS.map((t) => {
              const on = panel === t.key && detent !== 'closed';
              return (
                <Pressable
                  key={t.key}
                  onPress={() => openPanel(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t.label}
                  style={({ pressed }) => [styles.tool, on && styles.toolOn, pressed && { opacity: 0.7 }]}
                >
                  <Icon name={t.icon} size={21} color={on ? UI.onAccent : UI.text} />
                  <Text style={[styles.toolText, on && { color: UI.onAccent }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </Glass>
          <Glass radius={32} tinted interactive style={styles.exportBtn}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setExportOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Exportovat"
              style={styles.exportInner}
            >
              <Icon name="share-outline" size={24} />
            </Pressable>
          </Glass>
        </View>

        {/* Tool sheet */}
        <Sheet
          detent={detent}
          onDetentChange={(d) => {
            if (d === 'closed') Keyboard.dismiss();
            setDetent(d);
          }}
          heights={heights}
          height={sheetH}
          bottom={sheetBottom}
          title={panel ? PANEL_TITLE[panel] : ''}
          right={
            <IconButton
              icon="close"
              label="Zavřít panel"
              onPress={() => {
                Keyboard.dismiss();
                setDetent('closed');
              }}
              size={20}
            />
          }
        >
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            {panelBody}
          </ScrollView>
        </Sheet>

        <ExportSheet visible={exportOpen} onClose={() => setExportOpen(false)} project={project} />
        <PasteAllSheet
          visible={pasteOpen}
          onClose={() => setPasteOpen(false)}
          onApply={(slides, replace) => {
            mutateSlides((sl) => (replace ? slides : [...sl, ...slides]));
            setCurrent(replace ? 0 : slideCount);
            setPasteOpen(false);
          }}
          hasContent={project.slides.some((s) => (s.type === 'cover' ? s.titleWhite || s.titleCyan : s.type === 'text' ? s.body : s.quotes.some((q) => q.text)))}
        />
      </View>
    </EditorCtx.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, zIndex: 5 },
  circle: { width: UI.hit, height: UI.hit, alignItems: 'center', justifyContent: 'center' },
  capsule: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2, height: UI.hit },
  titleWrap: { flex: 1, minHeight: UI.hit, justifyContent: 'center' },
  title: { color: UI.text, fontSize: 17, fontWeight: '600' },
  subtitle: { color: UI.textFaint, fontSize: 13 },
  stageArea: { flex: 1, paddingTop: 6 },
  // Sits inside the empty photo area only (no glass over the slide).
  emptyHint: { position: 'absolute', alignSelf: 'center', top: '14%', minHeight: 88, minWidth: 140, alignItems: 'center', justifyContent: 'center' },
  emptyHintInner: { alignItems: 'center', gap: 6, opacity: 0.9 },
  emptyHintText: { color: UI.text, fontSize: 16, fontWeight: '600' },
  stripRow: { flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 0, right: 0 },
  captionBtn: {
    height: UI.hit + 8,
    marginRight: UI.gutter,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(92,225,230,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  captionText: { color: UI.accent, fontSize: 12, fontWeight: '600' },
  toolbarRow: { position: 'absolute', left: 8, right: 8, height: TOOLBAR_H, flexDirection: 'row', gap: 8 },
  toolbar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  tool: { flex: 1, height: TOOLBAR_H - 12, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  toolOn: { backgroundColor: UI.accent },
  toolText: { color: UI.text, fontSize: 10.5, fontWeight: '600' },
  exportBtn: { width: TOOLBAR_H, height: TOOLBAR_H },
  exportInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { paddingHorizontal: UI.gutter, paddingBottom: 28, paddingTop: 4 },
});
