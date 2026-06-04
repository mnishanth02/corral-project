# Navigation and routes

This is the authoritative navigation and route map for building Corral screen designs directly in the React apps. Build route files in-repo, with typed mock fixtures only; do not design in external artifacts and do not call any backend while building these screens.

## Overview

Corral has two frontend apps and three navigation shells:

| App | Audience | Surface | Shell | Theme |
|---|---|---|---|---|
| `apps/web` | Participants | Mobile-first public and "My" journeys | Participant root shell in `__root.tsx` | Light |
| `apps/console` | Organizers | Event setup and event operations | Organizer shell in `_authenticated.tsx` | Light dashboard with always-navy sidebar |
| `apps/console` | Corral staff admins | Admin and ops console | Admin shell in `admin.tsx` | Navy admin shell; dark mode for race-day/ops screens |

Theme rules come from `@corral/ui` tokens in `packages/ui/src/styles/globals.css`: light mode is the participant app and organizer dashboard default, sidebar tokens are always navy, and `.dark` is reserved for admin ops/race-day command views. Examples should use realistic Coimbatore content such as CODISSIA Trade Fair Complex, Race Course Road, 5K/10K/21K distances, ₹ fees, and BIB numbers like `1042`.

## Complete canonical route/file table

### apps/web — Participant (Light; root: `__root.tsx`)
| ID | URL | route file |
|----|-----|-----------|
| P-01 | /calendar | calendar.tsx |
| P-02 | /events/$eventId | events.$eventId.index.tsx |
| P-03 | /events/$eventId/details | events.$eventId.details.tsx |
| P-04 | /events/$eventId/policy/refund | events.$eventId.policy.refund.tsx |
| P-05 | /events/$eventId/policy/waiver | events.$eventId.policy.waiver.tsx |
| — | (register shell) | events.$eventId.register.tsx |
| P-06 | /events/$eventId/register/category | events.$eventId.register.category.tsx |
| P-07 | /events/$eventId/register/form | events.$eventId.register.form.tsx |
| P-08 | /events/$eventId/register/waiver | events.$eventId.register.waiver.tsx |
| P-09 | /events/$eventId/register/guardian | events.$eventId.register.guardian.tsx |
| P-10A | /events/$eventId/register/insurance | events.$eventId.register.insurance.tsx |
| P-11 | /events/$eventId/register/summary | events.$eventId.register.summary.tsx (P-10 coupon = component here) |
| P-12 | /events/$eventId/register/payment | events.$eventId.register.payment.tsx |
| P-13 | /events/$eventId/register/processing | events.$eventId.register.processing.tsx |
| P-14 | /events/$eventId/register/success | events.$eventId.register.success.tsx |
| P-15 | /events/$eventId/register/failed | events.$eventId.register.failed.tsx |
| — | (group shell) | events.$eventId.group.tsx |
| P-16 | /events/$eventId/group | events.$eventId.group.index.tsx |
| P-17 | /events/$eventId/group/roster | events.$eventId.group.roster.tsx |
| P-18 | /events/$eventId/group/payment | events.$eventId.group.payment.tsx |
| P-21 | /events/$eventId/race-day | events.$eventId.race-day.tsx |
| P-23 | /events/$eventId/leaderboard | events.$eventId.leaderboard.tsx |
| — | (ticket shell) | my.registrations.$registrationId.tsx |
| P-19 | /my/registrations/$registrationId | my.registrations.$registrationId.index.tsx |
| P-20 | /my/registrations/$registrationId/kit | my.registrations.$registrationId.kit.tsx |
| P-22 | /my/registrations/$registrationId/result | my.registrations.$registrationId.result.tsx |
| P-24 | /my/registrations/$registrationId/certificate | my.registrations.$registrationId.certificate.tsx |
| P-25 | /my/registrations/$registrationId/insurance | my.registrations.$registrationId.insurance.tsx |
| S-07 | /privacy | privacy.tsx |

