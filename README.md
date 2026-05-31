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
- pnpm `10.33.0` (`corepack enable`)
- Docker (for local Postgres + Redis)

## Quick start

```bash
pnpm install
cp .env.example .env          # local infra values
docker compose up -d          # postgres:16 + redis:7
pnpm db:push                  # push (empty) Drizzle schema
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
| `pnpm db:push` / `db:generate` / `db:migrate` / `db:studio` | Drizzle Kit |

## Deployment

See [`docs/deploy.md`](docs/deploy.md) — docker-compose (dev), Railway (staging),
Cloudflare Pages + DO Bangalore (prod).
