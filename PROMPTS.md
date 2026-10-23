# Prompts for Claude Code

Paste one at a time. Move on only when that phase's checks pass.

**0. Kickoff**
```
Read CLAUDE.md, REPLIT_SPEC.md and README.md. Make a plan for the folder structure (/client, /server, /shared), then set up: Vite + React + TS client, Express + TS server, Drizzle schema from §4, types from §5, shared/data.ts ported from pb-data.js plus PROJECT_TYPES, docker-compose for Postgres, .env.example. Then do Phase 1 and stop.
```

**2. Setup flow**
```
Phase 2: Build the 7-step setup flow per README §2 and REPLIT_SPEC §9 (career and college optional, country prefilled). Keep answers in sessionStorage. Run the Phase 2 checks and report.
```

**3. Brief generation**
```
Phase 3: Build POST /projects and AI call A exactly as REPLIT_SPEC §7A: forced tool_choice create_brief, verbatim prompts, post-processing, fallback brief. Add unit tests for post-processing. Render the Brief and Rubric tabs with the project type as the first meta chip. Run one Beginner, Intermediate and Advanced generation and show me the JSON.
```

**4. Upload and feedback**
```
Phase 4: Build the Storage interface (local + S3), uploads, the upload screen, and AI call B per §7B, including passing images/PDFs to the model. Render Feedback and rating. Run the Phase 4 checks.
```

**5. Growth and final review**
```
Phase 5: Build the Checkpoints and Growth tabs and AI call C per §7C. Render the Final Review. Run the Phase 5 checks.
```

**6. Accounts**
```
Phase 6: Anonymous sessions, magic-link sign-in (Resend, console fallback in dev), and merging on sign-in per §4 and §6. Run the Phase 6 checks.
```

**7. Hardening**
```
Phase 7: Rate limits, 60 s AI timeout with one retry, Zod everywhere, file cleanup on delete. Then compare each screen against the prototype at 360×800 and 1440×900 and list differences.
```
