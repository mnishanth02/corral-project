---
goal: Implement Better Auth Foundation for Corral
version: 1.0
date_created: 2026-06-01
last_updated: 2026-06-07
owner: Corral Engineering
tags: feature, auth, better-auth, nestjs, drizzle, react, console, security
---

# Introduction

This implementation plan defines the first production-shaped authentication foundation for Corral using Better Auth. The API will own Better Auth routes under `/api/auth/*`, Postgres/Drizzle will store Better Auth tables, the console SPA will support login/session/route protection and minimal admin-created user management, and the public web app will remain unauthenticated in this slice.

This plan is based on research completed on 2026-06-01 against current Better Auth documentation, the current Better Auth GitHub repository, the current `@thallesp/nestjs-better-auth` README, current TanStack Router documentation, and the existing Corral repo structure.

## Validation closure update — 2026-06-05

### Closed in this validation pass

- MVP-01 acceptance in this pass is scoped to backend auth foundation. Per the 2026-06-03
  frontend-mock direction, live console auth-client verification is not part of this closure pass.
- Local infra + data path validated: `docker compose up -d postgres redis`, `pnpm db:migrate`,
  `pnpm --filter @corral/api auth:seed-admin`.
- `auth:seed-admin` failure is resolved; command is now idempotent (existing admin email path verified).
- Live API checks passed:
  - `GET /health` returns `200` anonymous.
  - `GET /api/auth/get-session` returns `200` with unauthenticated `null`.
  - `POST /api/auth/sign-up/email` returns `400` with `EMAIL_PASSWORD_SIGN_UP_DISABLED`.
- Automated checks passed:
  - `pnpm --filter @corral/api test` (includes `auth.spec.ts`, env, and health tests) ✅
  - `pnpm biome:ci` ✅
  - `pnpm typecheck` ✅
  - `pnpm build` ✅

### Explicitly open or deferred after closure

- Console routes are currently in frontend mock mode by design (see `docs/product-progress.md` direction
  change). The login/dashboard/admin users flows do not currently call live Better Auth APIs.
- Console auth verification tasks that require real `authClient` calls and route-guard tests remain
  deferred until the app exits mock-only mode:
  - TASK-060, TASK-064, TASK-067, TASK-069, TASK-070, TASK-079.
- OAuth manual checks requiring real interactive Google sign-in remain open:
  - TASK-081, TASK-082, TASK-083, TASK-084.
- Workspace `pnpm test` is not a reliable global gate yet because `apps/web` and `apps/console` have
  no test files and exit with code `1`; API auth tests do pass.

### Task disposition snapshot (closure pass)

- Done in this pass or already validated as implemented: TASK-001..TASK-059, TASK-061..TASK-063,
  TASK-065, TASK-066, TASK-068, TASK-071, TASK-072, TASK-073..TASK-075, TASK-085, TASK-086,
  TASK-088.
- Deferred/open: TASK-060, TASK-064, TASK-067, TASK-069, TASK-070, TASK-079, TASK-081..TASK-084,
  TASK-087.

## Console integration update — 2026-06-07

### Closed in this integration pass

- Console login now calls live Better Auth email/password and Google sign-in APIs with credentialed
  fetch behavior; login-time mock persona selection and persona localStorage writes were removed.
- Console protected routes now require a Better Auth session and fetch Corral console context from
  `/console/me` before rendering organizer screens.
- Internal admin routes now require the Better Auth Admin role instead of mock admin personas.
- `/admin/users` now uses Better Auth Admin client methods for user list/create and Corral admin
  membership APIs for organizer assignment.
- Corral-owned `organizer`, `organizer_member`, and `event` tables were added for real organizer
  membership/RBAC, with deterministic local seed IDs aligned to current console fixture event IDs.
- Better Auth Organization plugin remains intentionally unused. Corral owns organizer membership,
  roles, capabilities, and event ownership; Better Auth owns identity, sessions, OAuth, and platform
  admin identity.

### Still open after this pass

- Public participant app auth remains out of scope and unauthenticated.
- Business data screens still render typed mock fixtures until their domain APIs are implemented.
- Event category/registration/payment/roster domains remain future MVP slices.
- Interactive Google OAuth still needs environment-specific manual validation with real Google Cloud
  redirect URIs and credentials.
