# Phase 3: Dashboard - Research

**Researched:** 2026-06-07
**Domain:** Next.js 16 / Supabase dashboard — inventory views, Server Actions, export API routes, UI specs for Cursor
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | Dashboard shows inventory grouped by category | Server-side query groups scan_items by category; FRONTEND_UI_SPEC delivers grouped list component |
| INV-02 | Inventory shows restore importance (Essential / Useful / Optional / Ignore) for each item | scan_items.importance column already exists; UI renders badge per row |
| INV-03 | Ignored items hidden by default with "Show ignored" toggle | Client filter on importance = 'ignore'; toggle state in React useState |
| INV-04 | Filter by category and importance | Client-side filter state; OR server-side query params on page load |
| INV-05 | View full item details (name, category, path, version, source, importance, confidence, notes, last seen) | scan_items columns + scan_runs.scanned_at join; detail panel or modal in spec |
| INV-06 | Edit restore importance for any item | Server Action → adminSupabase UPDATE scan_items; optimistic UI in spec |
| INV-07 | Edit general note for any item | Same Server Action pattern as INV-06 |
| INV-08 | Edit restore note for any item | Same Server Action pattern as INV-06 |
| INV-09 | Advanced/debug evidence hidden by default but viewable | metadata JSONB column surfaced in collapsible panel in spec |
| REVQ-01 | Unknown or low-confidence findings appear in Review Queue | Query: needs_review = true OR confidence = 'low'; separate page/route |
| REVQ-02 | Classify items as Essential / Useful / Optional / Ignore | Server Action updates importance + sets needs_review = false |
| REVQ-03 | Classified items move into main inventory | Follows from REVQ-02 — once needs_review = false, item no longer appears in Review Queue query |
| SEC-01 | Secrets Checklist shows .env variable names + manual reminders | New table secret_reminders; env_files scan_items surfaced on checklist page |
| SEC-02 | Add manual secret reminders (names/reminders only, no values) | Server Action inserts into secret_reminders table |
| SEC-03 | Flag inventory items as having secret dependency | scan_items needs has_secret_dep boolean column — new migration required |
| SEC-04 | Items with secret deps link back to Secrets Checklist | UI link in item detail panel |
| EXP-01 | Export machine-inventory.md | API route /api/export/markdown — generates and streams file download |
| EXP-02 | Export machine-inventory.json | API route /api/export/json |
| EXP-03 | Export option to include ignored items | Query param ?include_ignored=true on export routes |
| EXP-04 | Ignored items in separate section when included | Export route logic separates items where importance = 'ignore' |
</phase_requirements>

---

## Summary

Phase 3 delivers all user-facing dashboard value: inventory browsing, inline editing, Review Queue classification, Secrets Checklist management, and Markdown/JSON export. The Next.js 16 + Supabase + Tailwind v4 stack is already established from Phases 1 and 2. The primary pattern is async Server Components that fetch data from Supabase using `createClient()` (authenticated user client) and Server Actions that write via `adminSupabase` after verifying user identity.

The split between Claude's work and Cursor's work is strict per CLAUDE.md: Claude writes Server Actions, API routes, DB migrations, and test stubs; Cursor implements all React component trees via FRONTEND_UI_SPEC.md files. Every dashboard view (Inventory, Review Queue, Secrets Checklist, Export) needs its own spec file. The specs must document existing hooks, Server Actions, types, and Tailwind patterns so Cursor can implement without asking questions.

One schema addition is required: a `secret_reminders` table for SEC-01/SEC-02, and a `has_secret_dep` boolean column on `scan_items` for SEC-03/SEC-04. The export functionality is pure server-side API routes — no new tables needed. The Review Queue is a filtered view of existing `scan_items` data (`needs_review = true`), so no new table is required there.

