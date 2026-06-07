"use server";

import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function addSecretReminder(
  name: string,
  note?: string
): Promise<{ error?: string }> {
  if (!name || name.trim().length === 0) return { error: "Name is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await adminSupabase
    .from("secret_reminders")
    .insert({
      user_id: user.id,
      name: name.trim(),
      note: note ?? null,
    });

  return error ? { error: error.message } : {};
}

export async function deleteSecretReminder(
  reminderId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify ownership via RLS-respecting SELECT
  const { data: reminder } = await supabase
    .from("secret_reminders")
    .select("id")
    .eq("id", reminderId)
    .single();
  if (!reminder) return { error: "Not found" };

  const { error } = await adminSupabase
    .from("secret_reminders")
    .delete()
    .eq("id", reminderId);

  return error ? { error: error.message } : {};
}

export async function flagSecretDep(
  itemId: string,
  value: boolean
): Promise<{ error?: string }> {
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
      has_secret_dep: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  return error ? { error: error.message } : {};
}
