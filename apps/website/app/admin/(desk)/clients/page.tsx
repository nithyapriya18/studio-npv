import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll } from '@/lib/admin/data'
import { ACTIVE_PROJECT_STATUSES } from '@/lib/admin/types'
import { inr, invoiceTotals } from '@/lib/admin/format'
import { Card, Empty, PageHeader, Row } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const { clients, projects, invoices } = await loadAll()
  return (
    <>
      <PageHeader title="Clients" sub="People you work for, with their projects, invoices and documents." action={<Link href="/admin/clients/new" className="a-btn a-btn-primary a-btn-sm">Add client</Link>} />
      <Card>
        {clients.length ? (
          clients.map((c) => {
            const mine = projects.filter((p) => p.client_id === c.id)
            const active = mine.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status)).length
            const billed = invoices.filter((i) => i.client_id === c.id && i.status !== 'Cancelled' && i.status !== 'Draft')
            const paid = billed.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotals(i).total, 0)
            const owed = billed.filter((i) => i.status === 'Sent').reduce((s, i) => s + invoiceTotals(i).total, 0)
            return (
              <Row
                key={c.id}
                href={`/admin/clients/${c.id}`}
                title={c.name}
                meta={[c.contact_name, c.city, `${mine.length} project${mine.length === 1 ? '' : 's'}${active ? ` (${active} active)` : ''}`].filter(Boolean).join(' · ')}
                right={
                  <span className="text-right text-[13px] tabular-nums text-text-muted">
                    {paid ? <span className="block">paid {inr(paid)}</span> : null}
                    {owed ? <span className="adm-bad-text block">owes {inr(owed)}</span> : null}
                  </span>
                }
              />
            )
          })
        ) : (
          <Empty>No clients yet. Win a lead, or add one.</Empty>
        )}
      </Card>
    </>
  )
}
