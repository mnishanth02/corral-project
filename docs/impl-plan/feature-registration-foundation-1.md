# MVP-04 — Registration foundation implementation plan

> Status: `Planned` · Source spec: `docs/implementation-plan.md#12-registration` · Tracker row: MVP-04
> Depends on: MVP-02 (event/category/fee model), MVP-03 (public event live wiring).
> Review: request Opus 4.8 review of this plan before implementation.

## Problem

Published events are now live end-to-end: the participant web app reads real published
events/categories/fee tiers from `/public/events/...` (MVP-03), and the console can create and
publish events (MVP-02). But the participant **registration flow is still 100% mock** — every step
(`/events/$eventId/register/*`) reads from `apps/web/src/mocks` and persists nothing. There is no
`registration` table, no registration contract, and no API to capture a runner. The live category
picker (`events.$organizerSlug.$eventSlug.register.category.tsx`) deliberately disables its Continue
button with "Registration submission starts in MVP-04".

This slice builds the **foundation**: a real, server-validated, persisted **single individual
registration** for a published event, wired into the participant web flow, reaching a
`pending_payment` state, and observable from a minimal organizer-scoped read endpoint.

## Proposed scope (MVP-04 foundation)

Build the minimum that turns public event/category interest into a **persisted, validated
participant registration**:

1. **Data model** — `registration` table (+ Drizzle migration) capturing: target event/category/fee
   tier, standard participant fields, consent flags with timestamps, optional guardian record for
   minors, status lifecycle, and an idempotency key. Capacity counters on category/fee tier are
   incremented under a transaction.
2. **Contracts** — a new `registration` ts-rest contract in `packages/schema` for the anonymous
   participant submit endpoint and a draft-availability/quote endpoint, plus an organizer-scoped
   read contract for the console.
3. **API** — a NestJS `registrations` module: anonymous `POST` submit with full server-side
   validation (event published, category active & eligible by age, fee tier active, capacity
   available, required consents present, guardian required for minors), capacity-safe persistence,
   **per-IP rate limiting**, and an organizer-scoped read list **plus a cancel/release action**.
   Regression tests for the validation matrix.
4. **Participant web wiring** — unify the register flow onto slug-based routing, carry live event
   context through the wizard, replace `mockMutate` form submission with a real API call, and land
   on a truthful "reserved · pending payment" success state.
5. **Minimal console visibility** — read-only organizer-scoped registrations list endpoint **+ a
   cancel action** (status → `cancelled`, releases held capacity) + a thin console screen (or extend
   an existing one) so persisted registrations are observable and slots are recoverable before
   payments exist. Full roster (search/filter/sort/CSV/correction/T-shirt summary) stays in MVP-10.

### Standard fields captured (per spec §1.2)

name (first/last), gender, date of birth (drives age group + minor check), mobile, email, emergency
contact (name + phone), distance/category, T-shirt size, club/team (optional), medical declaration
(checkbox), waiver acceptance, DPDP/privacy consent. Optional marketing/comms consent. Collect the
minimum needed.

### Explicitly deferred (NOT in this slice)

- **Payments / confirmation** (MVP-08): no Razorpay, no webhook. Registrations stop at
  `pending_payment`; the `confirmed` transition is modeled but only driven later by the payment port.
- **Coupons / early-bird discount application** beyond selecting the currently-active fee tier
  (MVP-06). The server picks the active tier and quotes its amount; no discount math.
- **Bulk / group / coordinator registration** (MVP-05).
- **Spot / cash / offline capture** (MVP-07).
- **Insurance add-on** (MVP-22) — the mock insurance step is bypassed/hidden in the live flow.
- **Full organizer roster** — search, filter, sort, CSV import/export, manual correction, T-shirt
  summary, timing export (MVP-10/11/12).
- **BIB assignment** (MVP-13), results, certificates, e-ticket/`my registrations` live data (later).
- **Participant accounts** — registration stays anonymous per DEC-003; contact info is captured but
  no login/profile is created.

## Current codebase findings

### Data layer (`packages/db`)
- Drizzle pg schema in `packages/db/src/schema/organizer.ts`: `event`, `eventCategory`,
  `eventFeeTier` already exist. `eventCategory` has `capacity`, `registeredCount` (default 0),
  `status` ∈ `active|hidden|sold-out`, optional `minAge`/`maxAge`. `eventFeeTier` has
  `amountInPaise` (>0 check), `isActive`, `registrationCap`, `registrationCount`, optional
  `startsAt`/`endsAt`. `event` has `formFields[]`, `tshirtSizes[]`, `medicalDeclaration`,
  `waiverText`, `registrationOpensAt/ClosesAt`, `status` ∈ `draft|ready|published|closed|completed`.
