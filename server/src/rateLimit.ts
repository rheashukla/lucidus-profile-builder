import type { NextFunction, Request, Response } from 'express';

const PER_MINUTE = 10;
const PER_DAY = 60;
const MIN = 60_000, DAY = 86_400_000;

// In-memory, per process. Swap for Redis if you run more than one server instance.
const hits = new Map<string, number[]>();

export function checkLimit(userId: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number; message: string } {
  const list = (hits.get(userId) || []).filter((t) => now - t < DAY);
  const lastMinute = list.filter((t) => now - t < MIN);
  if (lastMinute.length >= PER_MINUTE) {
    return { ok: false, retryAfter: Math.ceil((MIN - (now - lastMinute[0])) / 1000), message: 'Too many requests. Wait a minute and try again.' };
  }
  if (list.length >= PER_DAY) {
    return { ok: false, retryAfter: Math.ceil((DAY - (now - list[0])) / 1000), message: "You've reached today's limit. Come back tomorrow." };
  }
  list.push(now);
  hits.set(userId, list);
  return { ok: true };
}

export function resetLimits() { hits.clear(); }

/** 10 AI calls per minute and 60 per day, per user. */
export function aiLimiter(req: Request, res: Response, next: NextFunction) {
  const r = checkLimit(req.userId);
  if (r.ok) return next();
  res.setHeader('Retry-After', String(r.retryAfter));
  res.status(429).json({ error: r.message });
}
