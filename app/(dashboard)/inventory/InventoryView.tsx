"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { updateItemImportance, updateItemNotes } from "@/lib/actions/inventory"
import { flagSecretDep } from "@/lib/actions/secrets"

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

interface InventoryViewProps {
  items: ScanItem[]
  machine: Machine | null
  latestRun: ScanRun | null
}

type SaveState = "idle" | "pending" | "saved" | "error"

const IMPORTANCE_OPTIONS = ["Essential", "Useful", "Optional", "Ignore"] as const

export function InventoryView({ items: initialItems, machine, latestRun }: InventoryViewProps) {
  const [items, setItems] = useState<ScanItem[]>(initialItems)
  const [filters, setFilters] = useState<{
    category: string | null
    importance: string | null
    showIgnored: boolean
  }>({ category: null, importance: null, showIgnored: false })
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const categories = useMemo(
    () => [...new Set(initialItems.map((item) => item.category))].sort(),
    [initialItems]
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.category && item.category !== filters.category) return false
      if (filters.importance && item.importance !== filters.importance) return false
      if (!filters.importance && !filters.showIgnored && item.importance === "Ignore") return false
      return true
    })
  }, [items, filters])

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, ScanItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [filteredItems])

  const sortedCategories = useMemo(
    () => Object.keys(groupedItems).sort(),
    [groupedItems]
  )

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null

  const machineLabel = machine
    ? (machine.label ?? machine.hostname)
    : null

  const lastScanDate = latestRun
    ? new Date(latestRun.scanned_at).toLocaleString()
    : null

  if (initialItems.length === 0 && !latestRun) {
    return (
      <main className="p-8 max-w-4xl">
        <div className="rounded-lg border p-12 text-center">
          <p className="text-sm text-gray-500">
            No scan data yet. Run the scanner to populate your inventory.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {machineLabel ?? "No machine registered yet."}
        </h1>
        {lastScanDate && (
          <p className="text-sm text-gray-500">Last scan: {lastScanDate}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filters.category ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              category: e.target.value || null,
            }))
          }
          className="rounded border px-3 py-2 text-sm text-gray-900"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {prettyCategory(category)}
            </option>
          ))}
        </select>

        <select
          value={filters.importance ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              importance: e.target.value || null,
            }))
          }
          className="rounded border px-3 py-2 text-sm text-gray-900"
        >
          <option value="">All importance</option>
          {IMPORTANCE_OPTIONS.map((importance) => (
            <option key={importance} value={importance}>
              {importance}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filters.showIgnored}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                showIgnored: e.target.checked,
              }))
            }
          />
          Show ignored items
        </label>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-gray-500">No items match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const categoryItems = [...groupedItems[category]].sort((a, b) =>
              a.tool_name.localeCompare(b.tool_name)
            )
            const isOpen = !collapsedCategories.has(category)

            return (
              <section key={category} className="rounded-lg border p-4 space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedCategories((prev) => {
                      const next = new Set(prev)
                      if (next.has(category)) next.delete(category)
                      else next.add(category)
                      return next
                    })
                  }
                  className="w-full flex justify-between items-center py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                >
                  <span>{prettyCategory(category)}</span>
                  <span>
                    {isOpen ? "▲" : "▼"} {categoryItems.length} items
                  </span>
                </button>

                {isOpen && (
                  <div className="space-y-1">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedItemId(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSelectedItemId(item.id)
                          }
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="flex-1 text-sm font-medium text-gray-900">
                          {item.tool_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.version ?? "—"}
                        </span>
                        <ImportanceBadge importance={item.importance} />
                        <ConfidenceDot confidence={item.confidence} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {selectedItem && (
        <ItemDrawer
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onItemUpdate={(updated) => {
            setItems((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i))
            )
          }}
        />
      )}
    </main>
  )
}