### apps/console — Organizer (Light, navy sidebar; shell: `_authenticated.tsx`; all files prefixed `_authenticated.`)
| ID | URL | route file |
|----|-----|-----------|
| O-01 | /login | login.tsx (exists; public) |
| O-02 | /onboarding | _authenticated.onboarding.tsx |
| O-03 | /onboarding/payment | _authenticated.onboarding.payment.tsx |
| O-03A | /settings/team | _authenticated.settings.team.tsx |
| O-04 | / | _authenticated.index.tsx (exists) |
| — | (setup shell) | _authenticated.events.$eventId.setup.tsx |
| O-05 | /events/$eventId/setup/basics | _authenticated.events.$eventId.setup.basics.tsx |
| O-06 | /events/$eventId/setup/fees | _authenticated.events.$eventId.setup.fees.tsx |
| O-07 | /events/$eventId/setup/form | _authenticated.events.$eventId.setup.form.tsx |
| O-08 | /events/$eventId/setup/branding | _authenticated.events.$eventId.setup.branding.tsx |
| O-09 | /events/$eventId/setup/policies | _authenticated.events.$eventId.setup.policies.tsx |
| O-10A | /events/$eventId/setup/publish | _authenticated.events.$eventId.setup.publish.tsx |
| O-10 | /events/$eventId/coupons | _authenticated.events.$eventId.coupons.tsx |
| O-11 | /events/$eventId/roster | _authenticated.events.$eventId.roster.index.tsx |
| O-12 | /events/$eventId/roster/$participantId | _authenticated.events.$eventId.roster.$participantId.tsx |
| O-13 | /events/$eventId/roster/import | _authenticated.events.$eventId.roster.import.tsx |
| O-14 | /events/$eventId/roster/export | _authenticated.events.$eventId.roster.export.tsx |
| O-15 | /events/$eventId/roster/spot | _authenticated.events.$eventId.roster.spot.tsx |
| O-16 | /events/$eventId/roster/tshirts | _authenticated.events.$eventId.roster.tshirts.tsx |
| O-35 | /events/$eventId/roster/medical | _authenticated.events.$eventId.roster.medical.tsx |
| O-17 | /events/$eventId/bibs | _authenticated.events.$eventId.bibs.index.tsx |
| O-18 | /events/$eventId/bibs/validate | _authenticated.events.$eventId.bibs.validate.tsx |
| O-19 | /events/$eventId/bibs/chips | _authenticated.events.$eventId.bibs.chips.tsx |
| O-20 | /events/$eventId/comms | _authenticated.events.$eventId.comms.index.tsx |
| O-21 | /events/$eventId/comms/send | _authenticated.events.$eventId.comms.send.tsx |
| O-22 | /events/$eventId/comms/templates | _authenticated.events.$eventId.comms.templates.tsx |
| O-23 | /events/$eventId/comms/delivery | _authenticated.events.$eventId.comms.delivery.tsx |
| — | (results shell) | _authenticated.events.$eventId.results.tsx |
| O-24 | /events/$eventId/results/upload | _authenticated.events.$eventId.results.upload.tsx |
| O-25 | /events/$eventId/results/mapping | _authenticated.events.$eventId.results.mapping.tsx |
| O-26 | /events/$eventId/results/validate | _authenticated.events.$eventId.results.validate.tsx |
| O-27 | /events/$eventId/results/preview | _authenticated.events.$eventId.results.preview.tsx |
| O-28 | /events/$eventId/results/publish | _authenticated.events.$eventId.results.publish.tsx |
| O-29 | /events/$eventId/certificates/template | _authenticated.events.$eventId.certificates.template.tsx |
| O-30 | /events/$eventId/certificates/status | _authenticated.events.$eventId.certificates.status.tsx |
| O-31 | /events/$eventId/payments | _authenticated.events.$eventId.payments.index.tsx |
| O-32 | /events/$eventId/payments/exports | _authenticated.events.$eventId.payments.exports.tsx |
| O-33 | /events/$eventId/payments/refunds | _authenticated.events.$eventId.payments.refunds.tsx |
| O-34 | /events/$eventId/permissions | _authenticated.events.$eventId.permissions.tsx |
| S-06 | /session-expired | session-expired.tsx (public) |

