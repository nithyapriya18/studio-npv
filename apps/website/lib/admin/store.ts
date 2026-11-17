import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { TableName, Tables } from '@/lib/admin/types'

/**
 * Where the admin data lives.
 *
 * Production: the studio's Supabase project, using the SECRET key only. The
 * admin tables have row level security on and no policies, so the public
 * (publishable) key the site ships to browsers can't read them. Never fall
 * back to the publishable key here.
 *
 * Local development only: with ADMIN_DEV_STORE=1 (and never in production)
 * the data goes to a JSON file instead, so the admin can be tried without
 * touching the live database.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const devStore = process.env.ADMIN_DEV_STORE === '1' && process.env.NODE_ENV !== 'production'

let client: SupabaseClient | null = null
function supabase() {
  if (!url || !secret) return null
  client ??= createClient(url, secret, { auth: { persistSession: false } })
  return client
}

export function storeMode(): 'supabase' | 'dev' | 'missing' {
  if (devStore) return 'dev'
  return url && secret ? 'supabase' : 'missing'
}

type Row<T extends TableName> = Tables[T]
type Filter = Record<string, string | number | null>
interface ListOptions {
  eq?: Filter
  order?: { column: string; ascending?: boolean }
}

/** Tables added by supabase/admin-2.sql: until it has been run, read them as empty. */
const OPTIONAL_TABLES = new Set<string>(['admin_milestones', 'admin_time_entries', 'admin_ideas'])
const missingTable = (message: string) => /relation .* does not exist|Could not find the table/i.test(message)

function fail(what: string, message: string): never {
  const hint = /relation .* does not exist|Could not find the table/i.test(message)
    ? ' The admin tables are missing: run supabase/admin.sql in the Supabase SQL editor.'
    : ''
  throw new Error(`Couldn't ${what}: ${message}.${hint}`)
}

// ---------- dev JSON file ----------

const DEV_FILE = path.join(process.cwd(), '.admin-dev-data.json')
interface DevData {
  seq: Record<string, number>
  rows: Record<string, Record<string, unknown>[]>
  settings: Record<string, string>
}
async function readDev(): Promise<DevData> {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, 'utf8')) as DevData
  } catch {
    return { seq: {}, rows: {}, settings: {} }
  }
}
async function writeDev(data: DevData) {
  await fs.writeFile(DEV_FILE, JSON.stringify(data, null, 2))
}

function sortRows<T>(rows: T[], order?: ListOptions['order']) {
  if (!order) return rows
  const dir = order.ascending === false ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = (a as Record<string, unknown>)[order.column]
    const y = (b as Record<string, unknown>)[order.column]
    if (x === y) return 0
    if (x === null || x === undefined) return 1
    if (y === null || y === undefined) return -1
    return (x as string | number) < (y as string | number) ? -dir : dir
  })
}

// ---------- public API ----------

function db() {
  const s = supabase()
  if (!s) throw new Error('The admin database is not connected. Add SUPABASE_SECRET_KEY (run npm run admin:setup).')
  return s
}


/**
 * Supabase now and then rejects a request with "JWT issued at future": with
 * the sb_secret key its gateway stamps a short-lived token with its own
 * clock, and the database's clock can lag behind it. The same request works
 * once the clocks line up, which has taken longer than 1.5 seconds in
 * production (17 Nov 2026), so keep trying for up to about 8 seconds. Such a
 * request never ran, so it is safe to retry, reads and writes alike. Reads
 * also retry once on a network blip.
 */
type Result<D> = { data: D | null; error: { message: string } | null }
const clockSkew = (m: string) => /JWT issued at future|JWT.*not yet valid/i.test(m)
const blip = (m: string) => /fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(m)
const SKEW_WAITS_MS = [300, 600, 1000, 1500, 2000, 2500]
async function run<D>(make: () => PromiseLike<Result<D>>, read = false): Promise<Result<D>> {
  let res = await make()
  for (let attempt = 1; attempt <= SKEW_WAITS_MS.length && res.error; attempt++) {
    const m = res.error.message
    if (!clockSkew(m) && !(read && blip(m) && attempt === 1)) break
    await new Promise((r) => setTimeout(r, SKEW_WAITS_MS[attempt - 1]))
    res = await make()
  }
  if (res.error && clockSkew(res.error.message)) console.error('[admin] Supabase clock skew outlasted the retries:', res.error.message)
  return res
}

export async function listRows<T extends TableName>(table: T, opts: ListOptions = {}): Promise<Row<T>[]> {
  if (devStore) {
    const data = await readDev()
    let rows = (data.rows[table] ?? []) as unknown as Row<T>[]
    for (const [k, v] of Object.entries(opts.eq ?? {})) {
      rows = rows.filter((r) => (r as unknown as Record<string, unknown>)[k] === v)
    }
    return sortRows(rows, opts.order ?? { column: 'id', ascending: false })
  }
  const order = opts.order ?? { column: 'id', ascending: false }
  const query = () => {
    let q = db().from(table).select('*')
    for (const [k, v] of Object.entries(opts.eq ?? {})) q = v === null ? q.is(k, null) : q.eq(k, v)
    return q.order(order.column, { ascending: order.ascending !== false, nullsFirst: false })
  }
  const { data, error } = await run(query, true)
  if (error) {
    if (OPTIONAL_TABLES.has(table) && missingTable(error.message)) return []
    fail(`load ${table}`, error.message)
  }
  return (data ?? []) as Row<T>[]
}

