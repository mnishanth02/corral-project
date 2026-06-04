# Corral — Product Progress Tracker

> Single source of truth for **what has been planned, built, validated, blocked, or deferred** across
> the Corral product. Future AI agents must read this file before starting implementation work.

Last updated: **2026-06-03**

---

## 1. How to use this tracker

### Required agent workflow

Before starting any Corral feature work:

1. Read this file.
2. Read the source strategy/spec docs linked from the relevant row.
3. Read the feature implementation plan in `docs/impl-plan/`, if one exists.
4. Update the row status before coding if the current state is stale.
5. After coding, update:
   - this product tracker,
   - the relevant `docs/impl-plan/*` task checklist,
   - validation evidence: commands/tests/manual checks,
   - next recommended action.

### Status vocabulary

| Status | Meaning |
|---|---|
| `Not started` | No implementation plan or code exists yet. |
| `Planned` | Requirements and implementation plan exist, but code has not started. |
| `In progress` | Code or docs are actively being implemented. |
| `Validation needed` | Implementation exists, but tests/manual checks/config still need confirmation. |
| `Blocked` | Work cannot proceed until a named dependency is resolved. |
| `Done` | Code, tests, docs, and tracker are all updated. |
| `Deferred` | Explicitly out of the current MVP/phase. |

### Definition of done for a feature slice

A slice is `Done` only when all of the following are true:

- Data model, contracts, API, UI, and worker changes required for the slice are implemented or
  explicitly marked out of scope.
- Tests pass for changed workspaces.
- Manual verification is recorded when automation is not practical.
- `docs/impl-plan/<slice>.md` task table is updated.
- This file is updated with final status, evidence, and next action.
- Any required env/config/deployment notes are documented in `.env.example`, app `.env.example`,
  `README.md`, or `docs/deploy.md` as appropriate.

---

## 2. Current product state

### Direction change — 2026-06-03

Screen work has pivoted to direct in-app React frontend builds: no backend integration, in-repo typed mock fixtures only. Build participant screens in `apps/web` and organizer/admin screens in `apps/console`. Navigation is finalized in `docs/design-build/navigation-and-routes.md`; screen progress is tracked in the Build Tracker in `docs/design-build-guide.md` Part 5. Screens are not yet built unless a tracker row says so.

### Current recommended next action

1. **Diagnose local `auth:seed-admin` failure** seen in the latest terminal context before relying on
   console login for new feature testing.
2. Create and execute the next domain slice:
   `docs/impl-plan/feature-event-organizer-domain-1.md`.

### Current implementation checkpoint

| Area | Status | Evidence / Notes | Next action |
|---|---|---|---|
| Bootstrap scaffold | `Done` | `docs/bootstrap-plan.md`; apps/packages exist; README documents health, build, DB, and deployment workflow. | Keep as foundation; update only when tooling changes. |
| Better Auth foundation | `Validation needed` | Implementation exists and README documents login/seed flow. Auth plan exists at `docs/impl-plan/feature-auth-better-auth-1.md`, but its task table has not been backfilled with completion marks. Latest terminal context shows `pnpm --filter @corral/api auth:seed-admin` exited with code `1`. | Fix/verify `auth:seed-admin`; backfill auth plan checklist; record final test evidence. |
| Product-wide progress process | `Done` | This file plus `docs/impl-plan/process-product-progress-tracking-1.md`. | Future agents must keep it updated. |

---

## 3. MVP capability tracker

Source of truth for product scope: `docs/plan.md` and `docs/implementation-plan.md`.

