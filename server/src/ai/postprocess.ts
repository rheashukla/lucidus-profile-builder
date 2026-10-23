// Pure validation and repair of model output (REPLIT_SPEC §7 post-processing rules).
import { z } from 'zod';
import type { Brief, Feedback, Inputs, Level, ProjectType, Review, Source } from '@shared/types';
import { BASE_RUBRIC, CRITERIA, PROJECT_TYPES } from '@shared/data';
import { cut } from '@shared/text';

export class InvalidAIOutput extends Error {}

export { cut };

/** Levels are integers 0–3; non-numbers become 1. */
export function clampLevel(v: unknown): Level {
  const n = parseInt(String(v), 10);
  return (Number.isNaN(n) ? 1 : Math.max(0, Math.min(3, n))) as Level;
}

const isHttp = (u: string) => /^https?:\/\//i.test(u.trim());

/** Parse JSON from the first "{" to the last "}". */
export function parseJsonObject(text: string): unknown {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new InvalidAIOutput('No JSON object in response');
  try { return JSON.parse(text.slice(a, b + 1)); } catch { throw new InvalidAIOutput('Malformed JSON'); }
}

const str = z.preprocess((v) => (v == null ? '' : typeof v === 'string' ? v : String(v)), z.string());
const strList = z.preprocess((v) => (Array.isArray(v) ? v : v == null ? [] : [v]), z.array(str));
const source = z.object({ title: str, publisher: str, url: str });

const rawBrief = z.object({
  projectType: str,
  headline: str,
  standfirst: str,
  lede: str,
  ledeSource: source.nullish().catch(null),
  theProblem: str,
  problemOptions: strList.catch([]),
  beneficiary: str,
  yourMission: z.union([z.array(str), str]),
  steps: z.array(z.object({ title: str, detail: str })).catch([]),
  whyItFitsYou: str,
  startingSources: z.array(source.nullable().catch(null)).catch([]),
  rubric: z.array(z.object({ criterion: str, levels: strList.catch([]) })),
  checkpoints: z.array(z.object({ title: str, goal: str, bring: strList.catch([]) })),
});

const TYPES = new Set(PROJECT_TYPES.map((t) => t.name));

export function postProcessBrief(raw: unknown, inputs: Inputs, N: number): Brief {
  const p = rawBrief.safeParse(raw);
  if (!p.success) throw new InvalidAIOutput('Brief failed schema: ' + p.error.issues[0]?.path.join('.'));
  const o = p.data;
  const title = o.headline.trim();
  if (!title) throw new InvalidAIOutput('Missing headline');
  if (o.rubric.length !== 4) throw new InvalidAIOutput(`Rubric has ${o.rubric.length} rows`);
  if (o.checkpoints.length < N) throw new InvalidAIOutput(`Only ${o.checkpoints.length} of ${N} checkpoints`);

  let mission = Array.isArray(o.yourMission) ? o.yourMission : o.yourMission.split(/\n+/);
  mission = mission.map((x) => x.replace(/^[-•*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 3);
  const per = Math.floor(200 / Math.max(mission.length, 1));
  mission = mission.map((x) => cut(x, per));

  const steps = o.steps.map((x) => {
    const t = cut(x.title, 60);
    return { title: t, detail: cut(x.detail, 200 - t.length) };
  });

  const cleanSource = (x: Source | null | undefined): Source | null =>
    x && isHttp(x.url) ? { title: x.title.trim(), publisher: x.publisher.trim(), url: x.url.trim() } : null;

  return {
    projectType: TYPES.has(o.projectType) ? (o.projectType as ProjectType) : '',
    title,
    oneLiner: o.standfirst.trim(),
    lede: cut(o.lede, 300),
    ledeSource: cleanSource(o.ledeSource),
    problem: cut(o.theProblem, 300),
    problemOptions: inputs.mode === 'Intermediate' ? o.problemOptions.map((x) => x.trim()).filter(Boolean).slice(0, 3) : [],
    beneficiary: cut(o.beneficiary, 100),
    deliverableList: mission,
    steps,
    research: o.startingSources.map(cleanSource).filter((x): x is Source => !!x),
    programFit: cut(o.whyItFitsYou, 200),
    rubric: o.rubric.map((r, k) => ({
      criterion: CRITERIA[k],
      levels: (r.levels.length === 4 ? r.levels : BASE_RUBRIC[k]) as [string, string, string, string],
    })),
    checkpoints: o.checkpoints.slice(0, N).map((c) => ({ title: c.title.trim(), goal: c.goal.trim(), bring: c.bring.map((b) => b.trim()).filter(Boolean) })),
    country: inputs.country,
  };
}

const rawFeedback = z.object({
  summary: str,
  criteria: z.array(z.object({ criterion: str.optional(), level: z.unknown(), evidence: str, next: str, question: str })),
});

export function postProcessFeedback(raw: unknown): Feedback {
  const p = rawFeedback.safeParse(raw);
  if (!p.success) throw new InvalidAIOutput('Feedback failed schema');
  if (!p.data.summary.trim()) throw new InvalidAIOutput('Missing summary');
  if (p.data.criteria.length !== 4) throw new InvalidAIOutput(`Feedback has ${p.data.criteria.length} criteria`);
  return {
    summary: p.data.summary.trim(),
    criteria: p.data.criteria.map((c, k) => ({
      criterion: CRITERIA[k], level: clampLevel(c.level), evidence: c.evidence, next: c.next, question: c.question,
    })),
  };
}

const rawReview = z.object({
  headline: str, story: str,
  improvements: strList.catch([]), deviations: strList.catch([]), couldBeBetter: strList.catch([]),
  criteria: z.array(z.object({ criterion: str.optional(), level: z.unknown(), summary: str })),
});

export function postProcessReview(raw: unknown): Review {
  const p = rawReview.safeParse(raw);
  if (!p.success) throw new InvalidAIOutput('Review failed schema');
  if (!p.data.headline.trim()) throw new InvalidAIOutput('Missing headline');
  if (p.data.criteria.length !== 4) throw new InvalidAIOutput(`Review has ${p.data.criteria.length} criteria`);
  const list = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);
  return {
    headline: p.data.headline.trim(), story: p.data.story.trim(),
    improvements: list(p.data.improvements), deviations: list(p.data.deviations), couldBeBetter: list(p.data.couldBeBetter),
    criteria: p.data.criteria.map((c, k) => ({ criterion: CRITERIA[k], level: clampLevel(c.level), summary: c.summary })),
  };
}
