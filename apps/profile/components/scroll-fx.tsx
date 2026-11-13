'use client'

import { useEffect } from 'react'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The page's scroll effects. It adds classes and numbers; the stylesheet
 * does the drawing.
 *
 * - .in on .rv: blocks ease in once they enter the screen
 * - [data-count]: numbers count up the first time they're seen
 */
export function ScrollFx() {
  useEffect(() => {
    const still = reduced()

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          reveal.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    document.querySelectorAll('.rv').forEach((el) => reveal.observe(el))

    // Numbers already on screen at load keep their value; the rest count up.
    const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-count]')).filter(
      (el) => !still && el.getBoundingClientRect().top > window.innerHeight,
    )
    const show = (el: HTMLElement, v: number) => {
      const d = Number(el.dataset.decimals ?? 0)
      el.textContent = `${el.dataset.prefix ?? ''}${v.toFixed(d)}${el.dataset.suffix ?? ''}`
    }
    counters.forEach((el) => show(el, 0))
    const count = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          count.unobserve(el)
          const to = Number(el.dataset.count)
          const start = performance.now()
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 1400)
            show(el, to * (1 - Math.pow(1 - t, 3)))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    counters.forEach((el) => count.observe(el))

    return () => {
      reveal.disconnect()
      count.disconnect()
    }
  }, [])

  return null
}
