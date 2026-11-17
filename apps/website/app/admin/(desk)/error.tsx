'use client'

import { useAutoRetry } from '@/components/admin/use-auto-retry'

/** Shown inside the admin frame when a page fails to load or save. Retries once by itself first. */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const retrying = useAutoRetry(error, retry)
  if (retrying) {
    return (
      <section className="a-card">
        <h1 className="a-page-title">One moment</h1>
        <p className="a-muted">The database was slow to answer. Loading again…</p>
      </section>
    )
  }
  return (
    <section className="a-card">
      <h1 className="a-page-title">That didn&apos;t work</h1>
      <p className="a-muted">
        {process.env.NODE_ENV === 'production'
          ? 'Usually a passing hiccup with the database. Try again; if it keeps happening, tell Claude the reference below.'
          : error.message}
      </p>
      <div className="a-head-actions">
        <button type="button" className="a-btn a-btn-primary" onClick={() => retry()}>
          Try again
        </button>
      </div>
      {error.digest ? <p className="a-muted" style={{ fontSize: 12 }}>Reference: {error.digest}</p> : null}
    </section>
  )
}
