# Corral — Wave-2 Shared/System + Wave-3 Discovery build specs

This file expands five screens into in-app frontend BUILD SPECS for Corral: three Shared/System screens (S-01 404, S-02 Error boundary, S-06 Session expired) and two Wave-3 discovery screens (P-01 Coimbatore Running Calendar, A-04 Calendar Seeding / Management).

Build these directly in the React apps, screen by screen, with typed in-repo mock fixtures only. Do not design in external artifacts, do not freeze screenshots, and do not call any backend while implementing these specs.

Authoritative routing, ownership, shells, and demo-state rules live in `docs/design-build/navigation-and-routes.md`. Use the canonical route/file paths below exactly.

---

## S-01 — 404 / Not Found

**Requirements & plan comparison**
- `navigation-and-routes.md` owns S-01 as **both roots `notFoundComponent` (web + console)**, not a standalone route.
- This must support participant mobile public recovery and console recovery without exposing raw URLs, stack traces, internal route names, hostnames, SQL, IDs, or provider internals.
- Missing-event nuance remains important: a deleted or expired event link shared on WhatsApp should recover to the participant calendar rather than a dead home.
- Organizer/admin console 404s must preserve shell context where possible; authenticated users should keep the navy sidebar/topbar and have a clear route back to their dashboard.

```text
SCREEN: S-01 — 404 / Not Found
APP / SURFACE: Shared/System · Participant mobile 390px + console Organizer/Admin desktop 1280px
ROUTE: Root handler, not a route  →  apps/web/src/routes/__root.tsx notFoundComponent + apps/console/src/routes/__root.tsx notFoundComponent            THEME: Light
NAV: Unknown participant URLs and invalid event/registration IDs recover to /calendar; secondary participant link to /. Organizer console misses recover to / (dashboard) and event lists inside the authenticated shell. Admin console misses recover to /admin. Use explicit <Link> navigation, never history.back(). Reference `docs/design-build/navigation-and-routes.md` D9/D12.

PURPOSE
Reassure a user who hit a missing/expired route or event that nothing is broken, and give one obvious, safe way back into the correct product surface.

LAYOUT
Build two variants behind the root `notFoundComponent`:
- Participant mobile (390px): full-bleed, no heavy chrome, centered column with friendly Oswald "404" lockup over a light brand-tint wash, short reassurance copy, primary calendar recovery link, secondary home link, and generous whitespace with ≥44px targets.
- Console desktop (1280px): render inside the current console shell when auth context exists. Main content shows a centered Card with the same 404 lockup, message, and two recovery actions; keep the always-navy sidebar visible so staff are not stranded. If rendered before auth, use a focused full-page card with dashboard/sign-in-safe links only.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`@corral/ui/components/card`, `button` rendered as links, `breadcrumb` for console, `alert` for the "event may have ended" note, Lucide `MapPinOff` or `Compass` icon paired with text. Use shell slots from `apps/web/src/routes/__root.tsx` and `apps/console/src/routes/__root.tsx`.

CONTENT / COPY  (real Coimbatore content)
Participant heading: "404 — page not found". Body: "This page or event link isn't available — it may have ended or moved. The race you're after might still be on our calendar." Primary link: "Browse Coimbatore running calendar". Secondary link: "Back to home".
Console heading: "404 — page not found". Body: "We couldn't find that page. It may have been moved, or the event was removed." Organizer primary link: "Go to dashboard". Organizer secondary link: "View all events". Admin primary link: "Go to admin home".
Optional helper: "If you reached this from a saved link, the event may have closed."

MOCK DATA  (fixture module + shape + sample rows)
Use deterministic system fixtures only; no network. Suggested modules: `apps/web/src/mocks/system.ts` and `apps/console/src/mocks/system.ts` with local types in `src/mocks/types.ts`.
Shape: `{ variant: 'generic' | 'event-not-found' | 'registration-not-found'; surface: 'participant' | 'organizer' | 'admin'; recoveryHref: string; secondaryHref?: string; message: string }`.
Sample: event-not-found for `coimbatore-marathon-2026` recovers to `/calendar`; organizer generic recovers to `/`.

STATES
Required demo enum values: `default` only for this handler, plus entity-not-found variants from invalid loaders.
Demo URLs:
- Participant unknown route: `/missing-page?demo=default`
- Participant missing event: `/events/known-bad-event?demo=default`
- Console organizer miss: `/events/known-bad-event/roster?demo=default&as=org-owner`
- Admin miss: `/admin/missing-tool?demo=default&as=corral-admin`

INTERACTIONS / MICROCOPY
Primary action is the single clear recovery per surface. Participant primary routes to P-01 `/calendar`. Console primary routes to the relevant dashboard. Secondary links remain visually quieter. No toasts. Do not echo raw requested URLs.

RESPONSIVE
Participant variant is designed at 390px and usable to 414px. Console variant is optimized at 1280px; tablet fallback may collapse the sidebar to icons while the card remains centered.

ACCESSIBILITY
Icon is always paired with visible "404 — page not found" text. Heading is `<h1>`. Primary action is first in tab order. Focus ring: 2px #ff5a00 with 2px offset. Respect reduced motion; any illustration is static or non-essential.

TOKENS USED
Background #f8fafc, card #ffffff, text #0f172a, brand-tint #fff1ea, primary orange #ff5a00, muted-foreground #475569, sidebar navy #0f172a.

BUILD CHECKLIST
[ ] Root notFoundComponent wired in both apps [ ] participant variant recovers to /calendar [ ] organizer/admin variants recover to dashboard/admin home [ ] no raw URLs/stack traces/internals leaked [ ] icon+label pairing and visible focus ring [ ] states-via-?demo= [ ] nav wired [ ] a11y [ ] model-reviewed
```

