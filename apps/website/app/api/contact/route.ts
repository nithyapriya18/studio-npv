import { NextRequest, NextResponse } from 'next/server'
import { checkContactLimit, clientIp } from '@/lib/rate-limit'
import { siteConfig } from '@/config'
import { recordWebsiteLead } from '@/lib/admin/store'

export const runtime = 'nodejs'

/**
 * Contact form. Sends the message to CONTACT_TO_EMAIL (or the studio's
 * address) through Resend (resend.com), from the studio's own address:
 * studionpv.com is verified in Resend, so it can send as hello@.
 */

const LIMITS = { name: 100, email: 200, company: 200, message: 5000 }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  // Hidden field that people never see; bots fill it in. Pretend it worked.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true })

  const name = clean(body.name, LIMITS.name)
  const email = clean(body.email, LIMITS.email)
  const company = clean(body.company, LIMITS.company)
  const message = clean(body.message, LIMITS.message)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Please fill in your name, email and message.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address doesn’t look right.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL ?? siteConfig.email
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set')
    return NextResponse.json(
      { error: 'The form isn’t connected yet. Please email me directly:', fallback: true },
      { status: 503 },
    )
  }

  const limit = await checkContactLimit(clientIp(req.headers))
  if (!limit.success) {
    return NextResponse.json(
      { error: 'You’ve sent a few messages already today. Please email me directly:', fallback: true },
      { status: 429 },
    )
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company or website: ${company}` : null,
    '',
    message,
    '',
    `Sent from the contact form on ${siteConfig.url}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? `${siteConfig.name} <${siteConfig.email}>`,
        to: [to],
        reply_to: email,
        subject: `New enquiry from ${name}${company ? `, ${company}` : ''}`,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[contact] Resend error', res.status, await res.text())
      throw new Error('send failed')
    }
    // Also track it as a lead in the studio admin (/admin/leads).
    await recordWebsiteLead({ name, email, company, message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Your message didn’t send. Please try again, or email me directly:', fallback: true },
      { status: 502 },
    )
  }
}
