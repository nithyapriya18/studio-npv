import type { Invoice, InvoiceItem } from '@/lib/admin/types'

const TZ = 'Asia/Kolkata'

/** Today as YYYY-MM-DD in India, so "due today" flips at local midnight. */
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Monday of the current week (India time). */
export function weekStart() {
  const t = today()
  const day = new Date(`${t}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(t, day === 0 ? -6 : 1 - day)
}

export function monthStart() {
  return `${today().slice(0, 7)}-01`
}

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const inrRound = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function inr(n: number | null | undefined, exact = false) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return (exact ? inrFmt : inrRound).format(n)
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: iso.length === 10 ? 'UTC' : TZ,
  }).format(d)
}

/** "today", "in 3 days", "2 days ago" for a YYYY-MM-DD date. */
export function relDay(iso: string | null | undefined) {
  if (!iso) return ''
  const diff = Math.round(
    (Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86400000,
  )
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

export function itemTotal(item: InvoiceItem) {
  return round2((Number(item.qty) || 0) * (Number(item.rate) || 0))
}

export function invoiceTotals(inv: Pick<Invoice, 'items' | 'tax_percent'>) {
  const subtotal = round2((inv.items ?? []).reduce((sum, i) => sum + itemTotal(i), 0))
  const tax = round2((subtotal * (Number(inv.tax_percent) || 0)) / 100)
  return { subtotal, tax, total: round2(subtotal + tax) }
}

export function isOverdue(inv: Pick<Invoice, 'status' | 'due_date'>) {
  return inv.status === 'Sent' && Boolean(inv.due_date) && inv.due_date! < today()
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
