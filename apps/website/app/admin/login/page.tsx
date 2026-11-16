import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { authConfigured, isSignedIn } from '@/lib/admin/auth'
import { LoginForm } from '@/components/admin/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  if (await isSignedIn()) redirect('/admin')
  return (
    <div className="a-app a-login">
      <div className="a-login-box">
        <div className="a-brand a-login-brand">
          <span className="a-brand-mark">NPV</span>
          <span className="a-brand-text">
            <span className="a-brand-name">Studio NPV</span>
            <span className="a-brand-sub">Admin</span>
          </span>
        </div>
        <section className="a-card">
          <h1 className="a-page-title">Sign in</h1>
          {authConfigured() ? (
            <LoginForm />
          ) : (
            <p className="a-muted">Sign-in isn&apos;t set up yet. In the website folder, run npm run admin:setup, then redeploy.</p>
          )}
        </section>
      </div>
    </div>
  )
}
