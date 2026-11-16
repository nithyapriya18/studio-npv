import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows } from '@/lib/admin/store'
import { clientOptions } from '@/lib/admin/data'
import { ProjectForm } from '@/components/admin/forms'
import { Card, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Add project' }

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  await requireAdmin()
  const { client } = await searchParams
  const clients = await listRows('admin_clients', { order: { column: 'name', ascending: true } })
  return (
    <>
      <PageHeader title="Add project" />
      <Card>
        <ProjectForm clients={clientOptions(clients)} clientId={Number(client) || undefined} />
      </Card>
    </>
  )
}
