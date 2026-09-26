# Deployment Guide — MongoDB Query Practice

How to deploy this app for **free**, with three paths of increasing complexity.

---

## TL;DR

> **Deploy only `apps/web`. Skip the database and the API entirely.**
>
> The quiz is 100% client-side: the grading engine (`@mongo/quiz`) runs in the browser and progress
> is stored in `localStorage`. Nothing in the web app talks to the API. See
> [§1](#1-what-actually-needs-deploying) for the evidence.
>
> - **Cheapest and most reliable:** Path A — build `apps/web` as a static SPA and host it on
>   Cloudflare Pages. Free forever, unlimited static requests, no cold starts.
> - **Want the scaffold's full stack?** Path C — `pnpm run deploy` (Alchemy) provisions Prisma
>   Postgres and deploys both apps to Prisma Compute, which is **free during public beta**.

### ⚠️ Read this first if you are on Windows

`pnpm --filter web build` **cannot complete on Windows** right now — a Varlock CLI teardown bug kills
the build. This is environmental, not a bug in this repo's code. Build on Linux (CI or WSL) instead.
Full diagnosis and workarounds: [§4](#4--windows-the-build-fails-locally-read-this).

---

## 1. What actually needs deploying

| Claim                           | Evidence                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The quiz grades in the browser  | `@mongo/quiz` is a normal dependency of `apps/web` (`"@mongo/quiz": "workspace:*"`) and its parser/grader are imported by `apps/web/src/features/quiz/*` |
| Progress needs no server        | `apps/web/src/features/quiz/use-quiz-progress.ts` persists to `localStorage`                                                                             |
| The web app never calls the API | No `fetch(`, no `VITE_SERVER_URL` usage, no route `loader`/`action`/`clientLoader`, and no `.server` modules anywhere in `apps/web/src`                  |
| The web app has no database     | `apps/web` does not depend on `@mongo/db`; `prisma` is not imported anywhere in `apps/web/src`                                                           |
| The API is a stub               | `apps/server/src/index.ts` serves exactly one route: `GET /` → `"OK"`                                                                                    |
| There is no data model yet      | `packages/db/prisma/schema/schema.prisma` declares a datasource but **zero models**, and `packages/db/prisma/migrations/` contains only `.gitkeep`       |

**Conclusion:** the only artifact worth shipping for this project is the web app. The API, Prisma
schema and infra stack are scaffold for features that have not been written yet.

---

## 2. What each path deploys

```
Path A (static)   apps/web  ──build──►  build/client/  ──►  Cloudflare Pages / GitHub Pages
Path B (Node SSR) apps/web  ──build──►  build/server/index.js (Express, listens on $PORT)
Path C (Alchemy)  packages/infra/alchemy.run.ts
                    ├── Prisma.Postgres  → managed database (us-east-1)
                    ├── database-migrations (prisma migrate deploy)
                    ├── Prisma.Compute "server" → apps/server on port 3000
                    └── Prisma.Compute "web"    → apps/web on port 3000
```

The web app's production entrypoint is `apps/web/prisma.server.ts` — a small Express server that
serves `build/client` assets and does SSR. It binds `0.0.0.0` and honours `process.env.PORT ?? 3000`,
so it works on any Node host without changes.

---

## 3. Prerequisites

| Tool    | Version used by this repo                                                                   |
| ------- | ------------------------------------------------------------------------------------------- |
| Node.js | 24 (verified on `v24.12.0`); the WSL Ubuntu 24.04 image on this machine provides `v22.22.3` |
| pnpm    | `12.3.4` — pinned by the `packageManager` field in `package.json`                           |
| Git     | any recent version                                                                          |

Enable the pinned package manager once:

```bash
corepack enable
node -v      # expect v22 or newer
pnpm -v      # expect 12.3.4
```

Install dependencies from the **repo root**:

```bash
pnpm install
```

> `pnpm install` runs `postinstall` → `node scripts/generate-env.mjs`, which regenerates the typed
> `env.ts` accessors for every workspace. It validates the _schemas_, not the _values_, so it
> succeeds on a fresh clone with no `.env` files present.

---

## 4. ⚠️ Windows: the build fails locally (read this)

### Symptom

```bash
pnpm --filter web build
# Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
# [varlock] ⚠️ config is invalid — fix the error(s) above to continue
# [varlock] config is invalid — cannot proceed with build
# ELIFECYCLE Command failed with exit code 1
```

### Diagnosis (the config is _not_ actually invalid)

Run Varlock directly and it resolves every variable successfully:

```bash
cd apps/web && pnpm exec varlock load
# -- Resolved config --
# ✅ NODE_ENV*
#    └ "development"
# ✅ VITE_SERVER_URL*
#    └ "http://localhost:3000"
# Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
```

The real exit code is **127** — the process is aborted. The assertion is thrown by libuv's Windows
async implementation _during teardown, after validation already passed_. The Varlock Vite plugin
spawns the CLI, sees the abnormal exit, and misreports it as an invalid config.

This is the same class of bug this repo already works around elsewhere: `scripts/generate-env.mjs`
documents it and calls Varlock's Node API **in-process** to sidestep a forced `process.exit()`
that trips `src\win\async.c line 76`. Code generation is fixed that way; the Vite plugin path is not.

```bash
# Proves the schemas are fine — this succeeds on Windows:
node scripts/generate-env.mjs
# ✅ Generated 1 env file(s) for ./apps/web/
# ✅ Generated 1 env file(s) for ./apps/server/
# ✅ Generated 1 env file(s) for ./packages/db/
# ✅ Code generated successfully
```

The same crash also breaks any local run that imports Varlock — including `pnpm run dev:server` and
`pnpm run dev` — with the identical assertion.

### Workarounds, best first

1. **Build on Linux (recommended).** Use CI (§9) or WSL. This box already has WSL Ubuntu 24.04 with
   Node `v22.22.3` and pnpm `12.3.4`:

   ```powershell
   wsl -d Ubuntu-24.04
   cd /mnt/c/Users/<you>/Desktop/mongo
   pnpm install          # installs Linux binaries into node_modules
   pnpm --filter web build
   ```

   > Heads-up: a WSL `pnpm install` swaps platform-specific binaries (rolldown/esbuild) inside the
   > shared `node_modules`. After building in WSL, re-run `pnpm install` on Windows before using the
   > Windows dev server again.

2. **Upgrade Varlock.** The repo pins `varlock: 1.18.0` (see `pnpm-workspace.yaml`). If upstream has
   fixed the Windows teardown crash, bumping the catalog version fixes `build` _and_ `dev:server`
   locally. Verify with `pnpm exec varlock load` — it should exit `0` with no assertion.

3. **Run the build on a Linux CI runner only.** Treat Windows as a dev-only environment.

**Not a workaround:** deleting `.env` files or stubbing the schemas. The config is valid; the crash
is in process teardown.

---

## 5. Path A — Free static deploy (recommended)

No database, no API, no cold starts. Works on any static host.

### Step 1 — Switch the app to SPA mode

`apps/web/react-router.config.ts` currently is:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
} satisfies Config;
```

Add `ssr: false` (supported by the installed `@react-router/dev` — see the `ssr?: boolean` field in
its config types, and the `prerender` option if you prefer real HTML files):

```ts
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false, // build/client becomes a fully static SPA
} satisfies Config;
```

The app is safe to convert: it has no route `loader`s, no `action`s and no `.server` modules, so
nothing depends on a server runtime.

> If `ssr: false` conflicts with the `environments.ssr.build.rollupOptions.input` override in
> `apps/web/vite.config.ts`, drop that override — it only exists for the SSR entrypoint.

### Step 2 — Provide build-time env vars

The build **requires** both variables to be present, because the Varlock schema declares
`@defaultRequired=true` and they have no defaults. This trips up CI on a fresh clone:

```bash
# apps/web/.env  (gitignored — create it)
NODE_ENV=production
VITE_SERVER_URL=https://example.invalid   # unused by the quiz; any valid URL satisfies the schema
```

### Step 3 — Build

```bash
pnpm install
pnpm --filter web build
```

Output is **`apps/web/build/client/`** — a static bundle. That directory is the deploy artifact.

### Step 4a — Deploy to Cloudflare Pages (most generous free tier)

Static requests are free and unlimited, 500 builds/month, up to 20,000 files.

SPA routing needs a fallback. Create `apps/web/public/_redirects`:

```
/*  /index.html  200
```

Then deploy:

```bash
npx wrangler pages deploy apps/web/build/client --project-name mongo-query-quiz
```

Or connect the repo in the Cloudflare dashboard:

| Setting                | Value                     |
| ---------------------- | ------------------------- |
| Build command          | `pnpm --filter web build` |
| Build output directory | `apps/web/build/client`   |
| Root directory         | `/`                       |

### Step 4b — Deploy to GitHub Pages

Free for public repos (~100 GB/month soft bandwidth, 10 builds/hour).

```bash
# publish build/client to the gh-pages branch
npx gh-pages -d apps/web/build/client
```

GitHub Pages needs a `404.html` copy of `index.html` for deep links (`/quiz`):

```bash
cp apps/web/build/client/index.html apps/web/build/client/404.html
```

If you deploy to `https://<user>.github.io/<repo>/`, set `basename` in `react-router.config.ts` to
`"/<repo>"` so client routing resolves correctly.

### Step 4c — Deploy to Netlify

Build command `pnpm --filter web build`, publish directory `apps/web/build/client`, plus a
`_redirects` file identical to Cloudflare's.

---

## 6. Path B — Free Node SSR deploy (Render)

Use this if you want server-side rendering of the real HTML (better first paint and link previews).

### Step 1 — Build on Linux

```bash
pnpm install
pnpm --filter web build
```

Artifact: **`apps/web/build/server/index.js`** — the Express server from
`apps/web/prisma.server.ts`. `packages/infra/alchemy.run.ts` uses this exact entrypoint, so it is
the intended production server.

### Step 2 — Verify it locally first

```bash
PORT=4000 node apps/web/build/server/index.js
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/      # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/quiz  # 200
```

### Step 3 — Render settings

| Setting           | Value                                     |
| ----------------- | ----------------------------------------- |
| Environment       | Node                                      |
| Build command     | `pnpm install && pnpm --filter web build` |
| Start command     | `node apps/web/build/server/index.js`     |
| Health check path | `/`                                       |

Render injects `PORT` automatically, which the Express entrypoint already reads.

**Free-tier caveat:** Render spins a free web service down after **15 minutes** without traffic, and
the next request takes roughly **1 minute** to wake it. If that matters, use Path A instead — static
hosting has no cold start.

---

## 7. Path C — The scaffold's intended Alchemy deploy

`pnpm run deploy` → `vp run --filter @mongo/infra deploy` → `alchemy deploy`.

What the stack in `packages/infra/alchemy.run.ts` does:

1. Provisions a **Prisma Postgres** project/database (`region: "us-east-1"`).
2. Resolves a connection URL and runs migrations via
   `Command.Exec("database-migrations", "pnpm run db:migrate:deploy")` in `packages/db`, with
   `DATABASE_URL` injected.
3. Deploys **`server`** (`Prisma.Compute`, `apps/server`, port 3000, health check `/`) and
   **`web`** (`Prisma.Compute`, `apps/web`, port 3000, health check `/`), passing `DATABASE_URL` and
   `CORS_ORIGIN` to the server, and the deployed server URL as `VITE_SERVER_URL` to the web build.
4. Uses **local state** (`Alchemy.localState()`).

### Steps

```bash
# 1. Provide the one variable this package needs
#    packages/infra/.env.schema -> ALCHEMY_PASSWORD (optional, @defaultRequired=false)
cat > packages/infra/.env <<'EOF'
ALCHEMY_PASSWORD=choose-a-long-random-passphrase
EOF

# 2. Authenticate the providers (writes profiles to ~/.alchemy)
cd packages/infra && pnpm exec alchemy profile edit

# 3. Deploy (stages default to a personal dev_<username> stage)
pnpm run deploy

# 4. Production
cd packages/infra && pnpm exec alchemy deploy --stage production

# 5. Tear everything down
pnpm run destroy
```

`CORS_ORIGIN` is read via `Config.String("CORS_ORIGIN")` from `apps/server`'s schema. After the
first deploy, set it to the exact deployed web origin:

```bash
# apps/server/.env
CORS_ORIGIN=https://your-deployed-web-url
```

`_VARLOCK_ENV_KEY` is forwarded to the web build when present (encrypted env values at build time);
it is optional.

### Cost

- **Prisma Compute is free during public beta** — you pay for requests/CPU/memory/bandwidth only
  after it goes GA.
- **Prisma Postgres has a $0 Free plan** (limited monthly operations, ~500 MB storage, and per
  Prisma's terms it is intended for non-commercial use).
- Net cost for this app: **$0** while Compute is in beta. Re-check the terms before relying on it.

### Caveats

- The stack deploys the **stub API and an empty database** — neither is used by the quiz today.
- `packages/db/prisma/migrations/` is empty, so `db:migrate:deploy` is a no-op until you create a
  migration (`pnpm run db:migrate`).
- State is local, not remote, so **do not deploy from two machines** or from CI without first
  switching to a shared state backend.

---

## 8. Environment variables reference

Schemas live in `*.env.schema`; typed accessors are generated into `src/env.ts` by
`pnpm run env:generate`. All schema entries default to **required** and **sensitive** unless
annotated otherwise.

| Variable           | Schema file                  | Required                     | Used at | Notes                                                                                        |
| ------------------ | ---------------------------- | ---------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `apps/web/.env.schema`       | yes (defaults `development`) | build   | `@public`, enum `development\|production\|test`                                              |
| `VITE_SERVER_URL`  | `apps/web/.env.schema`       | yes                          | build   | `@public @type=url`. **Unused by the quiz** — set it to any valid URL to satisfy the schema  |
| `NODE_ENV`         | `apps/server/.env.schema`    | yes                          | runtime |                                                                                              |
| `CORS_ORIGIN`      | `apps/server/.env.schema`    | yes                          | runtime | `@type=url`; must be the exact deployed web origin                                           |
| `DATABASE_URL`     | `apps/server/.env.schema`    | yes                          | runtime | `@type=string(minLength=1)`. **Not required by the quiz** — only the stub API/Prisma need it |
| `ALCHEMY_PASSWORD` | `packages/infra/.env.schema` | no                           | deploy  | `@defaultRequired=false`; encrypts Alchemy state                                             |

`packages/db/.env.schema` imports `NODE_ENV` and `DATABASE_*` from `apps/server`, so `DATABASE_URL`
must be set for Prisma commands (`db:generate`, `db:migrate`, `db:push`).

All `.env` files are gitignored — **a fresh clone has none**, so create the ones your path needs.

---

## 9. CI: free GitHub Actions build + deploy

`.github/workflows/deploy.yml` — builds on Linux (dodging the Windows blocker) and publishes to
Cloudflare Pages.

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
      # Required by apps/web/.env.schema even though the quiz never reads it
      VITE_SERVER_URL: ${{ vars.VITE_SERVER_URL || 'https://example.invalid' }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # reads packageManager -> pnpm 12.3.4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
      - run: cp apps/web/build/client/index.html apps/web/build/client/404.html
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web/build/client --project-name mongo-query-quiz
```

To deploy to Render instead, replace the last step with a deploy hook:

```yaml
- run: curl -fsSL -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

For the SPA build, remember the `ssr: false` change from §5 and the `_redirects` fallback.

---

## 10. Troubleshooting

### `ERR_PNPM_CMD_SHIM_REMOVE_STALE_BIN` — "Access is denied" on `node_modules/.bin/oxlint.cmd`

pnpm is replacing a stale bin shim and Windows has the file locked — usually a leftover `vp`/`oxlint`
process, an editor indexing `node_modules`, or antivirus.

```bash
taskkill //F //IM oxlint.exe 2>/dev/null
rm -f node_modules/.bin/oxlint node_modules/.bin/oxlint.cmd node_modules/.bin/oxlint.ps1
pnpm install
```

### `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76`

Windows-only Varlock teardown crash. See [§4](#4--windows-the-build-fails-locally-read-this).
Build on Linux, or upgrade Varlock.

### `[varlock] config is invalid` with no errors printed

Same crash as above — the CLI dies before flushing its output. Confirm with
`pnpm exec varlock load`; if every variable shows `✅`, the config is fine.

### `pnpm run dev` only runs `alchemy dev` and appears to hang

Fixed in this repo. The root scripts in `package.json` used to be `vp run -r dev`, which runs the
task named `dev` in _every_ workspace — but only `packages/infra` had one (`alchemy dev`), because
both apps expose `dev:bare` instead. That is why `pnpm run dev` jumped straight into importing the
Alchemy stack for stage `dev_<username>` and never started the web or API servers.

Current scripts:

```jsonc
"dev":        "vp run --parallel --filter web --filter server --fail-if-no-match dev:bare",
"dev:web":    "vp run --filter web --fail-if-no-match dev:bare",
"dev:server": "vp run --filter server --fail-if-no-match dev:bare",
"dev:infra":  "vp run --filter @mongo/infra --fail-if-no-match dev"
```

`--fail-if-no-match` makes a future rename fail loudly instead of silently running the wrong
package. `dev:server` was also broken (`--filter hono`, but the package is named `server`).

### `No packages matched the filter: hono`

The server package is named `server`, not `hono`. Use `pnpm run dev:server`.

### `Value is required but is currently empty` → `DATABASE_URL`

`pnpm run dev` starts both apps, and `apps/server` requires `DATABASE_URL`. Fill it in
`apps/server/.env`, or run just the web app with `pnpm run dev:web` (the quiz needs no database).

---

## 11. Free-tier comparison

| Host                     | Free?                          | Best for | Catch                                               |
| ------------------------ | ------------------------------ | -------- | --------------------------------------------------- |
| **Cloudflare Pages**     | Yes, static requests unlimited | Path A   | 500 builds/month, 20k files                         |
| **GitHub Pages**         | Yes (public repos)             | Path A   | No server runtime; ~100 GB/month soft bandwidth     |
| **Netlify**              | Yes                            | Path A   | Build minutes and bandwidth caps on free            |
| **Render** (web service) | Yes                            | Path B   | Sleeps after 15 min idle; ~1 min cold start         |
| **Prisma Compute**       | **Free during public beta**    | Path C   | Pricing unset once GA; no long-term guarantee       |
| **Prisma Postgres**      | Yes ($0 plan)                  | Path C   | Limited monthly operations, ~500 MB, non-commercial |

Verify current limits before you commit — these were accurate as of **September 2026**.

---

## 12. Post-deploy checklist

- [ ] `curl -I https://<your-url>/` returns `200`
- [ ] `https://<your-url>/quiz` loads **and survives a hard refresh** (deep links work)
- [ ] Start a session, submit an answer, confirm rubric feedback renders
- [ ] Reload the page and confirm progress persists (localStorage keyed per problem)
- [ ] Toggle light/dark and confirm no hydration errors in the console
- [ ] Only if you deployed the API: `CORS_ORIGIN` equals the exact web origin, and `GET /` on the
      API returns `OK`

---

## Appendix — Reference commands

```bash
# Install (repo root)
pnpm install

# Regenerate typed env accessors after editing a .env.schema
pnpm run env:generate

# Dev servers
pnpm run dev              # web + API in parallel
pnpm run dev:web          # web only  (http://localhost:5173)
pnpm run dev:server       # API only  (http://localhost:3000)
pnpm run dev:infra        # Alchemy infrastructure watcher

# Builds
pnpm run build                  # all workspaces
pnpm --filter web build         # web only -> apps/web/build
pnpm --filter server build      # API only -> apps/server/dist

# Quality
pnpm run check-types
pnpm run test
pnpm run check

# Deploy / teardown (Path C)
pnpm run deploy
pnpm run destroy
```
