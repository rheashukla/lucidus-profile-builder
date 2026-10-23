# Build Spec: Portfolio Builder (for Replit Agent)

Build a production web app from this spec. Visual and screen-level detail lives in `README.md` in this same folder; this file covers the stack, data, API, AI prompts, build order and acceptance tests. Where the two disagree, **this file wins** (it includes the latest changes: optional career, project types).

Reference files in this folder:
- `Portfolio Builder v5.dc.html`: working prototype. Open it in a browser to see every screen and interaction. Treat it as the visual source of truth. Do not port its runtime (`support.js`).
- `pb-data.js`: all static lists (subjects, superpowers, careers, colleges, degrees, SDGs, modes, timeline, criteria, base rubric, sample inputs). Port as-is to `shared/data.ts`.
- `colors_and_type.css`: Lucidus design tokens. Import globally.
- `README.md`: screens, layouts, copy, tokens.

---

## 1. Product in one paragraph
Students aged 13–18 answer 7 setup questions. The app generates a personalised project brief, a 4×4 rubric and 2–3 checkpoints. Students upload work at each checkpoint and get rubric-based AI feedback, see their growth across checkpoints, then submit final work for an AI final review. A student can hold several projects. Progress is saved per user; sign-in is by email magic link.

## 2. Stack
- **Frontend:** React 18 + Vite + TypeScript, React Router, TanStack Query. Mobile-first, responsive.
- **Backend:** Node 20 + Express + TypeScript, in the same Repl (`/server`, `/client`, `/shared`).
- **Database:** Replit PostgreSQL with Drizzle ORM.
- **File storage:** Replit Object Storage.
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), called **only from the server**.
- **Email:** Resend (magic links).
- **Validation:** Zod on every API body and every AI response.
- Styling: plain CSS modules or inline styles using the Lucidus CSS variables. No Tailwind, no component library. Font: Albert Sans (Google Fonts). Icons: Material Symbols Rounded.

## 3. Environment / Secrets
```
ANTHROPIC_API_KEY=
DATABASE_URL=            # provided by Replit Postgres
RESEND_API_KEY=
EMAIL_FROM=              # e.g. "Lucidus <hello@yourdomain>"
SESSION_SECRET=
APP_URL=                 # used in magic links
MODEL_BRIEF=claude-sonnet-4-5
MODEL_FAST=claude-haiku-4-5
```

## 4. Data model (Drizzle)
```ts
users        { id uuid pk, email text unique null, createdAt }
sessions     { id text pk, userId fk, expiresAt }
magicLinks   { tokenHash text pk, email, userId fk null, expiresAt, usedAt null }
projects     { id uuid pk, userId fk, inputs jsonb, brief jsonb, status text /* active|complete */, xp int default 0, createdAt, updatedAt }
submissions  { id uuid pk, projectId fk, n int /* 1..N, or 0 = final */, note text, link text null, files jsonb /* [{key,name,type,size}] */, feedback jsonb, rating int null, createdAt }
reviews      { projectId pk fk, review jsonb, createdAt }
drafts       { projectId fk, n int, note, link, files jsonb, updatedAt }   // autosave of unsent uploads
```
- **Anonymous first:** on first visit create a user with `email = null` and a session cookie (httpOnly, 90 days). Everything works without signing in. "Save Your Progress" attaches an email to that user.
- If the email already belongs to another user, the magic link logs this device into that user and **merges** the anonymous user's projects into it.

## 5. Types (`shared/types.ts`)
```ts
type Mode = 'Beginner' | 'Intermediate' | 'Advanced';
type ProjectType = 'Research Paper' | 'Venture' | 'Nonprofit' | 'App / Software' | 'Hardware / Prototype' | 'Campaign' | 'Event' | 'Art Portfolio' | 'Data Project';

interface Inputs {
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
interface Source { title: string; publisher: string; url: string }
interface Brief {
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
interface CriterionFeedback { criterion: string; level: 0|1|2|3; evidence: string; next: string; question: string }
interface Feedback { summary: string; criteria: CriterionFeedback[] }  // 4
interface Review {
  headline: string; story: string;
  improvements: string[]; deviations: string[]; couldBeBetter: string[];
  criteria: { criterion: string; level: 0|1|2|3; summary: string }[];  // 4
}
```
`N` (checkpoint count) and suggested days come from `timeline[weeks]` in `pb-data.js`: 1 wk → 2 CPs, 2 wk → 2, 3 wk → 3, 4 wk → 3.

