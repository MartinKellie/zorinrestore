import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateScannerToken } from "@/lib/tokens";
import { adminSupabase } from "@/lib/supabase/admin";

const ScanItemSchema = z.object({
  category: z.string(),
  tool_name: z.string(),
  version: z.string().nullable().optional(),
  install_path: z.string().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  needs_review: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UploadPayloadSchema = z.object({
  machine_hostname: z.string(),
  machine_os: z.string(),
  machine_kernel: z.string().optional(),
  machine_arch: z.string().optional(),
  scanner_version: z.string(),
  python_version: z.string().optional(),
  scanned_at: z.string().datetime(),
  items: z.array(ScanItemSchema),
});

export async function POST(request: NextRequest) {
  // Step 1: Validate scanner token
  const { valid, userId } = await validateScannerToken(
    request.headers.get("authorization")
  );
  if (!valid || !userId) {
    return NextResponse.json(
      { error: "Invalid or revoked token" },
      { status: 401 }
    );
  }

  // Step 2: Validate payload shape
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UploadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // Step 3: Upsert machine row (conflict on user_id)
    const { data: machine, error: machineError } = await adminSupabase
      .from("machines")
      .upsert(
        {
          user_id: userId,
          label: data.machine_hostname,
          hostname: data.machine_hostname,
          os_name: data.machine_os,
          kernel_version: data.machine_kernel ?? null,
          architecture: data.machine_arch ?? null,
          scanner_version: data.scanner_version,
          python_version: data.python_version ?? null,
          last_scan_at: data.scanned_at,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (machineError || !machine) {
      console.error("Machine upsert error:", machineError);
      return NextResponse.json(
        { error: "Failed to upsert machine" },
        { status: 500 }
      );
    }

    // Step 4: Insert scan_run row
    const { data: run, error: runError } = await adminSupabase
      .from("scan_runs")
      .insert({
        machine_id: machine.id,
        scanned_at: data.scanned_at,
        scanner_version: data.scanner_version,
        item_count: data.items.length,
      })
      .select("id")
      .single();

    if (runError || !run) {
      console.error("Scan run insert error:", runError);
      return NextResponse.json(
        { error: "Failed to create scan run" },
        { status: 500 }
      );
    }

    // Step 5: Upsert scan_items (conflict on scan_run_id, category, tool_name)
    const { error: itemsError } = await adminSupabase
      .from("scan_items")
      .upsert(
        data.items.map((item) => ({
          ...item,
          scan_run_id: run.id,
          metadata: item.metadata ?? null,
        })),
        { onConflict: "scan_run_id,category,tool_name" }
      );

    if (itemsError) {
      console.error("Scan items upsert error:", itemsError);
      return NextResponse.json(
        { error: "Failed to upsert scan items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      scan_run_id: run.id,
      items: data.items.length,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
