/**
 * App state: projects + settings, persisted to AsyncStorage on every change (autosave).
 * Undo/redo history lives in memory per project and coalesces rapid edits (typing).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CTA_COMMENT, DEFAULT_CTA_FOLLOW, DEFAULT_RISKY_WORDS, WATERMARK } from '../brand';
import { duplicateProject, newProject } from '../model/factory';
import { seedProject } from '../model/seed';
import type { Caption, Project, Settings, Slide } from '../model/types';

export const DEFAULT_SETTINGS: Settings = {
  watermark: WATERMARK.defaultText,
  ctaComment: DEFAULT_CTA_COMMENT,
  ctaFollow: DEFAULT_CTA_FOLLOW,
  riskyWords: DEFAULT_RISKY_WORDS,
  defaultHashtags: [],
  defaultSlideType: 'text',
  haptics: true,
};

type History = { past: Project[]; future: Project[]; lastKey: string | null; lastAt: number };

type State = {
  projects: Record<string, Project>;
  order: string[];
  settings: Settings;
  hydrated: boolean;

  createProject: () => string;
  createSeed: () => string;
  addProject: (p: Project) => string;
  duplicate: (id: string) => string;
  remove: (id: string) => void;
  /** Apply a change to a project. `coalesceKey` merges consecutive edits of the same field into one undo step. */
  update: (id: string, fn: (p: Project) => Project, coalesceKey?: string) => void;
  updateSlide: (id: string, slideId: string, fn: (s: Slide) => Slide, coalesceKey?: string) => void;
  updateCaption: (id: string, patch: Partial<Caption>, coalesceKey?: string) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  setSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
};

const histories = new Map<string, History>();
const COALESCE_MS = 1200;
const HISTORY_MAX = 100;
const hist = (id: string) => {
  let h = histories.get(id);
  if (!h) {
    h = { past: [], future: [], lastKey: null, lastAt: 0 };
    histories.set(id, h);
  }
  return h;
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const put = (p: Project, toFront = false) =>
        set((s) => ({
          projects: { ...s.projects, [p.id]: p },
          order: toFront || !s.order.includes(p.id) ? [p.id, ...s.order.filter((x) => x !== p.id)] : s.order,
        }));

      return {
        projects: {},
        order: [],
        settings: DEFAULT_SETTINGS,
        hydrated: false,

        createProject: () => {
          const p = newProject(get().settings.defaultHashtags);
          put(p, true);
          return p.id;
        },
        createSeed: () => {
          const p = seedProject();
          put(p, true);
          return p.id;
        },
        addProject: (p) => {
          put(p, true);
          return p.id;
        },
        duplicate: (id) => {
          const src = get().projects[id];
          if (!src) return id;
          const p = duplicateProject(src);
          put(p, true);
          return p.id;
        },
        remove: (id) => {
          histories.delete(id);
          set((s) => {
            const projects = { ...s.projects };
            delete projects[id];
            return { projects, order: s.order.filter((x) => x !== id) };
          });
        },
        update: (id, fn, coalesceKey) => {
          const cur = get().projects[id];
          if (!cur) return;
          const next = fn(cur);
          if (next === cur) return;
          const h = hist(id);
          const now = Date.now();
          const merge = coalesceKey && h.lastKey === coalesceKey && now - h.lastAt < COALESCE_MS;
          if (!merge) {
            h.past.push(cur);
            if (h.past.length > HISTORY_MAX) h.past.shift();
          }
          h.future = [];
          h.lastKey = coalesceKey ?? null;
          h.lastAt = now;
          put({ ...next, updatedAt: now });
        },
        updateSlide: (id, slideId, fn, coalesceKey) =>
          get().update(
            id,
            (p) => ({ ...p, slides: p.slides.map((s) => (s.id === slideId ? fn(s) : s)) }),
            coalesceKey ? `${slideId}:${coalesceKey}` : undefined,
          ),
        updateCaption: (id, patch, coalesceKey) =>
          get().update(id, (p) => ({ ...p, caption: { ...p.caption, ...patch } }), coalesceKey ? `caption:${coalesceKey}` : undefined),
        undo: (id) => {
          const h = hist(id);
          const cur = get().projects[id];
          const prev = h.past.pop();
          if (!prev || !cur) return;
          h.future.push(cur);
          h.lastKey = null;
          put(prev);
        },
        redo: (id) => {
          const h = hist(id);
          const cur = get().projects[id];
          const next = h.future.pop();
          if (!next || !cur) return;
          h.past.push(cur);
          h.lastKey = null;
          put(next);
        },
        canUndo: (id) => hist(id).past.length > 0,
        canRedo: (id) => hist(id).future.length > 0,
        setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
        resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      };
    },
    {
      name: 'postmaker-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ projects: s.projects, order: s.order, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        };
      },
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

/** Re-render when undo/redo availability may have changed (any project change). */
export function useHistoryFlags(id: string) {
  useStore((s) => s.projects[id]);
  return { canUndo: hist(id).past.length > 0, canRedo: hist(id).future.length > 0 };
}
