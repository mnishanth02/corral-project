# Corral — Project Scaffold & Bootstrap Plan

> First-step execution plan: stand up the base project structure and plumbing **before any business
> logic**. Companion to [plan.md](plan.md) (strategy) and [implementation-plan.md](implementation-plan.md)
> (specs + finalized stack §11). When this disagrees with those, they win.

## Context

Corral is a registration→roster→WhatsApp→results→certificates platform for Indian running events
(Coimbatore beachhead). The stack is finalized in [implementation-plan.md §11](implementation-plan.md):
all-TypeScript Turborepo (Vite SPAs + NestJS api/worker), Drizzle/Postgres, BullMQ/Redis, ts-rest,
Better Auth, R2, Razorpay/Meta/MSG91 behind ports.

The repo is **greenfield** — only `docs/` and one commit exist. This plan bootstraps the **base
project structure and plumbing only — no business/domain logic**. Goal: every app builds and runs,
the backend exposes a live health endpoint, the SPAs show a sample test page wired to that endpoint,
the shared packages exist, and the project is deployable to **docker-compose (dev)**, **Railway
(staging, all services)**, and documented for **prod (Cloudflare Pages + DO Bangalore)**.

**Guiding rule:** bootstrap everything with each tool's **official CLI**, not by hand-writing config.
**Biome** replaces ESLint+Prettier.

### Decisions locked
1. **Wired foundations** — apps build+run; `/health` actually pings Postgres+Redis; a shared ts-rest
   `health` contract is consumed by the SPA test page via TanStack Query; Drizzle+drizzle-kit ready
   (no domain tables); `packages/ui` has design tokens + a sample shadcn Button. **No auth, no domain models.**
2. **docker-compose = infra only** (Postgres + Redis); apps run via `pnpm dev` on host (hot reload).
   App Dockerfiles are still written (needed for Railway/prod).
3. **All 4 apps on Railway** for staging (web/console as static services). Prod still moves SPAs to Cloudflare Pages.
4. **GitHub Actions CI now** (Biome CI + `turbo run typecheck test build --affected`).
5. **Runtime packages are compiled** — `@corral/schema`, `@corral/db`, and `@corral/config` emit
  `dist/**` before NestJS apps or Docker images consume them. `@corral/ui` is the only source/JIT package.
6. **Generated TanStack route trees are committed** — `routeTree.gen.ts` is excluded from Biome formatting/linting
  but **not** ignored by Git, so CI and fresh clones do not need a hidden pre-generation step.

### Verified toolchain
Node 24.13.1 · pnpm 10.33.0 · Docker 29.3.1. Pin `packageManager: pnpm@10.33.0`; `.nvmrc` → `22`
(LTS for CI/prod); `engines.node >=22` (local 24 allowed).

### Implementation invariants

These rules are part of the scaffold acceptance criteria and must be followed during implementation:

| Area | Decision |
|---|---|
| Package builds | `@corral/schema`, `@corral/db`, and `@corral/config` use `tsup` or `tsc` to emit ESM/CJS + `.d.ts` into `dist/**`; package `exports` point to `dist`, not `src`. |
| JIT package | `@corral/ui` exports source `.tsx` components and `./styles/globals.css`; apps transpile it through Vite. |
| Turbo graph | Every app declares workspace dependencies it imports; no cross-package relative imports. `^build` must be sufficient for build ordering. |
| Env files | Root `.env.example` documents all variables; each runtime app also gets `apps/<app>/.env.example`. Local root `.env` may be used by `docker-compose.yml`, but app code should load its own env explicitly. |
| Drizzle env | `packages/db/drizzle.config.ts` imports `dotenv/config` so `pnpm --filter @corral/db db:*` works locally. |
| Health routes | `/health` is a ts-rest route. Terminus-style checks are used inside the handler; do not register a second competing Terminus `/health` controller. |
| Frontend API URL | `VITE_API_URL` is build-time for Vite. SPA Dockerfiles must accept `ARG VITE_API_URL` and set it during `pnpm build`. |
| Observability | Scaffold includes structured API/worker logging via pino. Sentry + uptime heartbeat are documented placeholders and are wired in the next phase. |

