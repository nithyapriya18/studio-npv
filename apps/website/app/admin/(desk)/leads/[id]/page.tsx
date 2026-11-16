import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, listRows } from '@/lib/admin/store'
import { clientOptions, projectOptions } from '@/lib/admin/data'
import { LEAD_STAGES } from '@/lib/admin/types'
import { inr, shortDate } from '@/lib/admin/format'
import { convertLead, deleteLead, setLeadStage } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { DocumentForm, DocumentList, LeadForm, NotesPanel } from '@/components/admin/forms'
import { Badge, Card, ExternalLink, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Lead' }

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const leadId = Number((await params).id)
  const lead = await getRow('admin_leads', leadId)
  if (!lead) notFound()
  const [notes, docs, clients, projects] = await Promise.all([
    listRows('admin_notes', { eq: { lead_id: lead.id } }),
    listRows('admin_documents', { eq: { lead_id: lead.id } }),
    listRows('admin_clients', { order: { column: 'name', ascending: true } }),
    listRows('admin_projects'),
  ])
  const back = `/admin/leads/${lead.id}`
  const client = lead.client_id ? clients.find((c) => c.id === lead.client_id) : null

  return (
    <>
      <PageHeader
        title={lead.company ? `${lead.name}, ${lead.company}` : lead.name}
        sub={
          <>
            <Badge>{lead.stage}</Badge> <span className="ml-1">{lead.source} · added {shortDate(lead.created_at)}{lead.value ? ` · ${inr(Number(lead.value))}` : ''}</span>
          </>
        }
        action={<Link href="/admin/leads" className="a-btn a-btn-quiet a-btn-sm">All leads</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card title="Move to">
            <div className="flex flex-wrap gap-2">
              {LEAD_STAGES.filter((s) => s !== lead.stage && s !== 'Won').map((s) => (
                <form key={s} action={setLeadStage}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="stage" value={s} />
                  <input type="hidden" name="back" value={back} />
                  <button type="submit" className="a-btn a-btn-quiet a-btn-sm">{s}</button>
                </form>
              ))}
              {client ? (
                <Link href={`/admin/clients/${client.id}`} className="a-btn a-btn-primary a-btn-sm">Client: {client.name}</Link>
              ) : (
                <form action={convertLead}>
                  <input type="hidden" name="id" value={lead.id} />
                  <button type="submit" className="a-btn a-btn-primary a-btn-sm">Won: make them a client</button>
                </form>
              )}
            </div>
            {lead.email || lead.phone ? (
              <p className="mt-3 text-[14px] text-text-muted">
                {lead.email ? <ExternalLink href={`mailto:${lead.email}`}>{lead.email}</ExternalLink> : null}
                {lead.email && lead.phone ? ' · ' : null}
                {lead.phone ? <ExternalLink href={`tel:${lead.phone.replace(/\s/g, '')}`}>{lead.phone}</ExternalLink> : null}
                {lead.phone ? (
                  <>
                    {' · '}
                    <ExternalLink href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}>WhatsApp</ExternalLink>
                  </>
                ) : null}
              </p>
            ) : null}
          </Card>

          <Card title="Details">
            {/* Keyed by the record, so the form refreshes after a quick change above. */}
            <LeadForm key={lead.updated_at} lead={lead} />
          </Card>

          <Card title="Decks and documents">
            <DocumentList docs={docs} back={back} />
            <details className="mt-4">
              <summary className="cursor-pointer text-[14px] text-accent">Add a document</summary>
              <div className="mt-3">
                <DocumentForm back={back} clients={clientOptions(clients)} projects={projectOptions(projects, clients)} leads={[]} fixed={{ lead_id: lead.id }} />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-4">
          <NotesPanel notes={notes} back={back} target={{ lead_id: lead.id }} />
          <form action={deleteLead} className="text-right">
            <input type="hidden" name="id" value={lead.id} />
            <ConfirmButton message="Delete this lead and its notes? This can't be undone.">Delete lead</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  )
}
