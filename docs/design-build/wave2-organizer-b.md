# Wave 2 — Organizer Build Specs (Roles · Comms · Finance · Trust Tools)

These Wave-2 organizer screens are now **in-app frontend build specs** for `apps\console`, not external design prompts. Build one screen per TanStack route file under the `_authenticated` organizer shell, with **no backend calls** and typed fixtures in `apps\console\src\mocks\`. Follow `docs\design-build\navigation-and-routes.md` for finalized navigation, route hierarchy, breadcrumbs, and sidebar placement.

Surface for all screens: **console · Organizer desktop 1280px · Light theme + ALWAYS-NAVY sidebar**. O-35 also requires a dedicated **print-safe** view. Sensitive actions such as role changes, refunds, PII/health exports, manual payment overrides, and bulk destructive actions require an audit reason. All demo states must be deterministic via `?demo=` using the canonical enum: `default | empty | loading | error | validation-error | success | permission-denied | offline | webhook-pending`.

---

## O-03A — Team Members & Roles (RBAC)

**Requirements & plan comparison**
- **Roles (exact set):** Owner, Admin, Event Editor, Finance, Support/Check-in, Read-only Viewer. Show a per-role permission matrix so organizers understand least-privilege access.
- **Audit-reason gating:** role changes, removals, and sensitive actions unlocked by roles require an audit reason recorded in audit history.
- **States required:** invite sent, role change requiring audit reason, removed, default, empty, permission-denied, and pending-invite expiry.
- **DPDP:** team members are staff PII. Show minimal contact data, a privacy note, and clear audit-log language.
- **Assumptions:** invites are email-based; Owner is unique and cannot be removed/downgraded by others; transferring Owner is a separate guarded action. Roles are managed from an org-level Team screen with an event selector for event-scoped permissions.

```text
SCREEN: O-03A — Team Members & Roles (RBAC)
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /settings/team  →  _authenticated.settings.team.tsx            THEME: Light
NAV: Sidebar Settings/Team → Team & Roles. Breadcrumb: Settings ▸ Team. Event selector scopes role assignments to "CODISSIA Run 2025 — 10K/5K". Row opens a right-side member Sheet. "Invite member" opens a Dialog. Links out to Admin Audit Log when available. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Invite staff, assign RBAC roles, and enforce least-privilege event access. Every role change or removal captures an audit reason so sensitive permission changes are traceable.

LAYOUT
Desktop page inside the organizer shell. Header with title, helper, event selector, and primary CTA "Invite member". Below it: members Table with sticky header, search, role/status filter chips, and row actions. A collapsible "What each role can do" permission-matrix Card sits above the table on desktop and becomes an accordion on tablet. Row click opens a right-side Sheet with member details, role selector, audit-reason field, and recent audit snippets. Pending invites appear as rows and as a filter chip.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Sidebar shell, Breadcrumb, Card, Button, Input, Select, Badge, Table, DropdownMenu, Tooltip, Sheet, Dialog, AlertDialog, Textarea, Avatar, Toast, Skeleton.
- Table columns: Member (Avatar + name + email), Role, Status (Active / Invite sent / Expired / Removed), Last active, Added by, Actions.
- Invite Dialog: email, optional name, role Select, role helper text, optional message, Send invite Button.
- Role-change flow: role Select reveals required "Reason for change" Textarea; Save role remains disabled until a reason is entered.
- Remove flow: destructive AlertDialog with required audit-reason Textarea.
- Permission matrix: role columns and capability rows with check/lock icons plus "Allowed" / "Not allowed" text.
- Filter chips: All · Owner · Admin · Event Editor · Finance · Support/Check-in · Read-only Viewer · Pending.

