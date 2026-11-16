import type { Metadata } from 'next'
import { loadAll } from '@/lib/admin/data'
import { invoiceTotals } from '@/lib/admin/format'
import { fmtInr } from '@/lib/admin/insights'
import { Card, Empty, PageHeader, Row, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const data = await loadAll()
  const needle = q.trim().toLowerCase()
  const has = (...v: (string | null | undefined)[]) => Boolean(needle) && v.some((x) => x?.toLowerCase().includes(needle))
  const clientName = (id: number | null) => data.clients.find((c) => c.id === id)?.name ?? ''

  const clients = data.clients.filter((c) => has(c.name, c.contact_name, c.email, c.phone, c.city, c.notes))
  const leads = data.leads.filter((l) => has(l.name, l.company, l.email, l.phone, l.notes, l.next_step))
  const projects = data.projects.filter((p) => has(p.name, p.summary, p.notes, clientName(p.client_id)))
  const invoices = data.invoices.filter((i) => has(i.number, clientName(i.client_id), ...i.items.map((x) => x.description)))
  const docs = data.documents.filter((d) => has(d.title, d.notes, d.url))
  const total = clients.length + leads.length + projects.length + invoices.length + docs.length

  return (
    <>
      <PageHeader title="Search" sub={needle ? `${total} result${total === 1 ? '' : 's'} for “${q}”` : 'Search clients, leads, projects, invoices and documents.'} />
      <form action="/admin/search" className="a-search a-search-page" role="search">
        <input name="q" type="search" defaultValue={q} placeholder="Name, company, invoice number, phone…" aria-label="Search" autoFocus />
      </form>
      {needle && !total ? <Empty>Nothing matches “{q}”.</Empty> : null}
      <div className="a-grid">
        {clients.length ? <Card title="Clients" className="a-s6">{clients.map((c) => <Row key={c.id} href={`/admin/clients/${c.id}`} title={c.name} meta={[c.contact_name, c.city].filter(Boolean).join(' · ')} />)}</Card> : null}
        {leads.length ? <Card title="Leads" className="a-s6">{leads.map((l) => <Row key={l.id} href={`/admin/leads/${l.id}`} title={l.company ? `${l.name}, ${l.company}` : l.name} meta={l.next_step ?? l.source} right={<Tag>{l.stage}</Tag>} />)}</Card> : null}
        {projects.length ? <Card title="Projects" className="a-s6">{projects.map((p) => <Row key={p.id} href={`/admin/projects/${p.id}`} title={p.name} meta={clientName(p.client_id)} right={<Tag>{p.status}</Tag>} />)}</Card> : null}
        {invoices.length ? <Card title="Invoices" className="a-s6">{invoices.map((i) => <Row key={i.id} href={`/admin/invoices/${i.id}`} title={i.number} meta={clientName(i.client_id)} right={<><span className="a-num">{fmtInr(invoiceTotals(i).total)}</span><Tag>{i.status}</Tag></>} />)}</Card> : null}
        {docs.length ? <Card title="Documents" className="a-s6">{docs.map((d) => <Row key={d.id} href={d.url} title={d.title} meta={d.kind} />)}</Card> : null}
      </div>
    </>
  )
}