---

## Target structure

```
corral/                          # existing git repo (docs/ already here)
  package.json                   # root, private, turbo-driven scripts, packageManager pinned
  pnpm-workspace.yaml            # apps/*, packages/*
  turbo.json                     # build/dev/lint/typecheck/test pipeline
  biome.json                     # single root Biome config (lint + format)
  .npmrc .nvmrc .gitignore .env.example README.md
  docker-compose.yml             # postgres:16 + redis:7 (infra only)
  .github/workflows/ci.yml
  .do/app.yaml                   # DO App Platform (BLR1) prod stub for api+worker
  apps/
    web/                         # public participant SPA (Vite/React 19)
      .env.example
    console/                     # organizer+admin+race-day SPA (Vite, dark-capable)
      .env.example
    api/                         # NestJS HTTP API (ts-rest + Terminus health)
      .env.example
    worker/                      # NestJS + BullMQ (sample queue + Terminus health)
      .env.example
  packages/
    schema/                      # @corral/schema — Zod + ts-rest contracts (health contract)
    db/                          # @corral/db — Drizzle client + drizzle-kit + checkDbHealth()
    ui/                          # @corral/ui — design tokens (design-system.md) + shadcn Button
    config/                      # @corral/config — tsconfig bases + Zod env helper
  docs/deploy.md                 # Railway (staging) + CF Pages/DO (prod) runbook
```
Each app also gets a `Dockerfile` (+ `railway.json`); SPAs get `public/_redirects` for SPA routing.

---

## Bootstrap sequence (official CLIs)