- Console route/component tests are still not present; API service tests cover the new console context
  and RBAC mapping behavior.

## Organizer self-signup update — 2026-06-07

### Closed in this signup/onboarding pass

- Better Auth email/password signup is enabled for organizer owners with required email verification,
  `autoSignIn: false`, stronger password length, and public Google signup still disabled.
- Verification and reset delivery now goes through an auth email abstraction. Local development can log
  links, but signup with log-only email is rejected outside development/test.
- `organizer` now stores review/profile fields: review status, entity type, billing address, finance
  contact, creator/reviewer metadata, and review reason.
- Corral ts-rest contracts now include onboarding status/create endpoints and platform-admin organizer
  review endpoints.
- `POST /console/onboarding/organizer` requires an authenticated verified user, trusted browser Origin,
  no existing organizer membership, and creates organizer + owner membership in one transaction.
- Console UI now includes `/signup`, `/check-email`, live organizer onboarding, verified zero-membership
  redirect to onboarding, and a live `/admin/organizers` review queue.

### Still open after this pass

- Public Google organizer signup remains intentionally deferred until account-linking trust rules are
  revisited.
- Event draft creation/publishing is the next organizer/event domain slice. Pending organizers cannot
  create real events yet because event CRUD is out of this auth slice.
- A production email provider still needs to be selected and wired behind the email abstraction before
  staging/production self-signup is enabled.
- Server-side publish/payment gates must be enforced when those event/payment mutations are implemented.

## 1. Requirements & Constraints

- **REQ-001**: The authentication provider MUST be Better Auth.
- **REQ-002**: The API MUST expose Better Auth routes at `/api/auth/*`.
- **REQ-003**: The initial auth methods MUST be email/password and Google OAuth.
- **REQ-004**: Organizer owner email/password sign-up MAY be enabled only with required email
  verification and Corral-owned organizer onboarding/review. Public Google signup remains disabled in
  this slice.
- **REQ-005**: Better Auth Admin plugin MUST be included in this slice.
- **REQ-006**: Better Auth Organization plugin MUST NOT be included in this slice.
- **REQ-007**: The default Better Auth roles `admin` and `user` MUST be used. A custom `organizer` role MUST NOT be added in this slice.
- **REQ-008**: The public `apps/web` application MUST remain public and unauthenticated in this slice.
- **REQ-009**: The `apps/console` application MUST require authentication for the existing dashboard route `/`.
- **REQ-010**: The console MUST provide a public login route at `/login`.
- **REQ-011**: The console MUST provide a public organizer owner sign-up route for email/password only.
- **REQ-012**: A seed script MUST exist to create the first admin user without exposing admin bootstrap over HTTP.
- **REQ-013**: Password reset and email verification delivery MUST use the auth email abstraction;
  log-only delivery is local/test only.
- **REQ-014**: Corral product APIs MUST continue to use ts-rest contracts, but Better Auth routes MUST NOT be wrapped in ts-rest.

- **SEC-001**: `BETTER_AUTH_SECRET` MUST be validated as at least 32 characters.
- **SEC-002**: Production and staging MUST NOT rely on Better Auth fallback secrets.
- **SEC-003**: `BETTER_AUTH_URL` MUST be explicit to avoid OAuth callback URL ambiguity.
- **SEC-004**: Google OAuth MUST NOT create unknown users.
- **SEC-005**: Google OAuth MUST only authenticate/link admin-created users when account linking rules allow the existing account to be linked.
- **SEC-006**: Sessions MUST be stored in Postgres in this slice.
- **SEC-007**: Better Auth cookie cache MUST NOT be enabled in this slice so admin session revocation remains immediate.
- **SEC-008**: API CORS MUST allow credentials only for configured trusted origins.
- **SEC-009**: `/health` MUST remain anonymous for uptime and deployment checks.
- **SEC-010**: User-management endpoints MUST remain protected by Better Auth Admin plugin server-side authorization.
- **SEC-011**: Admin bootstrap MUST NOT be implemented as a public HTTP endpoint.
- **SEC-012**: Raw body support MUST be enabled in the NestJS body parser configuration for future webhook signature verification.