**Primary recommendation:** Build the phase in five plans — (1) schema migration + test stubs, (2) Server Actions for inventory edits + review queue classification, (3) Inventory UI spec for Cursor, (4) Review Queue + Secrets Checklist UI specs + secret_reminders Server Actions, (5) Export API routes + Export UI spec + integration checkpoint.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.7 | App Router, Server Components, Server Actions, API routes | Already in use |
| @supabase/supabase-js | ^2.107.0 | Supabase client for DB queries | Already in use |
| @supabase/ssr | ^0.10.3 | Cookie-based SSR auth | Already in use |
| zod | ^4.4.3 | Input validation in Server Actions | Already in use |
| tailwindcss | ^4 | Styling (CSS-first, no tailwind.config.js) | Already in use |
| vitest | ^4.1.8 | Unit test runner | Already in use |
| @testing-library/react | ^16.3.2 | Component testing (via jsdom) | Already in use |

### No New Dependencies Required

All Phase 3 functionality is achievable with the current stack. Export routes use the native Node.js `Response` stream API available in Next.js 16 route handlers.

---

## Architecture Patterns

### Existing Route Group Structure

```
app/
├── (dashboard)/          # Protected route group — layout.tsx wraps all
│   ├── layout.tsx        # Minimal shell — just min-h-screen wrapper
│   ├── settings/         # Already exists with full Settings page
│   └── [NEW ROUTES]
│       ├── inventory/    # INV-01 through INV-09
│       ├── review/       # REVQ-01 through REVQ-03
│       ├── secrets/      # SEC-01 through SEC-04
│       └── export/       # EXP-01 through EXP-04 (UI page only)
├── api/
│   └── scanner/
│       ├── upload/
│       └── config/
│   └── [NEW]
│       └── export/
│           ├── markdown/  # EXP-01, EXP-03, EXP-04
│           └── json/      # EXP-02, EXP-03, EXP-04
lib/
├── actions/
│   ├── machines.ts       # exists
│   ├── scan-config.ts    # exists
│   ├── tokens.ts         # exists
│   └── [NEW]
│       ├── inventory.ts  # updateItemImportance, updateItemNotes
│       ├── review.ts     # classifyReviewItem
│       └── secrets.ts    # addSecretReminder, deleteSecretReminder, flagSecretDep
supabase/
└── migrations/
    └── 0003_dashboard.sql  # secret_reminders table + has_secret_dep column
tests/
├── inventory.test.ts     # unit tests for inventory Server Actions
├── review.test.ts        # unit tests for review Server Actions
└── secrets.test.ts       # unit tests for secrets Server Actions
```

### Pattern 1: Async Server Component Data Fetch

All dashboard pages follow this exact pattern from the existing `settings/page.tsx`:

```typescript
// app/(dashboard)/inventory/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: machine } = await supabase
    .from("machines")
    .select("id, label, last_scan_at")
    .eq("user_id", user.id)
    .single()

  const { data: items } = await supabase
    .from("scan_items")
    .select("*, scan_runs!inner(machine_id, scanned_at)")
    .eq("scan_runs.machine_id", machine?.id ?? "")
    .order("category")

  return <InventoryView items={items ?? []} machine={machine} />
}
```

**Important:** The `!inner` join syntax filters out scan_items that have no matching scan_run — this is the correct Supabase PostgREST pattern for filtering through a join.

### Pattern 2: Server Action with Auth + adminSupabase Write

All write operations use `adminSupabase` after verifying identity with `createClient().auth.getUser()`. This matches the existing pattern in `lib/actions/tokens.ts` and `lib/actions/scan-config.ts`:

