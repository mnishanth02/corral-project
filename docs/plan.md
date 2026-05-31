# Corral — Product Plan

> Strategy lives here. All spec-level and execution detail — module specs, phased roadmap, the
> 90-day plan, payments/compliance, legal, privacy, support runbook, metrics, and the
> **architecture & tech stack** — lives in [implementation-plan.md](implementation-plan.md).

---

## 1. Positioning & vision

**Working title:** Corral.

**Near-term promise (first 5–10 customers):**
> "We help you run registrations, communicate with runners on WhatsApp, publish results, and issue
> certificates — with hands-on support from the Corral team."

**Long-term vision:** an operating system for running events in India — registrations, race-day
operations, results, photos, certificates, compliance, and growth, from one platform.

**Positioning discipline:** for v1, do **not** sell Corral as a full event OS. That creates
expectations and race-day risk we can't yet absorb. Sell the narrow, trustworthy loop and earn the
right to expand.

---

## 2. The problem (why this, why now)

Running-event organizers in India don't lack tools — they juggle too many: a ticketing platform or
Google Form, WhatsApp groups, Excel, a timing vendor, manual certificate generation, and a
photographer's Drive link. The seams between these tools are where the pain lives. For a Coimbatore
club race director, that pain is specific:

- **Communication is on WhatsApp** — but managed by hand, group by group.
- **Age-group / Masters prize math is manual** — and error-prone.
- **Expo / BIB-collection day is chaos** — long queues, paper lists.
- **Permissions are a grind** — police/traffic NOC, City Corporation, ambulance/medical, music
  license, insurance.
- **Payments mean GST invoices, settlement timing, and refunds** — handled ad hoc.
- **Timing CSVs need cleanup**, and **results + certificates arrive late**, making the organizer
  look unprofessional.

Corral solves the most painful, repeatable workflow first:

> **Registration → Roster → Communicate (WhatsApp) → Results → Certificates**

Once that loop is trusted, Corral expands into race-day operations, photos, a participant app,
compliance, sponsor reporting, and multi-event tooling.

---

## 3. Competitive landscape & wedge

Organizers today reach for **Townscript** (the popular India run-registration default, now part of
BookMyShow), **IndiaRunning** (events aggregator), **BookMyShow** (big events), or **Fitpage**, plus
separate **timing** and **photo** vendors — often stitched together with Google Forms and WhatsApp.

These are mostly **generic ticketing**. Corral's wedge:

- **WhatsApp-native** communication, not email-first.
- **Goes past registration** into clean results, **age-group ranking**, and instant certificates.
- **Local depth + white-glove** support in Coimbatore that a national platform won't give a
  200–1,500-runner club race.
- **Trust tools** (permissions checklist, medical roster, insurance) generic ticketing ignores.

We don't replace the timer or the photographer — we make the organizer's whole event feel handled.

---

## 4. Target market & first persona

**Beachhead: Coimbatore, Tamil Nadu** — a manageable market with a real running-club ecosystem,
where we can build organizer relationships, support events physically, learn local permission/vendor
workflows, and go deep before expanding city by city.

**First persona — the Club Race Director** organizing a **200–1,500 participant** event. Today their
registration data is scattered, payment tracking manual, comms messy, BIB allocation error-prone,
timing output needs cleanup, and results + certificates run late. What they want: low-stress
execution, clean registration/payment data, easy participant comms, fast results, instant
certificates, low cost, and **zero race-day failure**.

*(Future personas — pro organizers, corporate CSR runs, colleges, NGOs, timing/photo partners,
sponsors — are explicitly not the v1 focus.)*

---

## 5. Guiding principle & pricing stance

> **The organizer pays. The participant experience is free.**

Participants never pay a subscription. Organizer revenue comes from a platform fee plus paid support
packages and, later, premium add-ons. **0% take-rate on the registration fee at launch.**

On *how* the platform fee is charged, support **both** India-common models and let each organizer
choose:

- **Flat per-event fee** — simple, predictable for a club.
- **Per-registration convenience fee** — the India norm; scales with event size; can be
  organizer-absorbed or participant-paid at checkout.

---

## 6. MVP definition

The MVP is **a trusted registration-to-results system for small and mid-sized Coimbatore running
events** — one organizer running one real event with confidence. It is the core loop **plus the
India table-stakes that make it actually usable for an Indian run**:

