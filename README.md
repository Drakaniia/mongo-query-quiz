# mongo-query-quiz

[![Deploy](https://github.com/Drakaniia/mongo-query-quiz/actions/workflows/deploy.yml/badge.svg)](https://github.com/Drakaniia/mongo-query-quiz/actions/workflows/deploy.yml)

**Live:** [mongo-query-quiz.pages.dev](https://mongo-query-quiz.pages.dev)

An interactive MongoDB query and update practice quiz. Each problem gives you a real-world task and
its SQL equivalent; you translate it into MongoDB shell syntax and get structural, per-rubric
feedback on the query you wrote.

The whole quiz runs in the browser. There is no API call and no database — answers are graded
client-side and progress is kept in `localStorage`.

## How grading works

`packages/quiz` (`@mongo/quiz`) is a UI-independent engine:

- **Parses** MongoDB shell syntax with a hand-written tokenizer — no `eval`, no `Function`.
- **Normalizes** equivalent forms, so `{a: 1}` and `{"a": 1}` are treated as the same query.
- **Grades** against a weighted, per-problem rubric, awarding partial credit per criterion rather
  than a single pass/fail.
- **Previews** a `find` against illustrative sample documents so you can check your answer against
  real output.

## Quick start

```bash
corepack enable   # pnpm is pinned via packageManager
pnpm install
pnpm run dev:web  # quiz only, http://localhost:5173/quiz
```

`pnpm install` runs `postinstall`, which generates the typed `src/env.ts` accessors for every
workspace from its `.env.schema`. It validates schemas, not values, so a fresh clone with no `.env`
files succeeds.

The quiz needs no database. `pnpm run dev` additionally starts the Hono API on port 3000, which
does require `DATABASE_URL` in `apps/server/.env` — prefer `dev:web` for quiz work.

## Project structure

```
mongo/
├── apps/
│   ├── web/         # React Router SPA (the only thing deployed)
│   └── server/      # Hono API — a stub, unused by the quiz
├── packages/
│   ├── quiz/        # Parser, normalizer, rubric grader, problem bank
│   ├── ui/          # Shared shadcn/ui primitives
│   ├── db/          # Prisma schema (no models yet)
│   └── infra/       # Alchemy stack (unused — see Deployment)
```

The quiz UI lives in `apps/web/src/features/quiz`: session setup, a two-pane problem/answer
experience, and the session summary.

## Scripts

| Command                        | Does                                              |
| ------------------------------ | ------------------------------------------------- |
| `pnpm run dev:web`             | Web app only (no database needed)                 |
| `pnpm run dev`                 | Web app + API in parallel                         |
| `pnpm run build:web`           | Build the SPA to `apps/web/build/client`          |
| `pnpm run test`                | Vitest suites (currently `@mongo/quiz`)           |
| `pnpm run check`               | Format/lint plus workspace typechecking           |
| `pnpm run preview:pages`       | Serve the built SPA through `wrangler pages dev`  |
| `pnpm run deploy:pages`        | Build and deploy to Cloudflare Pages (Linux only) |
| `pnpm run env:generate`        | Regenerate `src/env.ts` after editing a schema    |

To run the engine's tests on their own: `pnpm --filter @mongo/quiz test`.

## Deployment

The site is a static SPA on **Cloudflare Pages**, deployed by GitHub Actions on every push to
`main`. `wrangler.jsonc` is the source of truth: the project name is `mongo-query-quiz` and the
output directory is `apps/web/build/client`.

The workflow builds on `ubuntu-latest`, asserts the SPA artifact is present, and runs
`wrangler pages deploy`. It needs two repository secrets: `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`.

**Building on Windows does not currently work.** Varlock's CLI aborts during teardown with a libuv
assertion (`src/win/async.c`), and `@varlock/vite-integration` reports that as an invalid config.
`pnpm run dev:web` still starts despite printing the spurious error, but `pnpm run build:web` hard
exits 1. It is an upstream bug, not a repo problem — CI sidesteps it by building on Linux, so use
CI or WSL for local deploys.

The Alchemy stack in `packages/infra` (`pnpm run deploy`) is unconfigured scaffold. The API it
would deploy is a stub and the Prisma schema has no models, so nothing in the quiz needs it.

## Environment

Each app owns a `.env.schema`; Varlock generates typed `src/env.ts` accessors from it. Commit
schemas, keep secrets in gitignored `.env` files or in your deployment platform.

`apps/web` needs `NODE_ENV` and `VITE_SERVER_URL`. `VITE_SERVER_URL` is required by the schema but
never read by the quiz — the CI workflow sets it to a placeholder to satisfy validation.