- Migrations live in `packages/db/drizzle/0000..0003_*.sql`; the next one is `0004_*`. Migrations are
  generated via drizzle-kit and applied locally before validation (MVP-02/03 precedent).
- **No `registration` table exists.** `registeredCount` / `registrationCount` are currently static
  (never incremented).

### Contracts (`packages/schema`)
- ts-rest + zod. `public.ts`/`public.schema.ts` (anonymous read), `console.ts`/`console.schema.ts`
  (organizer/admin), `health.*`. `packages/schema/src/index.ts` re-exports each contract.
- `eventFormFieldSchema` lives in `console.schema.ts` and is reused by public detail. Reuse it for the
  registration form-field gating.

### API (`apps/api`)
- NestJS modules: `public-events` (anonymous, uses `@AllowAnonymous()` + `@TsRestHandler`), `console`
  (organizer/admin, auth-guarded via Better Auth + `console-context.service`), `health`, `auth`.
- `public-events.controller.ts` shows the anonymous ts-rest pattern; service throws a typed
  `PublicEventsApiError { status, message }` mapped by a `withPublicErrors` wrapper.
- The console module shows the organizer-scoped pattern: resolve caller → organizer membership via
  `console-context.service`, enforce ownership, return typed errors (e.g. 409 "Only draft events can
  be changed.").

### Participant web (`apps/web`)
- **Two competing register entry points (must unify):**
  - LIVE: `events.$organizerSlug.$eventSlug.register.category.tsx` — reads real categories/fees via
    `publicApiClient.getEvent`; Continue **disabled** ("starts in MVP-04"). This is the route the
    live event landing page links to (`registerPath()` → `publicEventPath(event, "/register/category")`).
  - MOCK: `events.$eventId.register.{tsx,category,form,waiver,guardian,insurance,summary,payment,processing,success,failed}.tsx`
    — full 6-step wizard, but reads `participantEvents` mock via `findEvent(eventId)` and persists to
    `localStorage` through `RegistrationFlowProvider`/`useRegistrationFlow` (`src/mocks/store.ts`).
    Every mutation is `mockMutate()`; the mock flow is currently **orphaned** (no link from live data).
- `src/lib/api.ts` exposes `publicApiClient`; `src/lib/public-events.ts` has `fetchPublicEvent` +
  `PublicDisplayEvent` adapter. We add a `registrationApiClient` (or extend) + a `registrations.ts`
  helper here.
- Wizard shared UI in `-register-components.tsx` (`WizardLayout`, step tracker, `?demo=` handling) is
  reusable; only the data source and submit action change.

### Key consequence
The mock wizard is keyed by `$eventId` and seeded participant data; the live flow is keyed by
`$organizerSlug/$eventSlug` with no participant data. Unifying routing + threading live event context
into the wizard is the largest web task, not the API.

## Data model

New table `registration` (Drizzle, `packages/db/src/schema/organizer.ts` or a new
`registration.ts` imported by `schema/index.ts`):

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `reg-<uuid>` |
| `eventId` | text FK→event(id) **RESTRICT** | indexed; block hard-deleting an event that has registrations (PII/financial record) |
| `categoryId` | text FK→event_category(id) **RESTRICT** | indexed |
| `feeTierId` | text FK→event_fee_tier(id) **RESTRICT** | the active tier resolved at submit |
| `organizerId` | text FK→organizer(id) **RESTRICT** | denormalized for organizer-scoped reads/indexing; **set from the server-resolved event, never client input** |
| `status` | text | `pending_payment` \| `confirmed` \| `cancelled` \| `expired`; default `pending_payment`; check constraint |
| `amountInPaise` | integer | quoted fee snapshot at submit (>0 check) |
| `firstName`,`lastName` | text notNull | |
| `gender` | text notNull | check ∈ allowed set (`male`,`female`,`other`,`prefer-not-to-say`) |
| `dateOfBirth` | text notNull | ISO `YYYY-MM-DD`; drives age group + minor check; format guarded by a CHECK regex |
| `phone` | text notNull | |
| `email` | text notNull | |
| `emergencyContactName` | text notNull | |
| `emergencyContactPhone` | text notNull | |
| `tshirtSize` | text | nullable; must be one of event's `tshirtSizes` when set |
| `clubName` | text | nullable/optional |
| `medicalDeclarationAccepted` | boolean notNull | must be true at submit |
| `waiverAccepted` | boolean notNull | must be true at submit |
| `dpdpConsentAccepted` | boolean notNull | must be true at submit |
| `marketingConsent` | boolean notNull default false | optional |
| `consentRecordedAt` | timestamptz notNull | when consents were captured |
| `guardianName` | text | required iff participant is a minor |
| `guardianRelationship` | text | required iff minor |
| `guardianPhone` | text | required iff minor |
| `guardianConsentAccepted` | boolean notNull default false | must be true iff minor |
| `idempotencyKey` | text **notNull** | client-supplied **UUID** (validated in zod; generated server-side if absent); unique per event to dedupe double-submits |
| `createdAt`,`updatedAt` | timestamptz | defaults |

Indexes/constraints:
- `unique(event_id, idempotency_key)` — dedupe retries/double clicks. `idempotency_key` is
  **NOT NULL** (Postgres treats NULLs as distinct, which would silently disable dedupe).
- `index(organizer_id, created_at)`, `index(event_id, status)`, `index(category_id)`.
- `status` check; `gender` check; `amount_in_paise > 0` check; `date_of_birth` format CHECK regex.
- Guardian completeness enforced in service logic (cross-field), optionally backed by a partial CHECK
  ("if any guardian field present → all present and `guardian_consent_accepted` true").

**Capacity accounting decision (reviewed):** on successful submit, within one `queryClient.begin`
transaction, increment `event_category.registered_count` and `event_fee_tier.registration_count`
using **race-safe conditional UPDATEs** (single statement, check affected rows — not read-then-write):

```sql
UPDATE event_category
SET registered_count = registered_count + 1, updated_at = NOW()
WHERE id = $categoryId AND registered_count < capacity
RETURNING id;
-- rows.length !== 1 → throw 409 "This category is sold out."
```

The fee-tier increment uses `registration_count < registration_cap` only when `registration_cap` is
non-null (unconditional otherwise). Both increments **and** the `INSERT` run in the same transaction
so a fee-tier failure or an idempotency unique-violation rolls the category increment back
(guaranteeing "incremented exactly once"). A `pending_payment` registration therefore **holds a
slot**.

**Release valve (added per review):** because payments are deferred, the slice ships an
organizer-scoped **cancel** action (status → `cancelled`, decrement both counters in the same
transaction, guarded against double-decrement) so held slots are recoverable in-product and the
registration→roster loop is demonstrable/repeatable before MVP-08. Abandoned-hold **auto-release**
(expiry sweeper) remains deferred to MVP-08; the `expired` status value is reserved for it.
Alternative considered: don't increment until `confirmed` — rejected because without payments nothing
would ever confirm, leaving capacity meaningless and oversell trivial.

## Contracts (`packages/schema`)

New `registration.schema.ts` + `registration.ts`, re-exported from `index.ts`.

- `registrationSubmitRequestSchema` — categoryId, feeTierId (optional; server re-resolves/validates),
  participant fields, consents, optional guardian block, `idempotencyKey`.
- `registrationQuoteRequestSchema` / `registrationQuoteResponseSchema` — given category (+DOB for
  eligibility), return the resolved active fee tier, `amountInPaise`, eligibility, remaining capacity,
  whether guardian is required. Lets the web summary show a trustworthy price before submit.
- `registrationResponseSchema` — created registration (id, status `pending_payment`, amount, masked
  contact echo, category/event refs). Anonymous-safe (no internal fields).
- `organizerRegistrationListResponseSchema` — minimal rows for console read (name, category, status,
  amount, createdAt, contact). Lives on the **console** contract (organizer-scoped), not public.

Anonymous participant contract (`registrationContract`, public/anonymous):
- `POST /public/events/:organizerSlug/:eventSlug/registrations` → **201** new
  `registrationResponseSchema`; **200** idempotent replay (existing registration for the same
  `(event, idempotencyKey)`); errors 404 (event not found/unpublished), 409 (sold out / capacity / window
  closed), 422 (validation: ineligible age, missing consent, missing guardian, bad/tampered tier).
- `POST /public/events/:organizerSlug/:eventSlug/registrations/quote` → 200 quote; 404/422.
- `idempotencyKey` is a required `z.string().uuid()` (server generates one if the client omits it).

Console contract additions (extend `consoleContract`, organizer-scoped):
- `GET /console/organizers/:organizerId/events/:eventId/registrations` → 200 list; 401/403/404.
- `POST /console/organizers/:organizerId/events/:eventId/registrations/:registrationId/cancel` → 200
  cancelled registration (releases capacity); 401/403/404; 409 if already cancelled.

Use `strictStatusCodes`, mirror existing error envelope (`errorResponseSchema { message }`). Because
`strictStatusCodes` is on, the submit response map must list both 200 and 201 for the replay path.

## API (`apps/api/src/registrations`)

New module `registrations.module.ts`, `registrations.controller.ts`, `registrations.service.ts`,
`registrations.service.spec.ts`; registered in `app.module.ts`.

Submit handler (`@AllowAnonymous()`) validation order (typed `RegistrationApiError { status, message }`,
mapped like `withPublicErrors`):
1. Resolve organizer by slug + event by slug; **must be `published` and organizer `approved`** (reuse
   MVP-03 visibility rules) else 404.
2. Registration window: reject if `registrationOpensAt` in future or `registrationClosesAt` passed.
   **Reuse the exact `computeAvailability`/`parseTime` logic from `public-events.service.ts`** (these
   are nullable `text` columns) so the event-page CTA and submit agree by construction; extract the
   shared helper. Return 409 when the window is closed.
3. Category exists, belongs to event, `status = active`, not hidden (else 404/409).
4. Age eligibility: compute age at event `date` (fallback today) from DOB; enforce category
   `minAge`/`maxAge` (422 with clear message).
5. Minor rule: if age < 18, guardian block required and `guardianConsentAccepted` true (422).
   Guardian consent here is **captured, not verified** — verifiable parental consent (guardian
   OTP/email) is deferred; this slice does not claim DPDP "verifiable consent" completeness.
6. Fee tier: resolve the **currently active** tier for the category (server-authoritative; ignore
   client-quoted price for security); if client sent a `feeTierId` that isn't the active one, 422/409.
   No active tier → 409.
7. Consents: medical + waiver + DPDP all true (422).
8. T-shirt size (if provided) ∈ event `tshirtSizes` (422).
9. Idempotency: if `(eventId, idempotencyKey)` already exists, return the existing registration with
   **status 200** (not a duplicate). Additionally **catch the unique-constraint violation inside the
   persist transaction** (concurrent same-key submit) and re-fetch the winning row → 200, so racers
   get an idempotent hit instead of a 500.
10. Persist in one `queryClient.begin` transaction: race-safe conditional increments on category +
    fee tier (single-statement UPDATE … WHERE … RETURNING, check affected rows); insert registration
    with `amountInPaise` snapshot and `consentRecordedAt`; `organizerId` taken from the server-resolved
    event. If a capacity guard affects 0 rows → 409 "This category is sold out."

**Abuse protection (added per review):** `POST .../registrations` and `.../registrations/quote` are
anonymous and write PII while consuming capacity, so they are a denial-of-inventory + PII-spam vector.
Add **per-IP rate limiting** (e.g. `@nestjs/throttler` or equivalent — none exists in the stack yet)
on both routes this slice; captcha/Turnstile is the documented deferred follow-up.

Quote handler mirrors steps 1–6/8 without writing.

Cancel handler (organizer-scoped, reuse `console-context.service` ownership check): set status →
`cancelled` and decrement both counters in one transaction, guarded against double-decrement (only a
`pending_payment`/`confirmed` row releases; a second cancel is a 409 no-op).

Console list handler: organizer-scoped; returns minimal rows ordered by `createdAt desc`.

Tests (`*.service.spec.ts`) cover the validation matrix: happy path; unpublished/unapproved → 404;
window closed; hidden/sold-out category; under-age & over-age; minor without guardian; missing each
consent; inactive/no fee tier; price-tamper attempt; **idempotent retry returns 200 with the same
record; concurrent same-key submit resolves to one record (unique-violation caught → 200, counters
incremented exactly once)**; capacity exhaustion → 409 and counters incremented exactly once; **cancel
releases capacity exactly once and a second cancel is a 409 no-op**.

## Participant web wiring (`apps/web`)

1. **Unify routing onto slugs.** Make `events.$organizerSlug.$eventSlug.register.*` the canonical
   wizard (category → form → guardian(if minor) → consent/waiver → summary → success). Migrate the
   mock `$eventId` steps' UI into slug-based routes (or add slug-based step routes that consume the
   live event). Remove/redirect the orphaned `$eventId` register routes, or keep them only for
   `?demo=` visual QA. Decision recorded below.