> Reserved roster segment names (`import`,`export`,`spot`,`tshirts`,`medical`) outrank `$participantId`
> (TanStack ranks static > dynamic) — mock participant IDs must never equal these words.

### apps/console — Admin (own shell `admin.tsx`; dark for ops)
| ID | URL | route file |
|----|-----|-----------|
| A-01 | /admin | admin.index.tsx |
| A-02 | /admin/organizers | admin.organizers.tsx |
| A-03 | /admin/impersonate | admin.impersonate.tsx (+ global banner) |
| A-04 | /admin/calendar | admin.calendar.tsx |
| A-05 | /admin/delivery | admin.delivery.tsx |
| A-06 | /admin/audit | admin.audit.tsx |
| A-07 | /admin/support | admin.support.tsx |
| A-08 | /admin/ops | admin.ops.tsx (DARK) |
| — | /admin/users | admin.users.tsx (exists) |

### Shared / System (ownership)
| ID | Name | Ownership |
|----|------|-----------|
| S-01 | 404 | both roots `notFoundComponent` (web + console) |
| S-02 | Error boundary | both roots `errorComponent` |
| S-03 | Empty states | `@corral/ui` `EmptyState` (route-less, reused) |
| S-04 | Loading skeleton | `@corral/ui` `Skeleton` (route-less, reused) |
| S-05 | Success modal | `@corral/ui` Dialog-based pattern (route-less) |
| S-06 | Session expired | console route `/session-expired` + participant re-auth pattern |
| S-07 | DPDP consent | `@corral/ui` consent pattern + web `/privacy` route |
| S-08 | Access denied | `@corral/ui` `AccessDenied` pattern (route-less + console fallback) |
| S-09 | Import/upload validation | `@corral/ui` `ImportValidation` pattern (reused by O-13/O-24–26) |
| S-10 | Offline/degraded | `@corral/ui` `DegradedBanner` (route-less) |
| S-11 | Webhook/reconciliation pending | StatusBadge + `PendingBanner` pattern (route-less) |

Coverage: Participant 26 + Organizer 37 + Admin 8 + Shared 11 = **82**.

## Navigation shells

### Participant shell

- Root: `apps/web/src/routes/__root.tsx`.
- Use a lightweight top bar for brand, calendar/home access, and contextual status.
- Each screen owns a sticky bottom CTA slot: register, continue, pay, view ticket, download certificate, or retry.
- The "My" area contains ticket, kit, result, certificate, and insurance status routes under `/my/registrations/$registrationId`.
- Keep the participant app light and mobile-first; desktop can center the mobile journey without changing route behavior.

### Organizer shell

- Root: `apps/console/src/routes/_authenticated.tsx`; route files use the `_authenticated.` prefix while URLs stay clean.
- Sidebar is always navy and groups links as: Events, Roster, BIBs, Comms, Results, Certificates, Payments, Permissions, Settings/Team.
- Include an event-context switcher in the shell/topbar. Event tools must link with the active `$eventId`.
- Organizer setup and flow shells provide stepper/tabs and redirect bare layout paths to their first step.

### Admin shell

- Root: `apps/console/src/routes/admin.tsx`; admin is separate from the organizer auth shell.
- Sidebar groups: Home, Organizers, Calendar, Delivery, Support, Ops, Audit, Users.
- Show the impersonation banner globally when the `corral-admin-impersonating` persona is active or A-03 has selected an organizer.
- `admin.ops.tsx` is dark; other admin routes may remain navy/light unless they become race-day command views.

## Locked TanStack conventions

