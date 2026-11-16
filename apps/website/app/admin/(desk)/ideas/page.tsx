import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows } from '@/lib/admin/store'
import { IDEA_STATUSES } from '@/lib/admin/types'
import { dm } from '@/lib/admin/insights'
import { outline, summary } from '@/lib/admin/markdown'
import { saveIdea } from '@/app/admin/actions'
import { SubmitButton } from '@/components/admin/client'
import { Card, Empty, Input, PageHeader, Tabs, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Ideas' }

const tone = { Parked: 'warn', Exploring: 'ok', Building: 'ok', Dropped: 'line' } as const

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin()
  const { show = 'Open' } = await searchParams
  const ideas = await listRows('admin_ideas', { order: { column: 'updated_at', ascending: false } })
  const match = (s: string) => (i: { status: string }) => (s === 'Open' ? i.status === 'Parked' || i.status === 'Exploring' : s === 'All' ? true : i.status === s)
  const href = (s: string) => `/admin/ideas?show=${s}`
  const tabs = ['Open', ...IDEA_STATUSES, 'All'].map((s) => ({ href: href(s), label: s, count: ideas.filter(match(s)).length }))
  const shown = ideas.filter(match(show))

  return (
    <>
      <PageHeader title="Ideas" sub="The parking lot. Write it down now, come back to it later." />
      <div className="a-grid">
        <Card title="Park an idea" className="a-s12">
          <form action={saveIdea} className="a-inline">
            <input type="hidden" name="back" value="/admin/ideas" />
            <Input label="Idea" name="title" required placeholder="Growth OS for UPSC aspirants" />
            <SubmitButton>Park it and write it up</SubmitButton>
          </form>
        </Card>
        <div className="a-s12">
          <Tabs items={tabs} current={href(show)} />
        </div>
        {shown.length ? (
          shown.map((i) => {
            const parts = outline(i.notes)
            return (
              <Link key={i.id} href={`/admin/ideas/${i.id}`} className="a-card a-s6 a-idea">
                <span className="a-card-head">
                  <span className="a-idea-title">{i.title}</span>
                  <Tag tone={tone[i.status as keyof typeof tone] ?? 'line'}>{i.status}</Tag>
                </span>
                {i.notes ? <span className="a-idea-notes">{summary(i.notes)}</span> : <span className="a-muted">No notes yet.</span>}
                {parts.length ? <span className="a-idea-parts">{parts.join(' · ')}</span> : null}
                <span className="a-eyebrow">Parked {dm(i.created_at)}{i.updated_at.slice(0, 10) !== i.created_at.slice(0, 10) ? ` · updated ${dm(i.updated_at)}` : ''}</span>
              </Link>
            )
          })
        ) : (
          <div className="a-s12"><Empty>No ideas here yet.</Empty></div>
        )}
      </div>
    </>
  )
}
