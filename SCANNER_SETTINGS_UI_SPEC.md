# Scanner Settings UI Spec — Machine Details + Scan Folders

**Target file:** `app/(dashboard)/settings/page.tsx`
**Status:** Ready for Cursor implementation

This spec is self-contained. Cursor needs no additional context to implement both new sections.

---

## 1. What Already Exists

### File to modify
`app/(dashboard)/settings/page.tsx`

### Existing imports (already in the file — do not re-add)
```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TokensSection } from "./TokensSection"
import { MachineSection } from "./MachineSection"
import { SignOutButton } from "./SignOutButton"
```

### Existing page structure
The page is an async server component with three `<section>` blocks inside `<main className="p-8 max-w-2xl space-y-8">`:
1. **Account** — shows `user.email` + `<SignOutButton />`
2. **Scanner Tokens** — `<TokensSection initialTokens={tokens ?? []} />`
3. **Machine** — `<MachineSection machine={machine ?? null} />` (label editing only)

### Existing Supabase queries in the page (already present — extend, don't duplicate)
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
// → redirects to /login if !user

const { data: tokens } = await supabase
  .from("scanner_tokens")
  .select("id, label, created_at, last_used, revoked")
  .order("created_at", { ascending: false })

const { data: machine } = await supabase
  .from("machines")
  .select("id, label, hostname, last_scan_at")
  .eq("user_id", user.id)
  .single()
```

### Existing Tailwind v4 card/section pattern
Every section uses this structure — match it exactly:
```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Section Title</h2>
  {/* section content */}
</section>
```

Text utility classes in use: `text-sm text-gray-500`, `text-sm text-gray-900`, `text-sm font-medium text-gray-700`, `text-2xl font-semibold`.

---

## 2. New Supabase Queries to Add (server-side, inside SettingsPage)

Add these queries after the existing machine query. The machine query must be extended to select the additional columns needed for Machine Details:

### 2a. Extend the existing machines query
Replace the existing machines query with this expanded version:
```typescript
const { data: machine } = await supabase
  .from("machines")
  .select("id, label, hostname, os_name, kernel_version, architecture, scanner_version, python_version, last_scan_at")
  .eq("user_id", user.id)
  .single()
```

### 2b. Add scan_config query (new — add after the machines query)
```typescript
const { data: scanConfig } = await supabase
  .from("scan_config")
  .select("approved_folders")
  .eq("machine_id", machine?.id ?? "")
  .single()
// approved_folders is string[] | null
// machine?.id may be undefined if no scan has run yet — the empty string causes .single() to return null gracefully
```

---

## 3. Machine Details Section (MACH-03)

### Where to add
After the existing **Machine** `<section>` block (the third section). Add as a **fourth** section.

### New import to add at the top of the file
```typescript
import { MachineDetails } from "./MachineDetails"
```

### Props interface (create as `./MachineDetails.tsx` in the same directory)
```typescript
interface MachineDetailsProps {
  machine: {
    hostname: string | null
    os_name: string | null
    kernel_version: string | null
    architecture: string | null
    scanner_version: string | null
    python_version: string | null
    last_scan_at: string | null
  } | null
}
```

### Component: `app/(dashboard)/settings/MachineDetails.tsx`
This is a **server component** (no interactivity). Create it at that path.

```tsx
// No "use client" — server component

