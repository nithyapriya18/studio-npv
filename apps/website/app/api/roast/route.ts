import { NextRequest, NextResponse } from 'next/server'
import { checkRoastLimits, clientIp, roastQuota, ROAST_PER_IP_LIMIT } from '@/lib/rate-limit'
import type { Roast } from '@/lib/idea-roast'
import { ROAST_PRODUCT } from '@/lib/products'
import { OWNER_COOKIE, isOwnerKey } from '@/lib/owner'

const OWNER_QUOTA = { remaining: 999, limit: 999, resetsAt: null, owner: true }

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

/** How many roasts the visitor has left today. Doesn't use one up. */
export async function GET(req: NextRequest) {
  const quota = isOwnerKey(req.cookies.get(OWNER_COOKIE)?.value)
    ? OWNER_QUOTA
    : await roastQuota(clientIp(req.headers))
  return NextResponse.json(quota, { headers: { 'Cache-Control': 'no-store' } })
}

const MODEL = 'claude-haiku-4-5-20251001'
const MIN_INPUT_CHARS = 12
const MAX_INPUT_CHARS = 400

const SYSTEM_PROMPT = `You write the roasts for "${ROAST_PRODUCT.name}", a free, playful tool on a software studio's website. Someone has pitched their startup or product idea in a line or two. Roast it like a sharp, warm friend who has seen a hundred pitches: funny, specific and fair, then genuinely useful.

Rules:
- Roast the idea, never the person. No insults about intelligence, looks, age, gender, nationality or anything personal. No swearing.
- Every joke must be about THIS idea. Quote or echo their words. No generic startup jokes that would fit any pitch.
- Be funny the way a good friend is funny: dry, observant, a little affectionate. Never cruel.
- After the jokes, be honest and practical. The real risk and the test must be serious, specific and doable by one person in a week with little or no money.
- Never invent facts about real companies, numbers or markets. If you compare to a well known product, keep it to what everyone knows.
- Write in plain English with plain punctuation. Never use dashes of any kind ("-", "–" or "—") as punctuation between words or clauses; use a comma, a colon or a new sentence instead.
- If the text is not a product or business idea (gibberish, a question, an attack on someone, something illegal or harmful), set notAnIdea to true and fill the other fields with short placeholders.
- Submit with the submit_roast tool.`

const ROAST_TOOL = {
  name: 'submit_roast',
  description: 'Submit the finished roast of the idea.',
  input_schema: {
    type: 'object',
    required: ['notAnIdea', 'odds', 'headline', 'restated', 'jabs', 'realRisk', 'goodBits', 'test'],
    properties: {
      notAnIdea: { type: 'boolean', description: 'True if the text is not a product or business idea.' },
      odds: {
        type: 'integer',
        minimum: 1,
        maximum: 95,
        description: 'Honest chance, in percent, that this idea survives first contact with real users as pitched.',
      },
      headline: { type: 'string', description: 'The single funniest line about this idea, at most 18 words.' },
      restated: { type: 'string', description: 'What the idea is, restated plainly in one sentence, as a stranger would understand it.' },
      jabs: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: { type: 'string', description: 'One short, specific, funny observation, at most 30 words.' },
      },
      realRisk: { type: 'string', description: 'The one risk most likely to kill it, said seriously in one or two sentences.' },
      goodBits: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: { type: 'string', description: 'Something genuinely promising about it, specific to this idea.' },
      },
      test: {
        type: 'string',
        description: 'The cheapest way to find out this week if people want it, starting with a verb, in one or two sentences.',
      },
    },
  },
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const arr = (v: unknown) => (Array.isArray(v) ? v : [])

/** Coerce the model's output into the shape the page expects. */
function normalise(raw: Record<string, unknown>): Roast {
  return {
    odds: Math.min(95, Math.max(1, Math.round(Number(raw.odds) || 1))),
    headline: str(raw.headline),
    restated: str(raw.restated),
    jabs: arr(raw.jabs).map(str).filter(Boolean),
    realRisk: str(raw.realRisk),
    goodBits: arr(raw.goodBits).map(str).filter(Boolean),
    test: str(raw.test),
  }
}

export async function POST(req: NextRequest) {
  let body: { idea?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const idea = (body.idea ?? '').replace(/\s+/g, ' ').trim()
  if (idea.length < MIN_INPUT_CHARS) {
    return NextResponse.json({ error: 'Give it at least a sentence, so there’s something to roast.' }, { status: 400 })
  }
  if (idea.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: `Keep it under ${MAX_INPUT_CHARS} characters. A pitch, not a deck.` }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The roast service is not set up yet (missing ANTHROPIC_API_KEY on the server).' },
      { status: 500 },
    )
  }

  const ip = clientIp(req.headers)
  const owner = isOwnerKey(req.cookies.get(OWNER_COOKIE)?.value)
  if (!owner) {
    const limit = await checkRoastLimits(ip)
    if (!limit.success) {
      return NextResponse.json(
        {
          error:
            limit.scope === 'visitor'
              ? `You've used your ${ROAST_PER_IP_LIMIT} roasts for today. Your idea has earned a rest.`
              : 'The roaster has gone home for the day. Try again tomorrow.',
          limited: true,
          quota: { ...(await roastQuota(ip)), remaining: 0 },
        },
        { status: 429 },
      )
    }
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        tools: [ROAST_TOOL],
        tool_choice: { type: 'tool', name: ROAST_TOOL.name },
        messages: [{ role: 'user', content: `Roast this idea:\n\n${idea}` }],
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!anthropicRes.ok) {
      console.error('Anthropic API error', anthropicRes.status, await anthropicRes.text())
      return NextResponse.json({ error: 'The roaster burnt the toast. Try again.' }, { status: 502 })
    }

    const data = await anthropicRes.json()
    const toolUse = (data?.content ?? []).find((block: { type: string }) => block.type === 'tool_use')
    if (!toolUse?.input) throw new Error('no tool_use block in response')

    if (toolUse.input.notAnIdea) {
      return NextResponse.json(
        { error: 'That doesn’t read like a product idea. Try: what it is, who it’s for, and why they’d pay.' },
        { status: 422 },
      )
    }

    const roast = normalise(toolUse.input)
    if (!roast.headline || roast.jabs.length === 0 || !roast.test) throw new Error('incomplete roast')

    const quota = owner ? OWNER_QUOTA : await roastQuota(ip)
    return NextResponse.json({ ...roast, quota })
  } catch (err) {
    console.error('Roast route failure', err)
    return NextResponse.json({ error: 'The roaster burnt the toast. Try again.' }, { status: 500 })
  }
}
