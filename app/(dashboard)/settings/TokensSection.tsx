"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { generateScannerToken, revokeToken } from "@/lib/actions/tokens"

interface ScannerToken {
  id: string
  label: string | null
  created_at: string
  last_used: string | null
  revoked: boolean
}

interface TokensSectionProps {
  initialTokens: ScannerToken[]
}

const SCAN_COMMAND_API_URL = "https://zorinrestore.vercel.app"

export function TokensSection({ initialTokens }: TokensSectionProps) {
  const router = useRouter()
  const [tokens, setTokens] = useState(initialTokens)
  const [modalOpen, setModalOpen] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [labelInput, setLabelInput] = useState("")

  useEffect(() => {
    setTokens(initialTokens)
  }, [initialTokens])

  function openModal() {
    setModalOpen(true)
    setNewToken(null)
    setCopied(false)
    setConfirmed(false)
    setLabelInput("")
  }

  async function handleRevoke(tokenId: string) {
    const ok = confirm(
      "Revoke this token? The scanner will no longer be able to upload."
    )
    if (!ok) return

    await revokeToken(tokenId)
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, revoked: true } : t))
    )
  }

  async function handleGenerate() {
    const raw = await generateScannerToken(labelInput)
    setNewToken(raw)
  }

  function handleDone() {
    setModalOpen(false)
    setNewToken(null)
    router.refresh()
  }

  const scanCommand = newToken
    ? `SCANNER_TOKEN=${newToken} SCANNER_API_URL=${SCAN_COMMAND_API_URL} python -m scanner scan`
    : ""

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openModal}
        className="text-sm bg-black text-white rounded px-4 py-2"
      >
        Generate new token
      </button>

      {tokens.length === 0 ? (
        <p className="text-sm text-gray-500">No tokens yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">Label</th>
                <th className="pb-2 pr-4 font-medium">Created</th>
                <th className="pb-2 pr-4 font-medium">Last used</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">{token.label ?? "(no label)"}</td>
                  <td className="py-3 pr-4">
                    {new Date(token.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    {token.last_used
                      ? new Date(token.last_used).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="py-3 pr-4">
                    {token.revoked ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        Revoked
                      </span>
                    ) : (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    {!token.revoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(token.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            {newToken === null ? (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Generate scanner token
                </h2>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token label
                </label>
                <input
                  type="text"
                  placeholder="e.g. zorin-laptop-2026"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-sm px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!labelInput.trim()}
                    className="text-sm bg-black text-white rounded px-4 py-2 disabled:opacity-50"
                  >
                    Generate
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Your new scanner token
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-800">
                  This token will not be shown again. Copy it now before closing.
                </div>
                <p className="text-xs font-medium text-gray-700 mb-1">Token</p>
                <code className="block bg-gray-50 border rounded p-3 text-xs font-mono break-all mb-3">
                  {newToken}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newToken)
                    setCopied(true)
                  }}
                  className="text-xs bg-green-600 text-white rounded px-3 py-1.5 mb-4"
                >
                  {copied ? "Copied!" : "Copy token"}
                </button>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Ready-to-run scan command
                </p>
                <pre className="bg-gray-50 border rounded p-3 text-xs font-mono whitespace-pre-wrap break-all mb-4">
                  {scanCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(scanCommand)
                    setCopied(true)
                  }}
                  className="text-xs bg-green-600 text-white rounded px-3 py-1.5 mb-6"
                >
                  Copy command
                </button>
                <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="rounded"
                  />
                  I have copied this token
                </label>
                <button
                  type="button"
                  disabled={!confirmed}
                  onClick={handleDone}
                  className="w-full bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