CONTENT / COPY  (real Coimbatore content)
- H1: "Team & Roles"
- Subtitle: "Control who can manage this event and what they can do."
- Roles + scope: Owner — full control incl. billing & transferring ownership; Admin — manage event, roster, comms, results; Event Editor — setup, roster, comms; Finance — payments, settlement, GST exports, refunds; Support/Check-in — roster/check-in/approved messages; Read-only Viewer — reports only.
- Audit reason placeholder: "Why are you changing this role? (recorded in the audit log)"
- Invite helper: "We'll email an invite to join CODISSIA Run 2025. Invites expire in 7 days."
- Permission-denied copy: "Only an Owner or Admin can manage team roles."
- DPDP note: "Team member contact details are used only to manage event access. Role and permission changes are recorded in the audit log."
- Sample members: Priya Raman (Owner), Arjun Mehta (Admin), Nandhini S (Finance), Karthik R (Support/Check-in), Meena S (Read-only Viewer), Harish K (Invite sent).

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/organizers.ts` (team domain) exporting typed `mockTeamMembers`, `mockRoleMatrix`, `mockTeamInvites`, and helper selectors. Shape: `{ id, name, email, phone?, avatarInitials, role, status, eventScopes, lastActiveAt, addedBy, inviteExpiresAt?, auditTrail: { at, actor, action, reason }[] }`. Include Coimbatore emails/domains, event id `codissia-run-2025`, and role-matrix capabilities for event setup, roster, comms, finance, refunds, exports, permissions, and team management. No backend/auth calls; persona is mocked via `?as=org-owner|org-staff|org-readonly`.

STATES  (cover via `?demo=`)
- default — populated table with mixed roles and role matrix visible.
- empty — only Owner exists; empty Card "Invite your first teammate".
- loading — skeleton table and disabled Invite button.
- validation-error — Invite Dialog open with invalid email or missing audit reason on role change.
- success — invite sent or role saved Toast; pending row appears.
- permission-denied — non-Owner/Admin sees read-only table and lock banner.
- offline — degraded banner: "Role changes are disabled in offline demo mode."
- error — failed fake mutation with retry.
Demo URLs: `/settings/team?demo=default`, `/settings/team?demo=empty`, `/settings/team?demo=permission-denied&as=org-readonly`.

INTERACTIONS / MICROCOPY
- Changing role to Finance/Admin shows: "This role can issue refunds and export PII — these actions also require an audit reason."
- Save role disabled until audit reason is present: "Add a reason to continue."
- Remove confirm: "Remove Priya from this event? They'll lose access immediately." + required reason.
- Resend invite Toast: "Invite re-sent to arjun@coimbatorerunners.in".
- Owner row actions locked with Tooltip: "Transfer ownership from Account settings."

RESPONSIVE
Desktop-first. At tablet widths, collapse sidebar to icons, permission matrix to accordion, and Sheet to full width. Hide Last active / Added by columns first while preserving Member, Role, Status, Actions.

ACCESSIBILITY
Role/status Badge uses color + icon + text. Table rows and actions are keyboard-focusable with visible 2px orange focus ring. Textarea has explicit label and error text. Sheet/Dialog/AlertDialog are focus-trapped and return focus to source. Permission matrix uses check/lock icons plus text, never color alone.

TOKENS USED
Navy sidebar #0f172a; orange #ff5a00 for Invite/Save and active nav; success-text for Active, warning-text for Pending invite, danger-text for Removed/destructive, info-text for tips; light background #f8fafc, card #ffffff, border #e2e8f0; Inter body, Oswald/tabular nums for counts.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] mock team fixtures wired   [ ] all 6 roles and permission matrix present   [ ] invite/pending/expired flow   [ ] role change requires audit reason   [ ] removal requires audit reason   [ ] DPDP note   [ ] status/role icon + text labels   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```

---

## O-22 — Template Editor (trigger-based WhatsApp / SMS / email)

**Requirements & plan comparison**
- **Trigger-based templates:** support Meta WhatsApp approved template messages plus SMS/email fallback, with variables, preview, and lifecycle states.
- **Triggers:** registration confirmation, payment received/pending, race-day instructions, results published, certificate ready, and manual/broadcast.
- **Variables:** `{{name}}`, `{{bib}}`, `{{event_name}}`, `{{event_date}}`, `{{category}}`, `{{amount}}`, `{{venue}}`, `{{result_link}}`, `{{certificate_link}}`.
- **Lifecycle:** draft → pending approval → approved; rejected sub-state with reason; editing an approved WhatsApp template forks a new draft version.
- **DPDP / consent:** sending consent is enforced in O-21; this screen manages template content only. English-only MVP. Do not add participant-fee variables for organizer-absorbed convenience fees.

```text
SCREEN: O-22 — Template Editor (trigger-based WhatsApp / SMS / email)
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/comms/templates  →  _authenticated.events.$eventId.comms.templates.tsx            THEME: Light
NAV: Sidebar Comms → Templates. Entry from O-20 Comms Dashboard "New template" / template card edit. Breadcrumb: Event ▸ Communications ▸ Templates. Links back to `/events/$eventId/comms` and forward to `/events/$eventId/comms/send`. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Create and edit reusable, trigger-based message templates (WhatsApp-first, SMS/email fallback) with variable tokens, deterministic preview data, and lifecycle management through draft, pending approval, approved, and rejected states.

LAYOUT
Desktop two-column layout. Left column is the editor: template name, trigger Select, channel Tabs, subject field for email, body Textarea/rich editor, token palette, and policy/length guidance. Right column is a live preview Card with WhatsApp phone mockup/SMS/email variants and a status panel showing lifecycle, version, timestamps, and actions. Sticky action bar: Save draft · Submit for approval · Edit as new version. Keep all content in-app; no provider calls.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Breadcrumb, Tabs, Card, Input, Select, Textarea, Button, Badge, Tooltip, Alert, Toast, Skeleton, Dialog, Separator.
- Variable palette as inline Buttons/Chips inserting tokens at cursor.
- Character/segment counter for SMS; WhatsApp category note (utility/marketing); email subject/header/footer fields.
- Live preview resolving sample values: `{{name}}=Karthik`, `{{bib}}=1042`, `{{event_name}}=CODISSIA Run`, `{{event_date}}=14 Dec 2025`, `{{venue}}=Race Course Road`.
- Status panel: Badge (Draft / Pending approval / Approved / Rejected), lifecycle stepper, version metadata, action buttons.
- Validation Alert for unknown tokens, empty required fields, or WhatsApp policy issue.

CONTENT / COPY  (real Coimbatore content)
- H1: "Templates"
- Helper: "Create approved WhatsApp templates and SMS/email fallbacks for CODISSIA Run 2025."
- Triggers: Registration confirmation · Payment received · Payment pending · Race-day instructions · Results published · Certificate ready · Manual / broadcast.
- Variable chips: Name · BIB · Event name · Event date · Category · Amount · Venue · Result link · Cert link.
- Sample WhatsApp body: "Hi {{name}}, you're confirmed for {{event_name}} on {{event_date}}! Your BIB is {{bib}} ({{category}}). Reporting at {{venue}}. — Team Corral"
- WhatsApp note: "WhatsApp templates need Meta approval before they can be sent. English-only for now."
- SMS note: "1 segment = 160 chars. This message uses 2 segments."
- Approved copy: "Approved — locked. Edit to create a new version (re-approval required)."
- Rejected copy: "Meta rejected this template: '{reason}'. Fix and resubmit."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/templates.ts` exporting typed `mockMessageTemplates`, `mockTemplateTriggers`, `mockTemplateVariables`, and `resolveTemplatePreview(template, sampleRegistration)`. Shape: `{ id, eventId, name, trigger, channel, status, version, locale: 'en', category?, subject?, body, variables, lastEditedBy, submittedAt?, approvedAt?, rejectedReason? }`. Include statuses Draft, Pending approval, Approved, Rejected and sample Coimbatore runner/venue data. `mockMutate` returns deterministic save/submit outcomes from `?demo=` only.

