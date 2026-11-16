import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadAll, namer, projectOptions } from '@/lib/admin/data'
import { listRows } from '@/lib/admin/store'
import { inr, invoiceTotals, isOverdue, shortDate } from '@/lib/admin/format'
import { deleteClient } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { ClientForm, DocumentForm, DocumentList, NotesPanel } from '@/components/admin/forms'
import { Badge, Card, Empty, ErrorNote, ExternalLink, PageHeader, Row } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Client' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function ClientPage({ params, searchParams }: Props) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  const all = await loadAll()
  const client = all.clients.find((c) => c.id === Number(id))
  if (!client) notFound()
  const name = namer(all.clients, all.projects)
  const back = `/admin/clients/${client.id}`
  const projects = all.projects.filter((p) => p.client_id === client.id)
  const projectIds = new Set(projects.map((p) => p.id))
  const invoices = all.invoices.filter((i) => i.client_id === client.id)
  const docs = all.documents.filter((d) => d.client_id === client.id || (d.project_id && projectIds.has(d.project_id)))
  const leads = all.leads.filter((l) => l.client_id === client.id)
  const notes = await listRows('admin_notes', { eq: { client_id: client.id } })

  const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotals(i).total, 0)
  const owed = invoices.filter((i) => i.status === 'Sent').reduce((s, i) => s + invoiceTotals(i).total, 0)

  return (
    <>
      <PageHeader
        title={client.name}
        sub={[client.contact_name, client.city, `client since ${shortDate(client.created_at)}`].filter(Boolean).join(' · ')}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/projects/new?client=${client.id}`} className="btn-quiet btn-sm">Add project</Link>
            <Link href={`/admin/invoices/new?client=${client.id}`} className="btn-primary btn-sm">New invoice</Link>
          </div>
        }
      />
      <ErrorNote message={error} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card title="Projects">
            {projects.length ? (
              projects.map((p) => (
                <Row key={p.id} href={`/admin/projects/${p.id}`} title={p.name} meta={[p.kind, p.price ? inr(Number(p.price)) : null, p.due_on ? `due ${shortDate(p.due_on)}` : null].filter(Boolean).join(' · ')} right={<Badge>{p.status}</Badge>} />
              ))
            ) : (
              <Empty>No projects yet.</Empty>
            )}
          </Card>

          <Card title={`Invoices${paid || owed ? ` · paid ${inr(paid)}${owed ? `, owes ${inr(owed)}` : ''}` : ''}`}>
            {invoices.length ? (
              invoices.map((i) => (
                <Row key={i.id} href={`/admin/invoices/${i.id}`} title={i.number} meta={[shortDate(i.issue_date), name.project(i.project_id)].filter(Boolean).join(' · ')} right={<><span className="tabular-nums">{inr(invoiceTotals(i).total)}</span><Badge>{isOverdue(i) ? 'Overdue' : i.status}</Badge></>} />
              ))
            ) : (
              <Empty>No invoices yet.</Empty>
            )}
          </Card>

          <Card title="Decks and documents">
            <DocumentList docs={docs} back={back} describe={(d) => name.project(d.project_id)} />
            <details className="mt-4">
              <summary className="cursor-pointer text-[14px] text-accent">Add a document</summary>
              <div className="mt-3">
                <DocumentForm back={back} clients={[]} projects={projectOptions(projects, all.clients)} leads={[]} fixed={{ client_id: client.id }} />
              </div>
            </details>
          </Card>

          <Card title="Details">
            <ClientForm key={JSON.stringify(client)} client={client} />
          </Card>
        </div>

        <div className="space-y-4">
          {client.email || client.phone || client.website ? (
            <Card title="Contact">
              <ul className="space-y-1 text-[14px]">
                {client.email ? <li><ExternalLink href={`mailto:${client.email}`}>{client.email}</ExternalLink></li> : null}
                {client.phone ? <li><ExternalLink href={`tel:${client.phone.replace(/\s/g, '')}`}>{client.phone}</ExternalLink> · <ExternalLink href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}>WhatsApp</ExternalLink></li> : null}
                {client.website ? <li><ExternalLink href={client.website}>{client.website.replace(/^https?:\/\//, '')}</ExternalLink></li> : null}
              </ul>
            </Card>
          ) : null}
          {leads.length ? (
            <Card title="Came from">
              {leads.map((l) => (
                <Row key={l.id} href={`/admin/leads/${l.id}`} title={l.name} meta={`${l.source} · ${shortDate(l.created_at)}`} />
              ))}
            </Card>
          ) : null}
          <NotesPanel notes={notes} back={back} target={{ client_id: client.id }} />
          <form action={deleteClient} className="text-right">
            <input type="hidden" name="id" value={client.id} />
            <ConfirmButton message="Delete this client and their notes? Projects and documents stay, without a client.">Delete client</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  )
}