2. **Thread live event context via a shared layout loader.** The wizard steps are separate routes
   (`category`/`form`/`guardian`/`summary`) and flow state lives in localStorage
   (`RegistrationFlowProvider`). Load the live event (`fetchPublicEvent`) **and the server quote at the
   register layout route** (`events.$organizerSlug.$eventSlug.register`) so every step — including a
   deep-linked `/summary` or `/guardian` — has real categories, `formFields`, `tshirtSizes`,
   `waiverText`, `medicalDeclaration`, age bounds, and the active fee tier. Define stale-state
   behavior: if the stored category is now hidden/sold-out, the event unpublished mid-flow, or DOB
   changes minor↔adult, revalidate at the summary step and redirect/repair rather than dead-ending
   (the server re-validates at submit regardless).
3. **Form fields & guardian gating.** Honor the event's `formFields[]` gating (e.g. DOB, emergency
   contact toggles from console form setup) and `tshirtSizes[]`; client-side validation mirrors
   server rules but the server stays authoritative. The **guardian step is conditional on flow DOB** —
   render/route to it only when the participant is a minor; redirect away otherwise (server still
   enforces the rule at submit).
4. **Replace `mockMutate`** in the form/summary submit with a real `registrationApiClient` POST
   (with a generated `idempotencyKey` persisted in the flow store to survive retries). Enable the
   live category Continue button.
