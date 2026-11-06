/** The Ask Dot server's settings, all from environment variables (see .env.example). */
export interface ApiConfig {
  readonly port: number;
  /** "groq" only when asked for AND a key is set; otherwise the canned demo answers. */
  readonly provider: 'demo' | 'groq';
  readonly groqApiKey: string | undefined;
  readonly groqModel: string;
  /** Requests per client per minute and per day, and for everyone per day (protects the free tier). */
  readonly perMinute: number;
  readonly perDay: number;
  readonly dailyCap: number;
  /** The only browser origin allowed to call the API (CORS). */
  readonly allowedOrigin: string;
}

const DEFAULTS = {
  port: 3333,
  groqModel: 'llama-3.1-8b-instant',
  perMinute: 5,
  perDay: 30,
  dailyCap: 500,
  allowedOrigin: 'http://localhost:4200',
};

function count(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function readConfig(env: Record<string, string | undefined>): ApiConfig {
  const key = env['GROQ_API_KEY']?.trim() || undefined;
  return {
    port: count(env['PORT'], DEFAULTS.port),
    provider: env['CHAT_PROVIDER'] === 'groq' && key ? 'groq' : 'demo',
    groqApiKey: key,
    groqModel: env['GROQ_MODEL']?.trim() || DEFAULTS.groqModel,
    perMinute: count(env['CHAT_PER_MINUTE'], DEFAULTS.perMinute),
    perDay: count(env['CHAT_PER_DAY'], DEFAULTS.perDay),
    dailyCap: count(env['CHAT_DAILY_CAP'], DEFAULTS.dailyCap),
    allowedOrigin: env['CHAT_ALLOWED_ORIGIN']?.trim() || DEFAULTS.allowedOrigin,
  };
}
