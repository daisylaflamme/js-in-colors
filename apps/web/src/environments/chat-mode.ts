import type { ChatMode } from '@jic/data-access/chat';

/**
 * Ask Dot answers from pre-written answers (demo) in every normal build. The `live` build
 * configuration swaps this file for chat-mode.live.ts (npm run start:live, ADR 0012).
 */
export const CHAT_MODE: ChatMode = 'demo';