---

## S-02 — Error / Something Went Wrong

**Requirements & plan comparison**
- `navigation-and-routes.md` owns S-02 as **both roots `errorComponent`**, not a route.
- The useful prior content remains: Retry, safe fallback, support path, opaque reference code, reassurance that payment/registration data is safe where relevant, and no browser leakage of internal error details.
- It must support participant mobile and console desktop variants. Admin users may receive a staff-only Operations Monitor link, but participants never see A-08.

```text
SCREEN: S-02 — Error / Something Went Wrong
APP / SURFACE: Shared/System · Participant mobile 390px + console Organizer/Admin desktop 1280px
ROUTE: Root handler, not a route  →  apps/web/src/routes/__root.tsx errorComponent + apps/console/src/routes/__root.tsx errorComponent            THEME: Light
NAV: Rendered by root error boundaries. Participant links to / and support/WhatsApp; organizer links to / dashboard and Corral support; admin links to /admin and may show staff-only /admin/ops. Retry is a button that re-attempts the failed render/route. Reference `docs/design-build/navigation-and-routes.md` recovery rules.

PURPOSE
Catch unexpected runtime failures gracefully, reassure the user their data is safe, and offer Retry plus a safe fallback per surface without exposing internal detail.

LAYOUT
Build two variants behind the root `errorComponent`:
- Participant mobile (390px): full-bleed centered column with warning glyph + heading, calm reassurance body, primary "Try again" button, secondary "Back to home" link, and a small muted reference/support line.
- Console desktop (1280px): inside the always-navy sidebar + topbar when available. Centered Card with the same structure and a subtle Alert listing what is safe vs what to do next. Admin variant may add a staff-only Operations Monitor link.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`alert` with Lucide `AlertTriangle` icon + label, `card`, `button`, link button, `separator`, `tooltip`, copy-to-clipboard chip for reference code, `toast` for copied reference.

CONTENT / COPY  (real Coimbatore content)
Heading: "Something went wrong".
Participant body: "An unexpected error stopped this page from loading. Don't worry — if you were registering, no payment was taken without confirmation. Try again, or reach us on WhatsApp."
Organizer body: "An unexpected error occurred while loading this page. Your event data is safe. Try again, or contact Corral support if it keeps happening."
Primary button: "Try again". Secondary: participant "Back to home"; organizer "Go to dashboard"; admin "Go to admin home".
Reference line: "Reference: ERR-7F3A · Contact support".
Console Alert copy: "Safe: saved event, roster, and payment records are not changed by this screen error. Next: retry once, then quote the reference to Corral support."

MOCK DATA  (fixture module + shape + sample rows)
Use deterministic system/error fixtures only. Suggested modules: `apps/web/src/mocks/system.ts` and `apps/console/src/mocks/system.ts`.
Shape: `{ reference: 'ERR-7F3A'; surface: 'participant' | 'organizer' | 'admin'; supportHref: string; retryLabel: string; safeFallbackHref: string }`.
Sample references should be opaque short tokens only (`ERR-7F3A`, `ERR-KOVAI-02`), never trace IDs, SQL, raw exception strings, internal hostnames, MinIO/TiTiler/STAC URLs, or payloads.

STATES
Required demo enum values: `default` and `error` when a route intentionally throws for demo. Retry remains an interaction inside the same state.
Demo URLs:
- Participant default: `/calendar?demo=default`
- Participant boundary: `/calendar?demo=error`
- Participant registration boundary: `/events/coimbatore-marathon-2026/register/payment?demo=error`
- Organizer boundary: `/events/coimbatore-marathon-2026/roster?demo=error&as=org-owner`
- Admin boundary: `/admin/calendar?demo=error&as=corral-admin`

INTERACTIONS / MICROCOPY
"Try again" re-attempts the failed route render or resets the error boundary. Reference chip copies with toast "Reference copied". Support link opens the configured support/WhatsApp contact. If retry fails repeatedly, keep the same copy and reference; do not show internals.

RESPONSIVE
Participant 390px, usable to 414px, vertically centered. Console 1280px with tablet fallback; sidebar collapses while Card remains centered at max-width ~560px.

ACCESSIBILITY
Error region uses `role="alert"`. Warning is conveyed by icon + visible heading, never color alone. Use danger-text #b91c1c for colored error text. Focus ring 2px #ff5a00. Primary action first in tab order. Avoid looping error animations.

TOKENS USED
Background #f8fafc, card #ffffff, danger fill #ef4444, danger-text #b91c1c, warning #f59e0b, primary orange #ff5a00, muted-foreground #475569, sidebar navy #0f172a.

BUILD CHECKLIST
[ ] Root errorComponent wired in both apps [ ] participant + console variants [ ] Retry + safe fallback links [ ] reassurance copy [ ] opaque reference code only [ ] no internals leaked [ ] role=alert + focus ring [ ] states-via-?demo= [ ] nav wired [ ] a11y [ ] model-reviewed
```

