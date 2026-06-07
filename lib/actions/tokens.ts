"use server";
import { randomBytes, createHash } from "crypto";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateScannerToken(label: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const rawToken = randomBytes(32).toString("hex"); // 64-char hex, cryptographically random
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await adminSupabase.from("scanner_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    label,
  });

  return rawToken; // returned to caller once — NEVER stored in DB
}

export async function revokeToken(tokenId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership before revoking
  const { data: token } = await adminSupabase
    .from("scanner_tokens")
    .select("id, user_id")
    .eq("id", tokenId)
    .single();

  if (!token || token.user_id !== user.id) throw new Error("Token not found");

  await adminSupabase
    .from("scanner_tokens")
    .update({ revoked: true })
    .eq("id", tokenId);
}