## 6. API
All routes JSON, under `/api`, session cookie auth. Return `{ error }` with a proper status on failure.

| Method | Route | Purpose |
|---|---|---|
| GET | `/me` | `{ user: { id, email } }` (creates anon user if none) |
| POST | `/auth/magic-link` | body `{ email }` → sends link, 200 |
| GET | `/auth/verify?token=` | consumes token, sets session, merges, redirects to `/` |
| POST | `/auth/logout` | |
| GET | `/projects` | list: `{ id, title, projectType, status, done, total, updatedAt }[]` |
| POST | `/projects` | body `Inputs` → validates, generates brief (AI A), saves, returns project |
| GET | `/projects/:id` | `{ project, submissions, review }` |
| DELETE | `/projects/:id` | deletes project, submissions, files, review |
| PUT | `/projects/:id/draft/:n` | autosave upload draft |
| POST | `/uploads` | multipart, ≤10 files, ≤20 MB each → returns `{ key, name, type, size }[]` |
| POST | `/projects/:id/submissions` | body `{ note, link?, files[] }` → checkpoint feedback (AI B) or, if all CPs done, final review (AI C) |
| POST | `/submissions/:id/rating` | body `{ rating: 1–5 }` → +20 XP |

Rules:
- `POST /projects/:id/submissions`: note ≥ 20 chars (server-side too). Next checkpoint index is `count(submissions where n>0) + 1`. If that exceeds N, this is the final submission (`n = 0`) and runs the review. Reject further submissions after the review.
- Rate limit AI routes: 10/min and 60/day per user.
- Every AI route: on API error, timeout (60 s) or Zod failure, retry once, then return the fallback content with `{ fallback: true }` so the client shows the toast. Fallback content is in the prototype: `fallbackBrief()`, `fallbackFeedback()`, `fallbackReview()`; port these verbatim to `server/fallbacks.ts`.
- XP: +20 per completed setup step (client, sent with `POST /projects`), +100 per submission, +20 per rating, +200 for the final review.

## 7. AI calls
Put each prompt in `server/prompts/*.ts` as a function of its inputs. Copy the text **verbatim** below.

### A. Brief, rubric and checkpoints
- Model `MODEL_BRIEF`, `max_tokens: 8000`.
- Use **tool use** with `tool_choice: { type: 'tool', name: 'create_brief' }`. Read the result from the `tool_use` block's `input`. (Skipping the forced tool choice was the cause of earlier generic briefs.)
- `career` for the prompt = `inputs.career` unless it is null or `'Still exploring'`, in which case pass `not chosen (still exploring)`.

**System:**
```
You are a features editor who writes project briefs for students aged 13–18, in the style of The Economist and The New York Times: a concrete, human opening; real numbers; plain words; a sharp, slightly wry headline. A brief should make a curious teenager think "I want to work on that."

Real world only:
- You have no web search. Use only well-known, stable sources you are confident exist (UN, WHO, World Bank, UNICEF, OECD, Our World in Data, or national statistics offices), preferably covering ${country}. Prefer an organisation's topic page over a deep link.
- Every fact, number or named example must come from one of those sources and carry its source URL. If you are not confident, leave it out. Never invent people, quotes, numbers or college program details. The student will be asked to check every link.

Safety: no hazardous materials, no meeting strangers alone, no collecting sensitive personal data.

Return the brief by calling the `create_brief` tool.
```

