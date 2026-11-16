import { deleteDocument } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { Icon } from '@/components/admin/icons'
import { Empty } from '@/components/admin/ui'
import { dm } from '@/lib/admin/insights'
import type { Doc } from '@/lib/admin/types'

const look: Record<string, { cls: string; icon: string }> = {
  Deck: { cls: 'a-deck', icon: 'deck' },
  Quote: { cls: 'a-pdf', icon: 'file' },
  Proposal: { cls: 'a-pdf', icon: 'file' },
  Contract: { cls: 'a-pdf', icon: 'file' },
  Audit: { cls: 'a-file', icon: 'doc' },
  Brief: { cls: 'a-file', icon: 'doc' },
  Design: { cls: 'a-deck', icon: 'deck' },
  Other: { cls: 'a-link', icon: 'link' },
}

/** Documents grouped by kind, as cards (from the admin design). */
export function DocGroups({ docs, back, describe }: { docs: Doc[]; back: string; describe?: (d: Doc) => string }) {
  if (!docs.length) return <Empty>No documents yet. Add decks, quotes and audits by link.</Empty>
  const groups = new Map<string, Doc[]>()
  for (const d of docs) groups.set(d.kind, [...(groups.get(d.kind) ?? []), d])
  return (
    <div className="a-docgroups">
      {[...groups.entries()].map(([kind, list]) => (
        <div key={kind} className="a-docgroup">
          <span className="a-eyebrow">{kind === 'Other' ? 'Other' : `${kind}s`}</span>
          {list.map((d) => {
            const l = look[d.kind] ?? look.Other!
            return (
              <div key={d.id} className="a-doc-wrap">
                <a className="a-doc" href={d.url} target="_blank" rel="noopener noreferrer">
                  <span className={`a-doc-ic ${l.cls}`}><Icon name={l.icon} /></span>
                  <span className="a-doc-text">
                    <span className="a-doc-name">{d.title}</span>
                    <span className="a-doc-meta">{[describe?.(d), `added ${dm(d.created_at)}`, d.notes].filter(Boolean).join(' · ')}</span>
                  </span>
                </a>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="back" value={back} />
                  <ConfirmButton message={`Remove "${d.title}" from the list? The document itself is not deleted.`} className="a-linkbtn">
                    Remove
                  </ConfirmButton>
                </form>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
