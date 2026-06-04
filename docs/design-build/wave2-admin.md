# Corral Wave 2 — Admin Console Build Specs

Build these Wave-2 admin screens directly in `apps\console` as TanStack route files under the separate admin shell. Follow `docs\design-build-guide.md`, `docs\design-build\navigation-and-routes.md`, and the canonical route/file table. Use in-repo typed fixtures only (`apps\console\src\mocks\*`), deterministic `?demo=` states, mock personas from `?as=`, and no backend/API calls.

Admin routes use `admin.tsx` with its own RBAC guard, admin sidebar (Home, Organizers, Calendar, Delivery, Support, Ops, Audit, Users), and persistent A-03 impersonation banner whenever Corral staff act on behalf of an organizer/event. Build Tracker statuses: `Not started · Scaffolded · In progress · Built · Reviewed · Needs changes · Blocked`.

## A-02 — Organizer / Customer Management

**Requirements & plan comparison**

- Wireframe C requires A-02 to manage organizers plus **entity/GST status**; include operational columns like entity legal name, GSTIN/KYC state, support owner, package/tier, payment account readiness, and current event count.
- Admin console mirrors organizer capabilities, so staff need quick entry to act-on-behalf, audit-log trail, and support ownership; sensitive actions like role changes, PII export, manual payment override, and impersonation require an audit reason.
- Use the light admin shell: navy sidebar, dense searchable table, sticky top bar, right-side detail drawer, compact filters, and one clear primary action.
- Payment/reconciliation labels must use the shared label set from the guide, but this screen must not confuse customer/entity readiness with participant payment status.
- RBAC roles shown: Owner, Admin, Event Editor, Finance, Support/Check-in, Read-only Viewer.
- States required by the user: **default · empty**; include loading skeleton, permission-denied, and error as demoable global patterns.
- Assumption: “customer” means organizer account/customer workspace, not participant customer; GST and support ownership are Corral internal attributes.

```text
SCREEN: A-02 — Organizer / Customer Management
APP / SURFACE: console · Admin
ROUTE: /admin/organizers  →  admin.organizers.tsx            THEME: Light
NAV: Admin sidebar item "Organizers" below Home and above Calendar/Delivery; breadcrumb via route staticData: Admin / Organizers. Reference `docs\design-build\navigation-and-routes.md`. Links out to A-03 `/admin/impersonate` for act-on-behalf, A-06 `/admin/audit` filtered to organizer, organizer event contexts, and A-07 `/admin/support` for support ownership. If staff enters an organizer/event context, keep the persistent A-03 impersonation banner visible with organizer/event, staff identity, elapsed time, and Exit.

PURPOSE
Give Corral staff a cross-organizer CRM/workspace view for onboarding, GST/entity readiness, support ownership, and safe act-on-behalf entry. The screen should help the team know which Coimbatore organizers are ready for paid pilots, which need KYC/GST/payment setup, and who owns follow-up.

LAYOUT
Desktop-first at 1280px in the `admin.tsx` shell with ALWAYS-NAVY left sidebar (#0f172a, active item #ff5a00) and light content background #f8fafc.
- Page header with title "Organizer / Customer Management", helper text "Track customer onboarding, entity/GST readiness, support owner, and event health.", primary Button "Add organizer", secondary Button "Export customer CSV" with audit reason required because it may include PII/contact data.
- KPI cards in a 4-column row: Active organizers, GST verified, Needs payment setup, Support overdue. Each card uses icon + text label, not color alone.
- Filter bar with search, city filter, support owner filter, GST/entity status filter, package filter, event health filter, and "Needs action" saved-view chip. Deep-link filters via search params.
- Dense shadcn Table with sticky header and compact rows. Row click opens right-side detail Sheet/Drawer. Row actions menu includes View events, Act on behalf, Assign owner, Update GST status, View audit trail.
- Right-side detail Drawer for selected organizer with tabs: Summary, Entity & GST, Contacts & RBAC, Events, Support Notes, Audit. Include visible audit-reason prompt before sensitive edits.
- Empty state card when no organizers match filters or no organizers exist.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Admin sidebar shell, Breadcrumb, Card, Button, Input with Search icon, Select, Badge, Table/DataTable, Checkbox for bulk select, DropdownMenu, Tooltip, Sheet/Drawer, Tabs, Avatar, Separator, Alert, Dialog, Toast, Pagination, Skeleton. Icons: Building2, ShieldCheck, AlertTriangle, IndianRupee, UserRoundCheck, Phone, Mail, FileText, LockKeyhole, Eye, LogIn, ClipboardList.

CONTENT / COPY  (real Coimbatore content)
- H1: "Organizer / Customer Management"
- Header helper: "Manage customer workspaces, GST readiness, support ownership, and safe staff access."
- Primary CTA: "Add organizer"
- Secondary CTA: "Export customer CSV"
- Filter placeholders: "Search organizer, GSTIN, owner, city…", "GST status", "Support owner", "Package", "Health"
- Saved chips: "All", "Needs GST", "Payment setup pending", "Support overdue", "Pilot events"
- KPI examples:
  1. "18 Active organizers" · icon Building2 · subcopy "7 with live events"
  2. "12 GST verified" · icon ShieldCheck · success-text label "Verified"
  3. "4 Need payment setup" · icon IndianRupee · warning-text label "Action needed"
  4. "3 Support overdue" · icon AlertTriangle · danger-text label "Past SLA"
- Table columns: Selection checkbox; Organizer; Legal entity; GST / KYC; City; Support owner; Package; Events; Current health; Payment account; Last activity; Actions.
- Row examples:
  1. "CFR Running Club" / "Coimbatore Frontrunners Trust" / GSTIN "33AABTC4587F1Z2" · ShieldCheck "GST Verified" / City "Coimbatore" / Owner "Meena S." / Package "Assisted Event Pack" / "2 live · 1 draft" / CircleCheck "Healthy" / CircleCheck "Razorpay Route active" / "12 min ago".
  2. "Kovai Trail Runners" / "Kovai Trail Sports LLP" / Clock "GST submitted — review" / City "Coimbatore" / Owner "Arun P." / "Race-Day Support Pack" / "1 live" / AlertTriangle "Publish gate warnings" / Clock "Payment account pending" / "Today 09:10".
  3. "CODISSIA Fitness Forum" / "CODISSIA Industrial Parks Ltd" / XCircle "GST missing" / Owner "Priya N." / "Starter Pilot" / "0 live · 1 draft" / AlertTriangle "Needs setup" / "Not started".
  4. "Pollachi Runners Collective" / "Individual proprietor" / Info "Unregistered entity" / Owner "Unassigned" / "Design Partner" / "No events yet" / Info "Onboarding" / "N/A".
- Drawer title: "CFR Running Club"
- Drawer summary labels: "Support owner", "Primary organizer", "Finance contact", "Legal entity", "GSTIN", "Billing address", "Pilot package", "Act-on-behalf availability", "Open support tickets", "Latest event".
- Drawer actions: "Act on behalf" (opens A-03 audit reason dialog), "Assign support owner", "Update GST review", "Create support note".
- Audit reason dialog: "Why are you changing organizer billing or access details? This reason will be visible in Audit Log." Textarea placeholder: "Example: Organizer emailed updated GST certificate; verified against invoice profile."
- Empty state: Title "No organizers yet"; body "Create the first customer workspace for a Coimbatore event organizer, then assign a support owner and complete GST/payment setup."; CTA "Add organizer"; secondary "Import from pilot spreadsheet".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps\console\src\mocks\organizers.ts` plus shared local types in `apps\console\src\mocks\types.ts`. Suggested shape: `OrganizerAccount { id, displayName, legalEntityName, entityType, gstin, gstStatus, kycStatus, city, primaryContact, financeContact, supportOwner, packageTier, eventCounts, eventHealth, paymentAccountStatus, latestActivityAt, supportSlaStatus, auditSensitiveActions }`. Include the four sample Coimbatore rows above. Use `src\mocks\utils.ts` `mockMutate(payload, { demo })` for create/update/export outcomes; no `maybeFail()` and no backend calls.

