# Handoff: Portfolio Builder

## Overview
Portfolio Builder helps students aged 13–18 plan and build a portfolio project for college applications. A student:

1. Answers 7 setup questions (subjects, superpowers, career, college/degree/country, time, SDG, mode).
2. Gets an AI-written **project brief**, a 4×4 **rubric** and N **checkpoints**.
3. Uploads work at each checkpoint and gets rubric-based **AI feedback**.
4. Tracks **growth** across checkpoints.
5. Submits final work for an AI **final review**.

Students can hold several projects at once, listed on a **portfolio hub**.

## About the design files
The files in this bundle are **design references built in HTML**: working prototypes that show the intended look and behaviour. They are not production code. Rebuild them in the target codebase's environment (React, React Native, etc.) using its established patterns. If no environment exists yet, choose an appropriate framework. Lucidus is mobile-first, so a responsive React/Next.js PWA is the natural fit.

The prototype calls the AI from the browser through a prototype-only helper (`window.claude.complete`). In production, **all AI calls must go through your backend**. The prompts and JSON shapes below are the contract.

## Fidelity
**High fidelity.** Colours, type, radii, spacing and interactions are final, and follow the **Lucidus Design System** (`colors_and_type.css` is included). Use the codebase's Lucidus tokens and components where they exist.

---

## Layouts

### Desktop (≥ 960px viewport)
- **Left sidebar (collapsible):**
  - Content: "Portfolio Builder" (home), then a "My Projects" group listing each project. The active project expands to Brief / Rubric / Checkpoints / Growth (plus Final Review once it exists), and the setup steps show while a project is being created.
  - Selected item: `rgba(255,255,255,.16)` fill, white text.
  - Collapsed state: icons only.
- **Main column:** max-width ~760px, content in stacked cards with 16px gaps.
- **Right panel:** next step or scores, depending on screen.
- **Between 820px and 960px:** no sidebar. A pill tab row (Brief / Rubric / Checkpoints / Growth) appears under the brief header instead.

### Mobile (360 × 800 master frame)
- **Top bar:** project-name selector that opens a "My Projects" bottom sheet, with a "New Project" button.
- **Bottom tab bar:** Home · Brief · Rubric · Checkpoints · Growth.
  - Active tab: 56×30 pill in `--purple-10`, icon `--purple-60` with FILL 1.
  - Checkpoints tab: orange count badge showing checkpoints remaining.
- **Sticky primary button:** full width, pinned above the tab bar. Its label and action change per screen (see "Primary button by screen").
- **Brief card:** minimised by default (title, progress bar and a "Details" toggle); expands to show the one-liner and meta chips.
- **Modals:** become bottom sheets with radius `28px 28px 0 0`.

### Background
Deep purple vertical gradient (`#130934 → #371c9a`) with a faint static starfield. Stars may twinkle slowly; they never spin or move.

---

## Screens

### 1. Portfolio hub (`welcome`)
- A card per project showing title, status, checkpoints done (e.g. "1 / 3") and a progress bar.
- **Open:** clicking a card opens that project's Brief tab.
- **Options menu:** a ⋯ button opens a menu containing **Delete Project**. It opens a confirm modal ("Delete This Project?" / "Delete Project" / "Keep My Project").
  - Delete is never an inline button.
  - Deleting removes only that project's brief, uploads and feedback.
- **Main button:** "Start My Project" when there are no projects, "Resume My Project" otherwise.
- **Guide line:**
  - No project: "Hi! Seven quick questions and you'll have a project built around you."
  - Existing project: "You're so close. Pick up where you left off."

### 2. Setup questions (`inputs`), 7 steps
**Layout**
- Top: back button and a progress bar with "Step X of 7". The current segment is wider (flex 2.5) and `--purple-30`; done segments are `--green-40`.
- Middle: full-height scrollable option area.
- Bottom: pinned Continue button, disabled until the step is valid. A status line shows either the validation message or a count like "2 of 3 picked".

**Steps**

