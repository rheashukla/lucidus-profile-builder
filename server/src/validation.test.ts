import { describe, expect, it } from 'vitest';
import { inputsSchema, parseBody } from './validation';

const good = { subjects: ['Biology'], powers: ['Writing', 'Coding'], strongest: 'Coding', career: null, college: '', degree: '', country: 'India', weeks: 2, sdgs: [14], mode: 'Beginner' };
const bad = (patch: object) => inputsSchema.safeParse({ ...good, ...patch }).success;

describe('inputsSchema', () => {
  it('accepts valid inputs, with career and college optional', () => {
    expect(bad({})).toBe(true);
    expect(bad({ career: 'Still exploring' })).toBe(true);
    expect(bad({ career: 'Marine Biologist', college: 'Somewhere Not Listed', degree: 'Computer Science' })).toBe(true);
  });
  it.each([
    ['no subjects', { subjects: [] }],
    ['4 subjects', { subjects: ['Biology', 'Physics', 'Chemistry', 'History'] }],
    ['unknown subject', { subjects: ['Astrology'] }],
    ['1 superpower', { powers: ['Coding'], strongest: 'Coding' }],
    ['5 superpowers', { powers: ['Coding', 'Writing', 'Photography', 'Storytelling', 'Debate & Persuasion'] }],
    ['strongest not picked', { strongest: 'Photography' }],
    ['unknown career', { career: 'Wizard' }],
    ['unknown degree', { degree: 'Alchemy' }],
    ['weeks 5', { weeks: 5 }],
    ['no SDG', { sdgs: [] }],
    ['3 SDGs', { sdgs: [1, 2, 3] }],
    ['SDG 18', { sdgs: [18] }],
    ['duplicate SDG', { sdgs: [3, 3] }],
    ['bad mode', { mode: 'Expert' }],
  ])('rejects %s', (_, patch) => expect(bad(patch)).toBe(false));

  it('parseBody throws a 400 naming the field', () => {
    try { parseBody(inputsSchema, { ...good, weeks: 9 }); throw new Error('no throw'); } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.message).toMatch(/^weeks/);
    }
  });
});
