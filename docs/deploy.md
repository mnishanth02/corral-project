# Corral — Deployment Runbook

Three environments: **dev** (docker-compose, infra only), **staging** (Railway, all 4 services),
and **prod** (Cloudflare Pages for SPAs + DigitalOcean App Platform BLR1 for api/worker). Prod is
documented as config stubs and is **not deployed during the scaffold phase**.

| Service | Port | Dev | Staging | Prod |
|---|---|---|---|---|
| `web` (SPA) | 5173 | `pnpm dev` | Railway static (nginx) | Cloudflare Pages |
| `console` (SPA) | 5174 | `pnpm dev` | Railway static (nginx) | Cloudflare Pages |
| `api` (NestJS) | 3000 | `pnpm dev` | Railway (Dockerfile) | DO App Platform BLR1 |
| `worker` (NestJS) | 3100 | `pnpm dev` | Railway (Dockerfile) | DO App Platform BLR1 |
| Postgres | 5432 | docker-compose | Railway managed PG | DO Managed PG (Bangalore) |
| Redis | 6379 | docker-compose | Railway managed Redis | DO Managed Redis (Bangalore) |

> **`VITE_API_URL` is build-time.** SPAs bake the API URL in at build. On Railway/CF Pages it must be
> set as a **build variable / Docker build arg** pointing at the api service URL — changing it requires
> a rebuild, not just a restart.

---

## Dev — docker-compose (infra only)

`docker-compose.yml` runs only **Postgres 16** + **Redis 7**. The apps run on the host with hot reload.

```bash
cp .env.example .env          # local infra + app values
docker compose up -d          # postgres:16-alpine + redis:7-alpine (with healthchecks)
pnpm install
pnpm db:migrate               # apply committed Drizzle migrations and verify the DB connection
pnpm dev                      # turbo runs all 4 apps
```

Verify:

```bash
curl localhost:3000/health    # -> 200 { "status":"ok", "db":true, "redis":true, ... }
curl localhost:3100/health    # -> 200 when Redis/queue ready
# Stop Postgres or Redis -> api /health returns 503 with the failed check = false.
```

Open http://localhost:5173 (web) and http://localhost:5174 (console) — the **System status** card
shows API/DB/Redis live.

---

## Staging — Railway (all 4 services)

Each app ships a `Dockerfile` + `railway.json` (`builder: DOCKERFILE`, `healthcheckPath`, restart
policy). The Dockerfiles use `turbo prune --docker` so each image builds from a minimal pruned context.

### 1. Project + managed data stores

```bash
railway login
railway init                  # create the Corral project
```

In the Railway dashboard, add **Postgres** and **Redis** plugins. They expose `DATABASE_URL` and
`REDIS_URL` reference variables.

### 2. Create the 4 services

For each service set the **root directory** to the repo root (the Dockerfiles prune internally) and the
Dockerfile path:

| Service | Dockerfile | Type | Key env |
|---|---|---|---|
| `api` | `apps/api/Dockerfile` | web | `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `REDIS_URL=${{Redis.REDIS_URL}}`, `API_PORT=3000`, `CORS_ORIGINS=<web+console URLs>`, `BETTER_AUTH_SECRET=<32+ char secret>`, `BETTER_AUTH_URL=<api public URL>`, `BETTER_AUTH_TRUSTED_ORIGINS=<console URL>`, `GOOGLE_CLIENT_ID=<google web client id>`, `GOOGLE_CLIENT_SECRET=<google web client secret>`, `NODE_ENV=production` |
| `worker` | `apps/worker/Dockerfile` | worker | `REDIS_URL=${{Redis.REDIS_URL}}`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `WORKER_PORT=3100`, `NODE_ENV=production` |
| `web` | `apps/web/Dockerfile` | static (nginx) | **build arg** `VITE_API_URL=<api public URL>` |
| `console` | `apps/console/Dockerfile` | static (nginx) | **build arg** `VITE_API_URL=<api public URL>` |

For `web`/`console`, set `VITE_API_URL` as a **build-time** variable and ensure it is passed as a
Docker `--build-arg` (the SPA Dockerfiles declare `ARG VITE_API_URL`).

For Google OAuth, configure the Google Cloud OAuth client as a **Web application** and add this
authorized redirect URI:

```text
<BETTER_AUTH_URL>/api/auth/callback/google
```

For local development this is `http://localhost:3000/api/auth/callback/google`. For staging/prod,
replace `<BETTER_AUTH_URL>` with the public API origin. If the console and API are on subdomains of
the same parent domain and must share cookies, set `BETTER_AUTH_COOKIE_DOMAIN` to that parent domain
for the API, for example `.corral.app`. Do not set it for localhost.