- **CON-001**: The repository uses pnpm workspaces and Turborepo; task implementation logic MUST remain in package-level scripts.
- **CON-002**: Root scripts SHOULD only delegate to package scripts or `turbo run`.
- **CON-003**: `packages/db` currently owns the Drizzle client and schema barrel.
- **CON-004**: `packages/db/drizzle.config.ts` currently reads schema from `packages/db/src/schema/index.ts`.
- **CON-005**: `apps/api` is a NestJS 11 application using Express platform.
- **CON-006**: `apps/api/src/main.ts` currently enables Nest body parsing by default; this MUST change because the Better Auth NestJS integration requires Nest body parser to be disabled.
- **CON-007**: `apps/console` is a Vite React SPA using TanStack Router file-based routing and TanStack Query.
- **CON-008**: `packages/ui` currently exports only `Button`, `StatusBadge`, styles, and utilities; required auth form components MUST be added and exported before use.
- **CON-009**: Better Auth CLI may fail to resolve workspace aliases; if it does, a temporary generation config with relative imports MUST be used as documented by Better Auth CLI common issues.
- **CON-010**: Better Auth `migrate` MUST NOT be used for Drizzle schema application; Drizzle migrations MUST be generated and applied with Drizzle Kit.

- **GUD-001**: Prefer the dedicated `@better-auth/drizzle-adapter` package/import for the Drizzle adapter.
- **GUD-002**: Use Better Auth’s React client in `apps/console`; do not add auth methods to the ts-rest API client.
- **GUD-003**: Use a TanStack Router pathless layout route for console route protection.
- **GUD-004**: Use `beforeLoad` for route-level auth redirects in the console.
- **GUD-005**: Use `@AllowAnonymous()` from `@thallesp/nestjs-better-auth` for public API routes.
- **GUD-006**: Keep email hooks behind a provider abstraction. Log-only delivery is allowed only in
  local development/test; staging/production must use a real sender before signup is enabled.
- **GUD-007**: Do not use the Better Auth Organization plugin for organizer membership. Corral owns
  organizer, membership, role, capability, and event ownership tables linked to Better Auth users.

- **PAT-001**: Follow existing `apps/api/src/env.ts` pattern using `parseEnv` and `z` from `@corral/config/env`.
- **PAT-002**: Follow existing Drizzle schema barrel pattern in `packages/db/src/schema/index.ts`.
- **PAT-003**: Follow existing frontend route/component separation where route files import colocated excluded files prefixed with `-`.
- **PAT-004**: Follow existing Vitest patterns in `apps/api/src/health/health.controller.spec.ts` and `apps/console/src/routes/-index.test.tsx`.
- **PAT-005**: Follow shadcn component rules from the local shadcn skill: use existing components, semantic tokens, `gap-*`, and component exports.

## 2. Implementation Steps

### Implementation Phase 1 — Dependencies and Environment

- **GOAL-001**: Install required auth dependencies and define the environment contract.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add `better-auth`, `@better-auth/drizzle-adapter`, and `@thallesp/nestjs-better-auth` to `apps/api/package.json` dependencies using pnpm package filtering. |  |  |
| TASK-002 | Add `better-auth` to `apps/console/package.json` dependencies using pnpm package filtering. |  |  |
| TASK-003 | Add `tsx` to `apps/api/package.json` devDependencies only if `apps/api/src/auth/seed-admin.ts` is executed directly as TypeScript. |  |  |
| TASK-004 | Use shadcn CLI for `packages/ui` to add auth form components: `card`, `input`, `label` or `field`, `alert`, `separator`, and `spinner` if available. |  |  |
| TASK-005 | Export all newly added UI components from `packages/ui/package.json` subpath exports. |  |  |
| TASK-006 | Update `apps/api/src/env.ts` to validate `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, optional `BETTER_AUTH_COOKIE_DOMAIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_BOOTSTRAP_ADMIN_EMAIL`, `AUTH_BOOTSTRAP_ADMIN_PASSWORD`, and optional `AUTH_BOOTSTRAP_ADMIN_NAME`. |  |  |
| TASK-007 | Enforce `BETTER_AUTH_SECRET` minimum length of 32 characters in `apps/api/src/env.ts`. |  |  |
| TASK-008 | Update root `.env.example` with active Better Auth, Google OAuth, and bootstrap admin variables. |  |  |
| TASK-009 | Update `apps/api/.env.example` with API-specific auth variables. |  |  |
| TASK-010 | Confirm `apps/console/.env.example` continues to define `VITE_API_URL=http://localhost:3000` for Better Auth client base URL. |  |  |