| Decision | Rule |
|---|---|
| D1 | Organizer routes live under the pathless auth layout with file prefix `_authenticated.`; admin routes use a separate `admin.tsx` shell with its own RBAC guard, admin sidebar, impersonation banner, and dark-theme capability; participant routes hang off `__root.tsx`. |
| D2 | If a path has a base screen and children, the base screen is `<segment>.index.tsx`; children are flat `<segment>.<child>.tsx`. Add a layout file only when a shared shell is needed. Wizard/layout files are `events.$eventId.register.tsx`, `events.$eventId.group.tsx`, `_authenticated.events.$eventId.setup.tsx`, `_authenticated.events.$eventId.results.tsx`, and `my.registrations.$registrationId.tsx`. |
| D3 | All organizer event tools are event-scoped under `/events/$eventId/...`; do not create rooted `/results/...`, `/payments/...`, or similar event tools. |
| D9 | Deep-link tabs, filters, sorting, pagination, and demo modes through search params, not local-only `useState`. Breadcrumb labels live in route `staticData: { breadcrumb }`. Back behavior is explicit hierarchical `<Link>` navigation, not `history.back()`. Wire 404 through root `notFoundComponent` and errors through root `errorComponent` in both apps. |
| D12 | `apps/web` `/` remains the participant home/entry route with links to `/calendar` and a demo event. Every wizard layout route redirects its bare path to the first step: register → category, setup → basics, results → upload. Invalid `$eventId`, `$registrationId`, or `$participantId` resolves to the entity-not-found S-01 variant via loader/notFound and is demoable with a known-bad id. |

Additional routing notes:

- Use TanStack file-based routing: `index.tsx` → `/`, `_x.tsx` → pathless layout, `_x.index.tsx` → layout index, `a.b.tsx` → `/a/b`, `$param` for params, and `-page.tsx` / `-x.test.tsx` for non-route files.
- Public console routes are `login.tsx` and `session-expired.tsx`.
- Existing `/admin/users` stays available and should become mockable while preserving the admin user management route.
- Access-denied uses S-08, session expiration uses S-06, invalid IDs use entity-not-found, and unexpected failures use S-02.

## Screen-to-screen flows

### Participant registration journey

| Step | Route | Forward path | Back path |
|---|---|---|---|
| Discover | P-02 `/events/$eventId` | P-03 details or P-06 category | P-01 calendar |
| Details/policies | P-03, P-04, P-05 | P-06 category | P-02 landing |
| Category | P-06 | P-07 form | P-02 landing |
| Form | P-07 | P-08 waiver | P-06 category |
| Waiver | P-08 | P-09 guardian when minor, otherwise P-10A/P-11 | P-07 form |
| Guardian | P-09 | P-10A insurance or P-11 summary | P-08 waiver |
| Insurance | P-10A | P-11 summary | P-08/P-09 as applicable |
| Summary | P-11 | P-12 payment | Previous completed step |
| Payment | P-12 | P-13 processing | P-11 summary |
| Processing | P-13 | P-14 success or P-15 failure | no history back; use explicit retry/cancel links |
| Success/failure | P-14/P-15 | P-19 e-ticket or retry payment | P-02 landing / P-12 payment |

P-10 coupon is an inline component in P-11 Order Summary, not a route. Registration state persists in `apps/web/src/mocks/store.ts` so the full journey is demoable without backend calls.

### Participant "My" area

| Area | Routes | Links |
|---|---|---|
| Ticket hub | P-19 `/my/registrations/$registrationId` | P-20 kit, P-22 result, P-24 certificate, P-25 insurance |
| Race-day prep | P-20 kit + P-21 race-day | Back to ticket hub and event landing |
| Results and certificates | P-22 result, P-23 leaderboard, P-24 certificate | Result links to leaderboard; certificate links back to result and ticket |
| Insurance | P-25 insurance | Back to P-19 and support/error recovery patterns |

### Organizer event lifecycle

