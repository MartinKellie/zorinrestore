import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TokensSection } from "./TokensSection"
import { MachineSection } from "./MachineSection"
import { MachineDetails } from "./MachineDetails"
import { ScanFolders } from "./ScanFolders"
import { SignOutButton } from "./SignOutButton"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tokens } = await supabase
    .from("scanner_tokens")
    .select("id, label, created_at, last_used, revoked")
    .order("created_at", { ascending: false })

  const { data: machine } = await supabase
    .from("machines")
    .select("id, label, hostname, os_name, kernel_version, architecture, scanner_version, python_version, last_scan_at")
    .eq("user_id", user.id)
    .single()

  const { data: scanConfig } = await supabase
    .from("scan_config")
    .select("approved_folders")
    .eq("machine_id", machine?.id ?? "")
    .single()

  return (
    <main className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Account</h2>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-900">{user.email}</p>
        </div>
        <SignOutButton />
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Scanner Tokens</h2>
        <p className="text-sm text-gray-500">
          Tokens authenticate the scanner CLI when uploading scan results.
        </p>
        <TokensSection initialTokens={tokens ?? []} />
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Machine</h2>
        <p className="text-sm text-gray-500">
          Give your machine a recognisable name for the dashboard.
        </p>
        <MachineSection machine={machine ?? null} />
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Machine Details</h2>
        <p className="text-sm text-gray-500">
          Hardware and software details collected during the last scan.
        </p>
        <MachineDetails machine={machine ?? null} />
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Scan Folders</h2>
        <p className="text-sm text-gray-500">
          Approved project root folders the scanner is allowed to index.
        </p>
        <ScanFolders
          machineId={machine?.id ?? null}
          initialFolders={scanConfig?.approved_folders ?? []}
        />
      </section>
    </main>
  )
}
