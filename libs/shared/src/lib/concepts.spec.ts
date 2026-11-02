import { CONCEPT_INFO, CONCEPTS, isConcept } from './concepts';

describe('concepts', () => {
  it('has info for every concept, keyed by itself', () => {
    for (const c of CONCEPTS) {
      expect(CONCEPT_INFO[c].concept).toBe(c);
      expect(CONCEPT_INFO[c].kidWord.length).toBeGreaterThan(0);
    }
  });

  it('narrows unknown values', () => {
    expect(isConcept('string')).toBe(true);
    expect(isConcept('banana')).toBe(false);
    expect(isConcept(42)).toBe(false);
  });
});
