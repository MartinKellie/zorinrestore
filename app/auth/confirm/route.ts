import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/settings";

  console.log("[auth/confirm] params:", {
    code: code ? `${code.slice(0, 8)}…` : null,
    token_hash: token_hash ? `${token_hash.slice(0, 8)}…` : null,
    type,
    next,
  });

  const supabase = await createClient();

  // PKCE magic-link flow — @supabase/ssr sends ?code=xxx
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/confirm] exchangeCodeForSession error:", error.message);
    } else {
      redirect(next);
    }
  }

  // Email OTP flow — ?token_hash=xxx&type=email
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      console.error("[auth/confirm] verifyOtp error:", error.message);
    } else {
      redirect(next);
    }
  }

  redirect("/login?error=auth_failed");
}