```typescript
// lib/actions/inventory.ts
"use server"
import { createClient } from "@/lib/supabase/server"
import { adminSupabase } from "@/lib/supabase/admin"
import { z } from "zod"

const ImportanceSchema = z.enum(["Essential", "Useful", "Optional", "Ignore"])

export async function updateItemImportance(
  itemId: string,
  importance: string
): Promise<{ error?: string }> {
  const parsed = ImportanceSchema.safeParse(importance)
  if (!parsed.success) return { error: "Invalid importance value" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Ownership verified via RLS on the SELECT — but we write via adminSupabase
  // First verify the item belongs to this user
  const { data: item } = await supabase
    .from("scan_items")
    .select("id")
    .eq("id", itemId)
    .single()
  if (!item) return { error: "Item not found" }

  const { error } = await adminSupabase
    .from("scan_items")
    .update({ importance: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", itemId)

  return error ? { error: error.message } : {}
}
```

### Pattern 3: Export API Route (Streaming File Download)

Export routes use Next.js 16 Route Handler returning a `Response` with appropriate headers:

```typescript
// app/api/export/markdown/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const includeIgnored = request.nextUrl.searchParams.get("include_ignored") === "true"

  // ... fetch items, build markdown string ...

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="machine-inventory.md"',
    },
  })
}
```

### Pattern 4: "Latest Scan" Query Strategy

MVP only shows latest scan. The correct query is: find the machine for the user, then get the most recent scan_run, then get all items for that scan_run:

```typescript
// Get latest scan_run_id for this machine
const { data: latestRun } = await supabase
  .from("scan_runs")
  .select("id, scanned_at")
  .eq("machine_id", machine.id)
  .order("scanned_at", { ascending: false })
  .limit(1)
  .single()

// Then get scan_items for that run
const { data: items } = await supabase
  .from("scan_items")
  .select("*")
  .eq("scan_run_id", latestRun.id)
```

This is cleaner and more reliable than the `!inner` join approach for the "latest scan" use case.

### Pattern 5: Importance and Confidence Values

These are the canonical string values used by the scanner (from `models.py`) and stored in the DB. The dashboard must use these exact casing conventions:

**importance** (editable by user — stored as-is):
- `"Essential"` (scanner guesses high importance)
- `"Useful"`
- `"Optional"`
- `"Ignore"` (user-set; hidden by default)
- `"medium"` (scanner default — note lowercase; dashboard should normalise display)

**confidence** (read-only display):
- `"high"`
- `"medium"`
- `"low"`

**Important finding:** The scanner stores importance values in mixed case (`"Essential"`, `"Useful"`, etc.) based on scanner rules, but the DB default is `"medium"` (lowercase). The UI must normalise display (e.g. title-case all values) and the Server Actions must accept any valid enum value. Recommendation: standardise to lowercase in migration or normalise in Server Action.

### Pattern 6: Review Queue Query

`needs_review = true` is set by the scanner when `confidence == 'low'` or when the tool is unknown. No new table needed — the Review Queue is a filtered view:

```typescript
const { data: reviewItems } = await supabase
  .from("scan_items")
  .select("*")
  .eq("scan_run_id", latestRun.id)
  .eq("needs_review", true)
  .order("category")
```

Classifying an item clears `needs_review` and sets `importance`:
```typescript
await adminSupabase
  .from("scan_items")
  .update({ needs_review: false, importance: classification })
  .eq("id", itemId)
```

### Pattern 7: Secrets Checklist Data Model

Two data sources feed the Secrets Checklist:

1. **Scanned .env variable names** — already in `scan_items` where `category = 'env_files'`. The `metadata` JSONB column contains `{"variable_names": ["OPENAI_API_KEY", ...]}`. These are read-only display items.

2. **Manual secret reminders** — new `secret_reminders` table (migration 0003). A reminder is a name + optional note. Values are never stored.

The `has_secret_dep` boolean on `scan_items` (new column via migration) allows any inventory item to be flagged as having a secret dependency, with the UI linking to the Secrets Checklist page.

### Anti-Patterns to Avoid

