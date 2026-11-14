import type { Caption, Project, Slide, SlideType } from './types';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyCaption(defaultHashtags: string[] = []): Caption {
  return { body: '', question: '', sources: [], date: todayCz(), photoCredit: '', hashtags: [...defaultHashtags] };
}

export function todayCz(d = new Date()): string {
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export function newSlide(type: SlideType): Slide {
  const id = newId();
  switch (type) {
    case 'cover':
      return { id, type, photo: null, titleWhite: '', titleCyan: '' };
    case 'text':
      return { id, type, photo: null, label: '', body: '' };
    case 'quote':
      return { id, type, photo: null, quotes: [{ text: '', name: '', role: '' }] };
  }
}

export function newProject(defaultHashtags: string[] = []): Project {
  const now = Date.now();
  return {
    id: newId(),
    name: 'Nový carousel',
    createdAt: now,
    updatedAt: now,
    slides: [newSlide('cover')],
    caption: emptyCaption(defaultHashtags),
  };
}

/** Convert a slide to another type, carrying over the photo and as much text as makes sense. */
export function convertSlide(s: Slide, type: SlideType): Slide {
  if (s.type === type) return s;
  const text =
    s.type === 'cover'
      ? [s.titleWhite, s.titleCyan ? `{${s.titleCyan}}` : ''].filter(Boolean).join(' ')
      : s.type === 'text'
        ? s.body
        : s.quotes.map((q) => q.text).join(' ');
  const plain = text.replace(/[{}]/g, '');
  const base = { id: s.id, photo: s.photo };
  switch (type) {
    case 'cover':
      return { ...base, type, titleWhite: plain, titleCyan: '' };
    case 'text':
      return { ...base, type, label: '', body: text };
    case 'quote':
      return { ...base, type, quotes: [{ text, name: '', role: '' }] };
  }
}

export function duplicateSlide(s: Slide): Slide {
  return { ...JSON.parse(JSON.stringify(s)), id: newId() };
}

export function duplicateProject(p: Project): Project {
  const now = Date.now();
  const copy: Project = JSON.parse(JSON.stringify(p));
  return { ...copy, id: newId(), name: `${p.name} (kopie)`, createdAt: now, updatedAt: now, slides: copy.slides.map((s) => ({ ...s, id: newId() })) };
}
