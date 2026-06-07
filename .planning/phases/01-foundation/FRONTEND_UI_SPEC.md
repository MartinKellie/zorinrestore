# Settings Page — Frontend Implementation Spec for Cursor

## Implementation Task

Implement the Settings page at `app/(dashboard)/settings/page.tsx`.

Replace the existing stub (which just shows a logged-in email and a placeholder message) with the full three-section Settings page described in this spec. You may create additional component files alongside as needed.

**Files to create or modify:**

| File | Action |
|------|--------|
| `app/(dashboard)/settings/page.tsx` | Replace stub — Server Component entry point |
| `app/(dashboard)/settings/TokensSection.tsx` | Create — Client Component for token generation modal |
| `app/(dashboard)/settings/MachineSection.tsx` | Create — Client Component for inline machine name edit |

---

## What Already Exists (imports Cursor can use directly)

### Server Actions

```typescript
// @/lib/actions/tokens
export async function generateScannerToken(label: string): Promise<string>
// Returns the raw 64-char hex token — show ONCE to the user, never persisted in DB.
// Call from a Client Component action; result must be shown immediately in modal.

export async function revokeToken(tokenId: string): Promise<void>
// Sets revoked=true for the given token. Verifies ownership before revoking.
// Throws if token doesn't belong to the authenticated user.
```

```typescript
// @/lib/actions/machines
export async function upsertMachine(data: {
  label: string;
  hostname?: string;
  os_name?: string;
  os_version?: string;
  kernel_version?: string;
  architecture?: string;
  scanner_version?: string;
  python_version?: string;
}): Promise<string>
// Returns machine ID (UUID). Creates a new machine or updates existing one.
// Call from Client Component; after success call router.refresh().
```

### Supabase Server Client

```typescript
// @/lib/supabase/server
export async function createClient(): Promise<SupabaseClient>
// Server-side only. Usage:
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
```

### Database Types (read-shape reference)

```typescript
type ScannerToken = {
  id: string;          // UUID
  label: string | null;
  created_at: string;  // ISO 8601
  last_used: string | null;
  revoked: boolean;
}

type Machine = {
  id: string;          // UUID
  label: string;       // user-facing name
  hostname: string | null;
  last_scan_at: string | null;
}
```

---

## Section 1 — Auth Status (requirement SET-01)

**Component type:** Server Component (reads auth on server; sign-out is a Client Component action inline)

**Implementation:**

1. In `app/(dashboard)/settings/page.tsx`, at the top of the Server Component:
   ```typescript
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) redirect('/login')
   ```
2. Render a card section showing:
   - Section heading: "Account"
   - Label "Email" with the user's email in a read-only `<input>` (or `<p>`)
   - "Sign out" button — this needs to be a small Client Component (`SignOutButton`) because it calls `supabase.auth.signOut()` then redirects to `/login` using `useRouter`
3. The sign-out client component:
   ```typescript
   'use client'
   import { createBrowserClient } from '@supabase/ssr'
   import { useRouter } from 'next/navigation'
   
   export function SignOutButton() {
     const router = useRouter()
     async function handleSignOut() {
       const supabase = createBrowserClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
       )
       await supabase.auth.signOut()
       router.push('/login')
     }
     return (
       <button onClick={handleSignOut} className="text-sm text-red-600 hover:text-red-700">
         Sign out
       </button>
     )
   }
   ```

**Visual layout:**

```
[ Account                                              ]
  Email: martin@example.com                [Sign out]
```

---

## Section 2 — Scanner Token Management (requirements SET-02, TOKEN-01, TOKEN-02, TOKEN-03)

**Component type:** `TokensSection` is a Client Component (`'use client'`) — manages modal open state, clipboard API, and token list refresh.

**Data loading (Server Component):**

In `app/(dashboard)/settings/page.tsx`, before rendering:
```typescript
const { data: tokens } = await supabase
  .from('scanner_tokens')
  .select('id, label, created_at, last_used, revoked')
  .order('created_at', { ascending: false })
```
Pass `tokens` as a prop to `<TokensSection initialTokens={tokens ?? []} />`.

**TokensSection component** (`app/(dashboard)/settings/TokensSection.tsx`):

```typescript
'use client'
interface Props { initialTokens: ScannerToken[] }
```

