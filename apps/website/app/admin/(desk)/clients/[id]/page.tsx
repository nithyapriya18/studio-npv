import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadAll, projectOptions } from '@/lib/admin/data'
import { invoiceTotals, isOverdue, today } from '@/lib/admin/format'
import { activity, daysBetween, dm, fmtInr, hoursFor, money, projectMilestones, weeklyHours, wdm, inWords } from '@/lib/admin/insights'
import { deleteClient } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { ClientForm, DocumentForm, NotesPanel } from '@/components/admin/forms'
import { DocGroups } from '@/components/admin/docs'
import { Icon } from '@/components/admin/icons'
import { Card, Empty, ErrorNote, MoreLink, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Client' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function ClientPage({ params, searchParams }: Props) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  const data = await loadAll()
  const client = data.clients.find((c) => c.id === Number(id))
  if (!client) notFound()
  const t = today()
  const back = `/admin/clients/${client.id}`
  const projects = data.projects.filter((p) => p.client_id === client.id)
  const pids = projects.map((p) => p.id)
  const invoices = data.invoices.filter((i) => i.client_id === client.id)
  const docs = data.documents.filter((d) => d.client_id === client.id || (d.project_id && pids.includes(d.project_id)))
  const notes = data.notes.filter((n) => n.client_id === client.id)
  const m = money(data, client.id)

  const price = projects.reduce((s, p) => s + (Number(p.price) || 0), 0)
  const hours = projects.reduce((s, p) => s + hoursFor(data, p.id), 0)
  const budget = projects.reduce((s, p) => s + (Number(p.budget_hours) || 0), 0)
  const lateInv = invoices.filter(isOverdue)
  const weekly = weeklyHours(data, pids)
  const feed = activity(data, client.id)
  const latestNote = [...notes].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const firstName = client.contact_name?.split(' ')[0]
  const ms = projects.flatMap((p) => projectMilestones(data, p.id).list.map((x) => ({ ...x, project: p })))
  const nextIds = new Set(projects.map((p) => projectMilestones(data, p.id).next?.id).filter(Boolean))

  return (
    <>
      <nav className="a-crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Today</Link> / <Link href="/admin/clients">Clients</Link> / <span>{client.name}</span>
      </nav>
      <ErrorNote message={error} />

      <div className="a-client-head">
        <div>
          <h1>{client.name}</h1>
          <p className="a-client-sub">
            {[projects.map((p) => p.name).join(', ') || 'No projects yet', client.contact_name, client.city].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="a-head-actions">
          {client.email ? (
            <a className="a-btn a-btn-quiet" href={`mailto:${client.email}`}><Icon name="mail" small />Email{firstName ? ` ${firstName}` : ''}</a>
          ) : null}
          {client.phone ? (
            <a className="a-btn a-btn-quiet" href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><Icon name="phone" small />WhatsApp</a>
          ) : null}
          <Link className="a-btn a-btn-quiet" href={`/admin/projects/new?client=${client.id}`}><Icon name="plus" small />Project</Link>
          <Link className="a-btn a-btn-primary" href={`/admin/invoices/new?client=${client.id}`}><Icon name="plus" small />New invoice</Link>
        </div>
      </div>

      <div className="a-facts">
        <div className="a-fact">
          <span className="a-tile-label">Agreed price</span>
          <span className="a-tile-value a-num">{price ? fmtInr(price) : '—'}</span>
          <span className="a-tile-note">{projects.length} project{projects.length === 1 ? '' : 's'}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Paid</span>
          <span className="a-tile-value a-num">{fmtInr(m.paidAll)}</span>
          <span className="a-tile-note">{price ? `${Math.round((m.paidAll / price) * 100)}% of the price` : `${invoices.filter((i) => i.status === 'Paid').length} invoices paid`}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Overdue</span>
          <span className={`a-tile-value a-num${m.overdue ? ' a-hot' : ''}`}>{fmtInr(m.overdue)}</span>
          <span className="a-tile-note">{lateInv[0]?.due_date ? `${lateInv[0].number} · ${daysBetween(lateInv[0].due_date, t)} days late` : 'Nothing late'}</span>
        </div>
        <div className="a-fact">
          <span className="a-tile-label">Hours</span>
          <span className="a-tile-value a-num">{budget ? `${Math.round(hours * 10) / 10} / ${budget} h` : `${Math.round(hours * 10) / 10} h`}</span>
          <span className="a-tile-note">{budget ? (hours > budget ? `${Math.round((hours - budget) * 10) / 10} h past budget` : `${Math.round((budget - hours) * 10) / 10} h left`) : 'No budget set'}</span>
        </div>
      </div>

      <div className="a-grid">
        <Card title="Milestones and payments" className="a-s7">
          {ms.length ? (
            <ol className="a-steps">
              {ms.map((x, i) => {
                const inv = x.invoice_id ? invoices.find((v) => v.id === x.invoice_id) : undefined
                const state = x.done_on ? 'a-done' : nextIds.has(x.id) ? 'a-next' : ''
                return (
                  <li key={x.id} className={`a-step ${state}`}>
                    <span className="a-dotm">{x.done_on ? '✓' : i + 1}</span>
                    <div className="a-step-body">
                      <Link href={`/admin/projects/${x.project.id}`} className="a-step-title">{x.title}</Link>
                      <span className="a-step-pay">
                        {[projects.length > 1 ? x.project.name : null, x.due_on ? (x.done_on ? dm(x.done_on) : `${wdm(x.due_on)} · ${inWords(daysBetween(t, x.due_on))}`) : 'No date yet', x.amount ? fmtInr(Number(x.amount)) : null]
                          .filter(Boolean)
                          .join(' · ')}
                        {inv ? (
                          inv.status === 'Paid' ? (
                            <Tag tone="ok">{`Paid ${inv.paid_on ? dm(inv.paid_on) : ''}`}</Tag>
                          ) : isOverdue(inv) ? (
                            <Tag tone="bad">{`${inv.number} · ${daysBetween(inv.due_date!, t)} days late`}</Tag>
                          ) : (
                            <Tag tone="ok">{`${inv.number} · ${inv.status}`}</Tag>
                          )
                        ) : x.amount ? (
                          <Tag tone="line">Not invoiced</Tag>
                        ) : null}
                      </span>
                    </div>
                    {nextIds.has(x.id) && !x.done_on ? <Tag tone="warn">Next</Tag> : <span />}
                  </li>
                )
              })}
            </ol>
          ) : (
            <Empty>No milestones yet. Open a project to add them, with the payment due at each one.</Empty>
          )}
          {lateInv.length ? (
            <p className="a-insight"><Icon name="alert" />{lateInv.map((i) => `${i.number} (${fmtInr(invoiceTotals(i).total)})`).join(', ')} {lateInv.length === 1 ? 'is' : 'are'} overdue. Use “Email” above to send a reminder.</p>
          ) : null}
        </Card>

        <Card title="Hours" className="a-s5" action={<MoreLink href="/admin/time">Timesheet</MoreLink>}>
          <p className="a-muted">
            <b className={budget && hours > budget ? 'a-over-text' : undefined}>{Math.round(hours * 10) / 10} h</b> logged{budget ? ` of a ${budget} h budget` : ''}
          </p>
          {budget ? (
            <span className={`a-meter${hours > budget ? ' a-over' : ''}`}><i style={{ width: `${Math.min(100, (hours / budget) * 100)}%` }} /></span>
          ) : null}
          <div className="a-days a-w5" role="img" aria-label={weekly.weeks.map((w) => `week of ${w.label}: ${w.h} hours`).join(', ')}>
            {weekly.weeks.map((w) => (
              <div key={w.label} className={`a-day${w.now ? ' a-now' : ''}`}>
                <em>{w.h}</em>
                <i style={{ height: `${Math.max(3, (w.h / weekly.max) * 90)}px` }} />
                <span>{w.label}</span>
              </div>
            ))}
          </div>
          {budget && price && hours > budget ? (
            <p className="a-insight"><Icon name="alert" />Your rate here is {fmtInr(price / hours)}/h so far, down from the {fmtInr(price / budget)}/h you priced it at.</p>
          ) : null}
          {latestNote ? (
            <div className="a-note">
              <span className="a-eyebrow">Your note · {dm(latestNote.created_at)}</span>
              <span>{latestNote.body}</span>
            </div>
          ) : null}
        </Card>

        <Card title="Projects" className="a-s7">
          {projects.length ? (
            projects.map((p) => {
              const { next } = projectMilestones(data, p.id)
              return (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="a-row">
                  <span className="a-row-main">
                    <span className="a-row-title">{p.name}</span>
                    <span className="a-row-meta">{next ? `Next: ${next.title}${next.due_on ? `, ${wdm(next.due_on)}` : ''}` : p.kind}</span>
                  </span>
                  <span className="a-row-right"><Tag>{p.status}</Tag></span>
                </Link>
              )
            })
          ) : (
            <Empty>No projects yet.</Empty>
          )}
        </Card>

        <Card title="Activity" className="a-s5">
          {feed.length ? (
            <ul className="a-feed">
              {feed.map((f, i) => (
                <li key={i}><time>{dm(f.date)}</time><span>{f.text}</span></li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing yet.</Empty>
          )}
        </Card>

        <Card title="Documents and decks" sub={`${docs.length} file${docs.length === 1 ? '' : 's'}`} className="a-s12">
          <DocGroups docs={docs} back={back} />
          <details className="a-details">
            <summary>Add a document</summary>
            <DocumentForm back={back} clients={[]} projects={projectOptions(projects, data.clients)} leads={[]} fixed={{ client_id: client.id }} />
          </details>
        </Card>

        <Card title="Invoices" className="a-s7">
          {invoices.length ? (
            invoices.map((i) => (
              <Link key={i.id} href={`/admin/invoices/${i.id}`} className="a-row">
                <span className="a-row-main">
                  <span className="a-row-title">{i.number}</span>
                  <span className="a-row-meta">{dm(i.issue_date)}{i.project_id ? ` · ${data.projects.find((p) => p.id === i.project_id)?.name ?? ''}` : ''}</span>
                </span>
                <span className="a-row-right"><span className="a-num">{fmtInr(invoiceTotals(i).total)}</span><Tag>{isOverdue(i) ? 'Overdue' : i.status}</Tag></span>
              </Link>
            ))
          ) : (
            <Empty>No invoices yet.</Empty>
          )}
        </Card>

        <div className="a-s5">
          <NotesPanel notes={notes} back={back} target={{ client_id: client.id }} />
        </div>

        <Card title="Details" className="a-s12">
          <details className="a-details">
            <summary>Edit contact and billing details</summary>
            <ClientForm key={JSON.stringify(client)} client={client} />
          </details>
          <form action={deleteClient}>
            <input type="hidden" name="id" value={client.id} />
            <ConfirmButton message="Delete this client and their notes? Projects and documents stay, without a client." className="a-linkbtn">
              Delete client
            </ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  )
}