### Implementation Phase 2 — Better Auth Server Configuration

- **GOAL-002**: Create the Better Auth server instance and configure email/password, Google, Admin plugin, sessions, and cookies.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Create `apps/api/src/auth/auth.ts`. |  |  |
| TASK-012 | In `auth.ts`, export `auth` created by `betterAuth`. |  |  |
| TASK-013 | Configure `appName: "Corral"` in `auth.ts`. |  |  |
| TASK-014 | Configure `baseURL` from `getEnv().BETTER_AUTH_URL` in `auth.ts`. |  |  |
| TASK-015 | Configure `basePath: "/api/auth"` in `auth.ts`. |  |  |
| TASK-016 | Configure `trustedOrigins` by splitting `getEnv().BETTER_AUTH_TRUSTED_ORIGINS` on commas and trimming empty values. |  |  |
| TASK-017 | Configure `advanced.cookiePrefix: "corral"` in `auth.ts`. |  |  |
| TASK-018 | Configure Drizzle adapter in `auth.ts` using `drizzleAdapter(db, { provider: "pg", schema })`, importing `db` and `schema` from `@corral/db`. |  |  |
| TASK-019 | Configure `emailAndPassword.enabled: true` in `auth.ts`. |  |  |
| TASK-020 | Configure `emailAndPassword.disableSignUp: true` in `auth.ts`. |  |  |
| TASK-021 | Configure `emailAndPassword.sendResetPassword` as a log-only stub that does not send real email. |  |  |
| TASK-022 | Configure `emailAndPassword.revokeSessionsOnPasswordReset: true` in `auth.ts`. |  |  |
| TASK-023 | Configure Google provider in `socialProviders.google` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. |  |  |
| TASK-024 | Configure Google provider with sign-up blocking: `disableSignUp: true` and `disableImplicitSignUp: true`. |  |  |
| TASK-025 | Configure Google provider with `prompt: "select_account"`. |  |  |
| TASK-026 | Configure Better Auth Admin plugin with default roles by adding `admin()` to `plugins`. |  |  |
| TASK-027 | Do not configure Better Auth Organization plugin in `auth.ts`. |  |  |
| TASK-028 | Keep `session.cookieCache` disabled or unset. |  |  |
| TASK-029 | Configure cross-subdomain cookies only when `BETTER_AUTH_COOKIE_DOMAIN` is present. |  |  |

### Implementation Phase 3 — NestJS Integration

- **GOAL-003**: Mount Better Auth in NestJS and preserve public health checks.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-030 | Create `apps/api/src/auth/auth.module.ts`. |  |  |
| TASK-031 | In `auth.module.ts`, import `AuthModule` from `@thallesp/nestjs-better-auth`. |  |  |
| TASK-032 | In `auth.module.ts`, export a module that imports `AuthModule.forRoot({ auth, bodyParser: { json: { limit: "2mb" }, urlencoded: { enabled: true, extended: true, limit: "2mb" }, rawBody: true } })`. |  |  |
| TASK-033 | Update `apps/api/src/main.ts` to call `NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false })`. |  |  |
| TASK-034 | Update `apps/api/src/main.ts` CORS configuration to include `credentials: true`. |  |  |
| TASK-035 | Import the new auth module in `apps/api/src/app.module.ts`. |  |  |
| TASK-036 | Add `@AllowAnonymous()` to `HealthController` in `apps/api/src/health/health.controller.ts`. |  |  |
| TASK-037 | Confirm `/health` is still served by the existing ts-rest health controller and is not moved under Better Auth. |  |  |

### Implementation Phase 4 — Better Auth Drizzle Schema and Migrations

