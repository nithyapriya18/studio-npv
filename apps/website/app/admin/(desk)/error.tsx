'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

/** Shown inside the admin frame when a page fails to load or save. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  return (
    <section className="a-card">
      <h1 className="a-page-title">That didn&apos;t work</h1>
      <p className="a-muted">
        {process.env.NODE_ENV === 'production'
          ? 'Usually a passing hiccup with the database. Try again; if it keeps happening, tell Claude the reference below.'
          : error.message}
      </p>
      <div className="a-head-actions">
        <button type="button" className="a-btn a-btn-primary" onClick={() => startTransition(() => { router.refresh(); reset() })}>
          Try again
        </button>
      </div>
      {error.digest ? <p className="a-muted" style={{ fontSize: 12 }}>Reference: {error.digest}</p> : null}
    </section>
  )
}
