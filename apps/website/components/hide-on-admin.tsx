'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** Hides the public site's nav and footer on the private /admin pages. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return pathname?.startsWith('/admin') ? null : <>{children}</>
}
