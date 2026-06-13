---
goal: Implement MVP-03 Public Participant Event Page
version: 1.0
date_created: 2026-06-12
owner: Corral Engineering
tags: feature, public-events, participant-web, ts-rest, vite, react, api
---

# Introduction

MVP-02 is complete: approved organizers can create event drafts, fill setup data, mark events ready, and publish events through live organizer APIs. The next slice is MVP-03: make published event setup data visible to unauthenticated participants in `apps/web`.

This plan converts the existing mock-built participant discovery/event screens into a live read-only public event experience. It deliberately does not implement registration submission, checkout, coupons, payments, tickets, results, or certificates. Those stay in later MVP slices.

## 1. Current state

### Completed foundations

- Better Auth is live for console/admin, but participant web remains unauthenticated by design.
- Organizer/Event domain is live:
  - event setup schemas/contracts
  - `event`, `event_category`, `event_fee_tier` schema/migration
  - organizer-scoped CRUD and publish workflow
  - readiness checks
  - console setup UI live wiring
- Published events now exist in the local/dev DB and have enough data for public display:
  - basics, venue, city, date/start time
  - categories and fee tiers
  - registration window
  - waiver/refund/medical/race instructions
  - contact email/phone

### Existing code surfaces

| Area | Files | Current state |
|---|---|---|
| Web app shell | `apps/web/src/routes/__root.tsx`, `main.tsx` | Mobile-first participant shell exists; React Query and TanStack Router are installed. |
| Web event pages | `apps/web/src/routes/events.$eventId*.tsx`, `-discovery-components.tsx`, `-register-components.tsx` | Full participant/event/registration UI exists, but it is mock-driven. |
| Web mocks | `apps/web/src/mocks/events.ts`, `types.ts`, `store.ts` | Mock event/category/registration shapes drive all participant screens. |
| Web API client | `apps/web/src/lib/api.ts` | Only initializes the health contract. No public event client exists. |
| Schema contracts | `packages/schema/src/contracts/*` | Has `console` and `health`; no public participant contract yet. |
| API modules | `apps/api/src/app.module.ts`, `console`, `health` | Has console and health modules; no unauthenticated public events module. |
| DB event data | `packages/db/src/schema/organizer.ts` | Event/category/fee data exists; public API must expose only safe published fields. |

## 2. Scope

### In scope

- Shared public event schemas and ts-rest contract.
- Unauthenticated public API endpoints:
  - list published public events for discovery/calendar/home
  - read one published event by organizer slug + event slug
- API service/controller/module for public events.
- Server-side filtering:
  - only approved-organizer events
  - only public-safe event statuses
  - no draft/ready/unpublished events
  - no hidden categories
  - no internal user IDs, readiness internals, payment-account state, or organizer admin metadata
- Derived public display data:
  - registration status: not open, open, closing soon, closed, sold out
  - active/visible categories
  - public fee tier information
  - lowest displayed fee
  - category capacity status from `capacity`, `registeredCount`, and category status
- Live web wiring for read-only participant routes:
  - `/`
  - `/calendar`
  - `/events/$organizerSlug/$eventSlug`
  - `/events/$organizerSlug/$eventSlug/details`
  - `/events/$organizerSlug/$eventSlug/policy/refund`
  - `/events/$organizerSlug/$eventSlug/policy/waiver`
  - `/events/$organizerSlug/$eventSlug/register/category`
- Preserve existing demo states for development QA without masking live fetch failures on default paths.
- Tests and validation for schema, API, and web read-only behavior.

### Out of scope

- Registration submission and participant record creation.
- Checkout, Razorpay, payment status, invoices, and webhooks.
- Coupons and discount redemption.
- Bulk/group registration.
- Participant account/profile, login, "My registrations", e-ticket, BIB, results, certificates.
- Public SEO/server-side rendering. This remains a Vite SPA in MVP.
- Branding upload/storage. Existing `logoUrl`/`bannerUrl` placeholders may be read if available, but storage is not implemented.
- Public event search, advanced filters, custom domains, and city-wide curated calendar admin tools.

## 3. Requirements

### Functional requirements