5. **Summary** shows the server **quote** amount, not a client-computed price. Coupon/insurance UI is
   hidden/disabled (deferred).
6. **Success** lands on a truthful **"Spot reserved · payment pending"** state (since MVP-08 isn't
   built), not "confirmed". Do not navigate into the mock `my/registrations` confirmed view; show a
   reference id and "we'll share payment + confirmation next" copy.
7. Preserve explicit `?demo=` states for visual QA without masking real API failures (MVP-03 pattern).

## Minimal console visibility (`apps/console`)

- Add the organizer-scoped `GET .../events/:eventId/registrations` to `consoleApiClient` usage and a
  thin **read-only** registrations list (extend the event setup/operational area, e.g. a
  "Registrations" tab/screen). Columns: name, category, status, amount, created. The only mutation is
  a **cancel** action (`POST .../registrations/:id/cancel`) that releases a held slot. No export,
  search, filter, or correction — those are MVP-10. This exists so the registration loop is
  observable, testable, and recoverable before payments.

## Routing decision (to confirm in review)

Canonicalize on `/events/$organizerSlug/$eventSlug/register/*`. Event slugs are only unique per
organizer (MVP-03 rationale), so slug-based register routes are consistent with the live event page
and avoid leaking internal event ids. The `$eventId` mock routes are either deleted or retained only
behind `?demo=` for design QA. Final call captured during implementation; default = delete/redirect.

