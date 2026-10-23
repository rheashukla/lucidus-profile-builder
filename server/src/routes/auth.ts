import { Router } from 'express';
import crypto from 'node:crypto';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../db';
import { handle, HttpError } from '../http';
import { parseBody } from '../validation';
import { createSession, SESSION_COOKIE } from '../session';
import { checkLimit } from '../rateLimit';
import { sendMagicLink } from '../email';

export const authRouter = Router();

const LINK_MINUTES = 15;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hash = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

const emailSchema = z.object({ email: z.string().trim().toLowerCase().max(254).regex(EMAIL_RE, 'Enter a valid email address.') });

authRouter.post('/auth/magic-link', handle(async (req, res) => {
  const { email } = parseBody(emailSchema, req.body);
  const limit = checkLimit(`mail:${req.userId}`);
  if (!limit.ok) throw new HttpError(429, limit.message);
  const token = crypto.randomBytes(32).toString('base64url');
  await db.insert(schema.magicLinks).values({
    tokenHash: hash(token), email, userId: req.userId, expiresAt: new Date(Date.now() + LINK_MINUTES * 60_000),
  });
  const base = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  await sendMagicLink(email, `${base}/api/auth/verify?token=${encodeURIComponent(token)}`);
  res.json({ ok: true });
}));

/** Moves projects from anonymous users into `target` and marks them merged. Never touches signed-in users. */
async function mergeAnonymous(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], fromIds: string[], target: string) {
  const ids = [...new Set(fromIds)].filter((x) => x !== target);
  if (!ids.length) return 0;
  const anon = await tx.select({ id: schema.users.id }).from(schema.users)
    .where(and(inArray(schema.users.id, ids), isNull(schema.users.email)));
  const anonIds = anon.map((u) => u.id);
  if (!anonIds.length) return 0;
  const moved = await tx.update(schema.projects).set({ userId: target }).where(inArray(schema.projects.userId, anonIds)).returning({ id: schema.projects.id });
  await tx.update(schema.users).set({ mergedInto: target }).where(inArray(schema.users.id, anonIds));
  await tx.update(schema.users).set({ mergedInto: target }).where(inArray(schema.users.mergedInto, anonIds));
  return moved.length;
}

authRouter.get('/auth/verify', handle(async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const fail = (reason: string) => res.redirect(302, `/?signin=${reason}`);
  if (!token) return fail('invalid');

  const result = await db.transaction(async (tx) => {
    const [link] = await tx.select().from(schema.magicLinks).where(eq(schema.magicLinks.tokenHash, hash(token))).for('update');
    if (!link) return { error: 'invalid' as const };
    if (link.usedAt) return { error: 'used' as const };
    if (link.expiresAt < new Date()) return { error: 'expired' as const };
    await tx.update(schema.magicLinks).set({ usedAt: new Date() }).where(eq(schema.magicLinks.tokenHash, link.tokenHash));

    // The account this email belongs to, if any.
    const [owner] = await tx.select().from(schema.users).where(eq(schema.users.email, link.email));
    let target = owner?.id;
    if (!target) {
      // Attach the email to the anonymous user who asked for the link (or this device's user).
      const candidates = [link.userId, req.userId].filter(Boolean) as string[];
      const [anon] = candidates.length
        ? await tx.select().from(schema.users).where(and(inArray(schema.users.id, candidates), isNull(schema.users.email), isNull(schema.users.mergedInto)))
        : [];
      if (anon) {
        await tx.update(schema.users).set({ email: link.email }).where(eq(schema.users.id, anon.id));
        target = anon.id;
      } else {
        const [u] = await tx.insert(schema.users).values({ email: link.email }).returning();
        target = u.id;
      }
    }
    const merged = await mergeAnonymous(tx, [link.userId, req.userId].filter(Boolean) as string[], target);
    return { target, merged };
  });

  if ('error' in result) return fail(result.error!);
  // Swap this device's session for one on the signed-in user.
  const old = req.signedCookies?.[SESSION_COOKIE];
  if (old) await db.delete(schema.sessions).where(eq(schema.sessions.id, old));
  await createSession(res, result.target!);
  res.redirect(302, `/?signin=ok${result.merged ? `&merged=${result.merged}` : ''}`);
}));

authRouter.post('/auth/logout', handle(async (req, res) => {
  const sid = req.signedCookies?.[SESSION_COOKIE];
  if (sid) await db.delete(schema.sessions).where(eq(schema.sessions.id, sid));
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
}));

/** Every user whose uploads `userId` may reference: itself plus anonymous users merged into it. */
export async function fileOwnerIds(userId: string) {
  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.mergedInto, userId));
  return [userId, ...rows.map((r) => r.id)];
}

