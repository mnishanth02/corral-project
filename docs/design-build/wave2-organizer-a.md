# Wave 2 Organizer Build Specs — Set A

Build these Wave-2 organizer screens directly in `apps/console` as React route files, one screen per canonical route. Follow `docs\design-build\navigation-and-routes.md`, the design-system reference in `docs\design-build-guide.md`, and the canonical `?demo=` state convention. All routes are event-scoped under the `_authenticated.` organizer auth layout, use the light organizer surface with the ALWAYS-NAVY sidebar, and read typed mock fixtures only from `apps/console/src/mocks/*`.

## O-08 — Event Setup — Branding

**Requirements & plan comparison**
- Wireframe stub requires event logo, banner, and sponsor strip; implementation plan confirms branding is part of event setup and certificate/public event-page assets.
- Publish readiness treats sponsor branding as warning-only, not a blocker; the build must show this without blocking Save.
- Constraints to include: file type/size, recommended dimensions, crop/preview, sponsor order, alt text, upload errors, and storage/privacy copy. Logo/banner are public assets; upload UI must not expose R2/CDN internals.
- Sponsor strip should feed public landing page and certificate fixed-template sponsor area; include constraints for max sponsor count and ordering.
- Roles: Owner/Admin/Event Editor can edit; Read-only Viewer sees disabled controls. Replacing/removing public branding is not PII export, so no audit reason is required unless bulk-delete of many sponsor assets is added later.

```text
SCREEN: O-08 — Event Setup — Branding
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/setup/branding  →  _authenticated.events.$eventId.setup.branding.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: Events active; event-context switcher set to "Kovai Night Run 2026". Setup shell tabs/stepper: Basics → Distances & Fees → Form Builder → Branding (current) → Policies → Publish Readiness. Breadcrumb: Events / Kovai Night Run 2026 / Setup / Branding. Links out: Preview public event page, Continue to Policies (`/events/$eventId/setup/policies`), View Publish Checklist (`/events/$eventId/setup/publish`).

PURPOSE
Configure the public-facing event logo, hero banner, and sponsor strip used on the event landing page, e-ticket, and certificate template. Make branding feel polished while clearly showing that missing sponsor assets are warning-only for publish readiness.

LAYOUT
1280px organizer shell using navy sidebar + top bar. Main content uses a two-column setup page: left 8-column form stack, right 4-column live preview panel. Header row: title "Branding", setup progress chip "Step 4 of 6", status badge "Warning-only for publish". Cards: Event logo upload, Hero banner upload with crop preview, Sponsor strip manager, Certificate preview. Right preview shows mobile event-card preview, desktop hero preview, and certificate header strip using uploaded assets.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Sidebar, Breadcrumb, Tabs/Stepper, Card, Button, Input, Label, Alert, Badge, Progress, Tooltip, Separator, Table for sponsor strip rows, DropdownMenu for sponsor actions, Dialog for crop/replace confirmation, Toast, Skeleton, Sheet only if editing sponsor details from table row. Upload zones are Card + dashed border + Button, with thumbnail preview and remove/replace actions. Use canonical imports such as `@corral/ui/components/table`, `@corral/ui/components/dialog`, `@corral/ui/components/sheet`, and `@corral/ui/components/tabs` once primitives exist.

CONTENT / COPY  (real Coimbatore content)
Page title "Branding"; helper "These assets appear on the public event page, e-ticket, and certificate. Sponsor branding is recommended, not required to publish." Logo card labels: "Event logo", "PNG/SVG/JPG · square recommended · max 2 MB", alt text field "Alt text: Kovai Night Run logo". Banner card: "Hero banner", "Recommended 1600×700 · keep text away from edges". Sponsor card: "Sponsor strip", "Up to 8 logos · shown in this order"; buttons "Upload logo", "Add sponsor", "Reorder", "Preview public page", "Save branding". Error copy examples: "Upload failed — file is 6.4 MB. Use an image under 2 MB." and "Banner is too small for the hero crop. Upload at least 1200px wide."

MOCK DATA  (fixture module + shape + sample rows)
Use typed fixtures from `apps/console/src/mocks/events.ts` (or `organizers.ts` if asset authors live there) with shape `{ eventId, name, venue, date, logoAsset, bannerAsset, sponsorStrip, lastSavedBy, lastSavedAt }`. Sample event: Kovai Night Run 2026, CODISSIA Trade Fair Complex, 14 Jun 2026. Current logo: `kovai-night-run.svg`; banner description: Race Course Road runners at sunrise. Sponsor rows: Annapoorna, PSG Hospitals, Brookefields Mall, Coimbatore Cycling Club with fields Sponsor name, Logo preview, Placement order, Link URL, Alt text, Last updated. Asset metadata: dimensions, file size, upload status, last saved by Priya Raman (Event Editor), saved 10:42 AM. Use local fake upload state only; never call storage or reveal storage paths/private hostnames.

STATES  (demoable via `?demo=`)
default · loading · error · permission-denied. Default includes existing assets, unsaved-changes state, warning-only missing sponsor strip note, and public preview. Loading shows Skeleton cards/previews while fixture delay resolves. Error shows failed logo/banner/sponsor upload with inline error, retry button, and non-blocking toast. Permission-denied disables controls with role copy for Read-only Viewer.

Demo URLs:
- `/events/kovai-night-run-2026/setup/branding?demo=default`
- `/events/kovai-night-run-2026/setup/branding?demo=error`
- `/events/kovai-night-run-2026/setup/branding?demo=permission-denied&as=org-readonly`

INTERACTIONS / MICROCOPY
Drag/drop or browse uploads; crop banner in dialog; reorder sponsor logos with keyboard-accessible move up/down controls; remove sponsor prompts confirmation "Remove sponsor logo from public pages?" Save uses `mockMutate(payload, { demo })` and shows toast "Branding saved. Public preview updated." If Read-only Viewer: controls disabled with tooltip "Ask an Owner, Admin, or Event Editor to change branding." Do not show storage paths or private hostnames. Preview buttons open same-origin preview.

RESPONSIVE
Primary design at 1280px. At tablet width, preview panel moves below form, sponsor table keeps horizontal scroll, upload targets remain ≥44px. Do not build mobile organizer as primary.

ACCESSIBILITY
All uploads have visible focus, keyboard browse action, descriptive alt-text field, status icons + labels, and error text associated to inputs. Sponsor reorder controls have aria-labels like "Move PSG Hospitals logo up". Do not rely on logo color alone in preview.

TOKENS USED
Light theme background #f8fafc, card #ffffff, border #e2e8f0, orange primary #ff5a00 for Save, brand-orange-strong for text links, warning fill/text for warning-only sponsor notes, danger-text for upload errors, ALWAYS-NAVY sidebar #0f172a.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] navy organizer shell [ ] logo/banner/sponsor uploads [ ] public/certificate preview [ ] sponsor order + alt text [ ] upload error state [ ] no storage internals exposed [ ] warning-only publish cue [ ] RBAC disabled state [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-10 — Coupon Codes

**Requirements & plan comparison**
- Wireframe requires create percentage/flat codes, usage caps, validity dates, and table; plan adds sponsor/club/influencer codes and early-bird interaction.
- Include overlap handling, expired state, category scoping, usage metrics, DPDP-safe exports, and audit requirements. Coupons can apply to all categories or selected 5K/10K/21K categories.
- Coupon overlap warnings must catch active codes with same code/name, same audience/category, or conflicting validity windows; warning can allow save with clear notice unless it creates duplicate code.
- Sensitive actions: bulk delete/disable coupon codes and exports that include redeemer PII require an audit reason. Coupon list itself should avoid exposing participant PII by default.
- Shared payment/fee stance: discounts reduce organizer fee rules; participant checkout must not show a separate participant-paid convenience fee.

```text
SCREEN: O-10 — Coupon Codes
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/coupons  →  _authenticated.events.$eventId.coupons.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: Events active with event-context switcher; Coupons appears in event tools between setup/publish readiness and roster. Entry points: event sidebar item Coupons, Publish Readiness warning "Optional coupon setup", and Roster filters when Finance checks discount usage. Breadcrumb: Events / Kovai Night Run 2026 / Coupons. Links out: Public checkout preview, Finance report, Audit log.

