---
goal: Implement Organizer/Event Domain Foundation for Corral
version: 1.0
date_created: 2026-06-12
owner: Corral Engineering
tags: feature, organizer, events, setup, ts-rest, drizzle, console, rbac
---

# Introduction

This plan defines the first production-shaped Organizer/Event domain slice after Better Auth. Organizer identity, email-password signup, verified onboarding, platform-admin organizer review, and admin user assignment are already live. This slice unlocks real event draft creation and setup for approved organizers while keeping downstream registration, payments, coupons, asset uploads, and public event pages out of scope.

The implementation should convert the existing mock-only organizer event setup flow into live Corral-owned event APIs for event basics, registration windows, categories, fee tiers, form/policy configuration, readiness checks, and publish transitions.

## 1. Current state

### Done before this slice

- Better Auth server/client foundation under `/api/auth/*`.
- Console route protection via Better Auth sessions.
- Corral-owned organizer onboarding:
  - `POST /console/onboarding/organizer`
  - `GET /console/onboarding`
- Platform-admin organizer review:
  - `GET /admin/organizers`
  - `GET /admin/organizers/:organizerId`
  - `PATCH /admin/organizers/:organizerId/review`
- Admin user and organizer membership management:
  - Better Auth admin user creation/listing
  - Corral organizer membership assignment/update
- Minimal `event` table and read-only listing via `/console/me` and `/console/organizers/:organizerId/events`.

### Existing code surfaces

| Area | Files | Current state |
|---|---|---|
| DB schema | `packages/db/src/schema/organizer.ts` | Has `organizer`, `organizer_member`, minimal `event`; lacks categories, fee tiers, setup content, form/policy fields, publish metadata. |
| Contracts | `packages/schema/src/contracts/console.ts`, `console.schema.ts` | Has console context, onboarding, organizer admin contracts; event contracts are read-only. |
| API service | `apps/api/src/console/console-context.service.ts` | Lists memberships/events and handles onboarding/admin review; no event writes. |
| Console UI | `apps/console/src/routes/_authenticated.events.$eventId.setup.*.tsx`, `-event-setup-screens.tsx` | Event setup screens are built but mock-store backed. |
| Mocks | `apps/console/src/mocks/events.ts`, `types.ts`, `store.ts` | Define expected event/category/setup shapes. |

## 2. Scope

### In scope

- Organizer-scoped event draft CRUD:
  - create draft event
  - read event detail with categories and readiness
  - update draft setup fields
  - list current organizer events
- Event setup data:
  - basics: name, date/start time, venue, city, timezone, registration windows
  - content: description, contact email/phone, map URL
  - form config: enabled participant fields and T-shirt sizes
  - policies: waiver text, refund policy, race instructions, medical declaration
  - categories/distances: label, distance, fee, capacity, minimum age
  - fee tiers: label, amount, optional date/count limits
- Readiness and publish workflow:
  - draft -> ready
  - ready -> draft (revert for further edits)
  - ready -> published
  - server-generated readiness checklist with blocking and warning items
- RBAC:
  - active organizer membership required for organizer APIs
  - `events:read` for detail/list
  - `events:write` for create/update/categories/ready/revert
  - `events:publish` for publish
- Organizer review gates:
  - approved organizer required for creating events and publishing
  - suspended/rejected organizers cannot create or publish
- Platform admin:
  - minimal admin action to set `organizer.paymentAccountStatus` so publish payment readiness is testable before Razorpay KYC ships (see DEC-006).
- Console integration:
  - first-event entry point: an approved organizer with zero events gets a real "create your first event" path (replaces the current static "Organizer profile created" dead-end in `_authenticated.tsx`).
  - events dashboard create action.
  - setup screens load/save live event detail.
  - publish screen uses live readiness/publish endpoints.
  - console context (memberships/events) refresh after create/ready/revert/publish so the active-event switcher reflects new drafts.
  - shell tolerates draft events with not-yet-filled basics (e.g. null venue/date) when rendering the active-event header.
- API tests, minimal console smoke coverage for the new create/publish wiring, and docs/progress updates.

### Out of scope

- Branding file upload, Cloudflare R2, image processing, and sponsor logo storage.
- Coupon CRUD and discount redemption logic.
- Razorpay Route linked-account/KYC integration; this slice only reads `organizer.paymentAccountStatus` for publish readiness and exposes a minimal platform-admin toggle to set it (no real KYC).
- Public participant event page APIs.
- Registration, checkout, roster, BIB, payments, communications, results, certificates.
- Audit-log persistence foundation, except `event.publishedAt` and `event.publishedByUserId`.
- Admin act-on-behalf mutation support and publish override workflow.
- Event cloning, automatic BIB allocation, white-label/custom domains, multi-language.

