# Project Research Summary

**Project:** Rebuild Ledger (zorinrestore)
**Domain:** Personal dev machine inventory / rebuild awareness tool
**Researched:** 2026-06-07
**Confidence:** HIGH

## Executive Summary

Rebuild Ledger is a single-user personal tool that scans a Linux developer machine, detects installed AI/dev tools and configuration artefacts, and presents them in a structured dashboard to support machine rebuilds. The canonical build pattern for this type of tool is a local Python CLI that discovers tools via a fixed allowlist and ships results to a hosted API gateway — keeping cloud credentials off the local machine entirely. The dashboard (Next.js on Vercel + Supabase) acts as both the UI and the secure upload endpoint. OpenAI provides on-demand classification that elevates the tool beyond a glorified `dpkg --list`.

The recommended approach is a three-tier architecture: Python scanner on the local machine, Vercel API routes as the security boundary, and Supabase as the data store and auth provider. The scanner communicates only via an opaque token issued by the dashboard; it never holds Supabase credentials. This is the defining architectural constraint and everything else follows from it. The tech stack (Next.js 16, Python 3.11+, `typer`, `httpx`, `pydantic`, `@supabase/ssr`) is fully pinned against current stable versions and carries no meaningful upgrade risk for MVP.

The primary risks are security-related, not architectural. Command injection via AI-suggested shell commands, accidental secret value leakage in scan payloads, and auth bypass via Supabase `getSession()` misuse are all well-understood pitfalls with clear prevention strategies. The schema must also encode a `scan_runs` foreign key from day one — even though MVP only needs the latest scan — because retrofitting it after data exists is an expensive migration. These risks are manageable if addressed in Phase 1 before any data flows through the system.

---

## Key Findings

### Recommended Stack

The stack is fully determined by the project constraints (Vercel deployment, Supabase auth, Python scanner on Zorin Linux) and confirmed against current official docs. No alternative evaluation is needed.

**Core technologies:**
- **Next.js 16 + React 19** (Vercel) — App Router dashboard and API gateway; Turbopack default; `proxy.ts` replaces `middleware.ts`; Node 20.9+ required
- **Supabase** (hosted) — Postgres + magic-link auth + RLS; `@supabase/ssr` is the required Next.js integration package (the older `auth-helpers-nextjs` is deprecated)
- **Python 3.11+** — scanner runtime; ships on Zorin 18 Pro by default; `typer` for CLI, `httpx` for upload, `pydantic` v2 for payload schema, `uv` for dependency management
- **OpenAI API (gpt-4o)** — structured output analysis triggered manually from dashboard; Zod schema on the JS side, Pydantic on the Python side
- **`@supabase/ssr` + `@supabase/supabase-js` 2.107.x** — cookie-based sessions with the two-client pattern (server util + browser util)

