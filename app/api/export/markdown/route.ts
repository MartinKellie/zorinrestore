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
    // No machine registered yet — return empty inventory
    const markdown = `# Machine Inventory: (no machine registered)\nGenerated: ${new Date().toISOString()}\n\n*No scan data found.*\n`
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="machine-inventory.md"',
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
    const markdown = `# Machine Inventory: ${machine.label}\nGenerated: ${new Date().toISOString()}\n\n*No scan runs found.*\n`
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="machine-inventory.md"',
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

  // When include_ignored=true, split into active and ignored
  const activeItems = includeIgnored
    ? items.filter((i) => i.importance !== "Ignore")
    : items
  const ignoredItems = includeIgnored
    ? items.filter((i) => i.importance === "Ignore")
    : []

  // Group active items by category using reduce (Object.groupBy not safe for all Node versions)
  const byCategory = activeItems.reduce<Record<string, typeof items>>(
    (acc, item) => {
      const cat = item.category ?? "Uncategorised"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    },
    {}
  )

  // Build markdown
  const lines: string[] = []
  lines.push(`# Machine Inventory: ${machine.label}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Last scan: ${latestRun.scanned_at}`)
  lines.push("")

  const sortedCategories = Object.keys(byCategory).sort()
  for (const category of sortedCategories) {
    lines.push(`## ${category}`)
    for (const item of byCategory[category]) {
      const version = item.version ? ` (v${item.version})` : ""
      lines.push(`- **${item.tool_name}**${version} — Importance: ${item.importance}`)
      if (item.install_path) lines.push(`  Path: ${item.install_path}`)
      if (item.general_note) lines.push(`  Notes: ${item.general_note}`)
      if (item.restore_note) lines.push(`  Restore: ${item.restore_note}`)
    }
    lines.push("")
  }

  // Ignored section (only when include_ignored=true)
  if (includeIgnored && ignoredItems.length > 0) {
    lines.push("## Ignored Items")
    for (const item of ignoredItems) {
      const version = item.version ? ` (v${item.version})` : ""
      lines.push(`- **${item.tool_name}**${version} — Importance: ${item.importance}`)
      if (item.install_path) lines.push(`  Path: ${item.install_path}`)
      if (item.general_note) lines.push(`  Notes: ${item.general_note}`)
      if (item.restore_note) lines.push(`  Restore: ${item.restore_note}`)
    }
    lines.push("")
  }

  const markdown = lines.join("\n")

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="machine-inventory.md"',
    },
  })
}