## 3. Requirements

### Functional requirements

- REQ-001: Approved organizer Owners/Admins/Event Editors can create draft events for their organizer.
- REQ-002: Event creation must generate a unique slug per organizer when not provided.
- REQ-003: Event detail must include setup fields, categories, fee tiers, and readiness checks.
- REQ-004: Draft events can be updated; `ready` events are immutable until reverted to draft; published, closed, and completed events are immutable in this slice.
- REQ-005: Categories can be created, updated, and deleted while an event is draft.
- REQ-006: Fee tiers can be created, updated, and deleted while an event is draft.
- REQ-007: A category must have at least one active fee tier before the event can be marked ready.
- REQ-008: Readiness checks must distinguish blocking issues from warning-only issues.
- REQ-009: Sponsor/branding absence is warning-only, not a blocker.
- REQ-010: Payment account not verified blocks publish, but does not block draft saving or marking ready. Until Razorpay KYC ships, a platform admin can set the organizer's payment account status so publish is reachable (DEC-006).
- REQ-011: Only users with `events:publish` can publish.
- REQ-012: Publishing requires organizer `reviewStatus === "approved"`.
- REQ-013: Publishing requires event `status === "ready"`.
- REQ-014: Console setup screens must not silently fall back to mock data for real authenticated users.
- REQ-015: Existing demo states can remain for development QA, but live paths should use API data.
- REQ-016: An approved organizer with no events must have a working in-console path to create the first event; the shell must not dead-end on a static card.
- REQ-017: A `ready` event can be reverted to `draft` by a user with `events:write` to allow further edits before publishing.
- REQ-018: After create, ready, revert, or publish, the console must refresh its event context so the active-event switcher and header reflect the change without a manual reload.

### Security and data requirements

- SEC-001: Every organizer event endpoint must require a Better Auth session.
- SEC-002: Event reads must be scoped to organizer memberships or platform-admin access where explicitly supported.
- SEC-003: Event writes must validate active membership and role capabilities server-side.
- SEC-004: Browser mutation origins must be checked using the existing trusted-origin pattern.
- SEC-005: Do not trust client-side readiness, status, organizer ID, or capability flags.
- SEC-006: Do not allow public event publication for unapproved, rejected, or suspended organizers.
- SEC-007: Avoid storing unnecessary participant PII in event setup tables.

### Product requirements

- PRD-001: Event setup captures name, date/time, venue, map URL, description, contact info, and race instructions.
- PRD-002: Categories support realistic Coimbatore distances such as 3K, 5K, 10K, 21K, 42K, and fun run labels.
- PRD-003: Fees are organizer-absorbed for Corral convenience charges; participants see the configured category fee.
- PRD-004: Registration windows must be valid and close before race start.
- PRD-005: Waiver and refund/cancellation policy are required before readiness.
- PRD-006: Medical declaration text and emergency/guardian form-field toggles are kept DPDP-aware.

## 4. Proposed data model

### Extend `event`

Add nullable/setup fields to the existing `event` table:

- `description`
- `map_url`
- `contact_email`
- `contact_phone`
- `race_instructions`
- `waiver_text`
- `refund_policy`
- `medical_declaration`
- `form_fields` as text array or JSON-compatible text array
- `tshirt_sizes` as text array
- `logo_url` and `banner_url` as nullable placeholders only; upload implementation is deferred
- `ready_at`
- `published_at`
- `published_by_user_id`
- `created_by_user_id`

Keep existing:

- `status`: `draft`, `ready`, `published`, `closed`, `completed`
- `date`, `starts_at`, `registration_opens_at`, `registration_closes_at`

Notes:

- The current `event` table marks `date`, `starts_at`, `venue_name`, `venue_address`, `city`, `registration_opens_at`, and `registration_closes_at` as `NOT NULL`. For a draft-first flow (create with just a name, then fill the basics screen), the migration must relax these to nullable; their presence is instead enforced as blocking readiness checks (§6). Existing seeded rows already have values, so no backfill is needed.
- Event routes key off the event `id` (not slug). Generate a collision-resistant `id` (e.g. `evt_<random>`); keep `slug` for future public URLs only (DEC-008).
- `form_fields` values must be validated server-side against a fixed allow-list of known field keys mirrored from `apps/console/src/mocks/types.ts`; reject unknown keys (SEC-005).
- `registered_count`/`registration_count` stay `0` and are never written in this slice; treat as reserved for the registration domain.

