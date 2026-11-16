import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Tone } from '@/lib/admin/insights'

/** Building blocks shared by every admin page, in the admin design's style. */

export const inputCls = 'a-input'

export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="a-client-head">
      <div>
        <h1>{title}</h1>
        {sub ? <div className="a-client-sub">{sub}</div> : null}
      </div>
      {action ? <div className="a-head-actions">{action}</div> : null}
    </div>
  )
}

export function Card({ title, sub, action, children, className = '', id }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`a-card ${className}`} id={id}>
      {title || action ? (
        <div className="a-card-head">
          <div className="a-card-title">
            {title ? <h2>{title}</h2> : null}
            {sub ? <span className="a-eyebrow">{sub}</span> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="a-more" href={href}>
      {children}
      <svg className="a-ic a-ic-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </Link>
  )
}

export function Stat({ label, value, sub, href }: { label: string; value: ReactNode; sub?: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="a-eyebrow">{label}</span>
      <b className="a-num">{value}</b>
      {sub ? <span>{sub}</span> : null}
    </>
  )
  return href ? <Link href={href} className="a-stat">{body}</Link> : <div className="a-stat">{body}</div>
}

/** Status words and the colour each one gets. */
const tones: Record<string, Tone> = {
  New: 'warn', Contacted: 'wait', 'Call booked': 'ok', 'Proposal sent': 'ok', Won: 'ok', Lost: 'line',
  Planning: 'wait', 'In progress': 'ok', 'With client': 'warn', Live: 'ok', 'On hold': 'line', Done: 'line',
  'To do': 'wait', Doing: 'ok',
  Draft: 'line', Sent: 'ok', Paid: 'ok', Cancelled: 'line', Overdue: 'bad', Late: 'bad',
  'On track': 'ok', 'At risk': 'warn', 'Waiting on client': 'wait', Internal: 'line',
}

export function Tag({ children, tone }: { children: ReactNode; tone?: Tone }) {
  const t = tone ?? (typeof children === 'string' ? tones[children] : undefined) ?? 'line'
  return <span className={`a-tag a-tag-${t}`}>{children}</span>
}
export const Badge = Tag

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`a-field ${className}`}>
      <span className="a-field-label">{label}</span>
      {children}
      {hint ? <span className="a-field-hint">{hint}</span> : null}
    </label>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; wrap?: string }
export function Input({ label, hint, wrap = '', ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} className={wrap}>
      <input className="a-input" {...rest} />
    </Field>
  )
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; wrap?: string }
export function Textarea({ label, hint, wrap = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <Field label={label} hint={hint} className={wrap}>
      <textarea rows={rows} className="a-input" {...rest} />
    </Field>
  )
}

type Option = string | { value: string | number; label: string }
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly Option[]; empty?: string; wrap?: string }
export function Select({ label, options, empty, wrap = '', ...rest }: SelectProps) {
  return (
    <Field label={label} className={wrap}>
      <select className="a-input" {...rest}>
        {empty !== undefined ? <option value="">{empty}</option> : null}
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          ),
        )}
      </select>
    </Field>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="a-empty">{children}</p>
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="a-insight">
      {message}
    </p>
  )
}

/** A row in a list: title on the left, details under it, extras on the right. */
export function Row({ href, title, meta, right }: { href?: string; title: ReactNode; meta?: ReactNode; right?: ReactNode }) {
  const inner = (
    <>
      <span className="a-row-main">
        <span className="a-row-title">{title}</span>
        {meta ? <span className="a-row-meta">{meta}</span> : null}
      </span>
      {right ? <span className="a-row-right">{right}</span> : null}
    </>
  )
  return href ? <Link href={href} className="a-row">{inner}</Link> : <div className="a-row">{inner}</div>
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export function Tabs({ items, current }: { items: { href: string; label: string; count?: number }[]; current: string }) {
  return (
    <div className="a-tabs">
      {items.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.href === current ? 'page' : undefined}>
          {t.label}
          {t.count !== undefined ? <span>{t.count}</span> : null}
        </Link>
      ))}
    </div>
  )
}