- **Never use `getSession()` for auth** — always `getUser()` in server code. All existing Server Actions already do this; maintain the pattern.
- **Never expose `adminSupabase` to client components** — all writes go through Server Actions.
- **Don't query all scan_runs for display** — MVP shows latest scan only. Always filter to the latest `scan_run_id` before querying items.
- **Don't store secret values** — the Secrets Checklist only stores names (variable names, reminder labels). No value fields in the schema.
- **Don't build a custom groupBy utility** — JavaScript's `Array.prototype.reduce` or `Object.groupBy` (available in Node 21+ / Chrome 117+) handles grouping. Check compatibility; use reduce pattern for safety.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download trigger | Custom blob + URL.createObjectURL | Anchor tag with href pointing to API route | Server renders the file; no client-side blob needed |
| Auth check in Server Actions | Custom token validation | `createClient().auth.getUser()` then verify ownership via RLS-respecting SELECT | Established pattern in all existing Server Actions |
| Item ownership check | JWT decoding or custom middleware | Supabase RLS — authenticated user SELECT via `createClient()` returns only their data | RLS policies already in place |
| Markdown generation | Template string soup | Simple structured string building (no library needed for this use case) | The export is a rebuild reference, not a complex doc |
| JSON schema validation | Hand-rolled type checking | Zod (already installed) | Already used in upload route |

---

## Common Pitfalls

### Pitfall 1: Importance Value Inconsistency

**What goes wrong:** The scanner default `importance` is `"medium"` (lowercase), but the domain values are `"Essential" / "Useful" / "Optional" / "Ignore"` (title case). Mixing these in UI filters or Server Action validation causes silent mismatches.

**Why it happens:** The schema was defined before the full importance vocabulary was finalised.

**How to avoid:** In migration 0003, add a CHECK constraint or update the default to `"Useful"`. In all Server Actions, validate against `["Essential", "Useful", "Optional", "Ignore"]` only. In UI display, always title-case or map the DB value before rendering.

**Warning signs:** Items with `importance = "medium"` don't appear in any importance filter group.

### Pitfall 2: "Latest Scan" Query Not Filtering Correctly

**What goes wrong:** Querying `scan_items` without filtering to the latest `scan_run_id` returns items from all historical scans (even though MVP only has one scan, this will break once the user re-scans).

**Why it happens:** The simple join approach can be ambiguous when multiple scan_runs exist for a machine.

**How to avoid:** Always resolve `latestRun.id` first with `.order("scanned_at", { ascending: false }).limit(1).single()`, then filter scan_items by that ID.

**Warning signs:** Item count appears doubled after a second scan.

### Pitfall 3: Missing GRANT on New Tables

**What goes wrong:** Post-2026-05-30 Supabase projects require explicit GRANTs. New tables added in migration 0003 will not be accessible via the Data API without them.

**Why it happens:** This is the post-2026-05-30 Supabase default (documented in CLAUDE.md and STATE.md).

**How to avoid:** Every new table in `0003_dashboard.sql` must include `GRANT SELECT, INSERT, UPDATE, DELETE ON public.{table} TO authenticated;` (or scoped grants where appropriate).

**Warning signs:** Supabase client returns `permission denied` errors on new tables.

### Pitfall 4: Vitest Mock Hoisting for New Server Actions

**What goes wrong:** Adding `vi.mock()` calls inside `beforeEach` or `describe` blocks causes them to be hoisted to file scope by Vitest, breaking per-test mock resolution.

**Why it happens:** Vitest's static analysis hoists `vi.mock()` calls regardless of where they appear syntactically.

**How to avoid:** Follow the established pattern from `tests/setup.ts` — global mocks for `adminSupabase` and `next/headers`, then `mockResolvedValueOnce` per test for specific return values.

**Warning signs:** Mock not resetting between tests; all tests share the same mock return value.

### Pitfall 5: Export Route Auth with cookies()

**What goes wrong:** Export routes are GET requests from anchor tags. The Supabase SSR client reads auth cookies — this works fine in Server Components but requires the cookie store to be accessible in Route Handlers.

