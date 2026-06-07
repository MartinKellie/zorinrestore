"use server";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function upsertMachine(data: {
  label: string;
  hostname?: string;
  os_name?: string;
  os_version?: string;
  kernel_version?: string;
  architecture?: string;
  scanner_version?: string;
  python_version?: string;
}): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await adminSupabase
    .from("machines")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await adminSupabase
      .from("machines")
      .update(data)
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted } = await adminSupabase
    .from("machines")
    .insert({ ...data, user_id: user.id })
    .select("id")
    .single();
  return inserted!.id;
}
