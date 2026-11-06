import { createHash, randomBytes } from 'node:crypto';

export type LimitResult = { readonly ok: true } | { readonly ok: false; readonly retryAfterSeconds: number };

interface Usage {
  minute: number[]; // request times in the last minute
  day: string;
  dayCount: number;
}

const MINUTE = 60_000;
const MAX_CLIENTS = 10_000;

/**
 * In-memory rate limits (ADR 0012): per client per minute and per day, plus one daily cap for
 * everyone so a free tier is never used up. Clients are keyed by a salted hash of their address
 * (a new salt every start), so no address is kept or can be recovered. Nothing is logged.
 */
export class RateLimiter {
  private readonly clients = new Map<string, Usage>();
  private readonly salt = randomBytes(16).toString('hex');
  private globalDay = '';
  private globalCount = 0;
  private readonly limits: { perMinute: number; perDay: number; dailyCap: number };
  private readonly now: () => number;

  constructor(limits: { perMinute: number; perDay: number; dailyCap: number }, now: () => number = Date.now) {
    this.limits = limits;
    this.now = now;
  }

  /** Counts one request from `address` if it is allowed. */
  take(address: string): LimitResult {
    const now = this.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const untilTomorrow = Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - now) / 1000);

    if (this.globalDay !== day) {
      this.globalDay = day;
      this.globalCount = 0;
    }
    if (this.globalCount >= this.limits.dailyCap) return { ok: false, retryAfterSeconds: untilTomorrow };

    const key = createHash('sha256')
      .update(this.salt + address)
      .digest('hex');
    const usage = this.clients.get(key) ?? { minute: [], day, dayCount: 0 };
    if (usage.day !== day) Object.assign(usage, { day, dayCount: 0 });
    usage.minute = usage.minute.filter((t) => now - t < MINUTE);

    if (usage.dayCount >= this.limits.perDay) return { ok: false, retryAfterSeconds: untilTomorrow };
    if (usage.minute.length >= this.limits.perMinute) {
      return { ok: false, retryAfterSeconds: Math.ceil((usage.minute[0] + MINUTE - now) / 1000) };
    }

    usage.minute.push(now);
    usage.dayCount++;
    this.globalCount++;
    if (!this.clients.has(key) && this.clients.size >= MAX_CLIENTS) this.clients.clear();
    this.clients.set(key, usage);
    return { ok: true };
  }
}
