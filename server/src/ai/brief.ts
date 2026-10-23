import type Anthropic from '@anthropic-ai/sdk';
import type { Brief, Inputs } from '@shared/types';
import { checkpointCount } from '@shared/data';
import { briefSystem, briefUser, CREATE_BRIEF_TOOL } from '../prompts/brief';
import { fallbackBriefAsBrief } from '../fallbacks';
import { InvalidAIOutput, postProcessBrief } from './postprocess';
import { MODEL_BRIEF, withRetry } from './client';

/** AI call A. Forced tool choice; the brief is read from the tool_use block's input. */
export async function generateBrief(inputs: Inputs): Promise<{ brief: Brief; fallback: boolean }> {
  const N = checkpointCount(inputs.weeks);
  const brief = await withRetry('brief', async (ai, signal) => {
    const msg = await ai.messages.create({
      model: MODEL_BRIEF,
      max_tokens: 8000,
      system: briefSystem(inputs.country || 'not given'),
      messages: [{ role: 'user', content: briefUser(inputs, N) }],
      tools: [CREATE_BRIEF_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: 'tool', name: 'create_brief' },
    }, { signal });
    const block = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'create_brief');
    if (!block) throw new InvalidAIOutput('No create_brief tool call');
    return postProcessBrief(block.input, inputs, N);
  });
  return brief ? { brief, fallback: false } : { brief: fallbackBriefAsBrief(inputs, N), fallback: true };
}
