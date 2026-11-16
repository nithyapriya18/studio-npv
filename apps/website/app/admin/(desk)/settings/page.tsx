import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import { getSettings } from '@/lib/admin/store'
import { SETTING_FIELDS } from '@/lib/admin/types'
import { saveSettingsAction } from '@/app/admin/actions'
import { SubmitButton } from '@/components/admin/client'
import { Card, Input, PageHeader, Textarea } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const [{ saved }, settings] = await Promise.all([searchParams, getSettings()])
  return (
    <>
      <PageHeader title="Settings" sub="Your details as they appear on every invoice." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          {saved ? <p className="mb-4 rounded-xl bg-accent-light px-4 py-2 text-[14px]">Saved.</p> : null}
          <form action={saveSettingsAction} className="grid gap-4 sm:grid-cols-2">
            {SETTING_FIELDS.map((f) =>
              'multiline' in f && f.multiline ? (
                <Textarea key={f.key} label={f.label} name={f.key} defaultValue={settings[f.key] ?? ''} placeholder={f.placeholder} rows={4} wrap="sm:col-span-2" />
              ) : (
                <Input key={f.key} label={f.label} name={f.key} defaultValue={settings[f.key] ?? ''} placeholder={f.placeholder} />
              ),
            )}
            <div className="sm:col-span-2">
              <SubmitButton>Save settings</SubmitButton>
            </div>
          </form>
        </Card>
        <Card title="Password and sign-in">
          <div className="space-y-3 text-[14px] text-text-muted">
            <p>You stay signed in on a browser for 30 days. Every sign-in sends you an email, so you would notice one that wasn&apos;t you.</p>
            <p>
              To change your password, open Terminal in the website folder and run <code>npm run admin:setup</code>.
              That also signs every browser out.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
