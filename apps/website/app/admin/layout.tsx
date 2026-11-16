import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = {
  title: { default: 'Studio admin', template: '%s | Studio admin' },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="py-6 sm:py-8">{children}</div>
}