export function MachineDetails({ machine }: MachineDetailsProps) {
  if (!machine) {
    return (
      <p className="text-sm text-gray-500">
        No scan data yet — run a scan to populate machine details.
      </p>
    )
  }

  const lastScan = machine.last_scan_at
    ? new Date(machine.last_scan_at).toLocaleString()
    : "Never"

  const rows: { label: string; value: string | null }[] = [
    { label: "Hostname",         value: machine.hostname },
    { label: "OS",               value: machine.os_name },
    { label: "Kernel",           value: machine.kernel_version },
    { label: "Architecture",     value: machine.architecture },
    { label: "Scanner version",  value: machine.scanner_version },
    { label: "Python version",   value: machine.python_version },
    { label: "Last scan",        value: lastScan },
  ]

  return (
    <dl className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-4">
          <dt className="w-40 shrink-0 text-sm font-medium text-gray-700">{label}</dt>
          <dd className="text-sm text-gray-900">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
```

### JSX to add in `page.tsx` (fourth section)
```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Machine Details</h2>
  <p className="text-sm text-gray-500">
    Hardware and software details collected during the last scan.
  </p>
  <MachineDetails machine={machine ?? null} />
</section>
```

---

## 4. Scan Folders Section (SET-03, FLDR-01, FLDR-02)

### Where to add
After the Machine Details section (fifth section in total).

### New import to add at the top of `page.tsx`
```typescript
import { ScanFolders } from "./ScanFolders"
```

### Props passed from `page.tsx` to `<ScanFolders>`
```tsx
<ScanFolders
  machineId={machine?.id ?? null}
  initialFolders={scanConfig?.approved_folders ?? []}
/>
```

### Component: `app/(dashboard)/settings/ScanFolders.tsx`
This is a **client component** because it has interactive state.

```tsx
"use client"

import { useState, useTransition } from "react"
import { addApprovedFolder, removeApprovedFolder } from "@/lib/actions/scan-config"

interface ScanFoldersProps {
  machineId: string | null
  initialFolders: string[]
}

export function ScanFolders({ machineId, initialFolders }: ScanFoldersProps) {
  const [folders, setFolders] = useState<string[]>(initialFolders)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!machineId) {
    return (
      <p className="text-sm text-gray-500">
        Run a scan first to enable folder management.
      </p>
    )
  }

  function handleAdd() {
    // Client-side validation
    if (!inputValue.trim()) {
      setError("Path must not be empty")
      return
    }
    if (!inputValue.startsWith("/") && !inputValue.startsWith("~/")) {
      setError("Path must start with / or ~/")
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await addApprovedFolder(machineId!, inputValue.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setFolders((prev) => [...prev, inputValue.trim()])
      setInputValue("")
    })
  }

  function handleRemove(folder: string) {
    startTransition(async () => {
      const result = await removeApprovedFolder(machineId!, folder)
      if (result.error) {
        setError(result.error)
        return
      }
      setFolders((prev) => prev.filter((f) => f !== folder))
    })
  }

  return (
    <div className="space-y-4">
      {/* Add folder row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="/home/user/projects"
          disabled={isPending}
          className="flex-1 rounded border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
        />
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Folder list */}
      {folders.length === 0 ? (
        <p className="text-sm text-gray-500">No approved folders yet.</p>
      ) : (
        <ul className="space-y-2">
          {folders.map((folder) => (
            <li key={folder} className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-sm text-gray-900 font-mono">{folder}</span>
              <button
                onClick={() => handleRemove(folder)}
                disabled={isPending}
                aria-label={`Remove ${folder}`}
                className="text-sm text-gray-400 hover:text-red-600 disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### JSX to add in `page.tsx` (fifth section)
```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Scan Folders</h2>
  <p className="text-sm text-gray-500">
    Approved project root folders the scanner is allowed to index.
  </p>
  <ScanFolders
    machineId={machine?.id ?? null}
    initialFolders={scanConfig?.approved_folders ?? []}
  />
</section>
```

---

## 5. Server Action Imports

Add to `ScanFolders.tsx` (already shown inline above):
```typescript
import { addApprovedFolder, removeApprovedFolder } from "@/lib/actions/scan-config"
```

**Full Server Action signatures** (from `lib/actions/scan-config.ts`):
```typescript
"use server"

export async function addApprovedFolder(
  machineId: string,
  folder: string
): Promise<{ error?: string }>
// Validates path starts with / or ~/
// Read-then-upsert: reads existing row, deduplicates in TypeScript, upserts full array
// Returns {} on success, { error: string } on failure

export async function removeApprovedFolder(
  machineId: string,
  folder: string
): Promise<{ error?: string }>
// Read-then-upsert: filters out the folder and upserts updated array
// Returns {} on success, { error: string } on failure
```

---

## 6. Env Vars / Config

None required. Both new sections use the existing Supabase client (`createClient()` from `@/lib/supabase/server`) and the existing Server Actions from `lib/actions/scan-config.ts`. No new environment variables.

---

## 7. Validation Rules (implemented in ScanFolders component)

| Rule | Location | Behaviour |
|------|----------|-----------|
| Path not empty | Client-side in `handleAdd()` | Show "Path must not be empty" error inline |
| Path starts with `/` or `~/` | Client-side in `handleAdd()` | Show "Path must start with / or ~/" error inline |
| Duplicate prevention | Server Action (dedup in TypeScript) | Server silently ignores duplicates — no UI feedback needed |
| machineId null guard | Render-time check | Replaces entire section with "Run a scan first to enable folder management" |

Error display: the `error` string is shown as `<p className="text-sm text-red-600">` immediately below the input row. It is cleared on every new add attempt.

---

## Summary: Files to Create / Modify

| Action   | File                                              | What to do                                              |
|----------|---------------------------------------------------|---------------------------------------------------------|
| Modify   | `app/(dashboard)/settings/page.tsx`               | Extend machines query, add scanConfig query, add two new `<section>` blocks, add two new imports |
| Create   | `app/(dashboard)/settings/MachineDetails.tsx`     | Server component — definition list of machine fields    |
| Create   | `app/(dashboard)/settings/ScanFolders.tsx`        | Client component — add/remove folder UI with validation |