### Add `event_category`

Fields:

- `id`
- `event_id`
- `label`
- `distance`
- `min_age`
- `max_age`
- `capacity`
- `registered_count` default `0`
- `sort_order`
- `status`: `active`, `hidden`, `sold-out`
- `created_at`, `updated_at`

Notes:

- Use free-text distance to support `3K`, `5K`, `10K`, `21.1K`, `42.2K`, and fun-run labels without schema churn.
- `registered_count` is denormalized/reserved for later registration integration; keep `0` in this slice.

### Add `event_fee_tier`

Fields:

- `id`
- `category_id`
- `label`
- `amount_in_paise`
- `starts_at`
- `ends_at`
- `registration_cap`
- `registration_count` default `0`
- `is_active`
- `created_at`, `updated_at`

Notes:

- Store money as paise.
- Prevent deleting the last active tier for a category.
- Prevent overlapping active date windows within the same category when both dates are set.

## 5. Proposed API contracts

All routes live in the existing console contract unless a later refactor extracts event contracts.

### Event list/detail

- `GET /console/organizers/:organizerId/events`
  - Already exists as list; extend response if needed but preserve existing console shell compatibility.
- `GET /console/organizers/:organizerId/events/:eventId`
  - Returns event detail, categories, fee tiers, and readiness.

### Event draft CRUD

- `POST /console/organizers/:organizerId/events`
  - Creates draft event.
  - Minimal required field: `name`. A `slug` and `id` are generated server-side.
  - All other basics (`date`, `startsAt`, `venueName`, `venueAddress`, `city`, `registrationOpensAt`, `registrationClosesAt`) and content fields are optional at creation and completed via the basics setup screen; their presence is enforced by readiness checks (§6), not at create time.

- `PATCH /console/organizers/:organizerId/events/:eventId`
  - Updates draft setup fields.
  - Rejects non-draft events with `409`.

- `DELETE /console/organizers/:organizerId/events/:eventId`
  - Deletes draft events only (non-draft -> `409`).
  - Returns `200 { deleted: true }` rather than `204`, to stay within the existing `withConsoleErrors` success-status helper (DEC-007).

### Categories and fees

- `POST /console/organizers/:organizerId/events/:eventId/categories`
- `PATCH /console/organizers/:organizerId/events/:eventId/categories/:categoryId`
- `DELETE /console/organizers/:organizerId/events/:eventId/categories/:categoryId`
- `POST /console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers`
- `PATCH /console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers/:tierId`
- `DELETE /console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers/:tierId`

### Readiness and publishing

- `GET /console/organizers/:organizerId/events/:eventId/readiness`
  - Returns `200` with `{ ready: boolean, blocking: [...], warnings: [...] }`.

- `POST /console/organizers/:organizerId/events/:eventId/ready`
  - Runs readiness checks. Requires `events:write`; rejects non-draft events with `409`.
  - On pass: sets `status = "ready"`, `ready_at = NOW()`, returns `200 { transitioned: true, readiness }`.
  - On fail: does not transition, returns `200 { transitioned: false, readiness }` with the blocking items. We deliberately avoid a rich `400` body because the shared `standardErrors`/`withConsoleErrors` helper only allows `{ message }` error bodies (DEC-007).

- `POST /console/organizers/:organizerId/events/:eventId/revert-to-draft`
  - Requires `events:write`.
  - Allowed only from `ready`; sets `status = "draft"`, clears `ready_at`. Any other status -> `409`.

- `POST /console/organizers/:organizerId/events/:eventId/publish`
  - Requires `events:publish`.
  - Requires organizer `reviewStatus === "approved"`.
  - Requires `event.status === "ready"`.
  - Requires `organizer.paymentAccountStatus === "verified"` (settable by admin via the endpoint below until KYC ships).
  - Failed gate -> `409 { message }`.
  - Sets `status = "published"`, `published_at`, and `published_by_user_id`; returns `200`.

### Platform admin (payment readiness shim)

- `PATCH /admin/organizers/:organizerId/payment-account`
  - Requires platform admin.
  - Sets `organizer.paymentAccountStatus` (e.g. `verified` / `not-started`) so publish payment readiness is testable before Razorpay KYC (DEC-006).

### Error/status codes per endpoint