| # | Step | Rule | Validation message |
|---|---|---|---|
| 0 | Subjects | Pick 1–3, grouped chips | "Pick at least 1 subject." |
| 1 | Superpowers | Pick 2–4, then mark one as strongest | "Pick at least 2 superpowers." / "Mark your strongest." |
| 2 | Career | Pick 1 (searchable, grouped) or "Still exploring" | "Pick a career, or Still exploring." |
| 3 | College, degree, country | Optional ("You can skip this step.") | — |
| 4 | Time | 1, 2, 3 or 4 weeks; each card shows its checkpoint count | — |
| 5 | Global goal | Pick 1–2 of the 17 UN SDGs | "Pick at least 1 goal." |
| 6 | Mode | Beginner, Intermediate or Advanced | — |

**Step 3 fields**
- **College:** combobox with up to 6 suggestions from `colleges`.
- **Degree:** custom dropdown grouped by `degrees`. Its first option is "No degree picked yet".
- **Country:** free-text input. Pre-filled from the browser locale:

  ```js
  new Intl.DisplayNames(['en'], { type: 'region' }).of(new Intl.Locale(navigator.language).maximize().region)
  ```

  Helper text: "Detected from your browser. Change it if it's wrong."
- Dropdown menus must sit above the fields below them (z-index) and must not be clipped.

**Step 6 (Mode) cards** show these rows from `pb-data.js`:

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Problem | Given to you | Choose from 3 framings | You define it |
| Guidance | Step-by-step tasks | Milestones only | Outcomes only |
| Research | 3 secondary sources | 4–5 sources + 1 primary | Primary data (10+ people or a real dataset) |
| Iterations | 1 | 2 | 3, with test evidence |
| Real world | Share with 1 person | Feedback from 3 people in target group | Test with target users and measure |

### 3. Loading (`busy`)
- Used for brief generation, feedback and the final review.
- Progress messages advance every 1.7s, up to 4 stages.
- Minimum display time is 2.5s, even if the AI responds sooner.

### 4. Project: Brief tab
The header card shows title, one-liner, meta chips (mode, weeks, checkpoint count, each SDG), project progress and the main/secondary buttons. Below it, cards appear in this order:

| Order | Section | Content | Max characters |
|---|---|---|---|
| 1 | Lede (no heading) | Opening paragraph and source link | 300 |
| 2 | The Problem | Problem text; Intermediate mode only adds "Potential Starting Points" (3 options) | 300 |
| 3 | Who Benefits | One line | 100 |
| 4 | What You'll Make | 2–3 bullets | 200 total |
| 5 | Step By Step / Milestones / Outcomes (label depends on mode) | Numbered steps, each a title and detail | 200 per step |
| 6 | Research Starting Points | Title per source, plus "Publisher · Check this link ↗" (opens in a new tab) | — |
| 7 | Why It Fits You | Link to career and degree | 200 |

**How the limits are enforced**
- The limits are given to the model in the prompt.
- The client also trims over-long text at the last word break and adds "…".

**Link rules:** a link renders only for `http(s)` URLs. All links are labelled "Check this link" because they come from model memory, not live search.

### 5. Project: Rubric tab
- 4 criteria × 4 levels (Beginning, Developing, Proficient, Exemplary), with wording tailored to the brief.
- Card backgrounds use a purple-to-teal gradient.
- The student's latest level per criterion is highlighted with a 2px border.

### 6. Project: Checkpoints tab
- Journey path: one node per checkpoint plus Final, joined by vertical lines (green when done).
- Each card shows:
  - An eyebrow: "Checkpoint k · Suggested Day X".
  - Title and goal.
  - "What to bring" tags, which wrap inside the card.
  - A status badge: Locked, In progress or Complete, in gradient pills. The status dot is green (done), orange (current) or `--purple-15` (locked).
