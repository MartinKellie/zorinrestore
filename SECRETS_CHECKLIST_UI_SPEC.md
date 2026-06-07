# Secrets Checklist UI Spec — SEC-01 through SEC-04

**Target file:** `app/(dashboard)/secrets/SecretsView.tsx`
**Status:** Ready for Cursor implementation

This spec is self-contained. Cursor needs no additional context to implement the full secrets checklist view. Replace the stub `SecretsView` component entirely — do not keep the placeholder div.

---

## 1. What Already Exists

### File to replace

`app/(dashboard)/secrets/SecretsView.tsx` — current stub renders `<div>Secrets Checklist UI coming soon</div>`. Replace the entire file.

### Server Component that calls SecretsView

`app/(dashboard)/secrets/page.tsx` passes these props (already implemented — do not modify):

```typescript
<SecretsView
  reminders={reminders}         // Record<string, unknown>[] (cast to SecretReminder[])
  envItems={envItems}           // Record<string, unknown>[] (cast to ScanItem[])
  flaggedItems={flaggedItems}   // Record<string, unknown>[] (cast to ScanItem[])
/>
```

- `reminders`: rows from `secret_reminders` table, scoped to current user, ordered by `created_at` ascending
- `envItems`: scan_items where `category = 'env_files'` from the latest scan run, ordered by `tool_name`
- `flaggedItems`: scan_items where `has_secret_dep = true` from the latest scan run, ordered by `category`

### Types — define these in SecretsView.tsx (or a co-located types file)

```typescript
export interface SecretReminder {
  id: string
  user_id: string
  name: string
  note: string | null
  created_at: string
}

export interface ScanItem {
  id: string
  scan_run_id: string
  category: string
  tool_name: string
  version: string | null
  install_path: string | null
  importance: string
  confidence: string
  needs_review: boolean
  metadata: Record<string, unknown> | null
  ai_notes: string | null
  general_note: string | null
  restore_note: string | null
  updated_at: string
  has_secret_dep: boolean
}
```

For env_files items, `metadata.variable_names` is an array of string variable names detected in that .env file:

```typescript
// Access pattern:
const varNames = (item.metadata?.variable_names as string[] | undefined) ?? []
```

### Server Actions — import from these paths

```typescript
import { addSecretReminder, deleteSecretReminder } from "@/lib/actions/secrets"
```

#### Signatures

```typescript
// lib/actions/secrets.ts
addSecretReminder(name: string, note?: string): Promise<{ error?: string }>
// Validates name non-empty server-side; returns { error } on failure

deleteSecretReminder(reminderId: string): Promise<{ error?: string }>
// Verifies ownership via RLS before deleting; returns { error } on failure
```

### Tailwind v4 card/section pattern (match existing pages)

```tsx
<section className="rounded-lg border p-6 space-y-4">
  <h2 className="text-base font-semibold">Section Title</h2>
</section>
```

---

## 2. Where to Add It

- **File:** `app/(dashboard)/secrets/SecretsView.tsx`
- **Action:** Replace the entire file contents
- **Props received:** `{ reminders: SecretReminder[], envItems: ScanItem[], flaggedItems: ScanItem[] }` (page.tsx casts to `Record<string, unknown>[]` — treat as the typed interfaces inside the component)
- **Do not modify:** `app/(dashboard)/secrets/page.tsx`

---

## 3. Layout Description

### Page shell

```
Page heading
Subtitle

Section 1: Detected .env Variables
Section 2: Manual Reminders
Section 3: Inventory Items with Secret Dependencies
```

### Page heading

- `<h1 className="text-2xl font-semibold">Secrets Checklist</h1>`
- Subtitle: `<p className="text-sm text-gray-500">Track which secrets need to be recreated during a machine rebuild. Values are never stored.</p>`

---

### Section 1 — Detected .env Variables (SEC-01)

Source: `envItems` prop.

**Purpose:** Read-only display of .env files the scanner found and the variable names within them.

```
[card: rounded-lg border p-6 space-y-4]
  Section heading: "Detected .env Variables"

  For each envItem:
    file path row: tool_name (the file path) — muted, small
    variable tags row: one tag per variable name in metadata.variable_names

  Empty state (when envItems.length === 0):
    "No .env files detected. Run the scanner to populate."
```

**Per env item:**

