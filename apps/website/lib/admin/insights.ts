import { addDays, invoiceTotals, isOverdue, monthStart, today } from '@/lib/admin/format'
import { ACTIVE_PROJECT_STATUSES, OPEN_STAGES } from '@/lib/admin/types'
import type { Client, Doc, Invoice, Lead, Milestone, Note, Project, Task, TimeEntry } from '@/lib/admin/types'

/**
 * Everything the Today page and client pages show, worked out from the raw
 * tables. Pure functions: no database calls, so they're easy to test.
 */

export interface Data {
  clients: Client[]
  leads: Lead[]
  projects: Project[]
  invoices: Invoice[]
  documents: Doc[]
  tasks: Task[]
  milestones: Milestone[]
  time: TimeEntry[]
  notes: Note[]
}

/** Days a client usually takes to pay after an invoice (used for "expected" dates). */
export const PAY_DAYS = 7

export type Tone = 'bad' | 'warn' | 'ok' | 'wait' | 'line'

const DAY = 86400000
const d = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)
export const daysBetween = (from: string, to: string) => Math.round((d(to) - d(from)) / DAY)

const weekday = (iso: string) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(new Date(d(iso)))
/** "20 Nov" */
export const dm = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d(iso)))
/** "Fri 20 Nov" */
export const wdm = (iso: string) => `${weekday(iso)} ${dm(iso)}`
/** "20 December" */
export const dLong = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(d(iso)))

export function inWords(days: number) {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${-days} days ago`
}
const late = (days: number) => `${days} day${days === 1 ? '' : 's'} late`

export function lookup(data: Data) {
  const client = new Map(data.clients.map((c) => [c.id, c]))
  const project = new Map(data.projects.map((p) => [p.id, p]))
  return {
    client: (id: number | null | undefined) => (id ? client.get(id) : undefined),
    project: (id: number | null | undefined) => (id ? project.get(id) : undefined),
  }
}

export const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !['The', 'of', 'and', 'House'].includes(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?'

/** Milestones of a project, in order, and the next one still to do. */
export function projectMilestones(data: Data, projectId: number) {
  const list = data.milestones
    .filter((m) => m.project_id === projectId)
    .sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999') || a.position - b.position || a.id - b.id)
  const next = list.find((m) => !m.done_on) ?? null
  return { list, next }
}

export function hoursFor(data: Data, projectId: number) {
  return round1(data.time.filter((t) => t.project_id === projectId).reduce((s, t) => s + (Number(t.hours) || 0), 0))
}
export const round1 = (n: number) => Math.round(n * 10) / 10
export const fmtH = (n: number) => `${round1(n)} h`

// ---------------------------------------------------------------- Today list

export interface TodayItem {
  key: string
  tag?: { text: string; tone: Tone }
  title: string
  meta: string
  href: string
  action?: { label: string; href: string; primary?: boolean; external?: boolean }
  check?: { kind: 'task' | 'lead' | 'milestone'; id: number }
  done?: boolean
}

function mailto(to: string | null | undefined, subject: string, body = '') {
  if (!to) return null
  return `mailto:${to}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
}
function contactHref(c: { email?: string | null; phone?: string | null }, subject: string, body = '') {
  return mailto(c.email, subject, body) ?? (c.phone ? `https://wa.me/${c.phone.replace(/\D/g, '')}` : null)
}

