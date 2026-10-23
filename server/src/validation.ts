import { z } from 'zod';
import { CAREERS, COLLEGES, DEGREES, POWERS, SDGS, SUBJECTS } from '@shared/data';
import { HttpError } from './http';

const all = (groups: { items: string[] }[]) => new Set(groups.flatMap((g) => g.items));
const SUBJECT_SET = all(SUBJECTS), POWER_SET = all(POWERS), CAREER_SET = all(CAREERS), DEGREE_SET = all(DEGREES);
void COLLEGES; // colleges are free text: students may type one that isn't listed

const unique = (a: unknown[]) => new Set(a).size === a.length;

export const inputsSchema = z.object({
  subjects: z.array(z.string()).min(1).max(3).refine(unique, 'Duplicate subjects')
    .refine((a) => a.every((x) => SUBJECT_SET.has(x)), 'Unknown subject'),
  powers: z.array(z.string()).min(2).max(4).refine(unique, 'Duplicate superpowers')
    .refine((a) => a.every((x) => POWER_SET.has(x)), 'Unknown superpower'),
  strongest: z.string(),
  career: z.string().nullable().refine((c) => c === null || c === 'Still exploring' || CAREER_SET.has(c), 'Unknown career'),
  college: z.string().trim().max(120).default(''),
  degree: z.string().default('').refine((d) => d === '' || DEGREE_SET.has(d), 'Unknown degree'),
  country: z.string().trim().max(80).default(''),
  weeks: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  sdgs: z.array(z.number().int().min(1).max(SDGS.length)).min(1).max(2).refine(unique, 'Duplicate goals'),
  mode: z.enum(['Beginner', 'Intermediate', 'Advanced']),
}).refine((i) => i.powers.includes(i.strongest), { message: 'Strongest must be one of your superpowers', path: ['strongest'] });

/** Parses a request body or throws a 400 with the first issue. */
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const r = schema.safeParse(body);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new HttpError(400, `${i.path.join('.') || 'body'}: ${i.message}`);
  }
  return r.data;
}

export const uuidParam = z.string().uuid();
export function parseId(v: unknown, what = 'Project'): string {
  const r = uuidParam.safeParse(v);
  if (!r.success) throw new HttpError(404, `${what} not found.`);
  return r.data;
}