function ItemDrawer({
  item,
  onClose,
  onItemUpdate,
}: {
  item: ScanItem
  onClose: () => void
  onItemUpdate: (item: ScanItem) => void
}) {
  const [importance, setImportance] = useState(item.importance)
  const [generalNote, setGeneralNote] = useState(item.general_note ?? "")
  const [restoreNote, setRestoreNote] = useState(item.restore_note ?? "")
  const [hasSecretDep, setHasSecretDep] = useState(item.has_secret_dep)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [secretDepError, setSecretDepError] = useState<string | null>(null)

  const isDirty =
    importance !== item.importance ||
    generalNote !== (item.general_note ?? "") ||
    restoreNote !== (item.restore_note ?? "")

  function handleClose() {
    if (isDirty) {
      const discard = window.confirm(
        "You have unsaved changes. Discard them?"
      )
      if (!discard) return
    }
    onClose()
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (isDirty) {
        const discard = window.confirm(
          "You have unsaved changes. Discard them?"
        )
        if (!discard) return
      }
      onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isDirty, onClose])

  async function handleSave() {
    setSaveError(null)
    setSaveState("pending")

    const importanceChanged = importance !== item.importance
    const generalChanged = generalNote !== (item.general_note ?? "")
    const restoreChanged = restoreNote !== (item.restore_note ?? "")

    if (!importanceChanged && !generalChanged && !restoreChanged) {
      setSaveState("idle")
      return
    }

    if (importanceChanged) {
      const result = await updateItemImportance(item.id, importance)
      if (result.error) {
        setSaveError(result.error)
        setSaveState("error")
        return
      }
    }

    if (generalChanged || restoreChanged) {
      const notes: { general_note?: string; restore_note?: string } = {}
      if (generalChanged) notes.general_note = generalNote
      if (restoreChanged) notes.restore_note = restoreNote

      const result = await updateItemNotes(item.id, notes)
      if (result.error) {
        setSaveError(result.error)
        setSaveState("error")
        return
      }
    }

    const updated: ScanItem = {
      ...item,
      importance,
      general_note: generalNote || null,
      restore_note: restoreNote || null,
      has_secret_dep: hasSecretDep,
      updated_at: new Date().toISOString(),
    }
    onItemUpdate(updated)
    setSaveState("saved")
    setTimeout(() => setSaveState("idle"), 2000)
  }

  async function handleSecretDepChange(checked: boolean) {
    setSecretDepError(null)
    setHasSecretDep(checked)

    const result = await flagSecretDep(item.id, checked)
    if (result.error) {
      setSecretDepError(result.error)
      setHasSecretDep(!checked)
      return
    }

    onItemUpdate({ ...item, has_secret_dep: checked })
  }

  const saveLabel =
    saveState === "pending"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : "Save changes"

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto p-6">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close drawer"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        <h2 className="text-lg font-semibold pr-8">{item.tool_name}</h2>

        <dl className="mt-6 space-y-3">
          <DrawerField label="Category" value={prettyCategory(item.category)} />
          <DrawerField label="Version" value={item.version ?? "—"} />
          <DrawerField
            label="Install path"
            value={item.install_path ?? "—"}
            mono
          />
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-sm font-medium text-gray-700">
              Confidence
            </dt>
            <dd>
              <ConfidenceBadge confidence={item.confidence} />
            </dd>
          </div>
          <DrawerField
            label="Last seen"
            value={new Date(item.updated_at).toLocaleString()}
          />
        </dl>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="importance"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Importance
            </label>
            <select
              id="importance"
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm text-gray-900"
            >
              {IMPORTANCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="general-note"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              General note
            </label>
            <textarea
              id="general-note"
              rows={3}
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Add a general note about this item…"
              className="w-full rounded border px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="restore-note"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Restore note
            </label>
            <textarea
              id="restore-note"
              rows={3}
              value={restoreNote}
              onChange={(e) => setRestoreNote(e.target.value)}
              placeholder="Describe restore steps for this item…"
              className="w-full rounded border px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={hasSecretDep}
                onChange={(e) => handleSecretDepChange(e.target.checked)}
              />
              Has secret dependency
            </label>
            {secretDepError && (
              <p className="mt-1 text-sm text-red-600">{secretDepError}</p>
            )}
            {hasSecretDep && (
              <Link
                href="/secrets"
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                Manage secrets
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "pending"}
          className="w-full mt-4 px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {saveLabel}
        </button>

        {saveError && (
          <p className="mt-2 text-sm text-red-600">{saveError}</p>
        )}

        <details className="mt-6">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer">
            Advanced / Debug Evidence
          </summary>
          <div className="mt-3 space-y-3">
            {item.ai_notes && (
              <div>
                <p className="text-sm text-gray-500">AI notes</p>
                <p className="text-sm text-gray-900 mt-1">{item.ai_notes}</p>
              </div>
            )}
            {item.metadata ? (
              <pre className="text-xs font-mono bg-gray-50 rounded p-3 overflow-auto max-h-48">
                {JSON.stringify(item.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500">No metadata available.</p>
            )}
          </div>
        </details>
      </aside>
    </>
  )
}

function DrawerField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-sm font-medium text-gray-700">
        {label}
      </dt>
      <dd className={`text-sm text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  )
}

function ImportanceBadge({ importance }: { importance: string }) {
  const colours = IMPORTANCE_COLOURS[importance] ?? "bg-gray-100 text-gray-600"
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours}`}
    >
      {importance}
    </span>
  )
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const colour = CONFIDENCE_DOT_COLOURS[confidence] ?? "bg-gray-400"
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colour}`}
      title={confidence}
    />
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colour = CONFIDENCE_DOT_COLOURS[confidence] ?? "bg-gray-400"
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-900">
      <span className={`inline-block w-2 h-2 rounded-full ${colour}`} />
      {confidence}
    </span>
  )
}

function prettyCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const IMPORTANCE_COLOURS: Record<string, string> = {
  Essential: "bg-green-100 text-green-800",
  Useful: "bg-blue-100 text-blue-800",
  Optional: "bg-gray-100 text-gray-600",
  Ignore: "bg-red-50 text-red-400",
}

const CONFIDENCE_DOT_COLOURS: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-400",
  low: "bg-red-400",
}
