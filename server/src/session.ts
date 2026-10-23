import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from './db';

export const SESSION_COOKIE = 'pb_session';
const SESSION_DAYS = 90;

declare module 'express-serve-static-core' {
  interface Request { userId: string }
}

export async function createSession(res: Response, userId: string) {
  const id = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ id, userId, expiresAt });
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true, sameSite: 'lax', signed: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

/** Resolves the session cookie to a user; creates an anonymous user on first visit. */
export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const sid: string | false | undefined = req.signedCookies?.[SESSION_COOKIE];
    if (sid) {
      const [row] = await db.select().from(schema.sessions)
        .where(and(eq(schema.sessions.id, sid), gt(schema.sessions.expiresAt, new Date())));
      if (row) { req.userId = row.userId; return next(); }
    }
    const [user] = await db.insert(schema.users).values({}).returning();
    await createSession(res, user.id);
    req.userId = user.id;
    next();
  } catch (e) { next(e); }
}
