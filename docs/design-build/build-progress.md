# Corral — UI Build Progress Tracker

> Live tracker for the frontend-only build of all 82 screens. Backend-free (typed mock fixtures, `?demo=`
> states, `?as=` personas). Update the status as screens are built/reviewed. Source specs:
> `design-build-guide.md`, `design-build/wave2-*.md`, `navigation-and-routes.md`, `wireframe-screens.md`.

Status legend: ⬜ pending · 🟦 built (states + nav done, typecheck/lint pass) · ✅ reviewed (browser-agent + DevTools pass)

Last updated: 2026-06-05

---

## Foundations (Phase 0)
| ID | Item | Status | Notes |
|----|------|--------|-------|
| f0-primitives | `@corral/ui` primitives (badge, checkbox, radio-group, select, textarea, table, data-table, tabs, dialog, sheet, dropdown-menu, tooltip, skeleton, progress, avatar, breadcrumb, pagination, sidebar, sonner) + button `whatsapp` + StatusBadge info/pending/neutral | 🟦 | imports at `@corral/ui/components/<name>`; sonner installed |
| f0-system | Shared system patterns (EmptyState, skeleton presets, ConfirmDialog/SuccessModal, ConsentBlock, AccessDenied, ImportValidation, DegradedBanner, PendingBanner/ReconciliationStatusBadge) | 🟦 | S-03..S-11 in `@corral/ui` |
| f0-web-mocks | `apps/web/src/mocks` (types, utils, store, personas + fixtures) | 🟦 | relative imports (no `@/` alias) |
| f0-console-mocks | `apps/console/src/mocks` (types, utils, personas/RBAC, store, fixtures, ops) | 🟦 | persona API: getMockSessionResult/hasCapability |
| f0-web-shell | Participant shell (topbar, sticky CTA slot, S-01/S-02, dev switcher) | 🟦 | renders at :5273; `/register` bare-path redirect moved to `beforeLoad` |
| f0-console-shell | Organizer + admin shells (navy sidebar, event switcher, breadcrumbs, impersonation banner, dark ops, layout shells, session-expired) | 🟦 | renders at :5274; route-tree regenerated after `as never` strip |

---

