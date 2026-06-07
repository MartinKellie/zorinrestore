import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReviewView } from "./ReviewView"

export default async function ReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: machine } = await supabase
    .from("machines")
    .select("id, label, hostname, last_scan_at")
    .eq("user_id", user.id)
    .single()

  let items: Parameters<typeof ReviewView>[0]["items"] = []

  if (machine) {
    const { data: run } = await supabase
      .from("scan_runs")
      .select("id, scanned_at, machine_id")
      .eq("machine_id", machine.id)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .single()

    if (run) {
      const { data: reviewItems } = await supabase
        .from("scan_items")
        .select(
          "id, scan_run_id, category, tool_name, version, install_path, importance, confidence, needs_review, metadata, ai_notes, general_note, restore_note, updated_at, has_secret_dep"
        )
        .eq("scan_run_id", run.id)
        .eq("needs_review", true)
        .order("category", { ascending: true })

      items = reviewItems ?? []
    }
  }

  return <ReviewView items={items} />
}
