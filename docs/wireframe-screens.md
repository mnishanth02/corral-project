# Corral — Wireframe Screen Specification

> Design companion to [plan.md](plan.md) and [implementation-plan.md](implementation-plan.md).
> This document is the **source of truth for screen inventory**.
> It enumerates every screen, its purpose, key components, states, and data shown — organized by
> surface and flow, with a build priority that maps to the Phase-1 trust loop.

Route paths and the build workflow now live in `docs/design-build/navigation-and-routes.md` and
`docs/design-build-guide.md`. Screens are built directly in the React apps with in-repo typed mock
fixtures only: `apps/web` for participant screens and `apps/console` for organizer/admin screens. No
backend integration is part of this screen-build pass.

---

## How to use this doc

- **Three surfaces:** **Participant** (mobile-web, public), **Organizer** (desktop-primary dashboard),
  **Admin Console** (Corral staff, white-glove). Plus **shared/system** states.
- Each screen has: **ID**, **purpose**, **key components**, **states to design**, **data shown**.
- **Modal vs. page:** legal/policy content should be full pages for readability and shareability;
  lightweight confirmations and coupon entry can remain inline or modal patterns.
- **i18n:** English-only for MVP, but design with string-expansion headroom (Tamil later).
- **Breakpoints:** Participant = mobile-first (360–414px primary), Organizer/Admin = desktop-first
  (1280px primary) with a usable tablet fallback.
- **Core-state coverage:** every P0/P1 operational flow should include default, empty, loading,
  validation-error, success, failure/retry, permission-denied, and manual-backup states where relevant.
- **Privacy/compliance:** any PII collection or export screen must show DPDP consent/notice affordances,
  communication consent (WhatsApp/SMS/email), guardian consent for minors, and safe handling of private CSVs.
- **Accessibility:** do not encode state by color alone; pair status colors with labels/icons, keep mobile
  touch targets comfortable, and check dense organizer tables for keyboard/focus usability.

### Priority legend
- **P0** — Must design/build for the first paid pilot and the core trust loop
  (Registration → Roster → Communicate → Results → Certificates).
- **P1** — MVP table-stakes and operational trust requirements (coupons, early-bird, group reg,
  BIB, payments/GST, comms, trust tools, role/audit coverage).
- **P2** — MVP-adjacent discovery/support polish or add-ons that can be manual/white-glove for the
  first pilot. P2 does **not** automatically mean post-MVP; use the wave table for sequencing.

---

## A. Participant — Mobile Web (public)

> Mobile-first. Participants should not create passwords for MVP; access is via registration + emailed
> magic link, with mobile OTP fallback when links expire or a participant switches devices.

### A1. Discovery & Event

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| P-01 | Coimbatore Running Calendar | P2 | Curated list of upcoming events (discovery) |
| P-02 | Event Landing Page | P0 | Sell the event + primary "Register" CTA |
| P-03 | Event Details | P0 | Full description, schedule, race instructions, contact |
| P-04 | Refund / Cancellation Policy | P1 | Full legal/policy page |
| P-05 | Waiver / Medical Declaration (full text) | P0 | Full waiver/medical declaration page |

**P-02 Event Landing Page** — components: hero banner + logo, event name/date, venue with map link,
distance/category chips with fees + capacity/sold-out status, early-bird countdown, sponsor strip,
sticky "Register" CTA.
States: registration open / early-bird active / closing-soon / closed / sold-out.
Data: event meta, fee tiers, dates, sponsors.

### A2. Registration & Checkout

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| P-06 | Category / Distance Selection | P0 | Choose distance + see applicable fee tier |
| P-07 | Registration Form | P0 | Standard participant fields |
| P-08 | Medical Declaration + Waiver Acceptance | P0 | Required checkboxes + consent |
| P-09 | Minor / Guardian Consent | P1 | Guardian details + verifiable parental consent (DPDP) |
| P-10 | Coupon Code Entry | P1 | Apply sponsor/club code (inline/modal) |
| P-10A | Insurance Add-on Opt-in | P1 | Optional event accident insurance before checkout |
| P-11 | Order Summary / Fee Breakdown | P0 | Itemized fee, discounts/add-ons, organizer-absorbed fee note, total |
| P-12 | Payment (Razorpay handoff) | P0 | UPI / cards / netbanking |
| P-13 | Payment Processing / Pending | P0 | Async wait state |
| P-14 | Payment Success → Confirmation | P0 | Confirmation + next steps + e-ticket link |
| P-15 | Payment Failure / Retry | P0 | Error reason + retry / change method |

