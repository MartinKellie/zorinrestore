// lib/supabase/admin.ts — service-role Supabase client
// IMPORT RESTRICTION: Only import adminSupabase in app/api/ route handlers
// and lib/actions/ Server Actions. Never in client components or lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // no NEXT_PUBLIC_ prefix — server only
);