export function todayItems(data: Data) {
  const t = today()
  const name = lookup(data)
  const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  const open: TodayItem[] = []
  const done: TodayItem[] = []

  // 1. Money that is late.
  for (const inv of data.invoices.filter(isOverdue)) {
    const c = name.client(inv.client_id)
    const lateBy = daysBetween(inv.due_date!, t)
    const total = invoiceTotals(inv).total
    const reminder = c
      ? contactHref(
          c,
          `Payment reminder: invoice ${inv.number}`,
          `Hello${c.contact_name ? ` ${c.contact_name}` : ''},\n\nA quick reminder that invoice ${inv.number} for ${inr(total)} was due on ${dm(inv.due_date!)}. Could you let me know when it will be paid?\n\nThank you,\nNithya`,
        )
      : null
    open.push({
      key: `inv-${inv.id}`,
      tag: { text: 'Overdue', tone: 'bad' },
      title: `Chase ${c?.name ?? 'client'} for ${inv.number}`,
      meta: `${inr(total)} · ${late(lateBy)}`,
      href: `/admin/invoices/${inv.id}`,
      action: { label: 'Send reminder', href: reminder ?? `/admin/invoices/${inv.id}`, primary: true, external: Boolean(reminder) },
    })
  }

  // 2. New enquiries from the website, not answered yet.
  const repliedTo = new Set<number>()
  for (const l of data.leads.filter((l) => l.stage === 'New' && l.source === 'Website form')) {
    repliedTo.add(l.id)
    const waiting = daysBetween(l.created_at, t)
    const reply = contactHref(l, 'Re: your enquiry to Studio NPV')
    open.push({
      key: `new-${l.id}`,
      tag: { text: 'New lead', tone: 'warn' },
      title: `Reply to ${l.name}${l.company ? `, ${l.company}` : ''}`,
      meta: `Enquiry from studionpv.com · ${waiting ? `waiting ${waiting} day${waiting === 1 ? '' : 's'}` : 'came in today'}`,
      href: `/admin/leads/${l.id}`,
      action: reply ? { label: 'Reply', href: reply, external: true } : { label: 'Open', href: `/admin/leads/${l.id}` },
      check: { kind: 'lead', id: l.id },
    })
  }

  // 3. Follow-ups that are due.
  for (const l of data.leads.filter((l) => OPEN_STAGES.includes(l.stage) && !repliedTo.has(l.id) && l.follow_up_on && l.follow_up_on <= t)) {
    const lateBy = daysBetween(l.follow_up_on!, t)
    open.push({
      key: `fu-${l.id}`,
      tag: { text: lateBy > 0 ? 'Follow-up late' : 'Follow up', tone: lateBy > 0 ? 'bad' : 'ok' },
      title: l.next_step ? `${l.next_step} (${l.name})` : `Follow up with ${l.name}${l.company ? `, ${l.company}` : ''}`,
      meta: [l.stage, lateBy > 0 ? late(lateBy) : 'due today', l.value ? inr(Number(l.value)) : null].filter(Boolean).join(' · '),
      href: `/admin/leads/${l.id}`,
      action: { label: 'Open', href: `/admin/leads/${l.id}` },
      check: { kind: 'lead', id: l.id },
    })
  }

  // 4. Clients holding up a project.
  for (const p of data.projects.filter((p) => p.health === 'Waiting on client' && ACTIVE_PROJECT_STATUSES.includes(p.status))) {
    const c = name.client(p.client_id)
    const { next } = projectMilestones(data, p.id)
    const nudge = c ? contactHref(c, `${p.name}: what we need from you`) : null
    open.push({
      key: `wait-${p.id}`,
      tag: { text: 'Blocking you', tone: 'wait' },
      title: `Nudge ${c?.name ?? 'the client'} on ${p.name}`,
      meta: next?.due_on ? `${next.title} is due ${wdm(next.due_on)}` : 'Waiting on the client',
      href: `/admin/projects/${p.id}`,
      action: nudge ? { label: 'Nudge', href: nudge, external: true } : { label: 'Open', href: `/admin/projects/${p.id}` },
    })
  }

  // 5. Milestones due today or late.
  for (const m of data.milestones.filter((m) => !m.done_on && m.due_on && m.due_on <= t)) {
    const p = name.project(m.project_id)
    if (!p) continue
    const lateBy = daysBetween(m.due_on!, t)
    open.push({
      key: `ms-${m.id}`,
      tag: { text: lateBy > 0 ? 'Milestone late' : 'Milestone', tone: lateBy > 0 ? 'bad' : 'warn' },
      title: `${m.title}: ${p.name}`,
      meta: [name.client(p.client_id)?.name, lateBy > 0 ? late(lateBy) : 'due today'].filter(Boolean).join(' · '),
      href: `/admin/projects/${p.id}`,
      check: { kind: 'milestone', id: m.id },
    })
  }

  // 6. Tasks due, late or in progress.
  for (const k of data.tasks.filter((k) => k.status !== 'Done' && (k.status === 'Doing' || (k.due_on && k.due_on <= t)))) {
    const p = name.project(k.project_id)
    const lateBy = k.due_on ? daysBetween(k.due_on, t) : 0
    open.push({
      key: `task-${k.id}`,
      tag: lateBy > 0 ? { text: 'Late', tone: 'bad' } : k.due_on === t ? { text: 'Due today', tone: 'warn' } : { text: 'In progress', tone: 'ok' },
      title: k.title,
      meta: [p?.name, k.due_on ? (lateBy > 0 ? late(lateBy) : lateBy === 0 ? 'due today' : `due ${wdm(k.due_on)}`) : null].filter(Boolean).join(' · '),
      href: p ? `/admin/projects/${p.id}` : '/admin/work',
      check: { kind: 'task', id: k.id },
    })
  }

  // Done today, shown struck through.
  for (const k of data.tasks.filter((k) => k.status === 'Done' && k.done_at && isToday(k.done_at))) {
    done.push({ key: `done-${k.id}`, title: k.title, meta: `Done at ${timeOf(k.done_at!)}`, href: '/admin/work', check: { kind: 'task', id: k.id }, done: true })
  }
  for (const m of data.milestones.filter((m) => m.done_on === t)) {
    done.push({ key: `msd-${m.id}`, title: `${m.title}: ${name.project(m.project_id)?.name ?? ''}`, meta: 'Milestone reached today', href: `/admin/projects/${m.project_id}`, check: { kind: 'milestone', id: m.id }, done: true })
  }

  return { open, done }
}