STATES  (deterministic via typed `?demo=` validateSearch enum)
- `default`: populated table, KPI cards, active filters, selected organizer drawer open for "Kovai Trail Runners" showing GST review pending and payment account pending.
- `empty`: no organizers state plus an alternate "No results for current filters" table body with "Clear filters".
- `loading`: skeleton KPI cards/table/drawer.
- `error`: inline recoverable Alert "Organizer fixtures could not load" with Retry.
- `success`: after assigning owner or updating GST; Toast "GST status updated — audit log recorded."
- `permission-denied`: Support/Check-in or Read-only persona tries to export/change RBAC.
Demo URLs: `/admin/organizers?demo=default&as=corral-admin`, `/admin/organizers?demo=empty&as=corral-admin`, `/admin/organizers?demo=permission-denied&as=org-readonly`.

INTERACTIONS / MICROCOPY
- Search filters rows as staff types; show "18 organizers · 4 need action".
- Bulk select reveals action bar: "3 selected" with Assign owner, Export CSV, Create support task; Export CSV requires audit reason and shows "Exports may contain organizer contact information. Use only for support operations."
- Row "Act on behalf" opens modal: "Start act-on-behalf session?" with organizer/event picker and required reason. Confirmation leads to A-03 banner: "Acting on behalf of Kovai Trail Runners · Pollachi Half Marathon 2026 · staff: meena · 00:00 · Exit".
- Permission denied Alert: LockKeyhole + "You need Owner or Admin access to change customer billing/access details."
- Use icons plus labels for every status: ShieldCheck "GST Verified", Clock "Review pending", XCircle "Missing", AlertTriangle "Needs action", CircleCheck "Healthy".
- Shared payment/reconciliation labels appear only for payment account or event billing context: Payment Started, Payment Pending, Paid — Awaiting Webhook, Paid & Confirmed, Settlement Pending, Settled, Failed, Needs Review. Do not use payment labels for GST/entity status.

RESPONSIVE
Desktop-first. At 1024px keep sidebar collapsed to icons and preserve table horizontal scroll with sticky Organizer and Actions columns. At tablet widths, KPI cards become 2x2 and drawer becomes full-height Sheet. No mobile-first version required, but controls must remain keyboard accessible and tap targets at least 44px where clickable.

ACCESSIBILITY
Status is icon + text label + accessible tooltip; never color alone. Table headers sortable with aria-sort. Row action menu keyboard reachable. Drawer focus moves to title and returns to source row on close. Audit-reason dialog is focus-trapped and cannot submit blank. Orange focus ring 2px #ff5a00 with 2px offset. Use text-safe semantic tokens for colored text on light: success-text #047857, warning-text #b45309, danger-text #b91c1c, info-text #0369a1.

TOKENS USED
Light background #f8fafc, card #ffffff, foreground #0f172a, border #e2e8f0, input #cbd5e1, primary #ff5a00 for primary CTA and active nav, brand-orange-strong #c2410c for orange text, sidebar #0f172a. Semantic fills only for large badges/icons; semantic text-safe variants for small labels. Radius 0.5rem. Fonts: Inter body, Oswald for KPI numerals and uppercase section labels.

