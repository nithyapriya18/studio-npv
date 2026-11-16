import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { ClientForm } from '@/components/admin/forms'
import { Card, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Add client' }

export default async function NewClientPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Add client" />
      <Card>
        <ClientForm />
      </Card>
    </>
  )
}
