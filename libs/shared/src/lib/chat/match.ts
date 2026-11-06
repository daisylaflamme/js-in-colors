import type { ChatLink } from './chat-contract';
import { type DemoAnswer, DEMO_ANSWERS, DEMO_REDIRECTS } from './demo-answers';

/** Lowercase words only, so "What's a LOOP?" matches "loop". */
export function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\.(?!\w)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The answer whose keywords appear most (whole words); ties go to the first in the list. */
export function matchAnswer(question: string): DemoAnswer | undefined {
  const words = ` ${normalize(question)} `;
  let best: DemoAnswer | undefined;
  let bestScore = 0;
  for (const answer of DEMO_ANSWERS) {
    const score = answer.keywords.filter((k) => words.includes(` ${k} `)).length;
    if (score > bestScore) {
      best = answer;
      bestScore = score;
    }
  }
  return best;
}

/** The same question always gets the same redirect (no randomness in tests or screenshots). */
export function redirectFor(question: string): string {
  let hash = 0;
  for (const ch of normalize(question)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return DEMO_REDIRECTS[hash % DEMO_REDIRECTS.length];
}

/** The lesson link for a question, if it is about a course idea ("See it in the Loops lesson"). */
export function lessonLinkFor(question: string): ChatLink | undefined {
  const lesson = matchAnswer(question)?.lesson;
  return lesson
    ? { lessonId: lesson.id, label: `See it in the ${lesson.name} lesson`, concept: lesson.concept }
    : undefined;
}
