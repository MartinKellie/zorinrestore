# Inventory UI Spec — INV-01 through INV-09

**Target file:** `app/(dashboard)/inventory/InventoryView.tsx`
**Status:** Ready for Cursor implementation

This spec is self-contained. Cursor needs no additional context to implement the full inventory view. Replace the stub `InventoryView` component entirely — do not keep the placeholder div.

---

## 1. What Already Exists

### File to replace
`app/(dashboard)/inventory/InventoryView.tsx` — current stub renders `<div>Inventory UI coming soon</div>`. Replace the entire file.

### Server Component that calls InventoryView
`app/(dashboard)/inventory/page.tsx` passes these props (already implemented — do not modify):
```typescript
<InventoryView
  items={items}           // ScanItem[]
  machine={machine ?? null}
  latestRun={latestRun}
/>
```

### Types — define these in InventoryView.tsx (or a co-located types file)
```typescript
export interface ScanItem {
  id: string
  scan_run_id: string
  category: string
  tool_name: string
  version: string | null
  install_path: string | null
  importance: string        // "Essential" | "Useful" | "Optional" | "Ignore"
  confidence: string        // "high" | "medium" | "low"
  needs_review: boolean
  metadata: Record<string, unknown> | null
  ai_notes: string | null
  general_note: string | null
  restore_note: string | null
  updated_at: string
  has_secret_dep: boolean
}

export interface Machine {
  id: string
  label: string | null
  hostname: string
  last_scan_at: string | null
}

export interface ScanRun {
  id: string
  scanned_at: string
  machine_id: string
}
```

### Server Actions — import from these paths
```typescript
import { updateItemImportance, updateItemNotes } from "@/lib/actions/inventory"
import { flagSecretDep } from "@/lib/actions/secrets"
```

#### Signatures
```typescript
// lib/actions/inventory.ts
updateItemImportance(itemId: string, importance: string): Promise<{ error?: string }>
updateItemNotes(itemId: string, notes: { general_note?: string; restore_note?: string }): Promise<{ error?: string }>

// lib/actions/secrets.ts
flagSecretDep(itemId: string, value: boolean): Promise<{ error?: string }>
```

### Tailwind v4 card/section pattern (match existing pages)
```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Section Title</h2>
</section>
```
Text utilities: `text-sm text-gray-500`, `text-sm text-gray-900`, `text-sm font-medium text-gray-700`, `text-2xl font-semibold`.
No `tailwind.config.js` — CSS-first config via `globals.css`. Use standard Tailwind v4 classes only.

### Nav bar — also add to layout
`app/(dashboard)/layout.tsx` currently renders just `<div className="min-h-screen">{children}</div>`.
Add a horizontal sticky nav bar inside the layout wrapping div. See Section 5 (Nav Bar) for details.

---

## 2. Where to Add It

### Primary file
Replace `app/(dashboard)/inventory/InventoryView.tsx` entirely.

### Props interface
```typescript
interface InventoryViewProps {
  items: ScanItem[]
  machine: Machine | null
  latestRun: ScanRun | null
}
```

### Nav bar addition
Modify `app/(dashboard)/layout.tsx` to add a horizontal nav bar. This nav appears on all dashboard pages.

---

## 3. Layout Description

### Page structure (top to bottom)
1. **Header row**: machine name (from `machine.label ?? machine.hostname`) left-aligned, last scan date right-aligned (from `latestRun.scanned_at` formatted as locale date string). If `machine` is null, show "No machine registered yet."
2. **Filter bar** (below header): three inline controls on one row
   - Category dropdown: `<select>` with "All categories" + one option per unique category value from items, sorted alphabetically
   - Importance dropdown: `<select>` with options: "All importance", "Essential", "Useful", "Optional", "Ignore"
   - "Show ignored" toggle: `<label>` with `<input type="checkbox">`, label text "Show ignored items", default `checked={false}`
3. **Item list**: grouped sections, one per category. If no items and no active filter, show empty state (see Section 6).

### Category sections
- Section heading: category name, capitalized/prettified (replace underscores with spaces, title-case)
- Collapsible: open by default. Clicking the heading row toggles open/closed.
- Items within each section sorted alphabetically by `tool_name`
- Use `Array.prototype.reduce` for groupBy — do NOT use `Object.groupBy` (Node.js compatibility)

### Item row (inside a category section)
Each row contains:
- `tool_name` — `text-sm font-medium text-gray-900`
- `version` — `text-sm text-gray-500` (show "—" if null)
- Importance badge — colour-coded pill (see Section 7 for colours)
- Confidence dot indicator — coloured circle (see Section 7)

