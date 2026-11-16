import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll } from '@/lib/admin/data'
import { today } from '@/lib/admin/format'
import {
  chase,
  dm,
  fmtH,
  fmtInr,
  heroSummary,
  laterThisWeek,
  money,
  projectRows,
  timeSummary,
  timelineTicks,
  todayItems,
  wdm,
  type TodayItem,
} from '@/lib/admin/insights'
import { checkItem } from '@/app/admin/actions'
import { CheckSubmit } from '@/components/admin/shell'
import { Icon } from '@/components/admin/icons'
import { Empty, MoreLink, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Today' }

const longDate = () =>
  new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(new Date())

export default async function TodayPage() {
  const data = await loadAll()
  const hero = heroSummary(data)
  const items = todayItems(data)
  const soon = laterThisWeek(data)
  const m = money(data)
  const rows = projectRows(data)
  const ticks = timelineTicks()
  const who = chase(data)
  const time = timeSummary(data)
  const firstLate = m.overdueInvoices[0]
  const lateDays = firstLate?.due_date ? Math.round((Date.parse(today()) - Date.parse(firstLate.due_date)) / 86400000) : 0
  const pct = (n: number) => (m.total ? `${(n / m.total) * 100}%` : '0%')

  return (
    <>
      {/* Hero */}
      <section className="a-hero" aria-labelledby="hero-h">
        <p className="a-hero-date">{longDate()}</p>
        <h1 id="hero-h">
          {hero.count ? (
            <>
              <span className="a-circled">
                {hero.count} thing{hero.count === 1 ? '' : 's'}
                <svg className="a-pen" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M14 46C10 20 66 6 118 8c52 2 78 18 72 40-6 22-70 30-118 26C30 70 6 58 14 34c6-14 26-20 44-22" />
                </svg>
              </span>{' '}
              need{hero.count === 1 ? 's' : ''} you today.
            </>
          ) : (
            'Nothing needs you today.'
          )}
        </h1>
        <p className="a-hero-sub">
          {hero.parts.map((p, i) => (p.b ? <b key={i}>{p.b}</b> : <span key={i}>{p.t}</span>))}
        </p>
        <div className="a-pulse">
          <Link className="a-tile" href="/admin/invoices">
            <span className="a-tile-label">{m.by ? `Coming in by ${dm(m.by)}` : 'Coming in'}</span>
            <span className="a-tile-value a-num">{fmtInr(m.total)}</span>
            <span className="a-tile-note">
              {m.payments ? `${m.payments} payment${m.payments === 1 ? '' : 's'}, ${m.stillToInvoice} still to invoice` : 'Nothing invoiced or due yet'}
            </span>
          </Link>
          <Link className="a-tile" href="/admin/invoices?status=Overdue">
            <span className="a-tile-label">Overdue</span>
            <span className={`a-tile-value a-num${m.overdue ? ' a-hot' : ''}`}>{fmtInr(m.overdue)}</span>
            <span className="a-tile-note">{firstLate ? `${firstLate.number} · ${lateDays} days late` : 'Nothing late'}</span>
          </Link>
          <Link className="a-tile" href={hero.next ? `/admin/projects/${hero.next.project.id}` : '/admin/projects'}>
            <span className="a-tile-label">Next milestone</span>
            <span className="a-tile-value">{hero.next?.next?.due_on ? wdm(hero.next.next.due_on) : 'None set'}</span>
            <span className="a-tile-note">
              {hero.next?.next ? `${hero.next.project.name} · ${hero.next.next.title}` : 'Add milestones to your projects'}
            </span>
          </Link>
          <Link className="a-tile" href="/admin/time">
            <span className="a-tile-label">Logged, last 7 days</span>
            <span className="a-tile-value a-num">{fmtH(time.total)}</span>
            <span className="a-tile-note">{time.warnings.length ? `${time.warnings.length} project over budget` : `${time.split.length} project${time.split.length === 1 ? '' : 's'}`}</span>
          </Link>
        </div>
      </section>

      <div className="a-grid">
        {/* Today */}
        <section className="a-card a-s7" aria-labelledby="today-h">
          <div className="a-card-head">
            <div className="a-card-title">
              <h2 id="today-h">Today</h2>
              <span className="a-eyebrow">
                {items.open.length} open · {items.done.length} done
              </span>
            </div>
            <MoreLink href="/admin/work">All tasks</MoreLink>
          </div>
          {items.open.length || items.done.length ? (
            <ul className="a-tasks">
              {[...items.open, ...items.done].map((it) => (
                <TodayRow key={it.key} item={it} />
              ))}
            </ul>
          ) : (
            <Empty>Nothing due today. Add tasks, follow-up dates or milestones and they&apos;ll show up here.</Empty>
          )}
          {soon.length ? (
            <div className="a-soon">
              <span className="a-eyebrow">Later this week</span>
              {soon.map((s) => (
                <div key={s.day} className="a-soon-row">
                  <span className="a-soon-day">{s.label}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Money */}
        <section className="a-card a-s5" aria-labelledby="money-h">
          <div className="a-card-head">
            <h2 id="money-h">Money</h2>
            <MoreLink href="/admin/invoices">Invoices</MoreLink>
          </div>
          <div className="a-money-total">
            <span className="a-eyebrow">{m.by ? `Coming in by ${dm(m.by)}` : 'Coming in'}</span>
            <span className="a-big a-num">{fmtInr(m.total)}</span>
          </div>
          {m.total ? (
            <>
              <div className="a-stack" role="img" aria-label={`${fmtInr(m.overdue)} overdue, ${fmtInr(m.invoiced)} invoiced, ${fmtInr(m.toInvoice)} still to invoice`}>
                {m.overdue ? <span style={{ width: pct(m.overdue), background: 'var(--seg-bad)' }} /> : null}
                {m.invoiced ? <span style={{ width: pct(m.invoiced), background: 'var(--seg-sent)' }} /> : null}
                {m.toInvoice ? <span style={{ width: pct(m.toInvoice), background: 'var(--seg-plan)' }} /> : null}
              </div>
              <div className="a-legend">
                <div><span className="a-key"><i style={{ background: 'var(--seg-bad)' }} />Overdue</span><b className="a-num">{fmtInr(m.overdue)}</b></div>
                <div><span className="a-key"><i style={{ background: 'var(--seg-sent)' }} />Invoiced</span><b className="a-num">{fmtInr(m.invoiced)}</b></div>
                <div><span className="a-key"><i style={{ background: 'var(--seg-plan)' }} />To invoice</span><b className="a-num">{fmtInr(m.toInvoice)}</b></div>
              </div>
              <div className="a-ledger">
                {m.rows.map((r) => (
                  <Link key={r.key} href={r.href} className="a-lrow">
                    <span className="a-ldate">{dm(r.date)}<span>{r.dateNote}</span></span>
                    <span className="a-lwho"><b>{r.who}</b><span>{r.what}</span></span>
                    <span className="a-lamt a-num">{fmtInr(r.amount)}<Tag tone={r.tag.tone}>{r.tag.text}</Tag></span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <Empty>No money due yet. Put payment amounts on project milestones, or send an invoice.</Empty>
          )}
          <div className="a-card-foot">
            <span><span className="a-muted">Collected this month</span> <b className="a-num">{fmtInr(m.collectedThisMonth)}</b></span>
            <Link href="/admin/invoices/new" className="a-btn a-btn-quiet a-btn-sm">New invoice</Link>
          </div>
        </section>

        {/* Projects */}
        <section className="a-card a-s12" aria-labelledby="proj-h">
          <div className="a-card-head">
            <div className="a-card-title">
              <h2 id="proj-h">Projects</h2>
              <span className="a-eyebrow">Next milestone on each, soonest first</span>
            </div>
            <MoreLink href="/admin/projects">All projects</MoreLink>
          </div>
          {rows.length ? (
            <div className="a-ptable">
              <div className="a-prow a-head" aria-hidden="true">
                <span>Project</span>
                <span>Status</span>
                <span>Next milestone</span>
                <span className="a-axis">
                  {ticks.map((t) => (
                    <span key={t.iso} className={t.now ? 'a-now' : undefined} style={{ left: `${t.pct}%` }}>{t.label}</span>
                  ))}
                </span>
                <span>Hours</span>
              </div>
              {rows.map((r) => (
                <div key={r.project.id} className="a-prow">
                  <span className="a-p-id">
                    <Link className="a-p-name" href={`/admin/projects/${r.project.id}`}>{r.project.name}</Link>
                    <span className="a-p-sub">{r.sub}</span>
                  </span>
                  <span><Tag tone={r.health.tone}>{r.health.text}</Tag></span>
                  <span className="a-p-next">
                    <b>{r.next?.title ?? 'No milestone yet'}</b>
                    <span>{r.nextNote}</span>
                  </span>
                  <span className="a-track" aria-hidden="true">
                    <span className="a-today" />
                    {r.seg.to > r.seg.from ? <span className="a-seg" style={{ left: `${r.seg.from}%`, width: `${r.seg.to - r.seg.from}%` }} /> : null}
                    {r.marks.map((mk) => (
                      <span key={mk.id}>
                        <span className={`a-ms${mk.done ? ' a-done' : ''}${mk.next ? ' a-next' : ''}`} style={{ left: `${mk.pct}%` }} />
                        {mk.next ? <span className="a-ms-label" style={{ left: `${mk.pct}%` }}>{mk.label}</span> : null}
                      </span>
                    ))}
                  </span>
                  <span className="a-p-hours">
                    {r.budget ? (
                      <>
                        <span className={r.over ? 'a-over-text' : undefined}>{r.hours} / {r.budget} h</span>
                        <span className={`a-meter${r.over ? ' a-over' : ''}`}><i style={{ width: `${Math.min(100, (r.hours / r.budget) * 100)}%` }} /></span>
                      </>
                    ) : (
                      <>
                        <span>{fmtH(r.hours)}</span>
                        <span className="a-muted" style={{ fontSize: 13 }}>No budget set</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No active projects.</Empty>
          )}
        </section>

        {/* Who to chase */}
        <section className="a-card a-s6" aria-labelledby="chase-h">
          <div className="a-card-head">
            <h2 id="chase-h">Who to chase</h2>
            <MoreLink href="/admin/leads">Leads</MoreLink>
          </div>
          <div className="a-funnel">
            {who.funnel.map((f) => (
              <Link key={f.label} href={f.href} className={`a-stage${'won' in f && f.won ? ' a-won' : ''}`}>
                <b>{f.count}</b>
                <span>
                  {f.label}
                  {'value' in f && f.value ? ` · ${fmtInr(f.value)}` : ''}
                </span>
              </Link>
            ))}
          </div>
          {who.people.length ? (
            <>
              <span className="a-eyebrow">Gone quiet, longest first</span>
              <ul className="a-people">
                {who.people.map((p) => (
                  <li key={p.key} className="a-person">
                    <span className={`a-initials${p.client ? ' a-client' : ''}`} aria-hidden="true">{p.initials}</span>
                    <span className="a-person-body">
                      <b>{p.name}</b>
                      <span>{p.line}</span>
                      <span>
                        {p.age > 0 ? (
                          <>
                            <span className="a-age">{p.age} day{p.age === 1 ? '' : 's'}</span> {p.ageText}
                          </>
                        ) : (
                          p.ageText
                        )}
                      </span>
                    </span>
                    <Link href={p.href} className="a-btn a-btn-quiet a-btn-sm">{p.button}</Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty>No open leads. Add one from the New button.</Empty>
          )}
        </section>

        {/* Your time */}
        <section className="a-card a-s6" aria-labelledby="time-h">
          <div className="a-card-head">
            <h2 id="time-h">Your time</h2>
            <MoreLink href="/admin/time">Timesheet</MoreLink>
          </div>
          <div className="a-time-top">
            <div className="a-money-total">
              <span className="a-eyebrow">Last 7 days</span>
              <span className="a-big a-num">{fmtH(time.total)}</span>
            </div>
            <Link href="/admin/time" className="a-btn a-btn-quiet a-btn-sm"><Icon name="plus" small />Log time</Link>
          </div>
          <div className="a-days" role="img" aria-label={time.perDay.map((x) => `${x.label} ${x.h} hours`).join(', ')}>
            {time.perDay.map((x) => (
              <div key={x.iso} className={`a-day${x.now ? ' a-now' : ''}`}>
                <em>{x.h}</em>
                <i style={{ height: `${Math.max(3, (x.h / time.max) * 110)}px` }} />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
          {time.split.length ? (
            <>
              <div className="a-split">
                {time.split.map((s) => (
                  <span key={s.label} style={{ width: `${(s.h / time.total) * 100}%`, background: s.color }} />
                ))}
              </div>
              <div className="a-split-legend">
                {time.split.map((s) => (
                  <div key={s.label}>
                    <span className="a-key"><i style={{ background: s.color }} />{s.label}</span>
                    <b className="a-num">{s.h} h</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty>No time logged this week. Start the timer at the top, or log hours on the Time page.</Empty>
          )}
          {time.warnings.map((w) => (
            <p key={w} className="a-insight"><Icon name="alert" />{w}</p>
          ))}
        </section>
      </div>
    </>
  )
}

function TodayRow({ item }: { item: TodayItem }) {
  const id = `chk-${item.key}`
  return (
    <li className="a-task">
      {item.check ? (
        <form action={checkItem} className="a-chk-form">
          <input type="hidden" name="id" value={item.check.id} />
          <input type="hidden" name="kind" value={item.check.kind} />
          <input type="hidden" name="checked" value={item.done ? '0' : '1'} />
          <input type="hidden" name="back" value="/admin" />
          <CheckSubmit id={id} checked={Boolean(item.done)} label={item.done ? `Mark "${item.title}" not done` : `Mark "${item.title}" done`} />
        </form>
      ) : (
        <span className="a-chk-gap" aria-hidden="true" />
      )}
      <Link className="a-task-body" href={item.href}>
        <span className="a-task-line">
          {item.tag ? <Tag tone={item.tag.tone}>{item.tag.text}</Tag> : null}
          <span className={`a-task-title${item.done ? ' a-struck' : ''}`}>{item.title}</span>
        </span>
        <span className="a-task-meta">{item.meta}</span>
      </Link>
      {item.action && !item.done ? (
        item.action.external ? (
          <a className={`a-btn ${item.action.primary ? 'a-btn-primary' : 'a-btn-quiet'} a-btn-sm`} href={item.action.href} target="_blank" rel="noopener noreferrer">
            {item.action.label}
          </a>
        ) : (
          <Link className={`a-btn ${item.action.primary ? 'a-btn-primary' : 'a-btn-quiet'} a-btn-sm`} href={item.action.href}>
            {item.action.label}
          </Link>
        )
      ) : null}
    </li>
  )
}
