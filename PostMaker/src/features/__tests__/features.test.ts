import { DEFAULT_CTA_COMMENT, DEFAULT_CTA_FOLLOW, DEFAULT_RISKY_WORDS } from '../../brand';
import { seedCaption, seedProject } from '../../model/seed';
import type { Settings } from '../../model/types';
import { buildCaption, photoCreditsFromSlides } from '../caption';
import { captionIssues, checkProject } from '../check';
import { extractLabel, parsePost, splitBlocks } from '../pasteAll';

const settings: Settings = {
  watermark: 'Matěj Jankovič',
  ctaComment: DEFAULT_CTA_COMMENT,
  ctaFollow: DEFAULT_CTA_FOLLOW,
  riskyWords: DEFAULT_RISKY_WORDS,
  defaultHashtags: [],
  defaultSlideType: 'text',
  haptics: true,
};

describe('caption', () => {
  test('fixed format', () => {
    const text = buildCaption(seedCaption(), settings);
    expect(text).toBe(
      [
        'Vláda zrušila pravidla pro školní obědy. Ministr je dokonce nazval zlem. Školy si teď budou menu určovat samy a odborníci varují před dopady na zdraví dětí.',
        'Měly by školy dál dodržovat nutriční pravidla? Napiš do komentářů 👇',
        '👆 Nezapomeň mě sledovat pro tvůj větší přehled a buď o krok napřed!',
        'Zdroj: Ministerstvo zdravotnictví, ČTK · 14. 11. 2026\nFoto: Ilustrační foto',
        '#skolniobedy #politika #zdravi',
      ].join('\n\n'),
    );
  });
  test('does not duplicate the CTA', () => {
    const c = { ...seedCaption(), question: 'Co ty? Napiš do komentářů 👇' };
    expect(buildCaption(c, settings).match(/Napiš do komentářů/g)?.length).toBe(1);
  });
  test('validation', () => {
    const base = seedCaption();
    expect(captionIssues({ ...seedProject(), caption: base }, settings)).toEqual([]);
    const bad = { ...base, body: 'Jen jedna.', sources: [], photoCredit: '', hashtags: ['#Školní', '#a', '#b', '#c', '#d', '#e'], question: 'Je vrah venku?' };
    const msgs = captionIssues({ ...seedProject(), caption: bad }, settings).map((i) => i.id);
    expect(msgs).toEqual(expect.arrayContaining(['caption:sentences', 'caption:source', 'caption:photo', 'caption:tags', 'caption:tagcase', 'caption:risky:vrah']));
  });
  test('photo credits are collected from slides', () => {
    const p = seedProject();
    p.slides[1].photo!.credit = 'ČTK';
    expect(photoCreditsFromSlides(p)).toBe('Ilustrační foto, ČTK');
  });
});

describe('check', () => {
  test('seed project has no warnings except placeholder-free ones', () => {
    const p = seedProject();
    const issues = checkProject(p, p.slides.map(() => null), settings);
    expect(issues.filter((i) => i.severity === 'warn')).toEqual([]);
  });
  test('missing photo is reported with the slide index', () => {
    const p = seedProject();
    p.slides[2].photo = null;
    const issues = checkProject(p, p.slides.map(() => null), settings);
    expect(issues.find((i) => i.id.endsWith('nophoto'))?.slideIndex).toBe(2);
  });
});

describe('paste whole post', () => {
  const post = `Vláda ruší pravidla pro obědy,
ministr je nazval „zlem“

---

Co se stalo. Vláda zrušila vyhlášku. Platí od ledna.

---

Proč to vadí.
Pravidla chránila děti.

---

„Stát má regulovat jen ty nejnutnější věci.“
Jana Malá
předsedkyně vlády`;

  test('splits on --- lines', () => {
    expect(splitBlocks(post).length).toBe(4);
    expect(splitBlocks('a\n\nb').length).toBe(2);
  });
  test('first block becomes the cover with white + cyan', () => {
    const [c] = parsePost(post);
    expect(c).toMatchObject({ type: 'cover', titleWhite: 'Vláda ruší pravidla pro obědy,', titleCyan: 'ministr je nazval „zlem“' });
  });
  test('labels are detected when shorter than 4 words', () => {
    const s = parsePost(post);
    expect(s[1]).toMatchObject({ type: 'text', label: 'Co se stalo.', body: 'Vláda zrušila vyhlášku. Platí od ledna.' });
    expect(s[2]).toMatchObject({ type: 'text', label: 'Proč to vadí.', body: 'Pravidla chránila děti.' });
    expect(extractLabel('Toto je dlouhá první věta. Druhá.').label).toBe('');
  });
  test('quote blocks become quote slides', () => {
    const s = parsePost(post)[3];
    expect(s).toMatchObject({ type: 'quote', quotes: [{ text: 'Stát má regulovat jen ty nejnutnější věci.', name: 'Jana Malá', role: 'předsedkyně vlády' }] });
  });
});