function isToday(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(iso)) === today()
}
function timeOf(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
}

/** The next seven days after today: one line per day. */
export function laterThisWeek(data: Data) {
  const t = today()
  const end = addDays(t, 7)
  const name = lookup(data)
  const byDay = new Map<string, string[]>()
  const add = (day: string, text: string) => byDay.set(day, [...(byDay.get(day) ?? []), text])
  const soon = (iso: string | null) => Boolean(iso && iso > t && iso <= end)

  for (const m of data.milestones) if (!m.done_on && soon(m.due_on)) add(m.due_on!, `${name.project(m.project_id)?.name ?? ''}: ${m.title}`)
  for (const k of data.tasks) if (k.status !== 'Done' && soon(k.due_on)) add(k.due_on!, k.title)
  for (const l of data.leads) if (OPEN_STAGES.includes(l.stage) && soon(l.follow_up_on)) add(l.follow_up_on!, l.next_step ? `${l.next_step} (${l.name})` : `Follow up with ${l.name}`)
  for (const i of data.invoices) if (i.status === 'Sent' && soon(i.due_date)) add(i.due_date!, `${i.number} from ${name.client(i.client_id)?.name ?? ''} falls due`)

  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, items]) => ({ day, label: `${weekday(day)} ${Number(day.slice(8))}`, text: items.join(' · ') }))
}

// ---------------------------------------------------------------- Money

export interface MoneyRow {
  key: string
  date: string
  dateNote: string
  who: string
  what: string
  amount: number
  tag: { text: string; tone: Tone }
  href: string
}