**Why it happens:** `createClient()` in Route Handlers requires reading cookies via `request.cookies` (Next.js 16 route handler pattern), not `next/headers cookies()`.

**How to avoid:** In export route handlers, use the same `createClient()` from `@/lib/supabase/server` — it already handles both Server Component and Route Handler contexts correctly in the existing codebase.

---

## Schema Changes Required (Migration 0003)

This is the most critical backend deliverable of Phase 3.

### New Table: secret_reminders

```sql
create table public.secret_reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,         -- e.g. "OPENAI_API_KEY", "GitHub token"
  note        text,                  -- optional reminder text
  created_at  timestamptz default now() not null
);

alter table public.secret_reminders enable row level security;

create policy "Owner can read own secret reminders"
  on public.secret_reminders for select
  using (auth.uid() = user_id);

create policy "Owner can insert own secret reminders"
  on public.secret_reminders for insert
  with check (auth.uid() = user_id);

create policy "Owner can delete own secret reminders"
  on public.secret_reminders for delete
  using (auth.uid() = user_id);

-- Post-2026-05-30 project: explicit GRANT required
grant select, insert, update, delete on public.secret_reminders to authenticated;
```

### New Column: scan_items.has_secret_dep

```sql
alter table public.scan_items
  add column has_secret_dep boolean default false;
```

### Recommended: Normalise importance default

```sql
-- Change the DB default to a valid domain value
alter table public.scan_items
  alter column importance set default 'Useful';
```

---

## Frontend Spec Breakdown

All four views require a FRONTEND_UI_SPEC.md file. Claude writes the spec; Cursor implements the React component tree.

| Spec File | Covers Requirements | Key Components |
|-----------|--------------------|----|
| `INVENTORY_UI_SPEC.md` | INV-01 through INV-09 | Grouped list, item row, detail panel/drawer, edit forms, show-ignored toggle, category+importance filter |
| `REVIEW_QUEUE_UI_SPEC.md` | REVQ-01 through REVQ-03 | Review item card, classification buttons (Essential/Useful/Optional/Ignore), empty state |
| `SECRETS_CHECKLIST_UI_SPEC.md` | SEC-01 through SEC-04 | Env variable list (from scan_items), manual reminder form, reminder list, secret dep flag on items |
| `EXPORT_UI_SPEC.md` | EXP-01 through EXP-04 | Export page with format choice, include-ignored checkbox, download links pointing to API routes |

Each spec must include:
- What already exists (imports, types, Supabase query results as props)
- Tailwind v4 CSS patterns in use (see existing card pattern in SCANNER_SETTINGS_UI_SPEC.md)
- All state/interaction flows
- Server Action signatures the component calls
- Exact prop types passed from the Server Component parent

### Existing Tailwind v4 Card Pattern (from SCANNER_SETTINGS_UI_SPEC.md)

```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Section Title</h2>
  {/* content */}
</section>
```

Text classes in use: `text-sm text-gray-500`, `text-sm text-gray-900`, `text-sm font-medium text-gray-700`, `text-2xl font-semibold`.

---

## Code Examples

### Latest Scan Items Query (Verified Pattern)

```typescript
// Server Component — fetch latest scan items for authenticated user
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/login")

const { data: machine } = await supabase
  .from("machines")
  .select("id, label, last_scan_at")
  .eq("user_id", user.id)
  .single()

const { data: latestRun } = machine
  ? await supabase
      .from("scan_runs")
      .select("id, scanned_at, item_count")
      .eq("machine_id", machine.id)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .single()
  : { data: null }

const { data: items } = latestRun
  ? await supabase
      .from("scan_items")
      .select("*")
      .eq("scan_run_id", latestRun.id)
      .order("category")
  : { data: [] }
```

### Review Queue Classification Server Action