PURPOSE
Create, monitor, and retire sponsor/club coupon codes for the selected event, including percentage/flat discounts, usage caps, category scope, and validity dates. Surface overlap and expired-code risks before they cause checkout confusion.

LAYOUT
Organizer shell with navy sidebar and top bar. Header: title "Coupon Codes", primary Button "Create coupon", secondary "Export usage". Above table: stat cards for Active codes, Redemptions, Discount given, Expiring this week. Main workhorse data table with sticky header, global search, filter chips (Active, Scheduled, Expired, Usage cap reached, 5K, 10K, 21K), sortable columns, checkbox bulk-select, pagination. Right-side Sheet opens for create/edit details. Alert strip appears for overlapping state.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Card stats, Table, Input search, Select filters, Badge, Button, DropdownMenu, Sheet for create/edit, DatePicker/Calendar, RadioGroup for discount type, Input with ₹/% adornment, Checkbox category scope, Alert, Dialog for bulk disable with audit reason, Pagination, Tooltip, Toast, Skeleton. Use `@corral/ui/components/table`, `sheet`, `tabs`, `dialog`, `checkbox`, `radio-group`, `select`, `pagination`.

CONTENT / COPY  (real Coimbatore content)
Heading "Coupon Codes"; helper "Use sponsor, club, and influencer codes without changing base fees." Table columns: Code, Discount, Scope, Validity, Usage, Status, Created by, Actions. Drawer title "Create coupon" / "Edit CBE10CLUB". Form labels: "Code", "Description", "Discount type", "Discount value", "Apply to categories", "Usage cap", "Per-mobile limit", "Valid from", "Valid until", "Internal note". Buttons "Save coupon", "Disable code", "Preview checkout". Warning copy: "Overlap warning: CBE10CLUB and RUNCLUB10 are both active for 10K from 1–10 June. Runners may see the better discount only." Expired copy: "Expired on 31 May 2026 · checkout will reject this code."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/coupons.ts` with `CouponFixture { id, eventId, code, description, discountType, discountValue, categories, validFrom, validUntil, usageCap, usedCount, status, createdBy, createdAt, overlapIds }` and aggregate stats. Rows: CBE10CLUB — 10% — 5K/10K/21K — 01 Jun–12 Jun — 47/150 — Active; PSG500 — ₹500 flat — 21K — 15 May–31 May — 22/50 — Expired; CODISSIASTAFF — 100% comp — 5K — 01 Jun–14 Jun — 8/20 — Active; BROOKEFIELDS25 — 25% — All categories — Scheduled. Fees referenced in preview: 5K ₹799, 10K ₹1,199, 21K ₹1,999. Created by: Nandhini S (Admin), Arjun Mehta (Finance). Optional usage rows may reference redeemers from `roster.ts` but table defaults must avoid participant PII.

STATES  (demoable via `?demo=`)
default · loading · validation-error · success · permission-denied. Default shows active/scheduled table and create drawer. Validation-error shows overlap warning, highlighted affected rows, drawer inline validation before save, and expired filter examples. Success shows saved/disabled coupon toast and refreshed stats. Permission-denied disables create/bulk/export controls for read-only persona.

Demo URLs:
- `/events/kovai-night-run-2026/coupons?demo=default`
- `/events/kovai-night-run-2026/coupons?demo=validation-error`
- `/events/kovai-night-run-2026/coupons?demo=success`

INTERACTIONS / MICROCOPY
Create coupon validates uppercase alphanumeric code, discount ≤100%, flat discount cannot exceed selected category fee, end date after start date, cap positive integer. Mutations use `mockMutate(payload, { demo })`. Toasts: "Coupon saved." "Coupon disabled. Checkout will reject it immediately." Bulk disable opens confirmation requiring audit reason: "Why are you disabling 12 coupons? This is recorded in the audit log." Export usage with participant names/mobile/email requires audit reason and copy "PII export — handle under DPDP and share only with authorized event staff." Deep-link filters/pagination via search params; no backend calls.

RESPONSIVE
Desktop-first 1280px. At tablet widths, stat cards become 2×2, table horizontally scrolls, drawer width increases to 560px or full width under 900px.

ACCESSIBILITY
Status badges include icons + text; overlap rows use warning icon and row label, not color alone. Drawer focus-trapped; date fields keyboard-operable; currency/percentage adornments read as part of labels. Bulk action bar announces selected count.

TOKENS USED
Orange primary for Create/Save, warning fill/text for overlaps and expiring soon, danger-text for invalid/disabled, success-text for active, muted for expired, navy sidebar, tabular numerals for ₹ amounts and usage counts.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] coupon table [ ] create/edit drawer [ ] % and flat discounts [ ] category scope [ ] usage cap/date validation [ ] overlap warning [ ] expired filter/examples [ ] audit reason for bulk disable/PII export [ ] search-param filters/pagination [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-13 — CSV Import-Update (roster)

**Requirements & plan comparison**
- Wireframe requires upload, column-map, validate; must reuse S-09 import/upload validation pattern.
- Plan requires roster CSV import-update and manual correction while preserving DPDP-safe private CSV handling.
- Include mapping targets, row-level errors, duplicate detection, update-vs-create policy, audit reason for bulk changes, and payment-mode safety. Imports can update existing participants by Registration ID or mobile+email match; new creation is optional and explicit.
- Sensitive actions: import applying bulk participant updates, importing payment modes, or exporting error files with PII require an audit reason.
- Avoid showing private signed URLs, stack traces, raw parser details, or storage internals.

```text
SCREEN: O-13 — CSV Import-Update (roster)
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/roster/import  →  _authenticated.events.$eventId.roster.import.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: Roster active; event-context switcher set to Kovai Night Run 2026. Entry points: O-11 Roster "Import/update CSV", Participant Detail "Bulk update", and BIB Assignment when a BIB CSV includes roster fields. Breadcrumb: Events / Kovai Night Run 2026 / Roster / Import update. Links back to Roster (`/events/$eventId/roster`), Download template, View last imports, Contact Corral support.