| Endpoint | Success | Error statuses |
|---|---|---|
| `GET .../events/:eventId` | 200 | 401, 403, 404 |
| `POST .../events` | 201 | 400, 401, 403 |
| `PATCH .../events/:eventId` | 200 | 400, 401, 403, 404, 409 |
| `DELETE .../events/:eventId` | 200 | 401, 403, 404, 409 |
| `POST/PATCH/DELETE .../categories[/:id]` | 200/201 | 400, 401, 403, 404, 409 |
| `POST/PATCH/DELETE .../fee-tiers[/:id]` | 200/201 | 400, 401, 403, 404, 409 |
| `GET .../readiness` | 200 | 401, 403, 404 |
| `POST .../ready` | 200 | 401, 403, 404, 409 |
| `POST .../revert-to-draft` | 200 | 401, 403, 404, 409 |
| `POST .../publish` | 200 | 401, 403, 404, 409 |
| `PATCH /admin/organizers/:id/payment-account` | 200 | 400, 401, 403, 404 |

## 6. Readiness checks

### Blocking checks

- Event basics complete:
  - name
  - date/start time
  - venue name/address
  - city
- Registration windows valid:
  - open before close
  - close before event start
- At least one category exists.
- Every active category has:
  - label
  - distance
  - positive capacity
  - at least one active fee tier
  - positive fee amount
- Waiver text present.
- Refund/cancellation policy present.
- Contact email or phone present.
- Organizer is approved (publish only).
- Payment account is verified (publish only; settable via admin shim until KYC ships).

### Warning-only checks

- No logo/banner/sponsor branding.
- No race instructions.
- No map URL.
- Event date is close or potentially stale.

## 7. Implementation phases

### Phase 1 - Contracts and schema design

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-001 | Add event detail, category, fee-tier, readiness, and mutation schemas to `packages/schema/src/contracts/console.schema.ts`. | Yes | 2026-06-12 |
| TASK-002 | Add event CRUD/category/fee/readiness/publish routes to `packages/schema/src/contracts/console.ts`. | Yes | 2026-06-12 |
| TASK-003 | Preserve existing `ConsoleEvent` shape for shell consumers or add backward-compatible fields only. | Yes | 2026-06-12 |
| TASK-004 | Define readiness response schema and decide ready/delete response shapes (`200` with `transitioned`/`deleted` flags) so they fit the existing `standardErrors`/`withConsoleErrors` helper; extend the helper's success-status typing only if strictly needed (DEC-007). | Yes | 2026-06-12 |

### Phase 2 - Database and migrations

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-010 | Extend `packages/db/src/schema/organizer.ts` event table with setup and publish metadata fields. | Yes | 2026-06-12 |
| TASK-011 | Add `eventCategory` Drizzle table. | Yes | 2026-06-12 |
| TASK-012 | Add `eventFeeTier` Drizzle table. | Yes | 2026-06-12 |
| TASK-013 | Generate and inspect a Drizzle migration. | Yes | 2026-06-12 |
| TASK-014 | Ensure indexes cover event lookup by organizer/status and category/fee lookup by event/category. | Yes | 2026-06-12 |
| TASK-015 | In migration `0003`, relax `date`, `starts_at`, `venue_name`, `venue_address`, `city`, `registration_opens_at`, `registration_closes_at` to nullable for draft-first creation; verify the generated SQL only drops NOT NULL and adds new columns. | Yes | 2026-06-12 |

### Phase 3 - API service and controller

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-020 | Add reusable membership/capability helpers to `ConsoleContextService` or extract a focused helper. | Yes | 2026-06-12 |
| TASK-021 | Implement event detail query with categories and fee tiers. | Yes | 2026-06-12 |
| TASK-022 | Implement draft creation with slug generation and organizer approval gate. | Yes | 2026-06-12 |
| TASK-023 | Implement draft update with trusted-origin and `events:write` checks. | Yes | 2026-06-12 |
| TASK-024 | Implement category CRUD for draft events. | Yes | 2026-06-12 |
| TASK-025 | Implement fee-tier CRUD for draft events. | Yes | 2026-06-12 |
| TASK-026 | Implement readiness computation as a pure helper covered by tests. | Yes | 2026-06-12 |
| TASK-027 | Implement mark-ready transition. | Yes | 2026-06-12 |
| TASK-028 | Implement publish transition. | Yes | 2026-06-12 |
| TASK-029 | Wire new ts-rest handlers in `ConsoleController`. | Yes | 2026-06-12 |
| TASK-030 | Implement `revert-to-draft` transition (ready -> draft, clears `ready_at`). | Yes | 2026-06-12 |
| TASK-031 | Implement admin `PATCH /admin/organizers/:id/payment-account` endpoint + service method (platform-admin gated) to set `organizer.paymentAccountStatus`. | Yes | 2026-06-12 |