- REQ-001: Participants can open `/events/:organizerSlug/:eventSlug` without authentication.
- REQ-002: Only events safe for public display are returned.
- REQ-003: Draft and ready events must behave exactly like not-found on public routes.
- REQ-004: Events belonging to unapproved/rejected/suspended organizers must not be publicly visible.
- REQ-005: Public event detail must include participant-safe basics, venue, categories, fees, policies, instructions, organizer name, and support contact.
- REQ-006: Public category list must hide `hidden` categories.
- REQ-007: Public category cards must show fee, capacity/availability, min/max age, and sold-out state.
- REQ-008: Public pages must show registration status from the event registration window and category availability.
- REQ-009: Registration CTA must not imply completed registration support. It can lead to the live category-selection preview, but later registration steps remain explicitly deferred until MVP-04.
- REQ-010: Existing `?demo=` states remain available for visual QA.
- REQ-011: The home and calendar routes should use live published events on default paths and fall back to mock/demo data only for explicit demo states or local development fallbacks.

### Security and privacy requirements

- SEC-001: Public endpoints require no Better Auth session.
- SEC-002: Public endpoints expose no user IDs, organizer membership data, admin review notes, payment-account status, readiness internals, or private audit/payment fields.
- SEC-003: Missing, draft, ready, unapproved-organizer, and hidden events/categories must not leak existence through distinct public messages.
- SEC-004: Public API must not accept organizer IDs from the client for public reads; event lookup is by globally unique organizer slug plus organizer-scoped event slug.
- SEC-005: Public event response should be schema-validated through shared Zod contracts.
- SEC-006: No participant PII is collected or persisted in this slice.

### Product requirements

- PRD-001: Mobile-first event landing remains high-quality at 390px/414px.
- PRD-002: Event page shows name, date/time, venue, map link, summary/description, categories, fees, registration status, refund policy, waiver/medical copy, and contact info.
- PRD-003: Category page helps runners pick a distance but does not create a live registration yet.
- PRD-004: Empty calendar state is clear when no published events exist.
- PRD-005: English-only copy remains i18n-ready enough for later Tamil support.

## 4. Proposed API contracts

Add new public contract files:

- `packages/schema/src/contracts/public.schema.ts`
- `packages/schema/src/contracts/public.ts`

Export them from `packages/schema/src/index.ts`.

### `GET /public/events`

Purpose: public discovery/calendar list.

Query params:

- `city?: string`
- `limit?: number` default capped server-side

Response:

```ts
{
  events: PublicEventSummary[]
}
```

Public summary fields:

- `id`
- `slug`
- `title`
- `status`
- `city`
- `venueName`
- `startsAt`
- `registrationOpensAt`
- `registrationClosesAt`
- `organizerName`
- `summary`
- `bannerUrl`
- `lowestFeeInPaise`
- `categoryLabels`
- `registrationStatus`

### `GET /public/events/:organizerSlug/:eventSlug`

Purpose: one public event landing/details/category/policy payload.

Response:

```ts
{
  event: PublicEventDetail
}
```

Public detail fields:

- all summary fields
- `date`
- `timezone`
- `venueAddress`
- `mapUrl`
- `contactEmail`
- `contactPhone`
- `raceInstructions`
- `refundPolicy`
- `waiverText`
- `medicalDeclaration`
- `logoUrl`
- `categories`

Nullability:

- Non-null for public-visible published events: `title`, `status`, `city`, `venueName`, `venueAddress`, `date`, `startsAt`, `registrationOpensAt`, `registrationClosesAt`, `refundPolicy`, `waiverText`, and at least one support contact (`contactEmail` or `contactPhone`).
- Nullable and must stay nullable in schemas/UI: `description`, `mapUrl`, `contactEmail`, `contactPhone`, `raceInstructions`, `medicalDeclaration`, `logoUrl`, `bannerUrl`, category `minAge`, category `maxAge`, fee-tier `startsAt`, fee-tier `endsAt`, and fee-tier `registrationCap`.
- `summary` is derived from `description` when present; otherwise derive from title/city/venue copy. There is no DB `summary` column.
- Do not add or require `endsAt`; the current event table has race date/start only.

Public category fields:

- `id`
- `label`
- `distance`
- `minAge`
- `maxAge`
- `capacity`
- `registeredCount`
- `status`
- `availabilityStatus`
- `feeTiers`

Public fee tier fields:

- `id`
- `label`
- `amountInPaise`
- `startsAt`
- `endsAt`
- `registrationCap`
- `registrationCount`
- `isActive`

Notes:

