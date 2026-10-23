import { describe, expect, it } from 'vitest';
import { BASE_RUBRIC, CRITERIA, checkpointCount } from '@shared/data';
import { clampLevel, cut, InvalidAIOutput, parseJsonObject, postProcessBrief, postProcessFeedback, postProcessReview } from './postprocess';
import { inputs, raw } from './__fixtures__/briefs';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('cut', () => {
  it('leaves short text alone', () => expect(cut('  hello world  ', 20)).toBe('hello world'));
  it('trims at the last word break and appends an ellipsis', () => {
    const out = cut('The quick brown fox jumps over the lazy dog', 20);
    expect(out).toBe('The quick brown fox…');
    expect(out.length).toBeLessThanOrEqual(20);
  });
  it('drops trailing punctuation before the ellipsis', () => expect(cut('One, two, three, four, five', 15)).toBe('One, two…'));
  it('hard-cuts a single long word', () => expect(cut('a'.repeat(50), 10)).toBe('a'.repeat(9) + '…'));
  it('handles null', () => expect(cut(null, 10)).toBe(''));
});

describe('clampLevel', () => {
  it.each([[0, 0], [3, 3], [-2, 0], [7, 3], ['2', 2], ['2.9', 2], ['x', 1], [null, 1], [undefined, 1], [NaN, 1]])('%s → %s', (v, want) => {
    expect(clampLevel(v)).toBe(want);
  });
});

