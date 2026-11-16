'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

/**
 * Catches errors in the admin frame itself (the sidebar's data load), which
 * the page-level error screen can't. One click retries the whole page.
 */
export default function AdminFrameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  return (
    <div className="a-app a-login">
      <div className="a-login-box">
        <section className="a-card">
          <h1 className="a-page-title">That didn&apos;t load</h1>
          <p className="a-muted">
            The database didn&apos;t answer in time. It is usually a passing hiccup: try again.
            {process.env.NODE_ENV !== 'production' ? ` (${error.message})` : ''}
          </p>
          <button
            type="button"
            className="a-btn a-btn-primary"
            onClick={() => startTransition(() => { router.refresh(); reset() })}
          >
            Try again
          </button>
          {error.digest ? <p className="a-muted" style={{ fontSize: 12 }}>Reference: {error.digest}</p> : null}
        </section>
      </div>
    </div>
  )
}
