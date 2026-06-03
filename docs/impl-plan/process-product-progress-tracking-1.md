---
goal: Establish Product-Wide Progress Tracking for Corral
version: 1.0
date_created: 2026-06-03
last_updated: 2026-06-03
owner: Corral Engineering
tags: process, documentation, planning, ai-agent-handoff, product-tracking
---

# Introduction

This process plan establishes a deterministic progress-tracking workflow for Corral so human
developers and AI agents can identify completed work, active blockers, next priorities, and product
coverage against the MVP specification without relying on chat history.

## 1. Requirements & Constraints

- **REQ-001**: The product-wide progress tracker MUST live at `docs/product-progress.md`.
- **REQ-002**: Future feature-level implementation plans MUST live under `docs/impl-plan/`.
- **REQ-003**: Future implementation plans MUST use the naming convention
  `[purpose]-[component]-[version].md`.
- **REQ-004**: Every product capability in `docs/implementation-plan.md#1-mvp-module-specs` MUST be
  represented in `docs/product-progress.md`.
- **REQ-005**: Each capability row MUST include status, source spec, implementation plan, code areas,
  evidence/blockers, and next action.
- **REQ-006**: Future agents MUST update `docs/product-progress.md` after completing or blocking a
  slice.
- **REQ-007**: Future agents MUST update the relevant implementation-plan task checklist after
  completing or validating tasks.
- **REQ-008**: A feature MUST NOT be marked `Done` without test/manual verification evidence.
- **CON-001**: Product strategy remains in `docs/plan.md`.
- **CON-002**: Detailed product specs remain in `docs/implementation-plan.md`.
- **CON-003**: This process MUST NOT duplicate full requirements from the product specs; it tracks
  execution state and links back to the source specs.
- **GUD-001**: Keep tracker updates short, factual, and evidence-based.
- **GUD-002**: Prefer updating existing rows over adding duplicate rows for the same capability.
- **PAT-001**: Use the status vocabulary defined in `docs/product-progress.md`.

## 2. Implementation Steps

### Implementation Phase 1 — Create the tracker

- **GOAL-001**: Add a product-wide tracker that future agents can use as the first source of
  execution state.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `docs/product-progress.md` with required agent workflow, status vocabulary, and definition of done. | ✅ | 2026-06-03 |
| TASK-002 | Add the current foundation/auth implementation checkpoint to `docs/product-progress.md`. | ✅ | 2026-06-03 |
| TASK-003 | Map every MVP module from `docs/implementation-plan.md#1-mvp-module-specs` into the tracker. | ✅ | 2026-06-03 |
| TASK-004 | Add active decisions, open questions, and the next work queue to `docs/product-progress.md`. | ✅ | 2026-06-03 |

### Implementation Phase 2 — Make the tracker discoverable

- **GOAL-002**: Link the tracker from the main project entry points.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Add `docs/product-progress.md` to `README.md` as the current progress source of truth. | ✅ | 2026-06-03 |
| TASK-006 | Add `docs/product-progress.md` to `docs/implementation-plan.md` as the execution-state companion. | ✅ | 2026-06-03 |

### Implementation Phase 3 — Backfill existing completed feature plans

- **GOAL-003**: Align existing implementation-plan checklists with known completed work.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Backfill `docs/impl-plan/feature-auth-better-auth-1.md` task completion marks after `auth:seed-admin`, tests, and build are revalidated. |  |  |

## 3. Alternatives

- **ALT-001**: Track progress only inside chat history. Rejected because future agents cannot rely on
  prior conversations for complete execution state.
- **ALT-002**: Track progress only inside individual implementation plans. Rejected because product
  managers and agents need a product-wide capability matrix.
- **ALT-003**: Use an external project-management tool first. Rejected because the repository needs a
  versioned source of truth that travels with code changes.

## 4. Dependencies

- **DEP-001**: `docs/plan.md` for product strategy and MVP boundaries.
- **DEP-002**: `docs/implementation-plan.md` for detailed module specs and roadmap.
- **DEP-003**: `docs/bootstrap-plan.md` for scaffold/tooling decisions.
- **DEP-004**: `docs/impl-plan/feature-auth-better-auth-1.md` for current auth implementation state.

## 5. Files

- **FILE-001**: `docs/product-progress.md` — live product progress tracker.
- **FILE-002**: `docs/impl-plan/process-product-progress-tracking-1.md` — this process plan.
- **FILE-003**: `README.md` — discovery link for humans and agents.
- **FILE-004**: `docs/implementation-plan.md` — discovery link near the top of the execution spec.

## 6. Testing

- **TEST-001**: Manual documentation check that `docs/product-progress.md` exists.
- **TEST-002**: Manual documentation check that each MVP module in `docs/implementation-plan.md#1-mvp-module-specs` has a tracker row.
- **TEST-003**: Manual documentation check that README links to `docs/product-progress.md`.
- **TEST-004**: Manual documentation check that `docs/implementation-plan.md` links to `docs/product-progress.md`.

## 7. Risks & Assumptions

- **RISK-001**: The tracker can become stale if future agents skip updates. Mitigation: README and
  implementation-plan links instruct agents to read/update it first.
- **RISK-002**: Status rows can become too verbose. Mitigation: keep detailed execution tasks inside
  `docs/impl-plan/*` and keep this tracker summary-level.
- **ASSUMPTION-001**: Repository markdown files are the correct durable handoff mechanism for AI
  agents and human developers.
- **ASSUMPTION-002**: Existing auth implementation is mostly complete but still requires validation
  evidence before being marked fully `Done` in the tracker.

## 8. Related Specifications / Further Reading

- [Corral Product Progress Tracker](../product-progress.md)
- [Corral Product Plan](../plan.md)
- [Corral Implementation Plan](../implementation-plan.md)
- [Corral Bootstrap Plan](../bootstrap-plan.md)
- [Better Auth Implementation Plan](feature-auth-better-auth-1.md)
