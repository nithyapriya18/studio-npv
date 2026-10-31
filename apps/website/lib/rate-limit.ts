import { createClient } from '@supabase/supabase-js'

/**
 * Limits for /api/review (and a light one for /api/contact):
 *  - per-IP: two reviews per visitor per day
 *  - daily global: a hard ceiling on total Anthropic spend per day
 *
 * Backed by a Postgres function (`check_rate_limit`, see supabase/rate-limit.sql)
 * in Supabase when NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set —
 * atomic, and correct across Vercel's separate serverless instances.
 * Falls back to an in-memory limiter when those aren't set yet, so the route
 * still works locally / before Supabase is wired up — but an in-memory limiter
 * resets on every cold start and isn't shared across concurrent instances, so
 * it is NOT a real guarantee in production. Run supabase/rate-limit.sql in your
 * Supabase project's SQL editor, then add the two env vars, before pointing
 * real traffic at this.
 *
 * If the Supabase call itself errors (network blip, or a free project that
 * Supabase has paused for inactivity), this falls back to the in-memory
 * limiter rather than allowing every request. That fallback is per server
 * instance, so it is looser than the Supabase limit, but it never leaves the
 * reviews (which cost API credits) unlimited.
 */

// Each review costs roughly one US cent in API credits, so each visitor gets
// two a day and the whole site is capped (override with ROAST_DAILY_LIMIT).
export const PER_IP_LIMIT = 2
const PER_IP_WINDOW_SECONDS = 24 * 60 * 60
const DAILY_LIMIT = Number(process.env.ROAST_DAILY_LIMIT ?? 60)
const DAILY_WINDOW_SECONDS = 24 * 60 * 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// The publishable (anon) key is enough here — check_rate_limit is a
// `security definer` function, so it runs with the privileges it needs
// regardless of which key called it. No reason to use the more powerful
// service_role key for a simple counter.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const hasSupabase = Boolean(supabaseUrl && supabaseKey)

const supabase = hasSupabase ? createClient(supabaseUrl!, supabaseKey!) : null

if (!hasSupabase) {
  console.warn(
    '[rate-limit] NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — using an ' +
      'in-memory fallback. Fine for local dev, not safe for real production traffic ' +
      '(see lib/rate-limit.ts and supabase/rate-limit.sql).',
  )
}

// --- in-memory fallback (dev only) ---
const memoryHits = new Map<string, number[]>()

function memoryCheck(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs)
  const allowed = hits.length < limit
  if (allowed) hits.push(now)
  memoryHits.set(key, hits)
  return allowed
}

async function check(key: string, maxCount: number, windowSeconds: number) {
  if (supabase) {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max_count: maxCount,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('[rate-limit] Supabase RPC failed, using in-memory limit:', error.message)
      return memoryCheck(key, maxCount, windowSeconds * 1000)
    }
    return Boolean(data)
  }
  return memoryCheck(key, maxCount, windowSeconds * 1000)
}

export async function checkIpLimit(ip: string) {
  const success = await check(`roast-ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_SECONDS)
  return { success }
}

export async function checkDailyLimit() {
  const success = await check('daily:global', DAILY_LIMIT, DAILY_WINDOW_SECONDS)
  return { success }
}

export type Quota = { remaining: number; limit: number; resetsAt: string | null }

/** Reads a limit without using it up. Needs rate_limit_status (supabase/rate-limit.sql). */
async function status(key: string, maxCount: number, windowSeconds: number) {
  if (supabase) {
    const { data, error } = await supabase.rpc('rate_limit_status', {
      p_key: key,
      p_max_count: maxCount,
      p_window_seconds: windowSeconds,
    })
    const row = Array.isArray(data) ? data[0] : null
    if (!error && row) {
      return { remaining: Number(row.remaining), resetsAt: (row.resets_at as string | null) ?? null }
    }
    if (error) console.error('[rate-limit] status lookup failed, using in-memory count:', error.message)
  }
  const now = Date.now()
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000)
  return {
    remaining: Math.max(0, maxCount - hits.length),
    resetsAt: hits.length ? new Date(hits[0] + windowSeconds * 1000).toISOString() : null,
  }
}

/** How many reviews this visitor can still run today (also capped by the site-wide limit). */
export async function reviewQuota(ip: string): Promise<Quota> {
  const [mine, site] = await Promise.all([
    status(`roast-ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_SECONDS),
    status('daily:global', DAILY_LIMIT, DAILY_WINDOW_SECONDS),
  ])
  const siteIsTighter = site.remaining < mine.remaining
  return {
    remaining: Math.min(mine.remaining, site.remaining),
    limit: PER_IP_LIMIT,
    resetsAt: siteIsTighter ? site.resetsAt : mine.resetsAt,
  }
}

// Idea Roast has its own allowance and its own site-wide ceiling, so roasts
// never use up Crit's reviews. A roast is shorter, so it costs less than a review.
export const ROAST_PER_IP_LIMIT = 3
const ROAST_DAILY_LIMIT = Number(process.env.IDEA_ROAST_DAILY_LIMIT ?? 100)

export async function checkRoastLimits(ip: string) {
  const mine = await check(`idea-roast-ip:${ip}`, ROAST_PER_IP_LIMIT, PER_IP_WINDOW_SECONDS)
  if (!mine) return { success: false, scope: 'visitor' as const }
  const site = await check('daily:idea-roast', ROAST_DAILY_LIMIT, DAILY_WINDOW_SECONDS)
  return site ? { success: true } : { success: false, scope: 'site' as const }
}

/** How many roasts this visitor can still run today. */
export async function roastQuota(ip: string): Promise<Quota> {
  const [mine, site] = await Promise.all([
    status(`idea-roast-ip:${ip}`, ROAST_PER_IP_LIMIT, PER_IP_WINDOW_SECONDS),
    status('daily:idea-roast', ROAST_DAILY_LIMIT, DAILY_WINDOW_SECONDS),
  ])
  const siteIsTighter = site.remaining < mine.remaining
  return {
    remaining: Math.min(mine.remaining, site.remaining),
    limit: ROAST_PER_IP_LIMIT,
    resetsAt: siteIsTighter ? site.resetsAt : mine.resetsAt,
  }
}

/** Contact form: a handful of messages per visitor per day, to stop spam. */
export async function checkContactLimit(ip: string) {
  const success = await check(`contact-ip:${ip}`, 5, 24 * 60 * 60)
  return { success }
}

/** Blog comments: a few per visitor per day, to keep spam down. */
export async function checkCommentLimit(ip: string) {
  const success = await check(`comment-ip:${ip}`, 3, 24 * 60 * 60)
  return { success }
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
