# 0011. Ask Dot: demo mode first, behind ChatService

- Status: Accepted
- Date: 2026-11-05

## Context

Mockup 09 is "Ask Dot": a child types a question about JavaScript and Dot answers. The hard rules (CLAUDE.md #4 and #5, ADR 0001, ADR 0003) are that chat content is never persisted or logged, the AI is only reached through a server-side proxy with the key on the server, a demo mode returns canned kid-safe answers, and the client talks to a swappable `ChatService`. A real proxy needs a host, an API key, a rate limit and a spending cap. The owner chose to ship demo mode first.

## Decision

- **The contract:** `ChatService.ask(question): Observable<ChatChunk>`, where a chunk is some words (`{ text }`) or a lesson link (`{ link }`, sent last), then complete. It is a real stream, so the screen already handles answers that arrive word by word. The later proxy (`apps/api`) must stream the same chunks.
- **Demo mode** (`DemoChatService`, the only provider for now): one pre-written answer per course idea (`DEMO_ANSWERS`, original text, 12 words or fewer per sentence, each linking to its lesson). The question is normalized and matched by whole-word keywords. Anything else gets a gentle redirect back to JavaScript, chosen by a stable hash so the same question always gets the same reply. Words stream about 60 ms apart; with Calm or reduced motion the whole answer comes at once. No network request is made.
- **A personal-info guard runs before any provider.** `ChatStore` checks each question for an email, a phone-like run of digits, "my name is", "I live", "my address", "my school" and similar, and answers "Let's keep names and places private" without passing the question on. The future proxy gets the same protection for free; it is a backstop, not a promise (the safe chat rules ask children not to type these at all).
- **Memory only.** `ChatStore` is provided by the chat page, so leaving the page destroys the conversation. It never touches storage and never logs.
- **Screen readers** hear each finished answer once, from a polite status region. The message list is a `role="log"` with live announcements off, so they do not hear it word by word.
- **No GraphQL or MSW yet.** Demo mode needs no network, so ADR 0003's client stack waits for the proxy, which gets its own ADR (system prompt, rate limit, cost cap, hosting).

## Consequences

- The chat screen, store, guard and tests are final; only the provider changes when the proxy arrives.
- Demo answers only cover the course's ideas. That is honest about what the demo is ("Demo mode" pill and note) and keeps every answer reviewed and kid-safe.
- Keyword matching is crude ("for" and "if" are common words). It is tested on the questions children are likely to ask, and the redirect is friendly when it misses.
- The guard can be fooled and can over-trigger (a question about a variable called "my name is"). Over-triggering is the safe side.
