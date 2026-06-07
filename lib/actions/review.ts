"use server";

import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { z } from "zod";

const ClassificationSchema = z.enum([
  "Essential",
  "Useful",
  "Optional",
  "Ignore",
]);

export async function classifyReviewItem(
  itemId: string,
  classification: string
): Promise<{ error?: string }> {
  const parsed = ClassificationSchema.safeParse(classification);
  if (!parsed.success) return { error: "Invalid classification" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify ownership via RLS-respecting SELECT
  const { data: item } = await supabase
    .from("scan_items")
    .select("id")
    .eq("id", itemId)
    .single();
  if (!item) return { error: "Item not found" };

  const { error } = await adminSupabase
    .from("scan_items")
    .update({
      importance: parsed.data,
      needs_review: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  return error ? { error: error.message } : {};
}
