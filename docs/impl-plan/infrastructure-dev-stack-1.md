---
goal: Local Dev Stack Launcher With Dynamic Ports
version: 1.0
date_created: 2026-06-11
last_updated: 2026-06-11
owner: Corral Engineering
tags: [infrastructure, developer-experience, docker-compose, local-dev]
---

# Introduction

This plan defines a local development stack launcher for Corral. The launcher starts Docker Compose infrastructure, runs database preparation, starts all backend and frontend applications, chooses replacement ports when preferred ports are busy, and prints the final local URLs plus bootstrap login details.

## 1. Requirements & Constraints

- **REQ-001**: Provide one terminal command that starts local Postgres and Redis via Docker Compose.
- **REQ-002**: Start all backend runtime applications: `apps/api` and `apps/worker`.
- **REQ-003**: Start all frontend runtime applications: `apps/web` and `apps/console`.
- **REQ-004**: Detect busy preferred ports and choose the next available port for each service.
- **REQ-005**: Print final URLs for API, worker, web, console, Postgres, and Redis.
- **REQ-006**: Print admin login email and password when `AUTH_BOOTSTRAP_ADMIN_EMAIL` and `AUTH_BOOTSTRAP_ADMIN_PASSWORD` are configured.
- **REQ-007**: Run committed database migrations before starting long-running app processes unless explicitly skipped.
- **REQ-008**: Seed the bootstrap admin user when credentials are configured unless explicitly skipped.
- **CON-001**: Preserve the current dev architecture where `docker-compose.yml` runs infrastructure only and apps run on the host for hot reload.
- **CON-002**: Avoid adding third-party process manager dependencies; use Node.js built-in modules and existing `pnpm` workspace scripts.
- **CON-003**: Support the Windows Git Bash terminal used in this workspace while remaining usable from any shell through `pnpm dev:stack`.
- **PAT-001**: Keep root `package.json` scripts as delegations only; implementation logic must live under `scripts/`.
- **PAT-002**: Use environment variables to configure `API_PORT`, `WORKER_PORT`, `VITE_API_URL`, `CORS_ORIGINS`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` at process start.
- **SEC-001**: Do not generate real production secrets; local `.env` values may use existing placeholder development values only.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Document the launcher behavior before implementation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Inspect `docker-compose.yml`, root `package.json`, `turbo.json`, and all app `package.json` scripts to identify current startup behavior. | ✅ | 2026-06-11 |
| TASK-002 | Inspect `apps/api/src/env.ts`, `apps/api/src/main.ts`, `apps/worker/src/env.ts`, `apps/worker/src/main.ts`, and Vite configs to identify configurable ports and required environment variables. | ✅ | 2026-06-11 |
| TASK-003 | Create this plan file at `docs/impl-plan/infrastructure-dev-stack-1.md`. | ✅ | 2026-06-11 |

### Implementation Phase 2

- GOAL-002: Implement the dev stack launcher.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | Update `docker-compose.yml` so Postgres and Redis host ports use `${POSTGRES_PORT:-5432}` and `${REDIS_PORT:-6379}` while preserving container ports. | ✅ | 2026-06-11 |
| TASK-005 | Add `scripts/dev-stack.mjs` using Node.js built-in modules to load `.env`, create `.env` from `.env.example` when missing, find available ports, start Docker Compose, run `pnpm db:migrate`, optionally run `pnpm --filter @corral/api auth:seed-admin`, spawn API, worker, web, and console, and print final URLs and credentials. | ✅ | 2026-06-11 |
| TASK-006 | Add `scripts/dev-stack.sh` as a Bash convenience wrapper that executes `node scripts/dev-stack.mjs`. | ✅ | 2026-06-11 |
| TASK-007 | Update root `package.json` with `dev:stack` as a delegation to `node scripts/dev-stack.mjs`. | ✅ | 2026-06-11 |

### Implementation Phase 3

- GOAL-003: Update local developer documentation and validate behavior.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Update `.env.example` with `POSTGRES_PORT`, `REDIS_PORT`, `WEB_PORT`, and `CONSOLE_PORT` defaults used by the launcher. | ✅ | 2026-06-11 |
| TASK-009 | Update `README.md` quick start and script table to document `pnpm dev:stack` and dynamic-port behavior. | ✅ | 2026-06-11 |
| TASK-010 | Validate JavaScript syntax with `node --check scripts/dev-stack.mjs`. | ✅ | 2026-06-11 |
| TASK-011 | Validate formatting/lint compatibility for edited files with the project tooling where practical. | ✅ | 2026-06-11 |

## 3. Alternatives

- **ALT-001**: Run all applications inside Docker Compose. This was not chosen because current repository docs explicitly state Docker Compose is development infrastructure only and host-run apps provide hot reload.
- **ALT-002**: Use `pnpm dev` with Turborepo only. This was not chosen because Turbo does not dynamically coordinate ports across services or print consolidated runtime details.
- **ALT-003**: Add a dependency such as `concurrently` or `wait-on`. This was not chosen because Node.js built-in modules are sufficient for process management and port probing.

## 4. Dependencies

- **DEP-001**: Docker Compose CLI available as `docker compose`.
- **DEP-002**: Node.js `>=22` as required by root `package.json`.
- **DEP-003**: pnpm `11.5.1` as declared in root `package.json`.
- **DEP-004**: Existing app scripts: `@corral/api dev`, `@corral/worker dev`, and Vite executable availability in frontend workspaces.

## 5. Files

- **FILE-001**: `docs/impl-plan/infrastructure-dev-stack-1.md` records this implementation plan.
- **FILE-002**: `docker-compose.yml` receives variable host port mappings for Postgres and Redis.
- **FILE-003**: `scripts/dev-stack.mjs` contains the cross-platform launcher implementation.
- **FILE-004**: `scripts/dev-stack.sh` provides Bash convenience execution.
- **FILE-005**: `package.json` exposes `pnpm dev:stack`.
- **FILE-006**: `.env.example` documents launcher port variables.
- **FILE-007**: `.env` is created from `.env.example` when missing for local development only.
- **FILE-008**: `README.md` documents usage.

## 6. Testing

- **TEST-001**: Run `node --check scripts/dev-stack.mjs` and require exit code `0`.
- **TEST-002**: Run the launcher with `--help` and require command usage output with exit code `0`.
- **TEST-003**: Run project lint or formatting checks for edited files where practical.
- **TEST-004**: Manually verify the launcher prints selected ports, final URLs, and admin credentials from `.env` when configured.

## 7. Risks & Assumptions

- **RISK-001**: Docker Compose port changes may recreate existing local containers if preferred infra ports change.
- **RISK-002**: The launcher cannot safely print credentials if the user removes `AUTH_BOOTSTRAP_ADMIN_EMAIL` or `AUTH_BOOTSTRAP_ADMIN_PASSWORD` from `.env`.
- **RISK-003**: If Docker is not running, the launcher exits before app startup.
- **ASSUMPTION-001**: Dynamic port shifting is required for local development ports only and does not change production/staging deployment ports.
- **ASSUMPTION-002**: The local `.env` file is ignored by Git and is safe to create from `.env.example` with placeholder development values.

## 8. Related Specifications / Further Reading

- [`README.md`](../../README.md)
- [`docs/deploy.md`](../deploy.md)
- [`docker-compose.yml`](../../docker-compose.yml)
- [`apps/api/src/env.ts`](../../apps/api/src/env.ts)
- [`apps/worker/src/env.ts`](../../apps/worker/src/env.ts)
