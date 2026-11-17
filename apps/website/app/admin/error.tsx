'use client'

import { useAutoRetry } from '@/components/admin/use-auto-retry'

/**
 * Catches errors in the admin frame itself (the sidebar's data load), which
 * the page-level error screen can't. It retries once by itself first; one
 * click retries again.
 */
export default function AdminFrameError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const retrying = useAutoRetry(error, retry)
  return (
    <div className="a-app a-login">
      <div className="a-login-box">
        <section className="a-card">
          {retrying ? (
            <>
              <h1 className="a-page-title">One moment</h1>
              <p className="a-muted">The database was slow to answer. Loading again…</p>
            </>
          ) : (
            <>
              <h1 className="a-page-title">That didn&apos;t load</h1>
              <p className="a-muted">
                The database didn&apos;t answer in time. It is usually a passing hiccup: try again.
                {process.env.NODE_ENV !== 'production' ? ` (${error.message})` : ''}
              </p>
              <button type="button" className="a-btn a-btn-primary" onClick={() => retry()}>
                Try again
              </button>
              {error.digest ? <p className="a-muted" style={{ fontSize: 12 }}>Reference: {error.digest}</p> : null}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