STATES  (cover via `?demo=`)
- default — editable draft with live preview and valid tokens.
- loading — editor and preview skeleton.
- validation-error — unknown `{{naem}}` token and disabled submit.
- success — saved draft or submitted-for-approval Toast.
- webhook-pending — pending Meta approval, read-only body, lifecycle stepper at pending.
- permission-denied — readonly viewer cannot edit/submit.
- error — rejected template with provider reason and resubmit path.
- offline — banner: "Provider approval is simulated; no network calls."
Demo URLs: `/events/codissia-run-2025/comms/templates?demo=default`, `/events/codissia-run-2025/comms/templates?demo=webhook-pending`, `/events/codissia-run-2025/comms/templates?demo=validation-error`.

INTERACTIONS / MICROCOPY
- Clicking a variable chip inserts the token at cursor and highlights it in preview.
- Submit confirm: "Submit this WhatsApp template to Meta? You can't send until approved."
- Switching to SMS hides WhatsApp-only fields and shows segment counter.
- Unknown token warning: "‘{{naem}}’ isn't a known variable."
- Approved template action: "Edit as new version" creates a draft vNext in local mock state.

RESPONSIVE
Desktop-first. At tablet widths, preview stacks below editor and sticky action bar remains pinned. Token palette wraps with 44px hit targets.

ACCESSIBILITY
Lifecycle status is icon + Badge text. Variable buttons announce inserted token. Preview has a text alternative containing the resolved message. Editor/palette are keyboard-operable. Focus ring visible on tabs, buttons, text fields. Error messages are connected to fields with `aria-describedby`.

TOKENS USED
WhatsApp green #25d366 for preview accent only; orange #ff5a00 for Save/Submit; warning-text for pending, success-text for approved, danger-text for rejected/validation, info-text for policy notes; navy sidebar; light cards.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] typed template fixtures wired   [ ] trigger select   [ ] channel tabs (WA/SMS/email)   [ ] variable token palette + insertion   [ ] live preview resolves variables   [ ] draft/pending/approved/rejected lifecycle   [ ] validation errors   [ ] status icon + text labels   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```

---

## O-32 — GST Invoice / Report Export

**Requirements & plan comparison**
- **Purpose:** export GST-compliant invoices and payment reports. Support GST-registered organizers and non-GST clubs/trusts/societies.
- **GST invoice fields:** invoice number/date, organizer legal name + GSTIN, Corral GSTIN/PAN, place of supply (Tamil Nadu / 33), buyer/participant details, HSN/SAC, taxable value, CGST+SGST or IGST, total, and organizer-absorbed convenience-fee note.
- **Audit-reason gating:** PII/payment exports require audit reason and Finance/Admin/Owner permissions.
- **States required:** default, exporting, empty, non-GST variant, permission note, validation-error.
- **Shared payment labels:** use exactly the 14 payment/reconciliation labels where payment status is shown: Payment Started · Payment Pending · Paid — Awaiting Webhook · Paid & Confirmed · Confirmation Sent · Settlement Pending · Settled · Refund Requested · Refund Processing · Refunded · Failed · User Abandoned · Duplicate Payment · Needs Review.

