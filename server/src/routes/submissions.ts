import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { FileRef } from '@shared/types';
import { checkpointCount } from '@shared/data';
import { db, schema } from '../db';
import { handle, HttpError } from '../http';
import { parseBody, parseId } from '../validation';
import { aiLimiter } from '../rateLimit';
import { generateFeedback, generateReview } from '../ai/feedback';
import { getOwnedProject, XP } from './projects';
import { MAX_FILES } from './uploads';
import { fileOwnerIds } from './auth';

export const submissionsRouter = Router();

export const MIN_NOTE = 20;

const fileRef = z.object({
  key: z.string().min(1).max(300),
  name: z.string().max(200),
  type: z.string().max(120),
  size: z.number().int().nonnegative(),
});

const httpUrl = z.string().trim().max(500).refine((u) => u === '' || /^https?:\/\/\S+$/i.test(u), 'Link must start with http:// or https://');

const submissionSchema = z.object({
  note: z.string().trim().min(MIN_NOTE, `Add a short note about what you did (${MIN_NOTE}+ characters).`).max(5000),
  link: httpUrl.optional().default(''),
  files: z.array(fileRef).max(MAX_FILES).default([]),
});

const draftSchema = z.object({
  note: z.string().max(5000).default(''),
  link: z.string().max(500).default(''),
  files: z.array(fileRef).max(MAX_FILES).default([]),
});

/** Uploaded files are keyed under the uploader's user id (or an anonymous user merged into it); refuse anyone else's. */
async function assertOwnFiles(userId: string, files: FileRef[]) {
  if (!files.length) return;
  const owners = await fileOwnerIds(userId);
  const ok = (k: string) => !k.includes('..') && owners.some((o) => k.startsWith(`${o}/`));
  if (!files.every((f) => ok(f.key))) throw new HttpError(400, 'Unknown file.');
}

submissionsRouter.put('/projects/:id/draft/:n', handle(async (req, res) => {
  const project = await getOwnedProject(req.userId, parseId(req.params.id));
  const n = Number(req.params.n);
  if (!Number.isInteger(n) || n < 0 || n > checkpointCount(project.inputs.weeks)) throw new HttpError(400, 'Bad checkpoint.');
  const d = parseBody(draftSchema, req.body);
  await assertOwnFiles(req.userId, d.files);
  const [row] = await db.insert(schema.drafts).values({ projectId: project.id, n, ...d, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [schema.drafts.projectId, schema.drafts.n], set: { ...d, updatedAt: new Date() } })
    .returning();
  res.json(row);
}));

submissionsRouter.post('/projects/:id/submissions', aiLimiter, handle(async (req, res) => {
  const project = await getOwnedProject(req.userId, parseId(req.params.id));
  const body = parseBody(submissionSchema, req.body);
  await assertOwnFiles(req.userId, body.files);

  const N = checkpointCount(project.inputs.weeks);
  const subs = await db.select().from(schema.submissions).where(eq(schema.submissions.projectId, project.id));
  const [existingReview] = await db.select().from(schema.reviews).where(eq(schema.reviews.projectId, project.id));
  if (existingReview || subs.some((s) => s.n === 0)) throw new HttpError(409, 'This project already has its final review.');

  const cps = subs.filter((s) => s.n > 0).sort((a, b) => a.n - b.n);
  const next = cps.length + 1;
  const isFinal = next > N;
  const sub = { note: body.note, link: body.link || null, files: body.files };

  const ai = isFinal
    ? await generateReview({
      brief: project.brief, mode: project.inputs.mode, sub,
      history: cps.map((s) => ({ n: s.n, note: s.note, link: s.link, files: s.files, feedback: s.feedback! })),
    })
    : await generateFeedback({
      brief: project.brief, mode: project.inputs.mode, n: next, N, sub,
      prev: cps.map((s) => ({ n: s.n, feedback: s.feedback! })),
    });

  const result = await db.transaction(async (tx) => {
    // Lock the project row, then re-check so two tabs can't submit the same checkpoint twice.
    await tx.execute(sql`select id from projects where id = ${project.id} for update`);
    const now = await tx.select({ n: schema.submissions.n }).from(schema.submissions).where(eq(schema.submissions.projectId, project.id));
    if (now.some((s) => s.n === (isFinal ? 0 : next))) throw new HttpError(409, 'This checkpoint was already submitted.');

    const [submission] = await tx.insert(schema.submissions).values({
      projectId: project.id, n: isFinal ? 0 : next, ...sub,
      feedback: 'feedback' in ai ? ai.feedback : null,
    }).returning();
    if ('review' in ai) await tx.insert(schema.reviews).values({ projectId: project.id, review: ai.review });
    await tx.update(schema.projects).set({
      xp: sql`${schema.projects.xp} + ${XP.submission + (isFinal ? XP.review : 0)}`,
      updatedAt: new Date(),
      ...(isFinal ? { status: 'complete' as const } : {}),
    }).where(eq(schema.projects.id, project.id));
    await tx.delete(schema.drafts).where(and(eq(schema.drafts.projectId, project.id), eq(schema.drafts.n, isFinal ? 0 : next)));
    return submission;
  });

  res.status(201).json({
    kind: isFinal ? 'review' : 'feedback', submission: result,
    ...('review' in ai ? { review: ai.review } : {}), fallback: ai.fallback,
  });
}));

const ratingSchema = z.object({ rating: z.number().int().min(1).max(5) });

submissionsRouter.post('/submissions/:id/rating', handle(async (req, res) => {
  const id = parseId(req.params.id, 'Feedback');
  const { rating } = parseBody(ratingSchema, req.body);
  const [row] = await db.select({ sub: schema.submissions, userId: schema.projects.userId })
    .from(schema.submissions).innerJoin(schema.projects, eq(schema.projects.id, schema.submissions.projectId))
    .where(eq(schema.submissions.id, id));
  if (!row || row.userId !== req.userId || row.sub.n === 0) throw new HttpError(404, 'Feedback not found.');

  const out = await db.transaction(async (tx) => {
    // Only the first rating earns XP; later changes just update the number.
    const [prev] = await tx.select({ rating: schema.submissions.rating }).from(schema.submissions).where(eq(schema.submissions.id, id)).for('update');
    const [submission] = await tx.update(schema.submissions).set({ rating }).where(eq(schema.submissions.id, id)).returning();
    const [p] = await tx.update(schema.projects)
      .set({ xp: sql`${schema.projects.xp} + ${prev.rating == null ? XP.rating : 0}` })
      .where(eq(schema.projects.id, row.sub.projectId)).returning({ xp: schema.projects.xp });
    return { submission, xp: p.xp };
  });
  res.json(out);
}));
