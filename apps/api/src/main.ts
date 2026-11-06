// The Ask Dot API server (ADR 0012). Run it with `npm run api` (reads apps/api/.env if present).
import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import { createApp } from './app';
import { readConfig } from './config';
import { DemoProvider } from './providers/demo';
import { availableModels, GroqProvider } from './providers/groq';
import type { ChatProvider } from './providers/provider';
import { RateLimiter } from './rate-limit';

const config = readConfig(process.env);
const provider: ChatProvider =
  config.provider === 'groq' && config.groqApiKey
    ? new GroqProvider({ apiKey: config.groqApiKey, model: config.groqModel })
    : new DemoProvider();

const app = createApp({
  config,
  provider,
  limiter: new RateLimiter(config),
  clientAddress: (c) => getConnInfo(c).remote.address ?? 'unknown',
});

// Say so loudly if the model can't be used: otherwise every answer quietly falls back to canned.
if (provider.name === 'groq' && config.groqApiKey) {
  void availableModels(config.groqApiKey).then((models) => {
    if (!models) console.warn('Could not list Groq models: check GROQ_API_KEY and the network.');
    else if (!models.includes(config.groqModel)) {
      console.warn(
        `GROQ_MODEL "${config.groqModel}" is not available to this key. Available: ${models.join(', ')}`,
      );
    }
  });
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  const how =
    provider.name === 'groq'
      ? `Groq (${config.groqModel})`
      : 'canned demo answers (set CHAT_PROVIDER=groq and GROQ_API_KEY for live AI)';
  console.log(`Ask Dot API on http://localhost:${info.port}, answering with ${how}.`);
});
