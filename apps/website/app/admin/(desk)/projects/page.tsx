import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll, namer } from '@/lib/admin/data'
import { ACTIVE_PROJECT_STATUSES, PROJECT_STATUSES } from '@/lib/admin/types'
import { inr, relDay, shortDate, today } from '@/lib/admin/format'
import { Badge, Card, Empty, PageHeader, Row, Tabs } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = 'Active' } = await searchParams
  const { clients, projects, tasks } = await loadAll()
  const name = namer(clients, projects)
  const t = today()
  const match = (s: string) => (p: { status: string }) =>
    s === 'Active' ? ACTIVE_PROJECT_STATUSES.includes(p.status) : s === 'All' ? true : p.status === s
  const href = (s: string) => `/admin/projects?status=${encodeURIComponent(s)}`
  const tabs = ['Active', ...PROJECT_STATUSES, 'All'].map((s) => ({ href: href(s), label: s, count: projects.filter(match(s)).length }))
  const shown = projects.filter(match(status)).sort((a, b) => (a.due_on ?? '9').localeCompare(b.due_on ?? '9'))

  return (
    <>
      <PageHeader title="Projects" sub="What you're building, for whom, and when it's due." action={<Link href="/admin/projects/new" className="btn-primary btn-sm">Add project</Link>} />
      <Tabs items={tabs} current={href(status)} />
      <Card>
        {shown.length ? (
          shown.map((p) => {
            const mine = tasks.filter((k) => k.project_id === p.id)
            const open = mine.filter((k) => k.status !== 'Done').length
            const hours = mine.reduce((s, k) => s + (Number(k.hours) || 0), 0)
            return (
              <Row
                key={p.id}
                href={`/admin/projects/${p.id}`}
                title={p.name}
                meta={[name.client(p.client_id), p.kind, `${open} open task${open === 1 ? '' : 's'}`, hours ? `${hours} h` : null, p.due_on ? `due ${shortDate(p.due_on)}` : null].filter(Boolean).join(' · ')}
                right={
                  <>
                    {p.price ? <span className="hidden tabular-nums sm:inline">{inr(Number(p.price))}</span> : null}
                    {p.due_on && p.due_on < t && ACTIVE_PROJECT_STATUSES.includes(p.status) ? <span className="adm-bad-text text-[13px]">{relDay(p.due_on)}</span> : null}
                    <Badge>{p.status}</Badge>
                  </>
                }
              />
            )
          })
        ) : (
          <Empty>No projects here.</Empty>
        )}
      </Card>
    </>
  )
}
