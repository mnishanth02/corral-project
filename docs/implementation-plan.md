# Corral — Implementation Plan

> Execution companion to [plan.md](plan.md). The strategy lives in `plan.md`; this file holds the
> spec-level detail: module specs, phased roadmap, the 90-day plan, payments/compliance, legal,
> privacy, support runbook, and metrics. When the two disagree, `plan.md` wins.

---

## 1. MVP Module Specs

The MVP delivers the core loop — **Registration → Roster → Communicate → Results → Certificates** —
plus the India table-stakes that make it usable for a real Coimbatore run. Build the internal
**admin console** alongside every module: early success is white-glove, so Corral staff must be able
to do anything an organizer can.

### 1.1 Event setup

Organizer (or Corral admin) creates an event page with:

- Name, date/time, venue (with map link)
- Distances/categories (e.g., 3K / 5K / 10K / 21.1K / 42.2K, fun run)
- Fee per category, registration open/close dates
- Description, contact info, race instructions
- Refund/cancellation policy, waiver text
- Branding: logo, banner, sponsor strip

### 1.2 Registration

**Standard fields:** name, gender, date of birth (drives age-group), mobile, email, emergency
contact, distance/category, T-shirt size, club/team (optional), medical declaration checkbox,
waiver acceptance. Collect the minimum needed — see [Privacy](#6-data-privacy--security).

**India table-stakes (in MVP):**

- **Bulk / corporate / club group registration** — one coordinator registers many runners (CSV
  paste or repeat-add), pays once, gets **one GST invoice**. Common for corporates and clubs.
- **Coupon codes** — sponsor/club/influencer codes; percentage or flat discount; usage caps.
- **Early-bird tiered pricing** — fee auto-steps up by date or by registration count.
- **Spot / cash / offline capture** — admin adds walk-in/expo registrants to the roster with
  payment mode = cash / direct-UPI / comp.
- **Minors** — fun-run/kids categories require **guardian details + verifiable parental consent**
  (DPDP Act). Block minor self-registration without a guardian record.

### 1.3 Payments

Corral is **not** a payment aggregator. Use a licensed partner and onboard the organizer as
merchant / sub-merchant.

- **Provider:** **Razorpay Route (chosen)** — organizer onboarded as a Route *linked account* for
  split settlement so Corral never holds funds. Integrated behind a `PaymentPort` abstraction, so
  Cashfree Easy Split stays a drop-in alternative.
- **Methods:** UPI, cards, net banking, wallets (whatever the partner offers); UPI is dominant.
- **GST invoicing** — issue GST-compliant invoices on Corral's platform/convenience fee; handle
  organizers who are GST-registered vs. running under a club/trust/society (often non-GST).
- **Settlement** — define settlement timing (T+2/T+3). Many organizers need **pre-event
  settlement** to pay vendors (t-shirts, medals, timing); confirm partner supports it.
- **Refunds** — clear refund responsibility (organizer vs. Corral). Stay inside **RBI PA-PG
  guidelines**: do not hold participant funds beyond what the partner's sub-merchant model allows.
- **Status** — success/failure tracking, registration confirmation only after payment success,
  exportable payment + GST report.

### 1.4 Organizer roster

Clean participant dashboard: registered participants, payment status + mode (incl. cash/comp),
category, contact, emergency contact, BIB field, T-shirt size. Plus:

- Search / filter / sort; CSV export and CSV import-update; manual correction
- **T-shirt size summary** report (prevents over/under-ordering)
- Export in the **timing vendor's required format** (BIB, chip, name, category)

This is one of the most important MVP surfaces.

### 1.5 BIB management

Keep it simple in MVP: manual BIB entry, CSV upload of BIB numbers, duplicate-BIB warning, export
roster for printing. Automatic allocation comes later. Note BIB↔chip mapping is a common source of
result errors — keep the mapping exportable and correctable.

### 1.6 Communications — **WhatsApp-first**

In India, race and club comms run on WhatsApp; email open rates are poor and SMS now needs slow
TRAI registration. So:

- **Primary: Meta WhatsApp Cloud API (direct)** — official API straight from Meta (no BSP markup),
  Meta-approved template messages, delivery/read **status webhooks**. Wrapped behind a `WhatsAppPort`,
  so a BSP (e.g. Gupshup) remains a drop-in alternative. Begin **WABA + Business verification** early.
- **Fallback: SMS (MSG91) + email (Resend + React Email).** SMS requires **TRAI DLT** registration —
  entity registration, header (sender ID), and content-template approval; **begin now** (weeks of
  lead time before the first event). Both fronted by a `NotificationPort`.
- **English-only templates for MVP** — Tamil/bilingual is deferred; keep strings i18n-ready so Tamil
  can be added later without refactor.
- **Triggers:** registration confirmation, payment confirmation, race-day instructions, BIB/kit
  collection details, result-published, certificate-available.
- Reusable templates; delivery-status tracking in the admin console.

### 1.7 Participant event page

Mobile web (React 19 + Vite SPA on Cloudflare Pages), **no native app** in MVP. Includes: event
details, registration status, e-ticket, BIB (once assigned), race-day instructions, venue, result
link, certificate download. **English-only for MVP** (Tamil deferred, strings i18n-ready).

### 1.8 Results import

Core feature. CSV-first (see [Timing-vendor strategy](#3-timing-vendor-strategy--result-workflow)).

- CSV upload + flexible column mapping; BIB/name/category matching; validation of obvious errors
- Preview before publishing; publish/unpublish; manual correction
- **Rankings: overall, category, and age-group / Masters auto-ranking** (a top organizer pain —
  age-group prize math is done manually today). Optional **age-graded** results.
- Status handling: finished / DNF / DNS / disqualified
- MVP promise is *fast clean results*, **not** live timing: "Once we receive the timing CSV, we
  publish clean results quickly."

### 1.9 Certificates

After results publish, participants download certificates: template with name, event, distance,
finish time, rank (if applicable), **certificate ID**, downloadable PDF, shareable link.
**English-only for MVP** (Tamil deferred). Rendered **HTML/CSS → headless Chromium** (Puppeteer)
in the BullMQ worker, reusing the Tailwind design tokens, then stored on **Cloudflare R2** + CDN.
Likely the strongest early "wow."

### 1.10 Lightweight trust tools (in MVP)

Low build cost, high organizer empathy — these win trust and reflect real Coimbatore pain:

- **Permissions checklist (TN/Coimbatore-templated):** police/traffic NOC, Coimbatore City
  Municipal Corporation permission, ambulance/**108** + medical/first-aid, fire/safety NOC (where
  needed), **IPRS/PPL music license**, participant insurance. Checklist + reminders, not automation.
- **Race-day medical/emergency roster:** surface the emergency-contact + medical-declaration data
  you already collect as a printable/exportable sheet for the medical team and race control. Aligns
  with the SOS/medical alert tokens in [design-system.md](design-system.md).
- **Insurance add-on:** per-participant event accident insurance via a partner (Digit / ICICI
  Lombard / Acko). Sometimes required for permission; a trust + revenue lever.

### 1.11 Internal admin console (first-class product)

Corral staff can: create/edit events, help configure forms, view registrations, resend
confirmations, upload result CSVs, fix participant data, generate certificates, run the permissions
checklist, export the medical roster, handle support, and track payment / WhatsApp / SMS / email
delivery status. Plus an **audit log** for sensitive actions.

---

## 2. Phased Roadmap

### Phase 1 — Trust Loop
**Goal:** run 5 real Coimbatore events with no Corral-caused critical failure.

Build everything in [§1 MVP Module Specs](#1-mvp-module-specs) (core loop + India table-stakes +
lightweight trust tools + admin console).

**Do manually:** organizer onboarding, event creation, calendar seeding, BIB allocation if needed,
timing-vendor coordination, result correction, certificate setup, support, refunds, race-day backup.

**Success criteria:** see [§9 Metrics](#9-metrics).

### Phase 2 — Participant Delight
**Goal:** make Corral events visibly better for runners and families.

Add: participant account/profile, race history, personal result archive, finisher cards for
Instagram/Strava, basic photo albums (manual or BIB-based search — likely via a **photo partner**,
not built), saved/wishlisted events, Coimbatore race calendar, organizer event cloning, post-event
analytics, **expo/kit QR pickup**.

Still avoid full AI face recognition (until consent/cost/accuracy validated) and real-time tracking
(until timing-vendor reliability proven).

### Phase 3 — Race-Day Operations
**Goal:** become operationally valuable on race day.

Add: race-day dashboard, check-in mode, offline roster access, QR-based kit/BIB pickup at scale,
incident logging, volunteer-lite roles, timing-vendor integrations beyond CSV, split-based tracking
from timing mats, family notifications on splits, degraded/offline mode, race-day support SLAs.

### Phase 4 — Moat Expansion
**Goal:** defensibility and larger revenue.

Add (kept deliberately thin until validated): AI photo tagging / face-BIB recognition with explicit
consent, compliance/permission automation + TN templates, sponsor reporting & marketplace,
white-label event pages, multi-event organizer dashboard, insurance/merchandise partners, multi-city
expansion, native participant app (only if retention justifies it).

---

## 3. Timing-vendor strategy & result workflow

Do **not** build timing hardware, promise live timing, or depend on real-time APIs. Start with
**CSV-based result import**.

Indian timing is dominated by a few RFID chip-timing vendors (TimingTech, Aeon Timing, Racetime,
Chronotrack/MyLaps, etc.), each with its own export format — so define a canonical format but support
flexible CSV mapping.

**Canonical result fields:** BIB, name, gender/category, distance, start time (if available), finish
time, net/gun time (if available), overall/category/age-group rank (if available), status
(finished / DNF / DNS / DQ).

**Workflow:** vendor sends CSV → Corral uploads → map columns → validate → organizer previews →
organizer approves → publish → certificates generate.

---

## 4. Payments & compliance approach

- Partner with a **licensed payment provider** (**Razorpay Route**, behind a `PaymentPort`); use
  merchant/sub-merchant (Route linked-account) onboarding. Registration is confirmed only on a
  verified Razorpay **webhook** (idempotent handling).
- Keep PCI/payment complexity outside Corral; avoid holding participant funds (RBI **PA-PG**
  guidelines).
- Define explicitly: settlement flow + timing (incl. pre-event settlement), refund responsibility,
  gateway-fee handling, organizer **KYC**, **GST** invoicing on platform fee, and how non-GST
  organizers (club/trust/society) are handled.
- Before the first paid event: organizer agreement, participant terms, refund/cancellation policy,
  privacy policy, settlement terms, liability limitation, support terms.

---

## 5. Legal & contractual defaults (DPDP-framed)

**Organizer agreement** must clarify: what Corral provides / does not guarantee; organizer
responsibility for event safety and permissions; settlement process; refund responsibility; data
usage rights; liability limits; support scope; timing-vendor dependency; result-accuracy
responsibility; force majeure.

**Participant terms** must clarify: registration terms, refund policy, organizer responsibility,
medical declaration, waiver, data usage, communication consent (incl. WhatsApp opt-in),
certificate/result publishing.

**Privacy policy** (under **DPDP Act 2023**): what data is collected and why, who can access it,
retention, deletion/data-principal rights, vendor sharing, grievance officer contact.

---

## 6. Data privacy & security

**Principle:** collect the least data needed to run the event.

**Govern under the DPDP Act 2023:** lawful consent, data-principal rights (access/correction/
erasure), data-fiduciary obligations, breach notification, and **verifiable parental consent for
minors** (relevant — kids run the fun-run categories).

**Avoid in MVP:** face recognition, live location, biometrics, detailed medical history, permanent
public tracking links, unnecessary children's data.

**Collect only:** name, phone, email, DOB (for age-group), gender/category, emergency contact,
distance/category, payment status, waiver acceptance, basic medical declaration, guardian details
for minors.

**Security baseline:** role-based access (organizer/admin) via **Better Auth** with identity/PII in
our **own India-region Postgres** (DigitalOcean Bangalore — DPDP residency, no foreign auth SaaS
holding PII), HTTPS everywhere, encrypted storage at rest, audit logs for sensitive actions, secure
file uploads, **private CSVs served via signed URLs** (Cloudflare R2), least-privilege admin access,
regular backups, basic incident-response process. (Object storage on R2 is cross-border but
DPDP-permissible under the negative-list model; PII-bearing CSVs stay private + signed.)

---

## 7. Support model & race-day runbook

Early support **is** the product.

**Support tiers:** Basic (email + self-serve), Assisted (setup call, registration monitoring, result
+ certificate support), Race-Day (dedicated contact, event-day war room, fast escalation, backup
CSV/roster handling, post-event result support).

**Race-day runbook (every event):** organizer contact, timing-vendor contact, payment-support
contact, exported participant roster, exported emergency/medical roster, certificate template ready,
result-import template ready, WhatsApp/SMS/email templates ready, backup communication plan, issue
escalation process.

---

## 8. Discovery strategy

MVP: a manually maintained **"Coimbatore Running Calendar"** (Corral events + known local runs + club
runs), with date/distance/location filters. Goal is participant usefulness + organizer visibility,
not marketplace liquidity. Note **IndiaRunning** already aggregates Indian running events — Corral's
wedge is local depth, not a generic listing.

Future: automated discovery feed, personalized recommendations, featured/paid listings, club
following, repeat-registration funnel.

---

## 9. Metrics

**North Star:** *successful paid registrations processed per active organizer.*

### Phase 1 targets

| Metric | Target |
|---|---:|
| Paid events completed | 5 |
| Critical Corral-caused failures | 0 |
| Payment success rate | ≥ 98% |
| Result publishing time after clean CSV | < 60 min |
| Certificate accuracy | ≥ 99% |
| Participant confirmation delivery (WhatsApp) | ≥ 98% |
| Organizer repeat intent | ≥ 40% |
| Support issues resolved before race day | ≥ 95% |

### Future metrics

- **Organizer:** active organizers, events/organizer/year, repeat rate, free→paid conversion,
  revenue/event, support cost/event.
- **Participant:** registered participants, repeat runners, certificate downloads, result-page views,
  discovery→registration conversion, race-history engagement.
- **Operational:** payment failure rate, WhatsApp/SMS/email delivery rate, result error rate, refund
  rate, support response time, event-day incident count.

---

## 10. First 90-day execution plan

**Days 1–15 — Validation:** identify 10–15 Coimbatore clubs/organizers; interview 8–10; collect
sample registration forms + timing CSVs; understand payment/refund/GST practice; identify 2–3 timing
vendors; sign 2 design partners; draft pilot pricing (both models).

**Days 16–30 — Design & setup:** finalize MVP feature list; start **Razorpay Route** KYC; begin
**TRAI DLT** (MSG91) + **Meta WABA/Business verification** onboarding (long lead time); draft legal
docs (DPDP-framed); design event page, registration flow (incl. bulk/coupons), roster, admin console,
result-import workflow, certificate templates (English MVP).

**Days 31–60 — Build MVP:** event setup, registration (incl. group/coupon/early-bird/spot),
payments + GST, roster + size summary, CSV import/export, WhatsApp/SMS/email comms, participant page,
result import (+ age-group ranking), certificates, admin tools, permissions checklist + medical
roster.

**Days 61–75 — Pilot prep:** onboard first organizer, configure first event, test payment + GST
invoice, test confirmations across channels, test roster/BIB export, test result CSV + age-group
ranking, test certificate generation, prepare race-day runbook.

**Days 76–90 — First live event:** run it, white-glove support, publish results, generate
certificates, collect organizer + participant feedback, document failures/fixes, convert organizer to
a second event or a case study.

---

## 11. Architecture & tech stack

Finalized 2026-05-31 (one decision at a time, with the founder). **All TypeScript**; a dedicated
**Python** service is added only later if/when AI/ML work appears (out of MVP). The frontend is a
**Vite SPA (not Next.js)**; `design-system.md` has been aligned to match — the design tokens carry
over unchanged, with fonts self-hosted via Vite and the Tamil font deferred (English-only MVP).

### 11.1 Stack at a glance

| Layer | Choice |
|---|---|
| Monorepo | **Turborepo + pnpm** (shared packages between API and apps) |
| Frontend | **React 19 · Vite · TanStack Router · TanStack Query · shadcn/ui · Tailwind v4** |
| Backend | **NestJS** (TypeScript) |
| API contract | **ts-rest** (REST, Zod) in `packages/schema` — one FE/BE source of truth; OpenAPI emitted for webhooks/docs |
| Auth | **Better Auth** self-hosted (Drizzle adapter, PII in our Postgres); orgs/teams + RBAC, magic links, MFA-ready; NestJS guard |
| ORM / DB | **Drizzle ORM** · **PostgreSQL** |
| Jobs | **BullMQ + Redis** (worker process) |
| DB + Redis hosting | **DigitalOcean managed, Bangalore (BLR1)** — India residency |
| Object storage | **Cloudflare R2** + CDN (public certs/e-tickets/banners; private CSVs via signed URLs) |
| PDF generation | **HTML/CSS → headless Chromium** (Puppeteer) in the worker — certificates, GST invoices, e-tickets |
| Payments | **Razorpay Route** (linked-account split settlement) behind `PaymentPort` |
| WhatsApp | **Meta WhatsApp Cloud API (direct)** behind `WhatsAppPort` |
| SMS / email | **MSG91** (TRAI DLT) + **Resend/React Email** behind `NotificationPort` |
| Frontend hosting | **Cloudflare Pages** (both SPAs) |
| API/worker hosting | **DigitalOcean App Platform, Bangalore** (Docker; worker image bundles Chromium) |
| Observability | **Sentry** (all apps) + **BetterStack/UptimeRobot** uptime + heartbeat |
| Language scope | **English-only for MVP** (Tamil deferred; strings kept i18n-ready) |

Toolchain defaults: Zod as the shared schema layer (drizzle-zod ↔ ts-rest), drizzle-kit migrations,
Zod-validated env config, Vitest (unit) + Playwright (e2e) + Supertest (NestJS), pino logging,
GitHub Actions CI (lint/typecheck/test on Turborepo `--affected`, then deploy), Docker for api+worker.

### 11.1.1 Bootstrap boundary

The first scaffold pass is defined in [bootstrap-plan.md](bootstrap-plan.md) and intentionally builds
only the plumbing needed to prove the stack. It creates the monorepo, shared packages, Vite apps,
NestJS api/worker, Drizzle readiness, Redis/Postgres health checks, Docker/Railway/CI wiring, and a
sample UI page that consumes the shared health contract. It does **not** implement Better Auth,
domain tables, payment/WhatsApp/SMS/email/storage ports, Sentry instrumentation, PDF generation,
Razorpay/Meta/MSG91/R2 adapters, or business workflows. Those remain the next implementation phase
after the scaffold is green.

### 11.2 Monorepo layout

```
corral/                      # Turborepo + pnpm
  apps/
    web/                     # public participant SPA (Vite)
    console/                 # organizer + admin + race-day SPA (Vite, role-gated)
    api/                     # NestJS HTTP API (ts-rest, Better Auth, webhooks)
    worker/                  # NestJS + BullMQ processors (PDF, comms, CSV)
  packages/
    schema/                  # Zod schemas + ts-rest contracts (FE/BE source of truth)
    db/                      # Drizzle schema, migrations, repositories
    ui/                      # shadcn components + design tokens (design-system.md)
    config/                  # tsconfig bases + env helpers/presets
```

### 11.3 System diagram

```
   Participants ───────▶  Cloudflare Pages: apps/web (public SPA)         ┐ Cloudflare R2 + CDN
   Organizers/Admin ───▶  Cloudflare Pages: apps/console (auth SPA)        │ certs · e-tickets ·
                                  │ ts-rest (REST, Zod) — typed hooks      │ banners · (CSVs signed)
                                  ▼                                        ┘
        DigitalOcean App Platform · Bangalore (BLR1)
          apps/api (NestJS)                 apps/worker (NestJS + BullMQ)
          • ts-rest controllers             • PDF render (Chromium)
          • Better Auth (RBAC, orgs)        • WhatsApp/SMS/email sends
          • Drizzle repositories            • CSV parse + age-group ranking
          • ports: payment/whatsapp/notif   • settlement/recon · audit-log
          • webhooks: Razorpay, WhatsApp
              │                 │
        Postgres (DO mgd)   Redis (DO mgd, BullMQ)
              │
   external: Razorpay Route · Meta WhatsApp Cloud API · MSG91 · Resend
   cross-cutting: Sentry + BetterStack across all four apps
```

### 11.4 Ports & adapters (vendor isolation)

`PaymentPort` (Razorpay), `WhatsAppPort` (Meta Cloud), `NotificationPort` (MSG91 + Resend),
`StoragePort` (R2). Each integration sits behind an interface so vendors are **swappable and
mockable in tests** — supporting the "test all numbers / providers with real organizers" stance and
the §9 reliability targets.

### 11.5 Why these choices (traceability)

- **India residency (DPDP):** DO Bangalore for DB/Redis + self-hosted Better Auth keep PII in-country.
- **Share-heavy output:** R2's zero-egress + CDN suits certificates/e-tickets re-downloaded from
  WhatsApp links; HTML→Chromium gives on-brand, design-token-consistent PDFs.
- **One language end-to-end:** TypeScript + ts-rest/Zod gives a single typed contract across the
  monorepo, fastest for a small team; Python deferred to a future AI/ML service only.
- **Reliability (zero-failure goal):** payment confirmed only on verified webhook; async work isolated
  in the worker; Sentry + uptime/heartbeat for race-day visibility.

> **Onboarding lead-time reminder (start now):** Razorpay Route KYC, Meta **WABA + Business
> verification**, and **TRAI DLT** (MSG91) all have long lead times — kick these off in parallel with
> the build (per §10, days 16–30).
