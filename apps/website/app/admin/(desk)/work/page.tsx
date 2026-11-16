import type { Metadata } from 'next'
import { loadAll, namer, projectOptions } from '@/lib/admin/data'
import { ACTIVE_PROJECT_STATUSES } from '@/lib/admin/types'
import { weekStart } from '@/lib/admin/format'
import { TaskForm } from '@/components/admin/forms'
import { TaskList } from '@/components/admin/tasks'
import { Card, PageHeader, Stat, Tabs } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Work' }

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show = 'Open' } = await searchParams
  const { clients, projects, tasks } = await loadAll()
  const name = namer(clients, projects)
  const back = `/admin/work?show=${encodeURIComponent(show)}`
  const activeProjects = projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status))

  const open = tasks.filter((k) => k.status !== 'Done')
  const done = tasks.filter((k) => k.status === 'Done')
  const doneThisWeek = done.filter((k) => (k.done_at ?? '').slice(0, 10) >= weekStart())
  const shown = show === 'Done' ? done : show === 'All' ? tasks : open

  const hoursByProject = new Map<string, number>()
  for (const k of tasks) {
    const key = name.project(k.project_id) || 'No project'
    hoursByProject.set(key, (hoursByProject.get(key) ?? 0) + (Number(k.hours) || 0))
  }
  const hourRows = [...hoursByProject.entries()].filter(([, h]) => h > 0).sort((a, b) => b[1] - a[1])

  const href = (s: string) => `/admin/work?show=${s}`
  return (
    <>
      <PageHeader title="Work" sub="Your to-do list across every project, with the hours you put in." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="In progress" value={tasks.filter((k) => k.status === 'Doing').length} />
        <Stat label="To do" value={tasks.filter((k) => k.status === 'To do').length} />
        <Stat label="Done this week" value={doneThisWeek.length} />
        <Stat label="Hours logged, all time" value={tasks.reduce((s, k) => s + (Number(k.hours) || 0), 0)} />
      </div>

      <Card title="Add a task" className="mb-4">
        <TaskForm projects={projectOptions(activeProjects.length ? activeProjects : projects, clients)} back={back} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <Tabs
            current={href(show)}
            items={[
              { href: href('Open'), label: 'Open', count: open.length },
              { href: href('Done'), label: 'Done', count: done.length },
              { href: href('All'), label: 'All', count: tasks.length },
            ]}
          />
          <TaskList tasks={shown} back={back} projectName={name.project} />
        </Card>
        <Card title="Hours by project">
          {hourRows.length ? (
            <ul className="space-y-2 text-[14px]">
              {hourRows.map(([p, h]) => (
                <li key={p} className="flex justify-between gap-3">
                  <span className="truncate">{p}</span>
                  <span className="tabular-nums text-text-muted">{h} h</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-text-muted">Log time on a task to see it here. It helps you price the next job.</p>
          )}
        </Card>
      </div>
    </>
  )
}
