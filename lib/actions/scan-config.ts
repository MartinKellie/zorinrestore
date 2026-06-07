"use server";

import { adminSupabase } from "@/lib/supabase/admin";

export async function addApprovedFolder(
  machineId: string,
  folder: string
): Promise<{ error?: string }> {
  // Validate folder path — must start with / or ~/
  if (!folder || (!folder.startsWith("/") && !folder.startsWith("~/"))) {
    return { error: "Path must start with / or ~/" };
  }

  // Select existing scan_config row
  const { data: existing } = await adminSupabase
    .from("scan_config")
    .select("approved_folders")
    .eq("machine_id", machineId)
    .single();

  const currentFolders: string[] = existing?.approved_folders ?? [];

  // Deduplicate — don't add if already present
  if (currentFolders.includes(folder)) {
    return {};
  }

  const newFolders = [...currentFolders, folder];

  const { error } = await adminSupabase
    .from("scan_config")
    .upsert(
      { machine_id: machineId, approved_folders: newFolders },
      { onConflict: "machine_id" }
    );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function removeApprovedFolder(
  machineId: string,
  folder: string
): Promise<{ error?: string }> {
  // Select existing scan_config row
  const { data: existing } = await adminSupabase
    .from("scan_config")
    .select("approved_folders")
    .eq("machine_id", machineId)
    .single();

  const currentFolders: string[] = existing?.approved_folders ?? [];
  const newFolders = currentFolders.filter((f) => f !== folder);

  const { error } = await adminSupabase
    .from("scan_config")
    .upsert(
      { machine_id: machineId, approved_folders: newFolders },
      { onConflict: "machine_id" }
    );

  if (error) {
    return { error: error.message };
  }

  return {};
}
