"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { upsertMachine } from "@/lib/actions/machines"

interface Machine {
  id: string
  label: string
  hostname: string | null
  last_scan_at: string | null
}

interface MachineSectionProps {
  machine: Machine | null
}

export function MachineSection({ machine }: MachineSectionProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(machine?.label ?? "")

  useEffect(() => {
    setLabelValue(machine?.label ?? "")
    setEditing(false)
  }, [machine])

  if (machine === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">No machine registered yet.</p>
        <label className="block text-sm font-medium text-gray-700">
          Machine name
        </label>
        <input
          type="text"
          placeholder="e.g. zorin-laptop"
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full max-w-sm"
        />
        <button
          type="button"
          onClick={async () => {
            await upsertMachine({ label: labelValue })
            router.refresh()
          }}
          disabled={!labelValue.trim()}
          className="text-sm bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          Register machine
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          autoFocus
        />
        <button
          type="button"
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
          type="button"
          onClick={() => {
            setEditing(false)
            setLabelValue(machine.label)
          }}
          className="text-sm px-4 py-2 border rounded"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{machine.label}</span>
        <button
          type="button"
          onClick={() => {
            setEditing(true)
            setLabelValue(machine.label)
          }}
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
        <p className="text-xs text-gray-400">
          Last scan: {new Date(machine.last_scan_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