PURPOSE
Let organizers safely upload a roster CSV, map columns to Corral fields, validate row-level issues, and apply bulk updates only when ready. Reuse the shared S-09 ImportValidation pattern (`@corral/ui` or app component ownership) so roster, timing, and vendor imports behave consistently.

LAYOUT
Navy organizer shell. Main page uses the S-09 ImportValidation composition: 1 Upload, 2 Map columns, 3 Validate & apply. Left/main column shows current step; right sidebar shows Import summary and safety notes. Step 1 upload Card; Step 2 source-to-target mapping table with sample preview; Step 3 validation dashboard with tabs Errors, Warnings, Ready rows and row-detail drawer. Sticky bottom action bar with Back, Save draft mapping, Validate, Apply updates. Do not redefine S-09 internals; pass O-13-specific copy, mapping targets, and roster validation rows into the pattern.

KEY COMPONENTS  (map to @corral/ui / shadcn)
S-09 `ImportValidation` pattern, Stepper/Tabs, Card upload dropzone, Alert, Table with sticky header, Select mapping dropdowns, Badge, Progress, Button, Dialog for apply confirmation with audit reason, Sheet row-error detail, Accordion for validation categories, Toast, Skeleton, Pagination, Tooltip, Checkbox "Create missing participants" option. Use canonical `@corral/ui/components/table`, `sheet`, `dialog`, `tabs`, `select`, `checkbox`.