```text
SCREEN: O-32 — GST Invoice / Report Export
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/payments/exports  →  _authenticated.events.$eventId.payments.exports.tsx            THEME: Light
NAV: Sidebar Payments → GST & Reports. Breadcrumb: Event ▸ Payments ▸ GST & Reports. Links to `/events/$eventId/payments` for live transaction status and `/events/$eventId/payments/refunds` for refunds. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Export GST-compliant invoices and underlying payment reports for an event, scoped by date range, while making PII export permission and audit reasons explicit.

LAYOUT
Desktop header with event name, entity-type Badge (GST-registered / Non-GST club-trust), and helper copy. Summary strip of totals: collected, taxable value, CGST, SGST/IGST, refunds, net. Main grid: export config Card on the left (report type, date range, format, scope filters, audit reason, Export CTA), preview Table below/full width, and GST invoice preview Card on the right for GST entities. Non-GST variant replaces invoice preview with simplified payment report explanation.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Breadcrumb, Card, Button, Select, Input/date-range control, Badge, Table, Alert, Textarea, Progress, Skeleton, Toast, Tooltip, Separator.
- Entity Badge: "GST-registered · GSTIN 33ABCDE1234F1Z5" or "Non-GST (club/trust)".
- Export config: Report type (Tax invoices / Payment + GST report / Consolidated invoice), Date range, Format (CSV / PDF), Status/category chips, required audit-reason Textarea.
- Summary Cards: Total collected, Taxable value, CGST, SGST/IGST, Refunds, Net settled.
- Preview Table: invoice no., date, buyer/participant, category, taxable value, CGST, SGST/IGST, total, payment status.
- Printable GST invoice preview with statutory fields.

CONTENT / COPY  (real Coimbatore content)
- H1: "GST Invoice / Report Export"
- Subtitle: "Export GST invoices and the payment report for CODISSIA Run 2025."
- Invoice fields shown: "Invoice No · Date · Organizer (legal name + GSTIN) · Corral (GSTIN/PAN) · Place of supply: Tamil Nadu (33) · Buyer · HSN/SAC · Taxable value · CGST 9% · SGST 9% · Total".
- Convenience-fee note: "Convenience fee is absorbed by the organizer — participants are not charged a separate fee."
- Non-GST note: "This organizer runs under a club/trust without GST registration — only a payment report (no tax invoice) is available. GST applies to Corral's platform fee separately."
- Audit placeholder: "Why are you exporting this report? (contains participant PII — recorded in the audit log)"
- Inter-state note: "Buyer outside Tamil Nadu → IGST 18% instead of CGST+SGST."
- Row examples: INV-COD-2025-1042 · Meena Krishnan · 10K · ₹1,200 · Paid & Confirmed; INV-COD-2025-1188 · Raghav S · 21K · ₹2,100 · Settlement Pending; INV-COD-2025-1203 · Divya P · 5K · ₹750 · Refunded.

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/payments.ts` exporting typed `mockPaymentRows`, `mockGstEntityProfiles`, `mockGstInvoices`, `mockPaymentSummary`, and `paymentStatusLabels`. Shape: `{ id, eventId, invoiceNo, date, participantName, category, buyerState, taxableValue, cgst, sgst, igst, total, status, refundAmount?, entityProfileId }`. Include GST and non-GST entity profiles, Tamil Nadu and inter-state rows, and all 14 payment labels for filters. Export action uses `mockMutate(payload,{ demo })` and never generates real files from a backend.

STATES  (cover via `?demo=`)
- default — GST entity, populated config, preview rows, export disabled until audit reason.
- loading — summary/table skeleton.
- success — export complete Toast with `gst-report-codissia-run-2025.csv`.
- empty — no transactions in range; adjust-range CTA.
- validation-error — missing audit reason or invalid date range.
- permission-denied — non-Finance/Admin/Owner sees readonly report and disabled export.
- webhook-pending — reconciliation pending banner for rows Paid — Awaiting Webhook / Settlement Pending.
- offline — banner: "Export is mocked locally; no backend download."
Demo URLs: `/events/codissia-run-2025/payments/exports?demo=default`, `/events/codissia-run-2025/payments/exports?demo=empty`, `/events/codissia-run-2025/payments/exports?demo=permission-denied&as=org-readonly`.

INTERACTIONS / MICROCOPY
- Export disabled until audit reason entered: "Add a reason to export PII."
- Completion Toast: "Export ready — gst-report-codissia-run-2025.csv".
- Changing date range refreshes summary and preview; large ranges show count warning.
- Tax split switches CGST+SGST ↔ IGST based on buyer place of supply.
- Tooltip on status filter: "Use the shared payment/reconciliation labels across Corral."

RESPONSIVE
Desktop-first. Invoice preview stacks under config on tablet. Preview Table scrolls horizontally with sticky first column and Actions column. Keep audit Textarea visible before Export on all widths.

ACCESSIBILITY
Status labels are icon + text. Preview table supports keyboard row navigation and sortable headers. Tax figures use tabular nums and right alignment. Audit field has label, error, and `aria-describedby`. Export progress has a text equivalent. Currency values are screen-reader friendly.

