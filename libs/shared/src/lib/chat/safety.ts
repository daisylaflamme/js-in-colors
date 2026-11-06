// Ask Dot's safety checks, shared by the browser (ChatStore) and the server (/api/chat), so every
// provider gets the same protection (ADR 0011, ADR 0012). Pure functions, no I/O.
import { CHAT_BLOCKLIST } from './chat-blocklist';
import { QUESTION_MAX_LENGTH } from './chat-contract';

export const PRIVATE_REPLY = "Let's keep names and places private. Ask me about JavaScript instead!";
/** Ends an answer that was cut by the output check. */
export const SAFE_ENDING = "Let's talk about JavaScript instead!";

/**
 * Personal details a child might type. Checked before any provider sees the question. Kept
 * simple on purpose: it catches the common cases, and the safe chat rules ask children not to
 * type them at all. Over-triggering is the safe side.
 */
const PERSONAL_INFO: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // an email
  /(?:\d[\s().-]*){7,}/, // a phone-like run of digits
  /\bmy name is\b/i,
  /\bi am called\b/i,
  /\bi live\b/i,
  /\bmy (?:home )?address\b/i,
  /\bmy school\b/i,
  /\bmy (?:phone|number|email)\b/i,
];

export function looksPersonal(question: string): boolean {
  return PERSONAL_INFO.some((pattern) => pattern.test(question));
}

export const CARE_REPLY =
  'That sounds hard. Please tell a grown-up you trust, like a parent or a teacher. I am here for JavaScript questions any time.';

/**
 * A child who says they are hurt, scared, sad or picked on gets a fixed, caring reply that points
 * to a trusted grown-up, never an AI's answer: the live eval showed a model answering "someone at
 * school is mean to me" with a coding tip. Over-triggering is the safe side.
 */
const NEEDS_A_GROWN_UP: readonly RegExp[] = [
  /\bmean to me\b/i,
  /\bbull(?:y|ies|ied|ying)\b/i,
  /\b(?:hurts?|hurting|hit|hits|kicks?|kicked) me\b/i,
  /\bi(?:'m| am)? (?:so |very |really )?(?:scared|afraid|sad|lonely|alone|unhappy|upset)\b/i,
  /\b(?:i )?(?:feel|felt) (?:so |very |really )?(?:scared|afraid|sad|lonely|alone|unhappy|upset)\b/i,
  /\bnobody likes me\b/i,
  /\bi hate myself\b/i,
  /\bhurt myself\b/i,
];

export function needsAGrownUp(question: string): boolean {
  return NEEDS_A_GROWN_UP.some((pattern) => pattern.test(question));
}

/** Trimmed, single-spaced, no control characters, at most QUESTION_MAX_LENGTH characters. */
export function cleanQuestion(raw: string): string {
  return (
    raw
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, QUESTION_MAX_LENGTH)
  );
}

const URL_LIKE = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|dev|app|ly|gg|xyz)\b)/i;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+/;
const DIGITS_LIKE = /\d{5,}/;

/**
 * The output check, one word at a time: a word reaches the child only if it passes. Rejects
 * links, emails, long digit runs (phone numbers) and the blocklist. Words are compared without
 * punctuation and case, so "Badword!" is caught too.
 */
export function checkWord(word: string): boolean {
  if (URL_LIKE.test(word) || EMAIL_LIKE.test(word) || DIGITS_LIKE.test(word)) return false;
  const bare = word.toLowerCase().replace(/[^a-z']/g, '');
  return !CHAT_BLOCKLIST.has(bare);
}