**User:**
```
<student>
Subjects: ${subjects.join(', ')}
Superpowers: ${powers.join(', ')} (strongest: ${strongest})
Career: ${career}
College/degree: ${college || 'not chosen'} / ${degree || 'not chosen'}
Weeks: ${weeks} · Checkpoints: ${N}
SDG: ${sdgs.map(k => `SDG ${k} ${SDGS[k-1]}`).join('; ')}
Mode: ${mode}
Country: ${country}
</student>

<mode_rules>${MODE_RULES[mode]}</mode_rules>
<project_types>
${PROJECT_TYPES.map(t => `${t.name}: ${t.what}. Shows up as: ${t.evidence}`).join('\n')}
</project_types>
<base_rubric>
${CRITERIA.map((c, k) => `${c}: ${BASE_RUBRIC[k].map((t, j) => `${LEVELS[j]} = ${t}`).join(' | ')}`).join('\n')}
</base_rubric>

First choose projectType: the one type from <project_types> that best fits the student's strongest superpower, subjects, career (if given), time and mode. Pick what a school student can genuinely finish in the time; scale the outcome down (a pilot, a first version, a single event) rather than picking a smaller type. Every later field must describe a project of that type.

Write the brief in this order:
1. headline: ≤10 words, specific, no hype.
2. standfirst: one sentence on why this matters now.
3. lede: max 300 characters. Open with a real person, place or number from a well-known source. Cite it in ledeSource.
4. theProblem: max 300 characters. Who is affected, the scale, and a local version the student can actually reach.
5. problemOptions: Intermediate mode only, 3 potential starting points.
6. beneficiary: max 100 characters. The real person or group this helps.
7. yourMission: 2–3 bullet points, max 200 characters in total. The concrete output of the chosen project type, made using their strongest superpower.
8. steps: sized to the mode rules; title + detail max 200 characters each.
9. startingSources: 3–5 real, well-known sources, with URLs.
10. rubric: the base rubric reworded for this brief, same meaning.
11. checkpoints: exactly ${N}; each has a goal plus 2–3 things to upload. Put these instructions inside the checkpoint where they happen: 2–3 decisions only the student can make; who to talk to or what data to collect, sized to the mode; how many versions to make and what changes; and, if there are interviews or surveys, consent and no sensitive personal data.
12. whyItFitsYou: max 200 characters. Link to the career and degree if given, otherwise to their subjects and superpowers; no claims about specific colleges.

Character limits are hard limits. Count before you write.

Tone: second person, active voice, concrete nouns, no emoji, no words like "innovative", "impactful", "journey", "unlock".
```

**MODE_RULES:**
```
Beginner: Problem: GIVE the student one specific problem. Scaffolding: 5-6 step-by-step tasks. Research: 3 secondary sources. Iterations expected: 1. Real-world contact: share with 1 person.
Intermediate: Problem: offer exactly 3 framings to choose from (put them in problemOptions; "problem" introduces the space). Scaffolding: 4 milestones only. Research: 4-5 sources + 1 primary source. Iterations: 2. Real-world contact: feedback from 3 people in the target group.
Advanced: Problem: the student defines it; describe the problem space and what they must pin down. Scaffolding: 3-4 outcomes only. Research: primary data (10+ people or a real dataset). Iterations: 3, with test evidence. Real-world contact: test with target users and measure.
```

**PROJECT_TYPES** (add to `shared/data.ts`):
| name | what | evidence |
|---|---|---|
| Research Paper | An original investigation written up formally | Paper, journal or conference submission |
| Venture | A for-profit business or startup | Running business, customers, revenue |
| Nonprofit | A mission-driven organization or initiative | Registered org, programs, people served |
| App / Software | A functional digital product | Live app, website, tool, code repo |
| Hardware / Prototype | A physical device or engineered build | Working prototype, robot, device |
| Campaign | An effort to change opinion, behavior, or policy | Petition, awareness drive, policy proposal |
| Event | A one-time or recurring gathering the student organizes | Conference, hackathon, fundraiser, workshop |
| Art Portfolio | A body of visual or design work | Gallery, exhibition, design collection |
| Data Project | Analysis or visualization of a dataset | Dashboard, report, open dataset |

