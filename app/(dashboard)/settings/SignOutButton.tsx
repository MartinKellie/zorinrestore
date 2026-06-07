"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-red-600 hover:text-red-700"
    >
      Sign out
    </button>
  )
}
