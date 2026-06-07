---
phase: 3
slug: dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | INV-06, INV-07, INV-08 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | INV-06, INV-07, INV-08, REVQ-02, SEC-02, SEC-03, EXP-01, EXP-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | INV-06, INV-07, INV-08 | unit | `npx vitest run tests/inventory.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | REVQ-01, REVQ-02 | unit | `npx vitest run tests/review.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | SEC-01, SEC-02, SEC-03 | unit | `npx vitest run tests/secrets.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | EXP-01, EXP-02, EXP-03, EXP-04 | unit | `npx vitest run tests/export-route.test.ts` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 3 | INV-01–INV-09, REVQ-01, SEC-04 | integration | `npx tsc --noEmit` | N/A | ⬜ pending |
| 3-06-01 | 06 | 4 | REVQ-01, REVQ-02, REVQ-03 | spec | `wc -l REVIEW_QUEUE_UI_SPEC.md` | N/A | ⬜ pending |
| 3-06-02 | 06 | 4 | SEC-01, SEC-02, SEC-03, SEC-04 | spec | `wc -l SECRETS_CHECKLIST_UI_SPEC.md` | N/A | ⬜ pending |
| 3-07-01 | 07 | 5 | EXP-01, EXP-02, EXP-03, EXP-04 | spec+gate | `npx vitest run` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/inventory.test.ts` — stubs for INV-06, INV-07, INV-08 Server Actions
- [ ] `tests/review.test.ts` — stubs for REVQ-01, REVQ-02 (classifyReviewItem)
- [ ] `tests/secrets.test.ts` — stubs for SEC-02, SEC-03 Server Actions
- [ ] `tests/export-route.test.ts` — stubs for EXP-01, EXP-02 export route auth

All four files are created by plan 03-01 Task 2. They intentionally fail RED until Wave 2 plans implement the modules.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inventory grouped by category and importance tier renders correctly | INV-01 | React component rendering | Open dashboard, verify grouping matches DB data |
| Item detail drawer opens and shows all fields | INV-02 | UI interaction | Click item, verify all fields present including expandable debug section |
| Edit form persists changes | INV-03 | UI + persistence | Edit importance/notes, reload, verify changes persist |
| Review Queue classification moves item to main inventory | REVQ-03 | UI state transition | Classify item, verify it appears in inventory and not in queue |
| Secrets Checklist adds manual reminders | SEC-02 | UI form | Add manual reminder, verify it persists after reload |
| Export downloads valid .md and .json files | EXP-01, EXP-02 | File download | Trigger export, verify file content and structure |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
