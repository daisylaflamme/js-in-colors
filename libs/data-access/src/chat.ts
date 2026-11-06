// Ask Dot (ADR 0011): its own entry point, so only the lazy chat page pulls this code in.
// Re-exporting it from the main barrel put the demo answers in the initial bundle.
export * from './lib/chat/chat';
export * from './lib/chat/chat.store';
export * from './lib/chat/demo-chat.service';
