import {
  createResumeCode,
  isResumeCode,
  RESUME_CODE_ADJECTIVES,
  RESUME_CODE_ANIMALS,
  type RandomSource,
} from './resume-code';

const fixed =
  (...values: number[]): RandomSource =>
  (buffer) => {
    buffer.set(values);
    return buffer;
  };

describe('resume codes', () => {
  it('builds adjective-animal-number from the random source', () => {
    expect(createResumeCode(fixed(0, 0, 32))).toBe('blue-fox-42');
    expect(createResumeCode(fixed(0, 0, 0))).toBe('blue-fox-10');
    expect(createResumeCode(fixed(31, 31, 89))).toBe('cheery-bunny-99');
  });

  it('wraps large random values into the lists', () => {
    expect(createResumeCode(fixed(32, 33, 90))).toBe('blue-owl-10');
  });

  it('uses the Web Crypto API by default and always makes valid codes', () => {
    for (let i = 0; i < 200; i++) expect(isResumeCode(createResumeCode())).toBe(true);
  });

  it('has 32 unique, short, lowercase words in each list', () => {
    for (const list of [RESUME_CODE_ADJECTIVES, RESUME_CODE_ANIMALS]) {
      expect(list).toHaveLength(32);
      expect(new Set(list).size).toBe(32);
      for (const word of list) expect(word).toMatch(/^[a-z]{2,7}$/);
    }
  });

  it('every word combination is a valid code', () => {
    for (const a of RESUME_CODE_ADJECTIVES)
      for (const b of RESUME_CODE_ANIMALS) expect(isResumeCode(`${a}-${b}-10`)).toBe(true);
  });

  it('rejects anything not shaped like a code', () => {
    for (const bad of ['', 'blue-fox', 'blue-fox-4', 'blue-fox-100', 'Blue-fox-42', 'blue fox 42', 42, null])
      expect(isResumeCode(bad)).toBe(false);
  });

  it('is at most 17 characters, the width the resume code pill reserves (ADR 0014)', () => {
    const longest = (words: readonly string[]) => Math.max(...words.map((w) => w.length));
    expect(
      longest(RESUME_CODE_ADJECTIVES) + longest(RESUME_CODE_ANIMALS) + '-'.length * 2 + 2,
    ).toBeLessThanOrEqual(17);
  });
});
