'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Image as ImageIcon, Play, RotateCcw, Trophy } from 'lucide-react'
import { track } from '@/lib/analytics'
import { GAME_PRODUCT, gameUrl, roastHref } from '@/lib/products'
import { drawCard, shareCard } from '@/lib/share-card'
import { Arrow, Note } from '@/components/pen'

/** What a first version actually needs. Catch all of them to ship. */
const CORE = ['Sign up', 'The main thing', 'A way to pay', 'Onboarding', 'Landing page', 'Feedback button', 'Error alerts', 'Log in']

/** Everything else. Each one caught costs days and slows you down. */
const CREEP = [
  'AI chatbot',
  'Dark mode',
  'Blockchain?',
  'Can it do payroll too',
  'Enterprise SSO',
  'Gamification',
  'A mobile app as well',
  'Custom themes',
  'Admin dashboard v2',
  'Export to 14 formats',
  'Social feed',
  'Referral program',
  'Multi-currency',
  'Voice commands',
  'Microservices',
  'A metaverse office',
  'Smart notifications',
  'Rebrand first',
  'Just one more integration',
  'Make it pop',
  'NFT badges',
  'Offline mode',
]

const START_DAYS = 90
const DAYS_PER_SECOND = 2
const CREEP_COST = 6
const HEIGHT = 480
const SHIP_W = 110
const SHIP_H = 30
const BEST_KEY = 'scope-creep-best'

type Item = { x: number; y: number; vy: number; label: string; core: boolean; w: number }
type Phase = 'ready' | 'playing' | 'over'
type Result = { shipped: boolean; daysLeft: number; built: number; crept: number; dodged: number }
type Done = 'copied' | 'shared' | 'downloaded' | null

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

function saveBest(days: number) {
  try {
    localStorage.setItem(BEST_KEY, String(days))
  } catch {}
}

