/** Loads Montserrat into Skia once and shares the font provider + a cached measurer app-wide. */
import { useFonts, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { cachedMeasurer, type Measurer } from '../layout/measure';
import { skiaMeasurer } from './drawSlide';

type Ctx = { fonts: SkTypefaceFontProvider; measurer: Measurer } | null;
const RenderCtx = createContext<Ctx>(null);

export function RenderProvider({ children }: { children: ReactNode }) {
  const fonts = useFonts({
    Montserrat: [
      require('../../assets/fonts/Montserrat_400Regular.ttf'),
      require('../../assets/fonts/Montserrat_600SemiBold.ttf'),
      require('../../assets/fonts/Montserrat_700Bold.ttf'),
    ],
  });
  const value = useMemo<Ctx>(() => (fonts ? { fonts, measurer: cachedMeasurer(skiaMeasurer(fonts)) } : null), [fonts]);
  return <RenderCtx.Provider value={value}>{children}</RenderCtx.Provider>;
}

export const useRender = () => useContext(RenderCtx);
