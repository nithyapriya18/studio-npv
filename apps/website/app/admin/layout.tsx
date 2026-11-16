import type { Metadata } from 'next'
import './admin.css'
import './design.css'

export const metadata: Metadata = {
  title: { default: 'Studio admin', template: '%s | Studio admin' },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  // .adm-root hides the public header and footer (see admin.css).
  return <div className="adm-root">{children}</div>
}
