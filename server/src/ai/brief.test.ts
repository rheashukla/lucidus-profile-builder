import { afterEach, describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { setClient } from './client';
import { generateBrief } from './brief';
import { inputs, raw } from './__fixtures__/briefs';

const toolMsg = (input: unknown) => ({ content: [{ type: 'tool_use', id: 't', name: 'create_brief', input }] });
const fake = (create: (...a: unknown[]) => unknown) => ({ messages: { create: vi.fn(create) } }) as unknown as Anthropic & { messages: { create: ReturnType<typeof vi.fn> } };

afterEach(() => setClient(undefined));

describe('generateBrief', () => {
  it('forces the create_brief tool and reads the tool_use input', async () => {
    const c = fake(async () => toolMsg(raw.Beginner)); setClient(c);
    const { brief, fallback } = await generateBrief(inputs.Beginner);
    expect(fallback).toBe(false);
    expect(brief.projectType).toBe('Art Portfolio');
    const args = c.messages.create.mock.calls[0][0] as Record<string, any>;
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'create_brief' });
    expect(args.max_tokens).toBe(8000);
    expect(args.messages[0].content).toContain('Career: Marine Biologist');
    expect(args.system).toContain('preferably covering Canada');
  });

  it('passes "not chosen (still exploring)" when no career', async () => {
    const c = fake(async () => toolMsg(raw.Advanced)); setClient(c);
    await generateBrief(inputs.Advanced);
    expect((c.messages.create.mock.calls[0][0] as any).messages[0].content).toContain('Career: not chosen (still exploring)');
  });

  it('retries once after an invalid response, then succeeds', async () => {
    let n = 0;
    const c = fake(async () => (n++ === 0 ? toolMsg({ headline: '' }) : toolMsg(raw.Intermediate))); setClient(c);
    const { fallback } = await generateBrief(inputs.Intermediate);
    expect(fallback).toBe(false);
    expect(c.messages.create).toHaveBeenCalledTimes(2);
  });

  it('falls back to the sample brief after two failures', async () => {
    const c = fake(async () => { throw new Error('overloaded'); }); setClient(c);
    const { brief, fallback } = await generateBrief(inputs.Beginner);
    expect(fallback).toBe(true);
    expect(c.messages.create).toHaveBeenCalledTimes(2);
    expect(brief.title).toBe('Photography For Life Below Water');
    expect(brief.projectType).toBe('');
    expect(brief.checkpoints).toHaveLength(2);
  });

  it('falls back immediately with no API key', async () => {
    setClient(null);
    const { fallback, brief } = await generateBrief(inputs.Intermediate);
    expect(fallback).toBe(true);
    expect(brief.problemOptions).toHaveLength(3);
    expect(brief.rubric).toHaveLength(4);
  });
});