- The current card has a "Start" button. Completed cards have "View Feedback".
- **Suggested days** (from `timeline`):

  | Weeks | Checkpoint days | Final day |
  |---|---|---|
  | 1 | 2, 5 | 7 |
  | 2 | 4, 10 | 14 |
  | 3 | 5, 12, 17 | 21 |
  | 4 | 7, 16, 23 | 28 |

### 7. Upload (`upload`)
- Fields: note (required), link (optional) and files.
- **Checkpoint version**
  - Note label: "What did you do, and what changed since last time?"
  - Placeholder: "Describe what you made, what you tried, and anything you are unsure about."
  - Button: "Get Feedback".
- **Final version**
  - Note label: "What are you most proud of, and what would you do differently?"
  - Placeholder: "Tell the story of your project in your own words."
  - Button: "Get Final Review".
- **Validation:** the note needs at least 20 characters. Until then the button is at 50% opacity with `not-allowed`, and the hint reads "N more characters to go". After that it reads "Feedback will ask questions, not rewrite your work."

### 8. Feedback (`feedback`)
- Summary, then one card per criterion with its level, the evidence, a next step and a question.
- The student can rate the feedback. Rating earns XP.
- Main button: "Back To Project", which opens the Growth tab. After the last checkpoint it reads "Back To Project: Final Up Next".

### 9. Project: Growth tab (no AI)
Everything here is calculated from levels already stored with each feedback and the final review.
- **Grid:** criteria as rows, checkpoints as columns ("Checkpoint n" on wide screens, "CP n" on narrow), plus a "Final" column once the review exists.
- **Rings/tiles:** one per criterion showing the latest level, with 4 segments filled up to that level.
- **Summary line:**
  - Fewer than 2 checkpoints: "This is your starting point. Check in again to see what moves."
  - Otherwise: "X of 4 criteria have moved up at least one level since Checkpoint 1."

### 10. Final review (`review`)
- Headline, a growth story (3 sentences), improvements, deviations from the brief, "what could be better", and the final level per criterion.
- Main button: "Back To Project".

### 11. Save / sign-in modal
- **Email step**
  - Title: "Save Your Progress". When reached from "Continue on another device" the title is "Continue On Another Device".
  - Content: email field and "Send Link" button.
  - Validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. An invalid email shows the toast "Enter a valid email address."
- **Sent step**
  - Title: "Check Your Inbox".
  - Body: "…It works once and expires in 15 minutes."
  - "Use A Different Email" returns to the email step.
- **Closing:** the close button is fixed at top 16px / right 16px. Clicking the backdrop also closes the modal; clicks inside the sheet must not close it.
- **Production:** replace the prototype's fake "Open Link" with a real magic-link sign-in.

### Primary button by screen

| Screen | Label | Action |
|---|---|---|
| Portfolio hub | "Start My Project" / "Resume My Project" | Start setup / open project |
| Setup questions | Continue | Next step |
| Project, checkpoints remaining | "Next Up" button | Opens the next upload |
| Project, final due | "Submit Final Work" | Opens the final upload |
| Project, review done | "View Final Review" | Opens the review |
| Upload | "Get Feedback" / "Get Final Review" | Submits |
| Feedback | "Back To Project" | Opens Growth tab |
| Final review | "Back To Project" | Opens Brief tab |

### Toasts
- **Position:** top centre, at most `calc(100% - 32px)` wide, z-index 30.
- **AI fallback messages:**
  - "AI is unavailable right now, so this is a sample brief."
  - "… sample feedback."
  - "… sample review."

---

## AI contract
Every call returns structured JSON. Validate the shape, and if it's wrong, use the fallback content (`fallbackBrief`, `fallbackReview`, and the sample feedback) and show the matching toast. Levels are integers 0–3; clamp them.

