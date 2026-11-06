import { checkWord, cleanQuestion, KID_SYSTEM_PROMPT, lessonLinkFor, QUESTION_MAX_LENGTH } from '../../chat';

describe('checkWord (the output check)', () => {
  it.each(['A', 'loop', 'repeats.', "Dot's", 'console.log', 'JavaScript!', '"hi"', '3', '2026'])(
    'lets %j through',
    (word) => expect(checkWord(word)).toBe(true),
  );

  it.each([
    'https://example.com',
    'www.games',
    'example.com',
    'kid@mail',
    '5551234',
    'Stupid!',
    'KILL',
    'drugs,',
  ])('stops %j', (word) => expect(checkWord(word)).toBe(false));
});

describe('cleanQuestion', () => {
  it('trims, joins spaces, drops control characters and caps the length', () => {
    expect(cleanQuestion('  what\tis \n a\u0007 loop?  ')).toBe('what is a loop?');
    expect(cleanQuestion('x'.repeat(500))).toHaveLength(QUESTION_MAX_LENGTH);
  });
});

describe('lessonLinkFor', () => {
  it('links a question about a course idea to its lesson, and nothing else', () => {
    expect(lessonLinkFor('What is a loop?')).toEqual({
      lessonId: 'loops',
      label: 'See it in the Loops lesson',
      concept: 'number',
    });
    expect(lessonLinkFor('Do you like pizza?')).toBeUndefined();
  });
});

describe('KID_SYSTEM_PROMPT', () => {
  it('states the rules the safety tests rely on', () => {
    for (const rule of ['Only talk about JavaScript', 'at most 3 short sentences', 'Never include links']) {
      expect(KID_SYSTEM_PROMPT).toContain(rule);
    }
  });
});
