# Export UI Spec — EXP-01 through EXP-04

**Target file:** `app/(dashboard)/export/ExportView.tsx`
**Spec for:** Cursor implementation session
**Requirements covered:** EXP-01, EXP-02, EXP-03, EXP-04

---

## What Already Exists

### File to replace

```
app/(dashboard)/export/ExportView.tsx   ← replace this stub
```

Current stub (replace completely):

```tsx
"use client"

// Placeholder — Cursor will replace this via a future UI spec
export function ExportView() {
  return <div>Export UI coming soon</div>
}
```

### Parent server component (do NOT modify)

```tsx
// app/(dashboard)/export/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExportView } from "./ExportView"

export default async function ExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <ExportView />
}
```

### Export API routes (do NOT modify — these already exist)

```
GET /api/export/markdown   → returns machine-inventory.md as a file download attachment
GET /api/export/json       → returns machine-inventory.json as a file download attachment

Both routes support one query parameter:
  ?include_ignored=true    → include items with importance = "Ignore"
                             (omit param or use ?include_ignored=false to exclude them)

Both routes require authentication — redirect to /login if unauthenticated.
```

---

## Where to Add It

**Replace:** `app/(dashboard)/export/ExportView.tsx` — complete file replacement.

**Props:** No props are needed. The page passes `<ExportView />` with no arguments.

**Exports:** Keep the named export `export function ExportView()` — the page imports it by name.

---

## Behaviour (EXP-01 through EXP-04)

### EXP-01: Include Ignored checkbox

- Component has one piece of state: `includeIgnored: boolean`, default `false`
- Renders a checkbox labelled "Include ignored items"
- When checked, `includeIgnored` becomes `true`; when unchecked, `false`
- The checkbox controls the `?include_ignored=true` query param appended to both download link hrefs

### EXP-02: Markdown download link

- Renders as a native `<a>` element (not a `<button>`)
- Has `download` attribute so the browser triggers a file download
- `href` is computed:
  ```tsx
  href={`/api/export/markdown${includeIgnored ? '?include_ignored=true' : ''}`}
  ```
- Label: "Download Markdown (.md)"
- Helper text below the link: "Human-readable rebuild reference with categories, notes, and restore instructions"

### EXP-03: JSON download link

- Renders as a native `<a>` element (not a `<button>`)
- Has `download` attribute so the browser triggers a file download
- `href` is computed:
  ```tsx
  href={`/api/export/json${includeIgnored ? '?include_ignored=true' : ''}`}
  ```
- Label: "Download JSON (.json)"
- Helper text below the link: "Structured backup for import or automation"

### EXP-04: No loading states

- There are no loading spinners, disabled states, or fetch calls
- The browser handles the file download natively when the user clicks an anchor tag
- No `fetch()`, `axios`, or Server Action calls in this component
- State machine is trivial: one boolean toggle, two computed hrefs

---

## Layout Description

### Page structure

```
<main> or <div> wrapper
  <h1> Export Inventory </h1>
  <p> subtitle </p>

  <div> card </div>
    <div> checkbox row </div>
    <div> download links section </div>
      <div> markdown link row </div>
      <div> json link row </div>
```

### Heading and subtitle

```tsx
<h1 className="text-2xl font-semibold">Export Inventory</h1>
<p className="text-sm text-gray-500">
  Download your machine inventory as a Markdown rebuild reference or JSON backup.
</p>
```

### Card wrapper

```tsx
<div className="rounded-lg border p-6 space-y-4">
  {/* checkbox row */}
  {/* download links */}
</div>
```

### Checkbox row

```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="include-ignored"
    checked={includeIgnored}
    onChange={(e) => setIncludeIgnored(e.target.checked)}
    className="h-4 w-4"
  />
  <label htmlFor="include-ignored" className="text-sm">
    Include ignored items
  </label>
</div>
```

### Download links section

Each download option is a row with the anchor link and helper text below it:

```tsx
<div className="space-y-4">

  {/* Markdown */}
  <div>
    <a
      href={`/api/export/markdown${includeIgnored ? '?include_ignored=true' : ''}`}
      download
      className="text-sm font-medium underline hover:no-underline"
    >
      Download Markdown (.md)
    </a>
    <p className="text-sm text-gray-500 mt-1">
      Human-readable rebuild reference with categories, notes, and restore instructions
    </p>
  </div>

  {/* JSON */}
  <div>
    <a
      href={`/api/export/json${includeIgnored ? '?include_ignored=true' : ''}`}
      download
      className="text-sm font-medium underline hover:no-underline"
    >
      Download JSON (.json)
    </a>
    <p className="text-sm text-gray-500 mt-1">
      Structured backup for import or automation
    </p>
  </div>

</div>
```

---

## Full Component Template

```tsx
"use client"

import { useState } from "react"

export function ExportView() {
  const [includeIgnored, setIncludeIgnored] = useState(false)

  const mdHref = `/api/export/markdown${includeIgnored ? '?include_ignored=true' : ''}`
  const jsonHref = `/api/export/json${includeIgnored ? '?include_ignored=true' : ''}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Export Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download your machine inventory as a Markdown rebuild reference or JSON backup.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        {/* EXP-01: Include ignored checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-ignored"
            checked={includeIgnored}
            onChange={(e) => setIncludeIgnored(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="include-ignored" className="text-sm">
            Include ignored items
          </label>
        </div>

        {/* EXP-02 and EXP-03: Download links */}
        <div className="space-y-4">

          <div>
            <a
              href={mdHref}
              download
              className="text-sm font-medium underline hover:no-underline"
            >
              Download Markdown (.md)
            </a>
            <p className="text-sm text-gray-500 mt-1">
              Human-readable rebuild reference with categories, notes, and restore instructions
            </p>
          </div>

          <div>
            <a
              href={jsonHref}
              download
              className="text-sm font-medium underline hover:no-underline"
            >
              Download JSON (.json)
            </a>
            <p className="text-sm text-gray-500 mt-1">
              Structured backup for import or automation
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
```

---

## Server Actions Called

None. Export is driven by native anchor `href` links. No Server Actions, no `fetch()`, no loading state.

---

## Env Vars / Config

None.

---

## Notes for Cursor

- Do not add loading spinners or disabled states — the browser handles file download natively.
- Do not use `<button>` elements for the download triggers — use `<a href="..." download>`.
- The `download` attribute on an anchor tag tells the browser to download the response as a file rather than navigate to it. This works because the API routes set `Content-Disposition: attachment`.
- The `includeIgnored` checkbox must update both hrefs simultaneously (they are both derived from the same state).
- The parent `page.tsx` already handles auth — `ExportView` never needs to call `getUser()` or handle auth redirects.
