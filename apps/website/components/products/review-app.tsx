'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Gauge,
  Link2,
  ImagePlus,
  ListChecks,
  PenLine,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Type,
  X,
} from 'lucide-react'
import { track } from '@/lib/analytics'
import { toPlan, toPrompt, toText, type Review } from '@/lib/review'
import { REVIEW_PRODUCT } from '@/lib/products'
import { historyFor, pageKey, recordReview, shortDate, type HistoryEntry } from '@/lib/review-history'
import { prepareScreenshot } from '@/lib/image-prep'
import { Arrow, Note } from '@/components/pen'
import { ScoreRing } from '@/components/products/score-ring'

type Mode = 'text' | 'url'
type Copied = 'prompt' | 'review' | null

const STAGES = [
  'Reading your page',
  'Checking clarity and audience',
  'Scoring each area',
  'Writing your fixes',
]

const INCLUDES = [
  { icon: Gauge, title: 'A score out of 10', body: 'Plus clarity, audience, value, proof, call to action and design scored separately.' },
  { icon: AlertCircle, title: 'Issues, quoted', body: 'The exact words that cause problems, why they hurt, and how to fix them.' },
  { icon: PenLine, title: 'Suggested copy', body: 'A new headline, subheadline and button text to start from.' },
  { icon: Sparkles, title: 'Take it with you', body: 'Copy the fixes as an AI prompt, or download them as a plan.md.' },
  { icon: TrendingUp, title: 'See your progress', body: 'Review the same page again after changes and see how each score has moved.' },
]

const WHAT_YOU_GET = [
  { title: 'A score out of 10', body: 'Clarity, audience, value, proof, call to action and design, each scored on its own.' },
  { title: 'Design, not just words', body: 'It screenshots the top of your page, so the layout is reviewed along with the copy.' },
  { title: 'Issues quoted from your page', body: 'Each one shows the wording, why it hurts, and a fix.' },
  { title: 'Replacement copy', body: 'Suggested headline, subheadline and button text.' },
  { title: 'Fixes you can use', body: 'Copy them as a prompt for an AI tool, or download them as plan.md.' },
  { title: 'Progress over time', body: 'Re-review the same page after changes and see how the scores moved.' },
]

// The link box starts with this so people only type their domain.
const URL_PREFIX = 'https://www.'

/** A pasted address replaces the prefix instead of being added after it. */
function normalisePastedUrl(pasted: string) {
  const t = pasted.trim()
  if (/^https?:\/\//i.test(t)) return t
  if (/^www\./i.test(t)) return `https://${t}`
  return null
}

type Quota = { remaining: number; limit: number; resetsAt: string | null; owner?: boolean }

/**
 * Milliseconds until `iso`, ticking every second. Null when there's no time.
 * Calls `onDone` once when the time is up.
 */
function useCountdown(iso: string | null, onDone: () => void) {
  const [now, setNow] = useState(() => Date.now())
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })
  useEffect(() => {
    if (!iso) return
    const end = new Date(iso).getTime()
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= end) {
        clearInterval(timer)
        done.current()
      }
    }
    const timer = setInterval(tick, 1000)
    // The clock may be stale from before the countdown started.
    const first = setTimeout(tick)
    return () => {
      clearInterval(timer)
      clearTimeout(first)
    }
  }, [iso])
  return iso ? Math.max(0, new Date(iso).getTime() - now) : null
}

const two = (n: number) => String(n).padStart(2, '0')

/** 17:42:09 */
function clock(ms: number) {
  const total = Math.ceil(ms / 1000)
  return `${two(Math.floor(total / 3600))}:${two(Math.floor((total % 3600) / 60))}:${two(total % 60)}`
}

/** True once there's a real address, not just the prefix. */
const hasAddress = (value: string) => /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+/i.test(value.trim())

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'scores', label: 'Scores' },
  { id: 'issues', label: 'Issues' },
  { id: 'working', label: "What's working" },
  { id: 'copy', label: 'Suggested copy' },
  { id: 'steps', label: 'Next steps' },
]

