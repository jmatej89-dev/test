import type { Caption, Project, Slide } from './types';
import { newId } from './factory';

/** Demo content used by the "Ukázka" button and by the golden tests. Placeholder photos only. */
export function seedSlides(): Slide[] {
  const ph = (n: number) => ({ uri: `placeholder:${n}`, width: 2160, height: 1440, zoom: 1, cx: 0.5, cy: 0.4, credit: 'Ilustrační foto' });
  return [
    {
      id: newId(),
      type: 'cover',
      photo: ph(0),
      titleWhite: 'Vláda ruší závazná pravidla pro školní obědy,',
      titleCyan: 'ministr pro prevenci a zdraví je nazval „zlem“',
    },
    {
      id: newId(),
      type: 'text',
      photo: ph(1),
      label: 'Co se stalo.',
      body:
        'Vláda zrušila vyhlášku o nutričních pravidlech ve školních jídelnách. Ministr ji označil za zlo. Školy si teď menu určí samy. Změna platí od 1. 1. 2027.',
    },
    {
      id: newId(),
      type: 'text',
      photo: ph(2),
      label: 'Proč to vadí.',
      body:
        'Pravidla omezovala sladké nápoje a smažená jídla pro 900 000 dětí. Odborníci varují, že bez nich porostou ceny i podíl nezdravých jídel. O změně se rozhodlo bez debaty s rodiči a lékaři, kteří ji kritizují.',
    },
    {
      id: newId(),
      type: 'quote',
      photo: ph(3),
      quotes: [
        {
          text: '…nesmyslné {progresivistické zlo}.',
          name: 'Petr Dvořák',
          role: 'ministr pro prevenci a zdraví, 12. 11. 2026',
        },
        {
          text: 'Stát má regulovat jen ty {nejnutnější věci}.',
          name: 'Jana Malá',
          role: 'předsedkyně vlády, 13. 11. 2026',
        },
      ],
    },
    {
      id: newId(),
      type: 'quote',
      photo: ph(4),
      quotes: [
        {
          text:
            'Děti si zaslouží jídlo, které jim neublíží. Zrušit pravidla bez náhrady je {hazard se zdravím} celé generace a {rodiče to poznají} jako první.',
          name: 'Eva Horáková',
          role: 'dětská lékařka',
        },
      ],
    },
  ];
}

export function seedCaption(): Caption {
  return {
    body:
      'Vláda zrušila pravidla pro školní obědy. Ministr je dokonce nazval zlem. Školy si teď budou menu určovat samy a odborníci varují před dopady na zdraví dětí.',
    question: 'Měly by školy dál dodržovat nutriční pravidla?',
    sources: ['Ministerstvo zdravotnictví', 'ČTK'],
    date: '14. 11. 2026',
    photoCredit: 'Ilustrační foto',
    hashtags: ['#skolniobedy', '#politika', '#zdravi'],
  };
}

export function seedProject(): Project {
  const now = Date.now();
  return {
    id: newId(),
    name: 'Ukázka: školní obědy',
    createdAt: now,
    updatedAt: now,
    slides: seedSlides(),
    caption: seedCaption(),
  };
}
