'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Copy, Flame, FlaskConical, HeartPulse, Image as ImageIcon, RotateCcw, Sparkles, ThumbsUp, TriangleAlert } from 'lucide-react'
import { track } from '@/lib/analytics'
import { oddsLabel, roastToText, type Roast } from '@/lib/idea-roast'
import { ROAST_PRODUCT, reviewHref, roastUrl } from '@/lib/products'
import { drawCard, shareCard } from '@/lib/share-card'
import { Arrow, Note } from '@/components/pen'

const MAX_CHARS = 400

const STAGES = ['Reading your pitch', 'Sharpening the jokes', 'Finding the real risk', 'Writing a test for this week']

// Tap one to fill the box, so nobody stares at an empty field.
const EXAMPLES = [
  'Uber for dog walkers, but the dogs rate the walkers.',
  'An app that tells you which of your houseplants is about to die, and why it’s your fault.',
  'A subscription box of one perfect mango a week, delivered across India in season.',
]

const INCLUDES = [
  { icon: Flame, title: 'The roast', body: 'Three jokes about your idea specifically. Fair, never personal.' },
  { icon: HeartPulse, title: 'Survival odds', body: 'An honest guess at whether it survives its first real users.' },
  { icon: TriangleAlert, title: 'The real risk', body: 'The one thing most likely to sink it, said straight.' },
  { icon: FlaskConical, title: 'A test for this week', body: 'The cheapest way to find out if anyone wants it.' },
  { icon: ImageIcon, title: 'A card to share', body: 'Save your roast as an image and post it, if you dare.' },
]

type Quota = { remaining: number; limit: number; resetsAt: string | null; owner?: boolean }
type Done = 'copied' | 'shared' | 'downloaded' | null