export function ReviewApp() {
  const [mode, setMode] = useState<Mode>('url')
  const [text, setText] = useState('')
  const [url, setUrl] = useState(URL_PREFIX)
  const urlRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState<{ message: string; limited?: boolean } | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [copied, setCopied] = useState<Copied>(null)
  const [quota, setQuota] = useState<Quota | null>(null)
  const [shot, setShot] = useState<string | null>(null)
  const [shotError, setShotError] = useState<string | null>(null)
  const [previous, setPrevious] = useState<HistoryEntry[]>([])

  const input = (mode === 'text' ? text : url).trim()
  const outOfReviews = quota?.remaining === 0
  // When the countdown runs out, the reviews are back: unlock the form.
  const msLeft = useCountdown(outOfReviews ? quota?.resetsAt ?? null : null, () => {
    setError(null)
    refreshQuota()
  })
  const ready = !outOfReviews && (mode === 'text' ? input.length > 0 : hasAddress(url))

  // Ask the server how many reviews this visitor has left today.
  function refreshQuota() {
    fetch('/api/review', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((q: Quota | null) => q && setQuota(q))
      .catch(() => {})
  }
  useEffect(refreshQuota, [])

  // On switching to Page link, put the cursor after the prefix. Not on first
  // load, so phones don't open the keyboard before the visitor asks.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (mode !== 'url') return
    const el = urlRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [mode])

  function onUrlPaste(e: ClipboardEvent<HTMLInputElement>) {
    const full = normalisePastedUrl(e.clipboardData.getData('text'))
    const el = e.currentTarget
    const onlyPrefix = el.value === URL_PREFIX || (el.selectionStart === 0 && el.selectionEnd === el.value.length)
    if (full && onlyPrefix) {
      e.preventDefault()
      setUrl(full)
    }
  }

  // Move through the progress stages while the review is being written.
  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4500)
    return () => clearInterval(timer)
  }, [loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready || loading) return

    track('roast_submitted', { input_type: mode, input_length: input.length })
    setLoading(true)
    setStage(0)
    setError(null)
    setReview(null)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'text' && shot ? { input, image: shot } : { input }),
      })
      const data = await res.json()
      if (data.quota) setQuota(data.quota)
      if (!res.ok) {
        setError({ message: data.error ?? 'Something went wrong. Try again.', limited: data.limited })
        return
      }
      setSubmitted(input)
      setReview(data)
      const key = pageKey(input, mode === 'url')
      setPrevious(historyFor(key))
      recordReview(key, {
        at: new Date().toISOString(),
        score: data.score,
        areas: Object.fromEntries((data.breakdown ?? []).map((b: { area: string; score: number }) => [b.area, b.score])),
      })
      track('roast_generated', { score: data.score })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError({ message: "Couldn't reach the review service. Check your connection and try again." })
    } finally {
      setLoading(false)
    }
  }

  function copy(kind: Exclude<Copied, null>) {
    if (!review) return
    navigator.clipboard.writeText(kind === 'prompt' ? toPrompt(review, submitted) : toText(review))
    track(kind === 'prompt' ? 'roast_prompt_copied' : 'roast_copied', { score: review.score })
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  function downloadPlan() {
    if (!review) return
    const blob = new Blob([toPlan(review, submitted)], { type: 'text/markdown' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = 'plan.md'
    a.click()
    // Revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(href), 1000)
    track('roast_plan_downloaded', { score: review.score })
  }

  async function onShotChosen(file: File | undefined) {
    setShotError(null)
    if (!file) return
    try {
      setShot(await prepareScreenshot(file))
    } catch (err) {
      setShotError(err instanceof Error ? err.message : 'That image couldn’t be used.')
    }
  }

  function reset() {
    track('roast_another_started')
    setReview(null)
    setError(null)
  }

  const status = loading ? 'Reviewing' : review ? 'Review ready' : 'Ready'

  return (
    <>
    <section className="band page-head">
      <p className="label">Free tool · built and run by Studio NPV</p>
      <h1 className="display">
        <em>Crit</em>
      </h1>
      <p className="lede" style={{ maxWidth: '50ch' }}>
        A review of your landing page in about 30 seconds: what a first-time visitor won’t understand,
        what’s working, and the fixes, ready to use.
      </p>
      <ul className="flex flex-wrap gap-2 text-sm">
        <li className="pill">Free</li>
        <li className="pill" aria-live="polite">
          {quota?.owner
            ? 'Unlimited reviews (owner)'
            : outOfReviews && msLeft
            ? `Next review in ${clock(msLeft)}`
            : quota
              ? `${quota.remaining} of ${quota.limit} reviews left today`
              : '2 free reviews a day'}
        </li>
        <li className="pill">About 30 seconds</li>
      </ul>

      <div className="card mt-4 overflow-hidden rounded-[20px] border border-border bg-card text-text-primary shadow-[0_30px_60px_-30px_rgba(8,10,40,0.55)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background/60 px-4 py-3 md:px-6">
          {!review ? (
            <div role="tablist" aria-label="Input type" className="inline-flex rounded-full bg-surface p-1 text-sm">
              {(
                [
                  ['url', 'Page link', Link2],
                  ['text', 'Paste copy', Type],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  role="tab"
                  type="button"
                  aria-selected={mode === value}
                  disabled={loading}
                  onClick={() => setMode(value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                    mode === value ? 'bg-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon size={14} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={reset} className="btn-default !px-3.5 !py-1.5 text-sm">
              <RotateCcw size={14} aria-hidden />
              New review
            </button>
          )}
          <p className="ml-auto flex items-center gap-2 text-sm text-text-muted" aria-live="polite">
            <span
              className={`h-2 w-2 rounded-full ${
                loading ? 'animate-pulse bg-[#F5B53F]' : review ? 'bg-[#232C82]' : 'bg-border'
              }`}
            />
            {status}
          </p>
        </div>

        {/* Input */}
        {!review && !loading && (
          <form onSubmit={handleSubmit} className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="p-5 md:p-8">
              {mode === 'text' ? (
                <>
                  <label htmlFor="review-text" className="text-[0.9375rem] font-medium text-text-primary">
                    Your landing page copy
                  </label>
                  <textarea
                    id="review-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your headline, subheadline and the main sections of the page, or a short pitch."
                    rows={11}
                    maxLength={6000}
                    className="mt-3 w-full resize-y rounded-2xl border border-border bg-background p-4 text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  />
                  <p className="mt-2 text-right text-xs tabular-nums text-text-muted">
                    {text.length.toLocaleString()} / 6,000
                  </p>

                  <p className="mt-3 text-[0.9375rem] font-medium text-text-primary">
                    Screenshot <span className="font-normal text-text-muted">(optional)</span>
                  </p>
                  {shot ? (
                    <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot} alt="Your screenshot" className="h-16 w-24 rounded-lg border border-border object-cover object-top" />
                      <p className="flex-1 text-sm text-text-muted">The design will be reviewed too.</p>
                      <button type="button" onClick={() => setShot(null)} className="rounded-full p-2 text-text-muted hover:bg-surface hover:text-text-primary" aria-label="Remove screenshot">
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-text-muted transition-colors hover:border-accent/50 hover:text-text-primary">
                      <ImagePlus size={18} className="text-accent" aria-hidden />
                      Add a screenshot of the top of your page, so the design gets reviewed too
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => onShotChosen(e.target.files?.[0])}
                      />
                    </label>
                  )}
                  {shotError && <p className="mt-2 text-sm text-accent">{shotError}</p>}
                </>
              ) : (
                <>
                  <label htmlFor="review-url" className="text-[0.9375rem] font-medium text-text-primary">
                    Page link
                  </label>
                  <input
                    id="review-url"
                    ref={urlRef}
                    type="text"
                    inputMode="url"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={onUrlPaste}
                    placeholder="https://www.yourproduct.com"
                    className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  />
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    Type the rest of your address, such as <span className="text-text-primary">yourproduct.com</span>{' '}
                    or <span className="text-text-primary">yourproduct.in</span>. You can edit the start
                    if your site uses http or doesn&apos;t use www.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    I&apos;ll also take a screenshot of the top of your page, so the design is
                    reviewed along with the words.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Some sites block automatic reading. If yours does, switch to Paste copy.
                    A link that can&apos;t be read doesn&apos;t use up a review.
                  </p>
                </>
              )}

              {error && !(error.limited && outOfReviews) && (
                <div className="mt-5 flex gap-3 rounded-2xl bg-accent-light p-4 text-[0.9375rem] text-text-primary" role="alert">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p>{error.message}</p>
                    {error.limited && (
                      <Link href="/contact" className="text-link mt-2 inline-block">
                        Get in touch
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {outOfReviews && (
                <div className="theme-dark mt-5 rounded-2xl p-5 md:p-6" role="status">
                  <p className="font-medium text-text-primary">You&apos;ve used today&apos;s 2 free reviews.</p>
                  {msLeft ? (
                    <>
                      <p className="mt-1 text-sm text-text-muted">Your next review unlocks in</p>
                      <p className="text-grad mt-3 text-5xl font-bold tabular-nums tracking-tight" aria-live="off">
                        {clock(msLeft)}
                      </p>
                      <p className="mt-1 flex gap-7 text-xs text-text-muted">
                        <span>hours</span>
                        <span>minutes</span>
                        <span>seconds</span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-text-muted">They reset within 24 hours.</p>
                  )}
                  <p className="mt-5 text-[0.9375rem] text-text-muted">
                    Want to talk your page through before then?{' '}
                    <Link href="/contact" className="text-link">
                      Get in touch
                    </Link>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!ready}
                className="btn-primary mt-6 w-full !py-3 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:!px-7"
              >
                <ScanIcon />
                Review my page
              </button>
              <p className="mt-4 text-xs leading-relaxed text-text-muted">
                * What you submit is saved and seen only by me, so I can improve{' '}
                {REVIEW_PRODUCT.name}.{' '}
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
        {review && (
          <div className="grid md:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="border-b border-border bg-background/60 p-5 md:border-b-0 md:border-r md:p-6">
              <div className="md:sticky md:top-24">
                <div className="flex items-center gap-4 md:flex-col md:items-start">
                  <ScoreRing score={review.score} size={120} />
                  <div>
                    <p className="text-[0.9375rem] font-medium leading-snug text-text-primary">{review.verdict}</p>
                    <Progress score={review.score} previous={previous} />
                  </div>
                </div>
                <nav aria-label="Review sections" className="mt-6 hidden md:block">
                  <ul className="space-y-0.5 text-sm">
                    {SECTIONS.map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-6 grid gap-2">
                  <button onClick={() => copy('prompt')} className="btn-primary w-full !py-2 text-sm">
                    {copied === 'prompt' ? <Check size={15} aria-hidden /> : <Sparkles size={15} aria-hidden />}
                    {copied === 'prompt' ? 'Prompt copied' : 'Copy as AI prompt'}
                  </button>
                  <button onClick={downloadPlan} className="btn-default w-full !py-2 text-sm">
                    <Download size={15} aria-hidden />
                    Download plan.md
                  </button>
                  <button onClick={() => copy('review')} className="btn-default w-full !py-2 text-sm">
                    {copied === 'review' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                    {copied === 'review' ? 'Review copied' : 'Copy the review'}
                  </button>
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-12 p-5 md:p-10">
              <section id="overview" className="scroll-mt-24">
                <SectionTitle icon={FileText}>Overview</SectionTitle>
                <p className="mt-4 text-lg leading-relaxed text-text-primary">{review.summary}</p>
                <p className="mt-3 leading-relaxed text-text-muted">
                  <span className="font-medium text-text-primary">Who it seems to be for: </span>
                  {review.audience}
                </p>
                {(review.screenshot || (review.visual === 'uploaded' && shot)) && (
                  <figure className="mt-6">
                    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                      <div className="flex gap-1.5 border-b border-border px-3 py-2" aria-hidden>
                        <span className="h-2 w-2 rounded-full bg-border" />
                        <span className="h-2 w-2 rounded-full bg-border" />
                        <span className="h-2 w-2 rounded-full bg-border" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={review.screenshot ?? shot ?? ''}
                        alt="The top of the reviewed page"
                        className="max-h-[420px] w-full object-cover object-top"
                      />
                    </div>
                    <figcaption className="mt-2 text-sm text-text-muted">
                      What I reviewed: the top of the page, as a first-time visitor sees it.
                    </figcaption>
                  </figure>
                )}
                {review.visual === 'none' && submitted && mode === 'url' && (
                  <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-text-muted">
                    The design wasn&apos;t reviewed this time because a screenshot couldn&apos;t be taken.
                    To include it, switch to Paste copy and add a screenshot.
                  </p>
                )}
                {previous.length > 0 && (
                  <p className="mt-4 text-sm text-text-muted">
                    Your earlier reviews of this {mode === 'url' ? 'page' : 'copy'}:{' '}
                    {previous
                      .slice(-4)
                      .map((p) => `${p.score}/10 on ${shortDate(p.at)}`)
                      .join(', ')}
                    .
                  </p>
                )}
              </section>

              <section id="scores" className="scroll-mt-24">
                <SectionTitle icon={Gauge}>Scores</SectionTitle>
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {review.breakdown.map((b) => (
                    <li key={b.area} className="rounded-2xl border border-border p-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium text-text-primary">{b.area}</span>
                        <span className="flex items-baseline gap-2 text-sm tabular-nums">
                          {(() => {
                            const was = previous.at(-1)?.areas?.[b.area]
                            if (was === undefined || was === b.score) return null
                            return (
                              <span className={b.score > was ? 'text-accent' : 'text-[#C2401E]'}>
                                was {was}
                              </span>
                            )
                          })()}
                          <span className="font-semibold text-text-primary">{b.score}/10</span>
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${b.score * 10}%` }} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-text-muted">{b.note}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="issues" className="scroll-mt-24">
                <SectionTitle icon={AlertCircle}>Issues to fix</SectionTitle>
                <ol className="mt-5 space-y-4">
                  {review.problems.map((p, i) => (
                    <li key={i} className="rounded-2xl border border-border p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-light text-sm font-semibold tabular-nums text-accent">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary">{p.title}</h3>
                          {p.quote && (
                            <blockquote className="mt-3 rounded-xl bg-surface px-4 py-2.5 text-[0.9375rem] italic text-text-muted">
                              &ldquo;{p.quote}&rdquo;
                            </blockquote>
                          )}
                          <p className="mt-3 leading-relaxed text-text-muted">{p.why}</p>
                          <p className="mt-3 leading-relaxed text-text-primary">
                            <span className="font-semibold">Fix: </span>
                            {p.fix}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="working" className="scroll-mt-24">
                <SectionTitle icon={ThumbsUp}>What&apos;s working</SectionTitle>
                <ul className="mt-4 space-y-2.5">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed text-text-muted">
                      <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="copy" className="scroll-mt-24">
                <SectionTitle icon={PenLine}>Suggested copy</SectionTitle>
                <div className="theme-dark mt-5 rounded-2xl p-6 md:p-8">
                  <p className="text-2xl font-semibold leading-snug text-text-primary">{review.rewrite.headline}</p>
                  <p className="mt-3 leading-relaxed text-text-muted">{review.rewrite.subheadline}</p>
                  <span className="btn-primary pointer-events-none mt-6">{review.rewrite.cta}</span>
                </div>
              </section>

              <section id="steps" className="scroll-mt-24">
                <SectionTitle icon={ListChecks}>Next steps, in order</SectionTitle>
                <ol className="mt-4 space-y-3">
                  {review.nextSteps.map((s, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed text-text-muted">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold tabular-nums text-text-primary">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        )}
      </div>

    </section>

    <section className="section" aria-labelledby="what-h">
      <p className="label">What you get</p>
      <div className="section-body">
        <h2 id="what-h" className="h2">
          Scored on the six things that decide a <em>first visit</em>
        </h2>
        <div className="grid2">
          {WHAT_YOU_GET.map((item, i) => (
            <div key={item.title} className="cell">
              <span className="idx">{['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.'][i]}</span>
              <h3 className="h3">{item.title}</h3>
              <p className="muted">{item.body}</p>
            </div>
          ))}
        </div>
        <Note>it started as one prompt on a napkin</Note>
        <Link href="/writing/from-ai-prompt-to-trusted-product" className="more">
          How I built Crit <Arrow />
        </Link>
      </div>
    </section>

    <section className="section band-warm" aria-labelledby="help-h">
      <p className="label">Next step</p>
      <div className="section-body">
        <h2 id="help-h" className="h2">
          Want help making the <em>changes?</em>
        </h2>
        <p className="measure muted">
          I design and build sites and products for founders and small businesses, for a fixed price
          agreed before work starts.
        </p>
        <div className="btns">
          <Link href="/contact" className="btn-primary">
            Get in touch <Arrow />
          </Link>
          <Link href="/start" className="more">
            See how a project runs <Arrow />
          </Link>
        </div>
      </div>
    </section>
    </>
  )
}

/** "Up 3 since 12 Sep" compared with the last review of the same page. */
function Progress({ score, previous }: { score: number; previous: HistoryEntry[] }) {
  const last = previous.at(-1)
  if (!last) return null
  const diff = score - last.score
  const since = shortDate(last.at)
  if (diff === 0) {
    return <p className="mt-2 text-sm text-text-muted">Same score as on {since}</p>
  }
  const up = diff > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${up ? 'bg-accent-light text-accent' : 'bg-[#C2401E]/10 text-[#C2401E]'}`}>
      <Icon size={15} aria-hidden />
      {last.score} → {score}, {up ? 'up' : 'down'} {Math.abs(diff)} since {since}
    </p>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Gauge; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-semibold text-text-primary">
      <Icon size={19} className="text-accent" aria-hidden />
      {children}
    </h2>
  )
}

function ScanIcon() {
  return <Sparkles size={16} aria-hidden />
}