- **GOAL-004**: Generate, inspect, and migrate Better Auth tables through Drizzle.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-038 | Run Better Auth diagnostics with explicit config: `pnpm dlx auth@latest info --config apps/api/src/auth/auth.ts`. |  |  |
| TASK-039 | Generate Better Auth Drizzle schema to `packages/db/src/schema/auth.ts` using `pnpm dlx auth@latest generate --config apps/api/src/auth/auth.ts --output packages/db/src/schema/auth.ts --yes`. |  |  |
| TASK-040 | If Better Auth CLI cannot resolve workspace aliases, create a temporary generation config with relative imports and rerun schema generation. |  |  |
| TASK-041 | Re-export generated auth tables from `packages/db/src/schema/index.ts`. |  |  |
| TASK-042 | Verify generated schema includes `user`, `session`, `account`, and `verification` tables. |  |  |
| TASK-043 | Verify generated schema includes Admin plugin fields: `role`, `banned`, `banReason`, `banExpires`, and `impersonatedBy`. |  |  |
| TASK-044 | Verify or add indexes for user email, account userId, session userId, session token, and verification identifier. |  |  |
| TASK-045 | Run `pnpm db:generate` to generate Drizzle migration SQL. |  |  |
| TASK-046 | Inspect generated migration SQL under `packages/db/drizzle`. |  |  |
| TASK-047 | Run `pnpm db:migrate` against local Postgres. |  |  |

### Implementation Phase 5 — Admin Bootstrap

- **GOAL-005**: Provide a secure and idempotent first-admin bootstrap flow.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-048 | Create `apps/api/src/auth/seed-admin.ts`. |  |  |
| TASK-049 | Load and validate env in `seed-admin.ts` using existing API env loader. |  |  |
| TASK-050 | In `seed-admin.ts`, call server-side `auth.api.createUser` with `email`, `password`, `name`, and `role: "admin"`. |  |  |
| TASK-051 | Make `seed-admin.ts` idempotent by handling existing email without silently resetting password. |  |  |
| TASK-052 | Add package script `auth:seed-admin` to `apps/api/package.json`. |  |  |
| TASK-053 | Do not add any HTTP route for bootstrap admin creation. |  |  |

### Implementation Phase 6 — Console Auth Client and Routes

- **GOAL-006**: Add Better Auth client, login UI, protected console layout, and admin-only user management.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-054 | Create `apps/console/src/lib/auth.ts` with Better Auth React client configured with `baseURL: import.meta.env.VITE_API_URL`. |  |  |
| TASK-055 | Add Admin client plugin to the console Better Auth client. |  |  |
| TASK-056 | Update `apps/console/src/routes/__root.tsx` to use typed router context containing `queryClient` and `authClient`. |  |  |
| TASK-057 | Update `apps/console/src/main.tsx` to pass `authClient` into `createRouter({ context })`. |  |  |
| TASK-058 | Create `apps/console/src/routes/login.tsx` as a public login route. |  |  |
| TASK-059 | Implement email/password sign-in form on `/login`. |  |  |
| TASK-060 | Implement Google sign-in button on `/login` using `authClient.signIn.social({ provider: "google" })`. |  |  |
| TASK-061 | Implement loading and error states on `/login`. |  |  |
| TASK-062 | Implement redirect-back behavior after successful login using the `redirect` search parameter. |  |  |
| TASK-063 | Create `apps/console/src/routes/_authenticated.tsx` as a pathless layout route. |  |  |
| TASK-064 | In `_authenticated.tsx`, use `beforeLoad` to call `authClient.getSession`; redirect unauthenticated users to `/login`. |  |  |
| TASK-065 | Move the current dashboard route from `apps/console/src/routes/index.tsx` to `apps/console/src/routes/_authenticated.index.tsx`. |  |  |
| TASK-066 | Keep `apps/console/src/routes/-page.tsx` as the dashboard component source. |  |  |
| TASK-067 | Add sign-out UI to the authenticated console shell or dashboard. |  |  |
| TASK-068 | Create an admin-only user-management route under the authenticated layout. Preferred target URL is `/admin/users`; verify exact file naming against generated `routeTree.gen.ts`. |  |  |
| TASK-069 | Implement admin user listing using Better Auth Admin client methods. |  |  |
| TASK-070 | Implement admin-created user form for default `user` role accounts. |  |  |
| TASK-071 | Implement non-admin access-denied state for user-management route. |  |  |
| TASK-072 | Do not modify `apps/web` for auth in this slice. |  |  |

