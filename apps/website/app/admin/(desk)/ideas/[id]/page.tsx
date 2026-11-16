import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow } from '@/lib/admin/store'
import { Markdown, outline } from '@/lib/admin/markdown'
import { dm } from '@/lib/admin/insights'
import { IDEA_STATUSES } from '@/lib/admin/types'
import { deleteIdea, saveIdea } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { IdeaEditor } from '@/components/admin/idea-editor'
import { Card, Empty, Tag } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Idea' }

const tone = { Parked: 'warn', Exploring: 'ok', Building: 'ok', Dropped: 'line' } as const

export default async function IdeaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin()
  const [{ id }, { edit }] = await Promise.all([params, searchParams])
  const idea = await getRow('admin_ideas', Number(id))
  if (!idea) notFound()
  const back = `/admin/ideas/${idea.id}`
  const sections = outline(idea.notes)

  return (
    <>
      <nav className="a-crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Today</Link> / <Link href="/admin/ideas">Ideas</Link> / <span>{idea.title}</span>
      </nav>

      {edit ? (
        <Card title="Edit idea">
          <IdeaEditor idea={idea} back={back} />
        </Card>
      ) : (
        <>
          <div className="a-client-head">
            <div>
              <h1>{idea.title}</h1>
              <p className="a-client-sub">
                <Tag tone={tone[idea.status as keyof typeof tone] ?? 'line'}>{idea.status}</Tag>
                <span>Parked {dm(idea.created_at)}{idea.updated_at.slice(0, 10) !== idea.created_at.slice(0, 10) ? ` · updated ${dm(idea.updated_at)}` : ''}</span>
              </p>
            </div>
            <div className="a-head-actions">
              <Link href={`${back}?edit=1`} className="a-btn a-btn-primary">Edit</Link>
            </div>
          </div>

          <div className="a-grid">
            <section className="a-card a-s8 a-reading">
              {idea.notes ? <Markdown source={idea.notes} /> : <Empty>No notes yet. Click Edit to write it up.</Empty>}
            </section>
            <div className="a-s4 a-side-stack">
              {sections.length ? (
                <Card title="In this idea">
                  <ol className="a-outline">
                    {sections.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </Card>
              ) : null}
              <Card title="Status">
                <div className="a-step-actions">
                  {IDEA_STATUSES.filter((s) => s !== idea.status).map((s) => (
                    <form key={s} action={saveIdea}>
                      <input type="hidden" name="id" value={idea.id} />
                      <input type="hidden" name="title" value={idea.title} />
                      <input type="hidden" name="notes" value={idea.notes ?? ''} />
                      <input type="hidden" name="status" value={s} />
                      <input type="hidden" name="back" value={back} />
                      <button type="submit" className="a-btn a-btn-quiet a-btn-sm">Move to {s}</button>
                    </form>
                  ))}
                </div>
                <form action={deleteIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <input type="hidden" name="back" value="/admin/ideas" />
                  <ConfirmButton message={`Delete the idea "${idea.title}"?`} className="a-linkbtn">Delete idea</ConfirmButton>
                </form>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
