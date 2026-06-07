import { createHash } from "crypto";
import { adminSupabase } from "@/lib/supabase/admin";

export async function validateScannerToken(
  authHeader: string | null
): Promise<{ valid: boolean; tokenId?: string }> {
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };
  const raw = authHeader.slice(7);
  const hash = createHash("sha256").update(raw).digest("hex");

  const { data } = await adminSupabase
    .from("scanner_tokens")
    .select("id, revoked")
    .eq("token_hash", hash)
    .single();

  if (!data || data.revoked) return { valid: false };

  // Update last_used timestamp
  await adminSupabase
    .from("scanner_tokens")
    .update({ last_used: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, tokenId: data.id };
}
