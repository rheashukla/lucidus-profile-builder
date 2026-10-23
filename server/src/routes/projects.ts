import { Router } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { ProjectSummary } from '@shared/types';
import { checkpointCount } from '@shared/data';
import { db, schema } from '../db';
import { handle, HttpError } from '../http';

export const projectsRouter = Router();

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
    const mine = subs.filter((s) => s.projectId === p.id);
    const total = checkpointCount(p.inputs.weeks) + 1; // checkpoints + final
    return {
      id: p.id, title: p.brief.title, projectType: p.brief.projectType ?? '', status: p.status,
      done: mine.length, total, updatedAt: p.updatedAt.toISOString(),
      weeks: p.inputs.weeks, mode: p.inputs.mode,
    };
  });
  res.json(list);
}));

const idParam = z.object({ id: z.string().uuid() });

projectsRouter.delete('/projects/:id', handle(async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) throw new HttpError(404, 'Project not found.');
  const deleted = await db.delete(schema.projects)
    .where(and(eq(schema.projects.id, parsed.data.id), eq(schema.projects.userId, req.userId)))
    .returning({ id: schema.projects.id });
  if (!deleted.length) throw new HttpError(404, 'Project not found.');
  res.status(204).end();
}));