**Tool `create_brief` input schema:**
```json
{
  "type": "object",
  "properties": {
    "projectType": { "type": "string", "enum": ["Research Paper","Venture","Nonprofit","App / Software","Hardware / Prototype","Campaign","Event","Art Portfolio","Data Project"] },
    "headline": { "type": "string" },
    "standfirst": { "type": "string" },
    "lede": { "type": "string" },
    "ledeSource": { "$ref": "#/$defs/src" },
    "theProblem": { "type": "string" },
    "problemOptions": { "type": "array", "items": { "type": "string" }, "description": "Intermediate mode only: exactly 3 framings. Otherwise empty." },
    "beneficiary": { "type": "string", "description": "The real beneficiary. Max 100 characters." },
    "yourMission": { "type": "array", "items": { "type": "string" }, "description": "2-3 bullet points. Max 200 characters in total." },
    "steps": { "type": "array", "items": { "type": "object", "properties": { "title": { "type": "string" }, "detail": { "type": "string" } }, "required": ["title","detail"] } },
    "whyItFitsYou": { "type": "string" },
    "startingSources": { "type": "array", "items": { "$ref": "#/$defs/src" } },
    "rubric": { "type": "array", "items": { "type": "object", "properties": { "criterion": { "type": "string" }, "levels": { "type": "array", "items": { "type": "string" } } }, "required": ["criterion","levels"] } },
    "checkpoints": { "type": "array", "items": { "type": "object", "properties": { "title": { "type": "string", "description": "Title Case, max 5 words" }, "goal": { "type": "string" }, "bring": { "type": "array", "items": { "type": "string" } } }, "required": ["title","goal","bring"] } }
  },
  "required": ["projectType","headline","standfirst","lede","theProblem","beneficiary","yourMission","steps","whyItFitsYou","startingSources","rubric","checkpoints"],
  "$defs": { "src": { "type": "object", "properties": { "title": { "type": "string" }, "publisher": { "type": "string" }, "url": { "type": "string" } }, "required": ["title","publisher","url"] } }
}
```
If `$ref` causes problems, inline the source object in both places. Every property in `required` must exist in `properties`.

**Post-processing (server):**
- Map to `Brief`: `headline→title`, `standfirst→oneLiner`, `theProblem→problem`, `yourMission→deliverableList`, `whyItFitsYou→programFit`, `startingSources→research`.
- Trim to limits at the last word break and append `…`: lede 300, problem 300, beneficiary 100, programFit 200, mission bullets share 200 total, step title 60 and title+detail 200.
- `projectType` not in the enum → `''`.
- `problemOptions` forced to `[]` unless mode is Intermediate.
- Rubric must have 4 rows; force `criterion` names to `CRITERIA`; any row without 4 levels → `BASE_RUBRIC` row.
- Checkpoints: reject if fewer than N; slice to N.
- Drop any source whose URL is not `http(s)`.

### B. Checkpoint feedback
- Model `MODEL_FAST`, `max_tokens: 2000`. Ask for JSON; parse from first `{` to last `}`; validate with Zod.
- If uploaded files are images or PDFs, attach them as image/document content blocks (max 5, ≤5 MB each). For other types send file names only.