describe('postProcessBrief', () => {
  for (const mode of ['Beginner', 'Intermediate', 'Advanced'] as const) {
    it(`${mode}: valid brief with type, N checkpoints, 4 rubric rows and only http(s) links`, () => {
      const i = inputs[mode], N = checkpointCount(i.weeks);
      const b = postProcessBrief(clone(raw[mode]), i, N);
      expect(b.projectType).not.toBe('');
      expect(b.checkpoints).toHaveLength(N);
      expect(b.rubric).toHaveLength(4);
      expect(b.rubric.map((r) => r.criterion)).toEqual([...CRITERIA]);
      for (const s of [...b.research, ...(b.ledeSource ? [b.ledeSource] : [])]) expect(s.url).toMatch(/^https?:\/\//);
      expect(b.problemOptions.length).toBe(mode === 'Intermediate' ? 3 : 0);
    });
  }

  it('maps fields to Brief names', () => {
    const b = postProcessBrief(clone(raw.Beginner), inputs.Beginner, 2);
    expect(b.title).toBe(raw.Beginner.headline);
    expect(b.oneLiner).toBe(raw.Beginner.standfirst);
    expect(b.deliverableList).toEqual(raw.Beginner.yourMission);
    expect(b.research[0].publisher).toBe('Our World in Data');
    expect(b.country).toBe('Canada');
  });

  it('trims lede, problem, beneficiary and programFit to their limits', () => {
    const r = clone(raw.Beginner);
    r.lede = 'word '.repeat(100); r.theProblem = 'word '.repeat(100);
    r.beneficiary = 'word '.repeat(40); r.whyItFitsYou = 'word '.repeat(60);
    const b = postProcessBrief(r, inputs.Beginner, 2);
    expect(b.lede.length).toBeLessThanOrEqual(300);
    expect(b.problem.length).toBeLessThanOrEqual(300);
    expect(b.beneficiary.length).toBeLessThanOrEqual(100);
    expect(b.programFit.length).toBeLessThanOrEqual(200);
    for (const s of [b.lede, b.problem, b.beneficiary, b.programFit]) expect(s.endsWith('…')).toBe(true);
  });

  it('mission bullets share 200 characters, max 3, with bullet markers stripped', () => {
    const r = clone(raw.Beginner);
    r.yourMission = Array.from({ length: 5 }, (_, k) => `${k + 1}. ` + 'long words here '.repeat(10));
    const b = postProcessBrief(r, inputs.Beginner, 2);
    expect(b.deliverableList).toHaveLength(3);
    expect(b.deliverableList.join('').length).toBeLessThanOrEqual(200);
    expect(b.deliverableList[0].startsWith('long')).toBe(true);
  });

  it('splits a string mission on newlines', () => {
    const b = postProcessBrief(clone(raw.Intermediate), inputs.Intermediate, 3);
    expect(b.deliverableList).toEqual(['A dashboard of daily water use', 'A short report for the principal']);
  });

  it('step title ≤ 60 and title + detail ≤ 200', () => {
    const r = clone(raw.Beginner);
    r.steps = [{ title: 'Title words '.repeat(10), detail: 'Detail words '.repeat(30) }];
    const [s] = postProcessBrief(r, inputs.Beginner, 2).steps;
    expect(s.title.length).toBeLessThanOrEqual(60);
    expect(s.title.length + s.detail.length).toBeLessThanOrEqual(200);
  });

  it('unknown projectType becomes ""', () => {
    const r = clone(raw.Beginner); r.projectType = 'Podcast';
    expect(postProcessBrief(r, inputs.Beginner, 2).projectType).toBe('');
  });

  it('problemOptions forced to [] unless Intermediate', () => {
    expect(postProcessBrief(clone(raw.Beginner), inputs.Beginner, 2).problemOptions).toEqual([]);
    const adv = clone(raw.Advanced) as Record<string, unknown>; adv.problemOptions = ['x', 'y', 'z'];
    expect(postProcessBrief(adv, inputs.Advanced, 3).problemOptions).toEqual([]);
  });

  it('rejects fewer than N checkpoints and slices extras to N', () => {
    const r = clone(raw.Beginner);
    expect(postProcessBrief(r, inputs.Beginner, 2).checkpoints).toHaveLength(2);
    r.checkpoints = r.checkpoints.slice(0, 1);
    expect(() => postProcessBrief(r, inputs.Beginner, 2)).toThrow(InvalidAIOutput);
  });

  it('rubric: requires 4 rows, forces criterion names, repairs rows without 4 levels', () => {
    const r = clone(raw.Beginner);
    r.rubric[1].levels = ['only', 'three', 'levels'];
    const b = postProcessBrief(r, inputs.Beginner, 2);
    expect(b.rubric[0].criterion).toBe(CRITERIA[0]);
    expect(b.rubric[1].levels).toEqual(BASE_RUBRIC[1]);
    expect(b.rubric[0].levels).toEqual(['a', 'b', 'c', 'd']);
    r.rubric = r.rubric.slice(0, 3);
    expect(() => postProcessBrief(r, inputs.Beginner, 2)).toThrow(InvalidAIOutput);
  });

  it('drops non-http(s) sources, including a bad ledeSource', () => {
    const r = clone(raw.Beginner);
    r.ledeSource = { title: 't', publisher: 'p', url: 'www.example.org' };
    const b = postProcessBrief(r, inputs.Beginner, 2);
    expect(b.ledeSource).toBeNull();
    expect(b.research).toHaveLength(2);
  });

  it('rejects a missing headline or wrong shapes', () => {
    const r = clone(raw.Beginner); r.headline = '  ';
    expect(() => postProcessBrief(r, inputs.Beginner, 2)).toThrow(InvalidAIOutput);
    expect(() => postProcessBrief({ nope: true }, inputs.Beginner, 2)).toThrow(InvalidAIOutput);
    expect(() => postProcessBrief(null, inputs.Beginner, 2)).toThrow(InvalidAIOutput);
  });
});

describe('postProcessFeedback / postProcessReview', () => {
  const crit = (level: unknown) => ({ criterion: 'whatever', level, evidence: 'e', next: 'n', question: 'q' });
  it('forces names and clamps levels', () => {
    const f = postProcessFeedback({ summary: 'Good.', criteria: [crit(5), crit('two'), crit(-1), crit('2')] });
    expect(f.criteria.map((c) => c.level)).toEqual([3, 1, 0, 2]);
    expect(f.criteria.map((c) => c.criterion)).toEqual([...CRITERIA]);
  });
  it('rejects missing summary or wrong criteria count', () => {
    expect(() => postProcessFeedback({ summary: '', criteria: [crit(1), crit(1), crit(1), crit(1)] })).toThrow(InvalidAIOutput);
    expect(() => postProcessFeedback({ summary: 'x', criteria: [crit(1)] })).toThrow(InvalidAIOutput);
  });
  it('review: forces names, clamps levels, needs headline and 4 criteria', () => {
    const c = (level: unknown) => ({ level, summary: 's' });
    const r = postProcessReview({ headline: 'H', story: 'S', improvements: ['a', ''], deviations: 'one', couldBeBetter: [], criteria: [c(9), c(0), c('x'), c(2)] });
    expect(r.criteria.map((x) => x.level)).toEqual([3, 0, 1, 2]);
    expect(r.improvements).toEqual(['a']);
    expect(r.deviations).toEqual(['one']);
    expect(() => postProcessReview({ headline: '', story: '', criteria: [c(1), c(1), c(1), c(1)] })).toThrow(InvalidAIOutput);
  });
  it('parseJsonObject reads from first { to last }', () => {
    expect(parseJsonObject('Sure! ```json\n{"a":{"b":1}}\n``` done')).toEqual({ a: { b: 1 } });
    expect(() => parseJsonObject('no json')).toThrow(InvalidAIOutput);
  });
});
