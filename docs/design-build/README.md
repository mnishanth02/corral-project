# Corral — Design-Build Build-Spec Pack (index)

> This pack contains **build-ready screen build specs** for every Corral screen.
> Use these docs to build directly in the React apps: `apps/web` for participant screens and
> `apps/console` for organizer + admin screens. Build with in-repo mock fixtures, no backend integration,
> finalized navigation, and one screen at a time. Together with the main guide, this covers **all 82 unique screens**.

---

## Which document do I use?

| I need… | Use this | What's inside |
|---|---|---|
| Build loop, design-system reference, and spec template | [`../design-build-guide.md`](../design-build-guide.md) → **Part 0–2** | Screen-by-screen React build workflow, tokens/rules, and the build-spec template |
| Authoritative app, route, and navigation map | [`navigation-and-routes.md`](navigation-and-routes.md) | Canonical APP + ROUTE + route-file table, nav shells, breadcrumbs, redirects, and demo-state rules |
| **Foundations** (build these first) | [`../design-build-guide.md`](../design-build-guide.md) → **Part 3** | Components, primitives, mock utilities, personas, and participant/organizer/admin shells required before screen work |
| **Wave 1 (P0)** trust-loop screens | [`../design-build-guide.md`](../design-build-guide.md) → **Part 4 · Wave 1** | Build specs for all Wave-1 participant, organizer, admin, and shared screens |
| **Wave 2 (P1)** screens | the `wave2-*` files in **this folder** (see table below) | Build specs for the 28 Wave-2 screens |
| **Wave 3 (P2)** screens | [`wave2-shared-wave3.md`](wave2-shared-wave3.md) | Build specs for P-01 calendar and A-04 calendar seeding |
| Build tracking / status | [`../design-build-guide.md`](../design-build-guide.md) → **Part 5** | Per-screen Build Tracker with app, route, state, and review status |

**Follow the design-system reference (tokens + rules) and the screen's build spec; add the route per [`navigation-and-routes.md`](navigation-and-routes.md).**

---

## Wave 2 & 3 build-spec files (this folder)

| File | Screens / build specs | Surface · Theme |
|---|---|---|
| [`wave2-participant.md`](wave2-participant.md) | P-04, P-10 coupon component in P-11, P-10A, P-16, P-17, P-18, P-25 | Participant · mobile 390px · Light |
| [`wave2-organizer-a.md`](wave2-organizer-a.md) | O-08, O-10, O-13, O-15, O-16, O-17, O-18, O-19 | Organizer · desktop 1280px · Light + navy sidebar |
| [`wave2-organizer-b.md`](wave2-organizer-b.md) | O-03A, O-22, O-32, O-33, O-34, O-35 | Organizer · desktop 1280px · Light (O-35 + print-safe) |
| [`wave2-admin.md`](wave2-admin.md) | A-02, A-05, A-07, A-08 | Admin · Light (A-08 Dark command-center) |
| [`wave2-shared-wave3.md`](wave2-shared-wave3.md) | S-01, S-02, S-06 (shared) · P-01, A-04 (Wave 3) | Mixed — see each build spec |

Each screen entry has two parts: a **Requirements & plan comparison** block (required fields/states/data +
any gap the original stub omitted) and the **screen build spec**. Each screen's **APP + ROUTE** come from
[`navigation-and-routes.md`](navigation-and-routes.md), not from local interpretation.

---

## Full coverage map (82 screens)

Each screen's **APP + ROUTE** comes from [`navigation-and-routes.md`](navigation-and-routes.md).

- **Foundations:** KIT-1, KIT-2, KIT-3 → guide Part 3.
- **Wave 1 (P0):** participant P-02/03/05/06/07/08/09/11/12-15/19-24, organizer O-01/02/03/04/05-07/09/10A/11/12/14/20/21/23/24-31, admin A-01/03/06, shared S-03/04/05/07/08/09/10/11 → guide Part 4.
- **Wave 2 (P1, 28):** participant 7 + organizer 14 + admin 4 + shared 3 → the four `wave2-*` files above.
- **Wave 3 (P2, 2):** P-01, A-04 → `wave2-shared-wave3.md`.

---

## Standards every screen follows

Navy sidebar shell + table/drawer pattern · S-09 import-validation reuse · shared 14-label payment set ·
RBAC roles with audit reasons on sensitive actions · DPDP consent (required boxes default unchecked) ·
organizer-absorbed convenience fee (never a participant-paid row) · status always paired with icon + text ·
realistic Coimbatore content. All build specs were authored and cross-reviewed; the Wave-1 gap fixes
(insurance/GST rows, 14 payment labels, PII export/upload handling, publish/correction audit reasons,
manual-backup audit notes, leaderboard DNF/DNS/DQ + age-graded) are now applied directly in the guide.