### Implementation Phase 7 — Tests and Verification

- **GOAL-007**: Validate security, routing, schema, and quality gates.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-073 | Add API test proving `/health` remains anonymous after global auth guard registration. |  |  |
| TASK-074 | Add API test or manual verification proving Better Auth routes are mounted at `/api/auth/*`. |  |  |
| TASK-075 | Add API test or manual verification proving public email sign-up is blocked. |  |  |
| TASK-076 | Add console test proving unauthenticated `/` redirects to `/login`. |  |  |
| TASK-077 | Add console test proving authenticated `/` renders the dashboard. |  |  |
| TASK-078 | Add console test for login error rendering. |  |  |
| TASK-079 | Add console test for Google sign-in button invocation. |  |  |
| TASK-080 | Add console test proving non-admin users cannot access user-management controls. |  |  |
| TASK-081 | Verify Google Cloud local redirect URI is `http://localhost:3000/api/auth/callback/google`. |  |  |
| TASK-082 | Verify staging/prod Google redirect URI is `${BETTER_AUTH_URL}/api/auth/callback/google`. |  |  |
| TASK-083 | Manually verify unknown Google users do not create Corral accounts. |  |  |
| TASK-084 | Manually verify admin-created users with matching verified Google email can sign in. |  |  |
| TASK-085 | Run `pnpm biome:ci`. |  |  |
| TASK-086 | Run `pnpm typecheck`. |  |  |
| TASK-087 | Run `pnpm test`. |  |  |
| TASK-088 | Run `pnpm build`. |  |  |

## 3. Alternatives

- **ALT-001**: Use Better Auth Organization plugin for organizer membership. Rejected for this slice
  because Corral needs first-class organizer/event domain tables, admin-created users plus manual
  membership assignment, and product-specific roles/capabilities without coupling authorization to a
  provider plugin.
- **ALT-002**: Add a custom `organizer` role now. Rejected because the initial admin plugin roles `admin` and `user` are sufficient for the first slice and avoid custom access-control complexity before event ownership exists.
- **ALT-003**: Enable public sign-up. Rejected because the confirmed MVP operating model is admin-created accounts and white-glove onboarding.
- **ALT-004**: Use Better Auth cookie cache immediately. Rejected because immediate admin session revocation is more important than reducing session DB reads in the first slice.
- **ALT-005**: Use Redis secondary storage for sessions immediately. Rejected because Postgres-backed sessions are simpler and sufficient until load proves the need for Redis-backed short-lived auth state.
- **ALT-006**: Wrap Better Auth routes in ts-rest. Rejected because Better Auth already owns its route contract and client; Corral ts-rest contracts should remain for product APIs.
- **ALT-007**: Build custom auth instead of Better Auth. Rejected because Better Auth provides supported session, OAuth, admin, and future plugin capabilities that align with the Corral stack decision.
- **ALT-008**: Implement email sending now with Resend. Rejected for this slice because notification/email provider setup belongs in the communication/notification slice.

## 4. Dependencies

- **DEP-001**: `better-auth` in `apps/api` and `apps/console`.
- **DEP-002**: `@better-auth/drizzle-adapter` in `apps/api`.
- **DEP-003**: `@thallesp/nestjs-better-auth` in `apps/api`.
- **DEP-004**: Optional `tsx` in `apps/api` for running `seed-admin.ts`.
- **DEP-005**: Existing `@corral/db` Drizzle client and schema barrel.
- **DEP-006**: Existing `@corral/config/env` env parsing helper.
- **DEP-007**: Existing `drizzle-kit` migration workflow in `packages/db`.
- **DEP-008**: Existing `@tanstack/react-router` in `apps/console`.
- **DEP-009**: Existing `@tanstack/react-query` in `apps/console`.
- **DEP-010**: Existing `@corral/ui` package and shadcn component setup.
- **DEP-011**: Google Cloud OAuth credentials for non-test Google sign-in.
- **DEP-012**: Local Postgres from `docker-compose.yml` for migration and development verification.

