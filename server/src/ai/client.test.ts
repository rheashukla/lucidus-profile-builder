import { afterEach, describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { AI_TIMEOUT_MS, setClient, withRetry } from './client';

afterEach(() => setClient(undefined));

describe('withRetry', () => {
  it('uses a 60 s timeout by default', () => expect(AI_TIMEOUT_MS).toBe(60_000));

  it('times out a hanging call, retries once, then gives up', async () => {
    setClient({} as Anthropic);
    const task = vi.fn(() => new Promise<string>(() => {}));
    const t0 = Date.now();
    expect(await withRetry('t', task, 50)).toBeNull();
    expect(task).toHaveBeenCalledTimes(2);
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('passes an abort signal that fires on timeout', async () => {
    setClient({} as Anthropic);
    let aborted = 0;
    await withRetry('t', (_ai, signal) => new Promise((_, reject) => signal.addEventListener('abort', () => { aborted++; reject(new Error('aborted')); })), 30);
    expect(aborted).toBe(2);
  });

  it('returns the first success without retrying', async () => {
    setClient({} as Anthropic);
    const task = vi.fn(async () => 'ok');
    expect(await withRetry('t', task, 50)).toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });
});