- **Event page** + configurable **registration** (standard fields + waiver/medical declaration)
- **WhatsApp-first communications** (Meta WhatsApp Cloud API) with SMS/email fallback. **English-only
  for MVP** — Tamil/bilingual is deferred (strings kept i18n-ready so Tamil can be added later)
- **Bulk / corporate / club group registration** — one payment, one **GST invoice**
- **Coupon codes** + **early-bird tiered pricing**
- **Spot / cash / offline registration** capture in the roster
- **Payments via a licensed partner** (sub-merchant model; UPI/cards/netbanking) with GST invoicing
- **Organizer roster** — search/filter, CSV import/export, T-shirt size summary, manual correction
- **BIB management** (manual + CSV, duplicate warning, print export)
- **Results import** (CSV mapping, preview/publish) with **overall, category, and age-group / Masters
  auto-ranking**
- **Certificates** — instant, shareable, with certificate IDs (**English-only for MVP**; Tamil deferred)
- **Participant mobile page** — e-ticket, BIB, instructions, results, certificate
- **Lightweight trust tools** — TN/Coimbatore **permissions checklist**, race-day
  **medical/emergency roster**, **insurance** add-on
- **Internal admin console** — so Corral can run any of the above white-glove for early customers

Full specs for each: [implementation-plan.md §1](implementation-plan.md#1-mvp-module-specs).

**Participant experience is mobile web — no native app in MVP.** Discovery is a manually maintained
"Coimbatore Running Calendar."

---

## 7. Explicitly out of MVP

To protect the trust loop, exclude: native app, live tracking, AI photo tagging / face recognition
(a *partnership* opportunity later, not a build), public location sharing, full compliance
automation, volunteer/procurement management, race-day command center, sponsor marketplace/ROI,
merchandise, white-label apps, timing hardware, real-time timing APIs, advanced route planning,
budget builder, and resale/refund-marketplace flows.

---

## 8. Business model (summary)

0% take-rate on registration fees at launch. Revenue = platform fee (flat **or** per-registration —
see §5) + support packages + later add-ons.

| Package | Indicative price | Includes |
|---|---:|---|
| Starter Pilot | ₹5,000–₹10,000 / event | Event page, registration, roster, results, certificates |
| Assisted Event Pack | ₹15,000–₹30,000 / event | Starter + setup help, comms support, certificate customization, result assistance |
| Race-Day Support Pack | ₹30,000–₹50,000 / event | Assisted + dedicated race-day war-room |
| Design Partner | ₹0–₹5,000 / event | Case study, feedback, repeat-use commitment |

Per-event pricing is easier than annual SaaS for club RDs at launch. Test all numbers with real
organizers; richer Free / Pro / Enterprise tiers come after Phase 1.

---

## 9. Key risks

| Risk | Impact | Mitigation |
|---|---|---|
| Payment / GST / RBI PA-PG mistakes | Critical | Licensed partner + sub-merchant model, legal review, clear settlement + GST terms |
| Race-day failure | Critical | Narrow MVP, manual backup, support runbook |
| Organizer unwilling to pay | High | Offer both pricing models; test with design partners |
| Scope creep | High | Explicit "out of MVP" list |
| DPDP / privacy breach | Critical | Data minimization, DPDP Act 2023 compliance, no biometrics/location in MVP |
| Cold start | High | Go deep in Coimbatore, seed the calendar, white-glove first organizers |

Full risk register + compliance detail → [implementation-plan.md §4–§6](implementation-plan.md#4-payments--compliance-approach).

---

## 10. Phase-1 success criteria

- 5 paid Coimbatore events completed, **zero critical Corral-caused failures**
- Payment success rate ≥ 98%
- Results published < 60 min after a clean timing CSV
- Certificate accuracy ≥ 99%; participant confirmation delivery ≥ 98%
- ≥ 40% of organizers commit to using Corral again

Phased roadmap, 90-day plan, and full metrics → [implementation-plan.md §2, §9, §10](implementation-plan.md#2-phased-roadmap).

---

## 11. The guiding decision

> **Win trust before expanding scope.**

Early customers won't remember the feature count. They'll remember whether registration worked,
payments worked, the roster was clean, runners were informed, results were fast, certificates were
correct, and Corral showed up when it mattered. Get that right, and we earn the right to build the
bigger Corral.