export function money(data: Data, clientId?: number) {
  const t = today()
  const name = lookup(data)
  const mine = <T extends { client_id?: number | null }>(x: T) => clientId === undefined || x.client_id === clientId
  const projectClient = (pid: number) => name.project(pid)?.client_id ?? null

  const rows: MoneyRow[] = []
  let overdue = 0
  let invoiced = 0
  let toInvoice = 0

  for (const inv of data.invoices.filter((i) => i.status === 'Sent' && mine(i))) {
    const total = invoiceTotals(inv).total
    const due = inv.due_date ?? addDays(inv.issue_date, PAY_DAYS)
    const late = isOverdue(inv)
    if (late) overdue += total
    else invoiced += total
    rows.push({
      key: `i${inv.id}`,
      date: due,
      dateNote: late ? 'was due' : 'due',
      who: name.client(inv.client_id)?.name ?? '',
      what: [inv.number, name.project(inv.project_id)?.name].filter(Boolean).join(' · '),
      amount: total,
      tag: late ? { text: `${daysBetween(due, t)} days late`, tone: 'bad' } : { text: `Sent ${dm(inv.issue_date)}`, tone: 'ok' },
      href: `/admin/invoices/${inv.id}`,
    })
  }

  // Milestone payments not yet invoiced, due within six weeks (or already past).
  const horizon = addDays(t, 42)
  for (const m of data.milestones) {
    if (!m.amount || m.invoice_id || !m.due_on || m.due_on > horizon) continue
    const cid = projectClient(m.project_id)
    if (clientId !== undefined && cid !== clientId) continue
    toInvoice += Number(m.amount)
    rows.push({
      key: `m${m.id}`,
      date: addDays(m.due_on, PAY_DAYS),
      dateNote: 'expected',
      who: name.client(cid)?.name ?? name.project(m.project_id)?.name ?? '',
      what: `${name.project(m.project_id)?.name ?? ''} · ${m.title}`,
      amount: Number(m.amount),
      tag: { text: m.due_on <= t ? 'Invoice now' : `Invoice on ${dm(m.due_on)}`, tone: m.due_on <= t ? 'warn' : 'line' },
      href: `/admin/projects/${m.project_id}`,
    })
  }

  rows.sort((a, b) => a.date.localeCompare(b.date))
  const total = overdue + invoiced + toInvoice
  const by = rows.length ? rows[rows.length - 1]!.date : null
  const collectedThisMonth = data.invoices
    .filter((i) => i.status === 'Paid' && (i.paid_on ?? '') >= monthStart() && mine(i))
    .reduce((s, i) => s + invoiceTotals(i).total, 0)
  const paidAll = data.invoices.filter((i) => i.status === 'Paid' && mine(i)).reduce((s, i) => s + invoiceTotals(i).total, 0)
  return {
    rows,
    total,
    overdue,
    invoiced,
    toInvoice,
    by,
    collectedThisMonth,
    paidAll,
    payments: rows.length,
    stillToInvoice: rows.filter((r) => r.key.startsWith('m')).length,
    overdueInvoices: data.invoices.filter((i) => isOverdue(i) && mine(i)),
  }
}

// ---------------------------------------------------------------- Projects timeline

export const WINDOW_BEFORE = 7
export const WINDOW_DAYS = 35

export function timelineTicks() {
  const t = today()
  const start = addDays(t, -WINDOW_BEFORE)
  return [0, 7, 14, 21, 28].map((off) => {
    const iso = addDays(start, off)
    return { iso, label: iso === t ? 'Today' : dm(iso), pct: (off / WINDOW_DAYS) * 100, now: iso === t }
  })
}

const pctOf = (iso: string) => {
  const start = addDays(today(), -WINDOW_BEFORE)
  return Math.max(0, Math.min(100, (daysBetween(start, iso) / WINDOW_DAYS) * 100))
}

export function healthTone(health: string | null | undefined): Tone {
  if (health === 'At risk') return 'warn'
  if (health === 'Waiting on client') return 'wait'
  if (health === 'Internal') return 'line'
  return 'ok'
}

export function projectRows(data: Data) {
  const t = today()
  const name = lookup(data)
  const windowStart = addDays(t, -WINDOW_BEFORE)
  const windowEnd = addDays(windowStart, WINDOW_DAYS)
  return data.projects
    .filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status))
    .map((p) => {
      const { list, next } = projectMilestones(data, p.id)
      const hours = hoursFor(data, p.id)
      const budget = p.budget_hours ? Number(p.budget_hours) : null
      const nextLate = Boolean(next?.due_on && next.due_on < t)
      const marks = list
        .filter((m) => m.due_on && m.due_on >= windowStart && m.due_on <= windowEnd)
        .map((m) => ({ id: m.id, pct: pctOf(m.due_on!), done: Boolean(m.done_on), next: m.id === next?.id, label: dm(m.due_on!) }))
      const segFrom = pctOf(p.start_on && p.start_on > windowStart ? p.start_on : windowStart)
      const segTo = next?.due_on ? pctOf(next.due_on) : segFrom
      return {
        project: p,
        client: name.client(p.client_id),
        sub: [name.client(p.client_id)?.name, p.summary || p.kind].filter(Boolean).join(' · '),
        health: nextLate ? { text: 'Late', tone: 'bad' as Tone } : { text: p.health || 'On track', tone: healthTone(p.health) },
        next,
        nextNote: next?.due_on ? `${wdm(next.due_on)} · ${inWords(daysBetween(t, next.due_on))}` : next ? 'No date yet' : 'Add the next milestone',
        hours,
        budget,
        over: budget !== null && hours > budget,
        marks,
        seg: { from: segFrom, to: Math.max(segFrom, segTo) },
      }
    })
    .sort((a, b) => (a.next?.due_on ?? '9999').localeCompare(b.next?.due_on ?? '9999'))
}

