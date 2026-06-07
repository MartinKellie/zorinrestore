# Review Queue UI Spec — REVQ-01 through REVQ-03

**Target file:** `app/(dashboard)/review/ReviewView.tsx`
**Status:** Ready for Cursor implementation

This spec is self-contained. Cursor needs no additional context to implement the full review queue view. Replace the stub `ReviewView` component entirely — do not keep the placeholder div.

---

## 1. What Already Exists

### File to replace

`app/(dashboard)/review/ReviewView.tsx` — current stub renders `<div>Review Queue UI coming soon</div>`. Replace the entire file.

### Server Component that calls ReviewView

`app/(dashboard)/review/page.tsx` passes these props (already implemented — do not modify):

```typescript
<ReviewView items={items} />  // items: Record<string, unknown>[]
```

### Types — define these in ReviewView.tsx (or a co-located types file)

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
```

### Server Action — import from this path

```typescript
import { classifyReviewItem } from "@/lib/actions/review"
```

#### Signature

```typescript
// lib/actions/review.ts
classifyReviewItem(itemId: string, classification: string): Promise<{ error?: string }>
// classification must be one of: "Essential" | "Useful" | "Optional" | "Ignore"
// On success: sets importance = classification, needs_review = false
// On error: returns { error: string }
```

### Tailwind v4 card/section pattern (match existing pages)

```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Section Title</h2>
</section>
```

---

## 2. Where to Add It

- **File:** `app/(dashboard)/review/ReviewView.tsx`
- **Action:** Replace the entire file contents
- **Props received:** `{ items: ScanItem[] }` (page.tsx casts to `Record<string, unknown>[]` — treat as `ScanItem[]` inside the component)
- **Do not modify:** `app/(dashboard)/review/page.tsx`

---

## 3. Layout Description

### Page shell

```
Page heading row:
  "Review Queue"  [badge: N items]
  Subtitle text

Item list (one card per item)

Empty state (when items.length === 0)
```

### Page heading row

- `<h1 className="text-2xl font-semibold">Review Queue</h1>`
- Inline badge next to heading: `<span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">{items.length}</span>`
- Subtitle below: `<p className="text-sm text-gray-500">These items were detected with low confidence or are unknown tools. Classify each to add it to your inventory.</p>`

### Item card (REVQ-01 — list all items needing review)

Each item in the local `items` state renders one card:

```
[card: rounded-lg border p-6 space-y-4]
  [header row]
    tool_name (bold)            confidence badge
    category (muted)  ·  version (if present)

  [metadata row — if metadata has keys]
    First key-value from metadata JSONB as a small muted label

  [classification buttons row — REVQ-02]
    [Essential] [Useful] [Optional] [Ignore]

  [error row — only when error present for this item]
    Error message text
```

**Header row:**
- `<span className="text-sm font-medium text-gray-700">{item.tool_name}</span>`
- Confidence badge (low confidence = items in review queue):
  - `low`: `<span className="rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5">low confidence</span>`
  - `medium`: `<span className="rounded-full bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5">medium confidence</span>`
  - `high`: `<span className="rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5">high confidence</span>`
- Category: `<span className="text-sm text-gray-500">{item.category}</span>`
- Version: if `item.version`, render `<span className="text-sm text-gray-500"> · {item.version}</span>`

**Metadata row:**
- If `item.metadata` is not null and has at least one key: take the first key-value pair
- Render: `<p className="text-xs text-gray-400">{firstKey}: {String(firstValue)}</p>`
- Skip row if metadata is null or empty

**Classification buttons row (REVQ-02):**
- `<div className="flex gap-2 flex-wrap">`
- Four buttons: "Essential", "Useful", "Optional", "Ignore"
- Button variant styles (outline style, not filled):
  - Essential: `className="rounded border border-green-500 text-green-700 px-3 py-1 text-sm hover:bg-green-50 disabled:opacity-50"`
  - Useful: `className="rounded border border-blue-500 text-blue-700 px-3 py-1 text-sm hover:bg-blue-50 disabled:opacity-50"`
  - Optional: `className="rounded border border-gray-400 text-gray-600 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"`
  - Ignore: `className="rounded border border-red-400 text-red-600 px-3 py-1 text-sm hover:bg-red-50 disabled:opacity-50"`