CONTENT / COPY  (real Coimbatore content)
Header "CSV Import-Update"; helper "Private CSVs are used only for this event and should include the minimum fields needed." Upload copy "Drop roster_update_codissia.csv or browse"; template link "Download Corral roster template". Mapping targets: Registration ID, Full name, Gender, DOB, Mobile, Email, Category, T-shirt size, Club/team, Emergency contact name, Emergency contact phone, BIB, Chip ID, Payment mode, Payment status, Guardian name, Guardian mobile, Waiver accepted. Validation messages: "Required target unmapped: Registration ID or Mobile + Email", "Row 18: Mobile number has 9 digits", "Row 31: BIB 1042 already belongs to Raghav S", "Ready to update 486 rows".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/roster.ts` plus `apps/console/src/mocks/bibs.ts` for duplicate BIB validation. Shape: `ImportFixture { fileName, rowCount, columnCount, uploadedBy, uploadedAt, sourceColumns, targetMappings, summary, validationRows }`. File: `roster_update_kovai_2026.csv`, 512 rows, 18 columns, uploaded by Priya Raman at 11:20 AM. Sample source columns: RegNo, Runner Name, Phone, Email ID, Race, Tee, Bib No, Chip, PayMode. Summary: 486 ready, 19 row errors, 7 warnings, 0 applied. Example rows: Meena Krishnan 10K Paid & Confirmed BIB 1042 Tee M; Sanjay Kumar 21K Payment Pending BIB blank; Aadhira R (minor) 5K guardian missing warning.

STATES  (demoable via `?demo=`)
default · validation-error · success · loading · permission-denied. Default starts at upload/map with fixture data. Validation-error shows unmapped required field, row errors table, severity badges, and drawer. Success shows green ready summary, audit-reason confirmation, and Apply updates CTA/success toast. Loading shows parsing/validating progress. Permission-denied blocks apply for unauthorized roles.

Demo URLs:
- `/events/kovai-night-run-2026/roster/import?demo=default`
- `/events/kovai-night-run-2026/roster/import?demo=validation-error`
- `/events/kovai-night-run-2026/roster/import?demo=success`

INTERACTIONS / MICROCOPY
Auto-detect mapping suggests targets with confidence chips; user can override. Validate button disabled until identity key is mapped. Row click opens detail drawer with source row and editable correction. "Apply updates" opens Dialog requiring audit reason: "Bulk roster update affects participant PII and is recorded in the audit log." Payment mode updates to cash/comp/direct-UPI show extra warning "Manual payment overrides require Finance or Admin role." Success toast "486 roster rows updated. 19 rows skipped." Failure copy is human-safe: "We could not parse the file. Check that it is CSV UTF-8 and try again." No stack traces or signed URLs. Large error lists use deterministic mock pagination/filtering via search params.

RESPONSIVE
Desktop-first; 3-step layout holds at 1280px. On tablet, summary sidebar moves under stepper and validation table scrolls horizontally.

ACCESSIBILITY
Stepper announces current step; mapping selects have source-column labels; errors include icon + severity label; row error drawer focus-trapped; upload accepts keyboard activation and describes file restrictions. Validation summary is readable by screen readers.

TOKENS USED
Orange for primary Validate/Apply, info for mapping suggestions, warning for warnings, danger-text for row errors, success-text for ready rows, muted for skipped rows, navy sidebar, tabular numerals for row counts.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] S-09 ImportValidation reuse [ ] upload/map/validate flow [ ] unmapped state [ ] row errors table + drawer [ ] ready apply state [ ] audit reason for bulk update/payment override [ ] DPDP private CSV notice [ ] no storage internals/stack traces [ ] search-param pagination for errors [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-15 — Spot / Cash / Offline Registration

**Requirements & plan comparison**
- Wireframe requires quick add form, payment mode cash/comp, walk-in/expo; plan also allows direct-UPI in offline capture.
- Include DPDP consent, waiver/medical checks, duplicate detection, minor guardian handling, and manual payment override audit reason.
- Sensitive action: creating an offline registration with cash/comp/direct-UPI is a manual payment override and requires audit reason, role-gated to Owner/Admin/Finance/Event Editor depending policy.
- Must use shared payment labels; newly added registrant should appear in roster with payment mode Cash/Comp/Direct UPI and status Paid & Confirmed or Needs Review as appropriate.
- This is desktop organizer flow for expo desk, not participant mobile checkout.

```text
SCREEN: O-15 — Spot / Cash / Offline Registration
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/roster/spot  →  _authenticated.events.$eventId.roster.spot.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: Roster active; event-context switcher set to Kovai Night Run 2026. Entry points: Roster primary split-button "Add offline registration", Expo desk shortcut in event top bar, or Support/Check-in role workspace. Breadcrumb: Events / Kovai Night Run 2026 / Roster / Offline registration. Links out: Back to Roster (`/events/$eventId/roster`), Open existing duplicate, Print/e-ticket after save.

PURPOSE
Quickly add a walk-in or expo registrant to the roster when the organizer collects cash, marks a comp entry, or confirms direct-UPI offline. Keep race-day speed high without bypassing consent, guardian, and audit rules.

LAYOUT
Navy organizer shell. Centered dense form Card with two columns: Participant details and Registration/payment. Sticky right summary rail shows category fee, discount/comp amount, payment status label, consent checklist, duplicate check result. Header includes event context and badge "Expo desk mode". Bottom sticky action bar: Cancel, Save as draft, Add registrant.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Card, Input, Select, RadioGroup payment mode, Checkbox consents, DatePicker DOB, Alert, Badge, Button, Dialog requiring audit reason, Tooltip, Toast, Separator, Command-style participant duplicate search, Skeleton for category fee loading. Use canonical `@corral/ui/components/select`, `radio-group`, `checkbox`, `dialog`, `table` for duplicate results where needed.

