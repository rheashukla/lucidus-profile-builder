import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { handle } from '../http';

export const meRouter = Router();

meRouter.get('/me', handle(async (req, res) => {
  const [user] = await db.select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users).where(eq(schema.users.id, req.userId));
  res.json({ user });
}));
