import Anthropic from '@anthropic-ai/sdk';

export const MODEL_BRIEF = process.env.MODEL_BRIEF || 'claude-sonnet-4-5';
export const MODEL_FAST = process.env.MODEL_FAST || 'claude-haiku-4-5';
export const AI_TIMEOUT_MS = 60_000;

let client: Anthropic | null | undefined;

/** Null when ANTHROPIC_API_KEY is unset, so every AI route falls back to sample content. */
export function getClient(): Anthropic | null {
  if (client === undefined) {
    client = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: AI_TIMEOUT_MS, maxRetries: 0 })
      : null;
  }
  return client;
}

/** Test hook: swap in a fake client. */
export function setClient(c: Anthropic | null | undefined) { client = c; }

/**
 * Runs an AI task with a 60 s timeout, retrying once on API error, timeout or invalid output.
 * Returns null when both attempts fail (the caller then uses fallback content).
 */
export async function withRetry<T>(label: string, task: (ai: Anthropic, signal: AbortSignal) => Promise<T>): Promise<T | null> {
  const ai = getClient();
  if (!ai) return null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await task(ai, AbortSignal.timeout(AI_TIMEOUT_MS));
    } catch (e) {
      console.warn(`[ai:${label}] attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

export const textOf = (msg: Anthropic.Message) =>
  msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
