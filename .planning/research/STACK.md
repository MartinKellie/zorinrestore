# Stack Research

**Domain:** Personal dev machine inventory / rebuild awareness tool (Python CLI + Next.js dashboard + Supabase + OpenAI)
**Researched:** 2026-06-07
**Confidence:** HIGH (all core choices verified against official docs or current package pages)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (`latest`) | Web dashboard framework | Current stable; Turbopack default; required async params/cookies pattern locks in clean App Router habits from day one. Node 20.9+ required. |
| React | 19.2 | UI runtime | Bundled with Next.js 16; View Transitions and Activity component useful for dashboard feel. |
| Supabase | hosted (Postgres + Auth) | Database + magic-link auth + row-level security | Managed Postgres with first-class Next.js SSR auth support via `@supabase/ssr`; no extra auth server to run. |
| Python | 3.11+ | Scanner runtime | Ships on Zorin 18 Pro by default; 3.11 is Ubuntu 24.04 system Python; no binary packaging needed for MVP. |
| OpenAI API | REST via SDK | AI analysis of scan results | Native structured output support via Pydantic models; manually triggered = no background cost. |
| Vercel | hosted | Dashboard hosting + API routes | Project is already scoped to `zorinrestore.vercel.app`; API routes act as the upload gateway, keeping Supabase credentials off the scanner. |

---

### Supporting Libraries — Python Scanner

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typer` | `0.26.x` | CLI entry point (`python -m scanner scan`) | All new Python CLI projects; replaces Click with type-hint-driven commands, built-in Rich output, auto-generated help. |
| `httpx` | `0.28.x` | POST scan results to Vercel API route | Preferred over `requests` for new projects — sync + async in one library, HTTP/2, typed. No async needed here, but future-proof. |
| `pydantic` | `2.13.x` | Schema for scan result payload | Validates upload payload structure before sending; same models reused as OpenAI structured output schema. |
| `psutil` | `7.2.x` | Process and system resource info | RAM, CPU, disk info if ever needed; skip in MVP if not scanning hardware — stdlib is sufficient for tool detection. |
| `python-dotenv` | `1.2.x` | Load scanner config from `.env` | Keeps app URL + scanner token out of code; `.env` is in `.gitignore`. |
| `shutil` (stdlib) | — | Tool detection via `shutil.which()` | Zero dependencies; `shutil.which('node')` is the canonical pattern for detecting CLI tools on PATH. |
| `subprocess` (stdlib) | — | Run read-only discovery commands | Always use `subprocess.run(..., check=True, timeout=10, capture_output=True, text=True)` — never `shell=True`. |
| `pathlib` (stdlib) | — | All file path operations | Prefer over `os.path` everywhere; object-oriented, readable, cross-platform ready. |

### Supporting Libraries — Next.js Dashboard

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | `2.107.x` | Supabase client (data queries, realtime) | Core client used in both server and client contexts. |
| `@supabase/ssr` | `latest` | Cookie-aware Supabase client for App Router | Required for magic-link auth with Next.js 16 SSR — handles the two-client pattern (server util + browser util) and middleware session refresh. |
| `openai` | `2.x` (latest) | OpenAI API calls from API routes | Server-side only (API routes); structured outputs with Pydantic-like Zod schemas. |
| `zod` | `3.x` | Schema validation for API route inputs + OpenAI structured outputs | Pairs with OpenAI SDK's `.parse()` for structured responses; validates scanner upload payload on the API route side. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `uv` | Python dependency management + venv | Replaces `pip` + `venv` for speed; `uv add httpx typer pydantic` — no `requirements.txt` churn. Lock file is `uv.lock`. |
| TypeScript | Type safety in Next.js | Required; Next.js 16 minimum TypeScript 5.1. |
| ESLint (flat config) | Linting | Next.js 16 removed `next lint` — run ESLint directly; use flat config format (`eslint.config.js`). |
| Biome | Optional fast formatter/linter alternative | Next.js 16 officially mentions Biome as ESLint alternative; skip if team is solo. |

---

## Installation

```bash
# --- Python scanner (from repo root) ---
# Install uv if not present
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create venv and install scanner dependencies
uv venv
uv add typer httpx pydantic python-dotenv
uv add --dev pytest ruff

