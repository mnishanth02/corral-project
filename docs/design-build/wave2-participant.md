# Corral — Wave-2 Participant Build Specs

> These are in-app frontend build specs for the Wave-2 participant screens P-04, P-10, P-10A,
> P-16, P-17, P-18, and P-25. Build the screens directly in `apps/web` as React route files or
> route-owned components. Do not call a backend; wire typed mock fixtures from `apps/web/src/mocks/*`.
>
> Follow `docs/design-build/navigation-and-routes.md` for navigation shells, breadcrumbs, explicit back
> links, deep-linkable search params, and route ownership. Route/file assignments below use the locked
> canonical route table from the build plan; do not invent alternate paths.

Sources of truth: `docs/design-build-guide.md`, `docs/wireframe-screens.md`, `docs/design-system.md`,
`docs/product-progress.md`, `docs/design-build/navigation-and-routes.md`, and the locked build plan in
session state. Use the Build Tracker vocabulary: `Not started · Scaffolded · In progress · Built · Reviewed · Needs changes · Blocked`.

Build conventions for this file:
- App: `web`; surface: Participant mobile 390px; theme: Light.
- Mock data only: typed modules in `apps/web/src/mocks/`, with local types in `apps/web/src/mocks/types.ts`.
- Demo states: every listed state must be deterministic via `?demo=` using the canonical enum
  `default | empty | loading | error | validation-error | success | permission-denied | offline | webhook-pending`.
- Flow state: use `apps/web/src/mocks/store.ts` for registration/group checkout data; fake mutations use
  `apps/web/src/mocks/utils.ts` `mockMutate(payload, { demo })`.
- P-10 Coupon is not a route. It is a component inside P-11 Order Summary per D11.
- No participant-paid convenience fee copy. Organizer-absorbed fee notes only.

---

## P-04 — Refund / Cancellation Policy

**Build spec comparison**
- Stub: long-form legal page with back-to-checkout; default state.
- Settled decision #3: refund policy is a full page, not a modal, for readability and shareability.
- Build like P-05 waiver page: Oswald title, version/last-updated, anchored sections, explicit back link.
- Policy content is organizer-authored in O-09 but rendered provider-neutral; never expose settlement internals,
  gateway keys, stack traces, private hostnames, or backend details.
- Use shared payment/reconciliation wording: `Refund Requested · Refund Processing · Refunded`.
- The browser reads `apps/web/src/mocks/events.ts` / `policies.ts`; no backend call.

```text
SCREEN: P-04 — Refund / Cancellation Policy
APP / SURFACE: web · Participant mobile 390px
ROUTE: /events/$eventId/policy/refund  →  events.$eventId.policy.refund.tsx            THEME: Light
NAV: Entry from P-08/P-11 "Read refund policy" and event footer; breadcrumb Event ▸ Policies ▸ Refund via route staticData; explicit Back link returns to `/events/$eventId/register/summary` or the prior checkout step from mock store; standalone shareable URL. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Present the organizer's full refund and cancellation policy so a runner can understand cancellation windows,
refund eligibility, refund timelines, and support contacts before paying.

LAYOUT
Mobile 390px full page. Top bar from participant root shell. Long-form centered column with h1 "Refund &
Cancellation Policy", event/race-date sub-line, "Last updated 02 Jun 2026 · v1.2", compact in-page anchor
chips, an "At a glance" callout card, readable legal body sections, and bottom padding for the sticky bar.
Sticky bottom bar: primary "Back to registration" link plus "Share / Print" text action.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`@corral/ui/components/breadcrumb`, `button`, `card`, `badge`, `alert`, `separator`, `tooltip`, `toast`,
and long-form typography. Anchor chips are Button/Badge links. Back navigation uses TanStack `<Link>`, not
`history.back()`.

CONTENT / COPY  (real Coimbatore content)
Sections: "1. At a glance", "2. Cancellation by the participant", "3. Cancellation or postponement by the
organizer", "4. Refund timelines", "5. How refunds are issued", "6. Non-refundable items", "7. How to
request a refund", "8. Contact".
Sample copy: "Cancel up to 14 days before race day (28 Jun 2026) for a 90% refund. Within 14 days,
registrations are non-transferable and non-refundable except where the organizer cancels the event." Timeline:
"Approved refunds are processed within 5–7 business days to your original payment method." Status note:
"Track a refund as Refund Requested → Refund Processing → Refunded on your registration page."

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/events.ts`, `apps/web/src/mocks/policies.ts`, `apps/web/src/mocks/registrations.ts`.
Shape: `EventSummary`, `RefundPolicy`, optional `RegistrationDraft` return target.
Sample Coimbatore rows:
- Event: `cbe-marathon-2026`, "Coimbatore Marathon 2026", CODISSIA Trade Fair Complex, Sun 28 Jun 2026.
- Organizer: "Coimbatore Runners Foundation"; contact `support@coimbatorerunners.example`, WhatsApp `+91 98765 43210`.
- Policy: v1.2, lastUpdated `2026-06-02`, 90% refund until `2026-06-14`, 5–7 business days.

