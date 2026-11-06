import type { Concept } from '../concepts';

/** A link from an answer to the lesson that shows the idea. */
export interface ChatLink {
  readonly lessonId: string;
  /** e.g. "See it in the Loops lesson" */
  readonly label: string;
  /** Drawn as its shape next to the link. */
  readonly concept: Concept;
}

/**
 * One piece of a streamed answer: some words, or a lesson link (sent last). The browser's
 * ChatService and the server's /api/chat stream speak exactly this (ADR 0011, ADR 0012).
 */
export type ChatChunk = { readonly text: string } | { readonly link: ChatLink };

/** The longest question a child can send (the input box and the server both enforce it). */
export const QUESTION_MAX_LENGTH = 200;
