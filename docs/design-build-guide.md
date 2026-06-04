# Corral — Screen-by-Screen Design Build Guide

> **Purpose:** A repeatable process for **building** the complete Corral frontend directly in the
> React apps — one route file at a time, in journey order, with typed in-repo mock fixtures and no
> backend integration.
>
> **Authoritative route/nav map:** `docs/design-build/navigation-and-routes.md` is the source of truth
> for app ownership, URL paths, TanStack route files, shells, breadcrumbs, and navigation rules.
>
> **Companion docs (sources of truth):**
> - Screens, IDs, priorities, states, waves → [wireframe-screens.md](wireframe-screens.md)
> - Design tokens, themes, fonts, a11y → [design-system.md](design-system.md)
> - Product, trust loop, business rules → [plan.md](plan.md) · [implementation-plan.md](implementation-plan.md)
> - Build status / decisions → [product-progress.md](product-progress.md)
>
> **What "built" means here:** a screen is *built* when its TanStack route file exists in the correct
> app, uses `@corral/ui` + Tailwind tokens, reads only typed mock fixtures, covers every required
> state via deterministic `?demo=` values, has navigation wired, passes the frontend/a11y checklist,
> and is recorded in the **Build Tracker** (Part 5) with route file + commit notes.

---

## Part 0 — How to use this guide

### The in-app build loop (repeat per screen)

1. **Pick the next screen** in build order: foundations first, then wave and journey order.
2. **Read the screen build spec** in Part 4 (or the expanded `docs/design-build/` build-spec file) plus
   the design-system reference in Part 1.
3. **Add the TanStack route file** in the right app (`apps/web` or `apps/console`) using the canonical
   path/file from `docs/design-build/navigation-and-routes.md`.
4. **Build the screen in the React app** with `@corral/ui` components, shadcn patterns, Tailwind tokens,
   and typed mock fixtures only. Do not call a backend or real API.
5. **Cover every listed state** with mock data + local UI state. Use `?demo=` with the canonical enum:
   `default | empty | loading | error | validation-error | success | permission-denied | offline | webhook-pending`.
6. **Run the app (`pnpm dev`)** and verify navigation, links, interactions, responsive target, and `?demo=`
   states in the real route.
7. **Review non-trivial screens with a second model** (GPT-5.5 / Gemini Pro) and resolve feedback.
8. **Mark the Build Tracker row; commit.** Move on only when states, nav, a11y, and review pass.

### Recommended sequencing