TOKENS USED
Orange primary Export; info-text for processing/reconciliation, success-text for Paid/Settled rows, warning-text for pending, danger-text for failed/refunded/validation; navy sidebar; light background; tabular numerals for ₹ and tax values.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] payment/GST fixtures wired   [ ] GST statutory fields (GSTIN, HSN/SAC, place of supply, CGST/SGST/IGST)   [ ] GST vs non-GST branch   [ ] audit reason required for PII export   [ ] shared 14 payment labels in rows/filters   [ ] default/exporting/empty/permission states   [ ] convenience-fee absorbed note   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```

---

## O-33 — Refunds (RBI PA-PG limits)

**Requirements & plan comparison**
- **Purpose:** initiate and track refunds within RBI PA-PG constraints while making organizer/Corral responsibility explicit.
- **RBI PA-PG constraints to surface:** refund to original payment instrument only, cannot exceed captured amount, only on confirmed/settled payments, may be blocked before settlement window, and processed by licensed PA/PG; Corral does not hold funds.
- **Audit-reason gating:** every refund and bulk refund requires an audit reason.
- **Shared labels:** refund lifecycle uses the 14 payment/reconciliation labels, especially Refund Requested → Refund Processing → Refunded, with Failed and Needs Review branches.
- **States required:** requested, processing, refunded, failed, partial-refund, blocked, empty, permission-denied.

```text
SCREEN: O-33 — Refunds (RBI PA-PG limits)
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/payments/refunds  →  _authenticated.events.$eventId.payments.refunds.tsx            THEME: Light
NAV: Sidebar Payments → Refunds. Breadcrumb: Event ▸ Payments ▸ Refunds. Also reachable from a row action in `/events/$eventId/payments`; links to `/events/$eventId/payments/exports` for GST impact. Row opens refund Sheet. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Initiate and track full or partial refunds within RBI PA-PG rules, capturing audit reasons and clearly showing status progression, blocked reasons, and payment-partner processing.

LAYOUT
Header with refund summary Cards for Requested, Processing, Refunded, Failed amounts/counts. RBI constraints Alert below header. Main content is a transactions Table filtered to refund-eligible and refund-in-progress rows using the shared status vocabulary. Row opens a right-side Sheet with order summary, masked original method, refundable amount, reason category, audit reason, RBI checklist, and initiate/track actions. Bulk select reveals action bar with shared audit-reason prompt.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Breadcrumb, Card, Alert, Table, Badge, Checkbox, Button, Input, RadioGroup, Select, Textarea, Sheet, AlertDialog, Tooltip, Toast, Skeleton, Progress.
- Stat Cards: Refund Requested · Refund Processing · Refunded · Failed.
- RBI Alert: "Refunds go back to the original payment method via our licensed payment partner. Corral never holds your funds."
- Table columns: Participant, BIB, Order ID, Amount paid, Method, Payment status, Refund status, Requested by, Date, Actions.
- Refund Sheet: original method masked, refundable amount field (≤ captured), Full/Partial RadioGroup, reason category Select, audit-reason Textarea, constraint checklist, destructive-confirm AlertDialog.
- Filter chips by refund status plus payment status.

CONTENT / COPY  (real Coimbatore content)
- H1: "Refunds"
- Helper: "Issue and track refunds within RBI PA-PG rules."
- RBI checklist: "✓ Refunds return to the original payment method · ✓ Cannot exceed the amount paid (₹1,200) · ✓ Available only after the payment is confirmed/settled · ✓ Processed by the licensed payment partner."
- Reason categories: Event cancelled · Duplicate payment · Participant request · Organizer goodwill · Other.
- Audit placeholder: "Reason for this refund (recorded in the audit log)."
- Blocked copy: "This payment hasn't settled yet — refunds are available after settlement (T+2/T+3)."
- Source-unavailable copy: "Original payment method unavailable — moved to Needs Review."
- Confirm: "Refund ₹1,200 to Sneha (UPI ••@oksbi)? This can't be undone."
- Shared label set available in filters/table: Payment Started · Payment Pending · Paid — Awaiting Webhook · Paid & Confirmed · Confirmation Sent · Settlement Pending · Settled · Refund Requested · Refund Processing · Refunded · Failed · User Abandoned · Duplicate Payment · Needs Review.

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/refunds.ts` exporting typed `mockRefundRows`, `mockRefundSummary`, `refundReasonCategories`, and `getRefundEligibility(row)`. Shape: `{ id, eventId, participantName, bib, orderId, amountPaid, refundableAmount, methodMasked, paymentStatus, refundStatus?, requestedBy?, requestedAt?, completedAt?, reasonCategory?, auditReasonSnippet?, failureReason?, settlementEta? }`. Reuse `paymentStatusLabels` from `apps/console/src/mocks/payments.ts` to avoid label drift. Include partial, pre-settlement blocked, source-unavailable/Needs Review, and completed refund examples.

STATES  (cover via `?demo=`)
- default — refund-eligible and in-progress rows; Sheet open for a settled payment.
- loading — table and stat skeleton.
- success — refund initiated Toast; row moves to Refund Requested.
- validation-error — refund amount exceeds captured or missing audit reason.
- permission-denied — non-Finance/Admin/Owner cannot initiate refunds.
- webhook-pending — Refund Processing / Settlement Pending rows with partner-processing banner.
- error — Failed refund with Retry and Needs Review path.
- empty — no refund-eligible transactions.
Demo URLs: `/events/codissia-run-2025/payments/refunds?demo=default`, `/events/codissia-run-2025/payments/refunds?demo=webhook-pending`, `/events/codissia-run-2025/payments/refunds?demo=validation-error`.

INTERACTIONS / MICROCOPY
- Initiate refund disabled until amount valid and audit reason entered: "Enter a reason to continue."
- Partial amount > captured shows: "Refund can't exceed ₹1,200 paid."
- Retry failed refund confirms and returns status to Refund Processing.
- Bulk-select refunds shows: "Add one audit reason for 6 refunds. It will be recorded on each refund."
- Settlement-blocked Tooltip: "Refunds unlock after payment partner settlement (T+2/T+3)."

RESPONSIVE
Desktop-first. Sheet full-width on tablet. Table scrolls horizontally with sticky Participant column. Stat Cards wrap to 2×2.

ACCESSIBILITY
Every payment/refund status is Badge color + icon + text. Rows, bulk checkboxes, and actions are keyboard-operable. Amounts use tabular nums. Masked methods have readable labels for screen readers. AlertDialog is focus-trapped. Audit reason and amount errors are connected to fields.

TOKENS USED
Warning-text for Refund Requested/Refund Processing/Settlement Pending, success-text for Refunded/Settled, danger-text for Failed/validation, info-text for RBI banner, orange for primary/destructive-confirm actions, navy sidebar, tabular numerals for ₹.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] refund fixtures wired   [ ] RBI PA-PG checklist (original source, ≤ captured, post-settlement, partner-processed)   [ ] audit reason required   [ ] shared 14 payment/refund labels used   [ ] full + partial refund   [ ] requested/processing/refunded/failed states   [ ] blocked + empty states   [ ] status icon + text labels   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```

