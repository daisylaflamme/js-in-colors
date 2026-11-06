import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, EMPTY, filter, finalize, of, pipe, tap } from 'rxjs';
import { type ChatLink, ChatService, cleanQuestion, looksPersonal, PRIVATE_REPLY } from './chat';

export interface ChatMessage {
  readonly id: number;
  readonly from: 'dot' | 'kid';
  readonly text: string;
  readonly link?: ChatLink;
}

export type ChatStatus = 'idle' | 'thinking' | 'streaming';

interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  /** The last finished Dot answer, for the screen-reader announcement. */
  readonly announcement: string;
}

export const DOT_GREETING = 'Hi! I am Dot. Ask me anything about JavaScript.';
export const DOT_OOPS = 'Oops, Dot got mixed up. Try again!';

/**
 * One chat with Dot (ADR 0011). In memory only: provide it on the chat page, so leaving the
 * page destroys the conversation. It never touches storage and never logs.
 * Personal details are caught here, before any ChatService sees them.
 */
export const ChatStore = signalStore(
  withState<ChatState>({
    messages: [{ id: 0, from: 'dot', text: DOT_GREETING }],
    status: 'idle',
    announcement: '',
  }),
  withComputed(({ status }) => ({
    busy: computed(() => status() !== 'idle'),
  })),
  withMethods((store, chat = inject(ChatService)) => {
    let nextId = 1;
    const add = (message: Omit<ChatMessage, 'id'>): number => {
      const id = nextId++;
      patchState(store, (s) => ({ messages: [...s.messages, { ...message, id }] }));
      return id;
    };
    const update = (id: number, change: (m: ChatMessage) => ChatMessage) =>
      patchState(store, (s) => ({ messages: s.messages.map((m) => (m.id === id ? change(m) : m)) }));
    const finish = (text: string) => patchState(store, { status: 'idle', announcement: `Dot says: ${text}` });

    return {
      ask: rxMethod<string>(
        pipe(
          filter((q) => q.trim().length > 0 && store.status() === 'idle'),
          concatMap((raw) => {
            const question = cleanQuestion(raw);
            add({ from: 'kid', text: question });
            if (looksPersonal(question)) {
              add({ from: 'dot', text: PRIVATE_REPLY });
              finish(PRIVATE_REPLY);
              return EMPTY;
            }
            patchState(store, { status: 'thinking', announcement: '' });
            let answerId = -1;
            let text = '';
            return chat.ask(question).pipe(
              tap((chunk) => {
                if (answerId < 0) {
                  answerId = add({ from: 'dot', text: '' });
                  patchState(store, { status: 'streaming' });
                }
                if ('text' in chunk) {
                  text += chunk.text;
                  update(answerId, (m) => ({ ...m, text }));
                } else {
                  update(answerId, (m) => ({ ...m, link: chunk.link }));
                }
              }),
              catchError(() => {
                if (answerId < 0) add({ from: 'dot', text: DOT_OOPS });
                else update(answerId, (m) => ({ ...m, text: m.text ? `${m.text} ${DOT_OOPS}` : DOT_OOPS }));
                text = DOT_OOPS;
                return of(null);
              }),
              finalize(() => finish(text)),
            );
          }),
        ),
      ),
    };
  }),
);
