import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Sign-in for /admin. There is one user: the owner.
 *
 *  - ADMIN_PASSWORD_HASH: "scrypt.<salt>.<hash>" (base64url), made by
 *    `npm run admin:setup`. The password itself is never stored.
 *  - ADMIN_SESSION_SECRET: signs the session cookie. Changing it signs every
 *    browser out.
 *
 * The cookie holds only an expiry time and its signature, is HttpOnly and
 * SameSite=Lax, and is sent only to /admin paths.
 */

export const SESSION_COOKIE = 'npv_admin'
const SESSION_DAYS = 30

export function verifyPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH
  if (!stored || !password) return false
  const [scheme, salt, hash] = stored.split('.')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  // A broken hash must never match (an empty one would match anything).
  if (expected.length < 32) return false
  const actual = scryptSync(password, Buffer.from(salt, 'base64url'), expected.length)
  return timingSafeEqual(actual, expected)
}

function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) return null
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32)
}

export function makeSessionToken() {
  const expires = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const sig = sign(expires)
  return sig ? `${expires}.${sig}` : null
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false
  const [expires, sig] = token.split('.')
  if (!expires || !sig || !/^\d+$/.test(expires)) return false
  if (Number(expires) < Date.now()) return false
  const expected = sign(expires)
  if (!expected) return false
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Lax, so a link to /admin from an email opens signed in. Forms are safe
  // anyway: Next.js checks the Origin of every server action.
  sameSite: 'lax' as const,
  path: '/admin',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
}

export async function isSignedIn() {
  const store = await cookies()
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value)
}

/**
 * Call at the top of every admin page and every admin server action.
 * Server actions can be POSTed to directly, so the page layout alone is not
 * enough protection.
 */
export async function requireAdmin() {
  if (!(await isSignedIn())) redirect('/admin/login')
}
