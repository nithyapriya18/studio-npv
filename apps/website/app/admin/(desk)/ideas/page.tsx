import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows } from '@/lib/admin/store'
import { IDEA_STATUSES } from '@/lib/admin/types'
import { dm } from '@/lib/admin/insights'
import { deleteIdea, saveIdea } from '@/app/admin/actions'
import { ConfirmButton, SubmitButton } from '@/components/admin/client'
import { Card, Empty, Input, PageHeader, Select, Tabs, Tag, Textarea } from '@/components/admin/ui'

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
  const back = href(show)

  return (
    <>
      <PageHeader title="Ideas" sub="The parking lot. Write it down now, come back to it later." />
      <div className="a-grid">
        <Card title="Park an idea" className="a-s12">
          <form action={saveIdea} className="a-form-grid">
            <input type="hidden" name="back" value={back} />
            <Input label="Idea" name="title" required placeholder="Growth OS for UPSC aspirants" wrap="a-span-all" />
            <Textarea label="Notes (optional)" name="notes" rows={3} placeholder="Who it's for, why now, who to talk to" wrap="a-span-all" />
            <div className="a-span-all"><SubmitButton>Park it</SubmitButton></div>
          </form>
        </Card>
        <div className="a-s12 a-ideas-wrap">
          <Tabs items={tabs} current={href(show)} />
        </div>
        {shown.length ? (
          shown.map((i) => (
            <section key={i.id} className="a-card a-s6 a-idea">
              <div className="a-card-head">
                <h2 className="a-idea-title">{i.title}</h2>
                <Tag tone={tone[i.status as keyof typeof tone] ?? 'line'}>{i.status}</Tag>
              </div>
              {i.notes ? <p className="a-idea-notes">{i.notes}</p> : null}
              <span className="a-eyebrow">Parked {dm(i.created_at)}{i.updated_at.slice(0, 10) !== i.created_at.slice(0, 10) ? ` · updated ${dm(i.updated_at)}` : ''}</span>
              <details className="a-details">
                <summary>Edit</summary>
                <form action={saveIdea} className="a-form-grid">
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="back" value={back} />
                  <Input label="Idea" name="title" required defaultValue={i.title} wrap="a-span-all" />
                  <Textarea label="Notes" name="notes" rows={5} defaultValue={i.notes ?? ''} wrap="a-span-all" />
                  <Select label="Status" name="status" options={IDEA_STATUSES} defaultValue={i.status} />
                  <div className="a-span-all"><SubmitButton>Save</SubmitButton></div>
                </form>
                <form action={deleteIdea}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="back" value={back} />
                  <ConfirmButton message={`Delete the idea "${i.title}"?`} className="a-linkbtn">Delete idea</ConfirmButton>
                </form>
              </details>
            </section>
          ))
        ) : (
          <div className="a-s12"><Empty>No ideas here yet.</Empty></div>
        )}
      </div>
    </>
  )
}
