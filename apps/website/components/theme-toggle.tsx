'use client'

import { useEffect, useState } from 'react'

/** Runs before the page paints, so a saved choice never flashes the other theme. */
export const themeBoot = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

/**
 * Light or dark. Until someone chooses, the page follows their device; once
 * they do, the choice is remembered on this browser.
 */
export function ThemeToggle({ className = 'theme-btn' }: { className?: string } = {}) {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const read = () => {
      const chosen = document.documentElement.dataset.theme
      setDark(chosen ? chosen === 'dark' : mq.matches)
    }
    read()
    mq.addEventListener('change', read)
    return () => mq.removeEventListener('change', read)
  }, [])

  function flip() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {}
    setDark(!dark)
  }

  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" className={className} onClick={flip} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dark === null ? null : dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        )}
      </svg>
    </button>
  )
}