## Phase 1 — Participant (`apps/web`, Light, 390px)
| ID | Screen | Route | Group | Status | Demo URLs / notes |
|----|--------|-------|-------|--------|-------------------|
| P-01 | Calendar | /calendar | g-p-discovery | 🟦 built | `/calendar?demo=default`, `/calendar?demo=loading`, `/calendar?demo=empty` |
| P-02 | Event Landing | /events/$eventId | g-p-discovery | 🟦 built | `/events/coimbatore-marathon-2026?demo=default`, `?demo=success` early-bird, `?demo=webhook-pending` closing-soon, `?demo=offline` closed, `?demo=validation-error` sold-out |
| P-03 | Event Details | /events/$eventId/details | g-p-discovery | 🟦 built | `/events/coimbatore-marathon-2026/details?demo=default`, `/events/coimbatore-marathon-2026/details?demo=loading` |
| P-04 | Refund Policy | /events/$eventId/policy/refund | g-p-discovery | 🟦 built | `/events/coimbatore-marathon-2026/policy/refund?demo=default`, `?demo=loading`, `?demo=offline`, `?demo=error` |
| P-05 | Waiver/Medical | /events/$eventId/policy/waiver | g-p-discovery | 🟦 built | `/events/coimbatore-marathon-2026/policy/waiver?demo=default`, `?demo=loading`, `?demo=offline` |
| P-06 | Category Select | /events/$eventId/register/category | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/category?demo=default`, `?demo=loading`, `?demo=offline` |
| P-07 | Registration Form | /events/$eventId/register/form | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/form?demo=default`, `?demo=empty`, `?demo=validation-error`, `?demo=success`; minor DOB routes guardian |
| P-08 | Consent/Waiver | /events/$eventId/register/waiver | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/waiver?demo=default`, `?demo=validation-error`, `?demo=success`; required unchecked |
| P-09 | Guardian Consent | /events/$eventId/register/guardian | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/guardian?demo=default`, `?demo=validation-error`, `?demo=success` |
| P-10A | Insurance Opt-in | /events/$eventId/register/insurance | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/insurance?demo=default`, `?demo=empty`, `?demo=validation-error`, `?demo=success` |
| P-11 | Order Summary (+P-10 coupon) | /events/$eventId/register/summary | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/summary?demo=default`, `?demo=validation-error`, `?demo=success`; coupon inline |
| P-12 | Payment | /events/$eventId/register/payment | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/payment?demo=default`, `?demo=webhook-pending`, `?demo=offline` |
| P-13 | Processing | /events/$eventId/register/processing | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/processing?demo=default`, `?demo=webhook-pending`, `?demo=error` |
| P-14 | Success | /events/$eventId/register/success | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/success?demo=default`, `?demo=webhook-pending`, `?demo=success` |
| P-15 | Failure/Retry | /events/$eventId/register/failed | g-p-register | 🟦 built | `/events/coimbatore-marathon-2026/register/failed?reason=gateway-fail`, `?reason=user-abandoned`, `?reason=duplicate`, `?demo=webhook-pending` |
| P-16 | Group Entry | /events/$eventId/group | g-p-group | 🟦 | `/events/cbe-marathon-2026/group?demo=default`, `/events/cbe-marathon-2026/group?demo=validation-error`, `/events/cbe-marathon-2026/group?demo=success`, `/events/cbe-marathon-2026/group?demo=empty`, `/events/cbe-marathon-2026/group?demo=loading` |
| P-17 | Group Roster Review | /events/$eventId/group/roster | g-p-group | 🟦 | `/events/cbe-marathon-2026/group/roster?demo=default`, `/events/cbe-marathon-2026/group/roster?demo=validation-error`, `/events/cbe-marathon-2026/group/roster?demo=success`, `/events/cbe-marathon-2026/group/roster?demo=loading` |
| P-18 | Group Payment+GST | /events/$eventId/group/payment | g-p-group | 🟦 | `/events/cbe-marathon-2026/group/payment?demo=default`, `/events/cbe-marathon-2026/group/payment?demo=webhook-pending`, `/events/cbe-marathon-2026/group/payment?demo=success`, `/events/cbe-marathon-2026/group/payment?demo=validation-error`, `/events/cbe-marathon-2026/group/payment?demo=error` |
| P-19 | E-Ticket | /my/registrations/$registrationId | g-p-myarea | 🟦 | `/my/registrations/reg-ananya-10k-confirmed?demo=default`, `?demo=empty`, `?demo=webhook-pending`, `?demo=success`, `?demo=validation-error`, `?demo=error` |
| P-20 | BIB & Kit | /my/registrations/$registrationId/kit | g-p-myarea | 🟦 | `/my/registrations/reg-ananya-10k-confirmed/kit?demo=default`, `?demo=empty`, `?demo=loading` |
| P-21 | Race-Day Instructions | /events/$eventId/race-day | g-p-myarea | 🟦 | `/events/coimbatore-marathon-2026/race-day?demo=default`, `?demo=loading` |
| P-22 | My Result | /my/registrations/$registrationId/result | g-p-myarea | 🟦 | `/my/registrations/reg-ananya-10k-confirmed/result?demo=default`, `?demo=validation-error`, `?demo=empty`, `?demo=permission-denied`, `?demo=success` |
| P-23 | Leaderboard | /events/$eventId/leaderboard | g-p-myarea | 🟦 | `/events/coimbatore-marathon-2026/leaderboard?view=overall`, `?view=category`, `?view=age-group`, `?demo=empty`, `?demo=loading` |
| P-24 | Certificate | /my/registrations/$registrationId/certificate | g-p-myarea | 🟦 | `/my/registrations/reg-ananya-10k-confirmed/certificate?demo=default`, `?demo=empty`, `?demo=loading`, `?demo=success` |
| P-25 | Insurance Status | /my/registrations/$registrationId/insurance | g-p-myarea | 🟦 | `/my/registrations/reg-ananya-10k-confirmed/insurance?demo=default`, `?demo=webhook-pending`, `?demo=empty`, `?demo=permission-denied`, `?demo=loading` |
| S-07 | Privacy | /privacy | g-p-myarea | 🟦 | `/privacy`, `/privacy?demo=default` |

---

## Phase 2 — Organizer (`apps/console`, Light + navy sidebar, 1280px)
| ID | Screen | Route | Group | Status | Notes |
|----|--------|-------|-------|--------|-------|
| O-01 | Login | /login | g-o-onboarding | 🟦 | `/login?demo=default`, `/login?demo=validation-error`, `/login?demo=auth-error`, `/login?demo=loading` |
| O-02 | Onboarding | /onboarding | g-o-onboarding | 🟦 | `/onboarding?demo=default`, `/onboarding?demo=validation-error`, `/onboarding?demo=empty`, `/onboarding?demo=success` |
| O-03 | Payment Onboarding | /onboarding/payment | g-o-onboarding | 🟦 | `/onboarding/payment?demo=not-started`, `/onboarding/payment?demo=KYC-submitted`, `/onboarding/payment?demo=pending-verification`, `/onboarding/payment?demo=rejected`, `/onboarding/payment?demo=active`, `/onboarding/payment?demo=settlement-blocked` |
| O-03A | Team & Roles | /settings/team | g-o-onboarding | 🟦 | `/settings/team?demo=default`, `/settings/team?demo=empty`, `/settings/team?demo=validation-error`, `/settings/team?demo=permission-denied&as=org-readonly`, `/settings/team?demo=success` |
| O-04 | Events Dashboard | / | g-o-events-setup | 🟦 | `/?demo=default`, `/?demo=empty`, `/?demo=loading` |
| O-05 | Setup Basics | /events/$eventId/setup/basics | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/basics?demo=default` |
| O-06 | Distances & Fees | /events/$eventId/setup/fees | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/fees?demo=default`, `?demo=validation-error` tier overlap/sold-out/date conflict |
| O-07 | Form Builder | /events/$eventId/setup/form | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/form?demo=default` |
| O-08 | Branding | /events/$eventId/setup/branding | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/branding?demo=default`, `?demo=loading`, `?demo=error`, `?demo=permission-denied&as=org-readonly` |
| O-09 | Policies | /events/$eventId/setup/policies | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/policies?demo=default`, `?demo=validation-error` |
| O-10A | Publish Readiness | /events/$eventId/setup/publish | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/setup/publish?demo=success`, `?demo=validation-error`, `?demo=webhook-pending`, `?demo=permission-denied&as=corral-admin` |
| O-10 | Coupons | /events/$eventId/coupons | g-o-events-setup | 🟦 | `/events/coimbatore-marathon-2026/coupons?demo=default`, `?demo=empty`, `?demo=validation-error`, `?demo=success`, `?demo=permission-denied&as=org-readonly` |
| O-11 | Roster | /events/$eventId/roster | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster?demo=default`, `?demo=loading`, `?demo=empty`, `?demo=filtered-empty`, `?demo=bulk-selected`, `?page=2&sort=bib&dir=desc`, `?drawer=participant-ananya-krishnan` |
| O-12 | Participant Detail | /events/$eventId/roster/$participantId | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/participant-ananya-krishnan?demo=default`, `?demo=validation-error`, `?demo=success`; invalid id shows S-01-style empty state |
| O-13 | CSV Import-Update | /events/$eventId/roster/import | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/import?demo=default`, `?demo=unmapped`, `?demo=ready` (S-09 ImportValidation) |
| O-14 | Export | /events/$eventId/roster/export | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/export?demo=default`, `?demo=validation-error`, `?demo=exporting`, `?demo=success`, `?demo=empty` |
| O-15 | Spot/Cash Reg | /events/$eventId/roster/spot | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/spot?demo=default`, `?demo=validation-error`, `?demo=success` |
| O-16 | T-Shirt Summary | /events/$eventId/roster/tshirts | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/tshirts?demo=default`, `?demo=empty` |
| O-35 | Medical Roster | /events/$eventId/roster/medical | g-o-roster | 🟦 | `/events/coimbatore-marathon-2026/roster/medical?demo=default`, `?demo=print`, `?demo=redacted`, `?demo=permission-denied`, `?demo=empty` |
| O-17 | BIB Assignment | /events/$eventId/bibs | g-o-bibs | 🟦 | `/events/coimbatore-marathon-2026/bibs?demo=default`, `?demo=loading`, `?demo=success`, `?demo=validation-error` |
| O-18 | BIB Validation | /events/$eventId/bibs/validate | g-o-bibs | 🟦 | `/events/coimbatore-marathon-2026/bibs/validate?demo=validation-error`, `?demo=success`, `?demo=loading`, `?demo=permission-denied&as=org-readonly` |
| O-19 | BIB↔Chip Mapping | /events/$eventId/bibs/chips | g-o-bibs | 🟦 | `/events/coimbatore-marathon-2026/bibs/chips?demo=default`, `?demo=validation-error`, `?demo=success`, `?demo=loading` |
| O-20 | Comms Dashboard | /events/$eventId/comms | g-o-comms | 🟦 | `/events/coimbatore-marathon-2026/comms?demo=default`, `?demo=empty`, `?demo=loading` |
| O-21 | Send/Broadcast | /events/$eventId/comms/send | g-o-comms | 🟦 | `/events/coimbatore-marathon-2026/comms/send?demo=default`, `?demo=template-not-approved`, `?demo=missing-consent`, `?demo=partial-delivery`, `?demo=fallback-triggered`, `?demo=send-paused` |
| O-22 | Template Editor | /events/$eventId/comms/templates | g-o-comms | 🟦 | `/events/coimbatore-marathon-2026/comms/templates?demo=list`, `?demo=empty`, `?demo=editor`, `?demo=validation-error`, `?demo=webhook-pending` |
| O-23 | Delivery Status | /events/$eventId/comms/delivery | g-o-comms | 🟦 | `/events/coimbatore-marathon-2026/comms/delivery?demo=default`, `?demo=partial-delivery`, `?demo=failures-present`, `?demo=webhook-pending`, `?demo=loading` |
| O-24 | Results Upload | /events/$eventId/results/upload | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/results/upload?demo=default`, `?demo=empty`, `?demo=loading`, `?demo=offline` |
| O-25 | Column Mapping | /events/$eventId/results/mapping | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/results/mapping?demo=default`, `?demo=validation-error`, `?demo=error` |
| O-26 | Validation Review | /events/$eventId/results/validate | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/results/validate?demo=default`, `?demo=success`, `?demo=loading`, `?demo=validation-error`; S-09 ImportValidation |
| O-27 | Results Preview | /events/$eventId/results/preview | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/results/preview?demo=default`, `?demo=validation-error`, `?demo=success`; overall/category/Masters rankings |
| O-28 | Publish/Correct | /events/$eventId/results/publish | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/results/publish?demo=default`, `?demo=success`, `?demo=validation-error`, `?demo=permission-denied`; audit reason required |
| O-29 | Cert Template | /events/$eventId/certificates/template | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/certificates/template?demo=default`, `?demo=validation-error`, `?demo=success` |
| O-30 | Cert Status | /events/$eventId/certificates/status | g-o-results | 🟦 | `/events/coimbatore-marathon-2026/certificates/status?demo=default`, `?demo=success`, `?demo=webhook-pending`, `?demo=validation-error` |
| O-31 | Payments/Settlement | /events/$eventId/payments | g-o-payments | 🟦 | Demo: `/events/coimbatore-marathon-2026/payments?demo=default`, `?demo=webhook-pending`, `?demo=empty`, `?demo=loading`; 14 labels |
| O-32 | GST Export | /events/$eventId/payments/exports | g-o-payments | 🟦 | Demo: `/events/coimbatore-marathon-2026/payments/exports?demo=default`, `?demo=success`, `?demo=validation-error`, `?demo=permission-denied&as=org-readonly`, `?demo=empty` |
| O-33 | Refunds | /events/$eventId/payments/refunds | g-o-payments | 🟦 | Demo: `/events/coimbatore-marathon-2026/payments/refunds?demo=default`, `?demo=webhook-pending`, `?demo=validation-error`, `?demo=permission-denied&as=org-readonly`, `?demo=empty` |
| O-34 | Permissions Checklist | /events/$eventId/permissions | g-o-payments | 🟦 | Demo: `/events/coimbatore-marathon-2026/permissions?demo=default`, `?demo=success`, `?demo=validation-error`, `?demo=permission-denied&as=org-readonly`, `?demo=empty` |

---

## Phase 3 — Admin (`apps/console`, navy/dark)
| ID | Screen | Route | Group | Status | Notes |
|----|--------|-------|-------|--------|-------|
| A-01 | Admin Home | /admin | g-a-console | 🟦 | `/admin?demo=default&as=corral-admin`, `?demo=empty`, `?demo=loading`; links to Organizers, Calendar, Delivery, Support, Ops, Audit, Users |
| A-02 | Organizers Mgmt | /admin/organizers | g-a-console | 🟦 | `/admin/organizers?demo=default&as=corral-admin`, `?demo=empty`, `?demo=permission-denied&as=corral-admin` |
| A-03 | Act-on-behalf | /admin/impersonate | g-a-console | 🟦 | `/admin/impersonate?demo=default&as=corral-admin`, `?demo=success&as=corral-admin`; persistent banner via mock store + audit reason gates |
| A-04 | Calendar Seeding | /admin/calendar | g-a-console | 🟦 | `/admin/calendar?demo=default&as=corral-admin`, `?demo=empty`, `?demo=loading`; links to P-01 `/calendar` public preview |
| A-05 | Delivery Monitor | /admin/delivery | g-a-console | 🟦 | `/admin/delivery?demo=default&as=corral-admin`, `?demo=error&tab=failures`, `?demo=webhook-pending`, `?demo=offline` |
| A-06 | Audit Log | /admin/audit | g-a-console | 🟦 | `/admin/audit?demo=default&as=corral-admin`, `?demo=empty`, `?demo=loading`; sensitive action table with reasons |
| A-07 | Support/Tickets | /admin/support | g-a-console | 🟦 | `/admin/support?demo=default&tab=open&ticket=CRL-2407&as=corral-admin`, `?demo=validation-error&tab=verifying&ticket=CRL-2409`, `?demo=success&tab=resolved&ticket=CRL-2399`, `?demo=offline` |
| A-08 | Ops Monitor (DARK) | /admin/ops | g-a-console | 🟦 | `/admin/ops?demo=default&as=corral-admin`, `?demo=offline&tab=overview`, `?demo=webhook-pending&tab=webhooks`, `?demo=error&tab=pdf-storage&component=storage`; dark command-center route; `/admin/users` still works |

---

## Shared/system patterns
S-01 404, S-02 error, S-03 EmptyState, S-04 Skeleton, S-05 success/confirm, S-06 session-expired,
S-07 consent/privacy, S-08 access-denied, S-09 import-validation, S-10 degraded, S-11 webhook-pending —
implemented in `@corral/ui` + shell roots (see Foundations).

## Design decisions / notes log
- Mock imports are relative (no `@/` alias) in both apps.
- Consent boxes default UNCHECKED; organizer-absorbed fees (no participant fee row); status always icon+label.
- 14 canonical payment labels + result statuses (finished/DNF/DNS/DQ) live in mock types.

## Review pass log (2026-06-05) — live browser sweep + typecheck/lint
- Both dev servers verified up (web :5273, console :5274); all participant + organizer + admin routes render
  real content (no error-boundary / "route not found") after fixes below. Both apps: typecheck ✅, lint ✅.
- **Fix — route-tree corruption (console):** sub-agents wrote `createFileRoute("/path" as never)`; the
  `as never` cast made the router-generator skip ~26 files, so those routes 404'd as "Console route not found".
  Stripped `" as never` → `"`; restarting dev server regenerated `routeTree.gen.ts` cleanly.
- **Fix — bare `/register` (web):** `redirect()` was thrown in `WizardLayout` render (caught by errorComponent).
  Moved to `beforeLoad` in `events.$eventId.register.tsx`.
- **Fix — register form infinite loop (web):** `useStickyCta` received a fresh JSX element each render →
  "Maximum update depth exceeded". Wrapped `cta` in `useMemo`, `submit` in `useCallback`.
- **Fix — onboarding/payment search-merge (console):** payment defined `demo` with KYC-specific values outside
  `DemoState`, colliding with the `demo: DemoState` inherited from `_authenticated` (intersection collapsed to
  `loading | validation-error`). Gave payment its own dedicated search key `kyc` (states via `?kyc=`); links
  pass `demo` (shell) + `kyc` (KYC stage). Route also de-nested via trailing-underscore file name.
- **Cleanup:** removed 11 stale `@ts-expect-error` directives; added required `search` to bibs/login/payment
  Links; converted 15 CRLF route files to LF (biome); deleted agent-created `-*.test.tsx` files (no tests this pass).