- `event.slug` is only unique per organizer, so the public URL and API must use `organizer.slug + event.slug`.
- Do not use a bare `event.slug` lookup with `LIMIT 1`.
- Do not reuse `EventDetail` directly because it includes console/internal setup metadata.
- Public errors can reuse a simple `{ message: string }` schema.

## 5. Proposed API implementation

Add:

- `apps/api/src/public-events/public-events.module.ts`
- `apps/api/src/public-events/public-events.controller.ts`
- `apps/api/src/public-events/public-events.service.ts`
- `apps/api/src/public-events/public-events.service.spec.ts`

Wire `PublicEventsModule` into `AppModule`.

Service behavior:

1. Query event by `organizer.slug` and `event.slug`, and join organizer.
2. Require:
   - `event.status IN ('published', 'closed', 'completed')` for visibility. Initial MVP validation will use `published`; closed/completed are future-compatible public read states.
   - `organizer.review_status = 'approved'`.
3. For list endpoint, return upcoming/public-visible events ordered by start date.
4. For detail endpoint, fetch categories and fee tiers.
5. Exclude categories where `status = 'hidden'`.
6. Exclude inactive fee tiers from primary public display unless needed to show scheduled pricing. For MVP, return active tiers only and derive the displayed fee from the first active tier; document this so early-bird future tiers are a later pricing enhancement.
7. Derive:
   - `registrationStatus`
   - `availabilityStatus`
   - `lowestFeeInPaise`
8. Return 404 with the same message for missing/unpublished/unapproved records.

Derived status rules:

- Event registration status:
  - `not-open` when `registrationOpensAt` is future.
  - `open` when now is within window and at least one visible category is available.
  - `closing-soon` when closes within a configured short window and categories are available.
  - `closed` when closes in the past or event status is closed/completed.
  - `sold-out` when all visible categories are sold out/full.
- Category availability:
  - `hidden` is excluded.
  - `sold-out` if category status is `sold-out` or `registeredCount >= capacity`.
  - `available` otherwise.

Notes:

- Because registration persistence is not implemented yet, `registeredCount` normally remains `0`; count-based sold-out is future-compatible and should be unit-tested with seeded rows, while live MVP sold-out is driven by organizer-set category status.
- Use `startsAt`, `registrationOpensAt`, and `registrationClosesAt` for all date/time math. These are stored as ISO-like text with offsets in current console writes; tests should keep status helpers pure and inject `now`.
- Local/prod participant web origins must be present in `CORS_ORIGINS`; local web runs on `http://localhost:5273`.

## 6. Proposed web implementation

### Public API client

Update `apps/web/src/lib/api.ts`:

- keep health client or expose both health and public clients
- initialize `publicContract`
- no credentials required for public endpoints

Add mapping helpers:

- `apps/web/src/lib/public-events.ts`

Responsibilities:

- convert `PublicEventSummary` and `PublicEventDetail` to existing web display models where practical
- avoid duplicating money/date/category logic across routes
- introduce a dedicated `PublicDisplayEvent`/adapter instead of forcing live data into the current mock `Event` type
- handle DB-to-UI differences explicitly:
  - distance is free text, not the mock `"5K" | "10K" | "21K"` union
  - venue is stored as `venueName` + free-text `venueAddress`, not structured address fields
  - money is paise in the API and rupees in current web utilities
  - DB category statuses differ from participant UI availability labels
  - `heroImageAlt`, `includes`, and sponsor chips need safe derived/default copy until those fields exist

### Route loader/query strategy

Use TanStack Router loaders with the existing `QueryClient` context:

- home/calendar list: `publicEventsQueryOptions()`
- event detail routes: `publicEventQueryOptions(slug)`

Default behavior:

- `demo` absent/default -> live API.
- explicit demo state -> keep current mock-driven UI state.
- API 404 -> route not found.
- API/network error -> route error component or local empty/error state.

### Routes to wire live

1. `/`
   - Replace hardcoded featured mock with first live public event when available.
   - Empty state when no events exist.
   - Keep health card behavior if still present.

2. `/calendar`
   - Use live list endpoint.
   - Preserve existing card design and empty/loading/error states.

3. `/events/$organizerSlug/$eventSlug`
   - Treat params as globally unique organizer slug plus event slug.
   - Render live landing with event status/availability.
   - Register CTA behavior:
     - enabled only when registration status is open/closing soon and at least one category is available
     - routes to `/events/$organizerSlug/$eventSlug/register/category`
     - later steps beyond category remain deferred to MVP-04

