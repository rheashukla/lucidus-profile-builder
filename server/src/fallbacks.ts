// Fallback content shown when AI is unavailable. Ported verbatim from the prototype
// (fallbackBrief, fallbackFeedback, fallbackReview); only the state access is replaced by parameters.
import type { Brief, Feedback, Inputs, Review, Level } from '@shared/types';
import { BASE_RUBRIC, CRITERIA, SDGS } from '@shared/data';

const D = { sdgs: SDGS, criteria: CRITERIA as readonly string[], baseRubric: BASE_RUBRIC };

export function fallbackBrief(i: Inputs, n: number) {
  const sdg = D.sdgs[(i.sdgs[0] || 14) - 1], pw = i.strongest || i.powers[0] || 'Writing', subj = i.subjects[0] || 'Science';
  const career = (!i.career || i.career === 'Still exploring') ? null : i.career;
  const full = [
    { title: 'Pick your local angle', detail: 'Choose one place near you where this problem shows up. Write two sentences on why you picked it.' },
    { title: 'Read 3 sources', detail: 'Find 3 trustworthy secondary sources. Note one fact from each that you want to use.' },
    { title: 'Plan your piece', detail: `Sketch what your ${pw.toLowerCase()} piece will show, section by section.` },
    { title: 'Make a first draft', detail: "Create a rough version. Keep everything, including what doesn't work." },
    { title: 'Share with 1 person', detail: 'Show it to someone in your audience. Write down what confused them.' },
    { title: 'Revise and finish', detail: 'Make one round of changes based on that feedback and explain each change.' }
  ];
  const rw = { Beginner: ['Share your draft with 1 person in your audience and note their reaction.', '1 round of changes after you share it.'], Intermediate: ['Get feedback from 3 people in your target group.', '2 versions, with what changed and why.'], Advanced: ['Test with target users and measure what changed.', '3 versions, each backed by test evidence.'] }[i.mode];
  return {
    title: `${pw} For ${sdg}`,
    oneLiner: `Use ${pw.toLowerCase()} to show your community one specific, local side of ${sdg.toLowerCase()} and what they can do about it.`,
    problem: `Many people never see how ${sdg.toLowerCase()} plays out where they live. You'll document one specific local version of this problem and make it clear to the people who can act on it.`,
    problemOptions: i.mode === 'Intermediate' ? ['A place: one site near you where the problem is visible.', 'A habit: one everyday behaviour that makes it worse.', 'A group: one set of people most affected by it.'] : [],
    beneficiary: 'Families and students in your neighbourhood who are affected by this problem but have never seen it clearly.',
    whyItMatters: 'People act when they can see a problem up close and know one thing they can do.',
    deliverable: `A short ${pw.toLowerCase()} piece (6–10 frames, pages or minutes) with a one-page explainer.`,
    programFit: `${career ? `${career}s use ${subj.toLowerCase()} to explain problems like this to the public` : `It connects ${subj.toLowerCase()} to a real problem`}${i.degree ? `, and it previews the thinking a ${i.degree} program expects` : ''}${i.college ? ` at ${i.college}` : ''}.`,
    steps: i.mode === 'Beginner' ? full : full.slice(0, 4),
    research: [`A government or UN report on ${sdg}`, 'A news article about this problem in your region', 'An expert explainer on its causes'],
    realWorld: rw[0], iterations: rw[1],
    makeItYours: "You choose the place, gather the material yourself, and decide what to leave out. An AI can't visit your neighbourhood for you.",
    ethics: "If you photograph or talk to people, ask permission first, explain what it's for, and don't record names or private details without consent.",
    rubric: D.criteria.map((c, k) => ({ criterion: c, levels: D.baseRubric[k] })),
    checkpoints: [
      { title: 'Your Angle And Plan', goal: 'Show the place you picked, your sources, and a sketch of your piece.', bring: ['Notes or photos of your location', 'Your sources', 'A rough plan'] },
      { title: 'First Draft And Feedback', goal: 'Show your first draft and what the person you shared it with said.', bring: ['Your first draft', 'Notes from your feedback'] },
      { title: 'Revised Draft', goal: 'Show what you changed and why.', bring: ['Before and after versions', 'A short list of changes'] }
    ].slice(0, n)
  };
}

