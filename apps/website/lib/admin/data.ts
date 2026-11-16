import { requireAdmin } from '@/lib/admin/auth'
import { listRows } from '@/lib/admin/store'
import type { Client, Lead, Project } from '@/lib/admin/types'

/**
 * Loads everything the admin shows. A one-person studio has hundreds of rows
 * at most, so pages load whole tables and filter in code: simpler, and one
 * round trip per table.
 */
export async function loadAll() {
  await requireAdmin()
  const [clients, leads, projects, invoices, documents, tasks] = await Promise.all([
    listRows('admin_clients', { order: { column: 'name', ascending: true } }),
    listRows('admin_leads'),
    listRows('admin_projects'),
    listRows('admin_invoices', { order: { column: 'issue_date', ascending: false } }),
    listRows('admin_documents'),
    listRows('admin_tasks'),
  ])
  return { clients, leads, projects, invoices, documents, tasks }
}

export function namer(clients: Client[], projects: Project[], leads: Lead[] = []) {
  const c = new Map(clients.map((x) => [x.id, x.name]))
  const p = new Map(projects.map((x) => [x.id, x.name]))
  const l = new Map(leads.map((x) => [x.id, x.company ? `${x.name}, ${x.company}` : x.name]))
  return {
    client: (id: number | null | undefined) => (id ? (c.get(id) ?? '') : ''),
    project: (id: number | null | undefined) => (id ? (p.get(id) ?? '') : ''),
    lead: (id: number | null | undefined) => (id ? (l.get(id) ?? '') : ''),
  }
}

export function clientOptions(clients: Client[]) {
  return clients.map((c) => ({ value: c.id, label: c.name }))
}

export function projectOptions(projects: Project[], clients: Client[]) {
  const names = new Map(clients.map((c) => [c.id, c.name]))
  return projects.map((p) => ({
    value: p.id,
    label: p.client_id && names.get(p.client_id) ? `${p.name} (${names.get(p.client_id)})` : p.name,
    clientId: p.client_id,
  }))
}

export function leadOptions(leads: Lead[]) {
  return leads.map((l) => ({ value: l.id, label: l.company ? `${l.name}, ${l.company}` : l.name }))
}

/** Next free invoice number, e.g. NPV-2026-004. */
export function nextInvoiceNumber(existing: string[], prefix: string, year: string) {
  const base = `${prefix || 'NPV-'}${year}-`
  const used = new Set(existing)
  let n = existing.filter((x) => x.startsWith(base)).length + 1
  while (used.has(`${base}${String(n).padStart(3, '0')}`)) n++
  return `${base}${String(n).padStart(3, '0')}`
}
