import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { getSettings, listRows } from '@/lib/admin/store'
import { clientOptions, nextInvoiceNumber, projectOptions } from '@/lib/admin/data'
import { addDays, today } from '@/lib/admin/format'
import { InvoiceForm } from '@/components/admin/client'
import { Card, Empty, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'New invoice' }

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string; project?: string }> }) {
  await requireAdmin()
  const { client, project } = await searchParams
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
            defaults={{ issue_date: t, due_date: addDays(t, 7), client_id: Number(client) || undefined, project_id: Number(project) || undefined }}
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
