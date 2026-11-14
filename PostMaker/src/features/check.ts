/**
 * "Kontrola": every problem across slides and caption, each pointing at the slide + tool to fix it.
 * Pure – unit tested.
 */
import { W } from '../brand';
import type { SlideLayout } from '../layout/slides';
import type { Project, Settings, Slide } from '../model/types';
import { countSentences, normalizeHashtag, profanitySuggestions, riskyWordHits } from '../text/czech';
import { photoResolutionRatio } from '../render/drawSlide';

export type Tool = 'photo' | 'text' | 'highlight' | 'size' | 'style';
export type Issue = {
  id: string;
  slideIndex: number | null;
  tool: Tool | 'caption';
  message: string;
  severity: 'warn' | 'info';
};

export function slideText(s: Slide): string {
  const t = s.type === 'cover' ? `${s.titleWhite} ${s.titleCyan}` : s.type === 'text' ? `${s.label ?? ''} ${s.body}` : s.quotes.map((q) => `${q.text} ${q.name} ${q.role}`).join(' ');
  return t.replace(/[{}]/g, '').replace(/~/g, ' ');
}

export function isLowRes(s: Slide, headerH: number): boolean {
  if (!s.photo || s.photo.uri.startsWith('placeholder:')) return false;
  return s.photo.width < W || photoResolutionRatio(s.photo, headerH) < 0.75;
}

export function captionIssues(p: Project, settings: Settings): Issue[] {
  const c = p.caption;
  const out: Issue[] = [];
  const add = (id: string, message: string, severity: Issue['severity'] = 'warn') =>
    out.push({ id: `caption:${id}`, slideIndex: null, tool: 'caption', message, severity });
  const n = countSentences(c.body);
  if (n < 2) add('sentences', n === 0 ? 'Popisek nemá hlavní text.' : 'Popisek má jen 1 větu (ideál 2–5).');
  if (n > 5) add('sentences', `Popisek má ${n} vět (max 5).`);
  if (!c.sources.filter((s) => s.trim()).length) add('source', 'Popisek nemá zdroj.');
  if (!c.photoCredit.trim()) add('photo', 'Popisek nemá zdroj fotek.');
  if (c.hashtags.length > 5) add('tags', `Hashtagů je ${c.hashtags.length} (max 5).`);
  if (c.hashtags.some((h) => normalizeHashtag(h) !== h)) add('tagcase', 'Hashtagy mají velká písmena nebo diakritiku.');
  for (const hit of riskyWordHits(`${c.body} ${c.question}`, settings.riskyWords))
    add(`risky:${hit.from}`, `Rizikové slovo v popisku: „${hit.from}“ → „${hit.to}“.`);
  return out;
}

export function checkProject(p: Project, layouts: (SlideLayout | null)[], settings: Settings): Issue[] {
  const out: Issue[] = [];
  p.slides.forEach((s, i) => {
    const l = layouts[i];
    const add = (id: string, tool: Tool, message: string, severity: Issue['severity'] = 'warn') =>
      out.push({ id: `${s.id}:${id}`, slideIndex: i, tool, message, severity });
    if (l) {
      for (const iss of l.issues) {
        const tool: Tool = iss.code === 'overflow' || iss.code === 'tooSmall' ? 'size' : 'text';
        add(iss.code, tool, iss.message);
      }
    }
    if (!s.photo) add('nophoto', 'photo', 'Slajd nemá fotku.');
    else if (l && isLowRes(s, l.header.h)) add('lowres', 'photo', 'Nízké rozlišení, fotka bude měkká.');
    const text = slideText(s);
    for (const hit of riskyWordHits(text, settings.riskyWords)) add(`risky:${hit.from}`, 'text', `Rizikové slovo: „${hit.from}“ → „${hit.to}“.`, 'info');
    for (const sug of profanitySuggestions(text)) add(`prof:${sug.from}`, 'text', `Vulgarita: „${sug.from}“ → „${sug.to}“?`, 'info');
    if (s.type === 'quote') {
      for (const q of s.quotes) {
        const n = (q.text.match(/\{[^}]*\}/g) ?? []).join(' ').split(/\s+/).filter(Boolean).length;
        if (q.text.trim() && n === 0) add('qhl', 'highlight', 'Citace nemá zvýrazněná slova (doporučeno 2–3).', 'info');
      }
    }
  });
  if (p.slides[0] && p.slides[0].type !== 'cover')
    out.push({ id: 'first-cover', slideIndex: 0, tool: 'style', message: 'První slajd není titulní.', severity: 'info' });
  return [...out, ...captionIssues(p, settings)];
}
