import { Router } from 'express';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { ProjectSummary } from '@shared/types';
import { checkpointCount } from '@shared/data';
import { db, schema } from '../db';
import { handle, HttpError } from '../http';
import { inputsSchema, parseBody, parseId } from '../validation';
import { generateBrief } from '../ai/brief';
import { aiLimiter } from '../rateLimit';
import { storage } from '../storage';

export const projectsRouter = Router();

export const XP = { setupStep: 20, submission: 100, rating: 20, review: 200 } as const;

export async function getOwnedProject(userId: string, id: string) {
  const [p] = await db.select().from(schema.projects)
    .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)));
  if (!p) throw new HttpError(404, 'Project not found.');
  return p;
}

projectsRouter.get('/projects', handle(async (req, res) => {
  const rows = await db.select().from(schema.projects)
    .where(eq(schema.projects.userId, req.userId))
    .orderBy(desc(schema.projects.updatedAt));
  const ids = rows.map((r) => r.id);
  const subs = ids.length
    ? await db.select({ projectId: schema.submissions.projectId, n: schema.submissions.n })
      .from(schema.submissions).where(inArray(schema.submissions.projectId, ids))
    : [];
  const list: ProjectSummary[] = rows.map((p) => {
    const done = subs.filter((s) => s.projectId === p.id).length; // checkpoints + final
    return {
      id: p.id, title: p.brief.title, projectType: p.brief.projectType ?? '', status: p.status,
      done, total: checkpointCount(p.inputs.weeks) + 1, updatedAt: p.updatedAt.toISOString(),
      weeks: p.inputs.weeks, mode: p.inputs.mode,
    };
  });
  res.json(list);
}));

const createSchema = inputsSchema.and(z.object({ setupSteps: z.number().int().min(0).max(7).default(7) }));

projectsRouter.post('/projects', aiLimiter, handle(async (req, res) => {
  const body = parseBody(createSchema, req.body);
  const { setupSteps, ...inputs } = body;
  const { brief, fallback } = await generateBrief(inputs);
  const [project] = await db.insert(schema.projects).values({
    userId: req.userId, inputs, brief, xp: setupSteps * XP.setupStep,
  }).returning();
  res.status(201).json({ project, fallback });
}));

projectsRouter.get('/projects/:id', handle(async (req, res) => {
  const project = await getOwnedProject(req.userId, parseId(req.params.id));
  const [submissions, [review], drafts] = await Promise.all([
    db.select().from(schema.submissions).where(eq(schema.submissions.projectId, project.id)).orderBy(asc(schema.submissions.createdAt)),
    db.select().from(schema.reviews).where(eq(schema.reviews.projectId, project.id)),
    db.select().from(schema.drafts).where(eq(schema.drafts.projectId, project.id)),
  ]);
  res.json({ project, submissions, review: review?.review ?? null, drafts });
}));

projectsRouter.delete('/projects/:id', handle(async (req, res) => {
  const project = await getOwnedProject(req.userId, parseId(req.params.id));
  const [subs, drafts] = await Promise.all([
    db.select({ files: schema.submissions.files }).from(schema.submissions).where(eq(schema.submissions.projectId, project.id)),
    db.select({ files: schema.drafts.files }).from(schema.drafts).where(eq(schema.drafts.projectId, project.id)),
  ]);
  // Submissions, drafts and the review cascade with the project row.
  await db.delete(schema.projects).where(eq(schema.projects.id, project.id));
  const keys = [...subs, ...drafts].flatMap((r) => r.files.map((f) => f.key));
  await storage.removeMany([...new Set(keys)]);
  res.status(204).end();
}));