CONTENT / COPY  (real Coimbatore content)
Title "Add offline registration"; helper "Use this for walk-ins, expo desk entries, or organizer-approved comp registrations." Fields: Full name, Gender, DOB, Mobile, Email, Distance/category (5K ₹799, 10K ₹1,199, 21K ₹1,999), T-shirt size, Club/team, Emergency contact name, Emergency contact phone, BIB (optional), Source "Walk-in / Expo / Sponsor comp / Club bulk correction", Payment mode "Cash / Direct UPI / Comp", Amount collected, Receipt note, Waiver accepted, Medical declaration, WhatsApp/SMS/email consent, Guardian name/mobile if minor. Buttons "Add registrant", "Add and print e-ticket". Validation copy: "Mobile number is required for confirmation messages." "Guardian consent is required for minors." "Comp entries require a reason."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/roster.ts` with `OfflineRegistrationDraft`, `ParticipantFixture`, and shared payment labels; optionally pull category fees from `events.ts` and BIB suggestions from `bibs.ts`. Event: Kovai Night Run 2026 at CODISSIA; operator Nandhini S (Admin). Duplicate example: "Meena Krishnan · 10K · Paid & Confirmed · 98430 11223". Payment labels: Paid & Confirmed, Confirmation Sent, Needs Review. Payment mode labels: Cash, Direct UPI, Comp. Summary: 10K fee ₹1,199, amount collected ₹1,199 cash, organizer-absorbed convenience fee note. Include BIB sample 1042 for optional assignment.

STATES  (demoable via `?demo=`)
default · validation-error · success · loading · permission-denied. Default shows empty-but-guided form with required fields, consent checklist, and summary. Validation-error shows inline errors, duplicate warning, missing guardian/consent, invalid amount, and disabled submit until fixed. Success shows saved roster handoff and print/e-ticket CTA. Loading shows duplicate/category fee lookup skeleton. Permission-denied disables manual payment override CTA.

Demo URLs:
- `/events/kovai-night-run-2026/roster/spot?demo=default`
- `/events/kovai-night-run-2026/roster/spot?demo=validation-error`
- `/events/kovai-night-run-2026/roster/spot?demo=success`

INTERACTIONS / MICROCOPY
DOB auto-detects minor and reveals guardian section. Mobile/email duplicate search runs after blur and offers "Open existing" or "Continue as new with audit reason". Submit opens confirmation Dialog requiring audit reason because this is a manual payment override: "Why is this offline payment being added?" Success toast "Offline registration added. Confirmation can now be sent." If role lacks permission: disabled CTA with tooltip "Finance, Admin, Owner, or Event Editor permission required." Do not collect unnecessary medical details beyond declaration checkbox. Use `mockMutate(payload, { demo })`.

RESPONSIVE
Desktop-first at 1280px for expo laptop. Tablet fallback stacks summary rail below form and keeps bottom action bar sticky.

ACCESSIBILITY
Required fields clearly marked; validation errors associated to fields; payment mode radio labels include descriptions; duplicate warning uses icon + text; audit dialog focus-trapped; controls ≥44px for hurried expo use.

TOKENS USED
Orange primary Add, success-text for Paid & Confirmed, warning for duplicate/Needs Review, danger-text for validation, brand-tint for organizer-absorbed fee note, navy sidebar, tabular numerals for ₹ fees.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] quick add form [ ] cash/direct-UPI/comp modes [ ] shared payment labels [ ] DPDP/waiver/medical/communication consent [ ] minor guardian validation [ ] duplicate warning [ ] audit reason for manual payment override [ ] roster handoff after save [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-16 — T-Shirt Size Summary

**Requirements & plan comparison**
- Wireframe requires aggregate counts table/chart to prevent over/under-ordering; plan highlights T-shirt size summary as roster MVP need.
- Include category/gender breakdown, paid-only vs all registrations filter, unselected size handling, CSV/export needs, and empty state.
- Aggregate export contains no PII and does not need an audit reason; drill-down to participant list/export with PII requires audit reason.
- Sizes XS–XXL plus youth sizes for fun run; data comes from confirmed roster but can be filtered.
- Large participant drill-down lists use deterministic mock pagination/filtering via search params.

```text
SCREEN: O-16 — T-Shirt Size Summary
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/roster/tshirts  →  _authenticated.events.$eventId.roster.tshirts.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: Roster active; event-context switcher set to Kovai Night Run 2026. Entry points: Roster sidebar "T-shirt summary", Roster filter chip "T-shirt size", and Pilot prep checklist. Breadcrumb: Events / Kovai Night Run 2026 / Roster / T-shirt size summary. Links out: Roster filtered to missing sizes, Export aggregate CSV, Message runners missing size.

PURPOSE
Show aggregate T-shirt demand by size, category, gender, and payment status so organizers can place accurate orders and avoid expo-day shortages. Make missing size data visible before ordering.

LAYOUT
Organizer shell with navy sidebar. Header with title, last-updated timestamp, filter bar, and primary "Export aggregate". Top stat cards: Total confirmed, Missing size, Most requested, Recommended buffer. Main area split: left stacked bar chart by category; right aggregate table with sticky header. Lower section: breakdown tabs By category, By gender, Missing sizes. Optional right-side Sheet opens drill-down participant list when a size cell is clicked.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Card stats, Tabs, Table, chart Card using token chart colors, Select filters, Badge, Button, Alert, Sheet for drill-down, Pagination, Tooltip, Toast, Skeleton, Empty state illustration/card. Use `@corral/ui/components/table`, `tabs`, `select`, `sheet`, `pagination`, `skeleton`.

CONTENT / COPY  (real Coimbatore content)
Heading "T-Shirt Size Summary"; helper "Use confirmed registrations for ordering. Add a 5–8% buffer based on your vendor policy." Filters: Category All/5K/10K/21K, Payment status Paid & Confirmed/Confirmation Sent/All, Gender, Include comp entries. Table columns: Size, 5K, 10K, 21K, Total, Buffer +5%, Missing runners. Chart title "Confirmed sizes by distance". Empty copy: "No T-shirt sizes yet. Sizes appear after registrations are collected." Actions: "Export aggregate CSV", "Open missing-size roster", "Send WhatsApp reminder".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/tshirts.ts` with `TshirtSummaryFixture { eventId, updatedAt, filters, totals, byCategory, byGender, missingParticipants }`, joined to `roster.ts` for drill-down names only. Totals: 642 confirmed registrations, 28 missing size, most requested M (184), buffer +5% ≈ 32 shirts. Sizes XS 22, S 96, M 184, L 171, XL 112, XXL 29, Youth S 12, Youth M 16. Category examples: 5K 210, 10K 302, 21K 130. Missing examples shown only in drill-down: Aravind Kumar, Priya Nair, Karthik S. BIB sample in drill-down can show 1042 where useful but aggregate view stays non-PII.

STATES  (demoable via `?demo=`)
default · empty · loading · permission-denied. Default shows filters, chart, table, aggregate export, and missing-size alert. Empty shows no registrations/size data with CTA to Roster and disabled export. Loading shows filter/chart/table skeleton while fixture delay resolves. Permission-denied disables PII drill-down export while aggregate view remains visible.

Demo URLs:
- `/events/kovai-night-run-2026/roster/tshirts?demo=default`
- `/events/kovai-night-run-2026/roster/tshirts?demo=empty`
- `/events/kovai-night-run-2026/roster/tshirts?demo=loading`

INTERACTIONS / MICROCOPY
Filter changes update chart/table with loading skeleton and search params. Clicking a count opens drill-down Sheet "M size · 10K · 86 runners" with paginated participant list; PII export from drill-down requires audit reason. Aggregate export toast "Aggregate size CSV downloaded — no participant PII included." Missing-size CTA opens roster filtered to size blank. Chart bars include labels and patterns, not color alone.

RESPONSIVE
Desktop-first 1280px. Tablet stacks chart above table; table retains horizontal scroll; stat cards wrap 2×2.

ACCESSIBILITY
Chart has table alternative and visible labels; color palette paired with patterns/legend; filter controls labeled; numeric cells use tabular numerals; drill-down sheet focus-trapped. Empty state explains next action.

TOKENS USED
chart-1 orange, chart-2 blue, chart-3 emerald, chart-4 amber, chart-5 violet; warning for missing-size alert, orange for export/CTA, muted for empty, navy sidebar, tabular numerals.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] aggregate table [ ] chart with table alternative [ ] filters by category/payment/gender [ ] missing-size alert [ ] empty state [ ] aggregate export no audit [ ] PII drill-down export audit reason [ ] search-param pagination for drill-down [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-17 — BIB Assignment

**Requirements & plan comparison**
- Wireframe requires manual entry and CSV upload of BIB numbers; plan says automatic allocation comes later, manual + CSV is MVP.
- Include assignment rules, upload progress, validation against duplicates, update policy, and print/export handoff.
- Sensitive action: bulk BIB assignment/update affects race operations and should require audit reason when applying CSV or overwriting existing BIBs.
- Must connect to roster columns and O-18 duplicate validation; assigned state should show BIB 1042 content.
- BIBs are unique per event, numeric or alphanumeric ranges supported, but no automatic allocation in MVP.

```text
SCREEN: O-17 — BIB Assignment
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/bibs  →  _authenticated.events.$eventId.bibs.index.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: BIBs active; event-context switcher set to Kovai Night Run 2026. Entry points: Roster BIB filter, BIB Management sidebar, CSV Import after mapping BIB column, and Publish/Pilot prep checklist. Breadcrumb: Events / Kovai Night Run 2026 / BIB Management / Assignment. Cross-links: Duplicate validation O-18 (`/events/$eventId/bibs/validate`) and BIB↔Chip Mapping O-19 (`/events/$eventId/bibs/chips`); flow should guide O-17 → O-18 → O-19.