# Run scanner
uv run python -m scanner scan

# --- Next.js dashboard (from repo root or /web) ---
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js @supabase/ssr openai zod
npm install -D typescript @types/react @types/react-dom @types/node

# Supabase types (run after schema is set)
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `typer` | `click` | Only if inheriting a legacy Click codebase |
| `httpx` | `requests` | If the team has strong `requests` familiarity and async is never needed; `requests` is fine for a simple one-shot upload |
| `httpx` | `urllib` (stdlib) | Never — too verbose for JSON POST with auth headers |
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Never — deprecated, replaced by `@supabase/ssr` |
| `uv` | `poetry` / `pip-tools` | If the project must run in a corporate environment with PyPI proxy that blocks `uv`'s resolver |
| Next.js 16 | Next.js 15 | If you need Edge runtime in middleware (Next.js 16 proxy.ts drops Edge support — stay on 15 if that matters) |
| Pydantic v2 | Pydantic v1 | Never on a new project — v1 is incompatible with Python 3.14+ |
| Zod | io-ts / yup | Zod is the de-facto standard with Next.js + OpenAI SDK; no reason to deviate |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `requests` for scanner upload | Fine for now, but sync-only, no HTTP/2, no type hints — `httpx` is the same API surface with upside | `httpx` |
| `@supabase/auth-helpers-nextjs` | Deprecated package — Supabase docs redirect all Next.js App Router work to `@supabase/ssr` | `@supabase/ssr` |
| Direct Supabase credentials in scanner | Hard security constraint for this project — scanner must not hold Supabase keys | Scanner token via Vercel API route (already the design) |
| `supabase.auth.getSession()` in server code | Can be spoofed via cookies; Supabase docs explicitly warn against it | `supabase.auth.getUser()` in all server contexts |
| `middleware.ts` (Next.js 16) | Renamed to `proxy.ts` in Next.js 16; Edge runtime removed from proxy layer | `proxy.ts` with Node.js runtime |
| `shell=True` in subprocess | Arbitrary command injection risk — this project has a hard no-arbitrary-execution rule | `subprocess.run(['cmd', 'arg'], ...)` with explicit list |
| `os.path` for file paths | Replaced by `pathlib.Path` since Python 3.6; less readable | `pathlib.Path` |
| OpenAI client in Client Components | API key exposure in browser bundle | Server Actions or API routes only |
| `serverRuntimeConfig` / `publicRuntimeConfig` in next.config | Removed in Next.js 16 | `process.env` / `NEXT_PUBLIC_` prefix |

---

## Stack Patterns by Variant

**For the scanner upload (Python → Vercel API route):**
- Use `httpx.post(url, json=payload.model_dump(), headers={"Authorization": f"Bearer {token}"})`
- Pydantic model validates payload before sending — if `.model_dump()` succeeds, the shape is correct
- No retry logic in MVP; if upload fails, print error and exit non-zero

