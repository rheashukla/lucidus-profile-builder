// Shared prompt blocks for calls B and C. Text copied verbatim from REPLIT_SPEC §7B.
import type { Brief, FileRef, Mode } from '@shared/types';

export interface SubLike { note: string; link?: string | null; files: Pick<FileRef, 'name' | 'type'>[] }

export const projectCtx = (b: Brief, mode: Mode) => {
  const { title, projectType, problem, beneficiary, deliverableList, rubric } = b;
  return `Project: ${title}
Project type: ${projectType}
Mode: ${mode}
Problem: ${problem}
Beneficiary: ${beneficiary}
Deliverable: ${deliverableList.join(' ')}
Rubric:
${rubric.map(r => `${r.criterion}: ${r.levels.map((t, j) => `[${j}] ${t}`).join(' ')}`).join('\n')}`;
};

export const subText = ({ note, files, link }: SubLike) => `Student's note: ${note}
Files uploaded: ${files.length ? files.map(f => `${f.name} (${f.type || 'file'})`).join(', ') : 'none'}
Link: ${link || 'none'}`;