| Capability ID | MVP capability | Source spec | Status | Implementation plan | Code areas | Evidence / blockers | Next action |
|---|---|---|---|---|---|---|---|
| MVP-00 | Base monorepo scaffold, health checks, shared packages, local infra | `docs/bootstrap-plan.md` | `Done` | `docs/bootstrap-plan.md` | `apps/*`, `packages/*`, `docker-compose.yml`, `turbo.json` | Existing repo scaffold and README workflow. | Maintain only. |
| MVP-01 | Authentication foundation for console/admin access | `docs/impl-plan/feature-auth-better-auth-1.md` | `Validation needed` | `docs/impl-plan/feature-auth-better-auth-1.md` | `apps/api/src/auth`, `apps/console/src/lib/auth.ts`, console routes, `packages/db/src/schema/auth.ts` | Local seed-admin command currently failing in terminal context; task checklist not backfilled. | Fix seed/admin validation before domain UI work. |
| MVP-02 | Organizer + event setup | `docs/implementation-plan.md#11-event-setup` | `Not started` | Needed: `docs/impl-plan/feature-event-organizer-domain-1.md` | `packages/db`, `packages/schema`, `apps/api`, `apps/console` | This is the logical next domain slice. | Design Organizer/Event/Category schema, contracts, API, and console screens. |
| MVP-03 | Public participant event page | `docs/implementation-plan.md#17-participant-event-page` | `Not started` | Needed | `apps/web`, `packages/schema`, `apps/api` | Depends on event setup. | Start after MVP-02 creates published events/categories. |
| MVP-04 | Registration form and participant capture | `docs/implementation-plan.md#12-registration` | `Not started` | Needed | `packages/db`, `packages/schema`, `apps/web`, `apps/api`, `apps/console` | Depends on MVP-02. | Build standard fields, waiver, medical declaration, guardian flow. |
| MVP-05 | Bulk/group registration | `docs/implementation-plan.md#12-registration` | `Not started` | Needed | Registration domain, payment domain, console/admin UI | Depends on MVP-04 and payment decisions. | Add coordinator/group model after single registration works. |
| MVP-06 | Coupon codes + early-bird pricing | `docs/implementation-plan.md#12-registration` | `Not started` | Needed | Event/category pricing, registration checkout | Depends on MVP-02 and MVP-04. | Model discount and pricing rules before payment capture. |
| MVP-07 | Spot/cash/offline registration capture | `docs/implementation-plan.md#12-registration` | `Not started` | Needed | Console roster/admin registration UI | Depends on MVP-04. | Build admin-created registrations with payment mode flags. |
| MVP-08 | Payments via Razorpay Route + payment status | `docs/implementation-plan.md#13-payments` | `Not started` | Needed | `apps/api`, `apps/worker`, `packages/db`, `packages/schema` | Requires provider credentials and legal/KYC setup. | Create `PaymentPort`; implement webhook-first status updates. |
| MVP-09 | GST invoicing and settlement reporting | `docs/implementation-plan.md#13-payments` | `Not started` | Needed | `apps/worker`, R2/PDF generation, payments DB | Depends on MVP-08. | Design invoice data model and PDF job flow. |
| MVP-10 | Organizer roster dashboard | `docs/implementation-plan.md#14-organizer-roster` | `Not started` | Needed | `apps/console`, `apps/api`, `packages/schema` | Depends on MVP-04. | Build search/filter/sort, manual correction, CSV export. |
| MVP-11 | T-shirt size summary | `docs/implementation-plan.md#14-organizer-roster` | `Not started` | Needed | Roster API/console reports | Depends on MVP-10. | Add aggregate report once registration data exists. |
| MVP-12 | Timing-vendor roster export | `docs/implementation-plan.md#14-organizer-roster` | `Not started` | Needed | Roster export service | Depends on MVP-10 and MVP-13. | Support canonical timing export format first. |
| MVP-13 | BIB management | `docs/implementation-plan.md#15-bib-management` | `Not started` | Needed | `packages/db`, `apps/console`, `apps/api` | Depends on MVP-10. | Manual BIB entry, CSV upload, duplicate warning. |
| MVP-14 | WhatsApp-first communications | `docs/implementation-plan.md#16-communications--whatsapp-first` | `Not started` | Needed | Notification port, provider adapter, worker jobs, console templates | External WABA verification has long lead time. | Create `NotificationPort`/`WhatsAppPort`; start with template/status model. |
| MVP-15 | SMS/email fallback | `docs/implementation-plan.md#16-communications--whatsapp-first` | `Not started` | Needed | MSG91/Resend adapters, worker jobs | TRAI DLT lead time. | Keep provider abstraction; log-only or sandbox first. |
| MVP-16 | Results CSV import and mapping | `docs/implementation-plan.md#18-results-import` | `Not started` | Needed | `apps/console`, `apps/api`, `packages/db`, `packages/schema` | Depends on events, registrations, BIBs. | Build canonical CSV mapping and preview. |
| MVP-17 | Rankings and age-group/Masters calculations | `docs/implementation-plan.md#18-results-import` | `Not started` | Needed | Results service/API tests | Depends on MVP-16 and DOB/category data. | Implement deterministic ranking tests early. |
| MVP-18 | Publish/unpublish results | `docs/implementation-plan.md#18-results-import` | `Not started` | Needed | Results domain, public web page | Depends on MVP-16. | Add publish state and public read APIs. |
| MVP-19 | Certificates | `docs/implementation-plan.md#19-certificates` | `Not started` | Needed | `apps/worker`, R2, Puppeteer/PDF, `apps/web` | Depends on published results. | Build HTML/CSS template and worker job after MVP-18. |
| MVP-20 | Permissions checklist | `docs/implementation-plan.md#110-lightweight-trust-tools-in-mvp` | `Not started` | Needed | Console checklist UI/API | Can start after event setup. | Add TN/Coimbatore templated checklist per event. |
| MVP-21 | Medical/emergency roster export | `docs/implementation-plan.md#110-lightweight-trust-tools-in-mvp` | `Not started` | Needed | Registration data, roster export | Depends on MVP-04 and MVP-10. | Export emergency contact and medical declaration data. |
| MVP-22 | Insurance add-on | `docs/implementation-plan.md#110-lightweight-trust-tools-in-mvp` | `Not started` | Needed | Registration/payment/provider integrations | Requires partner choice. | Track as later MVP add-on unless client demands earlier. |
| MVP-23 | Internal admin console coverage | `docs/implementation-plan.md#111-internal-admin-console-first-class-product` | `In progress` | Auth plan exists; feature plans needed per domain | `apps/console` | Auth-protected shell exists; business screens not started. | Build admin capability alongside every domain slice. |
| MVP-24 | Audit log for sensitive actions | `docs/implementation-plan.md#111-internal-admin-console-first-class-product` | `Not started` | Needed | API middleware/service, DB table, console views | Should start with domain actions before too many mutations exist. | Add audit-log foundation during or immediately after MVP-02. |

