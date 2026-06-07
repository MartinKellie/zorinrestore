import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SecretsView } from "./SecretsView"

export default async function SecretsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch secret reminders for this user
  const { data: reminders } = await supabase
    .from("secret_reminders")
    .select("id, user_id, name, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  // Get latest run for machine
  let envItems: Parameters<typeof SecretsView>[0]["envItems"] = []
  let flaggedItems: Parameters<typeof SecretsView>[0]["flaggedItems"] = []

  const { data: machine } = await supabase
    .from("machines")
    .select("id, label, hostname")
    .eq("user_id", user.id)
    .single()

  if (machine) {
    const { data: run } = await supabase
      .from("scan_runs")
      .select("id, scanned_at, machine_id")
      .eq("machine_id", machine.id)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .single()

    if (run) {
      const { data: envFiles } = await supabase
        .from("scan_items")
        .select(
          "id, scan_run_id, category, tool_name, version, install_path, importance, confidence, needs_review, metadata, ai_notes, general_note, restore_note, updated_at, has_secret_dep"
        )
        .eq("scan_run_id", run.id)
        .eq("category", "env_files")
        .order("tool_name", { ascending: true })

      envItems = envFiles ?? []

      const { data: secretDeps } = await supabase
        .from("scan_items")
        .select(
          "id, scan_run_id, category, tool_name, version, install_path, importance, confidence, needs_review, metadata, ai_notes, general_note, restore_note, updated_at, has_secret_dep"
        )
        .eq("scan_run_id", run.id)
        .eq("has_secret_dep", true)
        .order("category", { ascending: true })

      flaggedItems = secretDeps ?? []
    }
  }

  return (
    <SecretsView
      reminders={reminders ?? []}
      envItems={envItems}
      flaggedItems={flaggedItems}
    />
  )
}
