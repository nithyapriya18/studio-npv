'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  SESSION_COOKIE,
  authConfigured,
  makeSessionToken,
  requireAdmin,
  sessionCookieOptions,
  verifyPassword,
} from '@/lib/admin/auth'
import { deleteRow, getRow, getSettings, insertRow, listRows, saveSettings, updateRow } from '@/lib/admin/store'
import {
  DOCUMENT_KINDS,
  INVOICE_STATUSES,
  LEAD_SOURCES,
  LEAD_STAGES,
  PROJECT_HEALTH,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  SETTING_FIELDS,
  TASK_STATUSES,
  type InvoiceItem,
} from '@/lib/admin/types'
import { addDays, today } from '@/lib/admin/format'
import { checkAdminLoginLimit, clientIp } from '@/lib/rate-limit'
import { siteConfig } from '@/config'

// ---------- form helpers ----------

function str(fd: FormData, key: string, max = 2000): string | null {
  const v = fd.get(key)
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}
function required(fd: FormData, key: string, label: string, max = 300) {
  const v = str(fd, key, max)
  if (!v) throw new Error(`${label} is required.`)
  return v
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key, 40)
  if (!v) return null
  const n = Number(v.replace(/[₹,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
function date(fd: FormData, key: string): string | null {
  const v = str(fd, key, 10)
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}
function id(fd: FormData, key = 'id'): number | null {
  const n = Number(fd.get(key))
  return Number.isInteger(n) && n > 0 ? n : null
}
function pick<T extends readonly string[]>(fd: FormData, key: string, options: T, fallback: T[number]): T[number] {
  const v = str(fd, key, 60)
  return v && (options as readonly string[]).includes(v) ? v : fallback
}
function link(fd: FormData, key: string): string | null {
  const v = str(fd, key, 1000)
  if (!v) return null
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}
/** Only ever redirect back inside the admin. */
function back(fd: FormData, fallback: string) {
  const v = str(fd, 'back', 300)
  return v && v.startsWith('/admin') && !v.startsWith('//') ? v : fallback
}
function done(path: string): never {
  revalidatePath('/admin', 'layout')
  redirect(path)
}

// ---------- sign in / out ----------

export type SignInState = { error?: string }

export async function signIn(_prev: SignInState, fd: FormData): Promise<SignInState> {
  if (!authConfigured()) return { error: 'Sign-in is not set up yet. Run npm run admin:setup.' }
  const h = await headers()
  const ip = clientIp(h)
  const limit = await checkAdminLoginLimit(ip)
  if (!limit.success) return { error: 'Too many tries. Wait 15 minutes and try again.' }

  const password = typeof fd.get('password') === 'string' ? (fd.get('password') as string) : ''
  if (!verifyPassword(password.slice(0, 200))) return { error: 'That password is not right.' }

  const token = makeSessionToken()
  if (!token) return { error: 'Sign-in is not set up yet. Run npm run admin:setup.' }
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions)
  await alertSignIn(ip, h.get('user-agent') ?? 'unknown browser')
  redirect('/admin')
}

/** An email on every sign-in, so a sign-in that wasn't you is noticed. */
async function alertSignIn(ip: string, userAgent: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || process.env.NODE_ENV !== 'production') return
  const to = process.env.CONTACT_TO_EMAIL ?? siteConfig.email
  const when = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date())
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${siteConfig.name} <${siteConfig.email}>`,
        to: [to],
        subject: 'New sign-in to your studio admin',
        text: [
          `Someone signed in to ${siteConfig.url}/admin on ${when} (India time).`,
          '',
          `IP address: ${ip}`,
          `Browser: ${userAgent}`,
          '',
          'If this was not you, change your password straight away: run npm run admin:setup,',
          'which also signs every browser out.',
        ].join('\n'),
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // The sign-in still works if the email fails.
  }
}

export async function signOut() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  redirect('/admin/login')
}

// ---------- leads ----------

export async function saveLead(fd: FormData) {
  await requireAdmin()
  const leadId = id(fd)
  const values = {
    name: required(fd, 'name', 'Name'),
    company: str(fd, 'company', 200),
    email: str(fd, 'email', 200),
    phone: str(fd, 'phone', 50),
    source: pick(fd, 'source', LEAD_SOURCES, 'Other'),
    stage: pick(fd, 'stage', LEAD_STAGES, 'New'),
    value: num(fd, 'value'),
    next_step: str(fd, 'next_step', 300),
    follow_up_on: date(fd, 'follow_up_on'),
    notes: str(fd, 'notes', 10000),
  }
  if (leadId) {
    await updateRow('admin_leads', leadId, values)
    done(back(fd, `/admin/leads/${leadId}`))
  }
  const row = await insertRow('admin_leads', values)
  done(`/admin/leads/${row.id}`)
}

export async function setLeadStage(fd: FormData) {
  await requireAdmin()
  const leadId = id(fd)
  if (!leadId) return
  await updateRow('admin_leads', leadId, { stage: pick(fd, 'stage', LEAD_STAGES, 'New') })
  done(back(fd, '/admin/leads'))
}

/** Marks a lead Won and creates (or links) the client record for it. */
export async function convertLead(fd: FormData) {
  await requireAdmin()
  const leadId = id(fd)
  const lead = leadId ? await getRow('admin_leads', leadId) : null
  if (!lead) throw new Error('Lead not found.')
  let clientId = lead.client_id
  if (!clientId) {
    const client = await insertRow('admin_clients', {
      name: lead.company || lead.name,
      contact_name: lead.company ? lead.name : null,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    })
    clientId = client.id
  }
  await updateRow('admin_leads', lead.id, { stage: 'Won', client_id: clientId })
  done(`/admin/clients/${clientId}`)
}

export async function deleteLead(fd: FormData) {
  await requireAdmin()
  const leadId = id(fd)
  if (leadId) await deleteRow('admin_leads', leadId)
  done('/admin/leads')
}

// ---------- clients ----------

export async function saveClient(fd: FormData) {
  await requireAdmin()
  const clientId = id(fd)
  const values = {
    name: required(fd, 'name', 'Name'),
    contact_name: str(fd, 'contact_name', 200),
    email: str(fd, 'email', 200),
    phone: str(fd, 'phone', 50),
    website: link(fd, 'website'),
    city: str(fd, 'city', 100),
    address: str(fd, 'address', 1000),
    notes: str(fd, 'notes', 10000),
  }
  if (clientId) {
    await updateRow('admin_clients', clientId, values)
    done(back(fd, `/admin/clients/${clientId}`))
  }
  const row = await insertRow('admin_clients', values)
  done(`/admin/clients/${row.id}`)
}

export async function deleteClient(fd: FormData) {
  await requireAdmin()
  const clientId = id(fd)
  if (clientId) {
    const invoices = await listRows('admin_invoices', { eq: { client_id: clientId } })
    if (invoices.length) {
      done(`/admin/clients/${clientId}?error=${encodeURIComponent('This client has invoices. Delete those invoices first.')}`)
    }
    await deleteRow('admin_clients', clientId)
  }
  done('/admin/clients')
}

// ---------- projects ----------

export async function saveProject(fd: FormData) {
  await requireAdmin()
  const projectId = id(fd)
  const values = {
    name: required(fd, 'name', 'Project name'),
    client_id: id(fd, 'client_id'),
    kind: pick(fd, 'kind', PROJECT_KINDS, 'Website'),
    status: pick(fd, 'status', PROJECT_STATUSES, 'Planning'),
    price: num(fd, 'price'),
    start_on: date(fd, 'start_on'),
    due_on: date(fd, 'due_on'),
    live_url: link(fd, 'live_url'),
    repo_url: link(fd, 'repo_url'),
    notes: str(fd, 'notes', 10000),
    // Added by supabase/admin-2.sql; only sent when the form has them.
    ...(fd.has('health')
      ? {
          health: pick(fd, 'health', PROJECT_HEALTH, 'On track'),
          summary: str(fd, 'summary', 200),
          budget_hours: num(fd, 'budget_hours'),
        }
      : {}),
  }
  if (projectId) {
    await updateRow('admin_projects', projectId, values)
    done(back(fd, `/admin/projects/${projectId}`))
  }
  const row = await insertRow('admin_projects', values)
  done(`/admin/projects/${row.id}`)
}

export async function deleteProject(fd: FormData) {
  await requireAdmin()
  const projectId = id(fd)
  if (projectId) await deleteRow('admin_projects', projectId)
  done('/admin/projects')
}

// ---------- tasks (work) ----------

export async function saveTask(fd: FormData) {
  await requireAdmin()
  const taskId = id(fd)
  const status = pick(fd, 'status', TASK_STATUSES, 'To do')
  const values = {
    title: required(fd, 'title', 'Task'),
    project_id: id(fd, 'project_id'),
    status,
    due_on: date(fd, 'due_on'),
    hours: Math.max(0, num(fd, 'hours') ?? 0),
    notes: str(fd, 'notes', 5000),
    done_at: status === 'Done' ? new Date().toISOString() : null,
  }
  if (taskId) {
    const existing = await getRow('admin_tasks', taskId)
    if (existing?.status === 'Done' && status === 'Done') values.done_at = existing.done_at
    await updateRow('admin_tasks', taskId, values)
  } else {
    await insertRow('admin_tasks', values)
  }
  done(back(fd, '/admin/work'))
}

export async function setTaskStatus(fd: FormData) {
  await requireAdmin()
  const taskId = id(fd)
  if (!taskId) return
  const status = pick(fd, 'status', TASK_STATUSES, 'To do')
  await updateRow('admin_tasks', taskId, {
    status,
    done_at: status === 'Done' ? new Date().toISOString() : null,
  })
  done(back(fd, '/admin/work'))
}

/** Adds time to a task's running total. */
export async function logHours(fd: FormData) {
  await requireAdmin()
  const taskId = id(fd)
  const task = taskId ? await getRow('admin_tasks', taskId) : null
  const add = num(fd, 'add_hours')
  if (task && add && add > 0 && add <= 24) {
    await updateRow('admin_tasks', task.id, { hours: (Number(task.hours) || 0) + add })
    await insertRow('admin_time_entries', { project_id: task.project_id, task_id: task.id, on_date: today(), hours: add, note: task.title })
  }
  done(back(fd, '/admin/work'))
}

export async function deleteTask(fd: FormData) {
  await requireAdmin()
  const taskId = id(fd)
  if (taskId) await deleteRow('admin_tasks', taskId)
  done(back(fd, '/admin/work'))
}

// ---------- invoices ----------

function parseItems(raw: string | null): InvoiceItem[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('The invoice lines could not be read.')
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .slice(0, 50)
    .map((i) => ({
      description: String(i?.description ?? '').trim().slice(0, 500),
      qty: Number(i?.qty) || 0,
      rate: Number(i?.rate) || 0,
    }))
    .filter((i) => i.description || i.rate)
}

export type InvoiceFormState = { error?: string }

export async function saveInvoice(_prev: InvoiceFormState, fd: FormData): Promise<InvoiceFormState> {
  await requireAdmin()
  const invoiceId = id(fd)
  const clientId = id(fd, 'client_id')
  if (!clientId) return { error: 'Pick a client for this invoice.' }
  const number = str(fd, 'number', 60)
  if (!number) return { error: 'Add an invoice number.' }
  const status = pick(fd, 'status', INVOICE_STATUSES, 'Draft')
  const values = {
    number,
    client_id: clientId,
    project_id: id(fd, 'project_id'),
    issue_date: date(fd, 'issue_date') ?? today(),
    due_date: date(fd, 'due_date'),
    status,
    items: parseItems(str(fd, 'items', 50000)),
    tax_label: str(fd, 'tax_label', 60),
    tax_percent: Math.max(0, Math.min(100, num(fd, 'tax_percent') ?? 0)),
    notes: str(fd, 'notes', 5000),
    paid_on: status === 'Paid' ? (date(fd, 'paid_on') ?? today()) : null,
  }
  const clash = (await listRows('admin_invoices', { eq: { number: values.number } })).find(
    (i) => i.id !== invoiceId,
  )
  if (clash) return { error: `Invoice number ${values.number} is already used by another invoice.` }
  if (!values.items.length) return { error: 'Add at least one line to the invoice.' }
  if (invoiceId) {
    await updateRow('admin_invoices', invoiceId, values)
    done(`/admin/invoices/${invoiceId}`)
  }
  const row = await insertRow('admin_invoices', values)
  const milestoneId = id(fd, 'milestone_id')
  if (milestoneId) await updateRow('admin_milestones', milestoneId, { invoice_id: row.id })
  done(`/admin/invoices/${row.id}`)
}

export async function setInvoiceStatus(fd: FormData) {
  await requireAdmin()
  const invoiceId = id(fd)
  if (!invoiceId) return
  const status = pick(fd, 'status', INVOICE_STATUSES, 'Draft')
  await updateRow('admin_invoices', invoiceId, { status, paid_on: status === 'Paid' ? today() : null })
  done(back(fd, `/admin/invoices/${invoiceId}`))
}

export async function deleteInvoice(fd: FormData) {
  await requireAdmin()
  const invoiceId = id(fd)
  if (invoiceId) await deleteRow('admin_invoices', invoiceId)
  done('/admin/invoices')
}

// ---------- documents ----------

export async function saveDocument(fd: FormData) {
  await requireAdmin()
  const docId = id(fd)
  const url = link(fd, 'url')
  if (!url) throw new Error('Add the link to the document.')
  const values = {
    title: required(fd, 'title', 'Title'),
    kind: pick(fd, 'kind', DOCUMENT_KINDS, 'Deck'),
    url,
    client_id: id(fd, 'client_id'),
    lead_id: id(fd, 'lead_id'),
    project_id: id(fd, 'project_id'),
    notes: str(fd, 'notes', 2000),
  }
  if (docId) await updateRow('admin_documents', docId, values)
  else await insertRow('admin_documents', values)
  done(back(fd, '/admin/documents'))
}

export async function deleteDocument(fd: FormData) {
  await requireAdmin()
  const docId = id(fd)
  if (docId) await deleteRow('admin_documents', docId)
  done(back(fd, '/admin/documents'))
}

// ---------- notes ----------

export async function addNote(fd: FormData) {
  await requireAdmin()
  const body = str(fd, 'body', 5000)
  const target = {
    lead_id: id(fd, 'lead_id'),
    client_id: id(fd, 'client_id'),
    project_id: id(fd, 'project_id'),
  }
  if (body && (target.lead_id || target.client_id || target.project_id)) {
    await insertRow('admin_notes', { ...target, body })
  }
  done(back(fd, '/admin'))
}

export async function deleteNote(fd: FormData) {
  await requireAdmin()
  const noteId = id(fd)
  if (noteId) await deleteRow('admin_notes', noteId)
  done(back(fd, '/admin'))
}

// ---------- settings ----------

export async function saveSettingsAction(fd: FormData) {
  await requireAdmin()
  const values: Record<string, string> = {}
  for (const f of SETTING_FIELDS) values[f.key] = str(fd, f.key, 2000) ?? ''
  await saveSettings(values)
  done('/admin/settings?saved=1')
}

// ---------- milestones ----------

export async function saveMilestone(fd: FormData) {
  await requireAdmin()
  const milestoneId = id(fd)
  const projectId = id(fd, 'project_id')
  if (!projectId) return
  const values = {
    project_id: projectId,
    title: required(fd, 'title', 'Milestone', 200),
    due_on: date(fd, 'due_on'),
    amount: num(fd, 'amount'),
  }
  if (milestoneId) await updateRow('admin_milestones', milestoneId, values)
  else await insertRow('admin_milestones', { ...values, position: 0 })
  done(back(fd, `/admin/projects/${projectId}`))
}

export async function deleteMilestone(fd: FormData) {
  await requireAdmin()
  const milestoneId = id(fd)
  if (milestoneId) await deleteRow('admin_milestones', milestoneId)
  done(back(fd, '/admin/projects'))
}

// ---------- ticking things off (Today list, milestones) ----------

/** One checkbox for tasks, lead follow-ups and milestones. */
export async function checkItem(fd: FormData) {
  await requireAdmin()
  const itemId = id(fd)
  const kind = str(fd, 'kind', 20)
  const checked = fd.get('checked') === '1'
  if (!itemId) return
  if (kind === 'task') {
    await updateRow('admin_tasks', itemId, { status: checked ? 'Done' : 'To do', done_at: checked ? new Date().toISOString() : null })
  } else if (kind === 'milestone') {
    await updateRow('admin_milestones', itemId, { done_on: checked ? today() : null })
  } else if (kind === 'lead' && checked) {
    // Followed up: move a new lead on, log it, and check back in three days.
    const lead = await getRow('admin_leads', itemId)
    if (lead) {
      await updateRow('admin_leads', itemId, {
        stage: lead.stage === 'New' ? 'Contacted' : lead.stage,
        follow_up_on: addDays(today(), 3),
      })
      await insertRow('admin_notes', { lead_id: itemId, body: 'Followed up.' })
    }
  }
  done(back(fd, '/admin'))
}

// ---------- time ----------

export async function logTime(fd: FormData) {
  await requireAdmin()
  const hours = num(fd, 'hours')
  if (!hours || hours <= 0 || hours > 24) done(back(fd, '/admin/time'))
  await insertRow('admin_time_entries', {
    project_id: id(fd, 'project_id'),
    task_id: null,
    on_date: date(fd, 'on_date') ?? today(),
    hours: Math.round(hours! * 100) / 100,
    note: str(fd, 'note', 300),
  })
  done(back(fd, '/admin/time'))
}

export async function deleteTime(fd: FormData) {
  await requireAdmin()
  const entryId = id(fd)
  if (entryId) await deleteRow('admin_time_entries', entryId)
  done(back(fd, '/admin/time'))
}

/** The running timer lives in settings, so it survives closing the browser. */
export async function startTimer(fd: FormData) {
  await requireAdmin()
  await saveSettings({
    timer_project: String(id(fd, 'project_id') ?? ''),
    timer_note: str(fd, 'note', 200) ?? '',
    timer_started: new Date().toISOString(),
  })
  done(back(fd, '/admin'))
}

export async function stopTimer(fd: FormData) {
  await requireAdmin()
  const s = await getSettings()
  if (s.timer_started) {
    const minutes = (Date.now() - Date.parse(s.timer_started)) / 60000
    // Round to the nearest quarter hour, at least a quarter.
    const hours = Math.max(0.25, Math.round(minutes / 15) / 4)
    const projectId = Number(s.timer_project) || null
    if (minutes >= 1) {
      await insertRow('admin_time_entries', { project_id: projectId, task_id: null, on_date: today(), hours: Math.min(hours, 24), note: s.timer_note || null })
    }
  }
  await saveSettings({ timer_project: '', timer_note: '', timer_started: '' })
  done(back(fd, '/admin'))
}
