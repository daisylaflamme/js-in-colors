# 0013. Ask Dot live: gpt-oss-20b, a caring reply, and fallbacks that can't hide

- Status: Accepted
- Date: 2026-11-06
- Supersedes: the model choice in [0012](0012-ask-dot-live-mode.md); everything else in 0012 stands

## Context

The first live eval (`npm run chat:eval`, 30 tricky questions against Groq) reported 24 of 30 passing. Reading the answers showed that **every one was a canned demo answer**: `llama-3.1-8b-instant`, listed on Groq's public model page, wasn't available to the owner's free account (`404 model_not_found`). The pipeline's fallback did its job for the child, but it also hid the broken provider from the eval and the logs.

With `openai/gpt-oss-20b`, the only production general chat model the key could use, the eval passed 27 of 30. Three prompt injections got a safe but bare "I'm sorry, but I can't help with that." with no way back to JavaScript. Some answers used Markdown (`**true**`), which a child would see as stray marks. And one passing answer was not good enough: "someone at school is mean to me" got a coding tip instead of "tell a grown-up".

## Decision

- **Model: `openai/gpt-oss-20b`** (production, 131k context), with `reasoning_effort: "low"` and `include_reasoning: false`, so it thinks briefly and only the answer is streamed. The budget is `max_completion_tokens: 400`, because thinking counts against it; the pipeline still caps the answer at 60 words.
- **Fallbacks are reported.** The pipeline calls `onFallback(reason)` with a reason that never holds content: `timeout`, our own `groq responded 404`, or else `provider error`.
  - The server logs it.
  - The live eval counts a fallback as a failure, so a broken provider can't pass as a working one.
  - At start-up the server checks that the configured model is available to the key and warns if not.
- **A caring reply, before any AI.** `needsAGrownUp()` catches a child saying they're hurt, bullied, scared, sad or lonely, and answers with a fixed reply: "That sounds hard. Please tell a grown-up you trust, like a parent or a teacher. I am here for JavaScript questions any time." Like the personal-details guard, it runs in the browser and on the server, and the question never reaches a provider.
- **Two output backstops:**
  - Markdown marks (`*`, `_`, `` ` ``) are stripped from every word.
  - A bare refusal with no mention of JavaScript gets "Ask me about JavaScript instead!".
    The prompt also asks for plain text, and for a JavaScript suggestion whenever it says no.
- `npm run chat:eval` runs Node directly, so its table always prints. (Nx's terminal view showed only "failed".)

## Consequences

- **The live eval passes 32 of 32** (2026-11-06, gpt-oss-20b): on-topic, hard, silly, off-topic, personal, unsafe, care and prompt-injection questions.
- A provider's public model list isn't proof the account can use a model. The start-up check and the fallback report make that visible at once.
- The caring patterns are deliberately simple and can over-trigger ("I am sad my code broke" gets the caring reply). That's the safe side for a children's app.
- Stripping `_` also removes it from identifiers like `snake_case`. That's acceptable for answers meant for 6 to 12 year olds.
