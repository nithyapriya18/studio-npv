import type { Metadata } from 'next'
import { loadAll, projectOptions } from '@/lib/admin/data'
import { today } from '@/lib/admin/format'
import { dm, fmtH, round1, timeSummary, wdm } from '@/lib/admin/insights'
import { ACTIVE_PROJECT_STATUSES } from '@/lib/admin/types'
import { deleteTime, logTime, startTimer, stopTimer } from '@/app/admin/actions'
import { ConfirmButton, SubmitButton } from '@/components/admin/client'
import { TimerClock } from '@/components/admin/shell'
import { Icon } from '@/components/admin/icons'
import { Card, Empty, Input, MoreLink, PageHeader, Select } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Time' }

export default async function TimePage() {
  const data = await loadAll()
  const t = today()
  const active = data.projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status))
  const options = projectOptions(active.length ? active : data.projects, data.clients)
  const week = timeSummary(data, 7)
  const running = data.settings.timer_started
  const runningProject = data.projects.find((p) => String(p.id) === data.settings.timer_project)
  const byDate = new Map<string, typeof data.time>()
  for (const e of data.time.slice(0, 60)) byDate.set(e.on_date, [...(byDate.get(e.on_date) ?? []), e])
  const projectName = (id: number | null) => data.projects.find((p) => p.id === id)?.name ?? 'No project'
  const totals = new Map<string, number>()
  for (const e of data.time) totals.set(projectName(e.project_id), (totals.get(projectName(e.project_id)) ?? 0) + Number(e.hours))

  return (
    <>
      <PageHeader title="Time" sub="Start the timer while you work, or log hours after. It shows where your time goes, and when a project runs over." action={<MoreLink href="/admin/work">Tasks</MoreLink>} />
      <div className="a-grid">
        <Card title="Timer" className="a-s5">
          {running ? (
            <form action={stopTimer} className="a-timer-card">
              <input type="hidden" name="back" value="/admin/time" />
              <span className="a-eyebrow">Running · {[runningProject?.name, data.settings.timer_note].filter(Boolean).join(' · ') || 'No project'}</span>
              <span className="a-big"><TimerClock started={running} /></span>
              <button type="submit" className="a-btn a-btn-primary"><Icon name="stop" small />Stop and log it</button>
            </form>
          ) : (
            <form action={startTimer} className="a-form-grid">
              <input type="hidden" name="back" value="/admin/time" />
              <Select label="Project" name="project_id" empty="No project" options={options} />
              <Input label="What you're doing (optional)" name="note" placeholder="Home page copy" />
              <div className="a-span-all"><SubmitButton><Icon name="play" small />Start timer</SubmitButton></div>
            </form>
          )}
          <p className="a-muted" style={{ fontSize: 13 }}>Time is rounded to the nearest quarter hour when you stop. The timer keeps running if you close the browser.</p>
        </Card>

        <Card title="Log time" className="a-s7">
          <form action={logTime} className="a-form-grid">
            <input type="hidden" name="back" value="/admin/time" />
            <Select label="Project" name="project_id" empty="No project" options={options} />
            <Input label="Date" name="on_date" type="date" defaultValue={t} />
            <Input label="Hours" name="hours" inputMode="decimal" required placeholder="2.5" />
            <Input label="What you did (optional)" name="note" placeholder="Wireframes for the jobs page" />
            <div className="a-span-all"><SubmitButton>Log time</SubmitButton></div>
          </form>
        </Card>

        <Card title="Last 7 days" sub={fmtH(week.total)} className="a-s7">
          <div className="a-days" role="img" aria-label={week.perDay.map((x) => `${x.label} ${x.h} hours`).join(', ')}>
            {week.perDay.map((x) => (
              <div key={x.iso} className={`a-day${x.now ? ' a-now' : ''}`}>
                <em>{x.h}</em>
                <i style={{ height: `${Math.max(3, (x.h / week.max) * 110)}px` }} />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
          {week.warnings.map((w) => (
            <p key={w} className="a-insight"><Icon name="alert" />{w}</p>
          ))}
        </Card>

        <Card title="All time, by project" className="a-s5">
          {totals.size ? (
            <ul className="a-feed">
              {[...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name, h]) => (
                <li key={name} className="a-feed-wide"><span>{name}</span><b className="a-num">{round1(h)} h</b></li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing logged yet.</Empty>
          )}
        </Card>

        <Card title="Entries" className="a-s12">
          {byDate.size ? (
            [...byDate.entries()].map(([date, list]) => (
              <div key={date} className="a-time-day">
                <span className="a-eyebrow">{date === t ? 'Today' : wdm(date)} · {round1(list.reduce((s, e) => s + Number(e.hours), 0))} h</span>
                {list.map((e) => (
                  <div key={e.id} className="a-row">
                    <span className="a-row-main">
                      <span className="a-row-title">{projectName(e.project_id)}</span>
                      <span className="a-row-meta">{e.note ?? `Logged ${dm(e.created_at)}`}</span>
                    </span>
                    <span className="a-row-right">
                      <b className="a-num">{e.hours} h</b>
                      <form action={deleteTime}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="back" value="/admin/time" />
                        <ConfirmButton message="Delete this time entry?" className="a-linkbtn">Delete</ConfirmButton>
                      </form>
                    </span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <Empty>No time logged yet.</Empty>
          )}
        </Card>
      </div>
    </>
  )
}