// ---------------------------------------------------------------- Who to chase

export function chase(data: Data) {
  const t = today()
  const name = lookup(data)
  const quarterStart = `${t.slice(0, 5)}${String(Math.floor((Number(t.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0')}-01`
  const stage = (s: string[]) => data.leads.filter((l) => s.includes(l.stage))
  const proposal = stage(['Proposal sent'])
  const funnel = [
    { label: 'New', count: stage(['New']).length, href: '/admin/leads?stage=New' },
    { label: 'Talking', count: stage(['Contacted', 'Call booked']).length, href: '/admin/leads?stage=Open' },
    {
      label: 'Proposal sent',
      count: proposal.length,
      value: proposal.reduce((s, l) => s + (Number(l.value) || 0), 0),
      href: '/admin/leads?stage=Proposal%20sent',
    },
    { label: 'Won this quarter', count: data.leads.filter((l) => l.stage === 'Won' && l.updated_at.slice(0, 10) >= quarterStart).length, href: '/admin/leads?stage=Won', won: true },
  ]

  const lastTouch = (l: Lead) => {
    const notes = data.notes.filter((n) => n.lead_id === l.id).map((n) => n.created_at.slice(0, 10))
    return [l.updated_at.slice(0, 10), ...notes].sort().pop()!
  }
  const quiet = data.leads
    .filter((l) => OPEN_STAGES.includes(l.stage))
    .map((l) => ({ l, since: daysBetween(lastTouch(l), t) }))
    .sort((a, b) => b.since - a.since)
    .map(({ l, since }) => ({
      key: `l${l.id}`,
      initials: initials(l.company || l.name),
      client: false,
      name: l.company ? `${l.name}, ${l.company}` : l.name,
      line: [l.stage, l.next_step].filter(Boolean).join(' · '),
      age: since,
      ageText: since === 0 ? 'touched today' : `since your last note`,
      href: `/admin/leads/${l.id}`,
      button: 'Follow up',
    }))

  const blocking = data.projects
    .filter((p) => p.health === 'Waiting on client' && ACTIVE_PROJECT_STATUSES.includes(p.status))
    .map((p) => {
      const c = name.client(p.client_id)
      return {
        key: `p${p.id}`,
        initials: initials(c?.name ?? p.name),
        client: true,
        name: c?.name ?? p.name,
        line: `Client · ${p.name}`,
        age: -1,
        ageText: 'waiting on them',
        href: `/admin/projects/${p.id}`,
        button: 'Nudge',
      }
    })

  return { funnel, people: [...blocking, ...quiet].slice(0, 5) }
}

// ---------------------------------------------------------------- Time

export const SERIES = ['var(--c1)', 'var(--c3)', 'var(--c2)', 'var(--c4)']

export function timeSummary(data: Data, days = 7) {
  const t = today()
  const name = lookup(data)
  const from = addDays(t, -(days - 1))
  const recent = data.time.filter((e) => e.on_date >= from && e.on_date <= t)
  const perDay = Array.from({ length: days }, (_, i) => {
    const iso = addDays(from, i)
    const h = round1(recent.filter((e) => e.on_date === iso).reduce((s, e) => s + Number(e.hours), 0))
    return { iso, h, label: iso === t ? 'Today' : weekday(iso), now: iso === t }
  })
  const total = round1(perDay.reduce((s, x) => s + x.h, 0))
  const byProject = new Map<string, number>()
  for (const e of recent) {
    const k = name.project(e.project_id)?.name ?? 'No project'
    byProject.set(k, (byProject.get(k) ?? 0) + Number(e.hours))
  }
  const sorted = [...byProject.entries()].sort((a, b) => b[1] - a[1])
  const split = [...sorted.slice(0, 3), ...(sorted.length > 3 ? [['Other', sorted.slice(3).reduce((s, x) => s + x[1], 0)] as [string, number]] : [])].map(
    ([label, h], i) => ({ label, h: round1(h), color: SERIES[i]! }),
  )

  const warnings = data.projects
    .filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status) && p.budget_hours)
    .map((p) => ({ p, hours: hoursFor(data, p.id), budget: Number(p.budget_hours) }))
    .filter((x) => x.hours > x.budget)
    .map(({ p, hours, budget }) => {
      const price = Number(p.price) || 0
      const rate = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
      return price
        ? `${p.name} is ${round1(hours - budget)} h past its ${budget} h budget. On a fixed ${rate(price)} fee, your rate has dropped from ${rate(price / budget)}/h to ${rate(price / hours)}/h so far.`
        : `${p.name} is ${round1(hours - budget)} h past its ${budget} h budget.`
    })

  return { perDay, total, split, warnings, max: Math.max(1, ...perDay.map((x) => x.h)) }
}

