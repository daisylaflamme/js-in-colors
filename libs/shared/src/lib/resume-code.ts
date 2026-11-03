/**
 * Resume codes such as `blue-fox-42`: a random, friendly key for a child's progress (ADR 0001, ADR 0008).
 * The code is generated, never chosen, and says nothing about the person. 32 × 32 × 90 ≈ 92 000 codes.
 *
 * The word lists are short, easy to read aloud and spell, and checked for anything that could
 * be unkind or confusing when combined. Changing them never breaks old codes (codes are only
 * validated by shape).
 */
// prettier-ignore
export const RESUME_CODE_ADJECTIVES = [
  'blue', 'green', 'red', 'pink', 'gold', 'teal', 'mint', 'lime',
  'plum', 'ruby', 'navy', 'sky', 'sunny', 'happy', 'brave', 'calm',
  'kind', 'swift', 'merry', 'jolly', 'lucky', 'cozy', 'fuzzy', 'bright',
  'shiny', 'quiet', 'clever', 'gentle', 'bouncy', 'sparkly', 'starry', 'cheery',
] as const;

// prettier-ignore
export const RESUME_CODE_ANIMALS = [
  'fox', 'owl', 'cat', 'dog', 'bee', 'yak', 'emu', 'elk',
  'seal', 'duck', 'frog', 'goat', 'hare', 'lamb', 'mole', 'newt',
  'panda', 'koala', 'otter', 'robin', 'whale', 'zebra', 'tiger', 'llama',
  'puffin', 'turtle', 'rabbit', 'badger', 'beaver', 'parrot', 'gecko', 'bunny',
] as const;

const PATTERN = /^[a-z]{2,8}-[a-z]{3,7}-[1-9][0-9]$/;

/** Fills a Uint32Array with random values. Defaults to the Web Crypto API (browser and Node). */
export type RandomSource = (buffer: Uint32Array) => Uint32Array;

const cryptoRandom: RandomSource = (buffer) => globalThis.crypto.getRandomValues(buffer);

/** A new random code, e.g. `brave-otter-37`. */
export function createResumeCode(random: RandomSource = cryptoRandom): string {
  const [a, b, c] = random(new Uint32Array(3));
  const adjective = RESUME_CODE_ADJECTIVES[a % RESUME_CODE_ADJECTIVES.length];
  const animal = RESUME_CODE_ANIMALS[b % RESUME_CODE_ANIMALS.length];
  const number = 10 + (c % 90);
  return `${adjective}-${animal}-${number}`;
}

/** True for anything shaped like a resume code (`word-word-NN`, lowercase, 10-99). */
export function isResumeCode(value: unknown): value is string {
  return typeof value === 'string' && PATTERN.test(value);
}
