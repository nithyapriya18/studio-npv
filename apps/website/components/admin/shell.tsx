'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/admin/icons'
import { NAV_COOKIE } from '@/lib/admin/types'

export interface NavCounts {
  today: number
  leads: number
  clients: number
  projects: number
  overdue: number
  ideas: number
}

const NAV = [
  { href: '/admin', label: 'Today', icon: 'today', count: 'today' },
  { href: '/admin/leads', label: 'Leads', icon: 'leads', count: 'leads' },
  { href: '/admin/clients', label: 'Clients', icon: 'clients', count: 'clients' },
  { href: '/admin/projects', label: 'Projects', icon: 'projects', count: 'projects' },
  { href: '/admin/time', label: 'Time', icon: 'time' },
  { href: '/admin/invoices', label: 'Invoices', icon: 'invoices', count: 'overdue' },
  { href: '/admin/documents', label: 'Documents', icon: 'documents' },
  { href: '/admin/ideas', label: 'Ideas', icon: 'idea', count: 'ideas' },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  if (href === '/admin/time') return pathname.startsWith('/admin/time') || pathname.startsWith('/admin/work')
  return pathname.startsWith(href)
}

export function SideNav({ counts, collapsed: startCollapsed }: { counts: NavCounts; collapsed: boolean }) {
  const pathname = usePathname() ?? ''
  const [collapsed, setCollapsed] = useState(startCollapsed)
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !collapsed
    setCollapsed(next)
    e.currentTarget.closest('.a-app')?.classList.toggle('a-collapsed', next)
    document.cookie = `${NAV_COOKIE}=${next ? 'collapsed' : 'open'}; path=/admin; max-age=31536000; samesite=lax`
  }
  const tip = (label: string) => (collapsed ? label : undefined)
  return (
    <>
      <nav className="a-nav" aria-label="Admin">
        <span className="a-nav-label">Run the studio</span>
        {NAV.map((n) => {
          const c = 'count' in n ? counts[n.count] : 0
          return (
            <Link key={n.href} href={n.href} title={tip(n.label)} aria-current={isActive(pathname, n.href) ? 'page' : undefined}>
              <Icon name={n.icon} />
              <span className="a-nav-text">{n.label}</span>
              {c ? (
                <span className={`a-count${n.href === '/admin/invoices' ? ' a-alert' : ''}`} aria-label={n.href === '/admin/invoices' ? `${c} overdue` : undefined}>
                  {c}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
      <div className="a-side-foot a-nav">
        <Link href="/" target="_blank" title={tip('studionpv.com')}>
          <Icon name="external" />
          <span className="a-nav-text">studionpv.com</span>
        </Link>
        <Link href="/admin/settings" title={tip('Settings')} aria-current={pathname.startsWith('/admin/settings') ? 'page' : undefined}>
          <Icon name="settings" />
          <span className="a-nav-text">Settings</span>
        </Link>
        <button type="button" className="a-nav-toggle" onClick={toggle} aria-expanded={!collapsed} title={tip('Expand sidebar')}>
          <Icon name={collapsed ? 'sidebarOpen' : 'sidebar'} />
          <span className="a-nav-text">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
        </button>
      </div>
    </>
  )
}

const TABS = [
  { href: '/admin', label: 'Today', icon: 'today' },
  { href: '/admin/leads', label: 'Leads', icon: 'leads' },
  { href: '/admin/projects', label: 'Projects', icon: 'projects' },
  { href: '/admin/invoices', label: 'Money', icon: 'invoices' },
  { href: '/admin/clients', label: 'Clients', icon: 'clients' },
]

export function TabBar() {
  const pathname = usePathname() ?? ''
  return (
    <nav className="a-tabbar" aria-label="Admin sections">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={isActive(pathname, t.href) ? 'page' : undefined}>
          <Icon name={t.icon} />
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

/** Elapsed time on the running timer, ticking every few seconds. */
export function TimerClock({ started }: { started: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    // Read the clock only in the browser (after hydration), then every 5 s.
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const t = setInterval(tick, 5000)
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [])
  const mins = now ? Math.max(0, Math.floor((now - Date.parse(started)) / 60000)) : 0
  return <span className="a-timer-time a-num">{`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`}</span>
}

/** "New" button: a small menu of things to add. Closes on navigation. */
export function NewMenu() {
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const items = [
    { href: '/admin/leads/new', label: 'Lead' },
    { href: '/admin/clients/new', label: 'Client' },
    { href: '/admin/projects/new', label: 'Project' },
    { href: '/admin/invoices/new', label: 'Invoice' },
    { href: '/admin/time', label: 'Time entry' },
    { href: '/admin/work', label: 'Task' },
    { href: '/admin/documents', label: 'Document' },
    { href: '/admin/ideas', label: 'Idea' },
  ]
  return (
    <div className="a-newmenu">
      <button
        type="button"
        className="a-btn a-btn-primary a-btn-new"
        aria-expanded={open}
        aria-label="New: lead, client, project, invoice, time, task or document"
        onClick={() => setOpenOn(open ? null : (pathname ?? ''))}
      >
        <Icon name="plus" />
        <span className="a-lbl">New</span>
      </button>
      {open ? (
        <div className="a-menu" role="menu">
          {items.map((i) => (
            <Link key={i.label} href={i.href} role="menuitem" onClick={() => setOpenOn(null)}>
              {i.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Checkbox that submits its form at once (tick off a task, follow-up or milestone). */
export function CheckSubmit({ checked, label, id }: { checked: boolean; label: string; id: string }) {
  return (
    <input
      className="a-chk"
      type="checkbox"
      id={id}
      defaultChecked={checked}
      aria-label={label}
      onChange={(e) => {
        const form = e.currentTarget.form
        const field = form?.elements.namedItem('checked') as HTMLInputElement | null
        if (field) field.value = e.currentTarget.checked ? '1' : '0'
        form?.requestSubmit()
      }}
    />
  )
}
