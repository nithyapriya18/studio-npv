/**
 * Studio admin (/admin): the private side of studionpv.com where leads,
 * clients, projects, work, invoices and documents are tracked. Only the
 * owner can sign in. Tables are created by supabase/admin.sql.
 */

export const LEAD_STAGES = ['New', 'Contacted', 'Call booked', 'Proposal sent', 'Won', 'Lost', 'Spam'] as const
export const OPEN_STAGES: readonly string[] = ['New', 'Contacted', 'Call booked', 'Proposal sent']
export const LEAD_SOURCES = [
  'Website form',
  'Referral',
  'LinkedIn',
  'Instagram',
  'WhatsApp',
  'Cold outreach',
  'Event',
  'Other',
] as const

export const PROJECT_KINDS = ['Website', 'App', 'Social media', 'Drawings', 'Audit', 'Other'] as const
export const PROJECT_STATUSES = ['Planning', 'In progress', 'With client', 'Live', 'On hold', 'Done'] as const
export const ACTIVE_PROJECT_STATUSES: readonly string[] = ['Planning', 'In progress', 'With client']
/** How a project is going, shown as a tag next to it. */
export const PROJECT_HEALTH = ['On track', 'At risk', 'Waiting on client', 'Internal'] as const

export const TASK_STATUSES = ['To do', 'Doing', 'Done'] as const

export const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Cancelled'] as const

export const DOCUMENT_KINDS = ['Deck', 'Quote', 'Proposal', 'Audit', 'Brief', 'Contract', 'Design', 'Other'] as const

export interface Client {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  city: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Lead {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  source: string
  stage: string
  value: number | null
  next_step: string | null
  follow_up_on: string | null
  notes: string | null
  client_id: number | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  client_id: number | null
  name: string
  kind: string
  status: string
  price: number | null
  start_on: string | null
  due_on: string | null
  live_url: string | null
  repo_url: string | null
  notes: string | null
  summary?: string | null
  health?: string | null
  budget_hours?: number | null
  created_at: string
}

export interface Milestone {
  id: number
  project_id: number
  title: string
  due_on: string | null
  amount: number | null
  invoice_id: number | null
  done_on: string | null
  position: number
  created_at: string
}

export const IDEA_STATUSES = ['Parked', 'Exploring', 'Building', 'Dropped'] as const

export interface Idea {
  id: number
  title: string
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: number
  project_id: number | null
  task_id: number | null
  on_date: string
  hours: number
  note: string | null
  created_at: string
}

export interface InvoiceItem {
  description: string
  qty: number
  rate: number
}

export interface Invoice {
  id: number
  number: string
  client_id: number
  project_id: number | null
  issue_date: string
  due_date: string | null
  status: string
  items: InvoiceItem[]
  tax_label: string | null
  tax_percent: number
  notes: string | null
  paid_on: string | null
  created_at: string
}

export interface Doc {
  id: number
  title: string
  kind: string
  url: string
  client_id: number | null
  lead_id: number | null
  project_id: number | null
  notes: string | null
  created_at: string
}

export interface Task {
  id: number
  title: string
  project_id: number | null
  status: string
  due_on: string | null
  hours: number
  notes: string | null
  done_at: string | null
  created_at: string
}

export interface Note {
  id: number
  lead_id: number | null
  client_id: number | null
  project_id: number | null
  body: string
  created_at: string
}

export interface Setting {
  key: string
  value: string | null
}

export interface Tables {
  admin_clients: Client
  admin_leads: Lead
  admin_projects: Project
  admin_invoices: Invoice
  admin_documents: Doc
  admin_tasks: Task
  admin_notes: Note
  admin_milestones: Milestone
  admin_time_entries: TimeEntry
  admin_ideas: Idea
}
export type TableName = keyof Tables

/** Invoice "from" details and payment info, edited on /admin/settings. */
export const SETTING_FIELDS = [
  { key: 'business_name', label: 'Business name', placeholder: 'Studio NPV' },
  { key: 'owner_name', label: 'Your name', placeholder: 'Nithyapriya Veeraraghavan' },
  { key: 'address', label: 'Address', placeholder: 'Street, area\nBengaluru 560000, Karnataka', multiline: true },
  { key: 'email', label: 'Email', placeholder: 'hello@studionpv.com' },
  { key: 'phone', label: 'Phone', placeholder: '' },
  { key: 'udyam', label: 'Udyam number', placeholder: 'UDYAM-…' },
  { key: 'gstin', label: 'GSTIN (leave empty if not registered)', placeholder: '' },
  { key: 'pan', label: 'PAN', placeholder: '' },
  {
    key: 'payment',
    label: 'Payment details (bank account, IFSC, UPI)',
    placeholder: 'Account name: …\nAccount number: …\nIFSC: …\nUPI: …',
    multiline: true,
  },
  { key: 'invoice_prefix', label: 'Invoice number prefix', placeholder: 'NPV-' },
  { key: 'invoice_footer', label: 'Note at the bottom of every invoice', placeholder: 'Thank you for your business.', multiline: true },
] as const

export type SettingKey = (typeof SETTING_FIELDS)[number]['key']
