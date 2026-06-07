"use client"

import Link from "next/link"
import { useState } from "react"
import { addSecretReminder, deleteSecretReminder } from "@/lib/actions/secrets"

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

interface SecretsViewProps {
  reminders: SecretReminder[]
  envItems: ScanItem[]
  flaggedItems: ScanItem[]
}

export function SecretsView({
  reminders: initialReminders,
  envItems,
  flaggedItems,
}: SecretsViewProps) {
  const [reminders, setReminders] = useState<SecretReminder[]>(initialReminders)
  const [form, setForm] = useState({ name: "", note: "" })
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAddReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    setAddError(null)

    const result = await addSecretReminder(
      form.name.trim(),
      form.note.trim() || undefined
    )

    if (result.error) {
      setAddError(result.error)
      setSubmitting(false)
    } else {
      const tempReminder: SecretReminder = {
        id: crypto.randomUUID(),
        user_id: "",
        name: form.name.trim(),
        note: form.note.trim() || null,
        created_at: new Date().toISOString(),
      }
      setReminders((prev) => [...prev, tempReminder])
      setForm({ name: "", note: "" })
      setSubmitting(false)
    }
  }

  async function handleDelete(reminderId: string) {
    setDeletingId(reminderId)

    const result = await deleteSecretReminder(reminderId)

    if (result.error) {
      console.error("Delete failed:", result.error)
      setDeletingId(null)
    } else {
      setReminders((prev) => prev.filter((r) => r.id !== reminderId))
      setDeletingId(null)
    }
  }

  return (
    <main className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Secrets Checklist</h1>
        <p className="mt-2 text-sm text-gray-500">
          Track which secrets need to be recreated during a machine rebuild.
          Values are never stored.
        </p>
      </div>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Detected .env Variables</h2>

        {envItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            No .env files detected. Run the scanner to populate.
          </p>
        ) : (
          <div className="space-y-4">
            {envItems.map((item) => {
              const varNames =
                (item.metadata?.variable_names as string[] | undefined) ?? []
              return (
                <div key={item.id} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {item.tool_name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {varNames.map((name) => (
                      <span
                        key={name}
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-mono"
                      >
                        {name}
                      </span>
                    ))}
                    {varNames.length === 0 && (
                      <span className="text-xs text-gray-400">
                        No variable names detected
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Manual Reminders</h2>
        <p className="text-sm text-gray-500">
          Add the name of the secret, not its value
        </p>

        {reminders.length === 0 ? (
          <p className="text-sm text-gray-500">No reminders yet.</p>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-700">
                    {reminder.name}
                  </p>
                  {reminder.note && (
                    <p className="text-sm text-gray-500">{reminder.note}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Added {new Date(reminder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(reminder.id)}
                  disabled={deletingId === reminder.id}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50 shrink-0"
                >
                  {deletingId === reminder.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddReminder}
          className="space-y-3 border-t pt-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="reminder-name"
              className="text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="reminder-name"
              type="text"
              required
              placeholder="e.g. GitHub personal access token"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="reminder-note"
              className="text-sm font-medium text-gray-700"
            >
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="reminder-note"
              type="text"
              placeholder="e.g. Used for CI/CD pipeline"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
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
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">
          Inventory Items with Secret Dependencies
        </h2>
        <p className="text-sm text-gray-500">
          Flag items as having secret dependencies from the inventory view.
        </p>

        {flaggedItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            No inventory items are flagged as having secret dependencies yet.{" "}
            <Link href="/inventory" className="text-blue-600 hover:underline">
              Flag items from the inventory view.
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {flaggedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-700">
                    {item.tool_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <Link
                  href={`/inventory#item-${item.id}`}
                  className="text-sm text-blue-600 hover:underline shrink-0"
                >
                  View in inventory
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