---

## 4. Phase roadmap tracker

| Phase | Goal | Status | Notes |
|---|---|---|---|
| Phase 0 — Foundation | Apps, packages, infra, auth base | `Validation needed` | Scaffold is done. Auth needs final seed/test evidence. |
| Phase 1 — Trust Loop | Run 5 real Coimbatore events with no Corral-caused critical failure | `Not started` | Start with Organizer/Event domain, then registration, payments, roster, comms, results, certificates. |
| Phase 2 — Participant Delight | Runner-facing experience and post-event delight | `Deferred` | Do not start before Phase 1 core loop is reliable. |
| Phase 3 — Race-Day Operations | Race-day dashboard, check-in, offline modes | `Deferred` | Later; avoid scope creep. |
| Phase 4 — Moat Expansion | Sponsorship, white-label, AI/photo, multi-city | `Deferred` | Later; explicitly out of MVP unless validated. |

---

## 5. Active decisions and open questions

| ID | Decision / question | Status | Owner / next action |
|---|---|---|---|
| DEC-001 | Use Better Auth Organization plugin now or defer? | `Open` | Decide during `feature-event-organizer-domain-1.md`. Auth plan intentionally deferred this. |
| DEC-002 | Model `organizer` as a first-class domain table independent of auth user? | `Open` | Recommended yes; decide with event ownership schema. |
| DEC-003 | Keep public participant web unauthenticated in MVP? | `Decided` | Yes. Participant account/profile is Phase 2. |
| DEC-004 | Payments provider | `Decided` | Razorpay Route behind `PaymentPort`; never make Corral a payment aggregator. |
| DEC-005 | Default result workflow | `Decided` | CSV-first timing import; no live timing in MVP. |
| DEC-006 | Language for MVP | `Decided` | English-only, strings kept i18n-ready; Tamil deferred. |

---

## 6. Next work queue

| Priority | Work item | Why it matters | Suggested plan file |
|---|---|---|---|
| P0 | Fix/verify `auth:seed-admin` locally | Console testing depends on working admin login. | Existing auth plan |
| P0 | Backfill auth plan checklist | Future agents need reliable completion state. | Existing auth plan |
| P0 | Event + Organizer domain | Unlocks every product workflow. | `docs/impl-plan/feature-event-organizer-domain-1.md` |
| P1 | Audit log foundation | Sensitive admin actions begin with event/registration mutation. | `docs/impl-plan/feature-audit-log-foundation-1.md` |
| P1 | Participant event page | Needed before real registrations. | `docs/impl-plan/feature-public-event-page-1.md` |
| P1 | Registration domain | Core business workflow. | `docs/impl-plan/feature-registration-foundation-1.md` |

---

## 7. Links future agents should read first

1. `docs/product-progress.md` — this file.
2. `docs/plan.md` — product strategy and MVP boundaries.
3. `docs/implementation-plan.md` — detailed module specs, roadmap, compliance, architecture.
4. `docs/bootstrap-plan.md` — scaffold/tooling decisions.
5. `docs/impl-plan/feature-auth-better-auth-1.md` — current auth foundation plan.
6. Relevant future `docs/impl-plan/*` file for the active slice.