## 5. Files

- **FILE-001**: `apps/api/package.json` — add API auth dependencies and `auth:seed-admin` script.
- **FILE-002**: `apps/api/src/env.ts` — add auth, Google, cookie-domain, and admin bootstrap env validation.
- **FILE-003**: `apps/api/src/auth/auth.ts` — new Better Auth server instance.
- **FILE-004**: `apps/api/src/auth/auth.module.ts` — new NestJS integration wrapper module.
- **FILE-005**: `apps/api/src/auth/seed-admin.ts` — new ops-only admin bootstrap script.
- **FILE-006**: `apps/api/src/main.ts` — disable Nest body parser and enable credentialed CORS.
- **FILE-007**: `apps/api/src/app.module.ts` — import auth module.
- **FILE-008**: `apps/api/src/health/health.controller.ts` — mark health route anonymous.
- **FILE-009**: `packages/db/src/schema/auth.ts` — generated Better Auth Drizzle schema.
- **FILE-010**: `packages/db/src/schema/index.ts` — re-export auth tables.
- **FILE-011**: `packages/db/drizzle/*` — generated migration SQL for auth tables.
- **FILE-012**: `apps/console/package.json` — add Better Auth client dependency.
- **FILE-013**: `apps/console/src/lib/auth.ts` — new Better Auth React client.
- **FILE-014**: `apps/console/src/main.tsx` — add auth client to router context.
- **FILE-015**: `apps/console/src/routes/__root.tsx` — type router context.
- **FILE-016**: `apps/console/src/routes/login.tsx` — new public login route.
- **FILE-017**: `apps/console/src/routes/_authenticated.tsx` — new pathless authenticated route guard.
- **FILE-018**: `apps/console/src/routes/_authenticated.index.tsx` — protected dashboard route.
- **FILE-019**: `apps/console/src/routes/index.tsx` — remove or move current public dashboard route.
- **FILE-020**: `apps/console/src/routes/-page.tsx` — keep dashboard component and add sign-out UI if implemented there.
- **FILE-021**: `apps/console/src/routes/_authenticated.admin.users.tsx` — planned admin user-management route; verify generated URL after route generation.
- **FILE-022**: `packages/ui/package.json` — export new shadcn UI components.
- **FILE-023**: `packages/ui/src/components/*` — new shadcn components for login and admin forms.
- **FILE-024**: `.env.example` — shared auth env documentation.
- **FILE-025**: `apps/api/.env.example` — API-specific auth env documentation.
- **FILE-026**: `apps/console/.env.example` — console auth base URL documentation.
- **FILE-027**: `apps/api/src/health/health.controller.spec.ts` — update or add assertions for anonymous health behavior if needed.
- **FILE-028**: `apps/console/src/routes/*.test.tsx` — add login, guard, and admin UI tests.

## 6. Testing

- **TEST-001**: API test: unauthenticated `GET /health` returns the existing health response shape.
- **TEST-002**: API test/manual check: `GET /api/auth/get-session` returns unauthenticated state before login.
- **TEST-003**: API test/manual check: `POST /api/auth/sign-up/email` is blocked because public sign-up is disabled.
- **TEST-004**: API test/manual check: admin seed script creates a role `admin` user.
- **TEST-005**: API test/manual check: admin seed script is idempotent for existing admin email.
- **TEST-006**: DB schema check: generated Drizzle schema exports `user`, `session`, `account`, and `verification` tables.
- **TEST-007**: DB schema check: generated schema includes Admin plugin fields.
- **TEST-008**: DB migration check: migration SQL creates Better Auth core tables and Admin plugin columns.
- **TEST-009**: Console unit test: unauthenticated `/` redirects to `/login`.
- **TEST-010**: Console unit test: authenticated `/` renders dashboard content.
- **TEST-011**: Console unit test: login form displays Better Auth sign-in errors.
- **TEST-012**: Console unit test: Google button invokes `authClient.signIn.social({ provider: "google" })`.
- **TEST-013**: Console unit test: sign-out invokes `authClient.signOut` and returns user to login flow.
- **TEST-014**: Console unit test: non-admin session cannot access user-management controls.
- **TEST-015**: Manual OAuth test: unknown Google account cannot create a Corral user.
- **TEST-016**: Manual OAuth test: admin-created user with matching verified Google email can sign in with Google.
- **TEST-017**: Manual cookie test: localhost console can set/read API auth cookies with credentialed CORS.
- **TEST-018**: Staging cookie test: shared parent-domain cookies work across console/API subdomains.
- **TEST-019**: Quality gate: `pnpm biome:ci` passes.
- **TEST-020**: Quality gate: `pnpm typecheck` passes.
- **TEST-021**: Quality gate: `pnpm test` passes.
- **TEST-022**: Quality gate: `pnpm build` passes.

