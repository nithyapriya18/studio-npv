import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Instrument_Serif, Kalam } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { themeBoot } from '@/components/theme-toggle'
import { siteConfig } from '@/config'

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

// The margin layer only: pen notes in sindoor or marigold.
const hand = Kalam({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-hand',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: siteConfig.name,
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F2EC' },
    { media: '(prefers-color-scheme: dark)', color: '#10143A' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <a
          href="#content"
          className="btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[70]"
        >
          Skip to content
        </a>
        <Nav />
        <main id="content" className="wrap">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