## Todos

1. [ ] `registration` schema + Drizzle migration `0004_*` (FKs RESTRICT, NOT NULL UUID idempotency key, DOB/status/gender checks); export from `schema/index.ts`; apply locally.
2. [ ] `registration` ts-rest contracts (submit w/ 200+201, quote, response) + console registrations list & cancel contracts; re-export.
3. [ ] `registrations` API module (controller/service): validation matrix, shared availability helper, race-safe transactional persist + idempotency unique-violation catch, per-IP rate limiting; console list + cancel handlers.
4. [ ] API regression tests for the full validation/capacity/idempotency/concurrency/cancel matrix.
5. [ ] Web: unify register routing to slugs, shared layout loader (event + quote), conditional guardian, wire submit + quote + idempotency key, enable Continue, truthful pending-payment success.
6. [ ] Console: minimal read-only registrations list + cancel action wired to the live endpoints.
7. [ ] Validate: schema build/typecheck/lint; API typecheck/lint/test; web + console build/typecheck/lint; browser E2E (register a real runner on a published event, see capacity increment + console row, then cancel to release).
8. [ ] Update `docs/product-progress.md` (MVP-04 → status), this plan's checkboxes, and add validation evidence.

## Validation strategy

- Unit/integration: `apps/api` service spec covers the validation matrix and exact-once capacity
  increments; idempotent retry returns same record.
