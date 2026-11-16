'use client'

import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { contactHref, contactLabel, contactIsExternal } from '@/config'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wordmark } from '@/components/wordmark'

const links = [
  { href: '/start', label: 'How it works' },
  { href: '/products', label: 'Products' },
  { href: '/writing', label: 'Writing' },
  { href: '/about', label: 'About' },
]

/**
 * Full width at the top of the page; once you scroll it narrows into a
 * floating pill and the page moves underneath. A soft highlight slides to
 * whichever link is hovered or focused. Adapted from Aceternity's Resizable
 * Navbar, animated with CSS transitions instead of a motion library.
 */
export function Nav() {
  const pathname = usePathname()
  const [floating, setFloating] = useState(false)
  // The menu belongs to the page it was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const [glow, setGlow] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setFloating(window.scrollY > 40)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const moveGlow = (e: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    setGlow({ left: el.offsetLeft, width: el.offsetWidth })
  }

  const ctaProps = contactIsExternal
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className={`hdr${floating ? ' is-floating' : ''}`}>
      <div className="hdr-bar">
        <Wordmark />
        <nav className="nav" aria-label="Main" onMouseLeave={() => setGlow(null)}>
          <span
            className="nav-glow"
            aria-hidden
            style={glow ? { left: glow.left, width: glow.width, opacity: 1 } : { opacity: 0 }}
          />
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              onMouseEnter={moveGlow}
              onFocus={moveGlow}
              onBlur={() => setGlow(null)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hdr-actions">
          <ThemeToggle />
          <a href={contactHref} className="btn-primary btn-sm" {...ctaProps}>
            {contactLabel}
          </a>
          <Link href="/admin" prefetch={false} rel="nofollow" className="btn-quiet btn-sm">
            Sign in
          </Link>
          <button
            type="button"
            className="menu-btn"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="menu"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        {open && (
          <nav id="menu" className="sheet" aria-label="Menu">
            {links.map((link) => (
              <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}
            <a href={contactHref} className="btn btn-primary" {...ctaProps}>
              {contactLabel}
            </a>
            <Link href="/admin" prefetch={false} rel="nofollow">
              Sign in
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
