import type { FontWeight } from '../brand';

/** Text measurement is injected so the layout stays pure (Skia in the app and in tests). */
export interface Measurer {
  width(text: string, weight: FontWeight, size: number): number;
}

/** Memoising wrapper – layout measures the same words many times while auto-fitting. */
export function cachedMeasurer(inner: Measurer): Measurer {
  const cache = new Map<string, number>();
  return {
    width(text, weight, size) {
      const key = `${weight}|${size}|${text}`;
      let w = cache.get(key);
      if (w === undefined) {
        w = inner.width(text, weight, size);
        if (cache.size > 20000) cache.clear();
        cache.set(key, w);
      }
      return w;
    },
  };
}

/**
 * Deterministic approximate measurer (average Montserrat advance widths) – used where no
 * font is available yet (first frame) and in fast pure unit tests.
 */
export const approxMeasurer: Measurer = {
  width(text, weight, size) {
    let em = 0;
    for (const ch of text) {
      if (ch === ' ' || ch === ' ') em += 0.27;
      else if (/[iljI.,:;'!|ť]/.test(ch)) em += 0.3;
      else if (/[mwMW]/.test(ch)) em += 0.92;
      else if (/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(ch)) em += 0.72;
      else em += 0.6;
    }
    const k = weight === 700 ? 1.04 : weight === 600 ? 1.0 : 0.96;
    return em * size * k;
  },
};
