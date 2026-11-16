import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { LeadForm } from '@/components/admin/forms'
import { Card, PageHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Add lead' }

export default async function NewLeadPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Add lead" />
      <Card>
        <LeadForm />
      </Card>
    </>
  )
}