**System:**
```
You give rubric-based checkpoint feedback to a school student on a portfolio project. Praise something specific first. Never rewrite or produce their work; ask questions instead. Base levels only on evidence in the submission; if evidence is missing, say what is missing. Levels: 0 Beginning, 1 Developing, 2 Proficient, 3 Exemplary. Return ONLY valid JSON.
```
**User:**
```
${projectCtx}

This is checkpoint ${n} of ${N}: "${cp.title}". Goal: ${cp.goal}
Previous feedback:
${prev || 'none'}        // one line per earlier CP: "Checkpoint k levels: Criterion=level, ..."

Submission:
${subText}

Each string under 35 words. Return ONLY: {"summary":"2 sentences","criteria":[{"criterion":"","level":0,"evidence":"what in the upload shows this level","next":"one concrete next step","question":"one question to push their thinking"}]} with 4 criteria in rubric order.
```
`projectCtx`:
```
Project: ${title}
Project type: ${projectType}
Mode: ${mode}
Problem: ${problem}
Beneficiary: ${beneficiary}
Deliverable: ${deliverableList.join(' ')}
Rubric:
${rubric.map(r => `${r.criterion}: ${r.levels.map((t, j) => `[${j}] ${t}`).join(' ')}`).join('\n')}
```
`subText`:
```
Student's note: ${note}
Files uploaded: ${files.length ? files.map(f => `${f.name} (${f.type || 'file'})`).join(', ') : 'none'}
Link: ${link || 'none'}
```
Validate: `summary` present, exactly 4 criteria. Force criterion names; clamp levels to 0–3 (non-numbers → 1).

### C. Final review
- Model `MODEL_FAST`, `max_tokens: 2500`.

**System:**
```
You write the final review for a student portfolio project. Be specific, warm and honest. Never rewrite or produce the student's work. Levels: 0 Beginning, 1 Developing, 2 Proficient, 3 Exemplary. Return ONLY valid JSON.
```
**User:**
```
${projectCtx}

${history}     // per checkpoint: "--- Checkpoint k ---\n${subText}\nFeedback: Criterion level L: evidence Next: next | ..."

--- Final submission ---
${subText}

Review all checkpoints plus the final submission. Cover improvements across checkpoints, deviations from the brief, what could have been done better, and the final level per criterion. Each string under 35 words.
Return ONLY: {"headline":"one sentence in Title Case, max 10 words","story":"3 sentences on how the student grew","improvements":["","",""],"deviations":["1-2 items"],"couldBeBetter":["","",""],"criteria":[{"criterion":"","level":0,"summary":""}]} with 4 criteria in rubric order.
```
Validate: headline present, 4 criteria; force names, clamp levels. On success set project `status = 'complete'`.

## 8. Frontend routes
| Route | Screen (see README §Screens) |
|---|---|
| `/` | Portfolio hub |
| `/new/:step` | Setup questions, step 1–7 |
| `/generating` | Loading (brief) |
| `/p/:id/brief` · `/rubric` · `/checkpoints` · `/growth` | Project tabs |
| `/p/:id/upload` | Upload (checkpoint or final, decided by server state) |
| `/p/:id/feedback/:n` | Feedback |
| `/p/:id/review` | Final review |

- Setup answers live in `sessionStorage` until submitted, so a refresh doesn't lose them.
- Loading screen: messages advance every 1.7 s (max 4); show for at least 2.5 s.
- Growth tab is computed client-side from stored levels. No AI.

## 9. Changes since README.md
1. **Career step is optional.** Continue is always enabled; status line "You can skip this step."; subtitle "Optional. Pick 1, or skip if you are still exploring." Remove the validation message for step 2.
2. **College & Degree** stays optional; country is prefilled from `Intl.Locale(navigator.language).maximize().region`, editable.
3. **Project type.** The AI picks one of 9 types. Show it as the **first meta chip** on the brief header (icon `category`) and on the hub card. Legacy/fallback briefs without a type show no chip.
4. Brief call uses forced tool choice (see 7A).

## 10. Build order and acceptance tests
Build and verify one phase at a time.

**Phase 1: Shell and design system**
- Lucidus tokens loaded; Albert Sans and Material Symbols render.
- Cosmic background, desktop sidebar (≥960 px), pill tabs (820–960), mobile top bar + bottom tab bar (<820).
- ✅ At 360×800 and 1440×900 the hub matches the prototype.

**Phase 2: Setup flow**
- 7 steps with the rules in README §2 plus §9 changes.
- ✅ Subjects requires 1–3; superpowers requires 2–4 + strongest; career and college can both be skipped; SDG requires 1–2.
- ✅ Refresh mid-setup keeps answers.