---

## S-06 — Session Expired / Auth Error

**Requirements & plan comparison**
- `navigation-and-routes.md` owns S-06 as **console route `/session-expired` → `session-expired.tsx` plus participant re-auth pattern**.
- Participant auth remains passwordless: resend magic link first, with mobile OTP fallback. The recovery path must explicitly support **resend magic link → OTP**.
- Organizer/admin auth uses mockable email+password and Google sign-in. Preserve the intended destination where safe. Admin act-on-behalf sessions must not silently resume after expiration.
- This screen must remain frontend-only during build: mock auth/session fixtures, `?as=session-expired`, `?demo=` states, and no real Better Auth/backend calls in mock mode.

```text
SCREEN: S-06 — Session Expired / Auth Error
APP / SURFACE: Shared/System · console public route + participant route-less re-auth pattern
ROUTE: /session-expired  →  apps/console/src/routes/session-expired.tsx; Participant has no standalone route and uses a route-less passwordless re-auth pattern in app components/@corral/ui            THEME: Light
NAV: Console route is public and links to /login, preserves safe `redirect` back to the intended console route, and routes admins back through /admin when applicable. Participant pattern appears inside the interrupted flow; primary action resends a magic link, secondary action reveals OTP, and success returns to the saved destination. Recovery path: resend magic link → OTP fallback. Reference `docs/design-build/navigation-and-routes.md` D4/D5.

PURPOSE
When a session, magic link, OTP, or auth token expires, prompt the user to re-authenticate using the correct method for their surface, then return them to what they were doing.

LAYOUT
Build two variants:
- Participant mobile route-less pattern (390px): centered full-bleed card/panel with Lock/Clock icon + heading, explanation, primary "Resend magic link" button, secondary "Use a one-time code (OTP) instead" toggle, 6-digit OTP input, resend countdown, and "Back to home" link. This pattern can be mounted by participant flows when `?as=session-expired` or a mock store marks the session expired.
- Console desktop route (1280px): `apps/console/src/routes/session-expired.tsx` public page with centered auth Card. Email + password fields, primary "Sign in", divider, "Continue with Google", forgot-password link, and muted admin act-on-behalf restart note. The navy shell may be dimmed behind authenticated timeout cases, but the route itself must not require auth to render.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`card`, `input` (email, password, OTP boxes/group), `button`, outline Google button, `separator`, `alert` for expiry reason, Lucide `Clock`/`LockKeyhole` paired with labels, `toast`, optional `tooltip`, tabular-nums countdown. Use `mockMutate(payload, { demo })` from `src/mocks/utils.ts` for fake resend/sign-in/OTP outcomes.

CONTENT / COPY  (real Coimbatore content)
Heading: "Your session expired".
Participant body: "For your security, this link timed out. We can send a fresh magic link to your email, or you can enter a one-time code (OTP) sent to your mobile." Primary: "Resend magic link". Secondary: "Use a one-time code (OTP) instead". OTP helper: "Enter the 6-digit code sent to •••• 4210. Resend in 0:28". Success toast: "Magic link sent to your email".
Console body: "Please sign in again to continue. You'll return to where you left off." Fields: "Work email", "Password". Primary: "Sign in". Alternative: "Continue with Google". Forgot link: "Forgot password?" Admin note: "Acting-on-behalf sessions end at sign-out and must be restarted."

MOCK DATA  (fixture module + shape + sample rows)
Use typed mock auth fixtures only. Suggested modules: `apps/web/src/mocks/auth.ts`, `apps/web/src/mocks/store.ts`, `apps/console/src/mocks/auth.ts`, `apps/console/src/mocks/personas.ts`, and shared helper `src/mocks/utils.ts` per app.
Shape: `{ persona: 'session-expired' | 'org-owner' | 'corral-admin'; maskedEmail?: string; maskedPhone?: string; redirectTo?: string; authMethods: Array<'magic-link' | 'otp' | 'password' | 'google'> }`.
Samples: participant `r•••@gmail.com`, `•••• 4210`; organizer `ops@kovairunners.example`; admin `admin@corral.example`. Never store real secrets, full tokens, password values, or raw token rejection reasons.

STATES
Required demo enum values: `default`, `success`, `validation-error`, `error`.
Demo URLs:
- Console default: `/session-expired?demo=default&as=session-expired&redirect=/events/coimbatore-marathon-2026/roster`
- Console validation: `/session-expired?demo=validation-error&as=session-expired`
- Console error: `/session-expired?demo=error&as=session-expired`
- Console success: `/session-expired?demo=success&as=org-owner&redirect=/events/coimbatore-marathon-2026/roster`
- Participant mounted pattern example: `/events/coimbatore-marathon-2026/register/form?demo=default&as=session-expired`

INTERACTIONS / MICROCOPY
Participant "Resend magic link" calls fake mutation and shows success toast. "Use OTP instead" reveals the OTP input; resend is disabled until countdown ends. OTP validation errors are inline: "Enter the 6-digit code" or "That code has expired. Request a new one." Console wrong-password error: "Email or password is incorrect." Google button starts a mocked OAuth handoff. Successful re-auth navigates to safe `redirectTo`; unsafe/missing redirects fall back to /calendar for participant, / for organizer, /admin for admin.

RESPONSIVE
Participant 390px single column; OTP boxes are ≥44px and thumb-friendly. Console 1280px centered Card max-width ~420px; tablet keeps the same centered card.

ACCESSIBILITY
Expiry status uses icon + "Your session expired" text. Password show/hide is a labeled toggle button. OTP input has aria-labels, auto-advance, and backspace support. Inline errors use danger-text #b91c1c with icon/text. Focus ring 2px #ff5a00. Respect reduced motion for focus movement/transitions.

TOKENS USED
Background #f8fafc, card #ffffff, text #0f172a, primary orange #ff5a00, info fill #0ea5e9, info-text #0369a1, danger-text #b91c1c, muted-foreground #475569, sidebar navy #0f172a, WhatsApp green #25d366 only for support contact.

BUILD CHECKLIST
[ ] Console /session-expired route file built [ ] participant route-less passwordless pattern reusable in flows [ ] resend magic link → OTP fallback [ ] email+password+Google console card [ ] safe redirect handling [ ] admin act-on-behalf restart note [ ] masked email/phone only [ ] states-via-?demo= [ ] nav wired [ ] a11y [ ] model-reviewed
```

