import { headers } from "next/headers"

export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  const headersList = await headers()
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host")
  if (host) {
    const proto =
      headersList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https")
    return `${proto}://${host}`
  }

  return "http://localhost:3000"
}
