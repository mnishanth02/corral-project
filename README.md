# Corral

Registration → roster → WhatsApp → results → certificates platform for Indian running events
(Coimbatore beachhead). This repository is an **all-TypeScript Turborepo** monorepo.

> Current build/progress source of truth: [`docs/product-progress.md`](docs/product-progress.md).
> Scaffold decisions live in [`docs/bootstrap-plan.md`](docs/bootstrap-plan.md); product strategy and
> MVP specs live in [`docs/plan.md`](docs/plan.md) and
> [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Vite + React 19, TanStack Router + Query, Tailwind CSS v4, shadcn/ui
- **Backend:** NestJS (HTTP api + BullMQ worker), ts-rest contracts
- **Data:** Drizzle ORM + Postgres, Redis (BullMQ)
- **Contracts:** ts-rest + Zod (`@corral/schema`)
- **Tooling:** Biome (lint + format), Vitest, Playwright

## Workspace layout

```
apps/
  web/       Public participant SPA            (:5173)
  console/   Organizer/admin/race-day SPA      (:5174)
  api/       NestJS HTTP API (/health)         (:3000)
  worker/    NestJS + BullMQ                    (:3100)
packages/
  schema/    @corral/schema — ts-rest + Zod contracts
  db/        @corral/db     — Drizzle client + checkDbHealth()
  ui/        @corral/ui     — design tokens + shadcn components (JIT source)
  config/    @corral/config — tsconfig bases + Zod env helper
```

## Prerequisites

- Node `>=22` (verified on 24.13.1) — `.nvmrc` pins `22`
- pnpm `11.5.1` (`corepack enable`)
- Docker (for local Postgres + Redis)

## Quick start

```bash
pnpm install
cp .env.example .env          # local infra values
docker compose up -d          # postgres:16 + redis:7
pnpm db:migrate               # apply committed Drizzle migrations
pnpm dev                      # all 4 apps with hot reload
```

Then:

- API health: `curl localhost:3000/health` → `{ "status": "ok", "db": true, "redis": true, ... }`
- Worker health: `curl localhost:3100/health`
- Web: http://localhost:5173 · Console: http://localhost:5174 (System status card shows live health)

## Logging in (local)

There is **no public sign-up** — it is intentionally disabled in
[`apps/api/src/auth/auth.ts`](apps/api/src/auth/auth.ts) (`disableSignUp: true` for both
email/password and Google). Accounts are created by admins.

First-time setup creates the bootstrap admin from your `.env`:

```bash
# Requires docker compose up -d + pnpm db:migrate to have run first.
pnpm --filter @corral/api auth:seed-admin
```

This reads `AUTH_BOOTSTRAP_ADMIN_EMAIL`, `AUTH_BOOTSTRAP_ADMIN_PASSWORD`, and
`AUTH_BOOTSTRAP_ADMIN_NAME` from the root `.env`. The script is idempotent — if the user already
exists it leaves the password and role unchanged.

Then sign in at the console login page (http://localhost:5174/login, or :5274 if that is your
console port) with the email/password from `.env`, or via Google for an already-provisioned account.
Once signed in as admin you can create additional users from the admin users screen.

Quick validation that credentials work, without the UI:

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin-email>","password":"<admin-password>"}' -w "\nHTTP %{http_code}\n"
# Expect HTTP 200 with a JSON body containing "role":"admin".
```

> Note: `auth:seed-admin` must load the root `.env` before `@corral/db` initializes its connection.
> This is guaranteed by the side-effect `import "../env"` kept first in
> [`apps/api/src/auth/seed-admin.ts`](apps/api/src/auth/seed-admin.ts) (Biome does not reorder
> side-effect imports). Without it the script fails with `DATABASE_URL is required`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps (turbo, hot reload) |
| `pnpm build` | Build all packages + apps |
| `pnpm lint` | Biome lint via turbo |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm test` | Vitest across workspaces |
| `pnpm format` | `biome check --write .` |
| `pnpm biome:ci` | `biome ci .` (CI mode) |
| `pnpm db:generate` | Generate SQL migrations from `packages/db/src/schema` changes |
| `pnpm db:migrate` | Apply committed Drizzle migrations to `DATABASE_URL` |
| `pnpm db:reset:local` | Drop local auth tables + Drizzle metadata, then rerun migrations |
| `pnpm db:push` | Prototype-only direct schema sync; do not mix with migrations for shared DBs |
| `pnpm db:studio` | Open Drizzle Studio |

## Database workflow

Use the versioned migration flow for normal development and deployments:

1. Edit schema under `packages/db/src/schema`.
2. Run `pnpm db:generate` and inspect the generated SQL under `packages/db/drizzle`.
3. Run `pnpm db:migrate` locally, then deploy/apply the same migrations in staging/prod.

`pnpm db:push` directly mutates the target database and does not create migration history. Keep it for
throwaway local prototyping only. If a local database was pushed and then `db:migrate` fails because
tables already exist, run `pnpm db:reset:local` to reset the empty local auth schema and replay the
committed migrations.

## Deployment

See [`docs/deploy.md`](docs/deploy.md) — docker-compose (dev), Railway (staging),
Cloudflare Pages + DO Bangalore (prod).