---

## P-01 — Coimbatore Running Calendar

**Requirements & plan comparison**
- Canonical route: `/calendar` → `apps/web/src/routes/calendar.tsx` (Participant).
- This is Wave 3 discovery polish: a manually curated Coimbatore running calendar with local depth, date/distance/location filters, and clear Corral vs external/club distinctions.
- A-04 Calendar Seeding feeds this screen through typed in-repo calendar fixtures. While building, P-01 reads only `apps/web/src/mocks/` fixtures and never calls a backend.
- Required participant recovery: S-01 participant primary action links here.

```text
SCREEN: P-01 — Coimbatore Running Calendar
APP / SURFACE: apps/web · Participant mobile 390px
ROUTE: /calendar  →  apps/web/src/routes/calendar.tsx            THEME: Light
NAV: Public unauthenticated entry from /, shared WhatsApp links, and S-01 "Browse Coimbatore running calendar". Corral-hosted event cards link to P-02 `/events/$eventId`; external/club entries open their source listing in a new tab. Back/home link returns to /. Filters, search, month, and demo mode are deep-linkable search params. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Help a runner discover upcoming Coimbatore running events from one curated, trustworthy list and tap through to register for Corral-hosted events or view external listings.

LAYOUT
Mobile 390px. Sticky top bar with title "Coimbatore Running Calendar", subtitle, and search field. Below it, sticky filter row with segmented date control (This month · Next month · Pick dates) and distance chips (All · 5K · 10K · 21K · Other). Advanced filters open a Sheet with distance, date range, location/area, and event type (Corral / club / external). Main content is a vertically scrolling list of event Cards grouped by month header, with a featured section pinned above the month groups. No bottom nav required; reserve a sticky bottom CTA only if future product adds submit/suggest-event.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`input` for search, `tabs` or segmented buttons for date, `badge` chips, `sheet` for advanced filters, `card` rendered as a Link, `avatar`/logo thumbnail, `separator`, `skeleton`, `button`, Lucide `MapPin`, `CalendarDays`, `Star`, `Clock`, and external-link icon paired with labels.

CONTENT / COPY  (real Coimbatore content)
Title: "Coimbatore Running Calendar". Subtitle: "Upcoming runs in and around Coimbatore — curated by Corral." Filter labels: "This month", "Next month", "Pick dates", "All", "5K", "10K", "21K", "Other".
Card example: "Kovai Kovai Marathon 2026" · "Sun 12 Jul · 5:30 AM" · "Race Course Road, Coimbatore" · chips "5K ₹499 · 10K ₹699 · 21K ₹999" · badges "Featured" and "Corral" · status "Registration open" · CTA text "View & register".
External example: "CODISSIA Night Run" · "Sun 23 Aug · 6:00 PM" · "CODISSIA Trade Fair Complex" · badge "External" · CTA "View listing ↗".
Empty copy: "No events match these filters. Try a different month or distance." Action: "Clear filters".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/web/src/mocks/calendar.ts` with local types in `apps/web/src/mocks/types.ts`; it may mirror/export the public shape seeded by `apps/console/src/mocks/calendar.ts` for A-04. No MSW, no network, no API calls.
Shape: `{ id: string; name: string; dateTime: string; venue: string; area: string; distances: Array<{ label: '5K' | '10K' | '21K' | 'Other'; fee?: string }>; type: 'corral' | 'club' | 'external'; featured: boolean; status: 'registration-open' | 'closing-soon' | 'sold-out' | 'registration-closed' | 'external-listing'; eventId?: string; sourceUrl?: string }`.
Sample rows: `coimbatore-marathon-2026` / "Kovai Kovai Marathon 2026" at Race Course Road; `codissia-night-run-2026` / "CODISSIA Night Run" at CODISSIA Trade Fair Complex; `pollachi-trail-10k-2026` / "Pollachi Trail 10K".

