import type { ProjectDetail, SubmissionRow } from '@shared/types';
import { TIMELINE } from '@shared/data';

/** Everything the project screens derive from server state. */
export function projectState(d: ProjectDetail) {
  const { project, submissions, review } = d;
  const tl = TIMELINE[project.inputs.weeks];
  const N = tl.cps.length;
  const cps = submissions.filter((s) => s.n > 0).sort((a, b) => a.n - b.n);
  const finalSub = submissions.find((s) => s.n === 0) || null;
  const doneN = cps.length;
  const finalDone = !!review;
  const total = N + 1;
  const doneSteps = doneN + (finalDone ? 1 : 0);
  const created = new Date(project.createdAt).getTime();
  const date = (day: number) => new Date(created + day * 86_400_000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const status = (k: number): 'done' | 'current' | 'locked' =>
    k < N ? (k < doneN ? 'done' : k === doneN ? 'current' : 'locked') : finalDone ? 'done' : doneN >= N ? 'current' : 'locked';
  const latest = review ? review.criteria.map((c) => c.level) : doneN ? cps[doneN - 1].feedback?.criteria.map((c) => c.level) ?? null : null;
  const nextUp = !finalDone && doneN < N
    ? { eyebrow: `Checkpoint ${doneN + 1} of ${N}`, title: project.brief.checkpoints[doneN]?.title || '', day: tl.cps[doneN], cta: 'Upload Progress', icon: 'upload', to: 'upload' }
    : !finalDone
      ? { eyebrow: 'Final Submission', title: 'Submit Your Finished Work', day: tl.final, cta: 'Submit Final Work', icon: 'flag', to: 'upload' }
      : { eyebrow: 'Complete', title: 'Your Final Review Is Ready', day: null, cta: 'View Final Review', icon: 'arrow_forward', to: 'review' };
  return { ...d, tl, N, cps, finalSub, doneN, finalDone, total, doneSteps, date, status, latest, nextUp, pct: Math.round((doneSteps / total) * 100) };
}

export type PState = ReturnType<typeof projectState>;

export const levelsOf = (s: SubmissionRow) => s.feedback?.criteria.map((c) => c.level) ?? [1, 1, 1, 1];