State to maintain:
- `tokens`: `ScannerToken[]` — starts from `initialTokens`; updated after revoke
- `modalOpen`: `boolean` — controls token generation modal
- `newToken`: `string | null` — raw token returned from `generateScannerToken`, stored only in component state
- `copied`: `boolean` — tracks clipboard copy
- `confirmed`: `boolean` — "I have copied this token" checkbox state
- `labelInput`: `string` — label for the new token being generated

**Token list table:**

| Column | Content |
|--------|---------|
| Label | `token.label ?? '(no label)'` |
| Created | `new Date(token.created_at).toLocaleDateString()` |
| Last used | `token.last_used ? new Date(token.last_used).toLocaleDateString() : 'Never'` |
| Status | `token.revoked ? <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Revoked</span> : <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">Active</span>` |
| Action | Revoke button (hidden when `token.revoked === true`) |

**"Generate new token" button** — opens modal, sits above or below the token table:
```tsx
<button
  onClick={() => { setModalOpen(true); setNewToken(null); setCopied(false); setConfirmed(false); setLabelInput('') }}
  className="text-sm bg-black text-white rounded px-4 py-2"
>
  Generate new token
</button>
```

**Revoke flow:**
1. Show browser `confirm()` dialog: `"Revoke this token? The scanner will no longer be able to upload."`
2. If confirmed, call `await revokeToken(token.id)`
3. Update local tokens state: set `revoked: true` on the matching token (do NOT remove from list)
4. Do not call `router.refresh()` — state update is sufficient

**Token generation modal:**

Trigger: `modalOpen === true && newToken === null` — show the label-input form.
Trigger: `modalOpen === true && newToken !== null` — show the one-time token display.

**Modal outer wrapper** (prevents click-outside dismissal):
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
    {/* modal content */}
  </div>
</div>
```

IMPORTANT: Do NOT add an `onClick` on the outer overlay div that closes the modal. Closing is only via the "Done" button (after copy confirmed) or "Cancel" button (on the label-input form). Pressing Escape must NOT close the modal.

**Step 1 — Label input form** (shown when `newToken === null`):
```tsx
<h2 className="text-lg font-semibold mb-4">Generate scanner token</h2>
<label className="block text-sm font-medium text-gray-700 mb-1">Token label</label>
<input
  type="text"
  placeholder="e.g. zorin-laptop-2026"
  value={labelInput}
  onChange={e => setLabelInput(e.target.value)}
  className="w-full border rounded px-3 py-2 text-sm mb-4"
/>
<div className="flex gap-2 justify-end">
  <button onClick={() => setModalOpen(false)} className="text-sm px-4 py-2 border rounded">Cancel</button>
  <button
    onClick={async () => {
      const raw = await generateScannerToken(labelInput)
      setNewToken(raw)
    }}
    disabled={!labelInput.trim()}
    className="text-sm bg-black text-white rounded px-4 py-2 disabled:opacity-50"
  >
    Generate
  </button>
</div>
```

**Step 2 — One-time token display** (shown when `newToken !== null`):

```tsx
<h2 className="text-lg font-semibold mb-4">Your new scanner token</h2>

{/* Warning banner */}
<div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-800">
  This token will not be shown again. Copy it now before closing.
</div>

{/* Raw token */}
<p className="text-xs font-medium text-gray-700 mb-1">Token</p>
<code className="block bg-gray-50 border rounded p-3 text-xs font-mono break-all mb-3">
  {newToken}
</code>
<button
  onClick={() => { navigator.clipboard.writeText(newToken); setCopied(true) }}
  className="text-xs bg-green-600 text-white rounded px-3 py-1.5 mb-4"
>
  {copied ? 'Copied!' : 'Copy token'}
</button>

{/* Scan command */}
<p className="text-xs font-medium text-gray-700 mb-1">Ready-to-run scan command</p>
<pre className="bg-gray-50 border rounded p-3 text-xs font-mono whitespace-pre-wrap break-all mb-4">
{`SCANNER_TOKEN=${newToken} SCANNER_API_URL=https://zorinrestore.vercel.app python -m scanner scan`}
</pre>
<button
  onClick={() => {
    navigator.clipboard.writeText(`SCANNER_TOKEN=${newToken} SCANNER_API_URL=https://zorinrestore.vercel.app python -m scanner scan`)
    setCopied(true)
  }}
  className="text-xs bg-green-600 text-white rounded px-3 py-1.5 mb-6"
>
  Copy command
</button>

