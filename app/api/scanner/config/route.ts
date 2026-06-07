import { type NextRequest, NextResponse } from "next/server";
import { validateScannerToken } from "@/lib/tokens";
import { adminSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Step 1: Validate scanner token
  const { valid, userId } = await validateScannerToken(
    request.headers.get("authorization")
  );
  if (!valid || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Look up machine by userId
  const { data: machine } = await adminSupabase
    .from("machines")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!machine) {
    return NextResponse.json({ approved_folders: [], approved_commands: [] });
  }

  // Step 3: Look up scan_config for this machine
  const { data: cfg } = await adminSupabase
    .from("scan_config")
    .select("approved_folders, approved_commands")
    .eq("machine_id", machine.id)
    .single();

  return NextResponse.json(
    cfg ?? { approved_folders: [], approved_commands: [] }
  );
}