/** Hours per week for one client's projects, last five weeks. */
export function weeklyHours(data: Data, projectIds: number[], weeks = 5) {
  const t = today()
  const set = new Set(projectIds)
  const start = addDays(t, -(weeks * 7 - 1))
  const out = Array.from({ length: weeks }, (_, i) => {
    const from = addDays(start, i * 7)
    const to = addDays(from, 6)
    const h = round1(data.time.filter((e) => e.project_id && set.has(e.project_id) && e.on_date >= from && e.on_date <= to).reduce((s, e) => s + Number(e.hours), 0))
    return { label: dm(from), h, now: i === weeks - 1 }
  })
  return { weeks: out, max: Math.max(1, ...out.map((w) => w.h)) }
}

// ---------------------------------------------------------------- Activity

export function activity(data: Data, clientId: number) {
  const name = lookup(data)
  const projectIds = new Set(data.projects.filter((p) => p.client_id === clientId).map((p) => p.id))
  const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  const items: { date: string; text: string }[] = []
  for (const n of data.notes) {
    if (n.client_id === clientId || (n.project_id && projectIds.has(n.project_id))) items.push({ date: n.created_at.slice(0, 10), text: n.body.split('\n')[0]!.slice(0, 140) })
  }
  for (const i of data.invoices.filter((i) => i.client_id === clientId)) {
    if (i.status !== 'Draft') items.push({ date: i.issue_date, text: `${i.number} sent, ${inr(invoiceTotals(i).total)}` })
    if (i.paid_on) items.push({ date: i.paid_on, text: `${i.number} paid, ${inr(invoiceTotals(i).total)}` })
  }
  for (const m of data.milestones) if (m.done_on && projectIds.has(m.project_id)) items.push({ date: m.done_on, text: `${m.title} done (${name.project(m.project_id)?.name ?? ''})` })
  const byDay = new Map<string, number>()
  for (const e of data.time) if (e.project_id && projectIds.has(e.project_id)) byDay.set(e.on_date, (byDay.get(e.on_date) ?? 0) + Number(e.hours))
  for (const [date, h] of byDay) items.push({ date, text: `Logged ${round1(h)} h` })
  for (const doc of data.documents) if (doc.client_id === clientId || (doc.project_id && projectIds.has(doc.project_id))) items.push({ date: doc.created_at.slice(0, 10), text: `Added ${doc.title}` })
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
}

/** The headline and the sentence under it. */
export function heroSummary(data: Data) {
  const { open } = todayItems(data)
  const m = money(data)
  const rows = projectRows(data)
  const next = rows.find((r) => r.next?.due_on && !r.next.done_on)
  const late = m.overdueInvoices
  const name = lookup(data)
  const parts: { b?: string; t?: string }[] = []
  if (late.length) {
    const who = [...new Set(late.map((i) => name.client(i.client_id)?.name ?? ''))].join(' and ')
    parts.push({ b: `${fmtInr(m.overdue)} is overdue` }, { t: ` from ${who}. ` })
  }
  if (m.total - m.overdue > 0 && m.by) parts.push({ b: fmtInr(m.total - m.overdue) }, { t: ` is due to come in by ${dLong(m.by)}. ` })
  if (next?.next?.due_on) {
    const lateBy = daysBetween(next.next.due_on, today())
    parts.push({
      t: lateBy > 0
        ? `${next.project.name}: ${next.next.title.toLowerCase()} is ${lateBy} day${lateBy === 1 ? '' : 's'} late.`
        : `Next up is ${next.project.name}: ${next.next.title.toLowerCase()} on ${wdm(next.next.due_on)}.`,
    })
  }
  if (!parts.length) parts.push({ t: 'Nothing is overdue. Add milestones and invoices to see what comes next.' })
  return { count: open.length, parts, next }
}

export const fmtInr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
