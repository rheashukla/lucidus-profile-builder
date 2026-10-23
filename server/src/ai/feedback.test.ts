import { afterEach, describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { setClient } from './client';
import { generateFeedback, generateReview } from './feedback';
import { postProcessBrief } from './postprocess';
import { inputs, raw } from './__fixtures__/briefs';

vi.mock('../storage', () => ({ storage: { get: vi.fn(async (key: string) => Buffer.from(`bytes:${key}`)) } }));

const brief = postProcessBrief(raw.Beginner, inputs.Beginner, 2);
const crit = (level: number) => ({ criterion: 'x', level, evidence: 'e', next: 'n', question: 'q' });
const fbJson = JSON.stringify({ summary: 'Nice start. Keep going.', criteria: [crit(1), crit(2), crit(7), crit(0)] });
const fake = (text: string) => ({ messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text }] })) } }) as unknown as Anthropic & { messages: { create: ReturnType<typeof vi.fn> } };

afterEach(() => setClient(undefined));

const files = [
  { key: 'u/1.png', name: 'beach.png', type: 'image/png', size: 1000 },
  { key: 'u/2.pdf', name: 'plan.pdf', type: 'application/pdf', size: 2000 },
  { key: 'u/3.mp4', name: 'clip.mp4', type: 'video/mp4', size: 3000 },
  { key: 'u/4.jpg', name: 'huge.jpg', type: 'image/jpeg', size: 6 * 1024 * 1024 },
];

describe('generateFeedback', () => {
  it('attaches images and PDFs (≤5 MB) as content blocks and lists every file by name', async () => {
    const c = fake('Here you go: ' + fbJson); setClient(c);
    const { feedback, fallback } = await generateFeedback({
      brief, mode: 'Beginner', n: 1, N: 2, prev: [], sub: { note: 'I took eight photos of the beach.', link: null, files },
    });
    expect(fallback).toBe(false);
    expect(feedback.criteria.map((x) => x.level)).toEqual([1, 2, 3, 0]);
    const args = c.messages.create.mock.calls[0][0] as any;
    expect(args.model).toBe('claude-haiku-4-5');
    expect(args.max_tokens).toBe(2000);
    const blocks = args.messages[0].content;
    expect(blocks.map((b: any) => b.type)).toEqual(['image', 'document', 'text']);
    expect(blocks[0].source).toMatchObject({ type: 'base64', media_type: 'image/png' });
    expect(blocks[1].source.media_type).toBe('application/pdf');
    expect(blocks[2].text).toContain('Files uploaded: beach.png (image/png), plan.pdf (application/pdf), clip.mp4 (video/mp4), huge.jpg (image/jpeg)');
    expect(blocks[2].text).toContain('This is checkpoint 1 of 2: "Checkpoint Title 1"');
    expect(blocks[2].text).toContain('Previous feedback:\nnone');
  });

  it('caps attachments at 5', async () => {
    const c = fake(fbJson); setClient(c);
    const many = Array.from({ length: 8 }, (_, k) => ({ key: `u/${k}.png`, name: `${k}.png`, type: 'image/png', size: 10 }));
    await generateFeedback({ brief, mode: 'Beginner', n: 1, N: 2, prev: [], sub: { note: 'note note note note note', link: null, files: many } });
    const blocks = (c.messages.create.mock.calls[0][0] as any).messages[0].content;
    expect(blocks.filter((b: any) => b.type === 'image')).toHaveLength(5);
  });

  it('retries once on bad JSON, then returns the sample feedback', async () => {
    const c = fake('not json'); setClient(c);
    const { feedback, fallback } = await generateFeedback({ brief, mode: 'Beginner', n: 2, N: 2, prev: [], sub: { note: 'A note that is long enough.', link: null, files: [] } });
    expect(fallback).toBe(true);
    expect(c.messages.create).toHaveBeenCalledTimes(2);
    expect(feedback.criteria).toHaveLength(4);
    expect(feedback.summary).toContain('A note that is long enough.');
  });
});

describe('generateReview', () => {
  it('sends history and returns a clamped review', async () => {
    const rv = { headline: 'You Did It', story: 's', improvements: ['a'], deviations: ['b'], couldBeBetter: ['c'], criteria: [{ level: 3, summary: 'x' }, { level: 2, summary: 'x' }, { level: '9', summary: 'x' }, { level: 'x', summary: 'x' }] };
    const c = fake(JSON.stringify(rv)); setClient(c);
    const fb = { summary: 's', criteria: [0, 1, 2, 3].map((l) => ({ criterion: 'c', level: l as 0, evidence: 'ev', next: 'nx', question: 'q' })) };
    const { review, fallback } = await generateReview({ brief, mode: 'Beginner', history: [{ n: 1, note: 'first', link: null, files: [], feedback: fb }], sub: { note: 'final note here!!', link: 'https://x.y', files: [] } });
    expect(fallback).toBe(false);
    expect(review.criteria.map((x) => x.level)).toEqual([3, 2, 3, 1]);
    const text = (c.messages.create.mock.calls[0][0] as any).messages[0].content.at(-1).text;
    expect(text).toContain('--- Checkpoint 1 ---');
    expect(text).toContain('Feedback: c level 0: ev Next: nx | c level 1');
    expect(text).toContain('--- Final submission ---');
    expect(text).toContain('Link: https://x.y');
  });
  it('falls back with no API key', async () => {
    setClient(null);
    const { review, fallback } = await generateReview({ brief, mode: 'Beginner', history: [], sub: { note: 'x'.repeat(20), link: null, files: [] } });
    expect(fallback).toBe(true);
    expect(review.headline).toBe('You Turned A Broad Topic Into Focused Work');
  });
});