{/* Confirmation checkbox + Done */}
<label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
  <input
    type="checkbox"
    checked={confirmed}
    onChange={e => setConfirmed(e.target.checked)}
    className="rounded"
  />
  I have copied this token
</label>
<button
  disabled={!confirmed}
  onClick={() => {
    setModalOpen(false)
    setNewToken(null)
    // Refresh token list from server
    router.refresh()
  }}
  className="w-full bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
>
  Done
</button>
```

`router.refresh()` on Done will re-run the Server Component and pull the new token row from the database.

---

## Section 3 — Machine Name (requirements SET-04, MACH-01)

**Component type:** `MachineSection` is a Client Component (`'use client'`).

**Data loading (Server Component):**

In `app/(dashboard)/settings/page.tsx`:
```typescript
const { data: machine } = await supabase
  .from('machines')
  .select('id, label, hostname, last_scan_at')
  .eq('user_id', user.id)
  .single()
```
Note: `.single()` returns `null` (not an error) when no row exists — this is the "no machine yet" case.

Pass as `<MachineSection machine={machine ?? null} />`.

**MachineSection component** (`app/(dashboard)/settings/MachineSection.tsx`):

```typescript
'use client'
interface Props { machine: Machine | null }
```

State to maintain:
- `editing`: `boolean` — whether inline edit mode is active
- `labelValue`: `string` — current label text in the input

Initialise `labelValue` from `machine?.label ?? ''`.

**"No machine yet" state** (when `machine === null`):

```tsx
<div className="space-y-3">
  <p className="text-sm text-gray-500">No machine registered yet.</p>
  <label className="block text-sm font-medium text-gray-700">Machine name</label>
  <input
    type="text"
    placeholder="e.g. zorin-laptop"
    value={labelValue}
    onChange={e => setLabelValue(e.target.value)}
    className="border rounded px-3 py-2 text-sm w-full max-w-sm"
  />
  <button
    onClick={async () => { await upsertMachine({ label: labelValue }); router.refresh() }}
    disabled={!labelValue.trim()}
    className="text-sm bg-black text-white rounded px-4 py-2 disabled:opacity-50"
  >
    Register machine
  </button>
</div>
```

**Machine exists, view mode** (when `machine !== null && !editing`):

```tsx
<div className="space-y-1">
  <div className="flex items-center gap-3">
    <span className="text-sm font-medium">{machine.label}</span>
    <button
      onClick={() => { setEditing(true); setLabelValue(machine.label) }}
      className="text-xs text-gray-500 hover:text-gray-700"
      aria-label="Edit machine name"
    >
      ✏ Edit
    </button>
  </div>
  {machine.hostname && (
    <p className="text-xs text-gray-400">Hostname: {machine.hostname}</p>
  )}
  {machine.last_scan_at && (
    <p className="text-xs text-gray-400">Last scan: {new Date(machine.last_scan_at).toLocaleString()}</p>
  )}
</div>
```

**Machine exists, edit mode** (when `machine !== null && editing`):

```tsx
<div className="flex items-center gap-2">
  <input
    type="text"
    value={labelValue}
    onChange={e => setLabelValue(e.target.value)}
    className="border rounded px-3 py-2 text-sm"
    autoFocus
  />
  <button
    onClick={async () => {
      await upsertMachine({ label: labelValue })
      setEditing(false)
      router.refresh()
    }}
    disabled={!labelValue.trim()}
    className="text-sm bg-black text-white rounded px-4 py-2 disabled:opacity-50"
  >
    Save
  </button>
  <button
    onClick={() => { setEditing(false); setLabelValue(machine.label) }}
    className="text-sm px-4 py-2 border rounded"
  >
    Cancel
  </button>
</div>
```

After a successful `upsertMachine` + `router.refresh()`, the Server Component re-runs and passes the updated `machine` prop down — the component will re-render with the new label in view mode.

---

## Page Layout (app/(dashboard)/settings/page.tsx)

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TokensSection } from './TokensSection'
import { MachineSection } from './MachineSection'
import { SignOutButton } from './SignOutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tokens } = await supabase
    .from('scanner_tokens')
    .select('id, label, created_at, last_used, revoked')
    .order('created_at', { ascending: false })

  const { data: machine } = await supabase
    .from('machines')
    .select('id, label, hostname, last_scan_at')
    .eq('user_id', user.id)
    .single()

  return (
    <main className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Section 1: Auth status */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Account</h2>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-900">{user.email}</p>
        </div>
        <SignOutButton />
      </section>

      {/* Section 2: Token management */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Scanner Tokens</h2>
        <p className="text-sm text-gray-500">
          Tokens authenticate the scanner CLI when uploading scan results.
        </p>
        <TokensSection initialTokens={tokens ?? []} />
      </section>

      {/* Section 3: Machine name */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Machine</h2>
        <p className="text-sm text-gray-500">
          Give your machine a recognisable name for the dashboard.
        </p>
        <MachineSection machine={machine ?? null} />
      </section>
    </main>
  )
}
```

