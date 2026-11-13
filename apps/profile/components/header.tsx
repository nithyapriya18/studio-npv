'use client'

import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { TrackedLink } from '@/components/tracked-link'
import { siteConfig } from '@/config'

const SECTIONS = [
  { id: 'experience', label: 'Work' },
  { id: 'built', label: 'Built' },
  { id: 'writing', label: 'Writing' },
  { id: 'contact', label: 'Contact' },
]

/** Name, section chips, theme and resume. Frosted once you scroll. */
export function Header() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`bar${solid ? ' solid' : ''}`}>
      <div className="bar-in">
        <a href="#top" className="brand" aria-label={`${siteConfig.name}, back to top`}>
          Nithyapriya <span className="brand-last">Veeraraghavan</span>
        </a>
        <nav className="bar-nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="bar-actions">
          <ThemeToggle />
          <TrackedLink
            href={siteConfig.resumeFile}
            download
            event="resume_downloaded"
            properties={{ location: 'header' }}
            className="btn btn-primary btn-sm"
          >
            Resume
          </TrackedLink>
        </div>
      </div>
    </header>
  )
}