## 7. Risks & Assumptions

- **RISK-001**: Better Auth CLI may fail to resolve workspace aliases in `apps/api/src/auth/auth.ts`. Mitigation: use a temporary generation config with relative imports.
- **RISK-002**: Google sign-in for admin-created users may require explicit account-linking behavior validation. Mitigation: test matching verified Google email and adjust account linking settings only if required.
- **RISK-003**: Disabling Nest body parser can break non-auth JSON routes if the integration body parser is misconfigured. Mitigation: configure module body parser and rerun health/API tests.
- **RISK-004**: Global auth guard can accidentally protect public health checks. Mitigation: apply `@AllowAnonymous()` and test `/health`.
- **RISK-005**: Cross-subdomain cookie settings can fail in Safari or staging if the domain is wrong. Mitigation: test shared parent-domain cookies before staging rollout.
- **RISK-006**: Log-only password reset is not production-ready. Mitigation: keep external organizer rollout blocked until real email delivery is implemented.
- **RISK-007**: Admin-created users with temporary passwords require secure operational handling. Mitigation: prefer passwordless admin-created users or force reset once real email exists.
- **RISK-008**: Generated schema may omit performance indexes recommended by Better Auth docs. Mitigation: inspect and add explicit Drizzle indexes.
- **RISK-009**: User role `user` may be semantically confusing compared to Corral’s organizer terminology. Mitigation: map `user` to organizer behavior in app UI until domain roles are designed.
- **RISK-010**: Corral-owned membership means product APIs must consistently resolve event ownership
  to an organizer before checking membership/capabilities. Mitigation: keep authorization checks
  server-side and compute organizer-scoped capabilities through `/console/me` and future API guards.

- **ASSUMPTION-001**: `apps/api` remains the only auth server for console in this slice.
- **ASSUMPTION-002**: `apps/console` and API share a parent domain in staging/prod.
- **ASSUMPTION-003**: Google Cloud OAuth credentials will be available before testing Google sign-in beyond local mocks.
- **ASSUMPTION-004**: Local development continues to use Postgres and Redis from `docker-compose.yml`.
- **ASSUMPTION-005**: `apps/web` does not need participant auth until a later participant-account slice.
- **ASSUMPTION-006**: The first implementation may run manual OAuth checks because automated Google OAuth E2E is not required for this slice.

## 8. Related Specifications / Further Reading

- [Corral Product Plan](../plan.md)
- [Corral Implementation Plan](../implementation-plan.md)
- [Corral Bootstrap Plan](../bootstrap-plan.md)
- [Better Auth Installation](https://www.better-auth.com/docs/installation)
- [Better Auth Database](https://www.better-auth.com/docs/concepts/database)
- [Better Auth Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [Better Auth CLI](https://www.better-auth.com/docs/concepts/cli)
- [Better Auth Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth Google Provider](https://www.better-auth.com/docs/authentication/google)
- [Better Auth OAuth Concepts](https://www.better-auth.com/docs/concepts/oauth)
- [Better Auth Users & Accounts](https://www.better-auth.com/docs/concepts/users-accounts)
- [Better Auth Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [Better Auth Cookies](https://www.better-auth.com/docs/concepts/cookies)
- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better Auth Options Reference](https://www.better-auth.com/docs/reference/options)
- [Better Auth NestJS Integration](https://www.better-auth.com/docs/integrations/nestjs)
- [`@thallesp/nestjs-better-auth` Repository](https://github.com/ThallesP/nestjs-better-auth)
- [TanStack Router Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
