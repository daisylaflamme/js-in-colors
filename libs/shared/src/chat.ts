// Ask Dot's pure chat logic, shared by the browser and the server (apps/api). Its own entry point,
// @jic/shared/chat, so the demo answers never ride along with the initial bundle (CLAUDE.md).
export * from './lib/chat/chat-contract';
export * from './lib/chat/demo-answers';
export * from './lib/chat/match';
export * from './lib/chat/prompt';
export * from './lib/chat/safety';