| Lifecycle | Screens | Notes |
|---|---|---|
| Setup | O-05 → O-06 → O-07 → O-08 → O-09 → O-10A | `/events/$eventId/setup` redirects to basics. Publish readiness links to permissions and event dashboard. |
| Publish and pricing | O-10A + O-10 | Coupons affect mocked order-summary examples for Coimbatore events. |
| Roster | O-11 → O-12, O-13, O-14, O-15, O-16, O-35 | Static roster child segments outrank `$participantId`; participant IDs must avoid reserved words. |
| BIBs | O-17 → O-18 → O-19 | Assignment must link to validation, then chip mapping. |
| Comms | O-20 → O-21/O-22/O-23 | Delivery monitor links to webhook-pending S-11 and delivery status patterns. |
| Results | O-24 → O-25 → O-26 → O-27 → O-28 | `/events/$eventId/results` redirects to upload; validation reuses S-09. |
| Certificates | O-29 → O-30 | Certificate status links to results publish state. |
| Payments | O-31 → O-32/O-33 | Settlement links to GST exports and refunds. O-32 links back to O-31 and across to O-33. |
| Permissions | O-34 | Links to publish readiness and event settings. |

### Admin ops drilldowns

- A-01 Home links to Organizers, Calendar, Delivery, Support, Ops, Audit, and Users.
- A-02 Organizers links to A-03 impersonate, organizer detail patterns, and event lists.
- A-04 Calendar seeding links to participant calendar P-01 for public verification.
- A-05 Delivery links to delivery failures, comms delivery O-23 context, and webhook-pending S-11.
- A-07 Support links to participant/organizer recovery surfaces, especially S-01, S-02, S-06, and S-08.
- A-08 Ops is dark and links to delivery, audit, support, and race-day incident views.
- A-06 Audit records admin actions, impersonation, exports, refunds, and permission changes.

### Required cross-links from wireframe flows

| Flow | Required links |
|---|---|
| BIB chain | O-17 BIB assignment → O-18 validation → O-19 BIB↔chip mapping, each with explicit `<Link>` back to the previous step and sidebar links to the BIB group. |
| Calendar verification | A-04 Calendar seeding → P-01 Calendar public preview. |
| Payments | O-32 GST exports → O-31 settlement and O-33 refunds; O-31 settlement also links to exports/refunds. |
| Recovery | S-01 404 provides home/calendar/console links by app; S-02 error provides retry and support links; S-06 session expired links to login and preserves intended redirect where safe. |

## Mock-fixtures and demo-state convention

| Decision | Rule |
|---|---|
| D4 | Console protected routes run in dev mock mode using fixture sessions instead of calling `authClient.getSession()`. Personas: `org-owner`, `org-staff`, `org-readonly`, `corral-admin`, `corral-admin-impersonating`, `session-expired`, `access-denied`. Select via `?as=` or a dev switcher. O-01 login and `/admin/users` already touch auth; keep them mockable. |
| D5 | Demo states use `?demo=` with a typed `validateSearch` enum using the app's manual `validateSearch` pattern; zod is optional. Canonical enum: `default | empty | loading | error | validation-error | success | permission-denied | offline | webhook-pending`. States are deterministic; do not use random failures. Each screen spec should list 2–4 demo URLs. |
| D6 | Multi-step flow data persists through `src/mocks/store.ts` in each app, implemented as an in-memory React context seeded from fixtures and optionally localStorage-backed. |
| D7 | Form screens use `mockMutate(payload, { demo })` from `src/mocks/utils.ts` to return success, validation-error, or pending deterministically. No real network calls. |

Fixture modules live in `apps/web/src/mocks/` and `apps/console/src/mocks/`. Use one typed module per domain, for example `events.ts`, `registrations.ts`, `roster.ts`, `results.ts`, `comms.ts`, `payments.ts`, `coupons.ts`, `bibs.ts`, `organizers.ts`, `tickets.ts`, and `audit.ts`. Keep provisional local types in `src/mocks/types.ts` until backend DTOs move to `@corral/schema`.

Mock fixtures should be realistic and navigable: `coimbatore-marathon-2026`, CODISSIA venue data, distances `5K`, `10K`, `21K`, participant names such as Ananya Krishnan and Karthik Narayanan, amounts like `₹1,499`, BIB `1042`, and delivery/payment/audit rows that link to the canonical routes above.

Every screen must remain backend-free while in this design-build phase: no API calls, no Better Auth dependency in mock mode except documented existing exceptions, no networked data fetching, and no secrets in fixtures.