export async function getRow<T extends TableName>(table: T, id: number): Promise<Row<T> | null> {
  if (!Number.isInteger(id) || id <= 0) return null
  if (devStore) {
    const data = await readDev()
    return ((data.rows[table] ?? []).find((r) => r.id === id) as unknown as Row<T>) ?? null
  }
  const { data, error } = await run(() => db().from(table).select('*').eq('id', id).maybeSingle(), true)
  if (error) fail(`load ${table}`, error.message)
  return (data as unknown as Row<T>) ?? null
}

export async function insertRow<T extends TableName>(table: T, values: Partial<Row<T>>): Promise<Row<T>> {
  if (devStore) {
    const data = await readDev()
    const id = (data.seq[table] ?? 0) + 1
    data.seq[table] = id
    const now = new Date().toISOString()
    const row = { ...values, id, created_at: now, ...(table === 'admin_leads' || table === 'admin_ideas' ? { updated_at: now } : {}) }
    data.rows[table] = [...(data.rows[table] ?? []), row]
    await writeDev(data)
    return row as unknown as Row<T>
  }
  const { data, error } = await run(() => db().from(table).insert(values as Record<string, unknown>).select('*').single())
  if (error) fail(`save to ${table}`, error.message)
  return data as unknown as Row<T>
}

export async function updateRow<T extends TableName>(table: T, id: number, values: Partial<Row<T>>) {
  const patch = table === 'admin_leads' || table === 'admin_ideas' ? { ...values, updated_at: new Date().toISOString() } : values
  if (devStore) {
    const data = await readDev()
    data.rows[table] = (data.rows[table] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r))
    await writeDev(data)
    return
  }
  const { error } = await run(() => db().from(table).update(patch as Record<string, unknown>).eq('id', id))
  if (error) fail(`update ${table}`, error.message)
}

export async function deleteRow(table: TableName, id: number) {
  if (devStore) {
    const data = await readDev()
    data.rows[table] = (data.rows[table] ?? []).filter((r) => r.id !== id)
    // Mirror the foreign keys in supabase/admin.sql: notes go with their
    // parent; other links are cleared.
    const links: Record<string, string> = {
      admin_clients: 'client_id',
      admin_leads: 'lead_id',
      admin_projects: 'project_id',
      admin_tasks: 'task_id',
      admin_invoices: 'invoice_id',
    }
    const col = links[table]
    if (col) {
      for (const t of Object.keys(data.rows)) {
        if (t === 'admin_notes' || (t === 'admin_milestones' && col === 'project_id')) data.rows[t] = data.rows[t].filter((r) => r[col] !== id)
        else data.rows[t] = data.rows[t].map((r) => (r[col] === id ? { ...r, [col]: null } : r))
      }
    }
    await writeDev(data)
    return
  }
  const { error } = await run(() => db().from(table).delete().eq('id', id))
  if (error) {
    if (/foreign key/i.test(error.message)) {
      throw new Error('This still has invoices attached. Delete or move those invoices first.')
    }
    fail(`delete from ${table}`, error.message)
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  if (devStore) return (await readDev()).settings
  const { data, error } = await run(() => db().from('admin_settings').select('key, value'), true)
  if (error) fail('load settings', error.message)
  return Object.fromEntries((data ?? []).map((r) => [r.key as string, (r.value as string) ?? '']))
}

export async function saveSettings(values: Record<string, string>) {
  if (devStore) {
    const data = await readDev()
    data.settings = { ...data.settings, ...values }
    await writeDev(data)
    return
  }
  const rows = Object.entries(values).map(([key, value]) => ({ key, value }))
  const { error } = await run(() => db().from('admin_settings').upsert(rows))
  if (error) fail('save settings', error.message)
}

/**
 * Saves a contact-form enquiry as a New lead to follow up today. Called by
 * /api/contact after the email has gone out; never throws, so the form keeps
 * working even if the database is down or not set up.
 */
export async function recordWebsiteLead(enquiry: { name: string; email: string; company: string; message: string }) {
  if (storeMode() === 'missing') return
  try {
    await insertRow('admin_leads', {
      name: enquiry.name,
      email: enquiry.email,
      company: enquiry.company || null,
      source: 'Website form',
      stage: 'New',
      next_step: 'Reply to their enquiry',
      follow_up_on: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
      notes: enquiry.message,
    })
  } catch (err) {
    console.error('[contact] could not save the lead:', err instanceof Error ? err.message : err)
  }
}