**Phase 3: Brief generation**
- `POST /projects` → AI A → saved project → Brief tab.
- ✅ A Beginner, an Intermediate and an Advanced run each return a valid brief with a project type, exactly N checkpoints, 4 rubric rows and only `http(s)` links.
- ✅ Intermediate shows "Potential Starting Points"; others don't.
- ✅ No career chosen → "Why It Fits You" mentions subjects/superpowers, not a career.
- ✅ With `ANTHROPIC_API_KEY` unset, the sample brief and toast appear and nothing crashes.

**Phase 4: Upload and feedback**
- Object Storage upload with progress; note ≥ 20 chars enforced client and server.
- ✅ Checkpoint 1 upload returns 4 criteria with levels 0–3, evidence, next step and question.
- ✅ Image/PDF uploads are passed to the model.
- ✅ Rating adds 20 XP once.

**Phase 5: Growth and final review**
- ✅ Growth grid fills per checkpoint; summary line rules from README §9.
- ✅ After the last checkpoint the primary button reads "Submit Final Work"; the review renders all sections; project shows Complete on the hub.

**Phase 6: Accounts**
- Anonymous session by default; "Save Your Progress" sends a magic link (single use, 15 min).
- ✅ Opening the link on a second browser shows the same projects.
- ✅ Signing in to an existing email merges the anonymous projects.

**Phase 7: Hardening**
- Rate limits, 60 s AI timeout with one retry, Zod on all inputs/outputs, delete removes stored files.
- ✅ Lighthouse mobile accessibility ≥ 90; all buttons ≥ 44 px tall on mobile; visible focus rings.

## 11. Prompts to paste into Replit Agent
Upload this whole folder to the Repl first. Paste the kickoff prompt, then one phase prompt at a time. Only move on when that phase's ✅ checks pass.

**Kickoff**
```
Read REPLIT_SPEC.md and README.md in this folder, and open "Portfolio Builder v5.dc.html" in the browser to see the intended design. REPLIT_SPEC.md is the source of truth; README.md has screen detail and design tokens. Use exactly the stack in §2. Do not port support.js or the prototype's runtime. Copy every AI prompt in §7 verbatim into server/prompts/. Never call Anthropic from the browser. Build in the phase order of §10 and stop after each phase so I can test. Start by setting up the project structure (/client, /server, /shared), the database schema from §4, the types from §5, and shared/data.ts ported from pb-data.js plus PROJECT_TYPES. Then do Phase 1.
```

**Phase prompts** (send one at a time)
```
Phase 2: Build the 7-step setup flow per README §2 and REPLIT_SPEC §9 (career and college optional, country prefilled). Keep answers in sessionStorage. Check every ✅ in Phase 2 and tell me the results.
```
```
Phase 3: Build POST /projects and AI call A exactly as REPLIT_SPEC §7A: forced tool_choice create_brief, verbatim prompts, the post-processing rules, and the fallback brief. Render the Brief and Rubric tabs, with the project type as the first meta chip. Run one Beginner, one Intermediate and one Advanced generation and show me the JSON.
```
```
Phase 4: Build file uploads to Object Storage, the upload screen, and AI call B per §7B, including passing images/PDFs to the model. Render the Feedback screen and rating. Check every ✅ in Phase 4.
```
```
Phase 5: Build the Checkpoints and Growth tabs and AI call C per §7C. Render the Final Review. Check every ✅ in Phase 5.
```
```
Phase 6: Build anonymous sessions, magic-link sign-in with Resend, and merging on sign-in per §4 and §6. Check every ✅ in Phase 6.
```
```
Phase 7: Add rate limits, the 60 s AI timeout with one retry, Zod on all inputs and AI outputs, and file cleanup on delete. Then compare every screen against the prototype at 360×800 and 1440×900 and list any visual differences you find.
```

## 12. Out of scope
Teacher/parent dashboards, payments, live web search for sources, editing a brief after generation, sharing projects publicly.
