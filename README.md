# Corral

Registration → roster → WhatsApp → results → certificates platform for Indian running events
(Coimbatore beachhead). This repository is an **all-TypeScript Turborepo** monorepo.

> This is the **scaffold/bootstrap** stage — base structure and plumbing only, **no business
> logic**. See [`docs/bootstrap-plan.md`](docs/bootstrap-plan.md).

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
