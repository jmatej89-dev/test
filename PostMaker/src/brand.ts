/**
 * Single source of truth for the brand: colours, fonts and every slide layout constant.
 * All coordinates are in the 1080×1350 layout space; export renders the same layout at EXPORT_SCALE.
 */

export const COLORS = {
  navy: '#070F28',
  cyan: '#5CE1E6',
  white: '#FFFFFF',
  /** Role / sub-text on quotes. */
  white60: 'rgba(255,255,255,0.6)',
  /** Watermark. */
  white45: 'rgba(255,255,255,0.45)',
} as const;

export type BrandColor = keyof typeof COLORS;

export const FONT_FAMILY = 'Montserrat';
export type FontWeight = 400 | 600 | 700;

export const W = 1080;
export const H = 1350;
export const EXPORT_SCALE = 2;
export const EXPORT_W = W * EXPORT_SCALE;
export const EXPORT_H = H * EXPORT_SCALE;

/** Accent bar and cover title left edge. */
export const LEFT_X = 68;
/** Text start on text / quote slides. */
export const TX = 104;
export const TW = 908;
/** Max line width of the cover title. */
export const MAXW = 944;

/** Text must never extend below this line (keeps clear of the arrows and the watermark). */
export const TEXT_BOTTOM_LIMIT = 1235;
/** Text smaller than this is flagged by the checker. */
export const MIN_READABLE_FS = 40;

/**
 * Typographic placement factors for Montserrat (fractions of the font size).
 * baseline = lineTop + BASELINE_K·fs; visible bottom = baseline + DESCENT_K·fs.
 */
export const BASELINE_K = 0.76;
export const CAP_K = 0.7;
export const DESCENT_K = 0.22;

export const ACCENT_BAR_W = 6;

export const COVER = {
  photoH: 750,
  fadeFrom: 0.62,
  fadeTo: 0.92,
  eyebrowW: 56,
  eyebrowH: 6,
  /** Eyebrow starts this many px above the end of the photo. */
  eyebrowAboveEnd: 25,
  eyebrowGap: 30,
  fsMax: 84,
  fsMin: 56,
  fsStep: 2,
  lineHeightK: 1.14,
  arrows: '›››',
  arrowsSize: 64,
  arrowsX: LEFT_X,
  /** Top of the arrows' line box. */
  arrowsTop: H - 108,
} as const;

export const TEXT = {
  headerOptions: [420, 547, 600] as const,
  headerDefault: 547,
  headerMin: 420,
  headerMax: 600,
  /** Fade covers the last 35 % of the photo header. */
  fadeFrom: 0.65,
  fadeTo: 1,
  topGap: 50,
  fsMax: 62,
  fsMin: 40,
  fsStep: 2,
  leadExtra: 10,
} as const;

export const QUOTE = {
  headerTries: [547, 500, 450, 420] as const,
  fsMax: 62,
  fsMin: 38,
  fsStep: 2,
  leadExtra: 10,
  /** A header/size combination is "comfortable" from this size up; below it we try a shorter header. */
  comfortableFs: 48,
  nameK: 0.45,
  nameMin: 26,
  roleStep: 4,
  roleMin: 22,
  /** Gaps as fractions of the quote font size. */
  nameGapK: 0.42,
  roleGapK: 0.12,
  betweenQuotesK: 0.95,
} as const;

export const WATERMARK = {
  size: 20,
  weight: 600 as FontWeight,
  right: 40,
  baseline: H - 46,
  defaultText: 'Matěj Jankovič',
} as const;

/** Default list of words that tend to get posts throttled; editable in Settings. */
export const DEFAULT_RISKY_WORDS: Record<string, string> = {
  vrah: 'pachatel',
  vražd: 'zločin',
  zabít: 'připravit o život',
  zabil: 'připravil o život',
  zabij: 'útočí na',
  sebevražd: 's*bevražda',
  znásiln: 'sexuální útok',
  terorist: 'útočník',
  mrtv: 'bez života',
  zbraň: 'zbr*ň',
  drog: 'dr*gy',
  nacist: 'n*cista',
};

export const DEFAULT_CTA_FOLLOW = '👆 Nezapomeň mě sledovat pro tvůj větší přehled a buď o krok napřed!';
export const DEFAULT_CTA_COMMENT = 'Napiš do komentářů 👇';