PURPOSE
Assign BIB numbers manually or by CSV upload, validate before applying, and keep the roster ready for printing and timing-vendor export. Avoid accidental duplicate or overwritten BIB assignments.

LAYOUT
Organizer shell with navy sidebar. Header: "BIB Assignment", primary Button "Upload BIB CSV", secondary "Download template" and "Open duplicate validation". Top summary cards: Assigned, Unassigned, Duplicates, Last import. Main table lists participants with inline BIB field for safe manual edits and row drawer for details. Bulk action bar appears for selected rows. Right-side upload Sheet shows CSV upload/map/validate mini-flow and progress.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Card stats, Table sticky header, Input search, filter chips (Assigned, Unassigned, Duplicate, 5K/10K/21K), inline Input for BIB, Button, Sheet upload flow, Progress, Alert, Badge, Dialog with audit reason for bulk apply/overwrite, Pagination, Toast, Skeleton, Tooltip. CSV upload uses S-09 light pattern without redefining it.

CONTENT / COPY  (real Coimbatore content)
Heading "BIB Assignment"; helper "Manual or CSV assignment only for MVP — automatic allocation comes later." Table columns: Participant, Category, Payment status, Mobile, Current BIB, New BIB, Source, Status, Actions. Upload Sheet copy: "Upload CSV with Registration ID or Mobile + BIB number." Buttons: "Validate CSV", "Apply 486 assignments", "Save manual changes". Warning copy: "12 rows will overwrite existing BIBs. Add an audit reason before applying." Assigned copy: "BIB 1042 assigned to Meena Krishnan."

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/bibs.ts` with `BibAssignmentFixture { eventId, stats, rows, lastImport, uploadPreview }`, joined to `roster.ts` for participant identity. Summary: 614 assigned, 28 unassigned, 2 duplicates, last import `bib_assignment_codissia.csv` by Arjun Mehta. Rows: Meena Krishnan · 10K · Paid & Confirmed · 98430 11223 · BIB 1042 · Assigned; Sanjay Kumar · 21K · Confirmation Sent · blank new BIB · Unassigned; Raghav S · 10K · BIB 1042 · Duplicate. Upload progress: 72% parsing, 512 rows read, 486 valid.

STATES  (demoable via `?demo=`)
default · loading · validation-error · success · permission-denied. Default shows assignment table and summary. Loading shows upload Sheet with progress, skeleton validation rows, disabled apply. Validation-error shows duplicate/overwrite warnings and links to O-18. Success shows success summary, assigned badges, and updated table after manual/CSV save. Permission-denied disables CSV apply/manual save.

Demo URLs:
- `/events/kovai-night-run-2026/bibs?demo=default`
- `/events/kovai-night-run-2026/bibs?demo=loading`
- `/events/kovai-night-run-2026/bibs?demo=success`

INTERACTIONS / MICROCOPY
Inline BIB edit validates uniqueness on blur and marks row unsaved. CSV upload follows S-09 light pattern: upload → map columns → validate. Apply CSV requires audit reason: "Bulk BIB assignment affects race operations and timing vendor files." Overwrite existing BIBs requires explicit checkbox "I understand these BIBs will be replaced." Success toast "486 BIBs assigned. 28 participants still need BIBs." Errors link to O-18 duplicate validation. Large tables use search-param pagination/filtering. After assignments, primary next CTA is "Open duplicate validation".

RESPONSIVE
Desktop-first. Tablet uses horizontal table scroll and full-height upload Sheet; inline BIB fields remain large enough for keyboard entry.

ACCESSIBILITY
Inline BIB inputs have row-specific labels; status badges include icon + text; upload progress announced; duplicate links are keyboard accessible; focus returns to upload button after Sheet closes.

TOKENS USED
Orange for upload/apply/save, success-text for assigned, warning for overwrites/unassigned, danger-text for duplicates, info for upload progress, navy sidebar, Oswald/tabular numerals for BIB values.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] manual BIB table [ ] CSV upload Sheet [ ] uploading progress [ ] assigned success state [ ] overwrite warning [ ] audit reason for bulk apply [ ] link to duplicate validation [ ] O-17→O-18→O-19 cross-links [ ] search-param pagination/filtering [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-18 — BIB Duplicate / Validation

**Requirements & plan comparison**
- Wireframe requires duplicate-BIB warning table; plan explicitly calls duplicate-BIB warnings an MVP need.
- Include clean state, conflict resolution drawer, severity, and export/print implications.
- Sensitive action: manual overrides that keep a duplicate or bulk-clear warnings require audit reason; normal correction to unique BIB can be saved without export of PII.
- Must connect upstream to O-17 and downstream to timing/vendor export; duplicates should block timing export readiness.
- Validation checks event-scoped BIB uniqueness plus blank BIBs separately.

```text
SCREEN: O-18 — BIB Duplicate / Validation
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/bibs/validate  →  _authenticated.events.$eventId.bibs.validate.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: BIBs active; event-context switcher set to Kovai Night Run 2026. Entry points: BIB Assignment duplicate stat, Timing-vendor export preflight, Roster BIB filter, and validation link after CSV upload. Breadcrumb: Events / Kovai Night Run 2026 / BIB Management / Duplicate validation. Cross-links: Back to Assignment O-17 (`/events/$eventId/bibs`), continue to BIB↔Chip Mapping O-19 (`/events/$eventId/bibs/chips`) when clean, Export clean roster once resolved.

