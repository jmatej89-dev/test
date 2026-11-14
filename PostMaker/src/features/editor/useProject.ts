import { useMemo } from 'react';
import { layoutSlide, type SlideLayout } from '../../layout/slides';
import type { Measurer } from '../../layout/measure';
import type { Project, Slide } from '../../model/types';
import { useRender } from '../../render/RenderContext';

/** Layout key without photo position – dragging the photo must not re-run the text layout. */
export function layoutKey(s: Slide): string {
  const { photo, ...rest } = s;
  return JSON.stringify(rest) + '|' + (photo?.fade ?? 1) + '|' + (photo ? 1 : 0);
}

const cache = new Map<string, SlideLayout>();
let cacheOwner: Measurer | null = null;

function cachedLayout(s: Slide, m: Measurer, watermark: string): SlideLayout {
  if (cacheOwner !== m) {
    cache.clear();
    cacheOwner = m;
  }
  const key = layoutKey(s) + watermark;
  let l = cache.get(key);
  if (!l) {
    l = layoutSlide(s, m, watermark);
    if (cache.size > 400) cache.clear();
    cache.set(key, l);
  }
  return l;
}

/** Layouts for all slides, cached per slide content. */
export function useLayouts(project: Project | undefined, watermark: string): (SlideLayout | null)[] {
  const r = useRender();
  return useMemo(() => (project && r ? project.slides.map((s) => cachedLayout(s, r.measurer, watermark)) : []), [project, r, watermark]);
}
