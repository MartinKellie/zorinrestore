"use client"

import Link from "next/link"
import { useState } from "react"
import { classifyReviewItem } from "@/lib/actions/review"

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

interface ReviewViewProps {
  items: ScanItem[]
}

const CLASSIFICATIONS = [
  { value: "Essential", className: "rounded border border-green-500 text-green-700 px-3 py-1 text-sm hover:bg-green-50 disabled:opacity-50" },
  { value: "Useful", className: "rounded border border-blue-500 text-blue-700 px-3 py-1 text-sm hover:bg-blue-50 disabled:opacity-50" },
  { value: "Optional", className: "rounded border border-gray-400 text-gray-600 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" },
  { value: "Ignore", className: "rounded border border-red-400 text-red-600 px-3 py-1 text-sm hover:bg-red-50 disabled:opacity-50" },
] as const

export function ReviewView({ items: initialItems }: ReviewViewProps) {
  const [items, setItems] = useState<ScanItem[]>(initialItems)
  const [classifying, setClassifying] = useState<Record<string, boolean>>({})
  const [activeButton, setActiveButton] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleClassify(itemId: string, classification: string) {
    setClassifying((prev) => ({ ...prev, [itemId]: true }))
    setActiveButton((prev) => ({ ...prev, [itemId]: classification }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })

    const result = await classifyReviewItem(itemId, classification)

    if (result.error) {
      setErrors((prev) => ({ ...prev, [itemId]: result.error! }))
      setClassifying((prev) => ({ ...prev, [itemId]: false }))
      setActiveButton((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      setClassifying((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      setActiveButton((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    }
  }

  return (
    <main className="p-8 max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Review Queue</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">
            {items.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          These items were detected with low confidence or are unknown tools.
          Classify each to add it to your inventory.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border p-12 text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">
            All items have been classified.
          </p>
          <p className="text-sm text-gray-500">Your inventory is up to date.</p>
          <Link href="/inventory" className="text-sm text-blue-600 hover:underline">
            View inventory
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ReviewItemCard
              key={item.id}
              item={item}
              isClassifying={!!classifying[item.id]}
              activeClassification={activeButton[item.id]}
              error={errors[item.id]}
              onClassify={handleClassify}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function ReviewItemCard({
  item,
  isClassifying,
  activeClassification,
  error,
  onClassify,
}: {
  item: ScanItem
  isClassifying: boolean
  activeClassification?: string
  error?: string
  onClassify: (itemId: string, classification: string) => void
}) {
  const metadataEntry = getFirstMetadataEntry(item.metadata)

  return (
    <section className="rounded-lg border p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-gray-700">
            {item.tool_name}
          </span>
          <p className="text-sm text-gray-500">
            {item.category}
            {item.version && <> · {item.version}</>}
          </p>
        </div>
        <ConfidenceBadge confidence={item.confidence} />
      </div>

      {metadataEntry && (
        <p className="text-xs text-gray-400">
          {metadataEntry.key}: {metadataEntry.value}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {CLASSIFICATIONS.map(({ value, className }) => (
          <button
            key={value}
            type="button"
            disabled={isClassifying}
            onClick={() => onClassify(item.id, value)}
            className={className}
          >
            {isClassifying && activeClassification === value ? "..." : value}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    low: "rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5",
    medium: "rounded-full bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5",
    high: "rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5",
  }
  return (
    <span className={styles[confidence] ?? styles.low}>
      {confidence} confidence
    </span>
  )
}

function getFirstMetadataEntry(
  metadata: Record<string, unknown> | null
): { key: string; value: string } | null {
  if (!metadata) return null
  const keys = Object.keys(metadata)
  if (keys.length === 0) return null
  const key = keys[0]
  return { key, value: String(metadata[key]) }
}