- **Build the [Foundations / Design Kit](#part-3--foundations--design-kit-do-this-first) (Part 3) FIRST.**
  The 3 shells, missing `@corral/ui` primitives, and mock utilities block screen work.
- Then work **wave by wave**, and **within a wave follow the journey order** listed in Part 4.
- Keep one route file per screen unless the canonical table says a screen is route-less or a component inside
  another route (for example `P-10` coupon inside `P-11` order summary).

### Tips for consistent in-app builds

- Follow the design-system reference every time; tokens live in `@corral/ui` and
  `packages/ui/src/styles/globals.css`.
- Use the canonical import path for primitives: `@corral/ui/components/<name>`.
- Build all of a screen's required states in the same route, demoable by `?demo=`.
- When a screen belongs to the **race-day command center**, explicitly use the DARK theme tokens.
- Prefer **real, realistic content** (Coimbatore venues, Indian names, ₹ fees, BIB numbers) over lorem ipsum.

### Review guardrails added after plan audit

- **Wave ≠ implementation permission.** Wave 1 is the trust-loop sequence; the first paid pilot still needs
  the separate **Pilot Gate Checklist** below before go-live.
- **Do not build participant checkout with pre-checked consent.** Required consent starts unchecked; the
  success state is "all required consent checked".
- **Build degraded states early.** Razorpay webhook delay, WhatsApp delay, CSV/PDF delay, and manual backup
  paths are trust-loop requirements, not polish.
- **Keep dark command-center work scoped.** The dark kit proves reusable operational patterns and A-08, but a
  full race-day command center remains out of MVP until Phase 3.
- **MVP fee assumption:** build Wave 1 checkout with organizer-absorbed convenience/platform fees only.
  Participant-paid convenience-fee variants are future work.

### Pilot Gate Checklist (must be addressed before the first paid event)

Build or explicitly waive these items before using Corral for a real paid pilot:

- [ ] `O-02` organizer/entity onboarding — org profile, GST vs non-GST, support owner, admin-created org variant.
- [ ] `O-03` payment onboarding active or documented manual/payment-disabled fallback.
- [ ] `O-10A` publish readiness blockers verified: basics, fees, dates, capacity, policies, privacy,
  payment account, confirmation template.
- [ ] `P-09` guardian consent if any category can include minors; otherwise minor registration is blocked.
- [ ] `S-10` degraded/manual backup pattern for Razorpay, WhatsApp, CSV/PDF delays.
- [ ] `S-11` webhook/reconciliation pending pattern for payment/comms callback delays.
- [ ] `O-15` spot/cash/offline registration if expo/walk-in registration is expected.
- [ ] `O-16` T-shirt size summary if shirts are included in the event.
- [ ] `O-17/O-18/O-19` BIB assignment, duplicate validation, and BIB↔chip mapping before kit/timing export.
- [ ] `O-34` permissions checklist reviewed for the organizer's operating model.
- [ ] `O-35` medical/emergency roster available for race control and print/export.
- [ ] Support contact, timing-vendor contact, backup roster export, and communication fallback are documented.

### Frontend Build Checklist (apply to every built route/screen)

- [ ] Inputs use correct `type`, `name`, `autocomplete`, and mobile-friendly `inputmode`.
- [ ] Field errors are inline, paired with icon/text, announced with `aria-live="polite"`, and submit focuses
  the first invalid field.
- [ ] Navigation uses links; actions use buttons. No clickable `div`/`span` patterns.
- [ ] Icon-only actions have accessible labels; decorative icons are hidden from assistive tech.
- [ ] Sticky mobile CTAs account for `env(safe-area-inset-bottom)` and do not cover content or focused fields.
- [ ] Tabs, filters, search, pagination, and expanded table/drawer state are deep-linkable where operationally useful.
- [ ] Large organizer lists use server-side pagination/filtering and avoid rendering unbounded rows.
- [ ] Images/previews have useful alt text when meaningful, empty alt when decorative, and dimensions to avoid layout shift.
- [ ] Motion honors `prefers-reduced-motion`; avoid `transition: all`.
- [ ] Dates/times and rupee amounts are formatted with locale-aware helpers (`Intl.DateTimeFormat`, `Intl.NumberFormat`).
- [ ] Dark command-center screens set dark-native control colors and `color-scheme: dark`.

---

## Part 1 — Design-system reference

> Use this reference while building route files. The same tokens are wired in `@corral/ui` and
> `packages/ui/src/styles/globals.css`; do not duplicate or hard-code divergent values in screens.

PRODUCT IN ONE LINE
Corral helps race organizers run registration, communicate with runners on WhatsApp, publish
results, and issue certificates — with hands-on Corral-team support. The core "trust loop" is:
Registration → Roster → Communicate (WhatsApp) → Results → Certificates.

THREE SURFACES (each screen names which one it is)
1. Participant app — public, UNAUTHENTICATED, MOBILE-FIRST (design at 390px; usable to 414px).
   Celebratory B2C tone. LIGHT theme. Passwordless (magic link + mobile OTP fallback).
2. Organizer dashboard — DESKTOP-FIRST (design at 1280px; tablet fallback). Calm, dense, data-heavy.
   LIGHT theme with an ALWAYS-NAVY left sidebar. Auth: email+password + Google sign-in.
3. Admin console (Corral staff) — mirrors the organizer dashboard. Race-day / command-center
   contexts use the DARK theme (glare-reduced, alerts pop). Has an impersonation ("act-on-behalf") banner.

DESIGN TOKENS (use ONLY these; Tailwind v4 + shadcn/ui conventions)
Light theme:
  background #f8fafc · foreground/text #0f172a (Command Navy)
  card #ffffff · border #e2e8f0 · input border #cbd5e1 · muted-foreground #475569
  PRIMARY (Corral Orange) #ff5a00 · primary-foreground #ffffff (use orange fill for big/bold only)
  brand-orange-strong #c2410c (orange as TEXT on light) · brand-navy #0f172a · brand-tint #fff1ea
  WhatsApp green #25d366 (cheer/share)
  Semantic FILLS: success #10b981 · warning #f59e0b (dark text) · danger #ef4444 · info #0ea5e9
  Semantic TEXT-on-light: success-text #047857 · warning-text #b45309 · danger-text #b91c1c · info-text #0369a1
Dark theme (command center):
  background #0b1120 · card #0f172a · foreground #f1f5f9 · border #1e293b
  primary #ff5a00 · danger #ff4d4d · warning #fbbf24 · success #34d399 · info #38bdf8
Sidebar (ALWAYS navy, even in light dashboard):
  sidebar bg #0f172a · sidebar text #e2e8f0 · active item #ff5a00 · hover #1e293b
Radius: base 0.5rem (sm −4px, md −2px, lg base, xl +4px).

TYPOGRAPHY
  Body/UI: Inter. Headings & numerals/timers/BIB: Oswald (condensed, weight 700, letter-spacing 0.01em,
  often UPPERCASE for BIB-style labels). Live clocks/times use tabular-nums + mono feel.

COMPONENTS
  Built on shadcn/ui (Radix + Tailwind). Use shadcn patterns: Button, Input, Select, Checkbox, Radio,
  Card, Table, Badge, Tabs, Dialog/Sheet (drawer), DropdownMenu, Tooltip, Toast, Skeleton, Alert,
  Progress, Avatar, Separator, Breadcrumb, Pagination. Icons: Lucide. Keep components reusable & consistent.

GLOBAL UX PRINCIPLES
  • Participant flows must be ultra-low-friction (few fields, big tap targets, clear single primary CTA).
  • Organizer/Admin tables are the workhorse: compact-but-readable rows, sticky headers, global search,
    filter chips, column sort, bulk-select, row → right-side detail Drawer. Inline edit only for safe fields.
  • One clear primary action per screen. Destructive actions need confirmation.
  • Use realistic Coimbatore content (e.g. venues like "CODISSIA Trade Fair Complex", "Race Course Road",
    Indian names, ₹ fees, 5K/10K/21K distances, BIB numbers like 1042).

GLOBAL STATE PATTERNS (build the ones each screen lists)
  default · empty · loading (Skeleton) · validation-error · success · failure/retry ·
  permission-denied · webhook/reconciliation-pending · offline/degraded (manual-backup) where relevant.

ACCESSIBILITY (mandatory)
  • Never encode state by color alone — always pair color with an icon AND a text label.
  • Orange/amber/emerald/red FAIL AA as small text on light — use the *-text tokens for colored text.
  • Visible focus ring: 2px solid #ff5a00, 2px offset — critical in dense tables.
  • Comfortable mobile tap targets (≥44px). Sufficient contrast for outdoor/sunlight use.

COMPLIANCE & SHARED LABELS (India / DPDP)
  • DPDP consent: minimal data, explicit waiver + medical declaration checkboxes, communication
    (WhatsApp/SMS/email) consent, and verifiable guardian consent for minors. Show privacy notice links.
  • Convenience fee is ORGANIZER-ABSORBED — show a transparent note, never a participant-paid fee row.
  • Payment / reconciliation status uses ONE shared label set:
    Payment Started · Payment Pending · Paid — Awaiting Webhook · Paid & Confirmed · Confirmation Sent ·
    Settlement Pending · Settled · Refund Requested · Refund Processing · Refunded · Failed ·
    User Abandoned · Duplicate Payment · Needs Review.
  • RBAC roles (organizer/admin): Owner, Admin, Event Editor, Finance, Support/Check-in, Read-only Viewer.
    Sensitive actions (publish/unpublish, refunds, PII exports, impersonation, manual payment overrides,
    bulk deletes, role changes) require an audit reason.

BUILD REQUIREMENTS
  • Build one route file per screen unless the canonical table marks it route-less or a component inside another route.
  • Honor the surface's breakpoint (mobile 390px vs desktop 1280px) and theme (light vs dark).
  • Use the exact tokens above through Tailwind/@corral/ui. Make it look finished and real, not a wireframe.
  • Keep all data in typed mock fixtures; every listed state must be demoable with `?demo=`.

---

## Part 2 — Screen build-spec template

> Every screen in Part 4 follows this schema. When authoring new build specs, copy this and use the
> canonical route/file table from `docs/design-build/navigation-and-routes.md`.

```text
SCREEN: <ID> — <Name>
APP / SURFACE: <web · Participant mobile 390px | console · Organizer desktop 1280px | console · Admin>
ROUTE: <path>  →  <route file>            THEME: <Light | Dark>
NAV: <entry points; links out; breadcrumb/back; nav-shell placement>
PURPOSE
LAYOUT
KEY COMPONENTS  (map to @corral/ui / shadcn)
CONTENT / COPY  (real Coimbatore content)
MOCK DATA  (fixture module + shape + sample rows; no backend/API calls; list demo URLs with ?demo=)
STATES  (default · empty · loading · validation-error · success · failure/retry · permission-denied ·
         webhook/reconciliation-pending · offline/degraded — only the ones this screen needs)
INTERACTIONS / MICROCOPY
RESPONSIVE
ACCESSIBILITY
TOKENS USED
BUILD CHECKLIST  (states covered via ?demo= · nav wired · a11y · model-reviewed when non-trivial)
```

---

## Part 3 — Foundations / Design Kit (do this FIRST)

> Build these foundations in the app before screen work. They are shared dependencies, not throwaway mockups.
> Existing `@corral/ui` components: `alert`, `button`, `card`, `field`, `input`, `label`, `separator`,
> `spinner`, `status-badge`. Until a primitive exists, every spec still references the canonical import path
> `@corral/ui/components/<name>` so route files never diverge.

### KIT-1 — Core `@corral/ui` primitives (light theme)

Build or verify these in `packages/ui` using the tokens in `packages/ui/src/styles/globals.css`:
- Existing primitives: alert, button, card, field, input, label, separator, spinner, status-badge.
- Must-add primitives: badge, checkbox, radio-group, select, textarea, table (+ data-table wrapper), tabs,
  dialog, sheet(drawer), dropdown-menu, tooltip, toast, skeleton, progress, avatar, breadcrumb, pagination,
  sidebar.
- Required variants/states: buttons (primary, secondary, outline, ghost, destructive, WhatsApp; disabled/loading),
  form fields with helper/error, status badges for all 14 payment labels + result statuses, cards, tabs,
  breadcrumb, pagination, tooltip, toast/alert, progress, skeleton, avatar, separator, dropdown menu.
- Focus ring must be visible (2px orange, 2px offset); Inter for UI, Oswald for headings/numerals.

### KIT-2 — App shells, data table, detail drawer

Build the shared app structure before route screens:
- Participant shell in `apps/web`: root top bar + per-screen sticky bottom CTA slot; light, mobile-first.
- Organizer shell in `apps/console`: `_authenticated.tsx` pathless layout with ALWAYS-NAVY left sidebar,
  event-context switcher, topbar, breadcrumbs via route `staticData`, and mock-auth personas.
- Admin shell in `apps/console`: `admin.tsx` layout with admin sidebar, RBAC guard, impersonation banner, and
  dark-theme capability for ops/race-day contexts.
- Data table pattern: sticky header, compact rows, checkbox bulk-select, sortable columns, search/filter chips,
  pagination, row → right-side Sheet drawer, empty/filtered-empty/loading states.

### KIT-3 — Mock fixtures, system states, dark command-center kit

Build the mock and system layer that every screen can reuse:
- `apps/web/src/mocks/` and `apps/console/src/mocks/` typed modules: `events.ts`, `registrations.ts`, `roster.ts`,
  `results.ts`, `comms.ts`, `payments.ts`, `coupons.ts`, `bibs.ts`, `organizers.ts`, `tickets.ts`, `audit.ts`, etc.
- `src/mocks/types.ts` in each app for local DTOs until backend schemas land.
- `src/mocks/utils.ts`: deterministic `mockMutate(payload, { demo })` and helpers keyed by `?demo=`; no random failures.
- `src/mocks/store.ts`: in-memory flow store (optionally localStorage-backed) for registration/setup/results wizards.
- `src/mocks/personas.ts`: `org-owner`, `org-staff`, `org-readonly`, `corral-admin`,
  `corral-admin-impersonating`, `session-expired`, `access-denied`, selectable via `?as=` or a dev switcher.
- Reusable system patterns: S-01 404, S-02 error boundary, S-03 EmptyState, S-04 Skeleton, S-05 confirm/success
  modal, S-06 session expired, S-07 DPDP consent/privacy, S-08 access denied, S-09 import validation,
  S-10 offline/degraded banner, S-11 webhook/reconciliation pending.
- Dark command-center kit: background #0b1120, card #0f172a, foreground #f1f5f9, semantic dark fills, and a
  persistent high-contrast impersonation banner.

**Foundations build checklist**
- [ ] All existing and must-add primitives available at canonical `@corral/ui/components/<name>` imports.
- [ ] All button variants/states present with visible focus ring.
- [ ] All form fields show label + helper + error (icon + message).
- [ ] Badge set covers all 14 payment labels + result statuses + generic states.
- [ ] Table + drawer + bulk-select + filters + empty/loading proven.
- [ ] Participant, organizer, and admin shells built and nav-ready.
- [ ] Mock utils/store/types/personas created for both apps.
- [ ] Dark command-center palette + impersonation banner proven.
- [ ] Consent, access-denied, import-validation, and degraded patterns proven.

---

## Part 4 — Screen catalog (build order)

> Ordered by **wave**, then **user-journey flow**. Wave 1 build specs are authored below.
> Waves 2–3 are fully authored in the [`design-build/`](design-build/) build-spec pack; use
> [`design-build/navigation-and-routes.md`](design-build/navigation-and-routes.md) as the authoritative
> route/nav map before adding route files. The tables below remain a quick index.

---

### WAVE 1 — Paid pilot trust loop (P0)

#### Wave 1 · Participant (mobile, light) — journey order

##### P-02 — Event Landing Page

```text
SCREEN: P-02 — Event Landing Page
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId → events.$eventId.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Sell the event and drive the primary "Register" action.

NAV: Public link (shared on WhatsApp/social). No login. Links to Event Details (P-03),
Waiver (P-05), and into Category selection (P-06) via the Register CTA.

LAYOUT: Mobile 390px. Hero banner + event logo at top; event name (Oswald) + date; venue with map link;
distance/category chips with fees + capacity/sold-out status; early-bird countdown; sponsor strip;
STICKY bottom "Register" CTA (orange).

KEY COMPONENTS: hero image, Badge chips (distances with ₹ fee + "12 left"/"Sold out"), countdown timer
(Oswald tabular-nums), sponsor logo strip, sticky primary Button, secondary link to full details.

CONTENT / COPY: e.g. "Coimbatore Marathon 2026", "Sun 12 Jul · 5:30 AM", venue "Race Course Road,
Coimbatore". CTA: "Register now". Early-bird: "Early bird ends in 03d 12h".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: event meta, fee tiers (5K ₹499 / 10K ₹699 / 21K ₹999), dates, sponsors, capacity status.

STATES: registration open · early-bird active · closing-soon · closed · sold-out.

INTERACTIONS / MICROCOPY: tapping a sold-out chip shows "Sold out" + waitlist note (if any). Sticky CTA
disabled with reason when closed/sold-out.

RESPONSIVE: mobile-first; ensure sticky CTA never overlaps content; tablet centers column ~480px.

ACCESSIBILITY: capacity/sold-out shown with icon + label, not color only; countdown has text equivalent.

TOKENS USED: primary orange CTA, brand-tint hero wash, warning for closing-soon, muted for closed.

BUILD CHECKLIST: [ ] all 5 states [ ] sticky CTA behavior [ ] early-bird countdown [ ] sold-out handling [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-03 — Event Details

```text
SCREEN: P-03 — Event Details
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/details → events.$eventId.details.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Give the full description, schedule, race instructions, and contact so a runner can decide.

NAV: From P-02. Back to landing; forward to Register (P-06).

LAYOUT: Mobile. Sectioned long-form page: About, Schedule, Route/Instructions, What to bring, Contact.
Use an in-page section nav or accordion. Persistent "Register" CTA.

KEY COMPONENTS: Accordion/sections, schedule timeline list, map link, contact card (phone/WhatsApp/email),
Tabs optional for distances.

CONTENT / COPY: realistic schedule (reporting 4:45 AM, flag-off 5:30 AM, cut-off times), route summary.

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: full description, schedule, instructions, organizer contact.

STATES: default · loading (skeleton sections).

INTERACTIONS / MICROCOPY: tap contact → opens WhatsApp/dialer/email; sticky Register persists.

RESPONSIVE: mobile-first long page; comfortable line length.

ACCESSIBILITY: section headings as real headings; accordion keyboard-operable.

TOKENS USED: light theme, orange CTA, info accents for instructions.

BUILD CHECKLIST: [ ] all sections [ ] contact actions [ ] loading state [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-05 — Waiver / Medical Declaration (full text)

```text
SCREEN: P-05 — Waiver / Medical Declaration (full text)
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/policy/waiver → events.$eventId.policy.waiver.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Present the FULL legal waiver + medical declaration text as a readable, shareable page.

NAV: From consent step (P-08) "read full text" link, or footer. Back returns to checkout.

LAYOUT: Mobile full page. Title (Oswald), last-updated date, long readable legal body, anchored sections,
"Back to registration" action at bottom.

KEY COMPONENTS: typographic long-form content, table of contents anchors, print/share link.

CONTENT / COPY: medical self-declaration + assumption-of-risk waiver text (placeholder legal copy ok).

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: policy text, version/date.

STATES: default.

INTERACTIONS / MICROCOPY: "Back to registration" returns user to where they were in P-08.

RESPONSIVE: comfortable reading measure on mobile.

ACCESSIBILITY: real heading hierarchy; high body contrast; resizable text.

TOKENS USED: light, neutral; minimal accent.

BUILD CHECKLIST: [ ] readable long-form [ ] back-to-checkout link [ ] version/date shown [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-06 — Category / Distance Selection

```text
SCREEN: P-06 — Category / Distance Selection
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/category → events.$eventId.register.category.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Choose a distance/category and see the applicable fee tier before filling the form.

NAV: From Register CTA. Forward to Registration Form (P-07).

LAYOUT: Mobile. Selectable cards/radio list of distances with fee, early-bird label, capacity; continue CTA.

KEY COMPONENTS: RadioGroup of distance cards, fee + early-bird Badge, capacity note, primary Continue Button.

CONTENT / COPY: "5K Fun Run — ₹499 (Early bird)", "10K — ₹699", "21K Half — ₹999 · 8 spots left".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: distances, fees, tier label, capacity.

STATES: default · a category sold-out (disabled) · early-bird active.

INTERACTIONS / MICROCOPY: selecting required before Continue; sold-out disabled with label.

RESPONSIVE: mobile cards full-width.

ACCESSIBILITY: radio cards keyboard-selectable; sold-out conveyed with icon + text.

TOKENS USED: orange selected state, warning for low capacity, muted for sold-out.

BUILD CHECKLIST: [ ] selection [ ] fee/tier display [ ] sold-out [ ] continue gating [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-07 — Registration Form

```text
SCREEN: P-07 — Registration Form
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/form → events.$eventId.register.form.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Collect standard participant details with inline validation.

NAV: From P-06. Minor detected (by DOB) routes to Guardian Consent (P-09 pilot gate).
Forward to Consent stack (P-08).

LAYOUT: Mobile single-column form, grouped sections, sticky Continue CTA.

KEY COMPONENTS: Inputs (name, mobile, email), Select (gender), date picker (DOB → age group), emergency
contact (name + phone), Select (distance pre-filled), Select (T-shirt size), optional club/team.

CONTENT / COPY: helper "DOB sets your age category". Age-derived category notice chip.

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: all form fields; derived age-group hint.

STATES: empty · validation errors (inline, icon + message) · age-derived category notice ·
DOB → minor detected (notice that guardian consent is required).

INTERACTIONS / MICROCOPY: inline errors e.g. "Enter a valid 10-digit mobile". Minor banner: "This runner
is under 18 — guardian consent required."

RESPONSIVE: mobile-first; large fields/targets.

ACCESSIBILITY: labels tied to inputs; errors announced; no color-only errors.

TOKENS USED: danger-text for errors, info for notices, orange CTA.

BUILD CHECKLIST: [ ] empty [ ] error [ ] age-group notice [ ] minor-detected route [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-08 — Medical Declaration + Waiver Acceptance (consent stack)

```text
SCREEN: P-08 — Medical Declaration + Waiver Acceptance
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/waiver → events.$eventId.register.waiver.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Capture required consents before checkout.

NAV: From P-07. Links to full Waiver (P-05) and privacy notice (S-07). Forward to Order
Summary (P-11).

LAYOUT: Mobile. Checkbox stack with short summaries + "read full text" links; primary Continue.

KEY COMPONENTS: Checkboxes — medical self-declaration, waiver acceptance, DPDP privacy notice link,
WhatsApp/SMS/email communication consent, result/certificate publishing disclosure.

CONTENT / COPY: "I confirm I am medically fit…", "I accept the waiver (read full text)", "I agree to
receive event updates on WhatsApp/SMS/email".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: consent items.

STATES: required consent missing (block + message) · minor detected (guardian consent required) ·
unchecked/default · all-required checked.

INTERACTIONS / MICROCOPY: Required consent starts unchecked. Continue is blocked until required boxes are
checked; missing → "Please accept the waiver to continue." Communication consent must be explicit and not
bundled with waiver/medical consent.

RESPONSIVE: mobile.

ACCESSIBILITY: each checkbox individually labeled; error not color-only.

TOKENS USED: orange CTA, danger-text for missing-consent.

BUILD CHECKLIST: [ ] unchecked/default [ ] required-missing [ ] minor variant [ ] all-required checked → continue [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-09 — Minor / Guardian Consent (pilot gate when minors are allowed)

```text
SCREEN: P-09 — Minor / Guardian Consent
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/guardian → events.$eventId.register.guardian.tsx
WAVE / PRIORITY: Pilot Gate · P1 (required before enabling minor-eligible categories)

PURPOSE: Capture verifiable guardian consent for runners under 18 before checkout, in line with DPDP
requirements and event safety needs.

NAV: From P-07 when DOB indicates under 18, or from P-08 minor-detected consent state.
Back returns to the registration form with the minor notice preserved. Forward returns to P-08/P-11 only
after guardian consent is complete.

LAYOUT: Mobile single-column form with a clear minor notice, guardian identity/contact fields, consent
checkboxes, verification status card, and sticky Continue CTA.

KEY COMPONENTS: Alert/notice, Inputs (guardian name, relationship, mobile, email), Checkbox stack,
verification status Badge, primary Continue Button, support link.

CONTENT / COPY: "Guardian consent required", "I confirm I am the parent/guardian and approve this runner's
participation", "We may verify this consent by mobile OTP or support call."

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: participant name/age/category, guardian name, relationship, contact, consent timestamp/status.

STATES: guardian required · verifying · verified · failed · support/manual verification.

INTERACTIONS / MICROCOPY: Continue blocked until required guardian fields and consent are complete. Failed
verification → "We couldn't verify guardian consent. Try again or contact Corral support."

RESPONSIVE: mobile-first; large fields/targets; keyboard should not cover sticky CTA.

ACCESSIBILITY: every field labeled; consent checkbox hit area includes label; verification status has icon + label.

TOKENS USED: info for guardian-required/verifying, success for verified, danger-text for failed, orange CTA.

BUILD CHECKLIST: [ ] required [ ] verifying [ ] verified [ ] failed/support [ ] no minor can bypass consent [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-11 — Order Summary / Fee Breakdown

```text
SCREEN: P-11 — Order Summary / Fee Breakdown
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/summary → events.$eventId.register.summary.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Show an itemized, transparent total before payment.

NAV: From P-08. Coupon entry (P-10, Wave 2) inline. Forward to Payment (P-12).

LAYOUT: Mobile. Line-item summary card, coupon row, insurance-premium row (when opted in), totals, GST +
invoice-expectation note, organizer-absorbed-fee note, Pay CTA.

KEY COMPONENTS: itemized list, coupon applied row, early-bird tier label, insurance-premium row (shown only
when P-10A opt-in selected), GST/invoice note, total (Oswald), Pay Button.

CONTENT / COPY: "10K Registration ₹699", "Early bird −₹100", "Event insurance +₹49" (only when opted in),
"GST included", note: "Convenience fee absorbed by the organizer.", invoice note: "A GST invoice/receipt
will be emailed after payment." CTA: "Pay ₹648".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: line items, discounts, insurance premium (when selected), total, GST note, invoice expectation.

STATES: default · coupon applied · insurance added (premium row visible) · (no separate
participant convenience fee row — show note only).

INTERACTIONS / MICROCOPY: Pay launches Razorpay handoff (P-12). The insurance premium row mirrors the exact
amount shown on P-10A.

RESPONSIVE: mobile.

ACCESSIBILITY: total clearly associated; amounts legible; rupee amounts use Intl.NumberFormat.

TOKENS USED: success-text for discount, muted for notes, orange Pay CTA.

BUILD CHECKLIST: [ ] itemized total [ ] coupon row [ ] insurance-premium row when selected [ ] absorbed-fee [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
note [ ] GST + invoice-expectation note
```

##### P-12 / P-13 — Payment handoff + Processing/Pending

```text
SCREEN: P-12 (Payment handoff) + P-13 (Processing/Pending)
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: P-12: /events/$eventId/register/payment → events.$eventId.register.payment.tsx; P-13: /events/$eventId/register/processing → events.$eventId.register.processing.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Hand off to Razorpay (UPI/cards/netbanking) and show the async wait state.

NAV: From P-11. Resolves to Success (P-14) or Failure (P-15).

LAYOUT: Mobile. P-12: Razorpay-style method choice (represented). P-13: processing screen with spinner +
reassuring status using the shared payment labels.

KEY COMPONENTS: payment method list (UPI primary), processing Progress/Spinner, status text.

CONTENT / COPY: P-13: "Confirming your payment…", "Paid — Awaiting Webhook. Don't close this page."

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: amount, method, live status label.

STATES: method selection · processing · Paid — Awaiting Webhook · webhook-pending.

INTERACTIONS / MICROCOPY: warn against closing; auto-advance on confirmation.

RESPONSIVE: mobile.

ACCESSIBILITY: status announced; spinner has text.

TOKENS USED: info for pending, orange accents.

BUILD CHECKLIST: [ ] method step [ ] processing [ ] awaiting-webhook [ ] don't-close warning [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-15 — Payment Failure / Retry

```text
SCREEN: P-15 — Payment Failure / Retry
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/failed → events.$eventId.register.failed.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Explain the failure reason and offer a safe retry / change method, with support contact.

NAV: From P-12/P-13 on failure. Retry returns to P-12; support link available.

LAYOUT: Mobile. Status illustration/icon (danger), reason, primary "Retry payment", secondary "Change
method", support contact.

KEY COMPONENTS: Alert (danger), reason text, retry/secondary Buttons, support link.

CONTENT / COPY: reason variants — gateway failure, user-abandoned, duplicate payment, paid-but-confirmation
-not-sent. e.g. "Payment didn't go through. You were not charged."

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: amount, failure reason, order ref.

STATES: gateway failure · user-abandoned · webhook-pending · duplicate payment · paid-but-
confirmation-not-sent (reassure + support).

INTERACTIONS / MICROCOPY: never dead-end — always a retry or support path.

RESPONSIVE: mobile.

ACCESSIBILITY: danger conveyed with icon + label + text, not color only.

TOKENS USED: danger/danger-text, orange retry CTA.

BUILD CHECKLIST: [ ] all 5 failure variants [ ] retry path [ ] support contact [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-14 — Payment Success → Confirmation

```text
SCREEN: P-14 — Payment Success → Confirmation
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/register/success → events.$eventId.register.success.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Confirm registration, show next steps, and link to the e-ticket.

NAV: From successful P-12/P-13. Forward to E-Ticket (P-19).

LAYOUT: Mobile. Celebratory success hero (brand-tint wash), confirmation summary, next-steps list, CTA to
e-ticket; note that confirmation also sent on WhatsApp/email.

KEY COMPONENTS: success badge (icon + "Paid & Confirmed"), summary card, next-steps checklist, primary CTA,
remediation Alert + "Resend confirmation"/"Contact support" actions (confirmation-not-sent variant).

CONTENT / COPY: "You're in! 🎉" (celebratory but tasteful), "We've sent your confirmation on WhatsApp."
Not-sent variant: "Payment confirmed — we're still sending your confirmation message. You can resend it or
contact support with your registration ID."

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: event, category, amount, registration id, payment label "Paid & Confirmed".

STATES: confirmed · paid-but-confirmation-not-sent ("Paid & Confirmed" but comms pending →
Alert with "Resend confirmation" + "Contact support with registration ID").

INTERACTIONS / MICROCOPY: CTA "View my e-ticket". Keep payment status ("Paid & Confirmed") separate from
communication-delivery status (confirmation sending/sent).

RESPONSIVE: mobile.

ACCESSIBILITY: success icon + label; remediation Alert announced with aria-live.

TOKENS USED: success, brand-tint, orange CTA, WhatsApp green for the WhatsApp note, warning for not-sent.

BUILD CHECKLIST: [ ] confirmed state [ ] paid-but-confirmation-not-sent remediation [ ] next steps [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
[ ] e-ticket CTA [ ] comms note
```

##### P-19 — My Registration / E-Ticket

```text
SCREEN: P-19 — My Registration / E-Ticket
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /my/registrations/$registrationId → my.registrations.$registrationId.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: The participant's home base — QR e-ticket + status + links to everything race-related.

NAV: Via emailed magic link (mobile OTP fallback for expired links / device change).
Links to BIB (P-20), Instructions (P-21), Result (P-22), Certificate (P-24).

LAYOUT: Mobile. QR card up top, name/category/event meta, status badge, link list to the other pages.

KEY COMPONENTS: QR Card, status Badge, name/category, link list (BIB, Instructions, Results, Certificate).

CONTENT / COPY: status examples: "Confirmed", "BIB assigned: 1042", "Results live".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: QR, participant name, category, event, status, BIB (if assigned).

STATES: payment pending · confirmed · pre-BIB · BIB assigned · results-live · certificate-ready ·
link expired / OTP required.

INTERACTIONS / MICROCOPY: expired link → OTP entry; links unlock as stages complete.

RESPONSIVE: mobile.

ACCESSIBILITY: QR has text alternative (registration id); status icon + label.

TOKENS USED: status semantic colors, orange accents.

BUILD CHECKLIST: [ ] all 7 states [ ] OTP fallback [ ] progressive link unlock [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-20 — BIB & Kit Collection

```text
SCREEN: P-20 — BIB & Kit Collection
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /my/registrations/$registrationId/kit → my.registrations.$registrationId.kit.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Show the assigned BIB number and kit-collection details.

NAV: From P-19.

LAYOUT: Mobile. Big BIB number (Oswald, BIB-style), collection venue/time/what-to-bring.

KEY COMPONENTS: large BIB display, collection details card, map link.

CONTENT / COPY: "BIB 1042", "Collect: 11 Jul, 10 AM–6 PM, CODISSIA · bring a photo ID".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: BIB number, collection venue/time, requirements.

STATES: pre-BIB (not yet assigned — "BIB will be assigned soon") · BIB assigned.

INTERACTIONS / MICROCOPY: pre-BIB shows informative empty state.

RESPONSIVE: mobile.

ACCESSIBILITY: BIB readable at large size; details legible.

TOKENS USED: Oswald BIB style, info accents.

BUILD CHECKLIST: [ ] pre-BIB [ ] assigned [ ] collection details [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-21 — Race-Day Instructions

```text
SCREEN: P-21 — Race-Day Instructions
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/race-day → events.$eventId.race-day.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Everything needed on race day — schedule, venue, what to bring, route.

NAV: From P-19.

LAYOUT: Mobile. Sectioned/accordion: schedule timeline, venue + map, what to bring, route map, contact.

KEY COMPONENTS: timeline list, map link, checklist, contact card.

CONTENT / COPY: reporting/flag-off times, gear checklist, hydration points.

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: schedule, venue, route, instructions.

STATES: default · loading.

INTERACTIONS / MICROCOPY: map link opens maps; contact opens WhatsApp.

RESPONSIVE: mobile.

ACCESSIBILITY: heading hierarchy, accordion keyboard support.

TOKENS USED: light, info accents.

BUILD CHECKLIST: [ ] all sections [ ] map/contact actions [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-22 — My Result

```text
SCREEN: P-22 — My Result
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /my/registrations/$registrationId/result → my.registrations.$registrationId.result.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Show the runner's finish time and ranks with a celebratory but clear layout.

NAV: From P-19 once results live. Links to full leaderboard (P-23) and certificate (P-24).

LAYOUT: Mobile. Hero finish time (Oswald tabular-nums), net/gun time, rank cards (overall/category/
age-group), status, CTAs.

KEY COMPONENTS: hero time, rank Cards, status Badge, optional age-graded, CTA Buttons.

CONTENT / COPY: "Net 54:12", "Overall 128 / 642", "Category 14 / 96", "Age group (M40–44) 3 / 22".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: net/gun time, ranks, status (finished/DNF/DNS/DQ), age-graded (optional).

STATES: finished · DNF · DNS · DQ · results-live (default).

INTERACTIONS / MICROCOPY: CTA "View certificate" / "See full leaderboard".

RESPONSIVE: mobile.

ACCESSIBILITY: status icon + label; ranks readable.

TOKENS USED: success for finished, muted/danger for DNF/DNS/DQ, orange CTA, brand-tint hero.

BUILD CHECKLIST: [ ] finished + DNF/DNS/DQ [ ] rank cards [ ] CTAs [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### P-23 — Full Leaderboard

```text
SCREEN: P-23 — Full Leaderboard
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /events/$eventId/leaderboard → events.$eventId.leaderboard.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Browse rankings across overall / category / age-group with search.

NAV: From P-22 or event page.

LAYOUT: Mobile. Tabs (Overall / Category / Age group), search field, ranked list rows, the user's own row
highlighted/pinned.

KEY COMPONENTS: Tabs, search Input, ranked rows (rank, name, time, status badge), optional age-graded
column when enabled, highlight for "you".

CONTENT / COPY: tab labels; search placeholder "Search name or BIB".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: rank, name, category, net time, result status (Finished/DNF/DNS/DQ), and age-graded score per
row when the event enabled it.

STATES: default · search-empty · loading.

INTERACTIONS / MICROCOPY: search filters; tapping a row optional detail. DNF/DNS/DQ rows show the status
badge instead of a finish time/rank.

RESPONSIVE: mobile list; readable dense rows.

ACCESSIBILITY: tabs keyboard-operable; current-user row labeled, not color-only; status shown as icon + text.

TOKENS USED: orange highlight for "you", neutral rows; muted/danger for DNF/DNS/DQ status.

BUILD CHECKLIST: [ ] 3 tabs [ ] search + empty [ ] self-highlight [ ] per-row DNF/DNS/DQ status [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
[ ] optional age-graded column when enabled
```

##### P-24 — Certificate View + Download

```text
SCREEN: P-24 — Certificate View + Download
APP / SURFACE: web · Participant mobile 390px   THEME: Light
ROUTE: /my/registrations/$registrationId/certificate → my.registrations.$registrationId.certificate.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: View, download (PDF), and share the finisher certificate.

NAV: From P-19 / P-22 once certificate ready.

LAYOUT: Mobile. Certificate preview image, download + share buttons (WhatsApp green share), certificate id.

KEY COMPONENTS: certificate preview, Download Button, WhatsApp/share Button, certificate id + shareable link.

CONTENT / COPY: "Download PDF", "Share on WhatsApp", "Certificate ID: CMB-2026-1042".

MOCK DATA: apps/web/src/mocks/events.ts, registrations.ts, results.ts; types in apps/web/src/mocks/types.ts; fixture shape/sample rows cover: certificate preview, id, shareable link.

STATES: certificate-ready · generating (not yet ready) · download success toast.

INTERACTIONS / MICROCOPY: generating state shows progress/placeholder; share opens WhatsApp.

RESPONSIVE: mobile.

ACCESSIBILITY: preview has alt text; buttons labeled.

TOKENS USED: orange download CTA, WhatsApp green share, info for generating.

BUILD CHECKLIST: [ ] ready [ ] generating [ ] download + share [ ] cert id [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

#### Wave 1 · Organizer (desktop, light + navy sidebar) — journey order

##### O-01 — Login / Sign-in

```text
SCREEN: O-01 — Login / Sign-in
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: O-01: /login → login.tsx (exists; public)
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Authenticate organizer/admin via email+password and Google.

NAV: App entry / redirect when unauthenticated.

LAYOUT: Centered card on a branded split or plain background. Email + password fields, "Continue with
Google", forgot-password link.

KEY COMPONENTS: Card, Inputs, primary Button, Google Button, links.

CONTENT / COPY: "Sign in to Corral", "Continue with Google".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: form only.

STATES: default · validation-error · auth-error (wrong credentials) · loading.

INTERACTIONS / MICROCOPY: error "Incorrect email or password."

RESPONSIVE: centered, works on tablet.

ACCESSIBILITY: labeled fields; error announced.

TOKENS USED: orange primary, navy brand.

BUILD CHECKLIST: [ ] default [ ] error [ ] loading [ ] Google option [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-02 — Organizer Onboarding (entity + GST profile)

```text
SCREEN: O-02 — Organizer Onboarding
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /onboarding → _authenticated.onboarding.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Create the organizer/entity profile that owns events, payments, GST/non-GST settings, support
contacts, and later team roles.

NAV: First successful organizer/admin login, admin-created organizer flow from A-01/A-02,
or "Complete profile" prompt from O-04. Forward to Payment Onboarding (O-03) and Events Dashboard (O-04).

LAYOUT: Desktop with centered onboarding card or full dashboard shell. Stepper sections: Organization,
Entity & GST, Contacts, Review. Admin-created variant shows an act-on-behalf/admin banner.

KEY COMPONENTS: Stepper/Tabs, Inputs, Select/RadioGroup (club/trust/company/individual), GST toggle,
document upload placeholder, contact fields, Save/Continue Button, validation Alert.

CONTENT / COPY: "Set up your organizer profile", "GST-registered entity", "Non-GST club/trust/society",
"Primary event contact", "Finance contact".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: organizer name, entity type, GSTIN (optional/required by entity choice), billing address,
primary/support/finance contacts, admin-created status.

STATES: default · validation-error · GST vs non-GST branch · admin-created organizer · saved.

INTERACTIONS / MICROCOPY: GSTIN required only when GST-registered; non-GST branch explains invoice/report
behavior. Save success toast: "Organizer profile saved."

RESPONSIVE: desktop-first; tablet-safe form width.

ACCESSIBILITY: radio cards keyboard-selectable; validation includes icon + message; stepper exposes progress.

TOKENS USED: orange primary CTA, info notices, danger-text validation, navy sidebar when in shell.

BUILD CHECKLIST: [ ] entity profile [ ] GST/non-GST branch [ ] contacts [ ] validation [ ] admin-created variant [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-03 — Payment Onboarding (Razorpay Route)

```text
SCREEN: O-03 — Payment Onboarding (Razorpay Route)
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /onboarding/payment → _authenticated.onboarding.payment.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Linked-account KYC + status tracking so paid registration can safely open.

NAV: From onboarding / events dashboard. Gates publish readiness (O-10A).

LAYOUT: Desktop with navy sidebar. Stepper/status panel for KYC, document fields, status banner.

KEY COMPONENTS: status Banner/Alert, Stepper, form fields, primary action, help text.

CONTENT / COPY: status labels per state; "Settlement on T+2".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: KYC fields, verification status, settlement timing.

STATES: not started · KYC submitted · pending verification · rejected · active · settlement blocked.

INTERACTIONS / MICROCOPY: rejected shows reason + resubmit; active enables registration.

RESPONSIVE: desktop-first.

ACCESSIBILITY: status icon + label; errors clear.

TOKENS USED: warning (pending), danger (rejected/blocked), success (active).

BUILD CHECKLIST: [ ] all 6 states [ ] resubmit path [ ] gating note [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-04 — Events List / Dashboard

```text
SCREEN: O-04 — Events List / Dashboard
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: / → _authenticated.index.tsx (exists)
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: See all events with status + quick actions; entry to create/manage.

NAV: Home after login. Each event → setup/roster/etc.

LAYOUT: Navy sidebar + top bar. Event cards or table (status, reg count, revenue snapshot), "Create event" CTA.

KEY COMPONENTS: stat Cards, event Table/Cards, status Badge, quick-link menu, primary Button.

CONTENT / COPY: statuses draft/open/closed/completed; "Create event".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: per event: name, date, status, registration count, revenue snapshot.

STATES: default · empty (no events) · loading.

INTERACTIONS / MICROCOPY: empty → "Create your first event".

RESPONSIVE: desktop-first; cards reflow on tablet.

ACCESSIBILITY: status icon + label; actionable rows keyboard accessible.

TOKENS USED: status colors, orange CTA, navy sidebar.

BUILD CHECKLIST: [ ] default [ ] empty [ ] loading [ ] quick actions [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-05 / O-06 / O-07 — Event Setup (Basics · Distances & Fees · Form Builder)

```text
SCREEN: O-05 (Basics) + O-06 (Distances & Fees) + O-07 (Registration Form Builder)
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: O-05: /events/$eventId/setup/basics → _authenticated.events.$eventId.setup.basics.tsx; O-06: /events/$eventId/setup/fees → _authenticated.events.$eventId.setup.fees.tsx; O-07: /events/$eventId/setup/form → _authenticated.events.$eventId.setup.form.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Configure the event — basics, pricing tiers, and the registration form/waiver text.

NAV: From O-04 (create/edit). Multi-step or tabbed setup; leads to Policies (O-09) +
Publish readiness (O-10A).

LAYOUT: Desktop, navy sidebar, setup as steps/tabs.
  O-05: name, date/time, venue, map link.
  O-06: category repeater (name, distance, fee, capacity cap), early-bird tier rows (date-step or
  count-step), registration open/close datetimes.
  O-07: field config toggles + waiver/medical text editor.

KEY COMPONENTS: Tabs/Stepper, Inputs, repeater rows with add/remove, date pickers, textarea editor, Save.

CONTENT / COPY: tier labels, capacity, "Registration opens/closes".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: event meta, categories/fees/tiers, form fields, waiver text.

STATES: default · O-06 warnings: overlapping tiers · sold-out category · registration date conflict ·
unsaved-changes.

INTERACTIONS / MICROCOPY: warning "Early-bird tier overlaps another tier."

RESPONSIVE: desktop-first.

ACCESSIBILITY: repeater rows labeled; warnings icon + text.

TOKENS USED: warning for conflicts, orange Save.

BUILD CHECKLIST: [ ] 3 setup steps [ ] tier warnings [ ] save/unsaved [ ] waiver editor [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-09 — Event Setup — Policies

```text
SCREEN: O-09 — Event Setup — Policies
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/setup/policies → _authenticated.events.$eventId.setup.policies.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Set refund/cancellation policy, waiver, contact, and race instructions.

NAV: Part of setup; required for publish readiness.

LAYOUT: Desktop. Sectioned forms / rich text areas for each policy.

KEY COMPONENTS: textarea/rich editors, contact fields, Save.

CONTENT / COPY: policy headings; helper that these appear on participant legal pages (P-04/P-05).

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: refund policy, waiver, contact, instructions.

STATES: default · unsaved-changes · validation (required missing).

INTERACTIONS / MICROCOPY: required-missing flagged before publish.

RESPONSIVE: desktop-first.

ACCESSIBILITY: labeled sections.

TOKENS USED: orange Save, danger-text for missing required.

BUILD CHECKLIST: [ ] all policy fields [ ] required validation [ ] save [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-10A — Event Publish Readiness Checklist

```text
SCREEN: O-10A — Event Publish Readiness Checklist
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/setup/publish → _authenticated.events.$eventId.setup.publish.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Block go-live until critical setup is complete; show blocking vs warning items.

NAV: From setup / events dashboard. Publish CTA gated here.

LAYOUT: Desktop. Checklist grouped into BLOCKING and WARNING-ONLY, each item with status + link to fix,
public preview link, Publish button (disabled until blockers cleared).

KEY COMPONENTS: checklist rows (status icon + label + fix link), Publish Button, preview link, admin
override (with audit reason) for admins.

CONTENT / COPY: BLOCKING: basics, ≥1 distance/fee, registration dates, capacity, policies/waiver, privacy
notice, payment account active, confirmation template. WARNING: sponsor branding, instructions polish,
optional insurance, optional coupons.

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: each readiness item + status.

STATES: ready to publish · blocked · warning-only · admin override with audit reason.

INTERACTIONS / MICROCOPY: Publish disabled while blocked; override prompts audit reason (admin only).

RESPONSIVE: desktop-first.

ACCESSIBILITY: status icon + label; clear fix links.

TOKENS USED: success (done), warning (warning-only), danger (blocked), orange Publish.

BUILD CHECKLIST: [ ] ready [ ] blocked [ ] warning-only [ ] admin override + audit reason [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-11 — Roster (participant table)  ★ key surface

```text
SCREEN: O-11 — Roster (participant table)
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/roster → _authenticated.events.$eventId.roster.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: The key operational surface — search/filter/sort all registrants; open detail; export/import.

NAV: From event. Row → Participant Detail drawer (O-12). Buttons → Export (O-14), Import
(O-13, Wave 2).

LAYOUT: Desktop, navy sidebar. Full-width data table: global search, filter chips (category/payment/BIB),
sortable columns, bulk-select, export/import buttons, row click → right-side detail Drawer; limited inline
quick actions for low-risk fields only. Pagination for large lists.

KEY COMPONENTS: Table (sticky header), search Input, filter Chips, bulk-select bar, Drawer trigger,
Export/Import Buttons, Pagination.

CONTENT / COPY: columns — name, category, payment status + mode (incl. cash/comp), contact, emergency
contact, BIB, T-shirt size.

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: full roster rows with realistic data and payment labels.

STATES: default · empty · filtered-empty · large-list pagination · loading (skeleton rows) ·
bulk-selected.

INTERACTIONS / MICROCOPY: filter chips toggle; bulk bar "12 selected · Export · Message"; row opens drawer.

RESPONSIVE: desktop-first; horizontal scroll/condense on tablet.

ACCESSIBILITY: sortable headers keyboard-operable; payment status icon + label; visible focus in dense rows.

TOKENS USED: payment semantic colors, orange accents, navy sidebar.

BUILD CHECKLIST: [ ] default [ ] empty [ ] filtered-empty [ ] pagination [ ] bulk-select [ ] drawer open [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-12 — Participant Detail / Edit

```text
SCREEN: O-12 — Participant Detail / Edit
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/roster/$participantId → _authenticated.events.$eventId.roster.$participantId.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: View and manually correct a single registrant (in a right-side drawer).

NAV: From O-11 row click.

LAYOUT: Right-side Drawer (Sheet) over the roster. Sections: identity, category, payment, BIB, emergency
contact, consents; edit + save.

KEY COMPONENTS: Drawer, read/edit fields, payment status Badge, Save/Cancel, action menu (resend
confirmation, etc.).

CONTENT / COPY: field labels; "Resend confirmation".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: all participant fields + payment label + consent flags.

STATES: view · edit · validation-error · save success (toast) · saving.

INTERACTIONS / MICROCOPY: inline validation on edit; success toast "Participant updated."

RESPONSIVE: drawer full-height; on tablet covers more width.

ACCESSIBILITY: drawer focus-trapped; labeled fields.

TOKENS USED: payment colors, orange Save.

BUILD CHECKLIST: [ ] view [ ] edit [ ] error [ ] save success [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-14 — CSV / Timing-Vendor Export

```text
SCREEN: O-14 — CSV / Timing-Vendor Export
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/roster/export → _authenticated.events.$eventId.roster.export.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Export the roster (BIB, chip, name, category) for timing vendors / printing.

NAV: From O-11 export button. Often a modal.

LAYOUT: Modal/Dialog. Column selection, format choice, scope (all/filtered/selected), DPDP safe-handling
notice, audit-reason field, export button.

KEY COMPONENTS: Dialog, checkboxes for columns, radio for scope, DPDP/PII safe-handling Alert, required
audit-reason Input (PII export), primary Export.

CONTENT / COPY: "Export 642 participants as CSV". Notice: "This file contains personal data (DPDP). It is
delivered as a private, signed download scoped to the columns/rows you selected — do not share public
links." Audit prompt: "Reason for this PII export".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: column options, row count.

STATES: default · audit-reason required (blocks export until filled) · exporting · success
(private/signed download) · empty (nothing to export).

INTERACTIONS / MICROCOPY: Export is blocked until an audit reason is entered; success toast + auto-download
of a private/signed file (not a public URL); reason recorded to the audit log (A-06).

RESPONSIVE: modal.

ACCESSIBILITY: focus-trapped dialog; labeled options; safe-handling notice announced.

TOKENS USED: orange Export; warning-text for the PII notice.

BUILD CHECKLIST: [ ] default [ ] DPDP safe-handling notice [ ] audit reason required [ ] private/signed [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
delivery [ ] exporting [ ] success [ ] scope options
```

##### O-20 — Comms Dashboard

```text
SCREEN: O-20 — Comms Dashboard
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/comms → _authenticated.events.$eventId.comms.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Template library + recent sends overview (WhatsApp-first).

NAV: From sidebar. Forward to Send/Broadcast (O-21), Delivery Status (O-23).

LAYOUT: Desktop. Template cards/list + recent sends table with delivery snapshot.

KEY COMPONENTS: template Cards, recent-sends Table, "New message" CTA, channel icons (WhatsApp/SMS/email).

CONTENT / COPY: template names (registration, payment, race-day, results, certificate).

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: templates, recent sends with delivered/read counts.

STATES: default · empty (no sends yet) · loading.

INTERACTIONS / MICROCOPY: "New message" → O-21.

RESPONSIVE: desktop-first.

ACCESSIBILITY: channel conveyed with icon + label.

TOKENS USED: WhatsApp green, status colors, orange CTA.

BUILD CHECKLIST: [ ] default [ ] empty [ ] template library [ ] recent sends [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-21 — Send / Broadcast Message

```text
SCREEN: O-21 — Send / Broadcast Message
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/comms/send → _authenticated.events.$eventId.comms.send.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Build an audience, pick a template, preview variables, and send/schedule.

NAV: From O-20.

LAYOUT: Desktop two-column: left audience + channel + template; right live preview (phone mockup).

KEY COMPONENTS: audience builder (all / category / payment-status / BIB-pending), channel select
(WhatsApp primary, SMS/email fallback), template picker, variable preview, Send/Schedule.

CONTENT / COPY: audience chips; preview with {{name}} {{bib}} resolved.

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: audience size, template body, preview.

STATES: default · template not approved · missing consent · partial-delivery · fallback-triggered ·
send paused · scheduling.

INTERACTIONS / MICROCOPY: "Template not approved yet"; "320 recipients · 12 missing WhatsApp consent".

RESPONSIVE: desktop-first; columns stack on tablet.

ACCESSIBILITY: preview has text; warnings icon + label.

TOKENS USED: WhatsApp green, warning for consent/approval, orange Send.

BUILD CHECKLIST: [ ] audience builder [ ] preview [ ] not-approved [ ] missing-consent [ ] schedule [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-23 — Delivery Status Tracking

```text
SCREEN: O-23 — Delivery Status Tracking
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/comms/delivery → _authenticated.events.$eventId.comms.delivery.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Per-message delivered/read across WhatsApp/SMS/email.

NAV: From O-20/O-21.

LAYOUT: Desktop. Summary stats + per-recipient table with channel + status, filter by status.

KEY COMPONENTS: stat Cards (sent/delivered/read/failed), Table, filter Chips, channel icons.

CONTENT / COPY: statuses delivered/read/failed/fallback-used.

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: per-recipient channel + delivery status + timestamp.

STATES: default · partial-delivery · failures present · loading.

INTERACTIONS / MICROCOPY: filter to failures; retry where applicable.

RESPONSIVE: desktop-first.

ACCESSIBILITY: status icon + label.

TOKENS USED: success/warning/danger, WhatsApp green.

BUILD CHECKLIST: [ ] summary [ ] per-recipient [ ] failures filter [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-24 / O-25 / O-26 — Results Upload · Column Mapping · Validation

```text
SCREEN: O-24 (Results Upload CSV) + O-25 (Column Mapping) + O-26 (Validation / Error Review)
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: O-24: /events/$eventId/results/upload → _authenticated.events.$eventId.results.upload.tsx; O-25: /events/$eventId/results/mapping → _authenticated.events.$eventId.results.mapping.tsx; O-26: /events/$eventId/results/validate → _authenticated.events.$eventId.results.validate.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Upload the timing-vendor CSV, map columns to canonical fields, and review errors before preview.

NAV: From event results section. Forward to Preview (O-27).

LAYOUT: Desktop wizard (3 steps).
  O-24: dropzone upload + file requirements + DPDP private-PII handling notice.
  O-25: source→target dropdowns with auto-detect + sample-row preview.
  O-26: error table flagging unmatched BIBs / bad rows with row-level fixes.

KEY COMPONENTS: file dropzone, DPDP/PII safe-handling Alert, mapping dropdowns, sample preview, error Table,
fix actions, Continue.

CONTENT / COPY: canonical fields — BIB, name, gender/category, distance, start time, finish time,
net/gun time, rank, status (finished/DNF/DNS/DQ). Notice: "This timing file is treated as private personal
data (DPDP). It is stored privately and never exposed as a public link."

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: uploaded rows, mapping, validation errors.

STATES: upload empty/default · uploading · required-field unmapped · type mismatch · unmatched
BIBs · bad rows · all-valid (ready).

INTERACTIONS / MICROCOPY: "3 BIBs not found in roster"; fix or skip row. Uploaded file handled as private
PII; raw file URLs are never shown.

RESPONSIVE: desktop-first.

ACCESSIBILITY: errors icon + label + row reference; follows S-09 import pattern.

TOKENS USED: danger for errors, warning for mismatches, success when valid, orange Continue.

BUILD CHECKLIST: [ ] upload [ ] DPDP private-PII notice [ ] mapping + auto-detect [ ] unmapped/type errors [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
[ ] unmatched BIB [ ] ready
```

##### O-27 — Results Preview

```text
SCREEN: O-27 — Results Preview
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/results/preview → _authenticated.events.$eventId.results.preview.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Review computed overall/category/age-group rankings before publishing.

NAV: From O-26. Forward to Publish (O-28).

LAYOUT: Desktop. Ranking Tabs (Overall / Category / Age-group Masters), anomaly flags, edit-row, Publish CTA.

KEY COMPONENTS: Tabs, ranked Table, anomaly Badges, inline edit-row, optional age-graded column, Publish Button.

CONTENT / COPY: anomaly examples "Finish before start", "duplicate BIB".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: computed rankings per tab, flagged anomalies.

STATES: default · anomalies present · editing a row · ready to publish.

INTERACTIONS / MICROCOPY: fix anomaly inline; Publish confirms.

RESPONSIVE: desktop-first.

ACCESSIBILITY: anomaly icon + label; tabs keyboard-operable.

TOKENS USED: warning/danger for anomalies, orange Publish.

BUILD CHECKLIST: [ ] 3 ranking tabs [ ] anomaly flags [ ] edit-row [ ] publish gating [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-28 — Publish / Unpublish + Correct

```text
SCREEN: O-28 — Publish / Unpublish + Correct
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/results/publish → _authenticated.events.$eventId.results.publish.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Control results go-live and apply manual fixes after publishing.

NAV: From O-27.

LAYOUT: Desktop. Publish status banner, publish/unpublish controls, correction log, re-publish action.

KEY COMPONENTS: status Banner, Publish/Unpublish Buttons (with confirm + required audit-reason),
correction history list showing reason + actor + timestamp.

CONTENT / COPY: "Results are LIVE"; unpublish confirm warns participants will lose access. Audit prompt:
"Reason for publishing / unpublishing / correcting results".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: publish state, last published time, corrections with their audit reasons.

STATES: unpublished · published/live · unpublish confirm (audit reason required) · correcting
(audit reason required) · corrected/re-published.

INTERACTIONS / MICROCOPY: destructive confirm for unpublish; publish, unpublish, and any result correction
each require an audit reason before they proceed; the reason is shown in the correction/audit history (A-06).

RESPONSIVE: desktop-first.

ACCESSIBILITY: status icon + label; confirm dialog focus-trapped.

TOKENS USED: success (live), warning (unpublish), orange actions.

BUILD CHECKLIST: [ ] unpublished [ ] live [ ] unpublish confirm + audit reason [ ] correction flow + audit [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
reason
```

##### O-29 — Certificate Template Setup

```text
SCREEN: O-29 — Certificate Template Setup
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/certificates/template → _authenticated.events.$eventId.certificates.template.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Configure the fixed certificate template — logo, organizer name, sponsor strip, colors,
signature, text fields.

NAV: From event certificates section. Forward to Generation (O-30).

LAYOUT: Desktop two-column: left config controls; right live certificate preview.

KEY COMPONENTS: logo upload, color pickers, sponsor strip upload, signature upload, text field inputs,
live preview, Save.

CONTENT / COPY: note "Fixed template for MVP — freeform layout comes later."

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: configurable fields + live preview.

STATES: default · preview updating · validation (missing required asset) · saved.

INTERACTIONS / MICROCOPY: preview updates live as fields change.

RESPONSIVE: desktop-first; preview stacks on tablet.

ACCESSIBILITY: upload fields labeled; preview alt text.

TOKENS USED: orange Save; configurable brand colors in preview.

BUILD CHECKLIST: [ ] config controls [ ] live preview [ ] missing-asset validation [ ] save [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-30 — Certificate Generation Status

```text
SCREEN: O-30 — Certificate Generation Status
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/certificates/status → _authenticated.events.$eventId.certificates.status.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Show batch render progress and any errors.

NAV: From O-29 "Generate".

LAYOUT: Desktop. Progress bar + counts (done/total/failed), error list with retry.

KEY COMPONENTS: Progress, stat counts, error Table, Retry-failed Button.

CONTENT / COPY: "Generating 642 certificates… 610 done · 2 failed".

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: progress, success/fail counts, failure reasons.

STATES: generating · completed · partial (failures) · retrying.

INTERACTIONS / MICROCOPY: retry only failed; success toast on completion.

RESPONSIVE: desktop-first.

ACCESSIBILITY: progress has text equivalent; errors icon + label.

TOKENS USED: success/danger, info progress, orange Retry.

BUILD CHECKLIST: [ ] generating [ ] completed [ ] partial/failures [ ] retry [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### O-31 — Payments / Settlement Dashboard

```text
SCREEN: O-31 — Payments / Settlement Dashboard
APP / SURFACE: console · Organizer desktop 1280px   THEME: Light
ROUTE: /events/$eventId/payments → _authenticated.events.$eventId.payments.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Track payment success/failure and settlement timing using the shared reconciliation labels.

NAV: From sidebar finance section.

LAYOUT: Desktop. Summary stat cards + transactions table with the shared status labels + settlement column.

KEY COMPONENTS: stat Cards (collected, pending, settled), transactions Table, filter Chips by status,
settlement timing note (T+2/T+3).

CONTENT / COPY: use the full shared label set, enumerated exactly: Payment Started · Payment Pending ·
Paid — Awaiting Webhook · Paid & Confirmed · Confirmation Sent · Settlement Pending · Settled ·
Refund Requested · Refund Processing · Refunded · Failed · User Abandoned · Duplicate Payment · Needs Review.

MOCK DATA: apps/console/src/mocks/events.ts, roster.ts, payments.ts, comms.ts, results.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: per-transaction amount, method, status label (from the 14 above), settlement status, timestamp.

STATES: default · needs-review present · refund states · loading · empty.

INTERACTIONS / MICROCOPY: filter to "Needs Review"; row → detail. Keep payment status separate from
communication-delivery status.

RESPONSIVE: desktop-first.

ACCESSIBILITY: every status = icon + label; consistent label vocabulary across P-12/13/14/15/19, O-11, S-11.

TOKENS USED: full semantic palette mapped to labels, orange accents.

BUILD CHECKLIST: [ ] summary [ ] full label set [ ] settlement column [ ] needs-review filter [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

#### Wave 1 · Admin console — journey order

##### A-01 — Admin Home / Multi-Event Overview

```text
SCREEN: A-01 — Admin Home / Multi-Event Overview
APP / SURFACE: console · Admin   THEME: Light (dark optional for command-center view)
ROUTE: /admin → admin.index.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Cross-event operational view for Corral staff.

NAV: Admin landing. Into any event (act-on-behalf A-03), audit log (A-06).

LAYOUT: Navy sidebar + top bar. Cross-event stat cards + table of all events/organizers with health/status,
quick jump to act-on-behalf.

KEY COMPONENTS: stat Cards, multi-event Table, search/filter, "Act on behalf" action per row.

CONTENT / COPY: cross-event metrics; org names.

MOCK DATA: apps/console/src/mocks/organizers.ts, audit.ts, tickets.ts, ops.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: events across organizers, status, key counts.

STATES: default · empty · loading.

INTERACTIONS / MICROCOPY: row → act-on-behalf enters that event with banner.

RESPONSIVE: desktop-first.

ACCESSIBILITY: status icon + label.

TOKENS USED: status colors, orange accents, navy sidebar.

BUILD CHECKLIST: [ ] overview [ ] per-event jump [ ] empty/loading [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

##### A-03 — Act-on-behalf (impersonation)

```text
SCREEN: A-03 — Act-on-behalf (impersonation)
APP / SURFACE: console · Admin   THEME: Light (and show on dark command-center too)
ROUTE: /admin/impersonate → admin.impersonate.tsx (+ global banner)
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Let staff operate any event on the organizer's behalf, with a persistent, unmistakable banner and
audit-reason capture.

NAV: Entered from A-01. Wraps the organizer screens while active.

LAYOUT: A PERSISTENT high-contrast banner across the whole session: organizer/event context, staff identity,
elapsed time, prominent "Exit act-on-behalf". Below it, a normal organizer screen.

KEY COMPONENTS: sticky Banner, audit-reason Dialog (shown before first sensitive change and repeated for
high-risk actions), exit Button.

CONTENT / COPY: "Acting on behalf of CFR Running Club · Coimbatore Marathon 2026 · staff: meena · 04:12 ·
Exit". Audit prompt: "Why are you making this change?"

MOCK DATA: apps/console/src/mocks/organizers.ts, audit.ts, tickets.ts, ops.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: organizer + event context, staff user, elapsed time.

STATES: banner active · audit-reason prompt (first sensitive change) · repeated prompt for
high-risk action (refund/PII export/publish/manual payment override) · exiting.

INTERACTIONS / MICROCOPY: cannot dismiss banner; sensitive action blocked until reason entered.

RESPONSIVE: banner persists across breakpoints.

ACCESSIBILITY: banner high-contrast, announced; reason dialog focus-trapped.

TOKENS USED: high-contrast warning/danger banner, works in light + dark.

BUILD CHECKLIST: [ ] persistent banner [ ] context + elapsed + exit [ ] audit-reason first change [ ] [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
repeat for high-risk
```

##### A-06 — Audit Log

```text
SCREEN: A-06 — Audit Log
APP / SURFACE: console · Admin   THEME: Light
ROUTE: /admin/audit → admin.audit.tsx
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Record of sensitive actions for trust/compliance.

NAV: From admin sidebar.

LAYOUT: Desktop. Filterable audit table: timestamp, actor, action, target, reason, before/after where
relevant.

KEY COMPONENTS: Table, filters (actor/action/date/event), row detail expand.

CONTENT / COPY: actions — publish/unpublish, refunds, PII exports, impersonation, manual payment overrides,
bulk deletes, role changes.

MOCK DATA: apps/console/src/mocks/organizers.ts, audit.ts, tickets.ts, ops.ts; types in apps/console/src/mocks/types.ts; fixture shape/sample rows cover: timestamp, actor, action, target, audit reason.

STATES: default · filtered · empty · loading.

INTERACTIONS / MICROCOPY: filter by action type; expand for detail.

RESPONSIVE: desktop-first.

ACCESSIBILITY: table sortable/keyboard; reasons readable.

TOKENS USED: neutral table, semantic accents for action severity.

BUILD CHECKLIST: [ ] log table [ ] filters [ ] reason captured [ ] detail expand [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

#### Wave 1 · Shared / system states

> Most of these are proven in **Foundations KIT-3**. Use these build specs to finalize each as a standalone,
> reusable pattern screen component.

```text
SCREEN: S-03 Empty States · S-04 Loading/Skeleton · S-05 Confirmation/Success Modal ·
  S-07 Consent/Privacy Notice (DPDP) · S-08 Access Denied/Role Boundary · S-09 Import/Upload Validation ·
  S-10 Offline/Degraded Manual Backup · S-11 Webhook/Reconciliation Pending
APP / SURFACE: shared · reusable patterns (web + console)   THEME: Light
ROUTE: S-03: route-less → @corral/ui EmptyState; S-04: route-less → @corral/ui Skeleton; S-05: route-less → @corral/ui Dialog pattern
WAVE / PRIORITY: Wave 1 · P0

PURPOSE: Reusable system patterns referenced by every other screen.

BUILD, each as a labeled section in one screen component:
- S-03 Empty: no events / no registrations / no results — friendly illustration + primary action, per surface.
- S-04 Loading: skeletons for cards, tables, and mobile pages.
- S-05 Confirm/Success modal: reusable confirm + destructive-action pattern (icon + clear consequence +
  cancel/confirm), plus a success variant.
- S-07 DPDP consent/privacy notice: data-collection disclosure + consent affordances + links; minor variant.
- S-08 Access denied / role boundary: RBAC or event-scope mismatch with a safe next action.
- S-09 Import/upload validation: CSV parse errors, column issues, row-level fixes (shared by O-13/O-24-26).
- S-10 Offline/degraded/manual backup: Razorpay delay, WhatsApp delay, CSV/PDF delay; say what is safe,
  what is delayed, who owns follow-up, the manual support path, and the required audit note captured when
  Corral staff process it manually (owner + next follow-up time + support contact + audit reason).
- S-11 Webhook/reconciliation pending: pending, retrying, retry exhausted/needs review; keep payment status
  separate from communication delivery status.

STATES: as listed above for each pattern; each demoable with ?demo= where applicable.
ACCESSIBILITY: pair every status with icon + label; dialogs focus-trapped; clear primary action.
TOKENS: semantic colors per state, orange primary.
BUILD CHECKLIST: [ ] each pattern designed [ ] surface variants where relevant [ ] reused by real screens [ ] states covered via ?demo= [ ] nav wired [ ] a11y [ ] model-reviewed when non-trivial
```

---

### WAVE 2 — India table-stakes + operations (P1) — stubs to expand

> **✅ Fully expanded.** Every stub below is now authored as a complete build spec in the
> [`design-build/`](design-build/) pack (see [design-build/README.md](design-build/README.md)) and routed by
> [design-build/navigation-and-routes.md](design-build/navigation-and-routes.md):
> - Participant (P-04, P-10, P-10A, P-16, P-17, P-18, P-25) → [design-build/wave2-participant.md](design-build/wave2-participant.md)
> - Organizer (O-08, O-10, O-13, O-15, O-16, O-17, O-18, O-19) → [design-build/wave2-organizer-a.md](design-build/wave2-organizer-a.md)
> - Organizer (O-03A, O-22, O-32, O-33, O-34, O-35) → [design-build/wave2-organizer-b.md](design-build/wave2-organizer-b.md)
> - Admin (A-02, A-05, A-07, A-08) → [design-build/wave2-admin.md](design-build/wave2-admin.md)
> - Shared (S-01, S-02, S-06) → [design-build/wave2-shared-wave3.md](design-build/wave2-shared-wave3.md)
>
> The table below remains as a quick at-a-glance index. Reuse Foundations + Wave 1 patterns.

| ID | Surface · Theme | Purpose | Key components | States to build |
|---|---|---|---|---|
| P-04 | Participant · Light | Refund/Cancellation policy (full page) | long-form legal page, back-to-checkout | default |
| P-10 | Participant · Light | Coupon code entry (inline/modal) | coupon Input, apply, applied row | invalid · valid/applied · expired · usage-cap reached |
| P-10A | Participant · Light | Insurance add-on opt-in | coverage summary, premium, opt-in/skip | not enabled · unavailable for category/age · opted-in · declined |
| P-16 | Participant · Light | Group registration entry | add-row repeater + CSV paste, running total | row errors · duplicate detection |
| P-17 | Participant · Light | Group roster review | per-row validation table, totals | row errors · all valid |
| P-18 | Participant · Light | Group payment + GST invoice | one payment, coordinator + GST fields | default · GST vs non-GST |
| P-25 | Participant · Light | Insurance policy / add-on status | coverage, policy status, support path | active · pending · support |
| O-03A | Organizer · Light | Team members & roles (RBAC) | invite, role assign, audit note | invite sent · role change (audit reason) · removed |
| O-08 | Organizer · Light | Event branding | logo/banner/sponsor uploads | default · upload error |
| O-10 | Organizer · Light | Coupon codes | create %/flat, caps, validity, table | default · overlapping · expired |
| O-13 | Organizer · Light | CSV import-update (roster) | upload + column-map + validate (uses S-09) | unmapped · row errors · ready |
| O-15 | Organizer · Light | Spot/cash/offline registration | quick add form, payment mode cash/comp | default · validation |
| O-16 | Organizer · Light | T-shirt size summary | aggregate counts table/chart | default · empty |
| O-17 | Organizer · Light | BIB assignment | manual entry + CSV upload | default · uploading · assigned |
| O-18 | Organizer · Light | BIB duplicate/validation | duplicate warnings table | duplicates found · clean |
| O-19 | Organizer · Light | BIB ↔ chip mapping | exportable/correctable mapping table | default · mismatch |
| O-22 | Organizer · Light | Template editor | trigger-based template editor + variables | draft · pending approval · approved |
| O-32 | Organizer · Light | GST invoice / report export | export GST + payment report | default · exporting · empty |
| O-33 | Organizer · Light | Refunds | initiate/track within PA-PG limits | requested · processing · refunded · failed |
| O-34 | Organizer · Light | Permissions checklist (TN/Coimbatore) | checklist + due dates + attachments | not started · due soon · blocked · done |
| O-35 | Organizer · Light | Medical / emergency roster | print/export medical sheet | default · print view |
| A-02 | Admin · Light | Organizer/customer management | org list + entity/GST status | default · empty |
| A-05 | Admin · Light/Dark | Global delivery-status monitor | cross-event delivery table | default · failures |
| A-07 | Admin · Light | Support / ticket view (privacy/data requests) | ticket list, verification, SLA, status | open · verifying · resolved |
| A-08 | Admin · Dark | Operations monitor / job health | jobs, webhooks, queues, PDF/comms health | healthy · degraded · failed jobs · backlog · PDF/storage errors |
| S-01 | Shared · Light | 404 / Not found | friendly 404 + home action | default |
| S-02 | Shared · Light | Error / something went wrong | error boundary + retry | default |
| S-06 | Shared · Light | Session expired / auth error | re-auth prompt | default |

---

### WAVE 3 — Discovery polish (P2) — stubs to expand

> **✅ Fully expanded** in [design-build/wave2-shared-wave3.md](design-build/wave2-shared-wave3.md)
> (P-01 Coimbatore Running Calendar, A-04 Calendar Seeding / Management). Use
> [design-build/navigation-and-routes.md](design-build/navigation-and-routes.md) for final route files/nav.

| ID | Surface · Theme | Purpose | Key components | States to build |
|---|---|---|---|---|
| P-01 | Participant · Light | Coimbatore running calendar (discovery) | event list/cards, filters | default · empty · loading |
| A-04 | Admin · Light | Calendar seeding / management | curate public calendar entries | default · empty |

---

## Part 5 — Build Tracker

> Status vocabulary: `Not started · Scaffolded · In progress · Built · Reviewed · Needs changes · Blocked`.
> **Built** means route exists, mock fixtures are wired, all listed states are demoable via `?demo=`, nav links
> work, responsive target checked, a11y checklist passed, and there are no backend calls. **Reviewed** means a
> second model (GPT-5.5/Gemini Pro) reviewed a non-trivial screen. Put the route file and commit in **Notes**.

| ID | Screen | App | Route | Status | Notes |
|---|---|---|---|---|---|
| KIT-1 | Core @corral/ui primitives | ui | packages/ui/src/components/* | Not started | Route file/commit notes |
| KIT-2 | Participant/Organizer/Admin shells + data table/drawer | web + console | apps/*/src/routes/__root.tsx; _authenticated.tsx; admin.tsx | Not started | Route file/commit notes |
| KIT-3 | Mock fixtures/store/types/personas + system states | web + console + ui | apps/*/src/mocks/*; @corral/ui patterns | Not started | Route file/commit notes |
| P-01 | Calendar | web | /calendar → calendar.tsx | Not started | Route file + commit |
| P-02 | Event Landing | web | /events/$eventId → events.$eventId.index.tsx | Not started | Route file + commit |
| P-03 | Event Details | web | /events/$eventId/details → events.$eventId.details.tsx | Not started | Route file + commit |
| P-04 | Refund Policy | web | /events/$eventId/policy/refund → events.$eventId.policy.refund.tsx | Not started | Route file + commit |
| P-05 | Waiver / Medical (full) | web | /events/$eventId/policy/waiver → events.$eventId.policy.waiver.tsx | Not started | Route file + commit |
| P-06 | Category / Distance | web | /events/$eventId/register/category → events.$eventId.register.category.tsx | Not started | Route file + commit |
| P-07 | Registration Form | web | /events/$eventId/register/form → events.$eventId.register.form.tsx | Not started | Route file + commit |
| P-08 | Consent stack | web | /events/$eventId/register/waiver → events.$eventId.register.waiver.tsx | Not started | Route file + commit |
| P-09 | Guardian Consent | web | /events/$eventId/register/guardian → events.$eventId.register.guardian.tsx | Not started | Required before minor-eligible categories; route file + commit |
| P-10 | Coupon Entry (component in P-11) | web | component inside /events/$eventId/register/summary → events.$eventId.register.summary.tsx (CouponEntry component) | Not started | Route file + commit |
| P-10A | Insurance Add-on | web | /events/$eventId/register/insurance → events.$eventId.register.insurance.tsx | Not started | Route file + commit |
| P-11 | Order Summary | web | /events/$eventId/register/summary → events.$eventId.register.summary.tsx | Not started | Route file + commit |
| P-12 | Payment | web | /events/$eventId/register/payment → events.$eventId.register.payment.tsx | Not started | Route file + commit |
| P-13 | Processing | web | /events/$eventId/register/processing → events.$eventId.register.processing.tsx | Not started | Route file + commit |
| P-14 | Payment Success | web | /events/$eventId/register/success → events.$eventId.register.success.tsx | Not started | Route file + commit |
| P-15 | Payment Failure/Retry | web | /events/$eventId/register/failed → events.$eventId.register.failed.tsx | Not started | Route file + commit |
| P-16 | Group Registration | web | /events/$eventId/group → events.$eventId.group.index.tsx | Not started | Route file + commit |
| P-17 | Group Roster | web | /events/$eventId/group/roster → events.$eventId.group.roster.tsx | Not started | Route file + commit |
| P-18 | Group Payment | web | /events/$eventId/group/payment → events.$eventId.group.payment.tsx | Not started | Route file + commit |
| P-19 | E-Ticket | web | /my/registrations/$registrationId → my.registrations.$registrationId.index.tsx | Not started | Route file + commit |
| P-20 | BIB & Kit Collection | web | /my/registrations/$registrationId/kit → my.registrations.$registrationId.kit.tsx | Not started | Route file + commit |
| P-21 | Race-Day Instructions | web | /events/$eventId/race-day → events.$eventId.race-day.tsx | Not started | Route file + commit |
| P-22 | My Result | web | /my/registrations/$registrationId/result → my.registrations.$registrationId.result.tsx | Not started | Route file + commit |
| P-23 | Full Leaderboard | web | /events/$eventId/leaderboard → events.$eventId.leaderboard.tsx | Not started | Route file + commit |
| P-24 | Certificate View/Download | web | /my/registrations/$registrationId/certificate → my.registrations.$registrationId.certificate.tsx | Not started | Route file + commit |
| P-25 | Insurance Status | web | /my/registrations/$registrationId/insurance → my.registrations.$registrationId.insurance.tsx | Not started | Route file + commit |
| O-01 | Login | console | /login → login.tsx (exists; public) | Not started | Route file + commit |
| O-02 | Organizer Onboarding | console | /onboarding → _authenticated.onboarding.tsx | Not started | Route file + commit |
| O-03 | Payment Onboarding | console | /onboarding/payment → _authenticated.onboarding.payment.tsx | Not started | Route file + commit |
| O-03A | Team & Roles | console | /settings/team → _authenticated.settings.team.tsx | Not started | Route file + commit |
| O-04 | Events Dashboard | console | / → _authenticated.index.tsx (exists) | Not started | Route file + commit |
| O-05 | Setup Basics | console | /events/$eventId/setup/basics → _authenticated.events.$eventId.setup.basics.tsx | Not started | Route file + commit |
| O-06 | Distances & Fees | console | /events/$eventId/setup/fees → _authenticated.events.$eventId.setup.fees.tsx | Not started | Route file + commit |
| O-07 | Form Builder | console | /events/$eventId/setup/form → _authenticated.events.$eventId.setup.form.tsx | Not started | Route file + commit |
| O-08 | Branding | console | /events/$eventId/setup/branding → _authenticated.events.$eventId.setup.branding.tsx | Not started | Route file + commit |
| O-09 | Policies | console | /events/$eventId/setup/policies → _authenticated.events.$eventId.setup.policies.tsx | Not started | Route file + commit |
| O-10 | Coupons | console | /events/$eventId/coupons → _authenticated.events.$eventId.coupons.tsx | Not started | Route file + commit |
| O-10A | Publish Readiness | console | /events/$eventId/setup/publish → _authenticated.events.$eventId.setup.publish.tsx | Not started | Route file + commit |
| O-11 | Roster ★ | console | /events/$eventId/roster → _authenticated.events.$eventId.roster.index.tsx | Not started | Route file + commit |
| O-12 | Participant Detail | console | /events/$eventId/roster/$participantId → _authenticated.events.$eventId.roster.$participantId.tsx | Not started | Route file + commit |
| O-13 | CSV Import | console | /events/$eventId/roster/import → _authenticated.events.$eventId.roster.import.tsx | Not started | Route file + commit |
| O-14 | CSV Export | console | /events/$eventId/roster/export → _authenticated.events.$eventId.roster.export.tsx | Not started | Route file + commit |
| O-15 | Spot/Offline Registration | console | /events/$eventId/roster/spot → _authenticated.events.$eventId.roster.spot.tsx | Not started | Route file + commit |
| O-16 | T-shirt Summary | console | /events/$eventId/roster/tshirts → _authenticated.events.$eventId.roster.tshirts.tsx | Not started | Route file + commit |
| O-17 | BIB Assignment | console | /events/$eventId/bibs → _authenticated.events.$eventId.bibs.index.tsx | Not started | Route file + commit |
| O-18 | BIB Validation | console | /events/$eventId/bibs/validate → _authenticated.events.$eventId.bibs.validate.tsx | Not started | Route file + commit |
| O-19 | BIB ↔ Chip Mapping | console | /events/$eventId/bibs/chips → _authenticated.events.$eventId.bibs.chips.tsx | Not started | Route file + commit |
| O-20 | Comms Dashboard | console | /events/$eventId/comms → _authenticated.events.$eventId.comms.index.tsx | Not started | Route file + commit |
| O-21 | Send / Broadcast | console | /events/$eventId/comms/send → _authenticated.events.$eventId.comms.send.tsx | Not started | Route file + commit |
| O-22 | Templates | console | /events/$eventId/comms/templates → _authenticated.events.$eventId.comms.templates.tsx | Not started | Route file + commit |
| O-23 | Delivery Status | console | /events/$eventId/comms/delivery → _authenticated.events.$eventId.comms.delivery.tsx | Not started | Route file + commit |
| O-24 | Results Upload | console | /events/$eventId/results/upload → _authenticated.events.$eventId.results.upload.tsx | Not started | Route file + commit |
| O-25 | Results Mapping | console | /events/$eventId/results/mapping → _authenticated.events.$eventId.results.mapping.tsx | Not started | Route file + commit |
| O-26 | Results Validation | console | /events/$eventId/results/validate → _authenticated.events.$eventId.results.validate.tsx | Not started | Route file + commit |
| O-27 | Results Preview | console | /events/$eventId/results/preview → _authenticated.events.$eventId.results.preview.tsx | Not started | Route file + commit |
| O-28 | Publish/Unpublish | console | /events/$eventId/results/publish → _authenticated.events.$eventId.results.publish.tsx | Not started | Route file + commit |
| O-29 | Certificate Template | console | /events/$eventId/certificates/template → _authenticated.events.$eventId.certificates.template.tsx | Not started | Route file + commit |
| O-30 | Certificate Generation | console | /events/$eventId/certificates/status → _authenticated.events.$eventId.certificates.status.tsx | Not started | Route file + commit |
| O-31 | Payments/Settlement | console | /events/$eventId/payments → _authenticated.events.$eventId.payments.index.tsx | Not started | Route file + commit |
| O-32 | GST Exports | console | /events/$eventId/payments/exports → _authenticated.events.$eventId.payments.exports.tsx | Not started | Route file + commit |
| O-33 | Refunds | console | /events/$eventId/payments/refunds → _authenticated.events.$eventId.payments.refunds.tsx | Not started | Route file + commit |
| O-34 | Permissions Checklist | console | /events/$eventId/permissions → _authenticated.events.$eventId.permissions.tsx | Not started | Route file + commit |
| O-35 | Medical Roster | console | /events/$eventId/roster/medical → _authenticated.events.$eventId.roster.medical.tsx | Not started | Route file + commit |
| A-01 | Admin Home | console | /admin → admin.index.tsx | Not started | Route file + commit |
| A-02 | Organizers | console | /admin/organizers → admin.organizers.tsx | Not started | Route file + commit |
| A-03 | Act-on-behalf | console | /admin/impersonate → admin.impersonate.tsx (+ global banner) | Not started | Route file + commit |
| A-04 | Calendar Seeding | console | /admin/calendar → admin.calendar.tsx | Not started | Route file + commit |
| A-05 | Delivery Monitor | console | /admin/delivery → admin.delivery.tsx | Not started | Route file + commit |
| A-06 | Audit Log | console | /admin/audit → admin.audit.tsx | Not started | Route file + commit |
| A-07 | Support Tickets | console | /admin/support → admin.support.tsx | Not started | Route file + commit |
| A-08 | Ops Monitor | console | /admin/ops → admin.ops.tsx (DARK) | Not started | Route file + commit |
| S-01 | 404 | shared | root notFoundComponent → web + console roots | Not started | Route file + commit |
| S-02 | Error Boundary | shared | root errorComponent → web + console roots | Not started | Route file + commit |
| S-03 | Empty States | shared | route-less → @corral/ui EmptyState | Not started | Route file + commit |
| S-04 | Loading/Skeleton | shared | route-less → @corral/ui Skeleton | Not started | Route file + commit |
| S-05 | Confirm/Success Modal | shared | route-less → @corral/ui Dialog pattern | Not started | Route file + commit |
| S-06 | Session Expired | console | /session-expired → session-expired.tsx (public) | Not started | Route file + commit |
| S-07 | DPDP Consent | web/shared | /privacy + route-less consent pattern → privacy.tsx + @corral/ui consent pattern | Not started | Route file + commit |
| S-08 | Access Denied | shared | route-less + console fallback → @corral/ui AccessDenied pattern | Not started | Route file + commit |
| S-09 | Import Validation | shared | route-less → @corral/ui ImportValidation pattern | Not started | Route file + commit |
| S-10 | Offline/Degraded Manual Backup | shared | route-less → @corral/ui DegradedBanner pattern | Not started | Pilot gate; route file/pattern + commit |
| S-11 | Webhook/Reconciliation Pending | shared | route-less → StatusBadge + PendingBanner pattern | Not started | Pilot gate; route file/pattern + commit |

---

## Appendix — Coverage check (all 82 unique screens)

- **Participant (26):** P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-10A, P-11, P-12,
  P-13, P-14, P-15, P-16, P-17, P-18, P-19, P-20, P-21, P-22, P-23, P-24, P-25.
- **Organizer (37):** O-01, O-02, O-03, O-03A, O-04, O-05, O-06, O-07, O-08, O-09, O-10, O-10A, O-11,
  O-12, O-13, O-14, O-15, O-16, O-17, O-18, O-19, O-20, O-21, O-22, O-23, O-24, O-25, O-26, O-27, O-28,
  O-29, O-30, O-31, O-32, O-33, O-34, O-35.
- **Admin (8):** A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08.
- **Shared/System (11):** S-01, S-02, S-03, S-04, S-05, S-06, S-07, S-08, S-09, S-10, S-11.

Every screen above appears either as a full Wave 1 build spec or a fully-authored Wave 2/3 build spec in the
[`design-build/`](design-build/) pack, and is tracked in Part 5.

