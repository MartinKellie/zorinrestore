---
phase: 3
slug: dashboard
status: draft
nyquist_compliant: false
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
| 3-01-01 | 01 | 1 | INV-01 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | INV-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | INV-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | REVQ-01 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | REVQ-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | REVQ-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | SEC-01 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | SEC-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 2 | SEC-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 3 | EXP-01 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 3 | EXP-02 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/api/inventory.test.ts` — stubs for INV-01 through INV-09
- [ ] `tests/api/review-queue.test.ts` — stubs for REVQ-01 through REVQ-03
- [ ] `tests/api/secrets.test.ts` — stubs for SEC-01 through SEC-04
- [ ] `tests/api/export.test.ts` — stubs for EXP-01 through EXP-04
- [ ] `tests/db/migration-0003.test.ts` — migration schema validation

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
