import { signInWithMagicLink } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check_email?: string }>;
}) {
  // Note: searchParams is a Promise in Next.js 16 — use with Suspense or async
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-semibold">Rebuild Ledger</h1>
        <form action={signInWithMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="martin.kellie@gmail.com"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white rounded px-4 py-2 text-sm font-medium"
          >
            Send magic link
          </button>
        </form>
      </div>
    </main>
  );
}