/** Maps the prototype's legacy fallback shape onto `Brief`. Legacy briefs carry no project type. */
export function fallbackBriefAsBrief(i: Inputs, n: number): Brief {
  const f = fallbackBrief(i, n);
  return {
    projectType: '',
    title: f.title, oneLiner: f.oneLiner,
    lede: '', ledeSource: null,
    problem: f.problem, problemOptions: f.problemOptions,
    beneficiary: f.beneficiary,
    deliverableList: [f.deliverable],
    steps: f.steps,
    research: f.research.map((title) => ({ title, publisher: '', url: '' })),
    programFit: f.programFit,
    rubric: f.rubric,
    checkpoints: f.checkpoints,
    country: i.country,
  };
}

export function fallbackFeedback(n: number, sub: { note: string; files: unknown[] }): Feedback {
  const base = [[1, 0, 1, 1], [2, 1, 1, 2], [2, 2, 2, 2]][Math.min(n, 3) - 1];
  const q = sub.note.length > 70 ? sub.note.slice(0, 70).trim() + '…' : sub.note;
  const lv = base.map((v, k) => Math.min(3, v + (k === 1 && sub.files.length > 1 ? 1 : 0)));
  return {
    summary: `You've started with something real: "${q}" Your next move is to make the problem and the people it affects more specific.`,
    criteria: [
      { evidence: `Your note names the topic. Who is affected, and where, is still broad.`, next: 'Write one sentence naming the exact group you want to help and the place.', question: 'If you could only help one group of people, who would it be?' },
      { evidence: sub.files.length ? `You uploaded ${sub.files.length} file${sub.files.length > 1 ? 's' : ''}. Earlier versions or notes would show how your thinking moved.` : 'There are no drafts or files yet, so your process is hard to see.', next: 'Keep a rough version and note what you changed and why.', question: 'What did you try that did not work?' },
      { evidence: 'The work is early, so craft is hard to judge yet.', next: 'Make one complete rough version, even if it is not polished.', question: 'Which part of your piece are you least sure about?' },
      { evidence: 'Your note is understandable but jumps between ideas.', next: 'Order your work as: problem, who it affects, what you made, what you learned.', question: 'What should someone remember after 30 seconds with your work?' }
    ].map((c, k) => ({ criterion: D.criteria[k], level: lv[k] as Level, ...c }))
  };
}

/** `last` is the feedback from the most recent checkpoint, if any. */
export function fallbackReview(last?: Feedback | null): Review {
  const lv = (last ? last.criteria.map(c => c.level) : [1, 1, 1, 1]).map(v => Math.min(3, v + 1));
  return {
    headline: 'You Turned A Broad Topic Into Focused Work',
    story: 'You started with a general idea and narrowed it to a specific place and audience. Across your checkpoints your drafts became clearer, and your final piece shows choices you made yourself.',
    improvements: ['Your problem went from a topic to a specific group and place.', 'You kept drafts and explained what changed.', 'Your final piece is easier to follow than your first draft.'],
    deviations: ['Your final piece is shorter than the brief suggested. Say why in your explainer.'],
    couldBeBetter: ['Show more evidence that your audience understood or acted.', 'Document one attempt that failed and what you learned.', 'Tighten your explainer so it could stand alone in an application.'],
    criteria: D.criteria.map((c, k) => ({ criterion: c, level: lv[k] as Level, summary: ['Your problem is clear and tied to the goal you chose.', 'Your versions show real changes based on feedback.', 'Your craft improved and the content is accurate.', 'Your story is organized and suited to your audience.'][k] }))
  };
}