4. `/events/$organizerSlug/$eventSlug/details`
   - Render description, race instructions, support contact, venue/map from live fields.

5. `/events/$organizerSlug/$eventSlug/policy/refund`
   - Render live `refundPolicy`.

6. `/events/$organizerSlug/$eventSlug/policy/waiver`
   - Render live `waiverText` and `medicalDeclaration`.

7. `/events/$organizerSlug/$eventSlug/register/category`
   - Use live event categories and active fees.
   - Continue CTA should be disabled or explicitly labeled as "Registration capture coming next" to avoid navigating live slugs into still-mock downstream registration routes.

### Demo fallback policy

- Keep `?demo=loading`, `?demo=empty`, `?demo=error`, `?demo=offline`, etc. for visual QA.
- Do not silently fall back to mock data on default live paths after the API returns an error.
- In local development only, a clearly labeled "demo event" link can remain on the home page for screen QA.

## 7. Testing plan

### Schema/package validation

- Add schema tests or type coverage if the repo pattern exists.
- Run:
  - `corepack pnpm --filter @corral/schema build`
  - `corepack pnpm --filter @corral/schema typecheck`
  - `corepack pnpm --filter @corral/schema lint`

### API tests

Add `public-events.service.spec.ts` coverage:

- returns published approved-organizer event by slug
- returns the correct event when two approved organizers use the same event slug
- returns 404 for draft/ready event
- returns 404 for unapproved organizer
- excludes hidden categories
- derives sold-out category from count/capacity
- derives event-level open/closed/sold-out/not-open statuses
- returns list of public events ordered by date
- does not include internal fields in public response shape

Run:

- `corepack pnpm --filter @corral/api typecheck`
- `corepack pnpm --filter @corral/api lint`
- `corepack pnpm --filter @corral/api test`

### Web tests

Add focused route/component tests if practical:

- landing renders live event from mocked public API response
- not-found for unpublished/missing event
- category route renders live categories/fees
- demo state still renders mock loading/empty/error states

Run:

- `corepack pnpm --filter @corral/web typecheck`
- `corepack pnpm --filter @corral/web lint`
- `corepack pnpm --filter @corral/web test`
- `corepack pnpm --filter @corral/web e2e` if local app/API test harness is available or existing Playwright test remains compatible

### Manual browser validation

With API and web running:

1. Publish an event from the console.
2. Open `http://localhost:5273/events/:organizerSlug/:eventSlug`.
3. Confirm draft/ready events are not publicly visible.
4. Confirm landing, details, refund, waiver, and category pages show live event setup data.
5. Confirm hidden categories are absent.
6. Confirm sold-out/closed/not-open states disable registration CTA.
7. Confirm browser console/network is clean except expected dev-mode messages.

## 8. Implementation tasks

### Phase 1 - Contracts

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-001 | Add `public.schema.ts` with public event summary/detail/category/fee/status schemas and explicit nullability. | Yes | 2026-06-12 |
| TASK-002 | Add `public.ts` ts-rest router with list/detail public event endpoints using `organizerSlug + eventSlug` for detail. | Yes | 2026-06-12 |
| TASK-003 | Export public schemas/contracts from `packages/schema/src/index.ts`. | Yes | 2026-06-12 |

### Phase 2 - API

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-010 | Add public-events module/service/controller and wire into `AppModule`. | Yes | 2026-06-12 |
| TASK-011 | Implement list published events with approved-organizer filtering and public-safe mapping. | Yes | 2026-06-12 |
| TASK-012 | Implement event detail by organizer slug + event slug with category/fee loading and hidden-category filtering. | Yes | 2026-06-12 |
| TASK-013 | Implement derived registration/category availability status helpers. | Yes | 2026-06-12 |
| TASK-014 | Add API tests for visibility, filtering, derived status, and response shape. | Yes | 2026-06-12 |

### Phase 3 - Web live data

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-020 | Update `apps/web/src/lib/api.ts` to expose public event client. | Yes | 2026-06-12 |
| TASK-021 | Add public event query/mapping helpers and a dedicated `PublicDisplayEvent` adapter for web routes. | Yes | 2026-06-12 |
| TASK-022 | Wire home and calendar to live public event list. | Yes | 2026-06-12 |
| TASK-023 | Migrate in-scope public event route params to `organizerSlug + eventSlug` and wire landing/details/refund/waiver routes to live detail. | Yes | 2026-06-12 |
| TASK-024 | Wire category selection route to live categories/fees while disabling or clearly deferring downstream registration submission. | Yes | 2026-06-12 |
| TASK-025 | Preserve explicit demo states without masking default live API failures. | Yes | 2026-06-12 |

