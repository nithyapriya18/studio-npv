import {
  addNote,
  deleteDocument,
  deleteNote,
  saveClient,
  saveDocument,
  saveLead,
  saveProject,
  saveTask,
} from '@/app/admin/actions'
import { ConfirmButton, SubmitButton } from '@/components/admin/client'
import { Card, Empty, ExternalLink, Input, Row, Select, Textarea } from '@/components/admin/ui'
import { shortDate } from '@/lib/admin/format'
import {
  DOCUMENT_KINDS,
  PROJECT_HEALTH,
  LEAD_SOURCES,
  LEAD_STAGES,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  type Client,
  type Doc,
  type Lead,
  type Note,
  type Project,
  type Task,
} from '@/lib/admin/types'

type Opt = { value: number; label: string }
const grid = 'grid gap-4 sm:grid-cols-2'

export function LeadForm({ lead }: { lead?: Lead }) {
  return (
    <form action={saveLead} className="space-y-4">
      {lead ? <input type="hidden" name="id" value={lead.id} /> : null}
      <div className={grid}>
        <Input label="Name" name="name" defaultValue={lead?.name} required placeholder="Who you spoke to" />
        <Input label="Company or school" name="company" defaultValue={lead?.company ?? ''} />
        <Input label="Email" name="email" type="email" defaultValue={lead?.email ?? ''} />
        <Input label="Phone" name="phone" type="tel" defaultValue={lead?.phone ?? ''} />
        <Select label="Where they came from" name="source" options={LEAD_SOURCES} defaultValue={lead?.source ?? 'Referral'} />
        <Select label="Stage" name="stage" options={LEAD_STAGES} defaultValue={lead?.stage ?? 'New'} />
        <Input label="Likely value (₹)" name="value" inputMode="decimal" defaultValue={lead?.value ?? ''} placeholder="65000" />
        <Input label="Follow up on" name="follow_up_on" type="date" defaultValue={lead?.follow_up_on ?? ''} />
      </div>
      <Input label="Next step" name="next_step" defaultValue={lead?.next_step ?? ''} placeholder="Send the quote deck" />
      <Textarea label="Notes" name="notes" defaultValue={lead?.notes ?? ''} rows={5} placeholder="What they need, budget, timing, who decides" />
      <SubmitButton>{lead ? 'Save lead' : 'Add lead'}</SubmitButton>
    </form>
  )
}

export function ClientForm({ client }: { client?: Client }) {
  return (
    <form action={saveClient} className="space-y-4">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <div className={grid}>
        <Input label="Client name" name="name" defaultValue={client?.name} required placeholder="Business or school name" />
        <Input label="Contact person" name="contact_name" defaultValue={client?.contact_name ?? ''} />
        <Input label="Email" name="email" type="email" defaultValue={client?.email ?? ''} />
        <Input label="Phone" name="phone" type="tel" defaultValue={client?.phone ?? ''} />
        <Input label="Website" name="website" defaultValue={client?.website ?? ''} placeholder="example.com" />
        <Input label="City" name="city" defaultValue={client?.city ?? ''} />
      </div>
      <Textarea label="Billing address (printed on invoices)" name="address" defaultValue={client?.address ?? ''} rows={3} placeholder={'Street, area\nCity, PIN\nGSTIN if they have one'} />
      <Textarea label="Notes" name="notes" defaultValue={client?.notes ?? ''} rows={4} placeholder="How they like to work, who decides, anything to remember" />
      <SubmitButton>{client ? 'Save client' : 'Add client'}</SubmitButton>
    </form>
  )
}

export function ProjectForm({ project, clients, clientId, extended = true }: { project?: Project; clients: Opt[]; clientId?: number; extended?: boolean }) {
  return (
    <form action={saveProject} className="space-y-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <div className={grid}>
        <Input label="Project name" name="name" defaultValue={project?.name} required placeholder="School website" />
        <Select label="Client" name="client_id" empty="No client" options={clients} defaultValue={String(project?.client_id ?? clientId ?? '')} />
        <Select label="Kind" name="kind" options={PROJECT_KINDS} defaultValue={project?.kind ?? 'Website'} />
        <Select label="Status" name="status" options={PROJECT_STATUSES} defaultValue={project?.status ?? 'Planning'} />
        <Input label="Price (₹)" name="price" inputMode="decimal" defaultValue={project?.price ?? ''} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start" name="start_on" type="date" defaultValue={project?.start_on ?? ''} />
          <Input label="Due" name="due_on" type="date" defaultValue={project?.due_on ?? ''} />
        </div>
        <Input label="Live link" name="live_url" defaultValue={project?.live_url ?? ''} placeholder="example.com" />
        <Input label="Code repository" name="repo_url" defaultValue={project?.repo_url ?? ''} placeholder="github.com/…" />
        {extended ? (
          <>
            <Select label="How it's going" name="health" options={PROJECT_HEALTH} defaultValue={project?.health ?? 'On track'} />
            <Input label="Hours budget" name="budget_hours" inputMode="decimal" defaultValue={project?.budget_hours ?? ''} placeholder="80" hint="The hours you priced it on. Shows when you go over." />
            <Input label="One-line summary" name="summary" defaultValue={project?.summary ?? ''} placeholder="Booking site for a tailoring studio" wrap="sm:col-span-2" />
          </>
        ) : null}
      </div>
      <Textarea label="Notes" name="notes" defaultValue={project?.notes ?? ''} rows={4} placeholder="Scope, package, what's agreed" />
      <SubmitButton>{project ? 'Save project' : 'Add project'}</SubmitButton>
    </form>
  )
}