STATES
Required demo enum values: `default`, `empty`, `loading`, `offline`.
Demo URLs:
- `/calendar?demo=default`
- `/calendar?demo=loading`
- `/calendar?demo=empty&distance=21K&month=2026-09`
- `/calendar?demo=offline`
Default shows populated featured + grouped month list. Empty shows clear-filters action. Loading shows skeleton top/filter rows and 4–5 skeleton cards. Offline shows a `DegradedBanner` with cached mock rows if available.

INTERACTIONS / MICROCOPY
Selecting a distance chip filters instantly and updates search params. Advanced Sheet has "Apply" and "Reset". Search filters by event, venue, or area. Tapping a Corral card links to `/events/$eventId`; tapping an external card opens a new tab with "opens in a new tab" announcement. Sold-out cards still open P-02, which owns waitlist/closed registration details. Filter state is reflected in chip highlights; no toast required.

RESPONSIVE
Design at 390px, usable to 414px. All taps ≥44px. Sticky top/filter row respects safe-area insets and does not overlap the first card. Tablet/desktop centers a ~480px column and may show two-up cards above 768px only if it does not change route behavior.

ACCESSIBILITY
Statuses and featured/external flags use icon + text labels, never color alone. External links announce "opens in a new tab". Filter chips are toggle buttons with `aria-pressed`. Month headers are semantic headings. Focus ring 2px #ff5a00. Skeleton shimmer pauses/simplifies for reduced motion.