### Phase 4 - Validation and docs

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-030 | Run schema/API/web typecheck, lint, and tests. | Yes | 2026-06-12 |
| TASK-031 | Browser-validate a published event, hidden unpublished event, and CTA disabled states. | Yes | 2026-06-12 |
| TASK-032 | Update `docs/product-progress.md` with MVP-03 status/evidence. | Yes | 2026-06-12 |
| TASK-033 | Update this implementation plan with final evidence after implementation. | Yes | 2026-06-12 |

## 8.1 Implementation evidence

- Added public contracts/schemas in `packages/schema/src/contracts/public*.ts`.
- Added anonymous API module/controller/service in `apps/api/src/public-events` and wired it into `AppModule`.
- Added public event service tests for approved published visibility, duplicate slug lookup by organizer slug + event slug, 404 hiding, hidden-category exclusion, sold-out derivation, and public-safe response shape.
- Added participant web public client/adapter in `apps/web/src/lib/public-events.ts`.
- Wired live participant routes for home, calendar, landing, details, refund, waiver, and category preview.
- Preserved explicit `?demo=` states while default routes use live public API data.
- Opus 4.8 reviewed the implementation, found three availability/empty-state/fee-tier issues, and re-reviewed the fixes with no remaining blockers.

Validation commands:

- `corepack pnpm --filter @corral/schema build`
- `corepack pnpm --filter @corral/schema typecheck`
- `corepack pnpm --filter @corral/schema lint`
- `corepack pnpm --filter @corral/api typecheck`
- `corepack pnpm --filter @corral/api lint`
- `corepack pnpm --filter @corral/api test`
- `corepack pnpm --filter @corral/web build`
- `corepack pnpm --filter @corral/web typecheck`
- `corepack pnpm --filter @corral/web lint`

Manual browser validation:

- `http://localhost:5273/calendar` showed live public events and correct sold-out/opening-soon status labels.
- `http://localhost:5273/events/kovai-road-runners/browser-validation-10k` showed live landing data, opening-soon status, and disabled registration CTA.
- Details, waiver, and refund pages showed live setup copy and disabled CTA for not-yet-open registration.
- Category preview showed live category/fee data and explicitly deferred registration submission to MVP-04.
- Missing public event returned API 404 `{ "message": "Event was not found." }` and rendered the participant not-found page.

## 9. Decisions and open questions

| ID | Decision | Recommendation |
|---|---|---|
| DEC-001 | Which route identifier should public pages use? | Use `/events/:organizerSlug/:eventSlug` because event slugs are only unique per organizer. Do not use bare event slug lookup. |
| DEC-002 | Should registration be live in this slice? | No. MVP-03 is read-only public event discovery/detail/category selection. MVP-04 owns registration persistence. |
| DEC-003 | Should closed/completed events be public? | Keep service helper future-compatible for `closed`/`completed`, but initial validation focuses on `published`. Registration CTA is disabled outside open windows. |
| DEC-004 | Should inactive/future fee tiers be public? | Start with active fee tiers only to avoid exposing confusing pricing rules. Add full early-bird schedule when coupon/pricing domain is implemented. |
| DEC-005 | Should public API reuse console `EventDetail`? | No. Create a public DTO so internal console fields never leak by accident. |
| DEC-006 | Should default web routes fall back to mocks on API failure? | No. Mocks stay for explicit `?demo=` states; default live paths should surface real loading/error/not-found behavior. |

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Public route leaks unpublished event existence. | Use identical 404 for missing, draft, ready, and unapproved organizer events. |
| Existing mock web routes assume fields not present in DB. | Add mapping helper with safe defaults and update UI copy to use live fields. |
| Registration CTA implies full checkout exists. | Keep route to category selection only, or explicitly label next steps as coming in MVP-04. |
| Public list may be empty on fresh local DB. | Validation should seed/publish an event through existing console flow. |
| Date/capacity status becomes flaky in tests. | Inject/parameterize `now` in pure status helper tests. |