PURPOSE
Surface duplicate BIB assignments clearly, show which participants are affected, and provide a safe correction workflow before roster print or timing-vendor export.

LAYOUT
Organizer shell with navy sidebar. Header with validation status and primary CTA depending state. Top cards: Duplicate BIBs, Affected participants, Blank BIBs, Last validation. Main default state for duplicates: Alert banner, grouped duplicate table where each BIB expands to affected participants, right-side conflict-resolution Sheet. Clean state: success panel with last validation and safe next actions.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Alert, Card stats, Table, Accordion/grouped rows, Badge severity, Button, Sheet for correction, Input BIB editor, Dialog for override with audit reason, Pagination, Toast, Skeleton, Tooltip, Empty/success state card. Use `@corral/ui/components/table`, `sheet`, `dialog`, `badge`, `pagination`.

CONTENT / COPY  (real Coimbatore content)
Duplicate heading "Duplicate BIBs found"; alert "Fix duplicates before printing BIB sheets or exporting to the timing vendor." Table columns: BIB, Conflict count, Participants, Categories, Source, Last changed by, Resolution. Sheet title "Resolve BIB 1042". Actions "Change Meena to 1043", "Open participant", "Mark as intentional override". Clean state copy: "No duplicate BIBs. Your roster is ready for BIB print and timing export." Buttons "Go to BIB ↔ Chip Mapping", "Export timing CSV".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/bibs.ts` with `BibValidationFixture { eventId, validatedAt, stats, duplicateGroups, blankBibRows }`, joined to `roster.ts`. Duplicate examples: BIB 1042 assigned to Meena Krishnan · 10K · Paid & Confirmed and Raghav S · 10K · Confirmation Sent; BIB 1188 assigned to Vikram Narayanan · 21K and Anjali Rao · 5K. Sources: manual edit by Priya Raman, CSV import `bib_assignment_codissia.csv`. Clean state shows 614 assigned, 0 duplicates, 28 blank BIBs, validated 11:48 AM.

STATES  (demoable via `?demo=`)
validation-error · success · loading · permission-denied. Validation-error is the duplicate-found state with high-visibility warning, conflict groups, correction Sheet, and timing export blocked. Success is clean state with remaining blank-BIB note and downstream CTA to O-19. Loading shows revalidation skeleton/progress. Permission-denied disables intentional override/bulk clear.

Demo URLs:
- `/events/kovai-night-run-2026/bibs/validate?demo=validation-error`
- `/events/kovai-night-run-2026/bibs/validate?demo=success`
- `/events/kovai-night-run-2026/bibs/validate?demo=loading`

INTERACTIONS / MICROCOPY
Clicking a conflict opens Sheet with affected participants and editable BIB fields. Save validates uniqueness immediately. Intentional override opens Dialog requiring audit reason: "Why is this duplicate BIB being allowed? This can break timing results." Bulk revalidate button shows loading then toast "Validation complete: 0 duplicate BIBs." Timing export CTA disabled while duplicates remain with tooltip "Resolve duplicate BIBs first." Use search-param pagination/filtering for large conflict lists. Clean state primary CTA continues O-18 → O-19.

RESPONSIVE
Desktop-first. Tablet keeps grouped table scrollable; conflict Sheet uses 70% width or full width under 900px.

ACCESSIBILITY
Duplicate warning uses danger icon + text, not red alone; grouped rows have accessible expand/collapse labels; BIB inputs announce conflict status; success state uses icon + text. Focus moves to first invalid BIB in Sheet.

TOKENS USED
Danger fill/text for duplicate blockers, warning for blank BIBs, success-text for clean, orange for Save/Revalidate, navy sidebar, Oswald/tabular numerals for BIB values.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] duplicate grouped table [ ] conflict resolution Sheet [ ] clean state [ ] timing export blocked while duplicate [ ] audit reason for intentional override/bulk clear [ ] blank-BIB note [ ] O-17→O-18→O-19 cross-links [ ] search-param pagination/filtering [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```

## O-19 — BIB ↔ Chip Mapping

**Requirements & plan comparison**
- Wireframe requires exportable/correctable mapping table; plan identifies BIB↔chip mapping as a common source of result errors.
- Include timing-vendor export columns, mismatch state, correction workflow, import/source tracking, and audit reason for PII export/manual overrides.
- Mapping export should include vendor-required columns: BIB, Chip ID, participant name, category/distance, gender, mobile optional, registration ID, status. Export with participant PII requires audit reason.
- Mismatch should catch missing chips, duplicate chips, chip mapped to wrong BIB, and category mismatch against roster.
- Chip IDs may be alphanumeric RFID values; table is event-scoped and mock-paginated.

