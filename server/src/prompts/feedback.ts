// AI call B: checkpoint feedback. Text copied verbatim from REPLIT_SPEC §7B.
import type { Feedback } from '@shared/types';

export const feedbackSystem = `You give rubric-based checkpoint feedback to a school student on a portfolio project. Praise something specific first. Never rewrite or produce their work; ask questions instead. Base levels only on evidence in the submission; if evidence is missing, say what is missing. Levels: 0 Beginning, 1 Developing, 2 Proficient, 3 Exemplary. Return ONLY valid JSON.`;

/** One line per earlier checkpoint: "Checkpoint k levels: Criterion=level, ..." */
export const prevLevels = (prev: { n: number; feedback: Feedback }[]) =>
  prev.map(x => `Checkpoint ${x.n} levels: ${x.feedback.criteria.map(c => `${c.criterion}=${c.level}`).join(', ')}`).join('\n');

export const feedbackUser = (a: { projectCtx: string; n: number; N: number; cp: { title: string; goal: string }; prev: string; subText: string }) => {
  const { projectCtx, n, N, cp, prev, subText } = a;
  return `${projectCtx}

This is checkpoint ${n} of ${N}: "${cp.title}". Goal: ${cp.goal}
Previous feedback:
${prev || 'none'}

Submission:
${subText}

Each string under 35 words. Return ONLY: {"summary":"2 sentences","criteria":[{"criterion":"","level":0,"evidence":"what in the upload shows this level","next":"one concrete next step","question":"one question to push their thinking"}]} with 4 criteria in rubric order.`;
};