```typescript
// lib/actions/review.ts
"use server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { adminSupabase } from "@/lib/supabase/admin"

const ClassificationSchema = z.enum(["Essential", "Useful", "Optional", "Ignore"])

export async function classifyReviewItem(
  itemId: string,
  classification: string
): Promise<{ error?: string }> {
  const parsed = ClassificationSchema.safeParse(classification)
  if (!parsed.success) return { error: "Invalid classification" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // RLS-respecting ownership check
  const { data: item } = await supabase
    .from("scan_items")
    .select("id")
    .eq("id", itemId)
    .single()
  if (!item) return { error: "Item not found" }

  const { error } = await adminSupabase
    .from("scan_items")
    .update({
      importance: parsed.data,
      needs_review: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)

  return error ? { error: error.message } : {}
}
```

### Export Markdown Route Skeleton

```typescript
// app/api/export/markdown/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const includeIgnored = request.nextUrl.searchParams.get("include_ignored") === "true"

  // ... resolve machine, latestRun, items (same pattern as Server Components)
  // ... build markdown string with sections
  // Ignored items go in a separate "## Ignored Items" section at end

  return new Response(markdownContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="machine-inventory.md"',
    },
  })
}
```

---

## Validation Architecture

`nyquist_validation: true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (repo root) |
| Python tests | pytest (pytest.ini, `testpaths = tests/scanner`) |
| Quick run command | `npx vitest run tests/inventory.test.ts tests/review.test.ts tests/secrets.test.ts` |
| Full TS suite command | `npx vitest run` |
| Full Python suite | `python -m pytest tests/scanner/ -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-06 | updateItemImportance validates enum and rejects invalid values | unit | `npx vitest run tests/inventory.test.ts` | ❌ Wave 0 |
| INV-07 | updateItemNote saves general_note via adminSupabase | unit | `npx vitest run tests/inventory.test.ts` | ❌ Wave 0 |
| INV-08 | updateItemNote saves restore_note via adminSupabase | unit | `npx vitest run tests/inventory.test.ts` | ❌ Wave 0 |
| REVQ-02 | classifyReviewItem sets needs_review=false and importance | unit | `npx vitest run tests/review.test.ts` | ❌ Wave 0 |
| REVQ-02 | classifyReviewItem rejects invalid classification | unit | `npx vitest run tests/review.test.ts` | ❌ Wave 0 |
| SEC-02 | addSecretReminder rejects empty name | unit | `npx vitest run tests/secrets.test.ts` | ❌ Wave 0 |
| SEC-03 | flagSecretDep updates has_secret_dep boolean | unit | `npx vitest run tests/secrets.test.ts` | ❌ Wave 0 |
| EXP-01 | Export markdown route returns 401 when unauthenticated | unit | `npx vitest run tests/export-route.test.ts` | ❌ Wave 0 |
| EXP-02 | Export JSON route returns 401 when unauthenticated | unit | `npx vitest run tests/export-route.test.ts` | ❌ Wave 0 |
| INV-01 | Inventory page is protected (redirect to /login when no user) | unit (existing proxy.test.ts covers this pattern) | `npx vitest run tests/proxy.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/inventory.test.ts tests/review.test.ts tests/secrets.test.ts tests/export-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full Vitest suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/inventory.test.ts` — covers INV-06, INV-07, INV-08 Server Actions
- [ ] `tests/review.test.ts` — covers REVQ-02 classifyReviewItem Server Action
- [ ] `tests/secrets.test.ts` — covers SEC-02, SEC-03 Server Actions
- [ ] `tests/export-route.test.ts` — covers EXP-01, EXP-02 export route auth
- [ ] `lib/actions/inventory.ts` — updateItemImportance, updateItemNotes
- [ ] `lib/actions/review.ts` — classifyReviewItem
- [ ] `lib/actions/secrets.ts` — addSecretReminder, deleteSecretReminder, flagSecretDep
- [ ] `supabase/migrations/0003_dashboard.sql` — secret_reminders table + has_secret_dep column

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` for auth | `proxy.ts` (renamed export) | Phase 1 decision | Already handled — middleware.ts in project delegates to proxy() |
| `z.record(z.unknown())` | `z.record(z.string(), z.unknown())` | Zod v4 (current) | Already applied in upload route; use same pattern in new Server Actions |
| `getSession()` for auth check | `getUser()` always | Phase 1 decision | Already applied everywhere; maintain |
| Tailwind config file | CSS-first `globals.css` with `@tailwindcss/postcss` | Tailwind v4 | Already in place; no tailwind.config.js |

---

## Open Questions

1. **Importance value normalisation**
   - What we know: Scanner default is `"medium"` (lowercase); user-facing values are `"Essential"` / `"Useful"` / `"Optional"` / `"Ignore"` (title case)
   - What's unclear: Should migration 0003 UPDATE existing rows to normalise `"medium"` → `"Useful"`?
   - Recommendation: Yes — add `UPDATE public.scan_items SET importance = 'Useful' WHERE importance = 'medium';` to migration 0003 and change the column default to `'Useful'`

2. **Navigation structure**
   - What we know: The `(dashboard)/layout.tsx` is a minimal shell; no nav bar exists yet
   - What's unclear: Does Phase 3 need to add a sidebar/nav, or is that left entirely to Cursor via a spec?
   - Recommendation: Add a simple nav bar spec to the Inventory UI spec (first and most-visited page) — Cursor implements it once and it covers all dashboard pages via the layout

3. **Item detail — drawer vs. dedicated route**
   - What we know: INV-05 requires viewing full item details; INV-06/07/08 require editing
   - What's unclear: Should item detail be a slide-over drawer (client-side) or a dedicated `/inventory/[id]` route (server-side)?
   - Recommendation: Slide-over drawer — avoids a new server route, keeps the inventory list in view, and is implementable with vanilla React state (no library needed); document in spec

4. **Secrets Checklist page scope**
   - What we know: SEC-01 shows detected .env variable names + manual reminders; SEC-03/04 flag inventory items
   - What's unclear: Do SEC-03/04 (flagging + linking) require changes to the Inventory item detail UI, or just a new field in the DB?
   - Recommendation: Both — migration adds `has_secret_dep` boolean column; Inventory UI spec includes a checkbox in the item detail drawer; Secrets spec shows which items are flagged

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `supabase/migrations/0001_foundation.sql`, `lib/actions/*.ts`, `lib/tokens.ts`, `app/api/scanner/upload/route.ts` — direct inspection
- Existing codebase — `scanner/models.py`, `scanner/collectors/*.py` — direct inspection confirming DB field shapes
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` — direct read, authoritative for this project
- `machine-inventory-scope.md` — direct read, full product spec
- SCANNER_SETTINGS_UI_SPEC.md — direct read, establishes Tailwind class patterns and spec format for Cursor

### Secondary (MEDIUM confidence)
- Supabase PostgREST `!inner` join filtering — known pattern from @supabase/supabase-js documentation; verified against existing upload route patterns
- Next.js 16 Route Handler `new Response(...)` pattern — consistent with Next.js App Router documentation

### Tertiary (LOW confidence — worth validating)
- `Object.groupBy` Node.js version compatibility — may not be available in all Node versions deployed on Vercel; use `Array.prototype.reduce` grouping instead to be safe

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in active use
- Architecture patterns: HIGH — directly verified from existing codebase; all patterns are extensions of working Phase 1 code
- Schema changes: HIGH — migration pattern established, both new additions are straightforward
- Frontend spec strategy: HIGH — CLAUDE.md frontend rule is firm; SCANNER_SETTINGS_UI_SPEC.md provides the exact template
- Pitfalls: HIGH — importance normalisation and latest-scan query are concrete issues visible in the existing schema/code

**Research date:** 2026-06-07
**Valid until:** 2026-08-01 (stable stack — Next.js 16 and Supabase client versions are locked in package.json)
