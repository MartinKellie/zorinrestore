---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Wave 0 installs) |
| **Config file** | `vitest.config.ts` — Wave 0 creates |
| **Quick run command** | `npx vitest run tests/tokens.test.ts tests/upload-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/tokens.test.ts tests/upload-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test checklist complete
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| AUTH-01 | TBD | 1 | AUTH-01 | unit | `npx vitest run tests/auth.test.ts -t "signInWithMagicLink"` | ❌ W0 | ⬜ pending |
| AUTH-02 | TBD | 1 | AUTH-02 | manual | Sign in, refresh, verify session persists | manual-only | ⬜ pending |
| AUTH-03 | TBD | 1 | AUTH-03 | unit | `npx vitest run tests/proxy.test.ts -t "redirects unauthenticated"` | ❌ W0 | ⬜ pending |
| TOKEN-01 | TBD | 1 | TOKEN-01 | unit | `npx vitest run tests/tokens.test.ts -t "stores hash not plaintext"` | ❌ W0 | ⬜ pending |
| TOKEN-02 | TBD | 1 | TOKEN-02 | unit | `npx vitest run tests/tokens.test.ts -t "generates scan command"` | ❌ W0 | ⬜ pending |
| TOKEN-03 | TBD | 1 | TOKEN-03 | unit | `npx vitest run tests/tokens.test.ts -t "revokes token"` | ❌ W0 | ⬜ pending |
| TOKEN-04 | TBD | 1 | TOKEN-04 | unit | `npx vitest run tests/upload-route.test.ts` | ❌ W0 | ⬜ pending |
| MACH-01 | TBD | 1 | MACH-01 | unit | `npx vitest run tests/machines.test.ts -t "upsertMachine"` | ❌ W0 | ⬜ pending |
| MACH-02 | TBD | 1 | MACH-02 | unit | `npx vitest run tests/upload-route.test.ts -t "updates machine metadata"` | ❌ W0 | ⬜ pending |
| SET-01 | TBD | 2 | SET-01 | manual | Load Settings, verify logged-in email shown | manual-only | ⬜ pending |
| SET-02 | TBD | 2 | SET-02 | manual | Generate token, verify hash in DB, revoke, verify 401 | manual-only | ⬜ pending |
| SET-04 | TBD | 2 | SET-04 | manual | Edit machine name, reload, verify persisted | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — framework setup with React + jsdom
- [ ] `tests/tokens.test.ts` — covers TOKEN-01, TOKEN-02, TOKEN-03
- [ ] `tests/upload-route.test.ts` — covers TOKEN-04, MACH-02
- [ ] `tests/proxy.test.ts` — covers AUTH-03
- [ ] `tests/machines.test.ts` — covers MACH-01
- [ ] `tests/auth.test.ts` — covers AUTH-01

**Install command:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser refresh | AUTH-02 | Requires real browser + Supabase session cookie | Sign in via magic-link, refresh page, verify still logged in |
| Settings page shows logged-in email | SET-01 | Requires real auth session | Load /settings, verify email displayed from getUser() |
| Token generate + revoke flow | SET-02 | Requires real DB + API calls | Generate token, copy command, revoke, verify POST to /api/scanner/upload returns 401 |
| Machine name edit persists | SET-04 | Requires real DB write | Edit machine name in Settings, reload, verify name persisted |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