TOKENS USED
Background #f8fafc, card #ffffff, text #0f172a, primary orange #ff5a00, brand-orange-strong #c2410c, brand-tint #fff1ea, warning-text #b45309, success-text #047857, muted-foreground #475569, border #e2e8f0.

BUILD CHECKLIST
[ ] Route file `apps/web/src/routes/calendar.tsx` built [ ] typed `apps/web/src/mocks/calendar.ts` fixture wired [ ] default + empty + loading + offline demos [ ] date/distance/search/advanced filters via search params [ ] month grouping + featured section [ ] Corral cards link to P-02 and external cards open new tab [ ] status/featured icon+label pairing [ ] states-via-?demo= [ ] nav wired [ ] a11y [ ] model-reviewed
```

---

## A-04 — Calendar Seeding / Management

**Requirements & plan comparison**
- Canonical route: `/admin/calendar` → `apps/console/src/routes/admin.calendar.tsx` under the separate Admin shell `admin.tsx`.
- A-04 feeds P-01: staff curate the same public Coimbatore calendar through typed console fixtures during the frontend build.
- The useful prior spec remains: add/edit/feature/publish, linked Corral event vs external/club entry, empty state, audit reason for public-facing changes, dense admin table, and public preview.
- This is Admin, not Organizer shell. Use the admin navy sidebar; keep it light unless it becomes race-day/ops.

```text
SCREEN: A-04 — Calendar Seeding / Management
APP / SURFACE: apps/console · Admin console 1280px
ROUTE: /admin/calendar  →  apps/console/src/routes/admin.calendar.tsx            THEME: Light admin surface with navy sidebar
NAV: Reached from Admin sidebar item "Calendar" under `admin.tsx`. Breadcrumb: "Admin / Calendar" via route staticData. "Preview public calendar" links to participant P-01 `/calendar`. Corral source links open the relevant organizer event route with explicit <Link>; external source links open in a new tab. A-04 calendar seeding feeds P-01 via fixtures. Reference `docs/design-build/navigation-and-routes.md`.

PURPOSE
Let Corral staff curate the public Coimbatore Running Calendar: add, edit, feature, publish/unpublish entries, and link each entry either to an existing organizer event or to an external listing.

LAYOUT
Desktop 1280px inside the admin shell's always-navy sidebar + topbar. Page header with title, "Preview public calendar" link, and primary "Add calendar entry" button. Toolbar includes global search, filter chips (Type: Corral / External / Club; Status: Published / Draft; Month; Featured), and sort. Main area is a dense sticky-header Table with bulk-select. Clicking a row opens a right-side Drawer for add/edit. Include a clearly labeled empty state for zero entries.

KEY COMPONENTS  (map to @corral/ui / shadcn)
`table` + data-table wrapper, `checkbox` bulk-select, `badge`, `switch`/toggle for Featured and Published, `button`, `dropdown-menu` row actions, `sheet`/Drawer form, `input`, `select`, date/time input or date picker, `radio-group`, `combobox` for organizer event lookup, `tooltip`, `breadcrumb`, `alert` for audit reason, `dialog` for destructive remove, `toast`, Lucide `Star`, `Globe`, `Building2`, external-link icons paired with text.

