'use client'

import { useActionState, useMemo, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn, saveInvoice, type InvoiceFormState, type SignInState } from '@/app/admin/actions'
import { ErrorNote, Field, Input, Select, Textarea, inputCls } from '@/components/admin/ui'
import { INVOICE_STATUSES, type Invoice, type InvoiceItem } from '@/lib/admin/types'

export function SubmitButton({ children, className = 'a-btn a-btn-primary a-btn-sm' }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Saving…' : children}
    </button>
  )
}

/** A submit button that asks first. Use inside a <form> that calls a delete action. */
export function ConfirmButton({ children, message, className = 'a-btn a-btn-quiet a-btn-sm' }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}

export function PrintButton() {
  return (
    <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  )
}

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {})
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required autoFocus />
      <button type="submit" className="a-btn a-btn-primary w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

// ---------- invoice editor ----------

interface Opt {
  value: number
  label: string
  clientId?: number | null
}

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export function InvoiceForm({
  invoice,
  clients,
  projects,
  suggestedNumber,
  defaults,
}: {
  invoice?: Invoice
  clients: Opt[]
  projects: Opt[]
  suggestedNumber: string
  defaults: { issue_date: string; due_date: string; client_id?: number; project_id?: number; items?: InvoiceItem[]; milestone_id?: number }
}) {
  const [state, action, pending] = useActionState<InvoiceFormState, FormData>(saveInvoice, {})
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length ? invoice.items : defaults.items?.length ? defaults.items : [{ description: '', qty: 1, rate: 0 }],
  )
  const [tax, setTax] = useState<number>(Number(invoice?.tax_percent ?? 0))
  const [clientId, setClientId] = useState<string>(String(invoice?.client_id ?? defaults.client_id ?? ''))
  const [status, setStatus] = useState(invoice?.status ?? 'Draft')

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0)
    const taxAmt = (subtotal * (Number(tax) || 0)) / 100
    return { subtotal, tax: taxAmt, total: subtotal + taxAmt }
  }, [items, tax])

  const setItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const projectOptions = projects.filter((p) => !clientId || !p.clientId || String(p.clientId) === clientId)

  return (
    <form action={action} className="space-y-6">
      <ErrorNote message={state.error} />
      {invoice ? <input type="hidden" name="id" value={invoice.id} /> : null}
      {defaults.milestone_id ? <input type="hidden" name="milestone_id" value={defaults.milestone_id} /> : null}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Invoice number" name="number" defaultValue={invoice?.number ?? suggestedNumber} required />
        <Select
          label="Client"
          name="client_id"
          required
          empty="Pick a client"
          options={clients.map((c) => ({ value: c.value, label: c.label }))}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <Select
          label="Project (optional)"
          name="project_id"
          empty="None"
          options={projectOptions.map((p) => ({ value: p.value, label: p.label }))}
          defaultValue={String(invoice?.project_id ?? defaults.project_id ?? '')}
        />
        <Input label="Issue date" name="issue_date" type="date" defaultValue={invoice?.issue_date ?? defaults.issue_date} required />
        <Input label="Due date" name="due_date" type="date" defaultValue={invoice?.due_date ?? defaults.due_date} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" name="status" options={INVOICE_STATUSES} value={status} onChange={(e) => setStatus(e.target.value)} />
          {status === 'Paid' ? (
            <Input label="Paid on" name="paid_on" type="date" defaultValue={invoice?.paid_on ?? defaults.issue_date} />
          ) : null}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-medium text-text-muted">Lines</div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_90px_140px_120px_auto] sm:items-end sm:border-0 sm:p-0">
              <Field label="Description" className="col-span-2 sm:col-span-1">
                <input className={inputCls} value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} placeholder="Website build, first half" />
              </Field>
              <Field label="Qty">
                <input className={inputCls} type="number" step="any" min="0" value={it.qty} onChange={(e) => setItem(idx, { qty: Number(e.target.value) })} />
              </Field>
              <Field label="Rate (₹)">
                <input className={inputCls} type="number" step="any" min="0" value={it.rate} onChange={(e) => setItem(idx, { rate: Number(e.target.value) })} />
              </Field>
              <div className="self-end pb-2 text-right text-[15px] tabular-nums text-text-primary sm:pb-2.5">
                {money.format((Number(it.qty) || 0) * (Number(it.rate) || 0))}
              </div>
              <button
                type="button"
                className="self-end pb-2 text-[13px] text-text-muted hover:text-text-primary sm:pb-2.5"
                onClick={() => setItems((list) => (list.length > 1 ? list.filter((_, i) => i !== idx) : list))}
                aria-label={`Remove line ${idx + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="a-btn a-btn-quiet a-btn-sm mt-3" onClick={() => setItems((l) => [...l, { description: '', qty: 1, rate: 0 }])}>
          Add a line
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Tax name" name="tax_label" defaultValue={invoice?.tax_label ?? ''} placeholder="GST" hint="Leave empty if you don't charge tax." />
          <Field label="Tax %">
            <input className={inputCls} name="tax_percent" type="number" step="any" min="0" max="100" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
          </Field>
        </div>
        <dl className="space-y-1 rounded-xl bg-surface/60 p-4 text-[15px] tabular-nums">
          <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd>{money.format(totals.subtotal)}</dd></div>
          {tax ? <div className="flex justify-between"><dt className="text-text-muted">Tax</dt><dd>{money.format(totals.tax)}</dd></div> : null}
          <div className="flex justify-between border-t border-border pt-1 font-semibold"><dt>Total</dt><dd>{money.format(totals.total)}</dd></div>
        </dl>
      </div>

      <Textarea label="Note on the invoice (optional)" name="notes" defaultValue={invoice?.notes ?? ''} rows={3} placeholder="50% advance as agreed in the quote." />

      <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
        {pending ? 'Saving…' : invoice ? 'Save invoice' : 'Create invoice'}
      </button>
    </form>
  )
}
