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

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

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
