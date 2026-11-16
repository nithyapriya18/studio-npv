import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, getSettings, listRows } from '@/lib/admin/store'
import { clientOptions, nextInvoiceNumber, projectOptions } from '@/lib/admin/data'
import { addDays, today } from '@/lib/admin/format'
import { InvoiceForm } from '@/components/admin/client'
import { Card, Empty, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'New invoice' }

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string; project?: string; milestone?: string }> }) {
  await requireAdmin()
  const { client, project, milestone } = await searchParams
  const ms = milestone ? await getRow('admin_milestones', Number(milestone)) : null
  const [clients, projects, invoices, settings] = await Promise.all([
    listRows('admin_clients', { order: { column: 'name', ascending: true } }),
    listRows('admin_projects'),
    listRows('admin_invoices'),
    getSettings(),
  ])
  const t = today()
  return (
    <>
      <PageHeader title="New invoice" />
      <Card>
        {clients.length ? (
          <InvoiceForm
            clients={clientOptions(clients)}
            projects={projectOptions(projects, clients)}
            suggestedNumber={nextInvoiceNumber(invoices.map((i) => i.number), settings.invoice_prefix ?? '', t.slice(0, 4))}
            defaults={{
              issue_date: t,
              due_date: addDays(t, 7),
              client_id: Number(client) || undefined,
              project_id: Number(project) || ms?.project_id || undefined,
              ...(ms ? { milestone_id: ms.id, items: [{ description: ms.title, qty: 1, rate: Number(ms.amount) || 0 }] } : {}),
            }}
          />
        ) : (
          <Empty>
            Add a client first. <Link href="/admin/clients/new" className="text-accent">Add client</Link>
          </Empty>
        )}
      </Card>
    </>
  )
}