CONTENT / COPY  (real Coimbatore content)
Header: "Coimbatore Running Calendar". Primary button: "Add calendar entry". Link: "Preview public calendar".
Table columns: Event · Date · Distances · Venue/Area · Type · Status · Featured · Source · Last edited.
Row example: "Kovai Marathon 2026" · "12 Jul 2026" · "5K · 10K · 21K" · "Race Course Road" · badge "Corral" · badge "Published" · Star on · Source "Kovai Runners (organizer)".
External row: "CODISSIA Night Run" · "23 Aug 2026" · "5K · 10K" · "CODISSIA Trade Fair Complex" · badge "External" · badge "Draft" · Star off · Source "indiarunning.com ↗".
Drawer title: "Add calendar entry" / "Edit entry". Type radio: "Linked Corral event" vs "External / club run". Linked picker: "Find organizer event". External fields: name, date/time, distances, fee note, venue, listing URL, organizer/club name. Toggles: "Feature on calendar", "Publish (visible to public)". Publish confirm note: "Publishing makes this entry public. Add an audit reason." Empty copy: "No calendar entries yet. Seed the Coimbatore calendar by adding your first event."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/calendar.ts` with local types in `apps/console/src/mocks/types.ts`, plus `apps/console/src/mocks/audit.ts` for audit reason examples and `apps/console/src/mocks/organizers.ts`/`events.ts` for linked Corral event lookup. P-01 reads the public projection from `apps/web/src/mocks/calendar.ts`; keep the shapes intentionally similar.
Shape: `{ id: string; publicId: string; name: string; dateTime: string; distances: string[]; feeNote?: string; venue: string; area: string; type: 'corral' | 'club' | 'external'; status: 'published' | 'draft'; featured: boolean; source: { kind: 'organizer-event' | 'external-url'; eventId?: string; organizerName?: string; url?: string }; lastEditedBy: string; lastEditedAt: string; auditReason?: string }`.
Sample rows: "Kovai Marathon 2026" linked to `coimbatore-marathon-2026`; "CODISSIA Night Run" external draft; "Pollachi Trail 10K" club published.

STATES
Required demo enum values: `default`, `empty`, `loading`, `validation-error`, `success`, `permission-denied`.
Demo URLs:
- `/admin/calendar?demo=default&as=corral-admin`
- `/admin/calendar?demo=empty&as=corral-admin`
- `/admin/calendar?demo=loading&as=corral-admin`
- `/admin/calendar?demo=validation-error&as=corral-admin`
- `/admin/calendar?demo=success&as=corral-admin`
- `/admin/calendar?demo=permission-denied&as=org-readonly`
Default shows populated table with one edit Drawer open. Empty shows seed prompt. Loading shows table skeleton. Validation-error shows required drawer fields/audit reason. Success shows toast after publish/feature. Permission-denied uses S-08 pattern and links back to /admin.

INTERACTIONS / MICROCOPY
"Add calendar entry" opens Drawer. Choosing "Linked Corral event" reveals the organizer-event Combobox and auto-fills name/date/venue as read-only "from organizer event" fields. Choosing "External / club run" reveals manual fields and listing URL. Publishing/unpublishing or featuring a public entry requires an audit reason before `mockMutate` succeeds; toasts: "Entry published", "Entry unpublished", "Entry featured". Featured entries appear in P-01's featured section. Row Remove opens destructive confirm dialog. Sort defaults to date ascending. External Source opens in a new tab with ↗.

RESPONSIVE
Optimized for 1280px. Tablet fallback collapses lower-priority columns (Venue, Source, Last edited) and the sidebar to icons; Drawer becomes full-height. Table keeps sticky header and horizontal scroll when needed.

ACCESSIBILITY
Type/status/featured are Badges with icon + text, never color alone. Switches have visible on/off labels. Audit reason is a required labeled field. Destructive remove is confirmed. Bulk-select announces selected count. Focus ring 2px #ff5a00 across table and Drawer. Respect reduced motion for Drawer transitions and row hover.

TOKENS USED
Background #f8fafc, card #ffffff, text #0f172a, primary orange #ff5a00, brand-orange-strong #c2410c, success fill #10b981, success-text #047857, muted-foreground #475569, info-text #0369a1, border #e2e8f0, sidebar navy #0f172a, active #ff5a00.

BUILD CHECKLIST
[ ] Route file `apps/console/src/routes/admin.calendar.tsx` built [ ] typed `apps/console/src/mocks/calendar.ts` fixture wired [ ] public projection aligns with P-01 fixtures [ ] default + empty + loading + validation + success + permission demos [ ] add/edit Drawer with Corral-linked vs external modes [ ] feature/publish toggles require audit reason [ ] public preview links to /calendar [ ] admin shell + sticky table + bulk-select [ ] status/type/featured icon+label pairing [ ] states-via-?demo= [ ] nav wired [ ] a11y [ ] model-reviewed
```
