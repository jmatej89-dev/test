import { COLORS } from '../brand';

/** App chrome colours: brand navy background, cyan as the only accent. All text pairs pass WCAG AA. */
export const UI = {
  bg: COLORS.navy,
  bgRaised: '#0D1838',
  bgField: '#111D42',
  line: 'rgba(255,255,255,0.10)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.56)',
  accent: COLORS.cyan,
  onAccent: COLORS.navy,
  warn: '#F5C451',
  warnBg: 'rgba(245,196,81,0.14)',
  danger: '#FF7A70',
  ok: '#7BE0A3',
  radius: 14,
  radiusLg: 22,
  gutter: 16,
  hit: 44,
} as const;

export const TYPE = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37, color: UI.text },
  title: { fontSize: 22, fontWeight: '700' as const, color: UI.text },
  headline: { fontSize: 17, fontWeight: '600' as const, color: UI.text },
  body: { fontSize: 17, color: UI.text },
  callout: { fontSize: 16, color: UI.textDim },
  footnote: { fontSize: 13, color: UI.textDim },
  caption: { fontSize: 12, color: UI.textFaint },
};