export function TaskForm({ projects, projectId, back, task }: { projects: Opt[]; projectId?: number; back: string; task?: Task }) {
  return (
    <form action={saveTask} className="grid gap-3 sm:grid-cols-[1fr_200px_150px_90px_auto] sm:items-end">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}
      <input type="hidden" name="back" value={back} />
      <Input label="Task" name="title" required defaultValue={task?.title} placeholder="Write the home page copy" />
      {projectId ? (
        <input type="hidden" name="project_id" value={projectId} />
      ) : (
        <Select label="Project" name="project_id" empty="No project" options={projects} defaultValue={String(task?.project_id ?? '')} />
      )}
      <Input label="Due" name="due_on" type="date" defaultValue={task?.due_on ?? ''} />
      <Input label="Hours" name="hours" inputMode="decimal" defaultValue={task?.hours ?? ''} placeholder="0" />
      <input type="hidden" name="status" value={task?.status ?? 'To do'} />
      <SubmitButton>{task ? 'Save' : 'Add task'}</SubmitButton>
    </form>
  )
}

export function DocumentForm({
  back,
  clients,
  projects,
  leads,
  fixed,
}: {
  back: string
  clients: Opt[]
  projects: Opt[]
  leads: Opt[]
  fixed?: { client_id?: number; project_id?: number; lead_id?: number }
}) {
  return (
    <form action={saveDocument} className="space-y-3">
      <input type="hidden" name="back" value={back} />
      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <Input label="Title" name="title" required placeholder="Website quote deck" />
        <Select label="Kind" name="kind" options={DOCUMENT_KINDS} defaultValue="Deck" />
      </div>
      <Input label="Link" name="url" required placeholder="https://claude.ai/artifact/… or a Drive link" />
      <div className="grid gap-3 sm:grid-cols-3">
        {fixed?.client_id ? (
          <input type="hidden" name="client_id" value={fixed.client_id} />
        ) : (
          <Select label="Client" name="client_id" empty="None" options={clients} />
        )}
        {fixed?.project_id ? (
          <input type="hidden" name="project_id" value={fixed.project_id} />
        ) : (
          <Select label="Project" name="project_id" empty="None" options={projects} />
        )}
        {fixed?.lead_id ? (
          <input type="hidden" name="lead_id" value={fixed.lead_id} />
        ) : (
          <Select label="Lead" name="lead_id" empty="None" options={leads} />
        )}
      </div>
      <SubmitButton>Add document</SubmitButton>
    </form>
  )
}

export function DocumentList({ docs, back, describe }: { docs: Doc[]; back: string; describe?: (d: Doc) => string }) {
  if (!docs.length) return <Empty>No documents yet.</Empty>
  return (
    <div>
      {docs.map((d) => (
        <Row
          key={d.id}
          title={<ExternalLink href={d.url}>{d.title}</ExternalLink>}
          meta={[d.kind, describe?.(d), shortDate(d.created_at)].filter(Boolean).join(' · ')}
          right={
            <form action={deleteDocument}>
              <input type="hidden" name="id" value={d.id} />
              <input type="hidden" name="back" value={back} />
              <ConfirmButton message={`Remove "${d.title}" from the list? The document itself is not deleted.`} className="text-[13px] text-text-muted hover:text-text-primary">
                Remove
              </ConfirmButton>
            </form>
          }
        />
      ))}
    </div>
  )
}

export function NotesPanel({
  notes,
  back,
  target,
}: {
  notes: Note[]
  back: string
  target: { lead_id?: number; client_id?: number; project_id?: number }
}) {
  const sorted = [...notes].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (
    <Card title="Log">
      <form action={addNote} className="mb-4 space-y-2">
        <input type="hidden" name="back" value={back} />
        {Object.entries(target).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <Textarea label="Add a note" name="body" rows={3} required placeholder="Had a call. They want it live before the new term." />
        <SubmitButton>Add note</SubmitButton>
      </form>
      {sorted.length ? (
        <ol className="space-y-3">
          {sorted.map((n) => (
            <li key={n.id} className="border-l-2 border-accent/40 pl-3">
              <div className="flex items-center justify-between gap-2 text-[12px] text-text-muted">
                <span>
                  {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(n.created_at))}
                </span>
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="back" value={back} />
                  <ConfirmButton message="Delete this note?" className="hover:text-text-primary">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-[14px] text-text-primary">{n.body}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  )
}
