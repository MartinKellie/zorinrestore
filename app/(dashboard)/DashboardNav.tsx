"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/inventory", label: "Inventory" },
  { href: "/review", label: "Review Queue" },
  { href: "/secrets", label: "Secrets" },
  { href: "/export", label: "Export" },
  { href: "/settings", label: "Settings" },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 bg-white border-b px-8 py-3 flex gap-6 text-sm font-medium">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={
              isActive
                ? "text-gray-900 underline underline-offset-4"
                : "text-gray-500 hover:text-gray-900"
            }
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
