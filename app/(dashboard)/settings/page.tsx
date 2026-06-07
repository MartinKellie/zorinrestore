// This page is a placeholder. Full implementation is delivered via FRONTEND_UI_SPEC.md.
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <p className="text-sm text-gray-500">
        Logged in as: {user.email}
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Full settings UI coming via FRONTEND_UI_SPEC.md (Cursor implementation)
      </p>
    </main>
  );
}
