import { createContext, useContext } from 'react';
import type { SlideLayout } from '../../layout/slides';
import type { Settings, Slide } from '../../model/types';

export type EditorCtxValue = {
  projectId: string;
  slide: Slide;
  layout: SlideLayout | null;
  settings: Settings;
  /** Update the current slide; `key` coalesces consecutive edits into one undo step. */
  updateSlide: (fn: (s: Slide) => Slide, key?: string) => void;
  safeZone: boolean;
  setSafeZone: (v: boolean) => void;
  /** Focused input moves the sheet up to "large" so the field stays visible above the keyboard. */
  onFieldFocus: () => void;
};

export const EditorCtx = createContext<EditorCtxValue | null>(null);

export function useEditor(): EditorCtxValue {
  const v = useContext(EditorCtx);
  if (!v) throw new Error('useEditor outside editor');
  return v;
}
