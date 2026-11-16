import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/resume', '/linkedin', '/comments/', '/admin'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