**For Supabase auth in Next.js 16 App Router:**
- Create `utils/supabase/server.ts` — cookie-reading client for Server Components, Server Actions, Route Handlers
- Create `utils/supabase/client.ts` — browser client for Client Components
- Create `proxy.ts` (not `middleware.ts`) — calls `supabase.auth.getUser()` to refresh session on every request
- Magic link flow: dashboard calls `supabase.auth.signInWithOtp({ email })`, user clicks link, `/auth/confirm` route handler calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })`

**For OpenAI structured analysis:**
- Define Zod schema for expected output (e.g., `InventoryAnalysisSchema`)
- Call `openai.beta.chat.completions.parse({ model: 'gpt-4o', messages, response_format: zodResponseFormat(schema, 'analysis') })`
- Always check `message.refusal` before accessing parsed data
- Run from a Server Action (not a Client Component) to keep `OPENAI_API_KEY` server-side

**For scanner token management:**
- Tokens stored in Supabase `scanner_tokens` table with `user_id`, `token_hash`, `created_at`, `revoked_at`
- Vercel API route (`/api/upload`) extracts Bearer token, hashes it, looks up in Supabase — no raw token stored
- Dashboard issues tokens via a Server Action; scanner only ever sees the raw token once

**For tool detection (scanner):**
- `shutil.which('node')` → installed / not installed
- `subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)` → version string
- `pathlib.Path.home() / '.config' / 'nvim'` → config presence check
- Never `glob` or read file contents unless explicitly in the approved scan list

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.x | Node.js 20.9+ only | Node 18 dropped; verify Vercel project uses Node 20 runtime |
| Next.js 16.x | TypeScript 5.1+ | Check `tsconfig.json` target |
| `@supabase/ssr` latest | `@supabase/supabase-js` 2.x | Must use both together; `@supabase/ssr` wraps supabase-js |
| `openai` 2.x | Python 3.8+ | SDK v2 is a breaking change from v1.x; `.parse()` structured output method is v2+ |
| Pydantic 2.x | Python 3.8+ | v2 is incompatible with v1 model syntax — do not mix |
| `typer` 0.26.x | Python 3.7+ | 0.22+ bundles Click internally (no separate `click` install needed) |
| `httpx` 0.28.x | Python 3.8+ | Stable; no known breaking changes from 0.27 |
| Supabase new project (post 2026-05-30) | — | Requires explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO anon, authenticated;` in all migrations — default exposure is OFF |

---

## Key Next.js 16 Breaking Changes to Know Upfront

These affect greenfield App Router code written today:

1. **`proxy.ts` not `middleware.ts`** — file renamed; `export function proxy()` not `export function middleware()`
2. **`params` and `searchParams` are Promises** — `const { slug } = await props.params` everywhere
3. **`cookies()` and `headers()` are async** — `const cookieStore = await cookies()`
4. **`revalidateTag` requires second arg** — `revalidateTag('key', 'max')`
5. **`serverRuntimeConfig` removed** — use `process.env` directly
6. **Turbopack is default** — no `--turbopack` flag needed
7. **`next lint` removed** — run `eslint` directly in CI

Writing against these patterns from day one means no migration debt.

---

## Sources

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — breaking changes, middleware→proxy rename, async params, Node 20 requirement (verified 2026-05-13, version 16.2.7)
- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` two-client pattern, middleware session refresh
- [Supabase: Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — server vs client utility pattern
- [@supabase/ssr on npm](https://www.npmjs.com/package/@supabase/ssr) — current version
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.107.0 current
- [httpx on PyPI](https://pypi.org/project/httpx/) — v0.28.1 current stable
- [typer on PyPI / GitHub](https://github.com/fastapi/typer/releases) — v0.26.7 current; Click vendored since 0.22
- [psutil documentation](https://psutil.readthedocs.io/) — v7.2.2 current
- [python-dotenv on PyPI](https://pypi.org/project/python-dotenv/) — v1.2.2 current
- [pydantic v2 changelog](https://docs.pydantic.dev/latest/changelog/) — v2.13.x current
- [OpenAI Python SDK on PyPI](https://pypi.org/project/openai/) — v2.x current (v1.99.9 was final v1.x)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — `response_format` + Pydantic/Zod pattern
- [HTTPX vs Requests comparison — Speakeasy](https://www.speakeasy.com/blog/python-http-clients-requests-vs-httpx-vs-aiohttp) — httpx recommendation rationale (MEDIUM confidence — community source)
- [Typer vs Click 2025](https://www.pyinns.com/tools/click-vs-typer) — Typer recommendation for new projects (MEDIUM confidence — community source)

---

*Stack research for: Personal dev machine inventory tool (Rebuild Ledger)*
*Researched: 2026-06-07*
