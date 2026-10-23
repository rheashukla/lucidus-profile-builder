# Portfolio Builder

Students aged 13–18 answer seven questions and get an AI-written project brief, a 4×4 rubric and 2–3 checkpoints, upload work for rubric-based feedback, and finish with a final review.

The product spec and design handoff are in `docs/` (`REPLIT_SPEC.md`, `README.md`, and the prototype HTML). `CLAUDE.md` lists the overrides for running outside Replit.

## Run it locally

```bash
cp .env.example .env          # add ANTHROPIC_API_KEY; everything else works with the defaults
docker compose up -d          # Postgres 16 on localhost:5432 (or point DATABASE_URL at Neon)
npm install
npm run db:migrate
npm run dev                   # client on http://localhost:5173, API on :3001
```

- No `ANTHROPIC_API_KEY`: every AI step returns the sample content and shows the "AI is unavailable" toast.
- No `RESEND_API_KEY`: magic links are printed to the server console instead of emailed.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite client and Express server together, with reload |
| `npm run db:migrate` | Apply Drizzle migrations in `server/drizzle/` |
| `npm run db:generate` | Create a new migration after editing `server/src/db/schema.ts` |
| `npm test` | Vitest: input validation, AI post-processing, level clamping, retries, rate limits |
| `npm run typecheck` | TypeScript across client, server and shared |
| `npm run build` / `npm start` | Build the client into `dist/client` and serve it from the API in production |

## Layout

```
client/   React 18 + Vite + React Router + TanStack Query. Plain CSS modules on Lucidus tokens.
server/   Express + Drizzle. AI prompts live in server/src/prompts (verbatim from the spec).
shared/   Types, static lists (ported from pb-data.js) and the text-trimming helper.
docs/     Spec, design handoff and the reference prototype.
```

## Production notes

- Set `NODE_ENV=production`, a long random `SESSION_SECRET` (the server refuses to start without one), `APP_URL`, `RESEND_API_KEY` and `EMAIL_FROM`.
- File storage: `STORAGE_DRIVER=s3` with `S3_BUCKET`, `S3_REGION`, and for S3-compatible providers `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. The default `local` driver writes to `./uploads`.
- Rate limits (10 AI calls a minute, 60 a day, per user) are kept in memory, so they apply per server process. Use a shared store such as Redis if you run more than one instance.
