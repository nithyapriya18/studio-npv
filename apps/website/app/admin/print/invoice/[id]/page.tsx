import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, getSettings } from '@/lib/admin/store'
import { inr, invoiceTotals, itemTotal, shortDate } from '@/lib/admin/format'
import { rupeesInWords } from '@/lib/admin/words'
import { PrintButton } from '@/components/admin/client'
import { siteConfig } from '@/config'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Invoice' }

/**
 * The invoice as the client sees it. Always printed on white, whatever the
 * screen's theme, so the colours here are fixed brand values. No
 * "by Studio NPV" credit line: that belongs on websites and apps only.
 */
const C = { ink: '#171A33', slate: '#555A78', rule: '#DDD9CE', indigo: '#232C82', wash: '#EEEFFA' }

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const invoice = await getRow('admin_invoices', Number((await params).id))
  if (!invoice) notFound()
  const [client, project, s] = await Promise.all([
    getRow('admin_clients', invoice.client_id),
    invoice.project_id ? getRow('admin_projects', invoice.project_id) : null,
    getSettings(),
  ])
  const { subtotal, tax, total } = invoiceTotals(invoice)
  const business = s.business_name || siteConfig.name
  const lines = (v?: string | null) => (v ? v.split('\n').filter(Boolean) : [])

  return (
    <div>
      <style>{`@page { size: A4; margin: 14mm; } @media print { main.wrap { max-width: none; padding: 0; } }`}</style>
      <div className="adm-no-print mx-auto mb-4 flex max-w-[800px] items-center justify-between gap-3">
        <Link href={`/admin/invoices/${invoice.id}`} className="btn-quiet btn-sm">Back to invoice</Link>
        <PrintButton />
      </div>

      <article
        className="mx-auto max-w-[800px] rounded-xl p-8 shadow-sm print:rounded-none print:p-0 print:shadow-none sm:p-12"
        style={{ background: '#fff', color: C.ink, fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.5 }}
      >
        <header className="flex flex-wrap items-start justify-between gap-6" style={{ borderBottom: `2px solid ${C.indigo}`, paddingBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1, color: C.indigo }}>{business}</div>
            <div className="mt-2" style={{ color: C.slate }}>
              {s.owner_name ? <div>{s.owner_name}</div> : null}
              {lines(s.address).map((l, i) => <div key={i}>{l}</div>)}
              {s.email || s.phone ? <div>{[s.email, s.phone].filter(Boolean).join(' · ')}</div> : null}
              {s.gstin ? <div>GSTIN: {s.gstin}</div> : null}
              {s.pan ? <div>PAN: {s.pan}</div> : null}
              {s.udyam ? <div>Udyam: {s.udyam}</div> : null}
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1 }}>{s.gstin && invoice.tax_percent ? 'Tax invoice' : 'Invoice'}</div>
            <table className="ml-auto mt-3" style={{ color: C.slate }}>
              <tbody>
                <tr><td className="pr-3">Number</td><td style={{ color: C.ink, fontWeight: 600 }}>{invoice.number}</td></tr>
                <tr><td className="pr-3">Date</td><td style={{ color: C.ink }}>{shortDate(invoice.issue_date)}</td></tr>
                {invoice.due_date ? <tr><td className="pr-3">Due</td><td style={{ color: C.ink }}>{shortDate(invoice.due_date)}</td></tr> : null}
              </tbody>
            </table>
            {invoice.status === 'Paid' ? (
              <div className="mt-3 inline-block rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wider" style={{ background: '#E3F4EA', color: '#146C3F' }}>
                Paid {invoice.paid_on ? shortDate(invoice.paid_on) : ''}
              </div>
            ) : null}
          </div>
        </header>

        <section className="mt-6 flex flex-wrap justify-between gap-6">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.slate }}>Bill to</div>
            <div className="mt-1 font-semibold">{client?.name}</div>
            {client?.contact_name ? <div>{client.contact_name}</div> : null}
            {lines(client?.address).map((l, i) => <div key={i}>{l}</div>)}
            {client?.email ? <div style={{ color: C.slate }}>{client.email}</div> : null}
            {client?.phone ? <div style={{ color: C.slate }}>{client.phone}</div> : null}
          </div>
          {project ? (
            <div className="text-right">
              <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.slate }}>Project</div>
              <div className="mt-1">{project.name}</div>
            </div>
          ) : null}
        </section>

        <table className="mt-8 w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.wash }}>
              <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wider">Description</th>
              <th className="px-3 py-2 text-right text-[12px] font-semibold uppercase tracking-wider">Qty</th>
              <th className="px-3 py-2 text-right text-[12px] font-semibold uppercase tracking-wider">Rate</th>
              <th className="px-3 py-2 text-right text-[12px] font-semibold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.rule}` }}>
                <td className="px-3 py-2.5 align-top">{it.description}</td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums">{it.qty}</td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums">{inr(it.rate, true)}</td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums">{inr(itemTotal(it), true)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <table className="min-w-[260px] tabular-nums">
            <tbody>
              <tr><td className="py-1 pr-6" style={{ color: C.slate }}>Subtotal</td><td className="py-1 text-right">{inr(subtotal, true)}</td></tr>
              {invoice.tax_percent ? (
                <tr><td className="py-1 pr-6" style={{ color: C.slate }}>{invoice.tax_label || 'Tax'} ({invoice.tax_percent}%)</td><td className="py-1 text-right">{inr(tax, true)}</td></tr>
              ) : null}
              <tr style={{ borderTop: `2px solid ${C.ink}` }}>
                <td className="pr-6 pt-2 font-semibold">Total</td>
                <td className="pt-2 text-right font-semibold" style={{ fontSize: 18 }}>{inr(total, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-right text-[13px]" style={{ color: C.slate }}>{rupeesInWords(total)}</p>

        {invoice.notes ? <p className="mt-6 whitespace-pre-wrap">{invoice.notes}</p> : null}

        {s.payment ? (
          <section className="mt-8 rounded-lg p-4" style={{ background: C.wash }}>
            <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.slate }}>How to pay</div>
            <div className="mt-1 whitespace-pre-wrap">{s.payment}</div>
          </section>
        ) : null}

        {s.invoice_footer ? <p className="mt-8 whitespace-pre-wrap text-[13px]" style={{ color: C.slate }}>{s.invoice_footer}</p> : null}
      </article>
    </div>
  )
}
