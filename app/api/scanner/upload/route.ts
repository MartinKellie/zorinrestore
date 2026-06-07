import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateScannerToken } from "@/lib/tokens";

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
  const { valid } = await validateScannerToken(
    request.headers.get("authorization")
  );
  if (!valid) {
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

  // Phase 1 stub: acknowledge receipt without writing to DB
  // Phase 2 will add: machine upsert + scan_run creation + scan_items upsert
  return NextResponse.json({
    ok: true,
    received: parsed.data.items.length,
    message: "Phase 1 stub — data acknowledged but not persisted until Phase 2",
  });
}