Clicking anywhere on the row opens the item detail drawer for that item.

---

## 4. Item Detail Drawer (INV-06, INV-07, INV-08, INV-09, SEC-04)

### Positioning
- `position: fixed`, right-0, top-0, h-full, w-96 (`w-96` = 384px)
- `bg-white shadow-xl z-50`
- Semi-transparent overlay behind drawer: `fixed inset-0 bg-black/30 z-40`
- Clicking the overlay closes the drawer (with unsaved-changes guard)

### Drawer open/close
- Drawer is open when `selectedItemId` is not null
- Close on: overlay click, Escape key press
- If there are unsaved changes, show a browser-native confirmation dialog before closing: `"You have unsaved changes. Discard them?"` — if user cancels, drawer stays open

### Drawer header
- `tool_name` as h2 (`text-lg font-semibold`)
- Close button (×) top-right: `className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"`

### Read-only fields (display only)
| Field | Label | Display |
|-------|-------|---------|
| `category` | Category | plain text |
| `version` | Version | plain text, "—" if null |
| `install_path` | Install path | `font-mono text-xs`, "—" if null |
| `confidence` | Confidence | badge (see colours in Section 7) |
| `updated_at` | Last seen | formatted as locale date string |

### Editable fields
**Importance** (INV-06):
- `<select>` with options: Essential, Useful, Optional, Ignore
- Default value: current `item.importance`
- Tracks local state — only saved on Save button click

**General note** (INV-07):
- `<textarea rows={3}>` — free-form text
- Placeholder: "Add a general note about this item…"
- Default value: current `item.general_note ?? ""`
- Tracks local state

**Restore note** (INV-08):
- `<textarea rows={3}>` — what would be needed to restore this tool
- Placeholder: "Describe restore steps for this item…"
- Default value: current `item.restore_note ?? ""`
- Tracks local state

**Has secret dependency** (SEC-04):
- `<input type="checkbox">` labelled "Has secret dependency"
- Default: current `item.has_secret_dep`
- Calls `flagSecretDep(item.id, checked)` immediately on change (no Save button required)
- When checked: show a note below the checkbox: `<a href="/secrets" className="text-sm text-blue-600 underline">Manage secrets</a>`

### Save button
- Label: "Save changes" (idle), "Saving…" (pending), "Saved" (success for 2 seconds then back to idle)
- `className="w-full mt-4 px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-50"`
- On click:
  1. Build changed-fields diff (only fields that differ from original item values)
  2. If importance changed: call `updateItemImportance(item.id, newImportance)`
  3. If general_note or restore_note changed: call `updateItemNotes(item.id, { general_note?, restore_note? })` with only changed fields
  4. If any action returns `{ error }`: show error below Save button in red (`text-sm text-red-600`)
  5. On success: show "Saved" state, clear dirty tracking, update the local item list to reflect new values

### Advanced / Debug Evidence section (INV-09)
- `<details>` element, `<summary>` label: "Advanced / Debug Evidence"
- Closed by default
- Inside: show `item.metadata` formatted as `<pre className="text-xs font-mono bg-gray-50 rounded p-3 overflow-auto max-h-48">{JSON.stringify(item.metadata, null, 2)}</pre>`
- If `item.metadata` is null: show "No metadata available."
- `item.ai_notes` (if present): show above the metadata block with label "AI notes" in `text-sm text-gray-500`

---

## 5. Nav Bar (add to layout.tsx)

Add this nav bar to `app/(dashboard)/layout.tsx` above `{children}`:

```tsx
import Link from "next/link"

// Add inside the wrapping div, before {children}:
<nav className="sticky top-0 z-30 bg-white border-b px-8 py-3 flex gap-6 text-sm font-medium">
  <Link href="/inventory" className="...">Inventory</Link>
  <Link href="/review" className="...">Review Queue</Link>
  <Link href="/secrets" className="...">Secrets</Link>
  <Link href="/export" className="...">Export</Link>
  <Link href="/settings" className="...">Settings</Link>
</nav>
```

Active link style: use `usePathname()` from `next/navigation` to detect active route. The layout must become a Client Component (`"use client"`) to use `usePathname`. Active link class: `text-gray-900 underline underline-offset-4`, inactive: `text-gray-500 hover:text-gray-900`.

---

## 6. Filter Logic (INV-02, INV-03, INV-04, INV-05)

### State shape
```typescript
const [filters, setFilters] = useState<{
  category: string | null    // null = all
  importance: string | null  // null = all
  showIgnored: boolean       // default false
}>({ category: null, importance: null, showIgnored: false })

const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
```

