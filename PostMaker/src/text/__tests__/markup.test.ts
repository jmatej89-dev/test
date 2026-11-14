import { applyPlainEdit, expandToWords, highlightedWords, parseMarkup, toMarkup, toggleHighlight } from '../markup';

describe('markup', () => {
  test('parse and rebuild round-trip', () => {
    const m = 'Stát má {nejnutnější věci}.';
    const r = parseMarkup(m);
    expect(r.text).toBe('Stát má nejnutnější věci.');
    expect(r.hl.filter(Boolean).length).toBe('nejnutnější věci'.length);
    expect(toMarkup(r)).toBe(m);
  });

  test('unclosed brace highlights to the end', () => {
    expect(toMarkup(parseMarkup('a {b c'))).toBe('a {b c}');
  });

  test('typing inside a highlight extends it, typing at its edge does not', () => {
    expect(applyPlainEdit('x {abc} y', 'x abXc y')).toBe('x {abXc} y');
    expect(applyPlainEdit('x {abc} y', 'x abcZ y')).toBe('x {abc}Z y');
    expect(applyPlainEdit('{abc}', 'Qabc')).toBe('Q{abc}');
  });

  test('deleting text keeps other highlights in place', () => {
    expect(applyPlainEdit('one {two} three', 'one two thr')).toBe('one {two} thr');
    expect(applyPlainEdit('one {two} three', 'one three')).toBe('one three');
  });

  test('toggle snaps to whole words and toggles off', () => {
    const t = 'Vláda ruší pravidla';
    const on = toggleHighlight(t, 7, 8); // inside "ruší"
    expect(on).toBe('Vláda {ruší} pravidla');
    expect(toggleHighlight(on, 6, 10)).toBe(t);
    const two = toggleHighlight(t, 2, 14);
    expect(two).toBe('{Vláda ruší pravidla}');
  });

  test('expandToWords trims spaces', () => {
    const [a, b] = expandToWords('ab  cd', 2, 4);
    expect(a >= b).toBe(true);
    expect(expandToWords('ab cd', 1, 4)).toEqual([0, 5]);
  });

  test('highlightedWords', () => {
    expect(highlightedWords('a {b c} d {e}')).toEqual(['b', 'c', 'e']);
  });
});