**P-07 Registration Form** — fields: name, gender, DOB (drives age-group), mobile, email, emergency
contact (name + phone), distance/category, T-shirt size, club/team (optional). Validation inline.
States: empty, validation errors, age-derived category notice, DOB → minor-detected (routes to P-09).

**P-08 Consent stack** — components: medical self-declaration, waiver acceptance, DPDP privacy notice
link, WhatsApp/SMS/email communication consent, and event-result/certificate publishing disclosure.
States: required consent missing, minor detected, guardian consent required.

**P-10A Insurance Add-on Opt-in** — shown only when organizer/admin enables insurance. Components:
coverage summary, premium, nominee/guardian note if needed, insurer terms link, opt-in/skip action.
States: organizer has not enabled insurance, unavailable for category/age, opt-in selected, declined.

**P-11 Order Summary** — components: line items, coupon applied row, early-bird tier label,
insurance premium row when selected, organizer-absorbed convenience/platform fee note, GST note, total,
invoice/GST expectation, "Pay" CTA. Do not add a separate participant-paid convenience fee in MVP.

**P-13/P-15 Payment states** — distinguish gateway failure, user-abandoned payment, webhook-pending,
duplicate payment, and paid-but-confirmation-not-sent. Always offer a safe retry path and support contact.

### A3. Bulk / Group Registration (coordinator)

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| P-16 | Group Registration Entry | P1 | CSV paste or repeat-add multiple runners |
| P-17 | Group Roster Review | P1 | Validate all entries before paying |
| P-18 | Group Payment + GST Invoice | P1 | One payment, one GST invoice, coordinator details |

**P-16/17** — components: add-row repeater + CSV paste box, per-row validation, running total,
per-runner T-shirt/category, coordinator contact + GST details. States: row errors, duplicate detection.

### A4. Participant Post-Registration Hub

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| P-19 | My Registration / E-Ticket | P0 | QR e-ticket + registration status |
| P-20 | BIB & Kit Collection | P0 | BIB number (once assigned) + collection details |
| P-21 | Race-Day Instructions | P0 | Schedule, venue, what-to-bring, route |
| P-22 | My Result | P0 | Finish time, overall/category/age-group rank, status |
| P-23 | Full Leaderboard | P0 | Tabbed overall / category / age-group views, search |
| P-24 | Certificate View + Download | P0 | PDF download + shareable link + certificate ID |
| P-25 | Insurance Policy / Add-on Status | P1 | View coverage, policy status, and support path |

**P-19 E-Ticket** — components: QR code, participant name/category, event meta, status badge
(confirmed/pending), links to BIB, instructions, results, certificate. Access via emailed magic link,
with mobile OTP fallback for expired links/device changes.
States: payment pending, confirmed, pre-BIB, BIB assigned, results-live, certificate-ready,
link expired / OTP required.

**P-22 My Result** — components: hero finish time, net/gun time, rank cards (overall/category/age-group),
status (finished/DNF/DNS/DQ), optional age-graded, CTA to certificate + leaderboard.

---

## B. Organizer Dashboard (desktop-primary)

### B1. Onboarding & Account

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-01 | Login / Sign-in | P0 | Organizer authentication |
| O-02 | Organizer Onboarding | P0 | Org/club profile, GST vs non-GST entity type |
| O-03 | Payment Onboarding (Razorpay Route) | P0 | Linked-account KYC + status tracking |
| O-03A | Team Members & Roles | P1 | Invite staff, assign event roles, enforce RBAC |

**O-03 Payment Onboarding** — states: not started, KYC submitted, pending verification, rejected,
active, settlement blocked. Surface this early because paid registration cannot safely open without it.

**O-01 Login / Sign-in** — organizer/admin authentication uses email + password and Google sign-in.
Participants remain passwordless to keep public registration low-friction.

**O-03A Team Members & Roles** — MVP roles: Owner, Admin, Event Editor, Finance, Support/Check-in, and
Read-only Viewer. Sensitive actions (publish/unpublish, refunds, exports with PII, impersonation,
manual payment overrides, bulk deletes, and role changes) require an audit reason.

### B2. Event Management

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-04 | Events List / Dashboard | P0 | All events with status + quick actions |
| O-05 | Event Setup — Basics | P0 | Name, date/time, venue, map link |
| O-06 | Event Setup — Distances & Fees | P0 | Categories, fees, early-bird tiers, open/close dates |
| O-07 | Event Setup — Registration Form Builder | P0 | Fields config + waiver/medical text |
| O-08 | Event Setup — Branding | P1 | Logo, banner, sponsor strip |
| O-09 | Event Setup — Policies | P0 | Refund/cancellation, waiver, contact, instructions |
| O-10 | Coupon Codes | P1 | Create %/flat codes, usage caps, validity |
| O-10A | Event Publish Readiness Checklist | P0 | Block go-live until critical setup is complete |