```tsx
<div className="space-y-1">
  <p className="text-sm font-medium text-gray-700">{item.tool_name}</p>
  <div className="flex flex-wrap gap-1">
    {varNames.map(name => (
      <span
        key={name}
        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-mono"
      >
        {name}
      </span>
    ))}
    {varNames.length === 0 && (
      <span className="text-xs text-gray-400">No variable names detected</span>
    )}
  </div>
</div>
```

**Empty state (no env items):**

```tsx
<p className="text-sm text-gray-500">No .env files detected. Run the scanner to populate.</p>
```

---

### Section 2 — Manual Reminders (SEC-01, SEC-02)

Source: `reminders` local state (initialised from props).

**Purpose:** User-managed list of secret names to remember. Values are never stored — only names/labels.

```
[card: rounded-lg border p-6 space-y-4]
  Section heading: "Manual Reminders"
  Helper text: "Add the name of the secret, not its value"

  Existing reminders list:
    For each reminder:
      [name bold]  [note muted]  [created date muted]  [Delete button]

  Empty state (when reminders.length === 0, above form):
    "No reminders yet."

  Add reminder form:
    Label: "Name" → text input (required, placeholder "e.g. GitHub personal access token")
    Label: "Note (optional)" → text input (placeholder "e.g. Used for CI/CD pipeline")
    "Add Reminder" button (disabled while submitting)

  Inline error (when addError is set):
    Error text below form
```

**Per reminder row:**

```tsx
<div className="flex items-start justify-between gap-2">
  <div className="space-y-0.5">
    <p className="text-sm font-medium text-gray-700">{reminder.name}</p>
    {reminder.note && (
      <p className="text-sm text-gray-500">{reminder.note}</p>
    )}
    <p className="text-xs text-gray-400">
      Added {new Date(reminder.created_at).toLocaleDateString()}
    </p>
  </div>
  <button
    onClick={() => handleDelete(reminder.id)}
    disabled={deletingId === reminder.id}
    className="text-sm text-red-600 hover:underline disabled:opacity-50 shrink-0"
  >
    {deletingId === reminder.id ? "Deleting..." : "Delete"}
  </button>
</div>
```

**Add reminder form:**

```tsx
<form onSubmit={handleAddReminder} className="space-y-3 border-t pt-4">
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700" htmlFor="reminder-name">
      Name
    </label>
    <input
      id="reminder-name"
      type="text"
      required
      placeholder="e.g. GitHub personal access token"
      value={form.name}
      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
      className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700" htmlFor="reminder-note">
      Note <span className="text-gray-400 font-normal">(optional)</span>
    </label>
    <input
      id="reminder-note"
      type="text"
      placeholder="e.g. Used for CI/CD pipeline"
      value={form.note}
      onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
      className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
  {addError && <p className="text-sm text-red-600">{addError}</p>}
  <button
    type="submit"
    disabled={submitting}
    className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {submitting ? "Adding..." : "Add Reminder"}
  </button>
</form>
```

---

### Section 3 — Inventory Items with Secret Dependencies (SEC-03, SEC-04)

Source: `flaggedItems` prop (read-only display).

**Purpose:** Show inventory items that have been flagged as having secret dependencies (flagged from the inventory item detail drawer — see INVENTORY_UI_SPEC.md). This page does not allow flagging/unflagging.

```
[card: rounded-lg border p-6 space-y-4]
  Section heading: "Inventory Items with Secret Dependencies"
  Helper text: "Flag items as having secret dependencies from the inventory view."

  For each flaggedItem:
    tool_name + category + link to /inventory#item-{id}

  Empty state (when flaggedItems.length === 0):
    "No inventory items are flagged as having secret dependencies yet. Flag items from the inventory view."
```

**Per flagged item:**

```tsx
<div className="flex items-center justify-between gap-2">
  <div className="space-y-0.5">
    <p className="text-sm font-medium text-gray-700">{item.tool_name}</p>
    <p className="text-xs text-gray-500">{item.category}</p>
  </div>
  <a
    href={`/inventory#item-${item.id}`}
    className="text-sm text-blue-600 hover:underline shrink-0"
  >
    View in inventory
  </a>