### Phase 4 - Tests

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-040 | Add API tests for create draft, slug uniqueness, and organizer approval gates. | Partial | 2026-06-12 |
| TASK-041 | Add API tests for event detail membership scoping. | Partial | 2026-06-12 |
| TASK-042 | Add API tests for draft update immutability once ready/published. | Partial | 2026-06-12 |
| TASK-043 | Add API tests for category and fee-tier validation. | Partial | 2026-06-12 |
| TASK-044 | Add API tests for readiness failures and successful ready transition. | Yes | 2026-06-12 |
| TASK-045 | Add API tests for publish RBAC, organizer review gate, payment gate, and metadata writes. | Partial | 2026-06-12 |
| TASK-046 | Add API tests for `revert-to-draft`, the payment gate blocking publish until verified, and the admin payment-account toggle making publish reachable. | Partial | 2026-06-12 |
| TASK-047 | Add a minimal console smoke test for the create-event entry point and publish wiring if a console test runner is stood up; otherwise document reliance on console typecheck + API tests (DEC-009). | Not started | 2026-06-12 |

### Phase 5 - Console integration

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-050 | Add console API helpers/hooks for event detail, draft save, categories, readiness, and publish. | Yes | 2026-06-12 |
| TASK-051 | Wire events dashboard create event action to real draft creation. | Yes | 2026-06-12 |
| TASK-052 | Wire basics setup screen to live detail/update. | Yes | 2026-06-12 |
| TASK-053 | Wire fees screen to live categories and fee tiers. | Yes | 2026-06-12 |
| TASK-054 | Wire form screen to live form-field config. | Yes | 2026-06-12 |
| TASK-055 | Wire policies screen to live policy fields. | Yes | 2026-06-12 |
| TASK-056 | Wire publish screen to live readiness, ready, and publish operations. | Yes | 2026-06-12 |
| TASK-057 | Preserve development demo states without masking live authenticated failures. | Yes | 2026-06-12 |
| TASK-058 | Replace the static "Organizer profile created" dead-end in `_authenticated.tsx` with a real first-event creation entry point for approved organizers with zero events (REQ-016). | Yes | 2026-06-12 |
| TASK-059 | Refresh console event context after create/ready/revert/publish (router invalidate / query invalidation) and make the active-event header tolerate null basics like venue/date (REQ-018). | Yes | 2026-06-12 |

### Phase 6 - Documentation and validation

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-060 | Update `docs/product-progress.md` MVP-02 row with final scope/status/evidence. | Yes | 2026-06-12 |
| TASK-061 | Update this plan with completed task rows and validation evidence. | Yes | 2026-06-12 |
| TASK-062 | Run API tests, API typecheck, console typecheck, and targeted lint/build commands already present in the repo. | Yes | 2026-06-12 |

### 2026-06-12 implementation checkpoint

- Completed backend foundation: event setup schemas/contracts, Drizzle event/category/fee-tier schema and migration `0003_jazzy_mandroid.sql`, organizer-scoped event CRUD, category/fee-tier CRUD, readiness, ready/revert/publish transitions, admin payment-account status shim, and ts-rest controller handlers.
- Completed console integration: approved organizers with zero events can create the first draft from `_authenticated.tsx`; the events dashboard create action calls the live API; live setup screens save basics, categories, fee tiers, registration windows, form fields, waiver/medical copy, policies, contact fields, readiness, ready, and publish back to the event APIs; shell header and active-event switcher refresh against live context.
- Manual browser validation completed against the running app at `localhost:5274`: created `Browser Validation 10K`, filled basics/fees/form/policies, marked ready, and published through live `/console/organizers/:organizerId/events/:eventId/*` requests. The initial local create attempt returned `500` because migration `0003_jazzy_mandroid` had not been applied to the local database; running `corepack pnpm --filter @corral/db db:migrate` resolved it.
- Opus 4.8 code review found two backend gaps (category update age invariant and readiness with no active categories); both were fixed with regression tests.

## 8. Validation plan

