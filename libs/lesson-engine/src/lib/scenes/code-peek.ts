import { type CodeNoteData, tokenizeJs } from '@jic/shared';
import type { CodeNote, CodeToken } from '@jic/ui';

let nextId = 0;

/** A unique id for a code panel (the "Peek at the code" toggle points at it with aria-controls). */
export function codePanelId(): string {
  return `jic-code-peek-${nextId++}`;
}

/**
 * Turns a lesson's code line and notes into what CodePanel shows. Each note's term is colored
 * like the matching token in the line (e.g. the jar's name in yellow).
 */
export function codePanelData(
  code: string,
  notes: readonly CodeNoteData[] = [],
): { tokens: CodeToken[]; notes: CodeNote[] } {
  const tokens = tokenizeJs(code);
  return {
    tokens,
    notes: notes.map((n) => ({
      term: n.term,
      text: n.text,
      kind: tokens.find((t) => t.text === n.term)?.kind ?? 'keyword',
    })),
  };
}
