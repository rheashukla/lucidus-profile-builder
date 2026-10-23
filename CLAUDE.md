# Portfolio Builder: instructions for Claude Code

Build the product described in `REPLIT_SPEC.md`, with screens and visuals from `README.md`. Open `Portfolio Builder v5.dc.html` in a browser to see the intended design. It is a reference only. Do not port `support.js` or the prototype's runtime.

## Source of truth
1. `REPLIT_SPEC.md`: stack, data, API, AI prompts (verbatim), build phases, acceptance checks.
2. `README.md`: screen layouts, copy, Lucidus tokens.
3. This file: overrides for building outside Replit.

## Overrides to REPLIT_SPEC.md
- **Database:** local Postgres via `docker compose` (`postgres:16`), or a Neon URL in `DATABASE_URL`. Use Drizzle migrations (`drizzle-kit`).
- **File storage:** a `Storage` interface with two drivers: local disk (`./uploads`, dev) and S3-compatible (prod, `S3_*` env vars). Do not use Replit Object Storage.
- **Email:** Resend. In dev, if `RESEND_API_KEY` is unset, print the magic link to the server console.
- Ignore the "Prompts to paste into Replit Agent" section; use the phase prompts in this repo's `PROMPTS.md`.

## Commands (create these)
- `npm run dev`: client (Vite) and server together
- `npm run db:migrate`
- `npm test`: Vitest for server validation and AI post-processing
- `npm run typecheck`

## Rules
- Never call Anthropic from the browser. Keys only in `.env` (add `.env.example`, never commit `.env`).
- Copy AI prompts from REPLIT_SPEC §7 into `server/prompts/` exactly. Do not reword them.
- Validate every API body and AI response with Zod. Port `fallbackBrief`, `fallbackFeedback`, `fallbackReview` from the prototype verbatim.
- Styling: Lucidus CSS variables from `colors_and_type.css`, Albert Sans, Material Symbols Rounded. No Tailwind or UI library. Title Case headings and buttons, no emoji.
- Work one phase at a time (REPLIT_SPEC §10). At the end of each phase, run the ✅ checks, report results, and stop.
- Write unit tests for the brief post-processing (trimming, type enum, checkpoint count, rubric repair) and level clamping.