**Phase 0 — Root workspace (Turborepo + pnpm).** Add Turborepo to the *existing* repo (don't run
`create-turbo`, which scaffolds Next.js + ESLint we'd delete — the docs+git are already here):
- `pnpm init` → root `package.json` (`private`, name `corral`, pin `packageManager`).
- Write `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- `pnpm add -Dw turbo` → write `turbo.json` (tasks: `build` [`dependsOn: ^build`, outputs `dist/**`,
  `.output/**`], `dev` [`dependsOn:["^build"]`, `cache:false`, `persistent:true`], `lint`, `typecheck`,
  `test`; task-level `env`/`inputs` for `.env*` rather than a broad root-only dependency).
- Root scripts delegate to Turbo for package tasks: `build`, `dev`, `lint`, `typecheck`, `test` use
  `turbo run <task>`. Root-only scripts are allowed for repo tooling: `format` = `biome check --write .`,
  `biome:ci` = `biome ci .`, `db:push` = `pnpm --filter @corral/db db:push`.
- `.npmrc` (`link-workspace-packages=deep`, `auto-install-peers=true`), `.nvmrc`, `.gitignore`
  (node_modules, dist, .turbo, .output, build, coverage, .env, *.local; **do not ignore**
  `routeTree.gen.ts`), root `.env.example`, root `README.md`.

**Workspace dependency map (must be reflected in `package.json` files):**

| Consumer | Workspace dependencies |
|---|---|
| `apps/web` | `@corral/schema`, `@corral/ui` |
| `apps/console` | `@corral/schema`, `@corral/ui` |
| `apps/api` | `@corral/schema`, `@corral/db`, `@corral/config` |
| `apps/worker` | `@corral/db`, `@corral/config` |
| `packages/db` | `@corral/config` |

**Phase 1 — Biome.** `pnpm dlx @biomejs/biome init` → single root `biome.json` (formatter+linter+
assist on; ignore dist/.turbo/build/.output/`*.gen.ts`; `vcs.useIgnoreFile:true`). Each package's
`lint` script runs `biome check .`; root `lint` runs `turbo run lint`; root `biome:ci` runs
`biome ci .` for full-repo CI validation.

**Phase 2 — `packages/config`.** Manual internal package `@corral/config` (compiled runtime package):
- `tsconfig/base.json`, `tsconfig/react.json`, `tsconfig/nestjs.json` (decorators+`emitDecoratorMetadata`).
- `src/env.ts` — Zod env helper (`parseEnv(schema, process.env)`) reused by api/worker.
- `package.json` exports `./env` from `dist/env.*` and `./tsconfig/*` from source JSON files.
- Scripts: `build`, `dev` (`tsup --watch` or `tsc -w`), `typecheck`, `lint`.

**Phase 3 — `packages/schema`.** `@corral/schema` — `@ts-rest/core` + `zod`, built with `tsup`
(dual ESM/CJS+d.ts so both Vite and NestJS consume cleanly):
- `src/contracts/health.ts` — `healthContract`: `GET /health` with `200` healthy and `503` unhealthy
  responses. Body shape: `{ status: "ok" | "degraded" | "error", db: boolean, redis: boolean,
  uptime: number, version: string, timestamp: string }`.
- `src/index.ts` — root contract barrel. Scripts: `build`/`dev`(`tsup --watch`)/`typecheck`.

**Phase 4 — `packages/db`.** `@corral/db` — `drizzle-orm` + `postgres`, dev `drizzle-kit`:
- `drizzle.config.ts` imports `dotenv/config` (postgres dialect, `DATABASE_URL`, out `./drizzle`).
- `src/client.ts` — singleton postgres client + `drizzle(db)`; export `db` + `checkDbHealth()` (`SELECT 1`).
- `src/schema/index.ts` — empty barrel (no domain tables yet).
- Scripts: `build`, `dev` (`tsup --watch` or `tsc -w`), `typecheck`, `lint`, `db:generate`,
  `db:migrate`, `db:push`, `db:studio`.

**Phase 5 — SPA shells (`apps/web`, `apps/console`).** For each:
- `pnpm create vite@latest apps/<name> --template react-ts`.
- `pnpm add tailwindcss @tailwindcss/vite tw-animate-css` (wire `@tailwindcss/vite` in `vite.config.ts`).
- `pnpm add @tanstack/react-router @tanstack/react-query @ts-rest/core` + `-D @tanstack/router-plugin`.
- File-based routing: `src/routes/__root.tsx`, `src/routes/index.tsx`; generate and commit
  `src/routeTree.gen.ts` after route files exist.
- Add `apps/<name>/.env.example` with `VITE_API_URL=http://localhost:3000`.

**Phase 6 — `packages/ui` (after SPA shells exist).** `@corral/ui` — shipped as source (Just-in-Time package; no build):
- Run shadcn CLI in monorepo mode with explicit config/path targeting `packages/ui` (Tailwind v4);
  then add `button`. Verify `packages/ui/components.json` aliases and generated import paths before moving on.
- `src/styles/globals.css` = **design tokens from [design-system.md](design-system.md)** with the
  scaffold font strategy below. Deps: tailwindcss, tw-animate-css, class-variance-authority, clsx,
  tailwind-merge, lucide-react, radix primitives used by installed components.
- Font strategy: use self-hosted packages (`@fontsource-variable/inter` or `@fontsource/inter`, plus
  an Oswald font package) or local `woff2` files. Do **not** ship Google Fonts `@import` in the scaffold.
- `exports` map points to source `.tsx` components, utilities, and `./styles/globals.css`.
- Apps import `@corral/ui/styles/globals.css` once at their root and import components via package exports
  (for example `@corral/ui/components/button`), never by relative paths into `packages/ui/src`.

**Phase 7 — SPA wiring (`apps/web`, `apps/console`).** For each:
- `src/lib/api.ts` — ts-rest `initClient(healthContract, { baseUrl: import.meta.env.VITE_API_URL })`
  wrapped by TanStack Query. If using ts-rest's React Query integration instead, install
  `@ts-rest/react-query` and use it consistently in both SPAs.
- **Sample test page** (`routes/index.tsx`): branded Corral page using design tokens + shadcn `Button`,
  and a **"System status" card** that calls `/health` via TanStack Query and shows API/DB/Redis as
  badges — **icon + label + color** (honors the design-system CVD rule, never color alone).
- `console` additionally demonstrates the navy sidebar token + a `.dark` race-day theme toggle.
- Ports: web `5173`, console `5174`. Each gets a `Dockerfile` (build → serve `dist` via `caddy`/`nginx`
  with SPA fallback), Docker `ARG VITE_API_URL`, and `public/_redirects` (`/* /index.html 200`) for
  Cloudflare Pages.

**Phase 8 — NestJS apps (`apps/api`, `apps/worker`).** For each:
`pnpm dlx @nestjs/cli new apps/<name> --package-manager pnpm --skip-git --skip-install --strict`, then integrate
(remove generated nested `.git`, lockfiles, Jest/ESLint/Prettier configs, rename to `@corral/<name>`,
extend `@corral/config` nestjs tsconfig), install dependencies from the workspace root, and
**swap Jest→Vitest** (stack mandates Vitest; add `vitest.config.ts` + `unplugin-swc`/`@swc/core`
for decorator metadata; replace `jest.fn()` with `vi.fn()` in generated tests).
- **api**: `@nestjs/config` (+ `@corral/config` Zod env), `nestjs-pino` logging, CORS for SPA origins,
  `@nestjs/terminus` health check utilities + `@ts-rest/nest` implementing `healthContract` →
  `GET /health` whose DB check uses `@corral/db.checkDbHealth()` and Redis check pings `ioredis`.
  Return `200` only when DB and Redis are healthy; return `503` when either check fails. Port `3000`.
- **worker**: `@nestjs/bullmq` connected to Redis with a **sample no-op queue+processor** (proves wiring,
  no business job) + ts-rest/Terminus-style `GET /health` (Redis/queue readiness; DB check deferred until
  worker jobs require DB). Port `3100`. Dockerfile notes where Chromium/Puppeteer is added later for PDFs.
- Each app: multi-stage `Dockerfile` using `turbo prune --docker` + `railway.json`
  (`healthcheckPath:/health`).

---

## Deployment

**Dev — `docker-compose.yml` (infra only).** `postgres:16-alpine` (volume `pgdata`, `pg_isready`
healthcheck, :5432) + `redis:7-alpine` (appendonly, `redis-cli ping`, :6379), all `.env`-driven.
Flow: copy `.env.example` to `.env` for local infra values → `docker compose up -d` → `pnpm db:push`
→ `pnpm dev`. Runtime app env examples live beside each app; local implementations may load app env files
with `@nestjs/config`/Vite conventions.

**Staging — Railway (all services separate).** Per-app `Dockerfile` + `railway.json` (builder=DOCKERFILE,
healthcheck, restart policy). Provision Railway **managed Postgres + Redis**; reference their vars as
`DATABASE_URL`/`REDIS_URL` into api+worker. web/console deploy as **static services** (caddy/nginx);
their `VITE_API_URL` is a **build-time** Railway variable pointing at the api service URL and must be
passed as a Docker build arg. Steps (create project, add DBs, 4 services with root dirs + env refs,
set build args, `railway up`) documented in `docs/deploy.md`.

**Prod (config stubs + docs, not deployed now).** SPAs → **Cloudflare Pages** (build `pnpm --filter
<app> build`, output `apps/<app>/dist`, `_redirects` for SPA routing). api+worker → **DO App Platform
BLR1** via `.do/app.yaml` stub (two Dockerfile services, health checks, managed DB/Redis attach, BLR1
region, envs). Postgres/Redis = DO managed Bangalore; storage = R2. Filled in when prod deploy happens.

**Dockerfile requirements (all apps).** Use Node `22` images for build stages, enable Corepack, install
pnpm `10.33.0`, run `turbo prune --docker --filter=<package>`, install from the pruned lockfile, build
required workspace packages via `turbo run build --filter=<package>...`, and copy only runtime artifacts
into the final image. API/worker images expose `3000`/`3100`; SPA images serve `dist` with SPA fallback.

---

## CI — `.github/workflows/ci.yml`
On PR + push to main: checkout (`fetch-depth: 0` for `--affected`), `pnpm/action-setup`, `setup-node`
(reads `.nvmrc`), `pnpm install --frozen-lockfile`, then `pnpm biome ci .` and
`pnpm turbo run typecheck test build --affected`. CI must use `turbo run`, not the shorthand `turbo`.
Because route trees are committed, CI does not require a separate route-generation step. (Playwright e2e
kept out of CI initially to keep it fast/reliable; runnable locally via `pnpm e2e`.)

## Testing
- **Vitest unit** everywhere. NestJS is configured for Vitest via swc/decorator metadata; generated Jest
  tests/config are removed. API tests mock DB/Redis checks for success/failure cases. SPA tests use
  `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`.
- **Supertest** for API `/health`: assert `200` with `{ status:"ok", db:true, redis:true }`; assert `503`
  when DB or Redis check fails.
- **SPA Testing-Library smoke** for each test page: mock the ts-rest/api client, render the route, and
  assert the System status card includes icon/label/status text for API/DB/Redis.
- **Playwright**: minimal `playwright.config.ts` + 1 smoke test loading the web test page and asserting
  the status card renders. For scaffold reliability, mock `/health` in the browser test unless the test
  explicitly starts docker-compose + api + web through Playwright `webServer`.

---

## Verification (end-to-end)
1. `pnpm install` succeeds; `pnpm lint` (Biome) and `pnpm typecheck` clean.
2. `docker compose up -d` → Postgres + Redis healthy; `pnpm db:push` connects.
3. `pnpm dev` starts all 4 apps (web :5173, console :5174, api :3000, worker :3100).
4. `curl localhost:3000/health` → HTTP `200` with `{ status:"ok", db:true, redis:true, ... }`;
   stopping Postgres or Redis makes API `/health` return HTTP `503` with the failed check set to `false`.
   `curl localhost:3100/health` → HTTP `200` when Redis/queue readiness is healthy.
5. Open :5173 and :5174 → branded test page renders with design tokens; **System status card shows
   API/DB/Redis healthy live** (ts-rest + TanStack Query against the api).
6. `pnpm build` builds all compiled packages and apps; no app imports another package via relative paths.
7. `pnpm test` (Vitest+Supertest) passes; `pnpm e2e` Playwright smoke passes locally.
8. API/worker Docker images build from pruned monorepo context; SPA Docker images build with a supplied
   `VITE_API_URL` build arg and serve their `dist` output with SPA fallback.
9. Open a PR → CI green.

## Notes / flags
- **Nest + Vitest** needs swc for decorator metadata — included; this is the one non-default setup.
- **Vite env is build-time** — `VITE_API_URL` must be set at build on Railway/CF Pages (documented).
- **Route tree generated file is committed** — Biome ignores `*.gen.ts`, but Git does not ignore
  `src/routeTree.gen.ts`.
- **Observability is staged** — pino logging is included now; Sentry + uptime heartbeat are next-phase
  instrumentation, matching [implementation-plan.md §11](implementation-plan.md#11-architecture--tech-stack).
- **No business logic** in this phase: no Better Auth, no domain tables, no Razorpay/Meta/MSG91/R2
  adapters, no PDF/Chromium. `.env.example` includes commented placeholders for those (added later).
- Better Auth, ports/adapters, and domain schema are explicitly the **next** step after this scaffold lands.