---

## O-34 — Permissions Checklist (TN / Coimbatore)

**Requirements & plan comparison**
- **Exact items:** police/traffic NOC, Coimbatore City Municipal Corporation (CCMC) permission, ambulance/108 + medical/first-aid, fire/safety NOC where needed, IPRS/PPL music license, participant insurance.
- **Components:** checklist with status, due-date reminders, notes, attachments, assignee, and activity log.
- **States required:** not started, due soon, blocked, done, attachment uploaded, empty/loading/error, permission-denied as needed.
- **Checklist, not automation:** Corral tracks these items; organizers file with authorities.
- **DPDP/files:** attachments can contain official PII. Restrict updates to Owner/Admin/Event Editor; record who marked items done.

```text
SCREEN: O-34 — Permissions Checklist (TN / Coimbatore)
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/permissions  →  _authenticated.events.$eventId.permissions.tsx            THEME: Light
NAV: Sidebar Permissions or Trust Tools → Permissions. Breadcrumb: Event ▸ Permissions. Sibling link to `/events/$eventId/roster/medical`. Item opens detail Sheet. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Track Tamil Nadu / Coimbatore statutory permissions and licenses needed for an event, with status, due dates, reminders, notes, document attachments, and activity history. This is a tracking checklist, not automated filing.

LAYOUT
Header with event name, readiness summary ("4 of 6 complete · 1 due soon · 1 blocked"), and Progress bar. Below: checklist Table/Cards with one row per permission item showing item, issuing authority, status, due date/countdown, assignee, attachments count, and View/Update action. Row opens Sheet with status Select, due date, notes, attachment uploader, reminder toggle, and activity log. Top Alert explains checklist-only scope.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Breadcrumb, Alert, Progress, Card, Badge, Table, Button, Select, Input/date control, Textarea, Sheet, Switch, Tooltip, Toast, Dialog/AlertDialog, Skeleton.
- Readiness header: progress + status chips Done / Due soon / Blocked / Not started.
- Checklist rows: item, Authority Badge, Status Badge, due date + countdown, assignee Avatar, paperclip + attachment count, Actions.
- Item Sheet: status Select, due-date picker, notes Textarea, file Dropzone, reminder toggle, reminder-recipient note, activity timeline.
- Alert: "Checklist only — Corral helps you track these; you file them with each authority."

CONTENT / COPY  (real Coimbatore content)
- H1: "Permissions Checklist"
- Helper: "Track permits, NOCs, licenses, and insurance readiness for CODISSIA Run 2025."
- Items (name — issuing authority): Police / Traffic NOC — Coimbatore City Police (Traffic); CCMC permission — Coimbatore City Municipal Corporation (CCMC); Ambulance / 108 + first-aid — 108 EMS / medical partner; Fire & safety NOC — TN Fire & Rescue Services (where needed); IPRS/PPL music license — IPRS / PPL; Participant insurance — Digit / ICICI Lombard / Acko.
- Status options: Not started · In progress · Due soon · Blocked · Done.
- Due-date helper: "Suggested by T-21 days before event (14 Dec 2025)."
- Insurance link: "Set up the insurance add-on →"
- Blocked note example: "Awaiting CCMC ground-availability confirmation."
- Attachment helper: "Attach the signed NOC / license (PDF/JPG). Visible to your team only."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/permissions.ts` exporting typed `mockPermissionItems`, `permissionStatusLabels`, and `mockPermissionActivity`. Shape: `{ id, eventId, name, authority, status, dueDate, suggestedOffsetDays, assignee, attachments: { id, fileName, type, size }[], notes, reminderEnabled, applicable, lastUpdatedBy, activity }`. Include all six statutory items, optional Fire NOC applicability, CCMC blocked sample, Police NOC due-soon sample, and Participant insurance linked to mock setup status.

