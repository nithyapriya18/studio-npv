import Link from 'next/link'
import type { ReactNode } from 'react'

/** Small building blocks shared by every admin page. Brand: Indigo & Marigold. */

export const inputCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-[15px] text-text-primary placeholder:text-text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-[34px] leading-tight text-text-primary sm:text-[40px]">{title}</h1>
        {sub ? <p className="mt-1 text-[15px] text-text-muted">{sub}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-muted">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, href }: { label: string; value: ReactNode; sub?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="text-[13px] text-text-muted">{label}</div>
      <div className="mt-1 font-serif text-[30px] leading-none text-accent">{value}</div>
      {sub ? <div className="mt-2 text-[13px] text-text-muted">{sub}</div> : null}
    </>
  )
  const cls = 'block rounded-2xl border border-border bg-card p-4'
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

const tones: Record<string, string> = {
  // leads
  New: 'bg-accent-light text-text-primary',
  Contacted: 'bg-surface text-text-primary',
  'Call booked': 'bg-surface text-text-primary',
  'Proposal sent': 'bg-accent/15 text-accent',
  Won: 'adm-good',
  Lost: 'bg-surface text-text-muted line-through',
  // projects
  Planning: 'bg-surface text-text-primary',
  'In progress': 'bg-accent/15 text-accent',
  'With client': 'bg-accent-light text-text-primary',
  Live: 'adm-good',
  'On hold': 'bg-surface text-text-muted',
  Done: 'bg-surface text-text-muted',
  // tasks
  'To do': 'bg-surface text-text-primary',
  Doing: 'bg-accent/15 text-accent',
  // invoices
  Draft: 'bg-surface text-text-muted',
  Sent: 'bg-accent/15 text-accent',
  Paid: 'adm-good',
  Cancelled: 'bg-surface text-text-muted line-through',
  Overdue: 'adm-bad',
}

export function Badge({ children }: { children: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tones[children] ?? 'bg-surface text-text-primary'}`}>
      {children}
    </span>
  )
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[13px] font-medium text-text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-text-muted">{hint}</span> : null}
    </label>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; wrap?: string }
export function Input({ label, hint, wrap = '', ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} className={wrap}>
      <input className={inputCls} {...rest} />
    </Field>
  )
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; wrap?: string }
export function Textarea({ label, hint, wrap = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <Field label={label} hint={hint} className={wrap}>
      <textarea rows={rows} className={inputCls} {...rest} />
    </Field>
  )
}

type Option = string | { value: string | number; label: string }
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: readonly Option[]
  empty?: string
  wrap?: string
}
export function Select({ label, options, empty, wrap = '', ...rest }: SelectProps) {
  return (
    <Field label={label} className={wrap}>
      <select className={inputCls} {...rest}>
        {empty !== undefined ? <option value="">{empty}</option> : null}
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </Field>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[14px] text-text-muted">{children}</p>
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="adm-alert mb-4 rounded-xl border px-4 py-3 text-[14px]">
      {message}
    </p>
  )
}

/** A row in a list: title on the left, details under it, extras on the right. */
export function Row({ href, title, meta, right }: { href?: string; title: ReactNode; meta?: ReactNode; right?: ReactNode }) {
  const inner = (
    <>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-medium text-text-primary">{title}</div>
        {meta ? <div className="mt-0.5 truncate text-[13px] text-text-muted">{meta}</div> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2 text-[14px]">{right}</div> : null}
    </>
  )
  const cls = 'flex items-center justify-between gap-3 border-b border-border px-1 py-3 last:border-b-0'
  return href ? (
    <Link href={href} className={`${cls} rounded-lg transition-colors hover:bg-surface/60`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent">
      {children}
    </a>
  )
}

export function Tabs({ items, current }: { items: { href: string; label: string; count?: number }[]; current: string }) {
  return (
    <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto pb-1">
      {items.map((t) => {
        const active = t.href === current
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
              active ? 'border-accent bg-accent text-card' : 'border-border text-text-primary hover:border-accent'
            }`}
          >
            {t.label}
            {t.count !== undefined ? <span className={active ? ' opacity-80' : ' text-text-muted'}> {t.count}</span> : null}
          </Link>
        )
      })}
    </div>
  )
}