### Filtering rules
Apply filters client-side to the `items` prop array:
1. If `filters.category` is set: keep only items where `item.category === filters.category`
2. If `filters.importance` is set: keep only items where `item.importance === filters.importance`
3. If `filters.importance` is NOT set AND `filters.showIgnored` is false: exclude items where `item.importance === "Ignore"`
4. If `filters.showIgnored` is true AND `filters.importance` is not set: include ignored items (no exclusion)
5. When `filters.importance` is set to "Ignore" explicitly: always show them (no conflict with showIgnored toggle)

The showIgnored toggle is irrelevant when importance filter is set — an importance filter takes precedence.

### Category dropdown
Build options from all unique `item.category` values in the original `items` array (not the filtered result), sorted alphabetically.

---

## 7. Visual Guidelines

### Importance badge colours
| Value | Classes |
|-------|---------|
| Essential | `bg-green-100 text-green-800` |
| Useful | `bg-blue-100 text-blue-800` |
| Optional | `bg-gray-100 text-gray-600` |
| Ignore | `bg-red-50 text-red-400` |

Badge wrapper: `className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {colour classes}"`

### Confidence dot indicator
| Value | Dot class |
|-------|-----------|
| high | `bg-green-500` |
| medium | `bg-yellow-400` |
| low | `bg-red-400` |

Dot: `<span className="inline-block w-2 h-2 rounded-full {colour}" title="{confidence}" />`

### Collapsible section header row
```tsx
<button className="w-full flex justify-between items-center py-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
  <span>{prettyCategory}</span>
  <span>{isOpen ? "▲" : "▼"} {itemCount} items</span>
</button>
```

### Item row
```tsx
<div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer">
  <span className="flex-1 text-sm font-medium text-gray-900">{tool_name}</span>
  <span className="text-sm text-gray-500">{version ?? "—"}</span>
  {/* importance badge */}
  {/* confidence dot */}
</div>
```

---

## 8. Empty States

### No items at all (INV-01 — no scan data)
Show when `items.length === 0` and `latestRun` is null:
```tsx
<div className="rounded-lg border p-12 text-center">
  <p className="text-sm text-gray-500">No scan data yet. Run the scanner to populate your inventory.</p>
</div>
```

### No items after filtering
Show when filtered items list is empty but `items.length > 0`:
```tsx
<div className="rounded-lg border p-8 text-center">
  <p className="text-sm text-gray-500">No items match the current filters.</p>
</div>
```

---

## 9. Keyboard and Accessibility

- Escape key closes the drawer (add `useEffect` with `keydown` listener on `document`)
- All interactive elements (drawer close button, item rows, Save button) must be keyboard-accessible
- Category section collapse toggle is a `<button>` (not a div) for keyboard access
- Item rows: use `role="button" tabIndex={0}` or wrap in `<button>` for accessibility

---

## 10. Server Actions / Env Vars

No environment variables needed for this component. All Server Actions are imported from `@/lib/actions/inventory` and `@/lib/actions/secrets` — no direct Supabase client calls in the client component.

---

## 11. Implementation Checklist for Cursor

- [ ] Replace `app/(dashboard)/inventory/InventoryView.tsx` with full client component
- [ ] Define `ScanItem`, `Machine`, `ScanRun` interfaces in the file
- [ ] Import `updateItemImportance`, `updateItemNotes` from `@/lib/actions/inventory`
- [ ] Import `flagSecretDep` from `@/lib/actions/secrets`
- [ ] Implement filter bar (category dropdown, importance dropdown, showIgnored checkbox)
- [ ] Implement `groupBy` using `Array.prototype.reduce` (NOT `Object.groupBy`)
- [ ] Implement collapsible category sections (open by default)
- [ ] Implement item rows with importance badge and confidence dot
- [ ] Implement slide-over drawer (fixed right panel + overlay)
- [ ] Implement all editable drawer fields (importance, general_note, restore_note)
- [ ] Implement `has_secret_dep` checkbox with immediate `flagSecretDep` call and /secrets link
- [ ] Implement Save button with loading/success/error states
- [ ] Implement "Advanced / Debug Evidence" `<details>` section (INV-09)
- [ ] Implement both empty states (no scan data vs no filter results)
- [ ] Implement Escape key close for drawer
- [ ] Implement unsaved-changes confirmation on drawer close
- [ ] Update `app/(dashboard)/layout.tsx` to add sticky horizontal nav bar with active link detection
