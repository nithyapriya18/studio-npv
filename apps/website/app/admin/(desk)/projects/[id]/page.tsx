import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clientOptions, loadAll } from '@/lib/admin/data'
import { invoiceTotals, isOverdue, today } from '@/lib/admin/format'
import { daysBetween, dm, fmtH, fmtInr, healthTone, hoursFor, inWords, projectMilestones, wdm, weeklyHours } from '@/lib/admin/insights'
import { checkItem, deleteMilestone, deleteProject, logTime, saveMilestone } from '@/app/admin/actions'
import { ConfirmButton, SubmitButton } from '@/components/admin/client'
import { CheckSubmit } from '@/components/admin/shell'
import { DocumentForm, NotesPanel, ProjectForm, TaskForm } from '@/components/admin/forms'
import { DocGroups } from '@/components/admin/docs'
import { TaskList } from '@/components/admin/tasks'
import { Icon } from '@/components/admin/icons'
import { Card, Empty, Input, MoreLink, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Project' }

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadAll()
  const project = data.projects.find((p) => p.id === Number(id))
  if (!project) notFound()
  const t = today()
  const back = `/admin/projects/${project.id}`
  const client = data.clients.find((c) => c.id === project.client_id)
  const tasks = data.tasks.filter((k) => k.project_id === project.id)
  const invoices = data.invoices.filter((i) => i.project_id === project.id)
  const docs = data.documents.filter((d) => d.project_id === project.id)
  const notes = data.notes.filter((n) => n.project_id === project.id)
  const entries = data.time.filter((e) => e.project_id === project.id).slice(0, 8)
  const { list: milestones, next } = projectMilestones(data, project.id)
  const hours = hoursFor(data, project.id)
  const budget = project.budget_hours ? Number(project.budget_hours) : null
  const price = Number(project.price) || 0
  const billed = invoices.filter((i) => i.status === 'Sent' || i.status === 'Paid').reduce((s, i) => s + invoiceTotals(i).total, 0)
  const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + invoiceTotals(i).total, 0)
  const weekly = weeklyHours(data, [project.id])
  const extended = 'health' in project
  const late = Boolean(next?.due_on && next.due_on < t)

  return (
    <>
      <nav className="a-crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Today</Link> / <Link href="/admin/projects">Projects</Link> / <span>{project.name}</span>
      </nav>

      <div className="a-client-head">
        <div>
          <h1>{project.name}</h1>
          <p className="a-client-sub">
            <Tag tone={late ? 'bad' : healthTone(project.health)}>{late ? 'Late' : project.health || 'On track'}</Tag>
            <Tag>{project.status}</Tag>
            {client ? <Link href={`/admin/clients/${client.id}`}>{client.name}</Link> : 'No client'}
            <span>· {project.summary || project.kind}</span>
          </p>
        </div>
        <div className="a-head-actions">
          {project.live_url ? <a className="a-btn a-btn-quiet" href={project.live_url} target="_blank" rel="noopener noreferrer"><Icon name="external" small />Open live</a> : null}
          <Link className="a-btn a-btn-primary" href={`/admin/invoices/new?client=${project.client_id ?? ''}&project=${project.id}`}><Icon name="plus" small />New invoice</Link>
        </div>
      </div>

      <div className="a-facts">
        <div className="a-fact">
          <span className="a-tile-label">Price</span>
          <span className="a-tile-value a-num">{price ? fmtInr(price) : '—'}</span>
          <span className="a-tile-note">{project.start_on ? `Started ${dm(project.start_on)}` : 'No start date'}{project.due_on ? ` · due ${dm(project.due_on)}` : ''}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Billed</span>
          <span className="a-tile-value a-num">{fmtInr(billed)}</span>
          <span className="a-tile-note">{fmtInr(paid)} paid{price ? ` · ${fmtInr(Math.max(0, price - billed))} still to bill` : ''}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Next milestone</span>
          <span className={`a-tile-value${late ? ' a-hot' : ''}`}>{next?.due_on ? wdm(next.due_on) : next ? 'No date' : 'None'}</span>
          <span className="a-tile-note">{next ? `${next.title}${next.due_on ? ` · ${inWords(daysBetween(t, next.due_on))}` : ''}` : 'Add one below'}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Hours</span>
          <span className="a-tile-value a-num">{budget ? `${hours} / ${budget} h` : fmtH(hours)}</span>
          <span className="a-tile-note">{budget ? (hours > budget ? `${Math.round((hours - budget) * 10) / 10} h past budget` : `${Math.round((budget - hours) * 10) / 10} h left`) : 'No budget set'}</span>
        </div>
      </div>

      <div className="a-grid">
        <Card title="Milestones and payments" className="a-s7">
          {milestones.length ? (
            <ol className="a-steps">
              {milestones.map((m, i) => {
                const inv = m.invoice_id ? invoices.find((v) => v.id === m.invoice_id) : undefined
                const isNext = m.id === next?.id
                return (
                  <li key={m.id} className={`a-step${m.done_on ? ' a-done' : isNext ? ' a-next' : ''}`}>
                    <form action={checkItem} className="a-dotm-form">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="kind" value="milestone" />
                      <input type="hidden" name="checked" value={m.done_on ? '0' : '1'} />
                      <input type="hidden" name="back" value={back} />
                      <span className="a-dotm">{m.done_on ? '✓' : i + 1}</span>
                      <CheckSubmit id={`ms-${m.id}`} checked={Boolean(m.done_on)} label={m.done_on ? `Mark ${m.title} not done` : `Mark ${m.title} done`} />
                    </form>
                    <div className="a-step-body">
                      <span className="a-step-title">{m.title}</span>
                      <span className="a-step-pay">
                        {m.done_on ? `Done ${dm(m.done_on)}` : m.due_on ? `${wdm(m.due_on)} · ${inWords(daysBetween(t, m.due_on))}` : 'No date yet'}
                        {m.amount ? ` · ${fmtInr(Number(m.amount))}` : ''}
                        {inv ? (
                          <Link href={`/admin/invoices/${inv.id}`}>
                            <Tag tone={inv.status === 'Paid' ? 'ok' : isOverdue(inv) ? 'bad' : 'ok'}>{inv.status === 'Paid' ? `Paid ${inv.paid_on ? dm(inv.paid_on) : ''}` : `${inv.number} · ${isOverdue(inv) ? 'overdue' : inv.status.toLowerCase()}`}</Tag>
                          </Link>
                        ) : m.amount ? (
                          <Link href={`/admin/invoices/new?client=${project.client_id ?? ''}&project=${project.id}&milestone=${m.id}`} className="a-tag a-tag-line">Create invoice</Link>
                        ) : null}
                      </span>
                      <details className="a-details">
                        <summary>Edit</summary>
                        <form action={saveMilestone} className="a-ms-form">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="project_id" value={project.id} />
                          <input type="hidden" name="back" value={back} />
                          <Input label="Milestone" name="title" defaultValue={m.title} required />
                          <Input label="Due" name="due_on" type="date" defaultValue={m.due_on ?? ''} />
                          <Input label="Payment (₹)" name="amount" inputMode="decimal" defaultValue={m.amount ?? ''} />
                          <SubmitButton>Save</SubmitButton>
                        </form>
                        <form action={deleteMilestone}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="back" value={back} />
                          <ConfirmButton message={`Delete the milestone "${m.title}"?`} className="a-linkbtn">Delete milestone</ConfirmButton>
                        </form>
                      </details>
                    </div>
                    {isNext && !m.done_on ? <Tag tone={late ? 'bad' : 'warn'}>{late ? 'Late' : 'Next'}</Tag> : <span />}
                  </li>
                )
              })}
            </ol>
          ) : (
            <Empty>No milestones yet. Add the steps to the finish line, with the payment due at each.</Empty>
          )}
          <form action={saveMilestone} className="a-ms-form">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="back" value={back} />
            <Input label="Add a milestone" name="title" required placeholder="Design sign-off" />
            <Input label="Due" name="due_on" type="date" />
            <Input label="Payment (₹)" name="amount" inputMode="decimal" placeholder="Optional" />
            <SubmitButton>Add</SubmitButton>
          </form>
        </Card>

        <Card title="Hours" className="a-s5" action={<MoreLink href="/admin/time">Timesheet</MoreLink>}>
          {budget ? (
            <>
              <p className="a-muted"><b className={hours > budget ? 'a-over-text' : undefined}>{hours} h</b> logged of a {budget} h budget</p>
              <span className={`a-meter${hours > budget ? ' a-over' : ''}`}><i style={{ width: `${Math.min(100, (hours / budget) * 100)}%` }} /></span>
            </>
          ) : (
            <p className="a-muted"><b>{hours} h</b> logged. Set an hours budget under Details to track it.</p>
          )}
          <div className="a-days a-w5" role="img" aria-label={weekly.weeks.map((w) => `week of ${w.label}: ${w.h} hours`).join(', ')}>
            {weekly.weeks.map((w) => (
              <div key={w.label} className={`a-day${w.now ? ' a-now' : ''}`}>
                <em>{w.h}</em>
                <i style={{ height: `${Math.max(3, (w.h / weekly.max) * 80)}px` }} />
                <span>{w.label}</span>
              </div>
            ))}
          </div>
          {budget && price && hours > budget ? (
            <p className="a-insight"><Icon name="alert" />Your rate here is {fmtInr(price / hours)}/h so far, down from the {fmtInr(price / budget)}/h you priced it at.</p>
          ) : null}
          <form action={logTime} className="a-inline">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="back" value={back} />
            <Input label="Hours" name="hours" inputMode="decimal" required placeholder="1.5" />
            <Input label="Date" name="on_date" type="date" defaultValue={t} />
            <SubmitButton>Log time</SubmitButton>
          </form>
          {entries.length ? (
            <ul className="a-feed">
              {entries.map((e) => (
                <li key={e.id}><time>{dm(e.on_date)}</time><span>{e.hours} h{e.note ? ` · ${e.note}` : ''}</span></li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card title="Tasks" className="a-s7">
          <TaskList tasks={tasks} back={back} />
          <TaskForm projects={[]} projectId={project.id} back={back} />
        </Card>

        <div className="a-s5">
          <NotesPanel notes={notes} back={back} target={{ project_id: project.id }} />
        </div>

        <Card title="Documents and decks" sub={`${docs.length} file${docs.length === 1 ? '' : 's'}`} className="a-s12">
          <DocGroups docs={docs} back={back} />
          <details className="a-details">
            <summary>Add a document</summary>
            <DocumentForm back={back} clients={[]} projects={[]} leads={[]} fixed={{ project_id: project.id, client_id: project.client_id ?? undefined }} />
          </details>
        </Card>

        <Card title="Invoices" className="a-s7">
          {invoices.length ? (
            invoices.map((i) => (
              <Link key={i.id} href={`/admin/invoices/${i.id}`} className="a-row">
                <span className="a-row-main">
                  <span className="a-row-title">{i.number}</span>
                  <span className="a-row-meta">{dm(i.issue_date)}</span>
                </span>
                <span className="a-row-right"><span className="a-num">{fmtInr(invoiceTotals(i).total)}</span><Tag>{isOverdue(i) ? 'Overdue' : i.status}</Tag></span>
              </Link>
            ))
          ) : (
            <Empty>No invoices for this project yet.</Empty>
          )}
        </Card>

        <Card title="Links" className="a-s5">
          {project.live_url || project.repo_url ? (
            <ul className="a-feed">
              {project.live_url ? <li><time>Live</time><a href={project.live_url} target="_blank" rel="noopener noreferrer">{project.live_url.replace(/^https?:\/\//, '')}</a></li> : null}
              {project.repo_url ? <li><time>Code</time><a href={project.repo_url} target="_blank" rel="noopener noreferrer">{project.repo_url.replace(/^https?:\/\//, '')}</a></li> : null}
            </ul>
          ) : (
            <Empty>No links yet.</Empty>
          )}
        </Card>

        <Card title="Details" className="a-s12">
          <details className="a-details">
            <summary>Edit project details, status and budget</summary>
            <ProjectForm key={JSON.stringify(project)} project={project} clients={clientOptions(data.clients)} extended={extended} />
          </details>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={project.id} />
            <ConfirmButton message="Delete this project, its milestones and notes? Tasks, documents and invoices stay, unlinked." className="a-linkbtn">
              Delete project
            </ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  )
}
