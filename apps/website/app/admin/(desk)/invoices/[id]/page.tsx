import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, listRows } from '@/lib/admin/store'
import { clientOptions, projectOptions } from '@/lib/admin/data'
import { addDays, inr, invoiceTotals, isOverdue, shortDate, today } from '@/lib/admin/format'
import { deleteInvoice, setInvoiceStatus } from '@/app/admin/actions'
import { ConfirmButton, InvoiceForm } from '@/components/admin/client'
import { Badge, Card, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Invoice' }

function StatusButton({ id, status, label, primary }: { id: number; status: string; label: string; primary?: boolean }) {
  return (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={primary ? 'btn-primary btn-sm' : 'btn-quiet btn-sm'}>{label}</button>
    </form>
  )
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const invoice = await getRow('admin_invoices', Number((await params).id))
  if (!invoice) notFound()
  const [clients, projects] = await Promise.all([
    listRows('admin_clients', { order: { column: 'name', ascending: true } }),
    listRows('admin_projects'),
  ])
  const client = clients.find((c) => c.id === invoice.client_id)
  const { total } = invoiceTotals(invoice)
  const t = today()

  return (
    <>
      <PageHeader
        title={invoice.number}
        sub={
          <>
            <Badge>{isOverdue(invoice) ? 'Overdue' : invoice.status}</Badge>{' '}
            <span className="ml-1">
              {client ? <Link href={`/admin/clients/${client.id}`} className="text-accent">{client.name}</Link> : null} · {inr(total, true)} · issued {shortDate(invoice.issue_date)}
              {invoice.status === 'Paid' ? ` · paid ${shortDate(invoice.paid_on)}` : invoice.due_date ? ` · due ${shortDate(invoice.due_date)}` : ''}
            </span>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/print/invoice/${invoice.id}`} target="_blank" className="btn-primary btn-sm">Open to print or save as PDF</Link>
            {invoice.status === 'Draft' ? <StatusButton id={invoice.id} status="Sent" label="Mark sent" /> : null}
            {invoice.status === 'Sent' ? <StatusButton id={invoice.id} status="Paid" label="Mark paid today" /> : null}
            {invoice.status === 'Paid' ? <StatusButton id={invoice.id} status="Sent" label="Mark unpaid" /> : null}
          </div>
        }
      />
      <Card title="Edit">
        <InvoiceForm
          key={JSON.stringify(invoice)}
          invoice={invoice}
          clients={clientOptions(clients)}
          projects={projectOptions(projects, clients)}
          suggestedNumber={invoice.number}
          defaults={{ issue_date: invoice.issue_date ?? t, due_date: invoice.due_date ?? addDays(t, 7) }}
        />
      </Card>
      <form action={deleteInvoice} className="mt-4 text-right">
        <input type="hidden" name="id" value={invoice.id} />
        <ConfirmButton message={`Delete invoice ${invoice.number}? If you've sent it, mark it Cancelled instead, so your numbering stays complete.`}>Delete invoice</ConfirmButton>
      </form>
    </>
  )
}