Create `app/(dashboard)/settings/SignOutButton.tsx` as a separate file (see Section 1 above).

---

## Tailwind CSS Patterns

These patterns match the existing codebase:

| Element | Classes |
|---------|---------|
| Page container | `p-8 max-w-2xl space-y-8` |
| Card section | `rounded-lg border p-6 space-y-4` |
| Section heading | `text-base font-semibold` |
| Field label | `text-sm font-medium text-gray-700` |
| Body text / value | `text-sm text-gray-900` |
| Muted/secondary text | `text-sm text-gray-500` |
| Metadata / timestamps | `text-xs text-gray-400` |
| Primary button | `bg-black text-white rounded px-4 py-2 text-sm font-medium` |
| Danger text action | `text-sm text-red-600 hover:text-red-700` |
| Success/copy button | `bg-green-600 text-white rounded px-3 py-1.5 text-xs` |
| Disabled state | `disabled:opacity-50` |
| Text input | `border rounded px-3 py-2 text-sm` |
| Badge: active | `text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded` |
| Badge: revoked | `text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded` |
| Warning banner | `bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800` |
| Modal overlay | `fixed inset-0 bg-black/50 flex items-center justify-center z-50` |
| Modal content | `bg-white rounded-lg p-6 max-w-lg w-full mx-4` |
| Code block | `block bg-gray-50 border rounded p-3 text-xs font-mono break-all` |
| Pre/command block | `bg-gray-50 border rounded p-3 text-xs font-mono whitespace-pre-wrap break-all` |

---

## Critical UX Requirements

### One-time token display (TOKEN-03)

1. The raw token appears in a `<code>` block with monospace font
2. The scan command appears in a `<pre>` block
3. Copy buttons use `navigator.clipboard.writeText()`
4. The "I have copied this token" checkbox MUST be checked before the "Done" button is enabled
5. Clicking outside the modal or pressing Escape does NOT close the modal — only "Done" (when confirmed) or "Cancel" (on the label form step) close it
6. After Done, call `router.refresh()` so the new token row appears in the table (label and created_at visible; raw token is gone)

### Inline machine name edit (MACH-01)

1. Default state shows label as plain text with a pencil/Edit button
2. Clicking Edit switches to an `<input>` field pre-filled with the current label, with Save and Cancel buttons
3. Save calls `upsertMachine({ label })` then `router.refresh()`
4. Cancel restores the original label value and returns to view mode
5. If no machine record exists, show a "Register machine" form instead

---

## Acceptance Criteria Checklist

- [ ] Logged-in user's email is displayed in the Account section
- [ ] Sign out button calls `supabase.auth.signOut()` and redirects to `/login`
- [ ] Token table lists all tokens with label, created date, last-used date, and status badge
- [ ] "Generate new token" opens a modal with a label input field
- [ ] Token generation calls `generateScannerToken(label)` from `@/lib/actions/tokens`
- [ ] Raw token is displayed in a `<code>` block — exactly once
- [ ] Scan command is displayed in a `<pre>` block with the raw token interpolated
- [ ] Copy buttons for both token and command use `navigator.clipboard.writeText()`
- [ ] "Done" button is disabled until "I have copied this token" checkbox is checked
- [ ] Modal cannot be dismissed by clicking outside or pressing Escape
- [ ] After Done, `router.refresh()` reloads the token list
- [ ] Revoke button shows a confirm dialog before calling `revokeToken(tokenId)`
- [ ] Revoked tokens show a "Revoked" badge and the Revoke button disappears
- [ ] Machine label is shown in view mode with an Edit button
- [ ] Edit mode transforms to an inline input with Save and Cancel
- [ ] Save calls `upsertMachine({ label })` then `router.refresh()`
- [ ] If no machine exists, a "Register machine" form is shown instead
- [ ] All three sections are wrapped in `rounded-lg border p-6` cards
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