- While `classifying[item.id]` is true: all four buttons for that card are `disabled`, show loading button text as `"..."` on the button that was clicked (track with local state or just disable all four)
- `onClick`: call the classify handler (see Behaviour section)

**Error row:**
- If `errors[item.id]` is set: `<p className="text-sm text-red-600">{errors[item.id]}</p>`

### Empty state (REVQ-03 — classified items leave the queue)

When `items.length === 0`:

```tsx
<div className="rounded-lg border p-12 text-center space-y-2">
  <p className="text-sm font-medium text-gray-700">All items have been classified.</p>
  <p className="text-sm text-gray-500">Your inventory is up to date.</p>
  <a href="/inventory" className="text-sm text-blue-600 hover:underline">
    View inventory
  </a>
</div>
```

---

## 4. Behaviour

### Component state

```typescript
const [items, setItems] = useState<ScanItem[]>(props.items as ScanItem[])
const [classifying, setClassifying] = useState<Record<string, boolean>>({})
const [errors, setErrors] = useState<Record<string, string>>({})
```

### Classification flow (REVQ-02, REVQ-03)

```typescript
async function handleClassify(itemId: string, classification: string) {
  // Set loading state
  setClassifying(prev => ({ ...prev, [itemId]: true }))
  // Clear any previous error
  setErrors(prev => { const next = { ...prev }; delete next[itemId]; return next })

  const result = await classifyReviewItem(itemId, classification)

  if (result.error) {
    // Show inline error on the card
    setErrors(prev => ({ ...prev, [itemId]: result.error! }))
    setClassifying(prev => ({ ...prev, [itemId]: false }))
  } else {
    // Optimistic removal — item disappears from queue (REVQ-03)
    setItems(prev => prev.filter(item => item.id !== itemId))
    setClassifying(prev => { const next = { ...prev }; delete next[itemId]; return next })
  }
}
```

### Button disabled logic

All four classification buttons for a given card are `disabled={!!classifying[item.id]}`.

No confirmation dialog — classification is immediate. Users can re-classify items from `/inventory` at any time.

---

## 5. Visual Guidelines

| Element | Class pattern |
|---------|--------------|
| Page wrapper | `className="space-y-6"` |
| Heading row | `className="flex items-center gap-2"` |
| Item list | `className="space-y-4"` |
| Item card | `className="rounded-lg border p-6 space-y-4"` |
| Card header | `className="flex items-start justify-between gap-2"` |
| Card header left | `className="space-y-0.5"` |
| tool_name | `className="text-sm font-medium text-gray-700"` |
| category + version | `className="text-sm text-gray-500"` |
| Metadata row | `className="text-xs text-gray-400"` |
| Buttons row | `className="flex gap-2 flex-wrap"` |
| Error text | `className="text-sm text-red-600"` |
| Empty state wrapper | `className="rounded-lg border p-12 text-center space-y-2"` |

Match the card `rounded-lg border p-6 space-y-4` pattern used in the Settings page and other dashboard views.

---

## 6. Server Actions Called

```typescript
import { classifyReviewItem } from "@/lib/actions/review"

// classifyReviewItem(itemId: string, classification: string): Promise<{ error?: string }>
// Valid classification values: "Essential" | "Useful" | "Optional" | "Ignore"
```

---

## 7. Env Vars / Config

None. No feature flags. No environment variables needed by this component.

---

## Requirements Coverage

| Requirement | Covered by |
|-------------|-----------|
| REVQ-01 — List all items needing review | Item card list, renders all items from props |
| REVQ-02 — Classification buttons per item | Four buttons per card, calls classifyReviewItem |
| REVQ-03 — Classified items leave the queue | Optimistic removal from local state on success |
