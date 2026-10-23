import type Anthropic from '@anthropic-ai/sdk';
import type { Brief, Feedback, FileRef, Mode, Review } from '@shared/types';
import { feedbackSystem, feedbackUser, prevLevels } from '../prompts/feedback';
import { reviewHistory, reviewSystem, reviewUser } from '../prompts/review';
import { projectCtx, subText } from '../prompts/context';
import { fallbackFeedback, fallbackReview } from '../fallbacks';
import { storage } from '../storage';
import { parseJsonObject, postProcessFeedback, postProcessReview } from './postprocess';
import { MODEL_FAST, textOf, withRetry } from './client';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_ATTACH = 5;
const MAX_ATTACH_BYTES = 5 * 1024 * 1024;

/** Images and PDFs become content blocks (max 5, ≤5 MB each); other types are sent by name only. */
export async function attachmentBlocks(files: FileRef[]): Promise<Anthropic.ContentBlockParam[]> {
  const picked = files.filter((f) => (IMAGE_TYPES.has(f.type) || f.type === 'application/pdf') && f.size <= MAX_ATTACH_BYTES).slice(0, MAX_ATTACH);
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const f of picked) {
    try {
      const data = (await storage.get(f.key)).toString('base64');
      blocks.push(f.type === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data }, title: f.name }
        : { type: 'image', source: { type: 'base64', media_type: f.type as 'image/png', data } });
    } catch (e) {
      console.warn('[ai] could not read attachment', f.key, e instanceof Error ? e.message : e);
    }
  }
  return blocks;
}

interface Sub { note: string; link: string | null; files: FileRef[] }

/** AI call B. */
export async function generateFeedback(a: {
  brief: Brief; mode: Mode; n: number; N: number; prev: { n: number; feedback: Feedback }[]; sub: Sub;
}): Promise<{ feedback: Feedback; fallback: boolean }> {
  const cp = a.brief.checkpoints[a.n - 1] || { title: '', goal: '' };
  const prompt = feedbackUser({
    projectCtx: projectCtx(a.brief, a.mode), n: a.n, N: a.N, cp, prev: prevLevels(a.prev), subText: subText(a.sub),
  });
  const attachments = await attachmentBlocks(a.sub.files);
  const feedback = await withRetry('feedback', async (ai, signal) => {
    const msg = await ai.messages.create({
      model: MODEL_FAST, max_tokens: 2000, system: feedbackSystem,
      messages: [{ role: 'user', content: [...attachments, { type: 'text', text: prompt }] }],
    }, { signal });
    return postProcessFeedback(parseJsonObject(textOf(msg)));
  });
  return feedback ? { feedback, fallback: false } : { feedback: fallbackFeedback(a.n, a.sub), fallback: true };
}

/** AI call C. */
export async function generateReview(a: {
  brief: Brief; mode: Mode; history: (Sub & { n: number; feedback: Feedback })[]; sub: Sub;
}): Promise<{ review: Review; fallback: boolean }> {
  const prompt = reviewUser({
    projectCtx: projectCtx(a.brief, a.mode),
    history: reviewHistory(a.history.map((h) => ({ n: h.n, subText: subText(h), feedback: h.feedback }))),
    subText: subText(a.sub),
  });
  const attachments = await attachmentBlocks(a.sub.files);
  const review = await withRetry('review', async (ai, signal) => {
    const msg = await ai.messages.create({
      model: MODEL_FAST, max_tokens: 2500, system: reviewSystem,
      messages: [{ role: 'user', content: [...attachments, { type: 'text', text: prompt }] }],
    }, { signal });
    return postProcessReview(parseJsonObject(textOf(msg)));
  });
  const last = a.history[a.history.length - 1]?.feedback ?? null;
  return review ? { review, fallback: false } : { review: fallbackReview(last), fallback: true };
}
