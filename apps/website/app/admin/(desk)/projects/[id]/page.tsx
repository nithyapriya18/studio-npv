import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clientOptions, loadAll } from '@/lib/admin/data'
import { listRows } from '@/lib/admin/store'
import { inr, invoiceTotals, isOverdue, shortDate } from '@/lib/admin/format'
import { deleteProject } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { DocumentForm, DocumentList, NotesPanel, ProjectForm, TaskForm } from '@/components/admin/forms'
import { TaskList } from '@/components/admin/tasks'
import { Badge, Card, Empty, ExternalLink, PageHeader, Row } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Project' }

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const all = await loadAll()
  const project = all.projects.find((p) => p.id === Number(id))
  if (!project) notFound()
  const back = `/admin/projects/${project.id}`
  const client = all.clients.find((c) => c.id === project.client_id)
  const tasks = all.tasks.filter((k) => k.project_id === project.id)
  const invoices = all.invoices.filter((i) => i.project_id === project.id)
  const docs = all.documents.filter((d) => d.project_id === project.id)
  const notes = await listRows('admin_notes', { eq: { project_id: project.id } })
  const hours = tasks.reduce((s, k) => s + (Number(k.hours) || 0), 0)
  const billed = invoices.filter((i) => i.status !== 'Cancelled' && i.status !== 'Draft').reduce((s, i) => s + invoiceTotals(i).total, 0)

  return (
    <>
      <PageHeader
        title={project.name}
        sub={
          <>
            <Badge>{project.status}</Badge>{' '}
            <span className="ml-1">
              {client ? <Link href={`/admin/clients/${client.id}`} className="text-accent">{client.name}</Link> : 'No client'}
              {' · '}
              {project.kind}
              {project.price ? ` · ${inr(Number(project.price))}` : ''}
              {billed ? ` · billed ${inr(billed)}` : ''}
              {hours ? ` · ${hours} h logged` : ''}
            </span>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            {project.live_url ? <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn-quiet btn-sm">Open live</a> : null}
            <Link href={`/admin/invoices/new?client=${project.client_id ?? ''}&project=${project.id}`} className="btn-primary btn-sm">New invoice</Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card title="Tasks">
            <TaskList tasks={tasks} back={back} />
            <div className="mt-4 border-t border-border pt-4">
              <TaskForm projects={[]} projectId={project.id} back={back} />
            </div>
          </Card>

          <Card title="Decks and documents">
            <DocumentList docs={docs} back={back} />
            <details className="mt-4">
              <summary className="cursor-pointer text-[14px] text-accent">Add a document</summary>
              <div className="mt-3">
                <DocumentForm back={back} clients={[]} projects={[]} leads={[]} fixed={{ project_id: project.id, client_id: project.client_id ?? undefined }} />
              </div>
            </details>
          </Card>

          <Card title="Invoices">
            {invoices.length ? (
              invoices.map((i) => (
                <Row key={i.id} href={`/admin/invoices/${i.id}`} title={i.number} meta={shortDate(i.issue_date)} right={<><span className="tabular-nums">{inr(invoiceTotals(i).total)}</span><Badge>{isOverdue(i) ? 'Overdue' : i.status}</Badge></>} />
              ))
            ) : (
              <Empty>No invoices for this project.</Empty>
            )}
          </Card>

          <Card title="Details">
            <ProjectForm key={JSON.stringify(project)} project={project} clients={clientOptions(all.clients)} />
          </Card>
        </div>
        <div className="space-y-4">
          {project.repo_url || project.live_url ? (
            <Card title="Links">
              <ul className="space-y-1 text-[14px]">
                {project.live_url ? <li><ExternalLink href={project.live_url}>{project.live_url.replace(/^https?:\/\//, '')}</ExternalLink></li> : null}
                {project.repo_url ? <li><ExternalLink href={project.repo_url}>{project.repo_url.replace(/^https?:\/\//, '')}</ExternalLink></li> : null}
              </ul>
            </Card>
          ) : null}
          <NotesPanel notes={notes} back={back} target={{ project_id: project.id }} />
          <form action={deleteProject} className="text-right">
            <input type="hidden" name="id" value={project.id} />
            <ConfirmButton message="Delete this project and its notes? Tasks, documents and invoices stay, unlinked.">Delete project</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  )
}
