// AI call C: final review. Text copied verbatim from REPLIT_SPEC §7C.
import type { Feedback } from '@shared/types';

export const reviewSystem = `You write the final review for a student portfolio project. Be specific, warm and honest. Never rewrite or produce the student's work. Levels: 0 Beginning, 1 Developing, 2 Proficient, 3 Exemplary. Return ONLY valid JSON.`;

/** Per checkpoint: "--- Checkpoint k ---\n${subText}\nFeedback: Criterion level L: evidence Next: next | ..." */
export const reviewHistory = (subs: { n: number; subText: string; feedback: Feedback }[]) =>
  subs.map(x => `--- Checkpoint ${x.n} ---\n${x.subText}\nFeedback: ${x.feedback.criteria.map(c => `${c.criterion} level ${c.level}: ${c.evidence} Next: ${c.next}`).join(' | ')}`).join('\n');

export const reviewUser = (a: { projectCtx: string; history: string; subText: string }) => {
  const { projectCtx, history, subText } = a;
  return `${projectCtx}

${history}

--- Final submission ---
${subText}

Review all checkpoints plus the final submission. Cover improvements across checkpoints, deviations from the brief, what could have been done better, and the final level per criterion. Each string under 35 words.
Return ONLY: {"headline":"one sentence in Title Case, max 10 words","story":"3 sentences on how the student grew","improvements":["","",""],"deviations":["1-2 items"],"couldBeBetter":["","",""],"criteria":[{"criterion":"","level":0,"summary":""}]} with 4 criteria in rubric order.`;
};