STATES  (default · loading · error · offline)
- default: fully-authored policy.
- loading: skeleton for header, anchor chips, and section blocks.
- error: event/policy missing; show retry and link back to event.
- offline: degraded banner and cached policy copy if available.
Demo URLs:
- `/events/cbe-marathon-2026/policy/refund?demo=default`
- `/events/cbe-marathon-2026/policy/refund?demo=loading`
- `/events/cbe-marathon-2026/policy/refund?demo=offline`

INTERACTIONS / MICROCOPY
Anchor chips scroll to sections. Share copies the public policy URL and shows toast "Link copied". Tooltip on
refund status terms: "This matches the status shown on your registration page." Back link preserves draft state
through `src/mocks/store.ts`.

RESPONSIVE
Mobile reading measure; tablet centers content around 560px. Sticky bar uses `env(safe-area-inset-bottom)` and
never overlaps the final paragraph.

ACCESSIBILITY
One h1 and sequential h2s. Anchor chips keyboard-focusable with visible focus. High contrast body text. Tooltip
terms remain readable as plain text. Share/print actions have accessible labels.

TOKENS USED
Light theme; neutral foreground/muted-foreground; brand-tint wash for "At a glance"; info text for tracking
note; orange primary CTA.

BUILD CHECKLIST
[ ] route file created [ ] policy fixture wired [ ] readable long-form [ ] version/date shown [ ] back-to-registration preserves state [ ] reconciliation terms match shared labels [ ] no participant-paid convenience fee implied [ ] share/print link [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-10 — Coupon Code Entry

**Build spec comparison**
- Stub: coupon input, apply, applied row; invalid, valid/applied, expired, usage-cap reached.
- P-10 is a component inside P-11 Order Summary, not a route (D11). Build it near the P-11 route component,
  e.g. `apps/web/src/routes/events.$eventId.register.summary.tsx` can import a local/route-owned
  `CouponCodeEntry` component.
- Coupon codes are sponsor/club/influencer codes with percentage or flat discounts and usage caps.
- Discount applies on top of current early-bird tier; show both lines clearly and never introduce a
  participant-paid convenience-fee row.

```text
SCREEN: P-10 — Coupon Code Entry
APP / SURFACE: web · Participant mobile 390px
ROUTE: Component inside /events/$eventId/register/summary  →  events.$eventId.register.summary.tsx (P-11; no separate P-10 route)            THEME: Light
NAV: No standalone navigation. Entry is the collapsible "Have a coupon?" row in P-11 Order Summary. Applying/removing updates P-11 totals in the register mock store. Reference `docs/design-build/navigation-and-routes.md` and D11.

PURPOSE
Let a runner apply one sponsor, club, or influencer coupon during checkout and immediately see the discount in
the order total.

LAYOUT
Bordered coupon block inside the P-11 summary card. Collapsed row "Have a coupon code?" expands to a single-line
Input plus Apply button. Helper/error text below. When applied, collapse to an applied row with code chip,
discount amount, and Remove action; recomputed total remains visible beneath the totals separator.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`input`, `button`, `badge`, `alert`, `spinner`, `skeleton`, `tooltip`, `toast`, `separator`. Input uses
`inputmode="text"`, `autocomplete="off"`, uppercase display, and a visible label. Applied row uses Badge +
success text + ghost Remove button.

CONTENT / COPY  (real Coimbatore content)
Trigger: "Have a coupon code?" Placeholder: "Enter code (e.g. CLUB10)". Helper: "Codes are case-insensitive."
Applied: "ASICS500 applied — ₹500 off". Invalid: "That code isn't valid for this event." Expired: "This code
expired on 15 Jun 2026." Usage cap: "This code has reached its usage limit." Loading: "Checking…" Remove:
"Remove coupon". Toast: "Coupon applied — ₹500 off".

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/coupons.ts`, `apps/web/src/mocks/registrations.ts`, `apps/web/src/mocks/store.ts`, `apps/web/src/mocks/utils.ts`.
Shape: `Coupon { code, label, type: 'flat' | 'percent', value, expiresAt, usageCap, usedCount, eligibleEventIds }`; `OrderDraft` totals.
Sample Coimbatore rows:
- `CLUB10`: 10% off for Kongu Runners Club, expires 20 Jun 2026, usage cap 200.
- `ASICS500`: ₹500 off sponsor code, expires 15 Jun 2026, usage cap 100.
- `CODISSIAFULL`: cap reached for CODISSIA corporate partner.

STATES  (default · loading · validation-error · success · error)
- default: collapsed/empty coupon input.
- loading: validating code with spinner and disabled Apply.
- validation-error: invalid, expired, usage-cap reached as deterministic fixture cases.
- success: applied and removable; totals recomputed.
- error: unexpected fixture/mutation failure with retry, not random.
Demo URLs:
- `/events/cbe-marathon-2026/register/summary?demo=default`
- `/events/cbe-marathon-2026/register/summary?demo=validation-error`
- `/events/cbe-marathon-2026/register/summary?demo=success`

INTERACTIONS / MICROCOPY
Trim and uppercase input before validating through mock utilities. Re-applying replaces the previous code.
Remove restores pre-coupon total. Errors keep entered text so the runner can edit. Animate total change lightly;
no backend calls.

RESPONSIVE
Input and Apply remain on one row down to 360px; Apply has a 44px minimum tap target. Optional dialog variant
centers around 360px but still owned by P-11.

ACCESSIBILITY
Input label "Coupon code". Error text linked with `aria-describedby` and announced with `aria-live="polite"`.
Success/error uses icon + text, never color alone. Focus rings on input and buttons.

TOKENS USED
Light theme; success text for applied discount; danger text for invalid/cap; warning text for expired; orange
Apply when actionable; muted helper text.

BUILD CHECKLIST
[ ] route-owned component inside P-11 [ ] no separate route [ ] validating state [ ] invalid/expired/cap states [ ] applied row removable [ ] discount type and amount shown [ ] total recomputes [ ] no convenience-fee row introduced [ ] mobile-safe input attributes [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-10A — Insurance Add-on Opt-in

**Build spec comparison**
- Stub: coverage summary, premium, opt-in/skip; not enabled, unavailable, opted-in, declined.
- MVP is opt-in before payment only. P-25 is view-only; do not add post-registration purchase.
- Insurance is partner-underwritten and optional unless the organizer/category makes it unavailable or hidden.
- Consent must be explicit and unchecked by default, including insurer data-sharing consent. Minor/nominee
  handling connects to P-09 but is represented here with fixtures.

```text
SCREEN: P-10A — Insurance Add-on Opt-in
APP / SURFACE: web · Participant mobile 390px
ROUTE: /events/$eventId/register/insurance  →  events.$eventId.register.insurance.tsx            THEME: Light
NAV: Child of `events.$eventId.register.tsx` wizard shell. Back link to `/events/$eventId/register/waiver`; Continue to `/events/$eventId/register/summary`; Skip continues to summary without premium. Bare `/events/$eventId/register` redirects to category per D12. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Offer optional event accident insurance before payment with a transparent coverage summary, premium, insurer
terms, and explicit opt-in/skip decision.

LAYOUT
Single coverage card with insurer badge/logo, Optional tag, coverage bullets, large premium figure, explicit
opt-in checkbox, conditional insurer data-sharing checkbox, conditional nominee mini-form, terms link, and sticky
footer with "Add & continue" plus "Skip insurance".

KEY COMPONENTS  (map to @corral/ui / shadcn)
`card`, `avatar`, `badge`, `checkbox`, `input`, `select`, `alert`, `button`, `tooltip`, `separator`, `toast`,
`skeleton`. Use Lucide check icons for coverage bullets. Sticky footer uses route shell slot.

CONTENT / COPY  (real Coimbatore content)
Title: "Add event insurance?" Sub: "Optional cover underwritten by ICICI Lombard for race day." Coverage:
"Accidental death & disablement up to ₹2,00,000", "Medical expenses up to ₹25,000", "Valid for race day — Sun
28 Jun 2026". Opt-in: "Add accident insurance for ₹49 per runner." Data sharing: "I agree to share my name,
age and contact with the insurer to issue this policy." Minor note: "A nominee is required because this runner
is under 18 — please add a parent/guardian nominee." Terms: "Read the insurer's policy terms ↗". CTAs:
"Add & continue" / "Skip insurance".

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/insurance.ts`, `apps/web/src/mocks/registrations.ts`, `apps/web/src/mocks/events.ts`, `apps/web/src/mocks/store.ts`.
Shape: `InsuranceOffer { enabled, insurerName, premium, coverage, eligibilityRules, requiresNominee }`; `RunnerDraft`.
Sample Coimbatore rows:
- ICICI Lombard offer: ₹49, coverage ₹2,00,000 / medical ₹25,000, valid 28 Jun 2026.
- Runner: Priya Raman, 10K, age 29, eligible.
- Minor runner: Aarav Kumar, 5K, age 16, nominee required.
- Unavailable: 21K elite category or runners under 12.

STATES  (default · empty · validation-error · success)
- default: insurance offered, unchecked opt-in.
- empty: organizer disabled insurance; neutral note and continue to summary.
- validation-error: unavailable for category/age or missing nominee/data-sharing consent.
- success: opted-in valid and premium added to order draft; declined/skip also returns success path with no premium.
Demo URLs:
- `/events/cbe-marathon-2026/register/insurance?demo=default`
- `/events/cbe-marathon-2026/register/insurance?demo=empty`
- `/events/cbe-marathon-2026/register/insurance?demo=validation-error`

INTERACTIONS / MICROCOPY
Opt-in starts unchecked. Checking reveals data-sharing consent (unchecked) and nominee form when required.
"Add & continue" is blocked until nominee and consent are valid: "Add a nominee to continue." Skip shows toast
"No insurance added." Premium must exactly match the P-11 line item.

RESPONSIVE
Single column on mobile; sticky footer uses `env(safe-area-inset-bottom)` and remains above keyboard when nominee
fields are focused. Tablet centers at ~480px.

ACCESSIBILITY
Checkbox labels are full clickable targets. Nominee fields are labeled. Eligibility reason uses icon + text.
External terms link is marked. Focus rings on all controls.

TOKENS USED
Light theme; info accents for coverage; success text for covered bullets; warning text for unavailable; muted for
not-enabled note; orange primary CTA; neutral secondary Skip.

BUILD CHECKLIST
[ ] route file created under register wizard [ ] offer fixtures wired [ ] opt-in default unchecked [ ] explicit insurer data-sharing consent [ ] nominee required for minors [ ] not-enabled and unavailable states [ ] premium matches P-11 line item [ ] terms link [ ] skip path clear [ ] not relabeled as convenience fee [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-16 — Group Registration Entry

**Build spec comparison**
- Stub: add-row repeater + CSV paste, running total; row errors and duplicate detection.
- Group registration means one coordinator registers many runners, pays once, and receives one GST invoice.
- Capture coordinator, GST/billing details, runner rows, per-runner category/T-shirt, DPDP authority attestation,
  duplicate flags, and minor/guardian details before review.
- Persist flow data through `apps/web/src/mocks/store.ts`; no account or backend required.

```text
SCREEN: P-16 — Group Registration Entry
APP / SURFACE: web · Participant mobile 390px
ROUTE: /events/$eventId/group  →  events.$eventId.group.index.tsx            THEME: Light
NAV: Child of group shell `events.$eventId.group.tsx`. Entry from event page "Register a group / team" CTA. Back link to `/events/$eventId`; Continue to `/events/$eventId/group/roster`. Bare group shell owns any shared stepper. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Let a club/corporate coordinator add many runners by repeated rows or CSV paste, capture coordinator and GST
details, confirm DPDP authority, and see a running total before review.

LAYOUT
Mobile-first scrolling page. Top coordinator + invoice details card. Middle "Runners" section with Tabs: "Add
rows" and "Paste CSV". Rows render as compact expandable cards on mobile; each includes core fields and per-row
fee/status. Sticky bottom bar shows runner count, running total, and "Review roster".

KEY COMPONENTS  (map to @corral/ui / shadcn)
`card`, `tabs`, `input`, `select`, `textarea`, `checkbox`, `button`, `badge`, `alert`, `table`/data-table for
wide view, `separator`, `toast`, `skeleton`, `progress`. Runner fields: name, mobile, email, gender, DOB,
distance/category, T-shirt size, emergency contact, club/team. Conditional guardian mini-form for minors.

CONTENT / COPY  (real Coimbatore content)
Section: "Coordinator & invoice details" with coordinator name, mobile, email, organisation/club name, GST
registered toggle, GSTIN, billing address, state/place of supply. Runners section: "Add your team". CSV helper:
"Paste columns: Name, Mobile, Email, Gender, DOB, Distance, T-shirt. First row = headers." Attestation: "I'm
registering these runners with their consent and I'm authorised to share their details." Minor chip: "Under 18 —
guardian consent needed". Sticky bar: "8 runners · ₹5,592 · Review roster".

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/groupRegistrations.ts`, `apps/web/src/mocks/events.ts`, `apps/web/src/mocks/registrations.ts`, `apps/web/src/mocks/store.ts`, `apps/web/src/mocks/utils.ts`.
Shape: `GroupDraft { coordinator, billing, runners, totals, issues }`; `RunnerDraft`; `ValidationIssue`.
Sample Coimbatore rows:
- Coordinator: Meena Subramanian, Kongu Runners Club, Coimbatore, GSTIN `33AABCK1234M1Z5`, place Tamil Nadu.
- Runner: Priya Raman, 10K, M tee, ₹699 early-bird.
- Runner: Karthik S, 21K, L tee, duplicate mobile issue.
- Runner: Aarav Kumar, 5K, age 16, guardian required.

STATES  (default · validation-error · success · loading)
- default: editable coordinator card with one blank runner row and sample CSV hint.
- validation-error: per-cell row errors, duplicate detection, missing attestation, invalid GSTIN, minor missing guardian.
- success: CSV parse success or all required fields ready for roster review.
- loading: parsing CSV / recalculating totals skeleton or progress.
Demo URLs:
- `/events/cbe-marathon-2026/group?demo=default`
- `/events/cbe-marathon-2026/group?demo=validation-error`
- `/events/cbe-marathon-2026/group?demo=success`

INTERACTIONS / MICROCOPY
"Add runner" appends blank row. CSV Parse maps headers to rows and reports "Parsed 8 runners, 1 row needs
attention." Inline errors: "Enter a valid 10-digit mobile", "Select a distance". Duplicate: "This mobile is
already in your list (row 3)." Running total updates as categories change. Review is blocked until coordinator,
GST fields when needed, attestation, and rows are valid: "Fix 2 rows to continue."

RESPONSIVE
Mobile rows stack as cards. Tablet/wide can render a horizontally scrollable table with sticky first column.
Sticky bar uses `env(safe-area-inset-bottom)`.

ACCESSIBILITY
Every repeated field has a programmatic label including runner number. Errors announced per row with
`aria-live="polite"`. Duplicate/minor flags use icon + text. Attestation checkbox hit area includes label.
Running total changes announced politely.

TOKENS USED
Light theme; danger text for row errors; warning text for duplicate/minor; info for CSV helper; success text for
clean rows; orange Review CTA; muted helper text.

BUILD CHECKLIST
[ ] route file created under group shell [ ] group store fixtures wired [ ] add-row repeater [ ] CSV paste and parse [ ] per-runner category and T-shirt [ ] running total honors early-bird [ ] row-error state [ ] duplicate detection [ ] coordinator and GST fields [ ] DPDP authority attestation unchecked by default [ ] minor guardian details/flag [ ] mobile input attributes [ ] sticky safe-area [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-17 — Group Roster Review

**Build spec comparison**
- Stub: per-row validation table, totals; row errors and all valid.
- This is the validate-before-pay gate between P-16 and P-18. Duplicate and guardian flags persist and block
  payment until resolved.
- Totals include subtotal, early-bird, optional group coupon using P-10 component pattern, GST expectation,
  organizer-absorbed fee note, and grand total.

```text
SCREEN: P-17 — Group Roster Review
APP / SURFACE: web · Participant mobile 390px
ROUTE: /events/$eventId/group/roster  →  events.$eventId.group.roster.tsx            THEME: Light
NAV: Child of group shell. Entry from P-16 "Review roster". Back link to `/events/$eventId/group` preserving draft. Row Edit links target `/events/$eventId/group?runner=<runnerId>` search param. Continue to `/events/$eventId/group/payment` only when all rows are valid. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Show the coordinator a validated roster and payment-ready totals so every error is fixed before one group payment.

LAYOUT
Header summary card with runner count, valid count, needs-fix count, and group total. Validation list/table of
runners with name, category, T-shirt, fee, status, and Edit link. Totals card: subtotal, early-bird applied,
optional group coupon row, GST note, organizer-absorbed fee note, grand total. Sticky "Proceed to payment" CTA.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`card`, `table`/data-table or stacked rows, `badge`, `button`, `alert`, `separator`, P-10 coupon component,
`toast`, `skeleton`, `tooltip`. Per-row status Badge labels: Valid, Needs fix, Duplicate, Guardian consent.

CONTENT / COPY  (real Coimbatore content)
Header: "Review your team (8 runners)". Counts: "6 valid · 2 need fixing". Valid row: "Priya Raman · 10K · M ·
₹699 · Valid". Issue row: "Karthik S · 21K · Needs fix — invalid mobile · Edit". Totals: "Subtotal ₹5,592",
"Early bird −₹800", "Coupon CLUB10 −₹559", "GST: included as applicable", "Convenience fee absorbed by the
organizer." Grand total: "Pay ₹4,233 for 8 runners". Blocking banner: "Fix 2 runners before payment."

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/groupRegistrations.ts`, `apps/web/src/mocks/coupons.ts`, `apps/web/src/mocks/store.ts`.
Shape: `GroupDraft`, `GroupRosterRow`, `GroupTotals`, `Coupon`.
Sample Coimbatore rows:
- Priya Raman, 10K, M tee, ₹699, Valid.
- Karthik S, 21K, L tee, invalid mobile / Duplicate.
- Aarav Kumar, 5K, S tee, Guardian consent required.
- Group coupon `CLUB10`, −₹559.

STATES  (default · validation-error · success · loading)
- default: roster loaded with mixed statuses.
- validation-error: one or more blocking row issues; CTA disabled; banner shown.
- success: all rows valid and CTA enabled.
- loading: roster/totals skeleton.
Demo URLs:
- `/events/cbe-marathon-2026/group/roster?demo=default`
- `/events/cbe-marathon-2026/group/roster?demo=validation-error`
- `/events/cbe-marathon-2026/group/roster?demo=success`

INTERACTIONS / MICROCOPY
Edit links deep-link back to P-16 row. Applying/removing group coupon recomputes grand total and shows toast
"Coupon applied to group — ₹559 off". Disabled CTA exposes reason: "Fix 2 runners before payment." Duplicate
rows must be removed or corrected.

RESPONSIVE
Mobile stacked rows with status badges. Tablet/wide can render true table with sticky header/name column.
Totals and sticky CTA stay reachable with safe-area padding.

ACCESSIBILITY
Status uses icon + text. Edit links include runner name. Totals are label/value pairs. Blocking banner uses
`aria-live="assertive"`. Focus rings on row actions and CTA.

TOKENS USED
Light theme; success text for Valid and discounts; danger text for Needs fix; warning for Duplicate/Guardian;
muted notes; orange Proceed CTA.

BUILD CHECKLIST
[ ] route file created [ ] group draft loaded from store [ ] per-row validation table/list [ ] valid vs needs-fix counts [ ] error and all-valid states [ ] edit deep-links to P-16 [ ] totals include subtotal/early-bird/coupon/GST [ ] absorbed-fee note [ ] duplicate and guardian flags persist [ ] CTA gated until all valid [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-18 — Group Payment + GST Invoice

**Build spec comparison**
- Stub: one payment, coordinator + GST fields; default and GST vs non-GST.
- One payment covers all runners and one invoice/receipt is generated for the coordinator/organisation.
- GST invoice adapts for GST-registered organizers: intra-state CGST/SGST or inter-state IGST. Non-GST
  organizers get a simple receipt, no tax breakup, with a clear explanation.
- Payment is mocked Razorpay-style handoff only; statuses are deterministic through `?demo=`.

```text
SCREEN: P-18 — Group Payment + GST Invoice
APP / SURFACE: web · Participant mobile 390px
ROUTE: /events/$eventId/group/payment  →  events.$eventId.group.payment.tsx            THEME: Light
NAV: Child of group shell. Entry from P-17 "Proceed to payment". Back link to `/events/$eventId/group/roster`. Edit billing link returns to `/events/$eventId/group?section=billing`. Success can link to `/my/registrations/$registrationId`. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Take a single group payment and issue one invoice: GST tax invoice when applicable, or simple receipt for
non-GST club/trust organizers.

LAYOUT
Top summary card: "Paying for 8 runners" and grand total. Coordinator/billing details card with Edit link.
Invoice preview card adapting to GST intra-state, GST inter-state, or non-GST receipt. Payment method section
with UPI, Card, Netbanking radios. Sticky "Pay ₹4,233" CTA. Post-pay status area shows reconciliation labels
and invoice ready actions.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`card`, `badge`, `radio-group`, `button`, `alert`, `progress`, `spinner`, `separator`, `toast`, `skeleton`,
`tooltip`. Invoice preview uses label/value rows. Status uses shared `StatusBadge` / PendingBanner pattern.

CONTENT / COPY  (real Coimbatore content)
Header: "One payment for your team". Details: "Bill to: Kongu Runners Club · GSTIN 33AABCK1234M1Z5 · Coimbatore ·
Place of supply: Tamil Nadu". GST invoice rows: "Taxable value ₹3,587", "CGST 9% ₹323", "SGST 9% ₹323",
"Invoice total ₹4,233", "HSN/SAC 999692". Inter-state: "Place of supply: Karnataka", "IGST 18% ₹646". Non-GST:
"Your organiser (Kongu Runners Trust) is not GST-registered — you'll receive a payment receipt, not a tax
invoice." Note: "Convenience fee absorbed by the organizer." Processing: "Paid — Awaiting Webhook. Don't close
this page." Success: "Paid & Confirmed — invoice ready." CTA: "Pay ₹4,233".

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/groupRegistrations.ts`, `apps/web/src/mocks/payments.ts`, `apps/web/src/mocks/registrations.ts`, `apps/web/src/mocks/store.ts`, `apps/web/src/mocks/utils.ts`.
Shape: `GroupPaymentDraft`, `InvoicePreview`, `MockPaymentStatus`, `BillingProfile`.
Sample Coimbatore rows:
- GST intra-state: Kongu Runners Club, GSTIN `33AABCK1234M1Z5`, Tamil Nadu, CGST/SGST split.
- GST inter-state: Bengaluru Corporate Runners, place Karnataka, IGST 18%.
- Non-GST: Kongu Runners Trust, Coimbatore, receipt only.
- Payment status labels: Payment Started, Paid — Awaiting Webhook, Paid & Confirmed, Confirmation Sent.

STATES  (default · webhook-pending · success · error · validation-error)
- default: pre-pay with selected payment method and invoice preview.
- validation-error: billing/GST details need correction; pay disabled.
- webhook-pending: payment captured but confirmation pending; show shared label and do not double-charge.
- success: Paid & Confirmed, invoice ready with Download/Email.
- error: failed/duplicate payment/needs review; safe retry or support path.
Demo URLs:
- `/events/cbe-marathon-2026/group/payment?demo=default`
- `/events/cbe-marathon-2026/group/payment?demo=webhook-pending`
- `/events/cbe-marathon-2026/group/payment?demo=success`

INTERACTIONS / MICROCOPY
Edit billing returns to P-16 billing section. Pay invokes `mockMutate` and transitions deterministically by
`?demo=`. Webhook-pending copy: "Don't close this page." Failure shows reason, "Retry payment", and support;
Duplicate Payment guard says "We found a payment attempt for this group. We won't charge again while we check."
Download invoice and email invoice are mocked actions with toast.

RESPONSIVE
Mobile single column. Invoice preview scrolls if needed. Sticky Pay CTA uses `env(safe-area-inset-bottom)` and
stays above keyboard. Tablet centers around 480px.

ACCESSIBILITY
GST/non-GST conveyed with badge icon + text. Amounts are labeled. Status labels are text, not color-only.
Payment radios keyboard-operable. Focus rings on Pay, Edit, Download, and support actions.

TOKENS USED
Light theme; info for GST notes; muted for non-GST note; success text for Paid & Confirmed; warning text for
Awaiting Webhook; danger text for failure; orange Pay CTA.

BUILD CHECKLIST
[ ] route file created [ ] payment and invoice fixtures wired [ ] single combined payment [ ] one invoice/receipt [ ] GST tax-invoice layouts with GSTIN/place/CGST-SGST or IGST/HSN-SAC [ ] non-GST receipt variant and note [ ] shared reconciliation labels [ ] absorbed-fee note [ ] download/email invoice actions [ ] failure retry and Duplicate Payment/Needs Review states [ ] sticky safe-area [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## P-25 — Insurance Policy / Add-on Status

**Build spec comparison**
- Stub: coverage, policy status, support path; active, pending, support.
- MVP is view-only. Show policy/status only for registrations that opted in during checkout; no purchase action.
- Access is from the registration hub/e-ticket flow and uses the same magic-link/OTP recovery pattern as P-19.
- Include empty and loading states plus support/claims actions.

```text
SCREEN: P-25 — Insurance Policy / Add-on Status
APP / SURFACE: web · Participant mobile 390px
ROUTE: /my/registrations/$registrationId/insurance  →  my.registrations.$registrationId.insurance.tsx            THEME: Light
NAV: Child of ticket shell `my.registrations.$registrationId.tsx`. Entry from P-19 registration hub / e-ticket "Insurance" link. Back link to `/my/registrations/$registrationId`. Link-expired/OTP recovery uses the P-19 access pattern. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Let a runner who opted into insurance view coverage, policy status, policy document, nominee details, and support
or claim paths.

LAYOUT
Header with status badge. Coverage card with insurer logo/avatar, sum insured, covered items, and validity.
Policy-details card with policy number, insured runner, nominee, premium, issued date. Support card with claims/help
actions. Empty state when no insurance exists. Loading skeleton while fixture state resolves.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`badge`, `card`, `avatar`, `button`, `alert`, `skeleton`, `separator`, `toast`. Support actions are links for
WhatsApp, phone, email, and external insurer claim link. Use status badge icon + label.

CONTENT / COPY  (real Coimbatore content)
Title: "Your event insurance". Status: "Active — policy issued". Coverage: "Accidental death & disablement up
to ₹2,00,000 · Medical up to ₹25,000 · Valid Sun 28 Jun 2026". Details: "Policy no. IL-CBE-2026-004217 ·
Insured: Priya Raman · Nominee: R. Raman (Father) · Premium ₹49 · Issued 12 Jun 2026". Pending: "Your policy is
being issued by ICICI Lombard. This usually completes within a few hours." Support: "Need to make a claim or fix
a detail? Contact Corral support." Empty: "This registration doesn't include insurance." Download: "Download
policy PDF".

MOCK DATA  (fixture module + shape + sample rows)
Fixture modules: `apps/web/src/mocks/insurance.ts`, `apps/web/src/mocks/registrations.ts`, `apps/web/src/mocks/tickets.ts`.
Shape: `InsurancePolicy { status, insurerName, coverage, policyNumber, insuredRunner, nominee, premium, issuedAt, documentUrl }`; `RegistrationSummary`.
Sample Coimbatore rows:
- Active: Priya Raman, policy `IL-CBE-2026-004217`, ICICI Lombard, nominee R. Raman (Father), issued 12 Jun 2026.
- Pending: Arjun Nair, premium paid, policy being issued.
- Support: detail mismatch for mobile/email, Corral support WhatsApp `+91 98765 43210`.
- Empty: no insurance on registration `REG-CBE-1042`.

STATES  (default · loading · empty · webhook-pending · error · permission-denied)
- default: active policy issued with download.
- loading: skeleton cards.
- empty: no insurance on this registration.
- webhook-pending: policy issuance pending after premium paid.
- error: needs support / issuance failed / detail mismatch / claim help.
- permission-denied: link expired or OTP required; show recovery action consistent with P-19.
Demo URLs:
- `/my/registrations/reg-cbe-1042/insurance?demo=default`
- `/my/registrations/reg-cbe-1042/insurance?demo=webhook-pending`
- `/my/registrations/reg-cbe-1042/insurance?demo=empty`

INTERACTIONS / MICROCOPY
Download available only when active. Pending offers "Refresh" and can auto-refresh fixture state. Support opens
WhatsApp/dialer/email or external insurer claims link. Detail mismatch: "Some details need fixing before your
policy can be issued — contact support." No purchase/opt-in action anywhere.

RESPONSIVE
Mobile single column. Cards stack. Tablet centers around 480px. Status badge remains visible near the top.

ACCESSIBILITY
Status uses icon + text, not color alone. Policy fields are labeled and legible. External claims link marked.
Support actions are real links/buttons with at least 44px targets. Focus rings present.

TOKENS USED
Light theme; success text for Active; warning text for Pending; danger text for Needs support; info for coverage;
muted for empty; orange primary Download button when active.

BUILD CHECKLIST
[ ] route file created under ticket shell [ ] insurance policy fixtures wired [ ] active/pending/support states [ ] empty and loading states [ ] coverage and sum insured [ ] policy number and nominee [ ] download only when active [ ] support/claims path [ ] view-only, no purchase action [ ] link-expired/OTP recovery consistent with P-19 [ ] states demoable via `?demo=` · nav wired · a11y · model-reviewed
```

---

## Coverage summary

| ID | Name | Route / component | App | Build states |
|---|---|---|---|---|
| P-04 | Refund / Cancellation Policy | `/events/$eventId/policy/refund` → `events.$eventId.policy.refund.tsx` | web | default · loading · error · offline |
| P-10 | Coupon Code Entry | component in `/events/$eventId/register/summary` → `events.$eventId.register.summary.tsx` | web | default · loading · validation-error · success · error |
| P-10A | Insurance Add-on Opt-in | `/events/$eventId/register/insurance` → `events.$eventId.register.insurance.tsx` | web | default · empty · validation-error · success |
| P-16 | Group Registration Entry | `/events/$eventId/group` → `events.$eventId.group.index.tsx` | web | default · validation-error · success · loading |
| P-17 | Group Roster Review | `/events/$eventId/group/roster` → `events.$eventId.group.roster.tsx` | web | default · validation-error · success · loading |
| P-18 | Group Payment + GST Invoice | `/events/$eventId/group/payment` → `events.$eventId.group.payment.tsx` | web | default · webhook-pending · success · error · validation-error |
| P-25 | Insurance Policy / Add-on Status | `/my/registrations/$registrationId/insurance` → `my.registrations.$registrationId.insurance.tsx` | web | default · loading · empty · webhook-pending · error · permission-denied |

> Build Tracker reminder: mark `Built` only when the route/component exists, mock fixtures are wired, all listed
> states are demoable via `?demo=`, navigation works, the 390px target is checked, accessibility passes, and the
> screen has been model-reviewed when non-trivial.
