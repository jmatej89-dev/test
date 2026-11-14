import { NBSP } from '../markup';
import {
  applyHardSpaces,
  countSentences,
  fixTypography,
  normalizeHashtag,
  profanitySuggestions,
  riskyWordHits,
} from '../czech';
import { DEFAULT_RISKY_WORDS } from '../../brand';

const nb = (s: string) => s.split(NBSP).join('~');

describe('hard spaces', () => {
  test('single-letter prepositions and conjunctions', () => {
    expect(nb(applyHardSpaces('jdu v Praze a k tobě i s ním'))).toBe('jdu v~Praze a~k~tobě i~s~ním');
    expect(nb(applyHardSpaces('V Praze'))).toBe('V~Praze');
  });
  test('numbers, dates, percent', () => {
    expect(nb(applyHardSpaces('70 000 lidí'))).toBe('70~000~lidí');
    expect(nb(applyHardSpaces('9,8 milionu'))).toBe('9,8~milionu');
    expect(nb(applyHardSpaces('dne 22. 7. a 12. 11. 2026'))).toBe('dne 22.~7. a~12.~11.~2026');
    expect(nb(applyHardSpaces('růst 50 %'))).toBe('růst 50~%');
  });
  test('tilde and dash', () => {
    expect(nb(applyHardSpaces('pan~ministr ano – ne'))).toBe('pan~ministr ano~– ne');
  });
  test('length preserved', () => {
    const s = 'a v 70 000 % ~ x';
    expect(applyHardSpaces(s).length).toBe(s.length);
  });
});

describe('typography', () => {
  test('fixes quotes, ellipsis, dashes, spaces', () => {
    expect(fixTypography('Řekl "ahoj" ... a  pak - nic .')).toBe('Řekl „ahoj“ … a pak – nic.');
    expect(fixTypography('Byl to "zlo"...')).toBe('Byl to „zlo“…');
  });
});

describe('caption helpers', () => {
  test('hashtag normalisation', () => {
    expect(normalizeHashtag('#Školní')).toBe('#skolni');
    expect(normalizeHashtag('Obědy Zdarma')).toBe('#obedyzdarma');
  });
  test('sentence counting', () => {
    expect(countSentences('')).toBe(0);
    expect(countSentences('Jedna věta.')).toBe(1);
    expect(countSentences('První. Druhá! Třetí? Čtvrtá…')).toBe(4);
    expect(countSentences('Cena 9,8 mil. Kč je moc.')).toBe(1);
  });
  test('profanity masking suggestions', () => {
    const s = profanitySuggestions('Je to zmrd a sračka, do prdele.');
    expect(s.map((x) => x.to)).toEqual(['zm*d', 'sr*čka', 'pr*dele']);
  });
  test('risky words with replacement', () => {
    const hits = riskyWordHits('Vrah utekl, policie hledá vraha.', DEFAULT_RISKY_WORDS);
    expect(hits.map((h) => h.from)).toEqual(['Vrah', 'vraha']);
    expect(hits[0].to).toBe('pachatel');
  });
});
