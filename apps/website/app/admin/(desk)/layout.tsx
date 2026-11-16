import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { storeMode } from '@/lib/admin/store'
import { signOut } from '@/app/admin/actions'
import { AdminNav } from '@/components/admin/client'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const mode = storeMode()
  return (
    <div>
      <header className="adm-no-print mb-6 space-y-3 border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="logo">
            studio <b>npv</b> <span className="ml-1 text-[13px] font-normal text-text-muted">admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden text-[14px] text-text-muted hover:text-text-primary sm:inline">
              View site
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button type="submit" className="btn-quiet btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      {mode === 'dev' ? (
        <p className="adm-no-print mb-4 rounded-xl bg-accent-light px-4 py-2 text-[13px] text-text-primary">
          Local test data (ADMIN_DEV_STORE). Nothing here touches the live database.
        </p>
      ) : null}
      {mode === 'missing' ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="font-serif text-[30px]">Almost there</h1>
          <p className="mt-2 text-text-muted">
            You&apos;re signed in, but the database isn&apos;t connected. Run <code>supabase/admin.sql</code> in the
            Supabase SQL editor, then <code>npm run admin:setup</code> to add the secret key, and redeploy.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
