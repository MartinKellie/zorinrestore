import "@testing-library/jest-dom";
import { vi } from "vitest";

// Stub Supabase env vars so module-level adminSupabase instantiation doesn't throw.
// These values are not valid — DB calls will return errors, which is expected in unit tests.
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-service-role-key";

// Mock adminSupabase so unit tests don't make real HTTP calls to Supabase.
// Returns { data: null } from .select().eq().single() by default,
// simulating a miss (no matching token/machine row).
vi.mock("@/lib/supabase/admin", () => {
  const makeChain = (): any => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => chain,
    };
    return chain;
  };
  return {
    adminSupabase: {
      from: () => makeChain(),
    },
  };
});

// Mock next/headers so Server Actions can be imported without Next.js runtime.
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: () => [],
      set: () => {},
    }),
}));

// Mock @/lib/supabase/server so Server Actions don't fail on createClient().
// Uses vi.fn() so per-test overrides via mockResolvedValueOnce() work correctly.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
    })
  ),
}));
