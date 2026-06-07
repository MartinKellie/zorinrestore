"use client"

import { useState } from "react"

export function ExportView() {
  const [includeIgnored, setIncludeIgnored] = useState(false)

  const mdHref = `/api/export/markdown${includeIgnored ? "?include_ignored=true" : ""}`
  const jsonHref = `/api/export/json${includeIgnored ? "?include_ignored=true" : ""}`

  return (
    <main className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Export Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download your machine inventory as a Markdown rebuild reference or
          JSON backup.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
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
              Human-readable rebuild reference with categories, notes, and
              restore instructions
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
    </main>
  )
}