After the API is deployed and migrations are applied, create the first admin user with a one-off run
of `pnpm --filter @corral/api auth:seed-admin` using temporary `AUTH_BOOTSTRAP_ADMIN_EMAIL`,
`AUTH_BOOTSTRAP_ADMIN_PASSWORD`, and `AUTH_BOOTSTRAP_ADMIN_NAME` variables. Remove or rotate the
bootstrap password after use.

### 3. Deploy

```bash
railway up                    # or rely on deploy-on-push from GitHub
```

Railway uses each service's `railway.json` healthcheck (`/health` for api/worker). Run DB migrations
once against the managed Postgres before serving traffic (e.g. a one-off `railway run pnpm db:migrate`).

---

## Prod — Cloudflare Pages (SPAs) + DO App Platform BLR1 (api/worker)

> Stubs only for now. Postgres/Redis = **DO managed (Bangalore)**; object storage = **Cloudflare R2**.

### SPAs → Cloudflare Pages

One Pages project per SPA:

| Setting | `web` | `console` |
|---|---|---|
| Build command | `pnpm install && pnpm --filter @corral/web build` | `pnpm install && pnpm --filter @corral/console build` |
| Build output dir | `apps/web/dist` | `apps/console/dist` |
| Env var (build) | `VITE_API_URL=https://api.corral.app` | `VITE_API_URL=https://api.corral.app` |

`public/_redirects` (`/* /index.html 200`) is included in each SPA for client-side routing fallback.

### api + worker → DO App Platform (`.do/app.yaml`)

`.do/app.yaml` defines two Dockerfile services (`api` 3000, `worker` 3100) with `/health` checks, region
`blr1`, and managed PG 16 + Redis 7 attached via `${corral-pg.DATABASE_URL}` / `${corral-redis.REDIS_URL}`.

```bash
doctl apps create --spec .do/app.yaml          # first deploy
doctl apps update <app-id> --spec .do/app.yaml # subsequent updates
```

Fill in the GitHub repo slug, custom domains, and secrets (R2, Razorpay/Meta/MSG91 — added in the next
phase) before the first real prod deploy.

Add the same API auth variables used in staging for prod: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`BETTER_AUTH_TRUSTED_ORIGINS`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. The Google OAuth
authorized redirect URI must match the prod API origin exactly:
`https://api.corral.app/api/auth/callback/google`.

---

## Dockerfile conventions (all apps)

- Node **22** build images; enable Corepack; install pnpm **10.33.0**.
- `turbo prune --docker --filter=<package>` to produce a minimal build context.
- Install from the pruned lockfile, then `turbo run build --filter=<package>...`.
- Copy only runtime artifacts into the final image.
- api/worker expose `3000`/`3100` and run `node dist/main`.
- SPA images build with `ARG VITE_API_URL` and serve `dist` via nginx with SPA fallback to `/index.html`.

## Observability (next phase)

pino structured logging is wired now. Sentry + an uptime heartbeat are documented placeholders
(`.env.example`) and are instrumented in the next phase.

---
Running local URLs
Web app: http://localhost:5173
Console app: http://localhost:5174
API health: http://localhost:3000/health
Worker health: http://localhost:3100/health