- Commands (per changed workspace, matching MVP-02/03): schema build/typecheck/lint; API
  typecheck/lint/test; web/console build/typecheck/lint.
- Browser E2E against the running dev stack with seeded data: open a published event
  (`race-course-night-10k-2026` or `browser-validation-10k`), complete the register wizard, submit,
  confirm 201 + `pending_payment`, verify `registered_count`/`registration_count` incremented (public
  detail availability reflects it), confirm the registration appears in the console registrations
  list, and verify guardian/age/consent rejections surface correct errors.
- Confirm anonymous endpoints don't leak internal/console fields and require no auth; confirm the
  console list requires organizer ownership.

## Opus 4.8 review — resolutions

Reviewed before implementation (verdict: *ready with the should-fix changes; approach sound*). All
Critical/Should-fix items are now folded into the sections above:

- **C1 — anonymous endpoint abuse / denial-of-inventory** → per-IP **rate limiting** added to submit +
  quote this slice (captcha deferred). See API §"Abuse protection".
- **S1 — idempotency hardening** → key is **NOT NULL `uuid`**, server-generated if absent; replay
  returns **200**; concurrent same-key submit **catches the unique-constraint violation → re-fetch →
  200** (no 500). Contract lists 200+201.
- **S2 — FK `onDelete` coherence** → `eventId`/`categoryId`/`feeTierId`/`organizerId` all **RESTRICT**
  (block hard-deleting an event/category/tier with registrations).
- **S3 — capacity release valve** → organizer-scoped **cancel** action (status → `cancelled`,
  decrement counters once) ships this slice; auto-expiry still deferred to MVP-08.
- **S4 — race-safe capacity guard** → single-statement **conditional `UPDATE … WHERE registered_count
  < capacity RETURNING`** with affected-row check, all in one `queryClient.begin` transaction.
- **S5 — window check parity** → submit/quote **reuse `computeAvailability`/`parseTime`** from
  `public-events.service.ts` via a shared helper so CTA and submit agree.
- **S6 — web data context** → live event + quote loaded at the **register layout route**; stale-state
  revalidation at summary; guardian step conditional on DOB.
- **S7 — DPDP wording** → guardian consent is **captured, not verified**; verifiable consent deferred,
  explicitly not claimed complete.
- Optional: duplicate-person registration intentionally out of scope (O1); DOB format CHECK + optional
  guardian partial CHECK (O2); summary reconciles quote→submit price drift gracefully (O3); PII stored
  plaintext matching existing patterns, field-level encryption deferred (O4); `organizerId`
  denormalization approved and set from server-resolved event (O5).

## Risks & open questions (resolved in review unless noted)

1. **Capacity holds without payment** — RESOLVED: hold on `pending_payment` + organizer **cancel**
   release valve this slice; auto-expiry deferred to MVP-08 (documented).
2. **Confirmation semantics** — RESOLVED: participant outcome is "reserved · pending payment"; the
   cancel action (not a fake confirm) makes the registration→roster loop demonstrable before MVP-08.
3. **Routing migration blast radius** — OPEN (execution risk): unifying the wizard onto slugs touches
   ~11 mock route files + the wizard layout. Mitigation: shared layout loader, keep/scope `?demo=`
   states explicitly. Largest implementation risk; sequence API-first, then web.
4. **Idempotency strategy** — RESOLVED: required UUID key + unique-violation catch (see S1).
5. **PII/DPDP minimization** — RESOLVED for MVP: capture minimum needed; plaintext at rest matches
   existing patterns; field-level encryption/retention deferred (O4); guardian verification deferred (S7).
6. **Age reference date** — DECIDED: compute age at event `date` (today fallback) to match age-group intent.
7. **Console surface placement** — DECIDED: thin read-only list + cancel now (testability); full roster MVP-10.

## Notes & decisions

- Registration is **anonymous** (DEC-003): capture contact info, create no participant account.
- Price is **server-authoritative**: the active fee tier and `amountInPaise` are resolved server-side
  and snapshotted; the client cannot dictate price.
- `confirmed`/`expired` statuses are modeled now but only driven later (MVP-08 payments / release).
- This slice is the foundation the roster (MVP-10), payments (MVP-08), coupons (MVP-06), bulk
  (MVP-05), and BIB (MVP-13) slices build on; keep the model forward-compatible and avoid leaking
  payment/coupon assumptions into the core registration record beyond the `amountInPaise` snapshot.
