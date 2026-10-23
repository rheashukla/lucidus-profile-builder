import { beforeEach, describe, expect, it } from 'vitest';
import { checkLimit, resetLimits } from './rateLimit';

beforeEach(() => resetLimits());

describe('AI rate limit', () => {
  it('allows 10 per minute, then blocks until the minute passes', () => {
    const t = 1_000_000_000;
    for (let i = 0; i < 10; i++) expect(checkLimit('u', t + i).ok).toBe(true);
    const blocked = checkLimit('u', t + 10);
    expect(blocked.ok).toBe(false);
    expect(checkLimit('other', t + 10).ok).toBe(true);
    expect(checkLimit('u', t + 60_001).ok).toBe(true);
  });

  it('allows 60 per day', () => {
    let t = 2_000_000_000;
    for (let i = 0; i < 60; i++) { expect(checkLimit('u', t).ok).toBe(true); t += 61_000; }
    const r = checkLimit('u', t);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('limit');
    expect(checkLimit('u', t + 86_400_000).ok).toBe(true);
  });
});
