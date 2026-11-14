/**
 * Data model. Text fields use a tiny markup:
 *   {highlighted words}  → cyan
 *   ~                    → non-breaking space
 *   \n                   → manual line break
 */

export type PhotoRef = {
  /** file:// URI inside the app sandbox, or `placeholder:<n>` for the generated gradient. */
  uri: string;
  width: number;
  height: number;
  /** ≥ 1, multiplies the cover-fit scale. */
  zoom: number;
  /** Focus point in normalised image coordinates (0..1). */
  cx: number;
  cy: number;
  /** Photo credit – only ever used in the caption, never drawn. */
  credit?: string;
  /** Fade strength multiplier (0 = minimal soft edge, 1 = brand default, up to 1.5). */
  fade?: number;
};

export type QuoteItem = { text: string; name: string; role: string };

export type HeaderHeight = 420 | 450 | 500 | 547 | 600;

export type CoverSlide = {
  id: string;
  type: 'cover';
  photo: PhotoRef | null;
  titleWhite: string;
  titleCyan: string;
  fsOverride?: number;
};

export type TextSlide = {
  id: string;
  type: 'text';
  photo: PhotoRef | null;
  label?: string;
  body: string;
  fsOverride?: number;
  headerH?: HeaderHeight;
};

export type QuoteSlide = {
  id: string;
  type: 'quote';
  photo: PhotoRef | null;
  quotes: QuoteItem[];
  fsOverride?: number;
  headerH?: HeaderHeight;
};

export type Slide = CoverSlide | TextSlide | QuoteSlide;
export type SlideType = Slide['type'];

export type Caption = {
  body: string;
  question: string;
  sources: string[];
  date: string;
  photoCredit: string;
  hashtags: string[];
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  slides: Slide[];
  caption: Caption;
};

export type Settings = {
  watermark: string;
  ctaComment: string;
  ctaFollow: string;
  riskyWords: Record<string, string>;
  defaultHashtags: string[];
  defaultSlideType: Exclude<SlideType, 'cover'>;
  haptics: boolean;
};

export const SLIDE_TYPE_LABEL: Record<SlideType, string> = {
  cover: 'Titulní',
  text: 'Text',
  quote: 'Citace',
};
