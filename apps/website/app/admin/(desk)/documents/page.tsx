import type { Metadata } from 'next'
import { clientOptions, leadOptions, loadAll, namer, projectOptions } from '@/lib/admin/data'
import { DOCUMENT_KINDS } from '@/lib/admin/types'
import { DocumentForm, DocumentList } from '@/components/admin/forms'
import { Card, PageHeader, Tabs } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Documents' }

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind = 'All' } = await searchParams
  const { clients, projects, leads, documents } = await loadAll()
  const name = namer(clients, projects, leads)
  const href = (k: string) => `/admin/documents?kind=${k}`
  const tabs = ['All', ...DOCUMENT_KINDS]
    .map((k) => ({ href: href(k), label: k, count: k === 'All' ? documents.length : documents.filter((d) => d.kind === k).length }))
    .filter((t) => t.count || t.label === 'All' || t.label === kind)
  const shown = kind === 'All' ? documents : documents.filter((d) => d.kind === kind)
  const back = href(kind)

  return (
    <>
      <PageHeader title="Documents" sub="Decks, quotes, audits and briefs, linked to the client, project or lead they belong to." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <Tabs items={tabs} current={href(kind)} />
          <DocumentList
            docs={shown}
            back={back}
            describe={(d) => [name.client(d.client_id), name.project(d.project_id), d.lead_id ? `lead: ${name.lead(d.lead_id)}` : ''].filter(Boolean).join(', ')}
          />
        </Card>
        <Card title="Add a document">
          <DocumentForm back={back} clients={clientOptions(clients)} projects={projectOptions(projects, clients)} leads={leadOptions(leads)} />
        </Card>
      </div>
    </>
  )
}
