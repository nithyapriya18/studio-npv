import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows, storeMode } from '@/lib/admin/store'
import { loadAll } from '@/lib/admin/data'
import { todayItems } from '@/lib/admin/insights'
import { ACTIVE_PROJECT_STATUSES, OPEN_STAGES } from '@/lib/admin/types'
import { isOverdue } from '@/lib/admin/format'
import { signOut, stopTimer } from '@/app/admin/actions'
import { NewMenu, SideNav, TabBar, TimerClock } from '@/components/admin/shell'
import { Icon } from '@/components/admin/icons'
import { AdminToast } from '@/components/admin/toast'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

/** The admin frame from the design: sidebar, top bar, and a tab bar on phones. */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const mode = storeMode()
  if (mode === 'missing') {
    return (
      <div className="a-app">
        <main className="a-main">
          <section className="a-card">
            <h1 className="a-page-title">Almost there</h1>
            <p className="a-muted">
              You&apos;re signed in, but the database isn&apos;t connected. Run supabase/admin.sql in the Supabase SQL editor, then
              npm run admin:setup to add the secret key, and redeploy.
            </p>
          </section>
        </main>
      </div>
    )
  }

  const data = await loadAll()
  const timerOn = Boolean(data.settings.timer_started)
  const timerProject = data.projects.find((p) => String(p.id) === data.settings.timer_project)
  const counts = {
    today: todayItems(data).open.length,
    leads: data.leads.filter((l) => OPEN_STAGES.includes(l.stage)).length,
    clients: data.clients.length,
    projects: data.projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status)).length,
    overdue: data.invoices.filter(isOverdue).length,
    ideas: (await listRows('admin_ideas')).filter((i) => i.status === 'Parked' || i.status === 'Exploring').length,
  }

  return (
    <div className="a-app">
      <aside className="a-side" aria-label="Studio navigation">
        <Link className="a-brand" href="/admin">
          <span className="a-brand-mark">NPV</span>
          <span className="a-brand-text">
            <span className="a-brand-name">Studio NPV</span>
            <span className="a-brand-sub">Admin</span>
          </span>
        </Link>
        <SideNav counts={counts} />
      </aside>

      <main className="a-main">
        <header className="a-top">
          <Link className="a-m-brand" href="/admin" aria-label="Studio NPV, Today">
            <span className="a-brand-mark">NPV</span>
          </Link>
          <form className="a-search" action="/admin/search" role="search">
            <Icon name="search" />
            <label className="a-sr" htmlFor="admin-search">Search</label>
            <input id="admin-search" name="q" type="search" placeholder="Search clients, projects, leads, invoices" />
          </form>
          <div className="a-top-actions">
            {timerOn ? (
              <form className="a-timer" action={stopTimer} aria-label="Running timer">
                <span className="a-dot" aria-hidden="true" />
                <span className="a-timer-label">
                  {[timerProject?.name, data.settings.timer_note].filter(Boolean).join(' · ') || 'Timer'}
                </span>
                <TimerClock started={data.settings.timer_started!} />
                <button className="a-iconbtn" type="submit" aria-label="Stop timer and log the time">
                  <Icon name="stop" small />
                </button>
              </form>
            ) : (
              <Link href="/admin/time" className="a-iconbtn" aria-label="Start a timer" title="Start a timer">
                <Icon name="time" />
              </Link>
            )}
            <Link href="/admin/search" className="a-iconbtn a-m-search" aria-label="Search">
              <Icon name="search" />
            </Link>
            <ThemeToggle className="a-iconbtn" />
            <NewMenu />
            <form action={signOut}>
              <button type="submit" className="a-avatar" aria-label="Sign out" title="Sign out">
                NV
              </button>
            </form>
          </div>
        </header>
        {mode === 'dev' ? <p className="a-devnote">Local test data. Nothing here touches the live database.</p> : null}
        {children}
      </main>
      <TabBar />
      <Suspense fallback={null}>
        <AdminToast />
      </Suspense>
    </div>
  )
}