- `corepack pnpm --filter @corral/api test`
- `corepack pnpm --filter @corral/api typecheck`
- `corepack pnpm --filter @corral/console typecheck`
- `corepack pnpm --filter @corral/schema typecheck`
- `corepack pnpm --filter @corral/db typecheck`
- `corepack pnpm --filter @corral/console test` (if a console test runner is introduced for TASK-047)
- Targeted lint commands for changed packages.
- Manual local flow when infra is available:
  1. seed/sign in platform admin
  2. approve organizer
  3. sign in organizer
  4. create draft event
  5. fill basics/categories/form/policies
  6. check readiness failures and fixes
  7. mark ready (and optionally revert to draft to confirm the round-trip)
  8. as platform admin, set the organizer payment account to verified
  9. publish and confirm published metadata + console context refresh

### 2026-06-12 validation evidence

- `corepack pnpm --filter @corral/schema build`
- `corepack pnpm --filter @corral/schema typecheck`
- `corepack pnpm --filter @corral/db typecheck`
- `corepack pnpm --filter @corral/api typecheck`
- `corepack pnpm --filter @corral/console typecheck`
- `corepack pnpm --filter @corral/schema lint`
- `corepack pnpm --filter @corral/db lint`
- `corepack pnpm --filter @corral/api lint`
- `corepack pnpm --filter @corral/console lint`
- `corepack pnpm --filter @corral/api test` (33 passing tests)
- `corepack pnpm --filter @corral/db db:migrate`
- Browser flow: sign in as local admin/organizer, create a draft event, save basics/categories/fee tiers/registration windows/form/policies, mark ready, publish, and observe successful live API requests.

## 9. Open decisions

| ID | Decision | Recommendation |
|---|---|---|
| DEC-001 | Should event creation require organizer approval? | Yes. Keep drafts unavailable for unapproved/rejected/suspended organizers to avoid unsupported self-service state. |
| DEC-002 | Should payment account verification block mark-ready or publish? | Block publish only. Allow setup work before KYC is complete. |
| DEC-003 | Should event categories use fixed distance enum? | No. Use free-text distance with validation length so Indian fun-run/category names do not require migrations. |
| DEC-004 | Should file upload URLs be accepted in this slice? | Keep nullable placeholder fields only; no upload endpoint until object storage is implemented. |
| DEC-005 | Should platform admins get event override endpoints now? | Defer until audit-log foundation, unless product requires white-glove event creation immediately. |
| DEC-006 | How is publish testable when KYC/payment integration is deferred? | Add a minimal platform-admin endpoint to set `organizer.paymentAccountStatus`. Keeps the publish payment gate intact and lets admins white-glove verification until Razorpay ships. (Alternative: make payment warning-only this slice.) |
| DEC-007 | How should `ready`/`delete` responses fit the strict `standardErrors`/`withConsoleErrors` helper that only allows `{ message }` errors and `200`/`201` success? | `POST .../ready` returns `200 { transitioned, readiness }` (no rich `400`); `DELETE` returns `200 { deleted }` (no `204`); publish/transition rejections use `409 { message }`. Avoids changing the shared helper. |
| DEC-008 | Should console event routes key off `id` or `slug`? | Use the generated `id` for routing/params; keep `slug` for future public URLs. Mocks conflate the two; the live impl must not. |
| DEC-009 | Are console route/component tests in scope? | Add a minimal smoke test for the create-event entry point and publish wiring if a console test runner is stood up; otherwise rely on console typecheck + comprehensive API tests and record that here. |

## 10. Risks

- The current setup screens are centralized in a large `-event-setup-screens.tsx` file; live integration may be safer if data-loading and mutation code is extracted into route-specific helpers before heavy edits.
- Readiness and publish behavior touches future payment, registration, and public event modules; keep gates explicit and narrow to avoid building those domains early.
- If console route tests are still absent, API tests should be comprehensive and console typecheck/lint should be mandatory.
- The console shell (`_authenticated.tsx`) currently dead-ends approved organizers with zero events on a static card and only mounts the dashboard/setup shell when an `activeConsoleEvent` exists; the first-event entry point (TASK-058) and context refresh (TASK-059) must ship together or organizers cannot reach the new APIs.
- Concurrent editing of the same draft by multiple organizer members (e.g. Owner + Event Editor) has no optimistic-locking protection in this slice; last-write-wins is an accepted risk.
- Relaxing existing `NOT NULL` event columns to nullable is a one-way migration for the draft-first model; confirm the generated `0003` migration only drops NOT NULL and adds new columns, with no unintended drops.
