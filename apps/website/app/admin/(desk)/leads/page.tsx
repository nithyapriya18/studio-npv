import Link from 'next/link'
import type { Metadata } from 'next'
import { loadAll } from '@/lib/admin/data'
import { LEAD_STAGES, OPEN_STAGES } from '@/lib/admin/types'
import { inr, relDay, shortDate, today } from '@/lib/admin/format'
import { Badge, Card, Empty, PageHeader, Row, Tabs, inputCls } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Leads' }

interface Props {
  searchParams: Promise<{ stage?: string; q?: string }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const { stage = 'Open', q = '' } = await searchParams
  const { leads } = await loadAll()
  const t = today()

  // "All" means every real lead: spam only shows under its own tab.
  const inStage = (s: string): readonly string[] => (s === 'Open' ? OPEN_STAGES : s === 'All' ? LEAD_STAGES.filter((x) => x !== 'Spam') : [s])
  const count = (s: string) => {
    const set = inStage(s)
    return set ? leads.filter((l) => set.includes(l.stage)).length : leads.length
  }

  const set = inStage(stage)
  const needle = q.trim().toLowerCase()
  const shown = leads
    .filter((l) => !set || set.includes(l.stage))
    .filter((l) =>
      !needle ||
      [l.name, l.company, l.email, l.phone, l.notes, l.source].some((v) => v?.toLowerCase().includes(needle)),
    )
    .sort((a, b) => (a.follow_up_on ?? '9').localeCompare(b.follow_up_on ?? '9') || b.id - a.id)

  const total = shown.reduce((s, l) => s + (Number(l.value) || 0), 0)
  const href = (s: string) => `/admin/leads?stage=${encodeURIComponent(s)}${q ? `&q=${encodeURIComponent(q)}` : ''}`
  const tabs = ['Open', ...LEAD_STAGES, 'All'].map((s) => ({ href: href(s), label: s, count: count(s) }))

  return (
    <>
      <PageHeader
        title="Leads"
        sub="Everyone who might become a client. Enquiries from the website's contact form land here by themselves."
        action={<Link href="/admin/leads/new" className="a-btn a-btn-primary a-btn-sm">Add lead</Link>}
      />
      <Tabs items={tabs} current={href(stage)} />
      <form className="mb-4" action="/admin/leads">
        <input type="hidden" name="stage" value={stage} />
        <input name="q" defaultValue={q} placeholder="Search name, company, email, notes" className={inputCls} aria-label="Search leads" />
      </form>
      <Card title={`${shown.length} lead${shown.length === 1 ? '' : 's'}${total ? ` · ${inr(total)}` : ''}`}>
        {shown.length ? (
          shown.map((l) => (
            <Row
              key={l.id}
              href={`/admin/leads/${l.id}`}
              title={l.company ? `${l.name}, ${l.company}` : l.name}
              meta={[
                l.source,
                l.next_step,
                l.follow_up_on ? `follow up ${relDay(l.follow_up_on)}` : null,
                `added ${shortDate(l.created_at)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
              right={
                <>
                  {l.value ? <span className="hidden tabular-nums sm:inline">{inr(Number(l.value))}</span> : null}
                  {l.follow_up_on && l.follow_up_on < t && OPEN_STAGES.includes(l.stage) ? (
                    <Badge>Overdue</Badge>
                  ) : null}
                  <Badge>{l.stage}</Badge>
                </>
              }
            />
          ))
        ) : (
          <Empty>{needle ? 'No leads match that search.' : 'No leads here yet.'}</Empty>
        )}
      </Card>
    </>
  )
}
