import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config'
import { getAllPosts } from '@/lib/mdx'
import { gameHref, reviewHref, roastHref } from '@/lib/products'

const STATIC_ROUTES = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/products', priority: 0.8 },
  { path: reviewHref, priority: 0.9 },
  { path: roastHref, priority: 0.8 },
  { path: gameHref, priority: 0.8 },
  { path: '/contact', priority: 0.9 },
  { path: '/start', priority: 0.7 },
  { path: '/writing', priority: 0.6 },
  { path: '/support', priority: 0.3 },
  { path: '/privacy', priority: 0.1 },
  { path: '/terms', priority: 0.1 },
  { path: '/refunds', priority: 0.1 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    priority,
  }))


  const writingEntries = getAllPosts('writing').map((post) => ({
    url: `${siteConfig.url}/writing/${post.slug}`,
    lastModified: new Date(post.date),
    priority: 0.5,
  }))

  return [...staticEntries, ...writingEntries]
}
