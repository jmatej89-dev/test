/** Caption builder – fixed format, pure. */
import type { Caption, Project, Settings } from '../model/types';

export function buildCaption(c: Caption, s: Pick<Settings, 'ctaComment' | 'ctaFollow'>): string {
  const parts: string[] = [];
  if (c.body.trim()) parts.push(c.body.trim());
  const q = c.question.trim();
  const cta = s.ctaComment.trim();
  if (q || cta) parts.push(q.endsWith(cta) ? q : [q, cta].filter(Boolean).join(' '));
  if (s.ctaFollow.trim()) parts.push(s.ctaFollow.trim());
  const sources = c.sources.map((x) => x.trim()).filter(Boolean).join(', ');
  const meta: string[] = [];
  const srcLine = [sources, c.date.trim()].filter(Boolean).join(' · ');
  if (srcLine) meta.push(`Zdroj: ${srcLine}`);
  if (c.photoCredit.trim()) meta.push(`Foto: ${c.photoCredit.trim()}`);
  if (meta.length) parts.push(meta.join('\n'));
  if (c.hashtags.length) parts.push(c.hashtags.slice(0, 5).join(' '));
  return parts.join('\n\n');
}

/** Distinct photo credits from the slides, in slide order. */
export function photoCreditsFromSlides(p: Project): string {
  const seen: string[] = [];
  for (const s of p.slides) {
    const c = s.photo?.credit?.trim();
    if (c && !seen.includes(c)) seen.push(c);
  }
  return seen.join(', ');
}