### A. Brief, rubric and checkpoints: one call
- **Model:** Sonnet (prototype: `claude-sonnet-4-5`, max_tokens 8000).
- **Output:** returned through a tool call `create_brief`.
- **System prompt:** features-editor persona writing in the style of The Economist / NYT.
  - **Sources:** no web search. Use only well-known, stable sources (UN, WHO, World Bank, UNICEF, OECD, Our World in Data, national statistics offices), preferably covering the student's country.
  - **Citations:** every fact must carry a URL. If the model isn't confident, it leaves the fact out. It must never invent people, quotes, numbers or college details.
  - **Safety:** no hazardous materials, no meeting strangers alone, no sensitive personal data.
- **User message:**
  - A `<student>` block: subjects, superpowers (with strongest), career, college/degree, weeks and N checkpoints, SDGs, mode, country.
  - `<mode_rules>` for the chosen mode only.
  - `<base_rubric>`.
  - The ordered field list with the character limits above.
  - Checkpoints: exactly N. Each checkpoint goal must include the hands-on instructions that belong at that point: the student's own decisions, who to talk to or what data to collect, how many versions to make, and consent rules if there are interviews or surveys.
  - Tone rules: second person, no emoji, no "innovative / impactful / journey / unlock".
- **Tool input schema:**

```json
{
  "headline": "≤10 words",
  "standfirst": "1 sentence",
  "lede": "≤300 chars",
  "ledeSource": { "title": "", "publisher": "", "url": "" },
  "theProblem": "≤300 chars",
  "problemOptions": ["3 items, Intermediate only"],
  "beneficiary": "≤100 chars",
  "yourMission": ["2–3 bullets, ≤200 chars total"],
  "steps": [{ "title": "", "detail": "" }],
  "whyItFitsYou": "≤200 chars",
  "startingSources": [{ "title": "", "publisher": "", "url": "" }],
  "rubric": [{ "criterion": "", "levels": ["", "", "", ""] }],
  "checkpoints": [{ "title": "Title Case, ≤5 words", "goal": "", "bring": ["2–3 items"] }]
}
```

- **Validation:** title exists; rubric has exactly 4 rows; checkpoints count ≥ N (slice to N). Force criterion names to `pb-data.criteria`. If a rubric row doesn't have 4 levels, use `baseRubric`.
- **Mode rules sent to the model:**
  - **Beginner:** give one specific problem; 5–6 step-by-step tasks; 3 secondary sources; 1 iteration; share with 1 person.
  - **Intermediate:** exactly 3 framings in `problemOptions`; 4 milestones; 4–5 sources plus 1 primary; 2 iterations; feedback from 3 people in the target group.
  - **Advanced:** the student defines the problem; 3–4 outcomes; primary data (10+ people or a dataset); 3 iterations with test evidence; test with users and measure.

### B. Checkpoint feedback: one call per upload
- **Model:** Haiku, max_tokens 2000.
- **System prompt:** rubric-based feedback for a school student.
  - Praise something specific first.
  - Never rewrite or produce the student's work; ask questions instead.
  - Base levels only on evidence in the submission. If evidence is missing, say what's missing.
- **User message:**
  - Project context: title, mode, problem, beneficiary, deliverable, rubric.
  - "Checkpoint k of N", with its title and goal.
  - Levels from earlier checkpoints.
  - The submission: note, link and file names.
  - Every string under 35 words.
- **Returns:** `{ summary: "2 sentences", criteria: [{ criterion, level, evidence, next, question }] }` with 4 criteria in rubric order.

### C. Final review
- **Model:** Haiku, max_tokens 2500.
- **System prompt:** specific, warm and honest. Never rewrite the student's work.
- **User message:** project context, every checkpoint submission with its feedback, and the final submission. Each string under 35 words.
- **Returns:**

  ```json
  { "headline": "", "story": "", "improvements": ["", "", ""], "deviations": [""], "couldBeBetter": ["", "", ""], "criteria": [{ "criterion": "", "level": 0, "summary": "" }] }
  ```

---

## State and data

```text
inputs     { subjects[], powers[], strongest, career, college, degree, country, weeks: 1–4, sdgs[], mode }
project    { ...brief fields, weeks, mode, sdgs, career, createdAt }
subs[]     { n, note, link, files[{ name, type, size }], at, feedback, rating? }
review     final review object | null
finalSub   final submission | null
library[]  { id, project, subs, review, finalSub, inputs }   // other projects
ui         screen, step, tab, modal, navCollapsed, draft { note, link, files }
```