function resultLine(r: Result) {
  return r.shipped
    ? `Shipped v1 with ${r.daysLeft} days to spare, dodging ${r.dodged} feature requests.`
    : `Missed the launch. Built ${r.built} of ${CORE.length} core features while ${r.crept} extras crept in.`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function ScopeCreepGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState<Result | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [newBest, setNewBest] = useState(false)
  const [done, setDone] = useState<Done>(null)
  const keys = useRef({ left: false, right: false })
  const pointerX = useRef<number | null>(null)

  // Local storage only exists in the browser, so read it after the first render.
  useEffect(() => {
    const t = setTimeout(() => setBest(readBest()))
    return () => clearTimeout(t)
  }, [])

  const finish = useCallback((r: Result) => {
    setResult(r)
    setPhase('over')
    track('scope_creep_finished', { ...r })
    if (r.shipped) {
      const prev = readBest()
      if (prev === null || r.daysLeft > prev) {
        saveBest(r.daysLeft)
        setBest(r.daysLeft)
        setNewBest(true)
      }
    }
  }, [])

  // The game loop. Everything that changes every frame lives in this closure,
  // not in React state, so the page doesn't re-render sixty times a second.
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const css = getComputedStyle(canvas)
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    const ink = color('--ink', '#171a33')
    const graphite = color('--graphite', '#555a78')
    const rule = color('--rule', '#ddd9ce')
    const surface = color('--surface-c', '#ffffff')
    const accent = color('--accent-c', '#232c82')
    const pen = color('--pen', '#c2401e')
    const marigold = color('--marigold', '#f5b53f')
    const sans = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'system-ui'

    let width = 0
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      width = canvas.clientWidth
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    ctx.font = `600 14px ${sans}`
    const items: Item[] = []
    const built = new Set<string>()
    let shipX = width / 2
    let days = START_DAYS
    let crept = 0
    let dodged = 0
    let elapsed = 0
    let spawnIn = 0.4
    let last = performance.now()
    let frame = 0
    let paused = document.hidden

    const spawn = () => {
      const missing = CORE.filter((c) => !built.has(c) && !items.some((i) => i.label === c))
      // Fewer core pieces fall as the game goes on, so it gets harder.
      const coreChance = Math.max(0.28, 0.45 - elapsed * 0.004)
      const core = missing.length > 0 && Math.random() < coreChance
      const label = core
        ? missing[Math.floor(Math.random() * missing.length)]
        : CREEP[Math.floor(Math.random() * CREEP.length)]
      const w = ctx.measureText(label).width + 28
      const speed = 120 + Math.min(elapsed * 4, 170)
      items.push({ x: 8 + Math.random() * Math.max(0, width - w - 16), y: -30, vy: speed * (0.85 + Math.random() * 0.3), label, core, w })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, HEIGHT)
      ctx.font = `600 14px ${sans}`
      ctx.textBaseline = 'middle'

      for (const it of items) {
        roundRect(ctx, it.x, it.y, it.w, 28, 14)
        ctx.fillStyle = it.core ? accent : surface
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = it.core ? accent : pen
        ctx.stroke()
        ctx.fillStyle = it.core ? surface : pen
        ctx.fillText(it.label, it.x + 14, it.y + 14.5)
      }

      // The ship, with every extra it caught piled on top.
      const shipY = HEIGHT - SHIP_H - 14
      const left = shipX - SHIP_W / 2
      for (let i = 0; i < crept; i++) {
        const wobble = Math.sin(elapsed * 3 + i) * Math.min(i, 6)
        roundRect(ctx, left + 10 + wobble, shipY - 8 * (i + 1), SHIP_W - 20, 7, 3)
        ctx.fillStyle = pen
        ctx.globalAlpha = 0.7
        ctx.fill()
        ctx.globalAlpha = 1
      }
      roundRect(ctx, left, shipY, SHIP_W, SHIP_H, 10)
      ctx.fillStyle = marigold
      ctx.fill()
      ctx.fillStyle = '#161b4f'
      ctx.font = `700 14px ${sans}`
      ctx.textAlign = 'center'
      ctx.fillText(`v1 · ${built.size}/${CORE.length}`, shipX, shipY + SHIP_H / 2 + 1)
      ctx.textAlign = 'left'

      // Top bar: days left, as a draining line.
      ctx.fillStyle = rule
      ctx.fillRect(0, 0, width, 6)
      ctx.fillStyle = days > 20 ? accent : pen
      ctx.fillRect(0, 0, (width * Math.max(0, days)) / START_DAYS, 6)
      ctx.font = `600 13px ${sans}`
      ctx.fillStyle = ink
      ctx.fillText(`${Math.max(0, Math.ceil(days))} days to launch`, 12, 22)
      ctx.textAlign = 'right'
      ctx.fillStyle = graphite
      ctx.fillText(`${dodged} dodged · ${crept} crept in`, width - 12, 22)
      ctx.textAlign = 'left'
    }

    const step = (now: number) => {
      frame = requestAnimationFrame(step)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (paused) return
      elapsed += dt
      days -= dt * DAYS_PER_SECOND

      // Each extra caught makes the ship heavier.
      const speed = 560 * Math.max(0.45, 1 - crept * 0.06)
      let move = 0
      if (keys.current.left) move -= 1
      if (keys.current.right) move += 1
      if (move) {
        pointerX.current = null
        shipX += move * speed * dt
      } else if (pointerX.current !== null) {
        const gap = pointerX.current - shipX
        shipX += Math.sign(gap) * Math.min(Math.abs(gap), speed * dt)
      }
      shipX = Math.max(SHIP_W / 2, Math.min(width - SHIP_W / 2, shipX))

      spawnIn -= dt
      if (spawnIn <= 0) {
        spawn()
        spawnIn = Math.max(0.42, 0.95 - elapsed * 0.012) * (0.8 + Math.random() * 0.4)
      }

      const shipTop = HEIGHT - SHIP_H - 14 - crept * 8
      const shipLeft = shipX - SHIP_W / 2
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]
        it.y += it.vy * dt
        const hit = it.y + 28 >= shipTop && it.y <= HEIGHT - 14 && it.x < shipLeft + SHIP_W && it.x + it.w > shipLeft
        if (hit) {
          items.splice(i, 1)
          if (it.core) built.add(it.label)
          else {
            crept += 1
            days -= CREEP_COST
          }
        } else if (it.y > HEIGHT) {
          items.splice(i, 1)
          if (!it.core) dodged += 1
        }
      }

      draw()

      if (built.size === CORE.length) {
        cancelAnimationFrame(frame)
        finish({ shipped: true, daysLeft: Math.max(1, Math.ceil(days)), built: built.size, crept, dodged })
      } else if (days <= 0) {
        cancelAnimationFrame(frame)
        finish({ shipped: false, daysLeft: 0, built: built.size, crept, dodged })
      }
    }

    const onVisibility = () => {
      paused = document.hidden
      last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [phase, finish])

  // Arrow keys and A/D move the ship while a round is on.
  useEffect(() => {
    if (phase !== 'playing') return
    const set = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') keys.current.left = down
      else if (k === 'arrowright' || k === 'd') keys.current.right = down
      else return
      e.preventDefault()
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      keys.current = { left: false, right: false }
    }
  }, [phase])

  function onPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (phase !== 'playing') return
    const rect = e.currentTarget.getBoundingClientRect()
    pointerX.current = e.clientX - rect.left
  }

  function start() {
    track(result ? 'scope_creep_replayed' : 'scope_creep_started')
    pointerX.current = null
    setResult(null)
    setNewBest(false)
    setPhase('playing')
    canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function flash(kind: Exclude<Done, null>) {
    setDone(kind)
    setTimeout(() => setDone(null), 2000)
  }

  function copy() {
    if (!result) return
    navigator.clipboard.writeText(`${resultLine(result)} Play ${GAME_PRODUCT.name}: ${gameUrl}`)
    track('scope_creep_copied', { shipped: result.shipped })
    flash('copied')
  }

  async function share() {
    if (!result) return
    try {
      const blob = await drawCard({
        label: GAME_PRODUCT.name,
        figure: result.shipped ? `${result.daysLeft}` : `${result.built}/${CORE.length}`,
        figureNote: result.shipped ? 'days to spare at launch' : 'core features built',
        headline: result.shipped ? 'I shipped my first version before the feature requests buried it.' : 'Scope crept in. The launch did not happen.',
        detail: result.shipped
          ? `Dodged ${result.dodged} requests, let ${result.crept} slip in. Can you beat it?`
          : `${result.crept} extras crept in, including at least one AI chatbot. Can you do better?`,
        url: gameUrl.replace('https://', ''),
      })
      const how = await shareCard(blob, 'scope-creep.png', `${resultLine(result)} ${gameUrl}`)
      if (how === 'cancelled') return
      track('scope_creep_card_shared', { shipped: result.shipped, how })
      flash(how)
    } catch {
      // No canvas: the text version still works.
      copy()
    }
  }

  return (
    <>
      <section className="band page-head">
        <p className="label">Free game · built and run by Studio NPV</p>
        <h1 className="display">
          <em>Scope Creep</em>
        </h1>
        <p className="lede" style={{ maxWidth: '50ch' }}>
          Your first version is due in {START_DAYS} days. Catch what it needs, dodge everything else,
          and ship before the feature requests bury it.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="pill">Free</li>
          <li className="pill">About a minute a round</li>
          <li className="pill" aria-live="polite">
            {best ? `Your best: ${best} days to spare` : 'No sign-up'}
          </li>
        </ul>

        <div className="card mt-4 overflow-hidden rounded-[20px] border border-border bg-card text-text-primary shadow-[0_30px_60px_-30px_rgba(8,10,40,0.55)]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-background/60 px-4 py-3 text-sm md:px-6">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-6 rounded-full bg-accent" aria-hidden />
              Catch: what v1 needs
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-6 rounded-full border-[1.5px] border-[var(--pen)]" aria-hidden />
              Dodge: everything else, {CREEP_COST} days each
            </span>
            <span className="ml-auto text-text-muted">Arrow keys, A and D, or drag</span>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointer}
              onPointerMove={onPointer}
              className="block w-full touch-none select-none"
              style={{ height: HEIGHT }}
              aria-label={`${GAME_PRODUCT.name} game area`}
            />

            {phase !== 'playing' && (
              <div className="absolute inset-0 grid place-items-center bg-card/90 p-6 backdrop-blur-[2px]">
                {phase === 'ready' || !result ? (
                  <div className="max-w-md text-center">
                    <p className="font-serif text-3xl leading-tight text-text-primary">
                      Eight things make a first version. Everything else is scope creep.
                    </p>
                    <p className="mt-3 text-text-muted">
                      Catch all {CORE.length} core features before the clock runs out. Every extra you
                      catch costs {CREEP_COST} days and makes v1 heavier.
                    </p>
                    <button onClick={start} className="btn-primary mt-6 !px-7 !py-3">
                      <Play size={16} aria-hidden />
                      Start building
                    </button>
                  </div>
                ) : (
                  <div className="max-w-md text-center" role="status">
                    <p className="text-sm font-medium text-accent">{result.shipped ? 'Shipped' : 'Launch missed'}</p>
                    <p className="mt-2 font-serif text-6xl leading-none tabular-nums text-text-primary">
                      {result.shipped ? result.daysLeft : `${result.built}/${CORE.length}`}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {result.shipped ? 'days to spare' : 'core features built'}
                    </p>
                    <p className="mt-4 text-text-primary">{resultLine(result)}</p>
                    {newBest && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent">
                        <Trophy size={14} aria-hidden />
                        Your best run yet
                      </p>
                    )}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <button onClick={start} className="btn-primary !py-2 text-sm">
                        <RotateCcw size={15} aria-hidden />
                        Play again
                      </button>
                      <button onClick={share} className="btn-default !py-2 text-sm">
                        {done === 'shared' || done === 'downloaded' ? <Check size={15} aria-hidden /> : <ImageIcon size={15} aria-hidden />}
                        {done === 'shared' ? 'Shared' : done === 'downloaded' ? 'Card saved' : 'Share launch card'}
                      </button>
                      <button onClick={copy} className="btn-default !py-2 text-sm">
                        {done === 'copied' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                        {done === 'copied' ? 'Copied' : 'Copy result'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="why-h">
        <p className="label">The point</p>
        <div className="section-body">
          <h2 id="why-h" className="h2">
            A first version is mostly the things you <em>leave out</em>
          </h2>
          <p className="measure muted">
            Every request in the game is reasonable on its own, and that&apos;s the trap. The products
            that launch are the ones that say &ldquo;later&rdquo; to almost everything until real users
            ask for it. In real life it&apos;s the same eight things, give or take, and a lot of polite
            no&apos;s.
          </p>
          <Note>the AI chatbot always falls first</Note>
        </div>
      </section>

      <section className="section band-warm" aria-labelledby="help-h">
        <p className="label">Next step</p>
        <div className="section-body">
          <h2 id="help-h" className="h2">
            Want a first version that actually <em>ships?</em>
          </h2>
          <p className="measure muted">
            I design and build first versions of new products for founders, scoped to what the first
            users need, for a fixed price agreed before work starts.
          </p>
          <div className="btns">
            <Link href="/contact" className="btn-primary">
              Get in touch <Arrow />
            </Link>
            <Link href={roastHref} className="more">
              Roast my idea first <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
