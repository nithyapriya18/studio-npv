import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll, namer } from '@/lib/admin/data'
import { ACTIVE_PROJECT_STATUSES, OPEN_STAGES } from '@/lib/admin/types'
import { addDays, inr, invoiceTotals, isOverdue, monthStart, relDay, shortDate, today } from '@/lib/admin/format'
import { Badge, Card, Empty, PageHeader, Row, Stat } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Today' }

export default async function TodayPage() {
  const { clients, leads, projects, invoices, tasks } = await loadAll()
  const name = namer(clients, projects)
  const t = today()
  const soon = addDays(t, 7)

  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage))
  const pipeline = open.reduce((s, l) => s + (Number(l.value) || 0), 0)
  const followUps = open
    .filter((l) => !l.follow_up_on || l.follow_up_on <= t)
    .sort((a, b) => (a.follow_up_on ?? '0').localeCompare(b.follow_up_on ?? '0'))

  const unpaid = invoices.filter((i) => i.status === 'Sent')
  const unpaidTotal = unpaid.reduce((s, i) => s + invoiceTotals(i).total, 0)
  const overdue = unpaid.filter(isOverdue)
  const paidThisMonth = invoices
    .filter((i) => i.status === 'Paid' && (i.paid_on ?? '') >= monthStart())
    .reduce((s, i) => s + invoiceTotals(i).total, 0)

  const active = projects
    .filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status))
    .sort((a, b) => (a.due_on ?? '9').localeCompare(b.due_on ?? '9'))

  const work = tasks
    .filter((k) => k.status === 'Doing' || (k.status === 'To do' && k.due_on && k.due_on <= soon))
    .sort((a, b) => (a.status === b.status ? (a.due_on ?? '9').localeCompare(b.due_on ?? '9') : a.status === 'Doing' ? -1 : 1))

  const wonThisMonth = leads.filter((l) => l.stage === 'Won' && l.updated_at.slice(0, 10) >= monthStart()).length

  return (
    <>
      <PageHeader
        title="Today"
        sub={shortDate(t)}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/leads/new" className="btn-primary btn-sm">Add lead</Link>
            <Link href="/admin/work" className="btn-quiet btn-sm">Add task</Link>
            <Link href="/admin/invoices/new" className="btn-quiet btn-sm">New invoice</Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open pipeline" value={inr(pipeline)} sub={`${open.length} open lead${open.length === 1 ? '' : 's'}`} href="/admin/leads" />
        <Stat
          label="Waiting to be paid"
          value={inr(unpaidTotal)}
          sub={overdue.length ? <span className="adm-bad-text">{overdue.length} overdue</span> : `${unpaid.length} sent`}
          href="/admin/invoices"
        />
        <Stat label="Paid this month" value={inr(paidThisMonth)} sub={`${wonThisMonth} lead${wonThisMonth === 1 ? '' : 's'} won this month`} href="/admin/invoices?status=Paid" />
        <Stat label="Projects in flight" value={active.length} sub={(() => { const n = tasks.filter((k) => k.status === 'Doing').length; return `${n} task${n === 1 ? '' : 's'} in progress` })()} href="/admin/projects" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Follow up" action={<Link href="/admin/leads" className="text-[13px] text-accent">All leads</Link>}>
          {followUps.length ? (
            followUps.slice(0, 8).map((l) => (
              <Row
                key={l.id}
                href={`/admin/leads/${l.id}`}
                title={l.company ? `${l.name}, ${l.company}` : l.name}
                meta={l.next_step || (l.follow_up_on ? `Follow up ${relDay(l.follow_up_on)}` : 'No follow-up date set')}
                right={
                  <>
                    {l.follow_up_on && l.follow_up_on < t ? <span className="adm-bad-text text-[13px]">{relDay(l.follow_up_on)}</span> : null}
                    <Badge>{l.stage}</Badge>
                  </>
                }
              />
            ))
          ) : (
            <Empty>No follow-ups due.</Empty>
          )}
        </Card>

        <Card title="Work" action={<Link href="/admin/work" className="text-[13px] text-accent">All work</Link>}>
          {work.length ? (
            work.slice(0, 8).map((k) => (
              <Row
                key={k.id}
                href="/admin/work"
                title={k.title}
                meta={[name.project(k.project_id), k.due_on ? `due ${relDay(k.due_on)}` : ''].filter(Boolean).join(' · ')}
                right={<Badge>{k.status}</Badge>}
              />
            ))
          ) : (
            <Empty>Nothing in progress or due this week.</Empty>
          )}
        </Card>

        <Card title="Money to collect" action={<Link href="/admin/invoices" className="text-[13px] text-accent">All invoices</Link>}>
          {unpaid.length ? (
            unpaid.map((i) => (
              <Row
                key={i.id}
                href={`/admin/invoices/${i.id}`}
                title={`${i.number} · ${name.client(i.client_id)}`}
                meta={i.due_date ? `Due ${shortDate(i.due_date)} (${relDay(i.due_date)})` : `Sent ${shortDate(i.issue_date)}`}
                right={
                  <>
                    <span className="tabular-nums">{inr(invoiceTotals(i).total)}</span>
                    <Badge>{isOverdue(i) ? 'Overdue' : 'Sent'}</Badge>
                  </>
                }
              />
            ))
          ) : (
            <Empty>No unpaid invoices.</Empty>
          )}
        </Card>

        <Card title="Projects" action={<Link href="/admin/projects" className="text-[13px] text-accent">All projects</Link>}>
          {active.length ? (
            active.map((p) => (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}`}
                title={p.name}
                meta={[name.client(p.client_id), p.due_on ? `due ${shortDate(p.due_on)}` : ''].filter(Boolean).join(' · ')}
                right={<Badge>{p.status}</Badge>}
              />
            ))
          ) : (
            <Empty>No active projects.</Empty>
          )}
        </Card>
      </div>
    </>
  )
}
