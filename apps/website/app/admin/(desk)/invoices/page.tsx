import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll, namer } from '@/lib/admin/data'
import { INVOICE_STATUSES } from '@/lib/admin/types'
import { inr, invoiceTotals, isOverdue, shortDate } from '@/lib/admin/format'
import { Badge, Card, Empty, PageHeader, Row, Stat, Tabs } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Invoices' }

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = 'All' } = await searchParams
  const { clients, projects, invoices } = await loadAll()
  const name = namer(clients, projects)
  const match = (s: string) => (i: (typeof invoices)[number]) =>
    s === 'All' ? true : s === 'Overdue' ? isOverdue(i) : i.status === s
  const href = (s: string) => `/admin/invoices?status=${s}`
  const tabs = ['All', 'Overdue', ...INVOICE_STATUSES].map((s) => ({ href: href(s), label: s, count: invoices.filter(match(s)).length }))
  const shown = invoices.filter(match(status))

  const year = new Date().getFullYear().toString()
  const sum = (list: typeof invoices) => list.reduce((s, i) => s + invoiceTotals(i).total, 0)
  const sent = invoices.filter((i) => i.status === 'Sent')
  const paidThisYear = invoices.filter((i) => i.status === 'Paid' && (i.paid_on ?? '').startsWith(year))

  return (
    <>
      <PageHeader title="Invoices" sub="Make an invoice, print it to PDF, and mark it paid when the money comes in." action={<Link href="/admin/invoices/new" className="btn-primary btn-sm">New invoice</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Waiting to be paid" value={inr(sum(sent))} sub={`${sent.length} invoice${sent.length === 1 ? '' : 's'}`} />
        <Stat label="Overdue" value={inr(sum(sent.filter(isOverdue)))} sub={`${sent.filter(isOverdue).length} invoice${sent.filter(isOverdue).length === 1 ? '' : 's'}`} />
        <Stat label={`Paid in ${year}`} value={inr(sum(paidThisYear))} sub={`${paidThisYear.length} invoice${paidThisYear.length === 1 ? '' : 's'}`} />
      </div>
      <Tabs items={tabs} current={href(status)} />
      <Card>
        {shown.length ? (
          shown.map((i) => (
            <Row
              key={i.id}
              href={`/admin/invoices/${i.id}`}
              title={`${i.number} · ${name.client(i.client_id)}`}
              meta={[shortDate(i.issue_date), name.project(i.project_id), i.status === 'Paid' ? `paid ${shortDate(i.paid_on)}` : i.due_date ? `due ${shortDate(i.due_date)}` : null].filter(Boolean).join(' · ')}
              right={
                <>
                  <span className="tabular-nums">{inr(invoiceTotals(i).total)}</span>
                  <Badge>{isOverdue(i) ? 'Overdue' : i.status}</Badge>
                </>
              }
            />
          ))
        ) : (
          <Empty>No invoices here.</Empty>
        )}
      </Card>
    </>
  )
}
