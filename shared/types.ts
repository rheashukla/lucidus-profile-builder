export type Mode = 'Beginner' | 'Intermediate' | 'Advanced';
export type ProjectType = 'Research Paper' | 'Venture' | 'Nonprofit' | 'App / Software' | 'Hardware / Prototype' | 'Campaign' | 'Event' | 'Art Portfolio' | 'Data Project';
export type Level = 0 | 1 | 2 | 3;

export interface Inputs {
  subjects: string[];          // 1–3
  powers: string[];            // 2–4
  strongest: string;           // one of powers
  career: string | null;       // OPTIONAL. null or 'Still exploring' = not chosen
  college: string;             // optional, '' if none
  degree: string;              // optional
  country: string;             // prefilled from browser locale
  weeks: 1 | 2 | 3 | 4;
  sdgs: number[];              // 1–2, values 1–17
  mode: Mode;
}
export interface Source { title: string; publisher: string; url: string }
export interface Brief {
  projectType: ProjectType | '';
  title: string; oneLiner: string;
  lede: string; ledeSource: Source | null;
  problem: string; problemOptions: string[];   // 3 in Intermediate, else []
  beneficiary: string;
  deliverableList: string[];                   // 2–3 bullets
  steps: { title: string; detail: string }[];
  research: Source[];
  programFit: string;
  rubric: { criterion: string; levels: [string, string, string, string] }[];  // exactly 4
  checkpoints: { title: string; goal: string; bring: string[] }[];            // exactly N
  country: string;
}
export interface CriterionFeedback { criterion: string; level: Level; evidence: string; next: string; question: string }
export interface Feedback { summary: string; criteria: CriterionFeedback[] }  // 4
export interface Review {
  headline: string; story: string;
  improvements: string[]; deviations: string[]; couldBeBetter: string[];
  criteria: { criterion: string; level: Level; summary: string }[];  // 4
}

export interface FileRef { key: string; name: string; type: string; size: number }

export interface ProjectSummary {
  id: string; title: string; projectType: ProjectType | ''; status: 'active' | 'complete';
  done: number; total: number; updatedAt: string;
  weeks: 1 | 2 | 3 | 4; mode: Mode;
}