**Critical version notes:**
- Next.js 16 renames `middleware.ts` to `proxy.ts`; `params` and `cookies()` are now async Promises
- New Supabase projects (post 2026-05-30) require explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated` in every migration — RLS alone is not sufficient
- Pydantic v2 is incompatible with v1 model syntax; do not mix

### Expected Features

**Must have (table stakes) — v1:**
- Python scanner: tool detection from a fixed allowlist (~100 dev/AI tools), with install path and version
- Scanner upload via Vercel API route using a dashboard-issued opaque token
- Dashboard: magic-link login, inventory view grouped by category and importance tier
- Token issuance and revocation UI
- Secrets Checklist: `.env` variable names and SSH key names only — never values
- Export to `machine-inventory.md` and `machine-inventory.json`
- Scan folder management: user defines approved project roots, scanner fetches before each run
- Restore importance tiers per item (Essential / Useful / Optional / Ignore), editable

**Should have (differentiators) — v1.x after validation:**
- OpenAI classification pass: auto-annotates items with importance, restore notes, and review flags
- Review Queue: surface low-confidence scanner detections for manual classification
- MCP server and Claude skills inventory: scan `~/.claude/`, `claude_desktop_config.json`

**Defer to v2+:**
- AI-suggested discovery commands with approval gate
- Scan history and diffing
- Multi-machine support
- Docker/Docker Compose scanning
- Scheduled scans

**Anti-features (deliberately excluded):** storing `.env` values, automatic restore, reading shell config content, full Linux package inventory.

### Architecture Approach

The system has four tiers with a strict one-way trust model. The scanner (local machine) holds only an opaque token and the Vercel URL — never Supabase credentials. Vercel API routes act as the authenticated gateway, validating the token and writing to Supabase via a service-role client. The dashboard (Next.js Server Components) reads from Supabase via a user-scoped `@supabase/ssr` client that respects RLS. OpenAI is called only from Vercel API routes, never from client components.

**Major components:**
1. **Python scanner** — `CollectorRegistry` auto-discovers modules in `collectors/`; each `BaseCollector` returns `list[ScanItem]`; a `redact.py` gate strips all secret values before upload
2. **Vercel API routes** — `/api/scanner/upload` (token validation + DB upsert), `/api/scanner/config` (returns approved folders/commands), `/api/analysis` (OpenAI call + DB write)
3. **Next.js dashboard** — Server Components read inventory directly from Supabase; `proxy.ts` calls `getUser()` on every request to protect all `/dashboard` routes
4. **Supabase** — `scan_items`, `scan_runs`, `scanner_tokens`, `scan_config`, `secrets_checklist` tables; RLS on; GRANTs explicit in all migrations

**Key patterns:**
- Opaque token (SHA-256 hash in DB, not JWT) for scanner auth — hard revocability without denylist overhead
- Hybrid fixed + JSONB schema: typed columns for core fields, `metadata jsonb` with GIN index for tool-specific data
- Full scan replace on each upload (delete all + re-insert), but a `scan_runs` FK preserves the upgrade path to scan history
- `getUser()` exclusively in server code — never `getSession()` — to prevent auth bypass

### Critical Pitfalls

1. **AI-suggested command injection** — Use `subprocess.run([binary, *args], shell=False)` always; validate each token in the args list against a whitelist before execution; store commands as structured `{binary, args[]}` not free-form strings. Must be in place before AI-assisted discovery is wired up.

2. **Accidental secret value leakage in scan payload** — Scanner must have a tested serialisation gate: a unit test that feeds a real-looking `.env` through the serialiser and asserts the output contains zero values. Parse `.env` files with a regex that stops at `=`, never beyond. Strip credentials from git remote URLs via `urllib.parse`.

3. **`getSession()` in server components** — Always use `supabase.auth.getUser()` in middleware and server-side auth checks; it re-validates with the Auth server. `getSession()` trusts the cookie without re-validation and can be spoofed.

4. **Missing GRANTs on new Supabase project** — Every migration must include explicit `GRANT ... TO authenticated`. The service-role upload path works without grants (hiding the bug), but the dashboard's authenticated client will silently return empty arrays until grants are added.

5. **Flat schema without `scan_run_id`** — Even in MVP (latest scan only), create a `scan_runs` table and add the FK to `scan_items`. The MVP query just filters to the latest run. Without this, adding scan history in Phase 2 requires a destructive migration.

6. **`shutil.which()` missing tools in non-login-shell PATH** — Add per-tool canonical path probes (`~/.nvm/nvm.sh`, `~/.cargo/bin/cargo`, `~/.pyenv/bin/pyenv`) as fallback alongside PATH lookup. The scanner runs in a non-interactive Python subprocess, not a login shell.

---

## Implications for Roadmap

Dependencies drive the phase order: the dashboard and token system must exist before the scanner can upload anything; data must exist before the dashboard view is useful; data must exist before AI analysis can run.

### Phase 1: Foundation — Schema, Auth, Token System, Upload Gateway

**Rationale:** Every other component depends on this. The scanner cannot run without a token. The dashboard cannot show anything without data. The upload API route is the trust boundary that everything else flows through. All of the "Never" technical debt items (secret gate, scan_run_id FK, GRANTs, token revocation) must be correct here before any real data enters the system.

**Delivers:** Deployable Vercel app with Supabase schema, magic-link login, token issuance/revocation UI, and a working `/api/scanner/upload` endpoint.

**Addresses:** Token issuance (P1), scanner upload plumbing (P1), schema correctness

**Avoids (from Pitfalls):** Missing GRANTs (Pitfall 6), flat schema without scan_run_id (Pitfall 10), raw token stored in DB, scanner token not revocable (Pitfall 4)

**Research flag:** Standard patterns — skip `/gsd:research-phase`. Supabase auth + Next.js App Router is thoroughly documented.

---

### Phase 2: Python Scanner — Core Detection and Upload

**Rationale:** With the upload endpoint live, the scanner can be built and tested end-to-end. The CollectorRegistry pattern and dual PATH+path-probe strategy must be established here. The secret-value redaction gate must be in place and unit-tested before the first real scan.

**Delivers:** Working `python -m scanner scan` command that detects editors, runtimes, package managers, shell config paths, git config, SSH key metadata, and `.env` key names — then uploads via token to the Phase 1 endpoint.

**Addresses:** Scanner tool detection (P1), scan folder management (P1), secrets checklist scanning (P1)

**Avoids (from Pitfalls):** Secret value leakage (Pitfall 2), PATH probe gaps (Pitfall 8), version parsing crashes (Pitfall 9), command injection foundation (Pitfall 1 — `shell=False` enforced from the start)

**Research flag:** Standard patterns for the CollectorRegistry and subprocess usage. May need spot research on JetBrains IDE detection on Linux (Toolbox installs to a non-standard path).

---

### Phase 3: Dashboard — Inventory View, Secrets Checklist, Export

**Rationale:** Once data is in Supabase, the dashboard view becomes meaningful. This phase delivers the primary user-facing value of the tool. Server Components make this straightforward — no client-side state management needed for read-heavy inventory display.

**Delivers:** Dashboard inventory view (grouped by category, importance tiers, confidence badges), Review Queue for low-confidence items, Secrets Checklist view, Export to `.md` and `.json`.

**Addresses:** Inventory dashboard view (P1), importance tiers (P1), secrets checklist (P1), export (P1), review queue (P2)

**Avoids (from Pitfalls):** `getSession()` misuse (Pitfall 3), ISR/CDN caching authenticated pages (Pitfall 5), low-confidence items mixed with high-confidence (Pitfall 11), stale scan date not shown

**Research flag:** Standard patterns. Next.js Server Components + Supabase data fetch is well-documented. No deep research needed.

---

### Phase 4: AI Analysis — OpenAI Classification and MCP Inventory

**Rationale:** AI analysis requires inventory data to exist. It also requires the Review Queue to be in place so AI-generated uncertainty can flow into the right UI bucket. This phase adds the highest-value differentiator after the core tool is validated.

**Delivers:** Manually triggered OpenAI classification pass that annotates each scan item with importance, restore notes, and review flag. MCP server and Claude skills inventory scanning.

**Addresses:** AI classification (P2), MCP/Claude skills inventory (P2)

**Avoids (from Pitfalls):** Prompt injection via scan data in OpenAI context (Pitfall 7), OpenAI cost runaway (structured output + manual trigger only), streaming response anti-pattern

**Research flag:** Recommend `/gsd:research-phase` for the OpenAI prompt design — specifically: system/user message split to prevent prompt injection from adversarial tool names, and prompt language for importance classification in a developer machine context.

---

### Phase 5: AI-Assisted Discovery (v2)

**Rationale:** AI-suggested discovery commands require the full allowlist validation infrastructure and a trust baseline from Phase 4. This is the most security-sensitive feature and must not be rushed.

**Delivers:** OpenAI suggests additional read-only scan commands based on detected tooling gaps; user approves in dashboard; scanner fetches and executes approved commands on next run.

**Addresses:** AI-suggested discovery (P3)

**Avoids (from Pitfalls):** Command injection (Pitfall 1) — the full `[binary, *args]` validation pipeline must be complete and audited before this phase ships.

**Research flag:** Needs `/gsd:research-phase` for the allowlist design — specifically, what the minimum safe command vocabulary looks like for a developer machine, and how to decompose AI output into structured `{binary, args[]}` form before storage.

---

### Phase Ordering Rationale

- Auth and schema come first because every other component has a hard dependency on them.
- The scanner comes before the dashboard view because the dashboard has nothing to show without scan data.
- AI analysis comes after the review queue UI because AI triage flows directly into the review queue.
- AI-assisted discovery is last because it is the highest-risk feature and requires a validated trust foundation.
- The "never" items from Pitfalls (secret gate, scan_run_id FK, GRANTs, `getSession()` avoidance) are all Phase 1 concerns — if they are wrong later, recovery is expensive.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official docs and current npm/PyPI pages. Next.js 16 breaking changes from official upgrade guide. |
| Features | HIGH (core), MEDIUM (AI/MCP) | Core categories well-established via comparable tools. AI-augmented features and MCP-specific patterns are newer with less community documentation. |
| Architecture | HIGH | Core patterns (opaque token, hybrid JSONB schema, Supabase SSR auth) sourced from official docs and verified CVEs. OpenAI structured output flow is MEDIUM — prompt tuning requires iteration. |
| Pitfalls | HIGH | Security pitfalls from official Supabase docs and verified CVEs/changelogs. Scanner reliability pitfalls from first-principles reasoning with high confidence. |

**Overall confidence:** HIGH

### Gaps to Address

- **OpenAI prompt design for inventory classification:** Structured output schema is clear, but specific prompt language for importance classification requires empirical iteration. Flag for `/gsd:research-phase` in Phase 4 planning.
- **AI-assisted discovery allowlist vocabulary:** What constitutes a safe and useful set of discoverable commands for a developer machine is not well-documented. Flag for `/gsd:research-phase` in Phase 5 planning.
- **JetBrains IDE detection on Linux:** JetBrains Toolbox installs to `~/.local/share/JetBrains/Toolbox/` — detection needs a path-probe strategy beyond `shutil.which()`. Validate during Phase 2 scanner build.
- **Supabase GRANTs confirmation:** The project was created post-2026-05-30 — explicit grants are required. Must be confirmed in the first migration and smoke-tested from the browser, not the Supabase SQL editor (which runs as `postgres` and bypasses grants).

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — breaking changes, middleware rename, async params, Node 20 requirement
- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` two-client pattern, `getUser()` vs `getSession()` guidance
- [Supabase Breaking Change — Tables Not Exposed to API by Default](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) — explicit GRANT requirement for new projects
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — `response_format` + JSON schema pattern
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.107.0 current
- [httpx on PyPI](https://pypi.org/project/httpx/) — v0.28.1 current
- [pydantic v2 changelog](https://docs.pydantic.dev/latest/changelog/) — v2.13.x current
- [Python Command Injection Prevention — Semgrep](https://semgrep.dev/docs/cheat-sheets/python-command-injection) — `shell=False` enforcement

### Secondary (MEDIUM confidence)
- [Opaque token vs JWT — Nordic APIs](https://nordicapis.com/jwt-vs-opaque-tokens-choosing-the-right-token-for-api-security/) — rationale for opaque token over JWT for revocable scanner auth
- [MCP SDK Command Injection CVE-2026-30623](https://docs.litellm.ai/blog/mcp-stdio-command-injection-april-2026) — allowlist approach for AI-suggested commands
- [OpenAI Prompt Injection Guidance for Agents](https://platform.openai.com/docs/guides/agent-builder-safety) — system/user message separation
- [Supabase RLS Common Mistakes 2026](https://blog.starmorph.com/blog/row-level-security-supabase-tables-nextjs) — RLS + GRANT interaction

### Tertiary (LOW confidence)
- [Typer vs Click 2025](https://www.pyinns.com/tools/click-vs-typer) — Typer recommendation for new CLIs (community source)
- [HTTPX vs Requests — Speakeasy](https://www.speakeasy.com/blog/python-http-clients-requests-vs-httpx-vs-aiohttp) — httpx recommendation rationale (community source)

---

*Research completed: 2026-06-07*
*Ready for roadmap: yes*