STATES  (cover via `?demo=`)
- default — mixed checklist with 4/6 complete, one due soon, one blocked.
- loading — readiness/header and row skeletons.
- success — attachment uploaded or status updated Toast.
- empty — no checklist seeded for event; CTA "Seed Coimbatore checklist" using fixtures.
- validation-error — Mark Done without attachment confirmation / missing due date.
- permission-denied — readonly user can view but cannot update attachments/status.
- offline — degraded banner: reminders paused in offline demo.
- error — attachment upload fake failure with retry.
Demo URLs: `/events/codissia-run-2025/permissions?demo=default`, `/events/codissia-run-2025/permissions?demo=validation-error`, `/events/codissia-run-2025/permissions?demo=permission-denied&as=org-readonly`.

INTERACTIONS / MICROCOPY
- Marking Done without attachment prompts: "Mark Police/Traffic NOC done without attaching the NOC?"
- Reminder toggle: "We'll remind your team on WhatsApp 7 and 3 days before the due date."
- Fire NOC "Applicable?" toggle excludes it from readiness count when off.
- Overdue item flips to danger with "Overdue by 2 days".
- Upload Toast: "NOC attached" with file name chip.

RESPONSIVE
Desktop-first. Rows become stacked Cards on tablet; Sheet full-width. Countdown and assignee hide last while item/status/action remain visible.

ACCESSIBILITY
Status is Badge color + icon + text. Countdown text states "Due in 3 days" and never relies on color. Rows and View/Update actions are keyboard-focusable with orange focus ring. Uploader is keyboard-operable with clear labels. Sheet focus-trapped and returns to row. Attachments announce filename, type, and size.

TOKENS USED
Success-text for Done, warning-text for Due soon/In progress, danger-text for Blocked/Overdue, info-text for checklist-only banner, orange primary for Update/upload, navy sidebar, light card/table surfaces.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] permissions fixtures wired   [ ] all 6 items with issuing authority   [ ] status per item   [ ] due dates + countdown   [ ] notes + attachment upload per item   [ ] reminder toggle   [ ] checklist-not-automation banner   [ ] insurance link to add-on   [ ] status icon + label   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```

---

## O-35 — Medical / Emergency Roster (print-safe)

**Requirements & plan comparison**
- **Purpose:** surface emergency-contact and medical-declaration data already collected as a print/export roster for medical team and race control.
- **Print-safe:** high-contrast black-on-white, no navy sidebar in print, tabular BIBs/phones, page headers/footers, page breaks per category/distance, and grayscale-safe medical alerts.
- **Minimal medical detail / DPDP:** show only BIB, name, age/sex, blood group if declared, concise allergy/condition/medication flags, and emergency contact details. Do not dump full medical history or non-essential PII.
- **RBAC:** Owner/Admin can export with audit reason; Support/Check-in may view only when assigned to medical/race-control duty; Event Editor, Finance, and Read-only Viewer cannot export health/PII.
- **States required:** default roster, print view, empty, permission-denied/export-gated, redaction/consent note.

```text
SCREEN: O-35 — Medical / Emergency Roster
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar; print-safe A4 portrait
ROUTE: /events/$eventId/roster/medical  →  _authenticated.events.$eventId.roster.medical.tsx            THEME: Light (screen) + print-safe black-on-white
NAV: Sidebar Roster → Medical Roster or Trust Tools → Medical Roster. Breadcrumb: Event ▸ Roster ▸ Medical. Sibling link to `/events/$eventId/permissions` and parent link to `/events/$eventId/roster`. Print/Export opens the print-safe view. Follow docs\design-build\navigation-and-routes.md.

PURPOSE
Give the medical team and race control a clean, printable roster of emergency contacts and minimal medical declarations participants already provided for fast race-day triage.

LAYOUT
Default screen: header with event, distance/category filter, Medical alerts only toggle, Print roster and Export CTAs, sensitivity banner, summary chips (total runners, medical alerts, minors), and a dense Table grouped by distance (21K / 10K / 5K) sorted by BIB. Row opens Sheet with minimal medical detail. Print view: separate high-contrast layout with no sidebar/nav, event title/date/venue, "MEDICAL / EMERGENCY ROSTER · CONFIDENTIAL" header, page number/generated timestamp footer, page breaks per distance, BIB in Oswald tabular nums, and MEDICAL ALERT rows bolded with icon/asterisk for grayscale.

