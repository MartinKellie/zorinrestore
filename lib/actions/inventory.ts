"use server";

import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { z } from "zod";

const ImportanceSchema = z.enum(["Essential", "Useful", "Optional", "Ignore"]);

const NotesSchema = z.object({
  general_note: z.string().optional(),
  restore_note: z.string().optional(),
});

export async function updateItemImportance(
  itemId: string,
  importance: string
): Promise<{ error?: string }> {
  const parsed = ImportanceSchema.safeParse(importance);
  if (!parsed.success) return { error: "Invalid importance value" };

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
    .update({ importance: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  return error ? { error: error.message } : {};
}

export async function updateItemNotes(
  itemId: string,
  notes: { general_note?: string; restore_note?: string }
): Promise<{ error?: string }> {
  const parsed = NotesSchema.safeParse(notes);
  if (!parsed.success) return { error: "Invalid notes payload" };

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

  // Build update payload from only the provided fields
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.general_note !== undefined) {
    updatePayload.general_note = parsed.data.general_note;
  }
  if (parsed.data.restore_note !== undefined) {
    updatePayload.restore_note = parsed.data.restore_note;
  }

  const { error } = await adminSupabase
    .from("scan_items")
    .update(updatePayload)
    .eq("id", itemId);

  return error ? { error: error.message } : {};
}