BUILD CHECKLIST
[ ] route file `apps\console\src\routes\admin.organizers.tsx` under separate `admin.tsx` shell [ ] navy admin sidebar + impersonation banner [ ] table includes organizer, legal entity, GST/KYC, support owner, package, event counts, health, payment account [ ] mock fixture `organizers.ts` typed and wired [ ] row detail drawer [ ] act-on-behalf entry with audit reason [ ] RBAC and permission-denied behavior [ ] status icon + text labels [ ] export action warns about PII/audit reason [ ] realistic Coimbatore organizer data [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed.
```

## A-05 — Global Delivery-Status Monitor

**Requirements & plan comparison**

- Wireframe C requires WhatsApp/SMS/email delivery across all events; implementation plan says WhatsApp is primary, SMS/email are fallbacks, and delivery status webhooks must be tracked in admin.
- Keep **communication delivery status separate from payment/reconciliation status**; do not reuse payment labels for delivery outcomes except when displaying a linked registration’s payment status in a separate contextual column.
- Required state from user: **default · failures**; include retries, fallback triggers, provider-template issues, webhook-pending, and offline/degraded patterns because comms are part of the zero-failure trust loop.
- This is a cross-event monitor, not a campaign composer. Design for staff triage: queue, sent, delivered, read, failed, fallback sent, retry scheduled, paused.
- Sensitive actions such as resending participant confirmations, exporting recipient lists, or acting on behalf require audit reason.
- Theme note: LIGHT is the default for this routine back-office monitoring table because A-08 owns the dark command-center operations view. Drill to A-08 when failures spike.

```text
SCREEN: A-05 — Global Delivery-Status Monitor
APP / SURFACE: console · Admin
ROUTE: /admin/delivery  →  admin.delivery.tsx            THEME: Light
NAV: Admin sidebar item "Delivery" / "Delivery Monitor". Breadcrumb via route staticData: Admin / Delivery Monitor. Links from A-01 event health cards, organizer comms pages, A-07 support tickets, and A-08 `/admin/ops` incidents. Row links open message detail drawer, participant registration context, event communications page, or A-03 `/admin/impersonate` for organizer support; show the persistent impersonation banner when staff changes organizer/event templates.

PURPOSE
Let Corral staff monitor WhatsApp, SMS, and email delivery across all events, identify failing templates/providers, trigger safe retries/fallbacks, and protect the paid pilot promise of ≥98% participant confirmation delivery. Communication delivery must remain visually and semantically separate from payment/reconciliation status.

LAYOUT
Desktop-first 1280px light admin shell with navy sidebar.
- Header: title, delivery health summary, time range Select, primary action "Retry selected failures" (disabled until failures selected), secondary "Export delivery report" requiring audit reason.
- Alert banner when failure rate crosses threshold: AlertTriangle + "WhatsApp confirmations below target for Race Course 10K — fallback SMS running."
- KPI row: Confirmation delivery rate, WhatsApp delivered, Fallback triggered, Failed/needs review, Provider webhook lag. Use icons + labels.
- Tabs: "All messages", "Failures", "Provider health", "Templates". Active tab is deep-linkable by search param.
- Filter bar: channel, delivery status, event, template, provider, failure reason, time range, and "Payment status" as a separate optional filter with divider/helper "Payment status is shown only for context."
- Dense Table of message attempts with sticky header; row click opens detail Drawer.
- Right-side detail Drawer with attempt timeline, provider payload summary without secrets, recipient consent status, retry/fallback actions, linked registration context.
- Failures state: top diagnostic panel, grouped failure buckets, selected rows, retry/fallback confirmation dialog.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Admin sidebar shell, Breadcrumb, Alert, Card, Progress, Tabs, Table/DataTable, Badge, Button, Select, Input, DateRange-style control, Checkbox, DropdownMenu, Tooltip, Sheet/Drawer, Timeline pattern using Card/Separator, Dialog, Toast, Pagination, Skeleton. Icons: MessageCircle, Send, CheckCheck, Eye, Mail, Smartphone, AlertTriangle, XCircle, RefreshCw, Clock, ShieldCheck, IndianRupee, BellRing, Ban, Info, PauseCircle.

CONTENT / COPY  (real Coimbatore content)
- H1: "Global Delivery-Status Monitor"
- Helper: "Track WhatsApp, SMS, and email delivery across all events. Delivery status is separate from payment and settlement."
- Primary CTA: "Retry selected failures"
- Secondary: "Export delivery report"
- Alert failure copy: "Delivery issue detected: WhatsApp template 'registration_confirm_v2' has 42 failures in the last 30 minutes. SMS fallback is queued for consented recipients."
- KPI cards:
  1. "98.6% Confirmation delivery" · CheckCheck + success-text "On target"
  2. "1,284 WhatsApp delivered" · MessageCircle + "Delivered"
  3. "76 Fallback SMS sent" · Smartphone + warning-text "Fallback active"
  4. "18 Failed · needs review" · XCircle + danger-text "Action needed"
  5. "Webhook lag 01:42" · Clock + info-text "Within limit"
- Delivery status label set, always icon + text: Queued (Clock), Sent to Provider (Send), Delivered (CheckCheck), Read (Eye, WhatsApp only), Email Opened (Mail), Bounced (Ban), Failed (XCircle), Retry Scheduled (RefreshCw), Fallback SMS Sent (Smartphone), Fallback Email Sent (Mail), Paused (PauseCircle), Needs Review (AlertTriangle).
- Shared payment/reconciliation label set appears only in a separate contextual column named "Payment status": Payment Started, Payment Pending, Paid — Awaiting Webhook, Paid & Confirmed, Confirmation Sent, Settlement Pending, Settled, Refund Requested, Refund Processing, Refunded, Failed, User Abandoned, Duplicate Payment, Needs Review.
- Table columns: Select; Sent at; Event; Recipient; Template/trigger; Channel; Delivery status; Fallback; Payment status (context); Provider reason; Attempts; Owner; Actions.
- Default row examples:
  1. "10:42" / "Coimbatore Marathon 2026" / "Ananya Iyer · +91 98•••4321" / "Registration confirmation" / WhatsApp / CheckCheck "Delivered" / "No fallback" / ShieldCheck "Paid & Confirmed" / "Meta accepted" / "1" / "Meena".
  2. "10:39" / "Race Course 10K" / "R. Karthik · +91 90•••1182" / "BIB pickup instructions" / WhatsApp / Eye "Read" / "No fallback" / "N/A" / "Read webhook" / "1".
  3. "10:37" / "Pollachi Half Marathon" / "Divya S. · email only" / "Certificate available" / Email / Mail "Email Opened" / "No fallback" / "Paid & Confirmed" / "Resend opened".
  4. "10:35" / "Kovai Trail Run" / "S. Prakash · +91 88•••9011" / "Payment confirmation" / WhatsApp / RefreshCw "Retry Scheduled" / Smartphone "Fallback SMS Sent" / "Paid — Awaiting Webhook" in payment column / "Meta rate limit" / "2/4".
- Drawer title: "Message attempt · Registration confirmation"
- Drawer sections: Recipient & consent, Event context, Attempt timeline, Provider response, Fallback path, Audit trail.
- Drawer timeline example: "10:31 Queued", "10:31 Sent to Provider", "10:32 Failed — template parameter mismatch", "10:33 Retry Scheduled", "10:34 Fallback SMS Sent".
- Retry dialog: "Retry 18 failed messages?" Body: "Retries use the same approved template. SMS fallback will only run for recipients with communication consent. Add an audit reason for bulk resend." Buttons: Cancel, "Retry with audit reason".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps\console\src\mocks\delivery.ts` for message attempts and provider health, plus optional shared registration/payment context from `payments.ts` if it already exists. Suggested shape: `DeliveryAttempt { id, sentAt, eventId, eventName, organizerName, recipientMasked, trigger, templateName, channel, deliveryStatus, fallbackStatus, paymentStatusContext, providerReason, attempts, owner, consent, webhookLagSeconds, timeline, redactedProviderSummary }`. Include provider-health objects for WhatsApp, SMS, email, webhook lag, and failure buckets. Use `mockMutate(payload, { demo })` for retry/export/pause actions.

STATES  (deterministic via typed `?demo=` validateSearch enum)
- `default`: mixed healthy delivery rows with KPI cards on target, Filters set to "Last 24 hours", Drawer open for a delivered WhatsApp confirmation.
- `error`: Failures tab active, alert panel, grouped failure buckets (Template mismatch, Meta rate limit, SMS DLT rejected, Email bounce), table filtered to failures, selected rows, retry dialog visible, and fallback progress card.
- `webhook-pending`: provider webhook lag elevated; rows show Sent to Provider/Retry Scheduled while delivery webhooks are pending; link to A-08 ops.
- `offline`: degraded/manual backup note: "Safe: registrations remain recorded. Delayed: confirmation messages. Owner: Corral Support. Next follow-up: 15 minutes."
- `loading`: skeleton KPIs/table/drawer.
- `permission-denied`: export/pause/retry blocked for insufficient persona.
- `success`: retry/fallback toast success state.
Demo URLs: `/admin/delivery?demo=default&as=corral-admin`, `/admin/delivery?demo=error&tab=failures&as=corral-admin`, `/admin/delivery?demo=webhook-pending&as=corral-admin`, `/admin/delivery?demo=offline&as=corral-admin`.

INTERACTIONS / MICROCOPY
- Clicking a status chip filters by that status and announces result count.
- Selecting failed rows enables "Retry selected failures". If selected rows include non-consented recipients, show inline warning: Ban + "12 recipients cannot receive fallback SMS/email because consent is missing."
- "Pause template" requires Admin role and audit reason: "Why are you pausing this template?"
- "Resend confirmation" requires audit reason when acting on behalf or when bulk count > 1.
- Failure toast: AlertTriangle + "Retry scheduled for 18 messages. Watch A-08 queue health for worker progress."
- Success toast: CheckCheck + "Fallback SMS sent for 76 consented recipients."
- Tooltip on Payment status column: "Payment/reconciliation status is shown for context only; it is not a delivery state."
- Row action "Open in event comms" starts act-on-behalf if staff will change event templates; show A-03 banner.

RESPONSIVE
Desktop-first. At 1024px collapse sidebar to icons, keep table horizontal scroll, sticky Sent at/Event/Status columns. KPI cards wrap to 2 rows. Drawer becomes full-width Sheet on tablet. No mobile design required, but all controls should preserve 44px hit area and keyboard access.

ACCESSIBILITY
Every status uses icon + text label, not color alone. Failure alert uses role="status" or role="alert" depending severity. Tables have sortable headers and aria-sort. Retry dialog is focus-trapped and requires non-empty audit reason. Masked contact data should have screen-reader labels like "phone number ending 4321". Use text-safe status tokens on light; do not use amber/orange/red as small text without safe variants.

TOKENS USED
Light background #f8fafc, card #ffffff, foreground #0f172a, border #e2e8f0, muted-foreground #475569, primary #ff5a00 for primary CTA and active sidebar, brand-orange-strong #c2410c for orange text. Delivery states: success-text #047857 for Delivered/Read, warning-text #b45309 for Retry/Fallback/Paused, danger-text #b91c1c for Failed/Bounced, info-text #0369a1 for Queued/Sent. Sidebar #0f172a. Oswald for delivery-rate numerals; Inter for tables.

BUILD CHECKLIST
[ ] route file `apps\console\src\routes\admin.delivery.tsx` under separate `admin.tsx` shell [ ] communication delivery status visually separate from payment status [ ] WhatsApp/SMS/email rows [ ] delivery label set with icon + text [ ] mock fixture `delivery.ts` typed and wired [ ] retry/fallback/audit-reason flows [ ] consent-aware fallback warning [ ] provider health without secrets/stack traces [ ] degraded/manual backup note [ ] realistic Coimbatore event/recipient data [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed.
```

## A-07 — Support / Ticket View

**Requirements & plan comparison**

- Wireframe C and section F require privacy/data requests to be **support/admin-assisted for MVP**, not participant self-serve; staff must manage identity verification, request type, SLA/due date, status, and resolution notes.
- Implementation plan requires DPDP Act 2023 handling: access/correction/erasure rights, minimal data, guardian consent for minors, audit logs for sensitive actions, least-privilege admin access.
- Include identity-verification steps, SLA countdown, DPDP request type, audit/reason, and resolution evidence.
- Required states: **open · verifying · resolved**; show status timeline and notes for each, plus deterministic loading/error/offline demos.
- Sensitive actions such as PII export, data correction, erasure completion, impersonation, and private CSV link access require audit reason.
- Assumption: Public pages provide support contact affordances, but this admin screen is the operational queue where staff fulfill or reject requests after verification.

```text
SCREEN: A-07 — Support / Ticket View
APP / SURFACE: console · Admin
ROUTE: /admin/support  →  admin.support.tsx            THEME: Light
NAV: Admin sidebar item "Support" / "Support Tickets". Breadcrumb via route staticData: Admin / Support Tickets / Ticket CRL-2407. Links from participant support form, organizer dashboard support notes, A-02 organizer detail, A-05 message failures, A-08 incidents, and A-06 `/admin/audit`. Row/detail actions link to organizer/event context and can start A-03 `/admin/impersonate` with persistent banner and audit reason.

PURPOSE
Give Corral staff one accountable workspace for support tickets and DPDP privacy/data requests, including identity verification, request type, SLA/due date, resolution notes, and audit history. The screen must make clear that privacy requests are staff-assisted, not participant self-serve.

LAYOUT
Desktop-first light admin shell with navy sidebar. Use a split-pane support layout:
- Left/top header: "Support / Ticket View", queue summary, primary Button "Create internal ticket", secondary "Export ticket report" requiring audit reason.
- KPI strip: Open tickets, Privacy requests due, Waiting verification, Resolved this week, SLA risk. Each has icon + text status.
- Tabs: "Open", "Verifying", "Resolved", "All", "Privacy requests". Active tab and selected ticket are deep-linkable by search params.
- Filter/search bar: ticket ID, participant/organizer, event, request type, SLA due, assigned owner, status, priority.
- Main content is two columns: left ticket list/table (about 58% width) and right detail panel/drawer (42% width) for selected ticket. On narrower desktop, detail is a Sheet.
- Detail panel has sticky ticket header, participant/organizer context, identity verification card, request details, SLA card, activity timeline, resolution notes editor, audit reason gate for sensitive actions.
- Include open, verifying, and resolved views in the same route via `?demo=` and tab search params.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Admin sidebar shell, Breadcrumb, Card, Alert, Tabs, Table/List, Badge, Button, Input, Select, Textarea, Checkbox, RadioGroup for verification outcome, Sheet/Drawer, Dialog, Tooltip, Avatar, Separator, Timeline pattern, Toast, Pagination, Skeleton. Icons: LifeBuoy, ShieldCheck, Clock, UserCheck, FileSearch, Trash2, Edit3, Download, AlertTriangle, CheckCircle2, XCircle, LockKeyhole, MessageSquare, Phone, Mail, Baby, ClipboardCheck, RefreshCw.

CONTENT / COPY  (real Coimbatore content)
- H1: "Support / Ticket View"
- Helper: "Resolve organizer support and DPDP data requests with verification, SLA tracking, and audit notes."
- Prominent info Alert: ShieldCheck + "Privacy/data requests are staff-assisted for MVP. Verify identity before access, correction, export, or erasure."
- Primary CTA: "Create internal ticket"
- Queue tabs with counts: "Open 23", "Verifying 6", "Resolved 128", "Privacy requests 9"
- KPI examples:
  1. "23 Open" · LifeBuoy + info-text "Queue active"
  2. "4 Due in 48h" · Clock + warning-text "SLA risk"
  3. "6 Verifying identity" · UserCheck + "Awaiting proof"
  4. "18 Resolved this week" · CheckCircle2 + success-text "Closed"
  5. "1 Minor guardian check" · Baby + warning-text "Guardian required"
- Ticket list columns: Ticket; Requester; Organizer/Event; Type; Verification; SLA due; Status; Owner; Updated.
- Request type labels: General support, Registration correction, Payment/refund help, Delivery issue, DPDP access request, DPDP correction request, DPDP erasure request, Minor guardian request, Organizer billing support.
- Status labels with icons: Open (LifeBuoy), Waiting on requester (Clock), Verifying identity (UserCheck), In progress (RefreshCw), Escalated (AlertTriangle), Resolved (CheckCircle2), Rejected after verification (XCircle).
- Open state row examples:
  1. "CRL-2407" / "Nisha Varadarajan · +91 98•••2244" / "Race Course 10K" / "DPDP access request" / UserCheck "Verification needed" / "Due 18 Jul, 17:00" / LifeBuoy "Open" / "Meena" / "12 min ago".
  2. "CRL-2408" / "Arvind B." / "Coimbatore Marathon 2026" / "Registration correction" / "Verified" / "Due tomorrow" / "In progress" / "Arun".
  3. "CRL-2409" / "Parent: Lakshmi R. for minor Aditya R." / "Kids Fun Run" / "Minor guardian request" / Baby "Guardian proof needed" / "Due in 2 days" / "Waiting on requester".
- Detail panel selected ticket title: "CRL-2407 · DPDP access request"
- Detail context: "Requester: Nisha Varadarajan · phone ending 2244 · email n•••@gmail.com · Event: Race Course 10K · Organizer: CFR Running Club"
- Verification card fields: "Identity method", "Matched registration fields", "Guardian required?", "Verification result", "Verified by", "Verified at", "Evidence note". Buttons: "Mark verified", "Request more proof", "Reject verification".
- SLA card: "Due by 18 Jul 2026, 17:00 IST · 2 days 04h remaining · DPDP support target: acknowledge within 24h, resolve within internal SLA."
- Request details fields: Request type, Data requested, Scope, Legal/privacy basis, Risk notes, Linked records, Consent/guardian status.
- Resolution notes placeholder: "Summarize what was changed/shared/deleted. Do not paste sensitive data into notes."
- Audit reason dialog: "Add audit reason for privacy action" / "Required before exporting, correcting, erasing, or viewing sensitive participant data."
- Resolved state copy: "Resolved · access report sent via signed link expiring in 72 hours" and "Resolution note locked; add follow-up note if needed."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps\console\src\mocks\tickets.ts` for support/privacy tickets. Suggested shape: `SupportTicket { id, requester, requesterMaskedContact, eventName, organizerName, requestType, verificationStatus, guardianRequired, slaDueAt, priority, status, owner, updatedAt, timeline, resolutionNotes, auditEntries, linkedSensitiveActions }`. Include `TicketTimelineItem`, `VerificationEvidenceSummary`, and `PrivacyActionSummary` types in `src\mocks\types.ts`. Never store raw PII/signed URLs in fixtures; use masked contact and "Signed link created · expires 72h" summaries.

STATES  (deterministic via typed `?demo=` validateSearch enum)
- `default`: Open tab, detail panel for a newly created DPDP access request with verification not started and SLA card active.
- `validation-error`: Verifying tab; identity verification card foregrounded, status "Verifying identity", timeline includes outgoing proof request, and the verification dialog shows missing required evidence note. Include guardian proof requirement for a minor variant.
- `success`: Resolved tab; completed verification, resolution notes, audit trail, locked sensitive action summary, follow-up/reopen option, and "Resolved by Priya N. · audit reason recorded."
- `loading`: skeleton queue/table/detail.
- `error`: ticket fixture load failure or signed-link creation failure with retry.
- `permission-denied`: Read-only Viewer sees ticket metadata but not sensitive details.
- `offline`: degraded support mode with note "Safe: tickets are saved locally for demo. Delayed: outbound requester messages. Owner: Corral Support."
Demo URLs: `/admin/support?demo=default&tab=open&ticket=CRL-2407&as=corral-admin`, `/admin/support?demo=validation-error&tab=verifying&ticket=CRL-2409&as=corral-admin`, `/admin/support?demo=success&tab=resolved&ticket=CRL-2399&as=corral-admin`, `/admin/support?demo=offline&as=corral-admin`.

INTERACTIONS / MICROCOPY
- Selecting a ticket updates detail panel without page navigation.
- "Mark verified" opens dialog with RadioGroup: Phone/email match, Government ID checked offline, Organizer-confirmed, Guardian verified. Must add note: "What matched?"
- "Export access report" requires Admin/Support role plus audit reason; toast after success: ShieldCheck + "Access report generated. Signed link expires in 72 hours."
- "Complete erasure" requires double confirmation and audit reason: "This will remove or anonymize eligible participant data where legally allowed. Payment/audit records may be retained as required."
- "Request more proof" sends templated message and logs timeline item: "We need one more detail to verify your request. Do not send full ID numbers over WhatsApp."
- "Reopen ticket" prompts reason and adds timeline note.
- Permission boundary: Read-only Viewer sees ticket metadata but not sensitive details; show LockKeyhole + "Sensitive details hidden by role."
- Act-on-behalf: When staff opens organizer roster or registration to correct data, start A-03 banner: "Acting on behalf of CFR Running Club · Race Course 10K · staff: meena · 03:18 · Exit".

RESPONSIVE
Desktop-first 1280px split-pane. At 1024px, ticket list remains full width and detail opens as right Sheet. Sidebar collapses to icons. Filters wrap into two rows. No mobile version required for staff, but all action buttons are at least 44px high in the detail panel.

ACCESSIBILITY
Status chips use icon + text labels. SLA countdown uses text, not only color. Verification dialogs are focus-trapped and labelled. Ticket list supports keyboard row navigation and aria-selected. Resolution notes Textarea has helper text and character count. Use screen-reader-only descriptions for masked phone/email. Use visible focus ring 2px #ff5a00. Avoid exposing excessive PII in visible table columns.

TOKENS USED
Light theme #f8fafc background, #ffffff cards, #0f172a text, #e2e8f0 borders, #cbd5e1 inputs, #ff5a00 primary, #c2410c text-safe orange, sidebar #0f172a. Semantic status text: success-text #047857 for Resolved/Verified, warning-text #b45309 for SLA risk/guardian pending, danger-text #b91c1c for overdue/rejected, info-text #0369a1 for open/in progress. Radius 0.5rem. Oswald for ticket counts and uppercase SLA labels; Inter for forms and tables.

BUILD CHECKLIST
[ ] route file `apps\console\src\routes\admin.support.tsx` under separate `admin.tsx` shell [ ] privacy/data requests are staff-assisted, not participant self-serve [ ] ticket list includes requester, organizer/event, request type, verification, SLA, status, owner [ ] mock fixture `tickets.ts` typed and wired [ ] open/verifying/resolved states [ ] identity verification card [ ] guardian/minor variant [ ] DPDP access/correction/erasure labels [ ] resolution notes and audit trail [ ] sensitive actions require audit reason [ ] RBAC hides sensitive details [ ] status icon + text labels [ ] no raw PII/signed URLs in table [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed.
```

## A-08 — Operations Monitor / Job Health

**Requirements & plan comparison**

- Wireframe C requires failed jobs, webhook exceptions, queues, PDF/comms/storage health; states required: **healthy · degraded · failed jobs · webhook retrying · queue backlog · PDF/storage errors**.
- Implementation plan’s reliability goal: zero Corral-caused critical failures, async worker isolation, Sentry + uptime/heartbeat for race-day visibility; success metric: 0 critical failures and ≥98% delivery.
- Include incident ownership, manual backup promise, worker queues, retry visibility, webhook exception separation, PDF generation, storage/upload health, and danger/warning/success behavior on dark surfaces.
- Use DARK command-center kit: `background #0b1120`, `card #0f172a`, bright danger/warning/success/info, dark-native controls, and `color-scheme: dark`; statuses must pop on #0b1120 with icon + text.
- Keep payment webhook/reconciliation pending separate from communications delivery failures, but show correlated incidents where useful.
- Sensitive actions such as replaying webhooks, retrying bulk jobs, downloading logs, viewing payload details, or opening act-on-behalf require audit reason.
- Assumption: This is an internal Corral staff operations screen, not organizer-facing. It may be used during race-day support and should be high-density but glare-reduced.

```text
SCREEN: A-08 — Operations Monitor / Job Health
APP / SURFACE: console · Admin
ROUTE: /admin/ops  →  admin.ops.tsx            THEME: Dark
NAV: Admin sidebar item "Ops" / "Operations" in the separate `admin.tsx` shell. Breadcrumb via route staticData: Admin / Operations Monitor. Drilldowns link to job detail drawer, webhook detail, A-05 `/admin/delivery` filtered by incident, A-07 `/admin/support` ticket, A-06 `/admin/audit`, and A-03 `/admin/impersonate` when staff must fix organizer/event data. If acting on behalf, keep the A-03 banner visible above the dark command center.

PURPOSE
Provide a race-day command-center view of Corral operational health across workers, webhooks, queues, PDF generation, communications, storage/uploads, and provider dependencies. The screen exists to protect the pilot target: 5 paid Coimbatore events with zero Corral-caused critical failures.

LAYOUT
Desktop-first 1280px DARK command-center shell. Set root/class to dark and explicitly apply `color-scheme: dark`; all controls must be dark-native (dark selects, inputs, dialogs, scrollbars, focus rings). Background #0b1120, cards #0f172a, border #1e293b, foreground #f1f5f9, muted #94a3b8, inputs #334155. Navy sidebar remains #0b1120/#0f172a with orange active item #ff5a00.
- Optional persistent A-03 impersonation banner if active: high-contrast warning strip at top, cannot dismiss, includes organizer/event, staff identity, elapsed time, and "Exit act-on-behalf".
- Command header with live clock, environment badge "Pilot · Production", last heartbeat, and primary action "Create incident note". Secondary actions: "Refresh now", "Open runbook", "Export incident report" (audit reason).
- Health summary grid: Overall status, Critical incidents, Queue latency, Webhook retries, PDF success, Storage health, Delivery worker health.
- Incident Alert panel when degraded/failed: concise "what is safe / what is delayed / who owns follow-up / manual backup path".
- Tabs: "Overview", "Failed jobs", "Webhooks", "Queues", "PDF & Storage", "Providers". Active tab is deep-linkable by search param.
- Main grid: left large incident table, right live queue/provider health cards and runbook checklist.
- Job detail Drawer with job timeline, safe retry/replay actions, redacted payload summary, owner, audit trail, and linked support/customer context.
- Provide demo views for healthy, degraded, failed jobs, webhook retrying, queue backlog, and PDF/storage errors in the same route via `?demo=` plus tab/filter params.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Dark admin sidebar shell, Breadcrumb, Alert, Card, Badge, Button, Select, Input, Tabs, Table/DataTable, Progress, Sheet/Drawer, Dialog, Tooltip, Toast, Separator, Skeleton, DropdownMenu, Command-style search. Icons: Activity, HeartPulse, ServerCog, AlertTriangle, XOctagon, CheckCircle2, RefreshCw, Clock, QueueList, Webhook, FileText, Database, UploadCloud, MessageCircle, IndianRupee, HardDrive, ShieldAlert, Wrench, ClipboardList, RadioTower.

CONTENT / COPY  (real Coimbatore content)
- H1: "Operations Monitor / Job Health"
- Header helper: "Race-day reliability view for workers, webhooks, queues, PDF/comms, and storage."
- Live header: "Last heartbeat 12s ago · Prod · Coimbatore pilots · 14:42:08 IST"
- Primary CTA: "Create incident note"
- Secondary CTA: "Open runbook"
- Critical promise badge: ShieldAlert + "Zero-critical-failure pilot target"
- Overall health labels: Healthy (CheckCircle2 + "Healthy"), Degraded (AlertTriangle + "Degraded"), Failed jobs (XOctagon + "Failed jobs"), Webhook retrying (RefreshCw + "Webhook retrying"), Queue backlog (QueueList + "Queue backlog"), PDF/storage errors (FileText/HardDrive + "PDF/storage errors").
- Health summary card examples in dark:
  1. "Overall" · HeartPulse + success "Healthy" or warning "Degraded" depending state
  2. "Critical incidents" · "0" success label "None active"
  3. "Comms queue latency" · "00:38" success or "08:24" warning
  4. "Webhook retries" · "12 retrying" warning label "Razorpay + WhatsApp"
  5. "PDF success" · "99.4%" success or danger "PDF errors"
  6. "Storage uploads" · "R2 OK" success or danger "Upload errors"
- Incident table columns: Severity; Status; Component; Event/organizer; Symptom; Impact; Queue/job ID; Attempts; Owner; Updated; Actions.
- Healthy row example: "Info" / CheckCircle2 "Healthy" / "Worker: comms" / "All events" / "Processing normally" / "No participant impact" / "comms:*" / "0 retries" / "Ops" / "12s ago".
- Degraded/failed row examples:
  1. Critical / XOctagon "Failed jobs" / "PDF worker" / "Coimbatore Marathon 2026 · CFR Running Club" / "Certificate PDF render failed for 23 records" / "Certificates delayed; results page safe" / "pdf:cert:94821" / "3/5" / "Arun" / "2 min ago".
  2. Warning / RefreshCw "Webhook retrying" / "Razorpay webhook" / "Race Course 10K" / "Paid — Awaiting Webhook records not confirmed yet" / "Payment confirmation delayed; registration saved" / "webhook:rzp:7720" / "2/8" / "Meena".
  3. Warning / QueueList "Queue backlog" / "Comms queue" / "Pollachi Half Marathon" / "1,240 WhatsApp messages queued" / "Delivery delayed; fallback not needed yet" / "queue:comms" / "latency 08:24" / "Priya".
  4. Critical / HardDrive "Storage upload errors" / "R2 private CSV upload" / "Kovai Trail Run" / "Timing CSV upload failing" / "Result import delayed; manual backup available" / "storage:r2:csv" / "4/5" / "Arun".
- Manual backup Alert: "Safe: registrations and payments are stored. Delayed: certificates and outbound confirmations. Owner: Ops on-call Arun. Next check: 5 minutes. Manual backup: export roster from latest DB snapshot and send approved WhatsApp broadcast once queue recovers."
- Drawer title examples: "Job pdf:cert:94821 · Certificate PDF render", "Webhook rzp:7720 · Payment confirmation retrying", "Queue comms · WhatsApp backlog".
- Drawer sections: Summary, Impact, Timeline, Redacted payload, Retry policy, Manual fallback, Linked tickets, Audit trail.
- Action buttons: "Retry job", "Replay webhook", "Pause queue", "Open A-05 delivery failures", "Create support ticket", "Mark manual backup started". Dangerous/bulk actions require audit reason.

MOCK DATA  (fixture module + shape + sample rows)
Use `apps\console\src\mocks\ops.ts` for health summaries, incidents, queues, providers, webhooks, jobs, PDF/storage records, and runbook steps. Optional split modules are allowed if imported by `ops.ts`, e.g. `jobs.ts` for job fixtures, but the route should read through `ops.ts`. Suggested shapes: `OpsIncident { id, severity, status, component, eventName, organizerName, symptom, impact, queueOrJobId, attempts, owner, updatedAt, linkedTicketId, linkedAuditIds, redactedPayloadSummary }`, `QueueHealth { name, depth, latencySeconds, workerStatus }`, `ProviderHealth { provider, status, webhookLagSeconds, errorClass }`, `RunbookStep { label, status, owner }`. Never expose stack traces, provider secrets, private hostnames, raw signed URLs, or full PII.

STATES  (deterministic via typed `?demo=` validateSearch enum)
- `default`: healthy command center; all cards success, incident table shows no active incidents, runbook checklist green, heartbeat recent, empty active incident list with "No active incidents".
- `offline`: degraded mode; warning banner with manual backup promise, heartbeat stale, one or more components warning, incident table populated, no full outage.
- `error`: failed jobs/PDF-storage error mode; Failed Jobs or PDF & Storage tab active, critical PDF/comms jobs listed, retry dialog open with audit reason.
- `webhook-pending`: Webhooks tab active, Razorpay and WhatsApp webhook retry cards, payment labels "Paid — Awaiting Webhook" and "Needs Review" clearly separate from delivery labels.
- `loading`: command-center skeletons for cards/table/drawer.
- `permission-denied`: payload/log download or pause queue blocked by RBAC.
- `success`: manual backup started or job retry scheduled banner/toast.
Use tab/filter params with `?demo=` to show queue backlog and PDF/storage variants: `tab=queues&component=comms`, `tab=pdf-storage&component=storage`.
Demo URLs: `/admin/ops?demo=default&as=corral-admin`, `/admin/ops?demo=offline&tab=overview&as=corral-admin`, `/admin/ops?demo=webhook-pending&tab=webhooks&as=corral-admin`, `/admin/ops?demo=error&tab=pdf-storage&component=storage&as=corral-admin`.

INTERACTIONS / MICROCOPY
- "Refresh now" updates heartbeat and shows Toast: Activity + "Operations snapshot refreshed."
- Clicking a health card filters the incident table and opens the relevant tab.
- "Retry job" dialog: "Retry certificate PDF job?" Body: "This may generate participant-visible files. Add an audit reason. Do not retry if template data is invalid." Buttons: Cancel, Retry job.
- "Replay webhook" dialog: "Replay Razorpay webhook?" Body: "Payment confirmation only changes after signature verification. Add audit reason." Buttons: Cancel, Replay webhook.
- "Pause queue" requires Owner/Admin role and audit reason; show danger styling and consequence.
- "Mark manual backup started" asks owner and note, then pins a banner: "Manual backup active · Owner Arun · Started 14:45 · Audit recorded."
- If staff opens organizer/event to fix data, show A-03 banner above dark shell: "Acting on behalf of CFR Running Club · Coimbatore Marathon 2026 · staff: meena · 04:12 · Exit".
- Never display stack traces, secrets, private hostnames, raw signed URLs, provider tokens, or full PII. Use "View redacted details" and "Request elevated access" patterns.

RESPONSIVE
Desktop-first command center at 1280px and 1440px. At 1024px, sidebar collapses, health summary becomes 3 columns, right runbook cards stack below incident table, drawers become full-height Sheets. Use tabular-nums for live clocks and metrics to prevent jitter. No mobile design required.

ACCESSIBILITY
Dark contrast must meet AA. All danger/warning/success states use icon + text label and readable color on #0b1120. Live regions for critical alerts should be announced politely unless critical, then assertive. Tables keyboard sortable. Dialogs focus-trapped with visible #ff5a00 ring. Do not rely on glow/color alone; include labels like "Critical", "Warning", "Healthy". Provide reduced-motion option for pulsing indicators.

TOKENS USED
Approved dark command-center tokens only: background #0b1120, card #0f172a, foreground #f1f5f9, muted-foreground #94a3b8, border #1e293b, input #334155, primary #ff5a00, danger #ff4d4d, warning #fbbf24, success #34d399, info #38bdf8. These bright semantic variants are the dark-theme readable colors and are used for BOTH status fills and small status text on #0b1120 — do not introduce additional off-palette tints. Sidebar #0b1120/#0f172a. Use `color-scheme: dark` so selects/inputs are dark-native. Radius 0.5rem. Oswald for clocks, queue depths, and uppercase incident labels; Inter for dense tables.

BUILD CHECKLIST
[ ] route file `apps\console\src\routes\admin.ops.tsx` under separate `admin.tsx` shell [ ] dark command-center shell with `color-scheme: dark` [ ] dark-native inputs/selects/dialogs/scrollbars [ ] danger/warning/success pop on #0b1120 [ ] healthy/degraded/failed jobs/webhook retrying/queue backlog/PDF-storage states mapped to deterministic `?demo=` demos [ ] queue, webhook, PDF, comms, storage, provider health visible [ ] mock fixture `ops.ts` (and optional `jobs.ts`) typed and wired [ ] manual backup promise says safe/delayed/owner/follow-up [ ] zero-critical-failure target visible [ ] payment webhook labels separate from delivery labels [ ] retry/replay/pause actions require audit reason [ ] no secrets/stack traces/private hostnames/raw URLs [ ] A-03 impersonation banner works on dark [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed.
```
