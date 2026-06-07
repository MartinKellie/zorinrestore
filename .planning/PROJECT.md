# Rebuild Ledger (working title)

## What This Is

A personal AI/dev environment inventory tool for Martin's Zorin 18 Pro Linux machine. It scans the machine, detects what AI/dev-related tools, settings, libraries, editors, and configuration artefacts are installed, and presents them in a clean dashboard so the machine can be rebuilt more easily later. Not a full backup tool — a rebuild awareness tool.

## Core Value

A developer can scan their machine and immediately know what AI/dev things are installed, where they live, and what would need to happen to rebuild from scratch.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Local Python scanner runs on Zorin/Linux and uploads redacted inventory to Supabase
- [ ] Dashboard with magic-link login shows inventory grouped by category and restore importance
- [ ] Scanner token system: dashboard issues tokens, scanner uses them (no Supabase keys on local machine)
- [ ] OpenAI analysis triggered manually from dashboard (classify, suggest notes, importance, extra commands)
- [ ] AI-assisted discovery: OpenAI suggests safe scan commands, user approves, scanner runs them next time
- [ ] Review Queue for unknown/low-confidence scanner findings
- [ ] Secrets Checklist: stores names/reminders only, never values
- [ ] Export to machine-inventory.md and machine-inventory.json
- [ ] Scan folder management: user defines approved project roots, scanner fetches them before scanning

### Out of Scope

- Docker/Docker Compose scanning — deferred to Phase 2
- Multiple machines — one machine only in MVP
- Scan history / diffing — latest scan only in MVP
- Scheduled scans — manual only in MVP
- Windows scanner — Linux/Zorin first
- Full restore wizard — inventory view only, not automated restore
- Deep project summarisation — detect presence only, no content reading
- Shell config content reading — paths and presence only, no parsing of aliases/functions
- Full Linux package inventory — only dev/AI-relevant tools on fixed allowlist
- Browser extensions, desktop themes, VPN settings, startup apps — out of MVP scope

## Context

- **Platform**: Zorin 18 Pro (Ubuntu-based Linux laptop), single machine
- **Scanner**: Python CLI, run manually from repo (`python -m scanner scan`). Not packaged as a binary in MVP.
- **Upload path**: Scanner POSTs to a Vercel API route with a dashboard-issued token. API route validates token server-side and writes to Supabase. Scanner needs only app URL + token — no Supabase credentials on local machine.
- **AI-assisted discovery**: After initial scan, OpenAI may suggest extra read-only discovery commands. User approves/rejects them in the dashboard. Approved commands are fetched by the scanner on the next manual run and matched against a strict allowlist before execution.
- **Security non-negotiables**: Never store secret values. `.env` variable names only. Never read/upload private SSH key contents. Scanner token must be revocable. No live remote command execution. No destructive commands.
- **Vercel**: https://zorinrestore.vercel.app/
- **Supabase**: https://hzcxwonllrwrtruuagqc.supabase.co
- **GitHub**: https://github.com/MartinKellie/zorinrestore

## Constraints

- **Tech stack**: Next.js on Vercel, Supabase (auth + data), Python scanner, OpenAI for analysis — preferred stack, not negotiable without strong reason
- **Security**: Secret values must never be stored or transmitted. This is a hard rule throughout.
- **Scanner packaging**: MVP runs from repo with venv; no binary packaging until Phase 2+
- **Single user**: Personal tool for Martin only in MVP; no multi-user SaaS behaviour
- **UI**: Plain and functional MVP first. Design polish is explicitly deferred.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scanner uploads via Vercel API route, not direct Supabase | Scanner needs only app URL + token; no Supabase credentials on local machine | — Pending |
| Latest scan only (no history) | Reduces schema complexity; history deferred to Phase 2 | — Pending |
| OpenAI manually triggered only | No silent background AI; user always in control of analysis | — Pending |
| AI-suggested commands require dashboard approval + allowlist match | Security boundary: no arbitrary command execution | — Pending |
| Magic-link login (no passwords) | Simpler auth for single user; Supabase handles it natively | — Pending |

---
*Last updated: 2026-06-07 after initialization*
