'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * The confirmation after a save ("Moved to Exploring", "Logged 1.5 h").
 * Actions redirect with ?flash=…; this shows it for a few seconds and
 * takes it out of the address, so a refresh doesn't show it again.
 */
export function AdminToast() {
  const params = useSearchParams()
  const pathname = usePathname()
  const flash = params.get('flash')
  const [shown, setShown] = useState<{ text: string; key: string } | null>(null)

  useEffect(() => {
    if (!flash) return
    const key = `${pathname}?${params.toString()}`
    const show = setTimeout(() => setShown({ text: flash, key }), 0)
    const url = new URL(window.location.href)
    url.searchParams.delete('flash')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    const hide = setTimeout(() => setShown(null), 3500)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [flash, pathname, params])

  return (
    <div className="a-toast-wrap" aria-live="polite" role="status">
      {shown ? (
        <div key={shown.key} className="a-toast">
          <svg className="a-ic a-ic-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          {shown.text}
          <button type="button" className="a-toast-x" aria-label="Dismiss" onClick={() => setShown(null)}>×</button>
        </div>
      ) : null}
    </div>
  )
}