export function RoastApp() {
  const [idea, setIdea] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState<{ message: string; limited?: boolean } | null>(null)
  const [roast, setRoast] = useState<Roast | null>(null)
  const [quota, setQuota] = useState<Quota | null>(null)
  const [done, setDone] = useState<Done>(null)

  const trimmed = idea.trim()
  const outOfRoasts = quota?.remaining === 0
  const ready = !outOfRoasts && trimmed.length >= 12

  useEffect(() => {
    fetch('/api/roast', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((q: Quota | null) => q && setQuota(q))
      .catch(() => {})
  }, [])

  // Move through the progress stages while the roast is being written.
  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2500)
    return () => clearInterval(timer)
  }, [loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready || loading) return

    track('idea_roast_submitted', { input_length: trimmed.length })
    setLoading(true)
    setStage(0)
    setError(null)
    setRoast(null)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea: trimmed }),
      })
      const data = await res.json()
      if (data.quota) setQuota(data.quota)
      if (!res.ok) {
        setError({ message: data.error ?? 'Something went wrong. Try again.', limited: data.limited })
        return
      }
      setSubmitted(trimmed)
      setRoast(data)
      track('idea_roast_generated', { odds: data.odds })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError({ message: "Couldn't reach the roaster. Check your connection and try again." })
    } finally {
      setLoading(false)
    }
  }

  function flash(kind: Exclude<Done, null>) {
    setDone(kind)
    setTimeout(() => setDone(null), 2000)
  }

  function copy() {
    if (!roast) return
    navigator.clipboard.writeText(roastToText(roast, submitted))
    track('idea_roast_copied', { odds: roast.odds })
    flash('copied')
  }

  async function share() {
    if (!roast) return
    try {
      const blob = await drawCard({
        label: ROAST_PRODUCT.name,
        figure: `${roast.odds}%`,
        figureNote: `survival odds: ${oddsLabel(roast.odds).toLowerCase()}`,
        headline: roast.headline,
        detail: `The idea: ${submitted}`,
        url: roastUrl.replace('https://', ''),
      })
      const how = await shareCard(blob, 'idea-roast.png', `My idea got roasted: ${roastUrl}`)
      if (how === 'cancelled') return
      track('idea_roast_card_shared', { odds: roast.odds, how })
      flash(how)
    } catch {
      setError({ message: 'Couldn’t make the image. Copy the roast as text instead.' })
    }
  }

  function reset() {
    track('idea_roast_another_started')
    setRoast(null)
    setError(null)
  }

  const status = loading ? 'Roasting' : roast ? 'Roast ready' : 'Ready'

  return (
    <>
      <section className="band page-head">
        <p className="label">Free toy · built and run by Studio NPV</p>
        <h1 className="display">
          <em>Idea Roast</em>
        </h1>
        <p className="lede" style={{ maxWidth: '50ch' }}>
          Pitch your startup idea in a line or two. Get roasted, kindly, and leave with the one test
          worth running this week.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="pill">Free</li>
          <li className="pill" aria-live="polite">
            {quota?.owner
              ? 'Unlimited roasts (owner)'
              : quota
                ? `${quota.remaining} of ${quota.limit} roasts left today`
                : '3 free roasts a day'}
          </li>
          <li className="pill">About 10 seconds</li>
        </ul>

        <div className="card mt-4 overflow-hidden rounded-[20px] border border-border bg-card text-text-primary shadow-[0_30px_60px_-30px_rgba(8,10,40,0.55)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background/60 px-4 py-3 md:px-6">
            {roast ? (
              <button onClick={reset} className="btn-default !px-3.5 !py-1.5 text-sm">
                <RotateCcw size={14} aria-hidden />
                Roast another
              </button>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Flame size={15} className="text-accent" aria-hidden />
                Your idea
              </p>
            )}
            <p className="ml-auto flex items-center gap-2 text-sm text-text-muted" aria-live="polite">
              <span
                className={`h-2 w-2 rounded-full ${
                  loading ? 'animate-pulse bg-[#F5B53F]' : roast ? 'bg-[#232C82]' : 'bg-border'
                }`}
              />
              {status}
            </p>
          </div>

          {/* Input */}
          {!roast && !loading && (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="p-5 md:p-8">
                <label htmlFor="roast-idea" className="text-[0.9375rem] font-medium text-text-primary">
                  Pitch it like you would at a party
                </label>
                <textarea
                  id="roast-idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="What it is, who it’s for, and why they’d pay. One or two sentences."
                  rows={5}
                  maxLength={MAX_CHARS}
                  className="mt-3 w-full resize-y rounded-2xl border border-border bg-background p-4 text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                />
                <p className="mt-2 text-right text-xs tabular-nums text-text-muted">
                  {idea.length} / {MAX_CHARS}
                </p>

                <p className="mt-2 text-sm text-text-muted">No idea handy? Borrow one:</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {EXAMPLES.map((ex) => (
                    <li key={ex}>
                      <button
                        type="button"
                        onClick={() => {
                          setIdea(ex)
                          track('idea_roast_example_used')
                        }}
                        className="w-full rounded-xl border border-border px-3.5 py-2 text-left text-sm text-text-muted transition-colors hover:border-accent/50 hover:text-text-primary"
                      >
                        {ex}
                      </button>
                    </li>
                  ))}
                </ul>

                {error && (
                  <div className="mt-5 flex gap-3 rounded-2xl bg-accent-light p-4 text-[0.9375rem] text-text-primary" role="alert">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <div>
                      <p>{error.message}</p>
                      {error.limited && (
                        <Link href={reviewHref} className="text-link mt-2 inline-block">
                          Try Crit on your landing page instead
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!ready}
                  className="btn-primary mt-6 w-full !py-3 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:!px-7"
                >
                  <Flame size={16} aria-hidden />
                  Roast my idea
                </button>
                <p className="mt-4 text-xs leading-relaxed text-text-muted">
                  * Your idea is sent to an AI service to write the roast. It isn&apos;t saved.{' '}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
                    Privacy policy
                  </Link>
                </p>
              </div>

              <aside className="border-t border-border bg-background/60 p-5 md:border-l md:border-t-0 md:p-8">
                <p className="text-sm font-medium text-text-primary">What you&apos;ll get</p>
                <ul className="mt-5 space-y-5">
                  {INCLUDES.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-3.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-light text-accent">
                        <Icon size={17} aria-hidden />
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            </form>
          )}

          {/* Progress */}
          {loading && (
            <div className="grid place-items-center px-6 py-16 md:py-24">
              <span className="review-spinner h-16 w-16 rounded-full" aria-hidden />
              <ol className="mt-10 w-full max-w-sm space-y-3">
                {STAGES.map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-3 text-[0.9375rem] transition-colors ${
                      i < stage ? 'text-text-muted' : i === stage ? 'font-medium text-text-primary' : 'text-text-muted/50'
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        i < stage ? 'bg-[#232C82] text-white' : i === stage ? 'bg-accent-light text-accent' : 'bg-surface'
                      }`}
                    >
                      {i < stage ? <Check size={13} aria-hidden /> : i === stage ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : null}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Results */}
          {roast && (
            <div className="grid md:grid-cols-[250px_minmax(0,1fr)]">
              <aside className="border-b border-border bg-background/60 p-5 md:border-b-0 md:border-r md:p-6">
                <div className="md:sticky md:top-24">
                  <Odds odds={roast.odds} />
                  <div className="mt-6 grid gap-2">
                    <button onClick={share} className="btn-primary w-full !py-2 text-sm">
                      {done === 'shared' || done === 'downloaded' ? <Check size={15} aria-hidden /> : <ImageIcon size={15} aria-hidden />}
                      {done === 'shared' ? 'Shared' : done === 'downloaded' ? 'Card saved' : 'Share as an image'}
                    </button>
                    <button onClick={copy} className="btn-default w-full !py-2 text-sm">
                      {done === 'copied' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                      {done === 'copied' ? 'Roast copied' : 'Copy the roast'}
                    </button>
                  </div>
                </div>
              </aside>

              <div className="min-w-0 space-y-10 p-5 md:p-10">
                <section>
                  <p className="text-sm text-text-muted">&ldquo;{submitted}&rdquo;</p>
                  <p className="mt-4 font-serif text-3xl leading-tight text-text-primary md:text-4xl">{roast.headline}</p>
                  <p className="mt-4 leading-relaxed text-text-muted">
                    <span className="font-medium text-text-primary">What I heard: </span>
                    {roast.restated}
                  </p>
                </section>

                <section>
                  <SectionTitle icon={Flame}>The roast</SectionTitle>
                  <ol className="mt-4 space-y-3">
                    {roast.jabs.map((j, i) => (
                      <li key={i} className="flex gap-3 rounded-2xl border border-border p-4 leading-relaxed text-text-primary">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-light text-sm font-semibold tabular-nums text-accent">
                          {i + 1}
                        </span>
                        {j}
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <SectionTitle icon={TriangleAlert}>The real risk</SectionTitle>
                  <p className="mt-4 leading-relaxed text-text-primary">{roast.realRisk}</p>
                </section>

                <section>
                  <SectionTitle icon={ThumbsUp}>What&apos;s actually good</SectionTitle>
                  <ul className="mt-4 space-y-2.5">
                    {roast.goodBits.map((g, i) => (
                      <li key={i} className="flex gap-3 leading-relaxed text-text-muted">
                        <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                        {g}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <SectionTitle icon={FlaskConical}>Test it this week</SectionTitle>
                  <div className="theme-dark mt-5 rounded-2xl p-6 md:p-8">
                    <p className="text-lg leading-relaxed text-text-primary">{roast.test}</p>
                    <p className="mt-5 text-sm text-text-muted">
                      If the test goes well and you want the first version built,{' '}
                      <Link href="/contact" className="text-link">
                        get in touch
                      </Link>
                      .
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="why-h">
        <p className="label">Why a roast</p>
        <div className="section-body">
          <h2 id="why-h" className="h2">
            Jokes first, then the bit that <em>matters</em>
          </h2>
          <p className="measure muted">
            Most ideas never meet a stranger before money is spent on them. A roast is a gentle way to
            hear the obvious objection early, and every roast ends with a test you can run in a week,
            often without writing any code.
          </p>
          <Note>the odds are a guess, not a forecast</Note>
        </div>
      </section>

      <section className="section band-warm" aria-labelledby="help-h">
        <p className="label">Next step</p>
        <div className="section-body">
          <h2 id="help-h" className="h2">
            Survived the <em>roast?</em>
          </h2>
          <p className="measure muted">
            I design and build first versions of new products for founders, for a fixed price agreed
            before work starts. Already have a landing page? Crit will review it.
          </p>
          <div className="btns">
            <Link href="/contact" className="btn-primary">
              Get in touch <Arrow />
            </Link>
            <Link href={reviewHref} className="more">
              Review my landing page <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/** The survival odds as a big percentage over a bar. */
function Odds({ odds }: { odds: number }) {
  return (
    <div>
      <p className="text-sm text-text-muted">Survival odds</p>
      <p className="mt-1 font-serif text-6xl leading-none tabular-nums text-text-primary">{odds}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface" role="img" aria-label={`${odds} percent`}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${odds}%` }} />
      </div>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
        <Sparkles size={14} aria-hidden />
        {oddsLabel(odds)}
      </p>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Flame; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-semibold text-text-primary">
      <Icon size={19} className="text-accent" aria-hidden />
      {children}
    </h2>
  )
}