</div>
```

**Empty state:**

```tsx
<p className="text-sm text-gray-500">
  No inventory items are flagged as having secret dependencies yet.{" "}
  <a href="/inventory" className="text-blue-600 hover:underline">
    Flag items from the inventory view.
  </a>
</p>
```

---

## 4. Behaviour

### Component state

```typescript
// Reminders list — local copy for optimistic updates
const [reminders, setReminders] = useState<SecretReminder[]>(props.reminders as SecretReminder[])

// Add form state
const [form, setForm] = useState<{ name: string; note: string }>({ name: "", note: "" })
const [submitting, setSubmitting] = useState(false)
const [addError, setAddError] = useState<string | null>(null)

// Delete state
const [deletingId, setDeletingId] = useState<string | null>(null)
```

### Add reminder flow (SEC-02)

```typescript
async function handleAddReminder(e: React.FormEvent) {
  e.preventDefault()
  if (!form.name.trim()) return  // client-side guard (input is required, but be explicit)

  setSubmitting(true)
  setAddError(null)

  const result = await addSecretReminder(form.name.trim(), form.note.trim() || undefined)

  if (result.error) {
    setAddError(result.error)
    setSubmitting(false)
  } else {
    // Optimistic add — insert at end of list with a temporary id
    const tempReminder: SecretReminder = {
      id: crypto.randomUUID(),
      user_id: "",   // not used in display
      name: form.name.trim(),
      note: form.note.trim() || null,
      created_at: new Date().toISOString(),
    }
    setReminders(prev => [...prev, tempReminder])
    setForm({ name: "", note: "" })
    setSubmitting(false)
  }
}
```

Note: the actual `id` returned by the server action is not available (Server Actions return `{ error? }` only). The optimistic entry uses `crypto.randomUUID()` as a temporary id. On next page load the real data is fetched by the Server Component. This is acceptable since the user only needs to see the item was added.

### Delete reminder flow (SEC-02)

```typescript
async function handleDelete(reminderId: string) {
  setDeletingId(reminderId)

  const result = await deleteSecretReminder(reminderId)

  if (result.error) {
    // Log error but still clear deletingId — don't leave UI in broken state
    console.error("Delete failed:", result.error)
    setDeletingId(null)
  } else {
    // Optimistic removal
    setReminders(prev => prev.filter(r => r.id !== reminderId))
    setDeletingId(null)
  }
}
```

---

## 5. Visual Guidelines

| Element | Class pattern |
|---------|--------------|
| Page wrapper | `className="space-y-6"` |
| Section card | `className="rounded-lg border p-6 space-y-4"` |
| Section heading | `className="text-base font-semibold"` |
| Helper text | `className="text-sm text-gray-500"` |
| Item name | `className="text-sm font-medium text-gray-700"` |
| Item muted text | `className="text-sm text-gray-500"` |
| Small muted text | `className="text-xs text-gray-400"` |
| Variable name tag | `className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-mono"` |
| Reminder row | `className="flex items-start justify-between gap-2"` |
| Delete button | `className="text-sm text-red-600 hover:underline disabled:opacity-50 shrink-0"` |
| Add button | `className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"` |
| Form input | `className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"` |
| Error text | `className="text-sm text-red-600"` |
| Link | `className="text-blue-600 hover:underline"` |

---

## 6. Server Actions Called

```typescript
import { addSecretReminder, deleteSecretReminder } from "@/lib/actions/secrets"

// addSecretReminder(name: string, note?: string): Promise<{ error?: string }>
// deleteSecretReminder(reminderId: string): Promise<{ error?: string }>
```

flagSecretDep is NOT called from this view. It is called from the inventory item detail drawer (INVENTORY_UI_SPEC.md).

---

## 7. Env Vars / Config

None. No feature flags. No environment variables needed by this component.

---

## Requirements Coverage

| Requirement | Covered by |
|-------------|-----------|
| SEC-01 — Display detected .env files and their variable names | Section 1: envItems rendered with metadata.variable_names tags |
| SEC-02 — Add and delete manual secret reminders | Section 2: addSecretReminder / deleteSecretReminder with optimistic updates |
| SEC-03 — Display inventory items flagged with secret dependencies | Section 3: flaggedItems list with link to /inventory#item-{id} |
| SEC-04 — Flag items from inventory (not from this page) | Cross-reference note in Section 3; flagging handled in INVENTORY_UI_SPEC.md |