**O-04 Events Dashboard** — components: event cards/table (status: draft/open/closed/completed),
registration count, revenue snapshot, "Create event" CTA, per-event quick links.

**O-06 Distances & Fees** — components: category repeater (name, distance, fee, capacity cap),
early-bird tier rows (date-step or count-step), registration open/close datetimes. States: overlapping
tiers warning, sold-out category, registration date conflict.

**O-10A Event Publish Readiness Checklist** — checks basics, distances/fees, capacity, policies,
waiver/medical text, payment account active, confirmation templates, privacy notice, and public preview.
States: ready to publish, blocked, warning-only, admin override with audit reason. MVP blocking items:
basics, at least one distance/fee, registration dates, capacity, policies/waiver, privacy notice,
payment account active, and confirmation template. Warning-only items: sponsor branding, non-critical
instructions polish, optional insurance setup, and optional coupon setup.

### B3. Roster & Participants

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-11 | Roster (participant table) | P0 | **Key surface** — search/filter/sort all registrants |
| O-12 | Participant Detail / Edit | P0 | View + manual correction of a registrant |
| O-13 | CSV Import-Update | P1 | Upload + column-map + validate roster updates |
| O-14 | CSV / Timing-Vendor Export | P0 | Export roster (BIB, chip, name, category) |
| O-15 | Spot / Cash / Offline Registration | P1 | Add walk-in/expo registrant (payment mode = cash/comp) |
| O-16 | T-Shirt Size Summary | P1 | Aggregate counts to prevent over/under-ordering |

**O-11 Roster** — columns: name, category, payment status + mode (incl. cash/comp), contact,
emergency contact, BIB, T-shirt size. Components: global search, filter chips (category/payment/BIB),
column sort, bulk-select, export/import buttons, row click to open a right-side detail drawer, and limited
inline quick actions only for low-risk fields. States: empty, filtered-empty, large-list pagination.

### B4. BIB Management

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-17 | BIB Assignment | P1 | Manual entry + CSV upload of BIB numbers |
| O-18 | BIB Duplicate / Validation | P1 | Surface duplicate-BIB warnings |
| O-19 | BIB ↔ Chip Mapping | P1 | Exportable/correctable mapping |

### B5. Communications (WhatsApp-first)

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-20 | Comms Dashboard | P0 | Template library + recent sends overview |
| O-21 | Send / Broadcast Message | P0 | Audience select + template + preview + send |
| O-22 | Template Editor | P1 | Create/edit reusable trigger-based templates |
| O-23 | Delivery Status Tracking | P0 | Per-message delivered/read across WA/SMS/email |

**O-21 Send/Broadcast** — components: audience builder (all / category / payment-status / BIB-pending),
channel (WhatsApp primary, SMS/email fallback), template picker, variable preview, send/schedule.
States: template not approved, missing consent, partial-delivery, fallback-triggered, send paused.

### B6. Results & Certificates

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-24 | Results Upload (CSV) | P0 | Upload timing-vendor CSV |
| O-25 | Column Mapping | P0 | Map vendor columns → canonical fields |
| O-26 | Validation / Error Review | P0 | Flag unmatched BIBs / bad rows |
| O-27 | Results Preview | P0 | Review computed rankings before publish |
| O-28 | Publish / Unpublish + Correct | P0 | Go-live control + manual fixes |
| O-29 | Certificate Template Setup | P0 | Fields, branding, layout for cert |
| O-30 | Certificate Generation Status | P0 | Batch render progress + errors |

**O-25 Column Mapping** — map to canonical: BIB, name, gender/category, distance, start time,
finish time, net/gun time, rank, status (finished/DNF/DNS/DQ). Components: source→target dropdowns,
auto-detect, sample-row preview. States: required-field unmapped, type mismatch.

**O-27 Results Preview** — auto-computed overall / category / **age-group (Masters)** rankings,
optional age-graded. Components: ranking tabs, anomaly flags, edit-row, "Publish" CTA.

**O-29 Certificate Template Setup** — MVP uses a fixed, polished certificate template with configurable
event logo, organizer name, sponsor strip, colors, signature image, and certificate text fields. Freeform
layout customization is intentionally deferred until after the first pilot.

