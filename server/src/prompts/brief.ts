// AI call A: brief, rubric and checkpoints. Text copied verbatim from REPLIT_SPEC §7A.
import type { Inputs, Mode } from '@shared/types';
import { BASE_RUBRIC, CRITERIA, LEVELS, PROJECT_TYPES, SDGS } from '@shared/data';

export const MODE_RULES: Record<Mode, string> = {
  Beginner: 'Problem: GIVE the student one specific problem. Scaffolding: 5-6 step-by-step tasks. Research: 3 secondary sources. Iterations expected: 1. Real-world contact: share with 1 person.',
  Intermediate: 'Problem: offer exactly 3 framings to choose from (put them in problemOptions; "problem" introduces the space). Scaffolding: 4 milestones only. Research: 4-5 sources + 1 primary source. Iterations: 2. Real-world contact: feedback from 3 people in the target group.',
  Advanced: 'Problem: the student defines it; describe the problem space and what they must pin down. Scaffolding: 3-4 outcomes only. Research: primary data (10+ people or a real dataset). Iterations: 3, with test evidence. Real-world contact: test with target users and measure.',
};

/** `career` for the prompt: the chosen career, or "not chosen (still exploring)". */
export const promptCareer = (career: string | null) =>
  career && career !== 'Still exploring' ? career : 'not chosen (still exploring)';

export const briefSystem = (country: string) => `You are a features editor who writes project briefs for students aged 13–18, in the style of The Economist and The New York Times: a concrete, human opening; real numbers; plain words; a sharp, slightly wry headline. A brief should make a curious teenager think "I want to work on that."

Real world only:
- You have no web search. Use only well-known, stable sources you are confident exist (UN, WHO, World Bank, UNICEF, OECD, Our World in Data, or national statistics offices), preferably covering ${country}. Prefer an organisation's topic page over a deep link.
- Every fact, number or named example must come from one of those sources and carry its source URL. If you are not confident, leave it out. Never invent people, quotes, numbers or college program details. The student will be asked to check every link.

Safety: no hazardous materials, no meeting strangers alone, no collecting sensitive personal data.

Return the brief by calling the \`create_brief\` tool.`;

export function briefUser(i: Inputs, N: number) {
  const { subjects, powers, strongest, college, degree, weeks, sdgs, mode } = i;
  const career = promptCareer(i.career);
  const country = i.country || 'not given';
  return `<student>
Subjects: ${subjects.join(', ')}
Superpowers: ${powers.join(', ')} (strongest: ${strongest})
Career: ${career}
College/degree: ${college || 'not chosen'} / ${degree || 'not chosen'}
Weeks: ${weeks} · Checkpoints: ${N}
SDG: ${sdgs.map(k => `SDG ${k} ${SDGS[k-1]}`).join('; ')}
Mode: ${mode}
Country: ${country}
</student>

<mode_rules>${MODE_RULES[mode]}</mode_rules>
<project_types>
${PROJECT_TYPES.map(t => `${t.name}: ${t.what}. Shows up as: ${t.evidence}`).join('\n')}
</project_types>
<base_rubric>
${CRITERIA.map((c, k) => `${c}: ${BASE_RUBRIC[k].map((t, j) => `${LEVELS[j]} = ${t}`).join(' | ')}`).join('\n')}
</base_rubric>

First choose projectType: the one type from <project_types> that best fits the student's strongest superpower, subjects, career (if given), time and mode. Pick what a school student can genuinely finish in the time; scale the outcome down (a pilot, a first version, a single event) rather than picking a smaller type. Every later field must describe a project of that type.

Write the brief in this order:
1. headline: ≤10 words, specific, no hype.
2. standfirst: one sentence on why this matters now.
3. lede: max 300 characters. Open with a real person, place or number from a well-known source. Cite it in ledeSource.
4. theProblem: max 300 characters. Who is affected, the scale, and a local version the student can actually reach.
5. problemOptions: Intermediate mode only, 3 potential starting points.
6. beneficiary: max 100 characters. The real person or group this helps.
7. yourMission: 2–3 bullet points, max 200 characters in total. The concrete output of the chosen project type, made using their strongest superpower.
8. steps: sized to the mode rules; title + detail max 200 characters each.
9. startingSources: 3–5 real, well-known sources, with URLs.
10. rubric: the base rubric reworded for this brief, same meaning.
11. checkpoints: exactly ${N}; each has a goal plus 2–3 things to upload. Put these instructions inside the checkpoint where they happen: 2–3 decisions only the student can make; who to talk to or what data to collect, sized to the mode; how many versions to make and what changes; and, if there are interviews or surveys, consent and no sensitive personal data.
12. whyItFitsYou: max 200 characters. Link to the career and degree if given, otherwise to their subjects and superpowers; no claims about specific colleges.

Character limits are hard limits. Count before you write.

Tone: second person, active voice, concrete nouns, no emoji, no words like "innovative", "impactful", "journey", "unlock".`;
}

// Source object inlined in both places (no $ref) so every tool-schema validator accepts it.
const src = {
  type: 'object',
  properties: { title: { type: 'string' }, publisher: { type: 'string' }, url: { type: 'string' } },
  required: ['title', 'publisher', 'url'],
} as const;

export const CREATE_BRIEF_TOOL = {
  name: 'create_brief',
  description: 'Save the finished project brief.',
  input_schema: {
    type: 'object',
    properties: {
      projectType: { type: 'string', enum: ['Research Paper', 'Venture', 'Nonprofit', 'App / Software', 'Hardware / Prototype', 'Campaign', 'Event', 'Art Portfolio', 'Data Project'] },
      headline: { type: 'string' },
      standfirst: { type: 'string' },
      lede: { type: 'string' },
      ledeSource: src,
      theProblem: { type: 'string' },
      problemOptions: { type: 'array', items: { type: 'string' }, description: 'Intermediate mode only: exactly 3 framings. Otherwise empty.' },
      beneficiary: { type: 'string', description: 'The real beneficiary. Max 100 characters.' },
      yourMission: { type: 'array', items: { type: 'string' }, description: '2-3 bullet points. Max 200 characters in total.' },
      steps: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' } }, required: ['title', 'detail'] } },
      whyItFitsYou: { type: 'string' },
      startingSources: { type: 'array', items: src },
      rubric: { type: 'array', items: { type: 'object', properties: { criterion: { type: 'string' }, levels: { type: 'array', items: { type: 'string' } } }, required: ['criterion', 'levels'] } },
      checkpoints: { type: 'array', items: { type: 'object', properties: { title: { type: 'string', description: 'Title Case, max 5 words' }, goal: { type: 'string' }, bring: { type: 'array', items: { type: 'string' } } }, required: ['title', 'goal', 'bring'] } },
    },
    required: ['projectType', 'headline', 'standfirst', 'lede', 'theProblem', 'beneficiary', 'yourMission', 'steps', 'whyItFitsYou', 'startingSources', 'rubric', 'checkpoints'],
  },
} as const;