- **Storage:** the prototype persists to `localStorage['pb-proto-v1']`. In production, persist per user on the server; email sign-in links devices together.
- **Files:** the prototype keeps only file metadata. Production needs real upload storage, and the feedback call should get file contents or extracted text where possible.
- **XP:** 20 per setup step, 100 per submission, 20 per rated feedback, 200 for the final review.
- **Static lists:** subjects, superpowers, careers, degrees, colleges, SDGs, modes, timeline and the rubric are all in `pb-data.js`.

---

## Design tokens (Lucidus)

**Font:** Albert Sans. Body 14–16px Regular with line-height 1.5–1.6. Headings 19–24px SemiBold/Bold. Eyebrows 12–13px weight 800, uppercase, letter-spacing 0.1em.

**Colours and surfaces**

| Element | Value |
|---|---|
| Page background | `linear-gradient(180deg, #130934 0%, #371c9a 100%)` with starfield |
| Card, dark | `linear-gradient(180deg, #5E35F1 0%, #3618A3 100%)`, radius 32px, shadow `0 16px 32px -16px rgba(0,0,0,.5)`, padding 24px |
| Card, light | `linear-gradient(0deg, #5E35F1 0%, #A187FF 100%)`, radius 24px |
| Glass chip / secondary surface | `rgba(255,255,255,.08)` with `inset 0 0 0 1px rgba(255,255,255,.18)` and `backdrop-filter: blur(20px)` |
| Progress bars | purple-to-green gradient; track `rgba(255,255,255,.12)`, height 10px, pill |
| Text | primary `#fff`; secondary `--purple-10` / `--purple-15` (#C2B1FF); links and success `--green-30` (#4ED0AA); warnings `--orange-40` (#FE7F3B) |
| Danger | `--red`, button shadow `0 4px 0 #8f1d1d` |
| Modal backdrop | `rgba(11,5,32,.6)` with `blur(4–6px)` |

**Buttons**
- **Primary:**
  - Height 52px, radius 48px, `linear-gradient(180deg, #24A57F 0%, #034230 100%)`, white 16px/700.
  - Shadow `0 4px 0 #021a13, 0 8px 16px -6px rgba(0,0,0,.5)`.
  - Hover: `brightness(1.12)`. Pressed: `translateY(3px)` and shadow `0 1px 0 #021a13`. Focus: 3px `--purple-15` outline, offset 3px.
- **Secondary:**
  - Height 52px, radius 48px, `linear-gradient(0deg, rgba(255,255,255,.05), rgba(255,255,255,.10))`, `blur(20px)`, inset 1px `rgba(255,255,255,.18)`.
  - Hover: `rgba(255,255,255,.16)`. Pressed: `translateY(1px)`.
- **Disabled:** 50% opacity, `not-allowed`.

**Radii:** 12, 16, 20, 24, 28 (sheets), 32 (cards), 999 (pills).
**Motion:** `150ms cubic-bezier(.22,1,.36,1)` for buttons; 200ms for chevrons and cards.
**Icons:** Material Symbols Rounded. FILL 1 when active.

## Assets
- Icons: Material Symbols Rounded (Google Fonts).
- Brand tokens: `colors_and_type.css` (Lucidus).
- No images or illustrations are used.

## Files in this bundle
- `Portfolio Builder v5.dc.html`: the full prototype (template, logic and prompts). The prompts are in `aiBrief()`, `submitUpload()`, `modeRules()` and `projectCtx()`.
- `pb-data.js`: all static lists, the timeline and the base rubric.
- `colors_and_type.css`: Lucidus design tokens.
- `support.js`: prototype runtime only. Not needed in production.

Open the HTML in a browser to try it. It needs the Lucidus `_ds/` folder beside it to render with full styling.