### B7. Payments & Finance

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-31 | Payments / Settlement Dashboard | P0 | Success/failure, settlement timing (T+2/T+3) |
| O-32 | GST Invoice / Report Export | P1 | Exportable GST + payment report |
| O-33 | Refunds | P1 | Initiate/track refunds within RBI PA-PG limits |

**O-31 Payments / Settlement Dashboard** — distinguish checkout intent, gateway success, verified
webhook confirmation, registration confirmation sent, refund status, and settlement/reconciliation status.
Use consistent labels: `Payment Started`, `Payment Pending`, `Paid — Awaiting Webhook`, `Paid & Confirmed`,
`Confirmation Sent`, `Settlement Pending`, `Settled`, `Refund Requested`, `Refund Processing`, `Refunded`,
`Failed`, `User Abandoned`, `Duplicate Payment`, and `Needs Review`.

### B8. Trust Tools

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| O-34 | Permissions Checklist | P1 | TN/Coimbatore-templated checklist + reminders |
| O-35 | Medical / Emergency Roster | P1 | Printable/exportable medical-team sheet |

**O-34 Permissions Checklist** — items: police/traffic NOC, Coimbatore City Municipal Corporation
permission, ambulance/**108** + first-aid, fire/safety NOC, **IPRS/PPL music license**, participant
insurance. Components: checklist with status, due-date reminders, notes/attachments. States: not started,
due soon, blocked, done, attachment uploaded. (Checklist, not automation.)

**O-35 Medical Roster** — surfaces emergency-contact + medical-declaration data already collected,
as a print/export sheet for medical team + race control. Include print-safe view, emergency-alert labels,
and minimal medical detail only. Aligns with SOS/medical tokens in design-system.

---

## C. Internal Admin Console (Corral staff — white-glove)

> Mirrors **all** organizer capabilities (B1–B8) for any event, plus:

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| A-01 | Admin Home / Multi-Event Overview | P0 | Cross-event operational view |
| A-02 | Organizer / Customer Management | P1 | Manage organizers + entity/GST status |
| A-03 | Act-on-behalf (impersonation) | P0 | Configure forms, fix data, resend confirms for any event |
| A-04 | Calendar Seeding / Management | P2 | Curate the public Coimbatore calendar |
| A-05 | Global Delivery-Status Monitor | P1 | WhatsApp/SMS/email delivery across all events |
| A-06 | Audit Log | P0 | Record of sensitive actions |
| A-07 | Support / Ticket View | P1 | Track support and privacy/data requests per organizer/event |
| A-08 | Operations Monitor / Job Health | P1 | Failed jobs, webhook exceptions, queues, PDF/comms health |

**A-03 Act-on-behalf** — use a persistent high-contrast impersonation banner across the whole session with
organizer/event context, staff user identity, elapsed time, and a prominent "Exit act-on-behalf" action.
Before the first sensitive change, require an audit-reason step; repeat the reason prompt for high-risk
actions such as refunds, PII exports, publishing/unpublishing, and manual payment overrides.

**A-08 Operations Monitor** — states: healthy, degraded, failed jobs, webhook retrying, queue backlog,
PDF generation failures, storage/upload errors. This supports the zero-critical-failure pilot target.

**A-07 Support / Ticket View** — privacy/data requests are support/admin-assisted for MVP, not participant
self-serve. Participants can contact support from public pages; staff tracks identity verification, request
type, due date, status, and resolution notes.

---

## D. Shared / System / States

| ID | Screen | Priority | Purpose |
|---|---|---|---|
| S-01 | 404 / Not Found | P1 | Missing route/event |
| S-02 | Error / Something Went Wrong | P1 | Generic failure boundary |
| S-03 | Empty States | P0 | No events / no registrations / no results (per surface) |
| S-04 | Loading / Skeleton | P0 | Async loading pattern |
| S-05 | Confirmation / Success Modal | P0 | Reusable confirm/destructive-action pattern |
| S-06 | Session Expired / Auth Error | P1 | Re-auth prompt |
| S-07 | Consent / Privacy Notice (DPDP) | P0 | Data-collection disclosure + consent |
| S-08 | Access Denied / Role Boundary | P0 | RBAC or event-scope mismatch, with safe next action |
| S-09 | Import / Upload Validation Pattern | P0 | CSV/file parse errors, column issues, row-level fixes |
| S-10 | Offline / Degraded / Manual Backup | P1 | Low-connectivity or vendor outage fallback state |
| S-11 | Webhook / Reconciliation Pending | P1 | Payment/comms callback pending, retrying, or needs review |

**S-10 Manual Backup Promise** — degraded states should tell users what is still safe to do, what is delayed,
and who owns follow-up. For Razorpay/WhatsApp/CSV/PDF delays, show a non-blocking status, retry/refresh where
safe, support contact, and an admin/manual processing path with audit notes.

---

## E. Design priority order (suggested in-app build sequence)

| Wave | Screens | Rationale |
|---|---|---|
| **Wave 1 — Paid pilot trust loop** | P-02→P-03, P-06→P-08, P-11→P-15, P-19→P-24; O-03, O-04→O-07, O-09, O-10A, O-11→O-12, O-14, O-20→O-21, O-23, O-24→O-31; A-01, A-03, A-06; S-03→S-05, S-07→S-09 | Proves paid Registration → Roster → Communicate → Results → Certificates with audit/privacy/import safety |
| **Wave 2 — India table-stakes + operations** | P-09→P-10A, P-16→P-18, P-25; O-03A, O-08, O-10, O-13, O-15→O-19, O-22, O-32→O-35; A-02, A-05, A-07→A-08; S-01→S-02, S-06, S-10→S-11 | Coupons, early-bird, group reg, BIB, roles, GST, trust tools, support/privacy requests, degraded operations |
| **Wave 3 — Discovery polish** | P-01; A-04 | Calendar and non-critical polish after the core pilot flow is coherent |

---

## F. Settled decisions for wireframes

1. **Participant identity** — participants stay passwordless: emailed magic link first, mobile OTP fallback
   for expired links or device changes. Organizer/Admin login uses email + password and Google sign-in.
2. **Convenience-fee model** — organizer-absorbed for MVP. P-11 should show a transparent note, not add a
   separate participant-paid convenience fee row.
3. **Legal/policy surfaces** — refund policy, waiver, medical declaration, and privacy notice are full pages.
   Coupon entry can stay inline/modal; short confirmations can stay modal.
4. **Roster density** — desktop table with compact-but-readable rows; participant edits happen in a right-side
   detail drawer. Keep inline editing only for safe quick actions.
5. **Admin act-on-behalf UX** — persistent impersonation banner, visible event/organizer context, exit action,
   and audit-reason capture before sensitive changes.
6. **Certificate layout** — fixed template for MVP with configurable logo, colors, sponsor strip, signature,
   and text fields. Freeform customization comes later.
7. **Insurance placement** — opt-in before payment only for MVP. Post-registration insurance purchase is deferred;
   P-25 only shows policy/status for users who opted in during checkout.
8. **Publish gate rules** — block public registration when basics, distance/fee, dates, capacity, policies/waiver,
   privacy notice, payment account, or confirmation template are missing. Treat branding, optional insurance,
   coupons, and non-critical instructions polish as warnings.
9. **RBAC model** — Owner, Admin, Event Editor, Finance, Support/Check-in, and Read-only Viewer. Require audit
   reasons for publish/unpublish, refunds, PII exports, impersonation, manual payment overrides, bulk deletes,
   and role changes.
10. **Manual fallback promise** — degraded states should be explicit: say what is safe, what is delayed, expected
    follow-up, support contact, and whether Corral staff can process it manually with audit notes.
11. **Privacy request handling** — support/admin-assisted for MVP. Add public support affordances, but manage
    verification, SLA, status, and resolution inside A-07.
12. **Payment reconciliation labels** — use one shared label set: `Payment Started`, `Payment Pending`,
    `Paid — Awaiting Webhook`, `Paid & Confirmed`, `Confirmation Sent`, `Settlement Pending`, `Settled`,
    `Refund Requested`, `Refund Processing`, `Refunded`, `Failed`, `User Abandoned`, `Duplicate Payment`,
    and `Needs Review`.

---

## G. Review findings addressed

- Promoted **payment onboarding/monitoring**, **core communications**, **race-day instructions**, and
  **audit log** to P0 because they are required for the first paid trust-loop pilot.
- Promoted **permissions checklist**, **medical roster**, and **insurance status** into P1 MVP coverage so
  trust tools are not accidentally treated as post-MVP.
- Added missing screens/patterns for **insurance opt-in**, **team roles/RBAC**, **event publish readiness**,
  **operations/job health**, **access denied**, **CSV upload validation**, **degraded/manual backup**, and
  **webhook/reconciliation pending**.
- Clarified that P2 means lower build priority, not automatic removal from the MVP scope.

---

## Screen count summary

| Surface | Screens |
|---|---:|
| A. Participant | 26 |
| B. Organizer | 37 |
| C. Admin Console | 8 (+ mirrors of B) |
| D. Shared / System | 11 |
| **Total (unique)** | **82** |
