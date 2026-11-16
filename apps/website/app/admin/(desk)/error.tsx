'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h1 className="font-serif text-[30px]">Something went wrong</h1>
      <p className="mt-2 text-text-muted">
        {process.env.NODE_ENV === 'production'
          ? 'That didn’t work. Try again. If it keeps failing, check that supabase/admin.sql has been run and the secret key is set in Vercel.'
          : error.message}
      </p>
      {error.digest ? <p className="mt-2 text-[12px] text-text-muted">Reference: {error.digest}</p> : null}
      <button type="button" className="btn-primary btn-sm mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