```text
SCREEN: O-19 — BIB ↔ Chip Mapping
APP / SURFACE: console · Organizer desktop 1280px, Light + navy sidebar
ROUTE: /events/$eventId/bibs/chips  →  _authenticated.events.$eventId.bibs.chips.tsx            THEME: Light
NAV: Under the organizer `_authenticated` shell per `docs/design-build/navigation-and-routes.md`. Sidebar: BIBs active; event-context switcher set to Kovai Night Run 2026. Entry points: BIB Management sidebar, Timing-vendor export, Results upload preflight, and O-18 clean-state CTA. Breadcrumb: Events / Kovai Night Run 2026 / BIB Management / BIB ↔ Chip Mapping. Cross-links: Back to O-18 duplicate validation (`/events/$eventId/bibs/validate`), Upload mapping CSV, Export vendor file, Results Import, Audit log. This completes the O-17 → O-18 → O-19 flow.

PURPOSE
Maintain an exportable and correctable BIB-to-chip mapping for timing vendors, reducing race-result errors before and after CSV timing imports. Make mismatches obvious and auditable.

LAYOUT
Organizer shell with navy sidebar and top bar. Header: title "BIB ↔ Chip Mapping", status badge "Ready" or "Mismatch found", primary "Export vendor CSV", secondary "Upload mapping". Summary cards: Total mappings, Missing chip, Duplicate chip, Mismatch. Main table with sticky header, global search, filter chips (Missing chip, Duplicate chip, Category mismatch, 5K/10K/21K), sortable columns, checkbox bulk-select, pagination. Row click opens right-side correction Drawer.

KEY COMPONENTS  (map to @corral/ui / shadcn)
Card stats, Table, search Input, filter Chips, Badge, Button, DropdownMenu, Sheet correction drawer, Input chip editor, Select category, Alert, Dialog with audit reason for export/manual override, Pagination, Toast, Skeleton, Tooltip. Upload mapping CSV reuses the S-09 ImportValidation mini-flow.

CONTENT / COPY  (real Coimbatore content)
Heading "BIB ↔ Chip Mapping"; helper "Share this with your timing vendor and correct mismatches before results import." Table columns: BIB, Chip ID, Participant, Category, Gender, Registration ID, Payment status, Mapping status, Source, Updated. Drawer sections: Roster identity, Current mapping, Correction, Vendor export preview. Export options: "Timing vendor CSV", "BIB print sheet", "Mapping with mobile/email (PII)". Mismatch copy: "Chip RFID-CBE-7781 is mapped to BIB 1042, but timing file references BIB 1043." Button labels: "Save correction", "Export vendor CSV", "Upload chip CSV".

MOCK DATA  (fixture module + shape + sample rows)
Use `apps/console/src/mocks/bibs.ts` with `BibChipMappingFixture { eventId, stats, rows, vendorFields, lastUpload }`, joined to `roster.ts` for participant identity and payment labels. Rows: BIB 1042 · CHIP-CBE-7781 · Meena Krishnan · 10K · F · REG-2026-0042 · Paid & Confirmed · OK; BIB 1043 · blank chip · Raghav S · 10K · M · Missing chip; BIB 1188 · CHIP-CBE-9920 duplicate with BIB 1189 · Anjali Rao · 5K · Duplicate chip. Summary: 614 total, 28 missing chip, 2 duplicate chip, 3 mismatches. Vendor fields preview: bib_number, chip_id, full_name, distance, category, gender, registration_id, payment_status.

STATES  (demoable via `?demo=`)
default · validation-error · loading · success · permission-denied. Default shows mostly clean mapping table, export controls, and correction drawer. Validation-error shows mismatch alert, filtered mismatches, highlighted rows, export warning, and disabled/confirmed export behavior. Loading shows upload/validation skeleton. Success shows saved correction/export toast. Permission-denied disables PII export/manual override.

Demo URLs:
- `/events/kovai-night-run-2026/bibs/chips?demo=default`
- `/events/kovai-night-run-2026/bibs/chips?demo=validation-error`
- `/events/kovai-night-run-2026/bibs/chips?demo=success`

INTERACTIONS / MICROCOPY
Inline chip edit validates uniqueness; row drawer lets user correct chip ID or mark chip unavailable. Export vendor CSV opens Dialog requiring audit reason when columns include name/mobile/email: "This export contains participant PII for the timing vendor. Record why it is needed." If exporting minimal BIB+chip+category only, show a confirmation without an audit-reason field: "Share this non-PII mapping with the timing vendor?" Manual override of duplicate chip requires audit reason. Upload mapping CSV reuses S-09 mini-flow and links mismatches to row drawer. Toasts: "Chip mapping saved." "Vendor CSV exported." Large mapping list uses search-param pagination/filtering.

RESPONSIVE
Desktop-first at 1280px. Tablet uses horizontal table scroll and full-width drawer. Keep BIB/Chip columns pinned on the left if possible.

ACCESSIBILITY
BIB and chip values use tabular/condensed numerals; mismatch statuses include icon + text; export dialog is focus-trapped; filters announce active state; correction fields have participant-specific labels.

TOKENS USED
Orange for export/save, success-text for OK, warning for missing chip/category mismatch, danger-text for duplicate chip, info for uploaded source, navy sidebar, Oswald/tabular numerals for BIB/chip values.

BUILD CHECKLIST
[ ] route file under `_authenticated.` auth layout [ ] mapping table [ ] export columns for timing vendor [ ] correction drawer [ ] mismatch alert/state [ ] missing/duplicate chip filters [ ] PII export audit reason [ ] manual override audit reason [ ] upload CSV S-09 handoff [ ] O-17→O-18→O-19 cross-links [ ] search-param pagination/filtering [ ] states covered via `?demo=` [ ] nav wired [ ] a11y [ ] model-reviewed
```