KEY COMPONENTS  (map to @corral/ui / shadcn)
- Breadcrumb, Alert, Card, Badge, Table, Button, Input, Select, Checkbox/Switch, Sheet, Textarea for audit reason, Dialog, Toast, Skeleton, Tooltip.
- Filter chips: distance/category, Medical alerts only, minors.
- Summary chips: "Total: 642 · Medical alerts: 18 · Minors: 24".
- Roster Table columns: BIB, Name, Age/Sex, Blood group, Medical alert, Allergies/conditions, Medications, Emergency contact, Emergency phone.
- MEDICAL ALERT Badge with warning icon + text.
- Detail Sheet: blood group, declared conditions, allergies, medications, emergency contact + relationship + phone, "shown to medical team only" note.
- Print/Export controls: Print roster, Export PDF, restricted CSV, required audit-reason Textarea before PDF/CSV export.
- Print-only header/footer blocks and CSS rules.

CONTENT / COPY  (real Coimbatore content)
- H1: "Medical / Emergency Roster"
- Subtitle: "For medical team & race control. Minimal detail only."
- Sensitivity banner: "Confidential — contains health information. Share only with your medical team. Handle per DPDP. Full export is restricted and recorded."
- Print header: "CODISSIA RUN 2025 · 14 Dec 2025 · Race Course Road, Coimbatore — MEDICAL / EMERGENCY ROSTER (CONFIDENTIAL)".
- Print footer: "Generated 13 Dec 2025 18:40 · Page 1 of 7 · Corral".
- Alert flag: "MEDICAL ALERT" (asthma, diabetes, cardiac, severe allergy).
- Empty copy: "No medical declarations or emergency contacts collected yet."
- Minor note: "Minor — guardian: {name} {phone}".
- Sample rows: BIB 1042 Meena Krishnan F/34 O+ no alert emergency Ravi +91 98•••4321; BIB 1188 Arjun S M/41 B+ MEDICAL ALERT asthma inhaler emergency Lakshmi +91 90•••1188; BIB 1203 Kavya R F/16 A+ minor guardian Prakash +91 88•••9011.

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/roster.ts` exporting typed `mockMedicalRoster`, `mockMedicalSummary`, and `getMedicalRosterForPrint(filters)`. Shape: `{ id, eventId, bib, name, age, sex, distance, category, bloodGroup?, medicalAlert, conditions: string[], allergies: string[], medications: string[], emergencyContact: { name, relationship, phone }, isMinor, guardian?, consentCaptured, accessLevel }`. Include redacted samples for permission-denied mode and print pages grouped by distance. Export action uses `mockMutate` with audit reason; no backend file generation.

STATES  (cover via `?demo=`)
- default — grouped roster with alert rows and Sheet detail.
- loading — summary/table skeleton.
- empty — no declarations; export disabled.
- success — PDF/CSV export ready Toast after audit reason.
- validation-error — export attempted without audit reason.
- permission-denied — unauthorized role sees redacted roster or denial banner.
- offline — print still available from local fixtures; export disabled.
- error — fake export failure with retry.
Demo URLs: `/events/codissia-run-2025/roster/medical?demo=default`, `/events/codissia-run-2025/roster/medical?demo=empty`, `/events/codissia-run-2025/roster/medical?demo=permission-denied&as=org-readonly`.

INTERACTIONS / MICROCOPY
- "Print roster" switches to print view and triggers browser print with print CSS.
- PDF/CSV export disabled until audit reason entered; Toast: "medical-roster-codissia-run-2025.pdf ready."
- "Medical alerts only" narrows to flagged runners for aid-station clipboard.
- Sheet reiterates: "Minimal detail shown — full records are not exported here."
- Redaction banner: "You can see BIB/name only. Medical details require race-control duty assignment."

RESPONSIVE
Desktop-first for screen; print view targets A4 portrait and suppresses responsive chrome. On tablet, Table scrolls with sticky BIB column and Sheet is full-width. Print layout uses fixed page widths, page breaks per distance/category, and black-on-white contrast.

ACCESSIBILITY
MEDICAL ALERT uses danger color + warning icon + text and prints as bold + asterisk. Rows, filters, and controls are keyboard-operable with visible focus. BIB/phone use tabular nums. Print contrast is AAA black-on-white. Sheet focus-trapped. Health fields have clear labels. Do not encode conditions by color alone.

TOKENS USED
SOS/medical danger #ef4444 fill / #b91c1c text for MEDICAL ALERT; warning-text for minors; Oswald + tabular-nums for BIB; navy sidebar on screen only; print = black text on white with borders; orange for Print/Export action focus.

BUILD CHECKLIST
[ ] route file created under `_authenticated` shell   [ ] medical roster fixtures wired   [ ] minimal medical detail only   [ ] emergency contact name + phone per runner   [ ] MEDICAL ALERT icon + text and grayscale-safe print   [ ] grouped by distance sorted by BIB   [ ] print-safe view (black-on-white, header/footer, page breaks, no sidebar)   [ ] DPDP sensitivity banner   [ ] restricted PDF/CSV export requires audit reason   [ ] empty/redacted states   [ ] states covered via `?demo=` · nav wired · a11y · model-reviewed
```
