import type { ReactNode } from 'react'

/**
 * A small, safe Markdown renderer for idea notes: headings (#, ##, ###),
 * bullet lists (- or *, one level of nesting with two spaces), numbered
 * lists, quotes (>), paragraphs, **bold**, *italic* and [links](https://…).
 * # or ## starts a section, ### a subsection.
 * It builds React elements, so nothing typed is ever run as HTML.
 */

type Block =
  | { kind: 'h'; level: 1 | 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; ordered: boolean; items: { text: string; sub: string[] }[] }

export function parse(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') })
    para = []
  }
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    const bullet = /^(\s*)[-*•]\s+(.*)$/.exec(line)
    const num = /^(\s*)\d+[.)]\s+(.*)$/.exec(line)
    const quote = /^>\s?(.*)$/.exec(line)
    if (!line.trim()) {
      flush()
      continue
    }
    if (h) {
      flush()
      blocks.push({ kind: 'h', level: h[1]!.length as 1 | 2 | 3, text: h[2]! })
    } else if (bullet || num) {
      flush()
      const m = (bullet ?? num)!
      const ordered = Boolean(num)
      const nested = m[1]!.length >= 2
      const last = blocks[blocks.length - 1]
      if (nested && last?.kind === 'list' && last.items.length) {
        last.items[last.items.length - 1]!.sub.push(m[2]!)
      } else if (last?.kind === 'list' && last.ordered === ordered) {
        last.items.push({ text: m[2]!, sub: [] })
      } else {
        blocks.push({ kind: 'list', ordered, items: [{ text: m[2]!, sub: [] }] })
      }
    } else if (quote) {
      flush()
      blocks.push({ kind: 'quote', text: quote[1]! })
    } else {
      para.push(line.trim())
    }
  }
  flush()
  return blocks
}

/** **bold**, *italic*, [text](https://link) */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>)
    else if (m[2]) out.push(<em key={k++}>{m[2]}</em>)
    else out.push(<a key={k++} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source, className = 'a-prose' }: { source: string; className?: string }) {
  return (
    <div className={className}>
      {parse(source).map((b, i) => {
        if (b.kind === 'h') {
          // # and ## are sections (h2), ### is a subsection (h3); the page title is the h1.
          const Tag = b.level === 3 ? 'h3' : 'h2'
          return <Tag key={i}>{inline(b.text)}</Tag>
        }
        if (b.kind === 'quote') return <blockquote key={i}>{inline(b.text)}</blockquote>
        if (b.kind === 'list') {
          const List = b.ordered ? 'ol' : 'ul'
          return (
            <List key={i}>
              {b.items.map((it, j) => (
                <li key={j}>
                  {inline(it.text)}
                  {it.sub.length ? <ul>{it.sub.map((s, n) => <li key={n}>{inline(s)}</li>)}</ul> : null}
                </li>
              ))}
            </List>
          )
        }
        return <p key={i}>{inline(b.text)}</p>
      })}
    </div>
  )
}

/** The first paragraph as plain text, for summaries on cards. */
export function summary(src: string | null | undefined, max = 220) {
  if (!src) return ''
  const first = parse(src).find((b) => b.kind === 'p' || b.kind === 'quote') as { text: string } | undefined
  const text = (first?.text ?? '').replace(/\*\*|\*|\[([^\]]+)\]\([^)]+\)/g, '$1')
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/** Headings in the notes, for the "In this idea" list. */
export function outline(src: string | null | undefined) {
  if (!src) return []
  return parse(src).filter((b): b is Extract<Block, { kind: 'h' }> => b.kind === 'h' && b.level <= 2).map((b) => b.text)
}
