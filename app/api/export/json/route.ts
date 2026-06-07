import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Use URL fallback for compatibility with both NextRequest and plain Request (test env)
  const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams
  const includeIgnored = searchParams.get("include_ignored") === "true"

  // Resolve machine for this user
  const { data: machine } = await supabase
    .from("machines")
    .select("id, label, last_scan_at")
    .eq("user_id", user.id)
    .single()

  if (!machine) {
    const data = {
      machine: null,
      generated_at: new Date().toISOString(),
      items: [],
    }
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="machine-inventory.json"',
      },
    })
  }

  // Resolve latest scan run
  const { data: latestRun } = await supabase
    .from("scan_runs")
    .select("id, scanned_at, item_count")
    .eq("machine_id", machine.id)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .single()

  if (!latestRun) {
    const data = {
      machine: { label: machine.label, last_scan_at: machine.last_scan_at },
      generated_at: new Date().toISOString(),
      items: [],
    }
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="machine-inventory.json"',
      },
    })
  }

  // Fetch items — when not including ignored, filter them out at DB level
  const itemsQuery = supabase
    .from("scan_items")
    .select("*")
    .eq("scan_run_id", latestRun.id)

  const finalQuery = includeIgnored
    ? itemsQuery.order("category")
    : itemsQuery.neq("importance", "Ignore").order("category")

  const { data: allItems } = await finalQuery
  const items = allItems ?? []

  // Build JSON response
  const machineInfo = { label: machine.label, last_scan_at: machine.last_scan_at }

  if (includeIgnored) {
    // Split into active and ignored arrays
    const activeItems = items.filter((i) => i.importance !== "Ignore")
    const ignoredItems = items.filter((i) => i.importance === "Ignore")
    const data = {
      machine: machineInfo,
      generated_at: new Date().toISOString(),
      items: activeItems,
      ignored: ignoredItems,
    }
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="machine-inventory.json"',
      },
    })
  }

  // Default: no ignored key in output
  const data = {
    machine: machineInfo,
    generated_at: new Date().toISOString(),
    items,
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="machine-inventory.json"',
    },
  })
}
