import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { authConfigured, isSignedIn } from '@/lib/admin/auth'
import { LoginForm } from '@/components/admin/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  if (await isSignedIn()) redirect('/admin')
  return (
    <div className="mx-auto mt-[8vh] max-w-sm">
      <div className="logo mb-8 text-center">
        studio <b>npv</b>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-serif text-[32px] leading-tight text-text-primary">Sign in</h1>
        <p className="mb-5 mt-1 text-[14px] text-text-muted">Studio admin. For Nithya only.</p>
        {authConfigured() ? (
          <LoginForm />
        ) : (
          <p className="text-[14px] text-text-muted">
            Sign-in isn&apos;t set up yet. In the website folder, run <code>npm run admin:setup</code>, then
            redeploy.
          </p>
        )}
      </div>
    </div>
  )
}
