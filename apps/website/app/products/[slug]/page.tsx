import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAME_PRODUCT, REVIEW_PRODUCT, ROAST_PRODUCT } from '@/lib/products'
import { ReviewApp } from '@/components/products/review-app'
import { RoastApp } from '@/components/products/roast-app'
import { ScopeCreepGame } from '@/components/products/scope-creep-game'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [REVIEW_PRODUCT, ROAST_PRODUCT, GAME_PRODUCT].map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (slug === REVIEW_PRODUCT.slug) {
    return {
      title: `${REVIEW_PRODUCT.name}: a free, detailed review of your landing page`,
      description: `${REVIEW_PRODUCT.tagline} Free, two reviews a day, with the fixes as an AI prompt or a plan.`,
      openGraph: { title: REVIEW_PRODUCT.name, description: REVIEW_PRODUCT.tagline },
    }
  }
  if (slug === ROAST_PRODUCT.slug) {
    return {
      title: `${ROAST_PRODUCT.name}: get your startup idea roasted, kindly`,
      description: `${ROAST_PRODUCT.tagline} Free, three roasts a day.`,
      openGraph: { title: ROAST_PRODUCT.name, description: ROAST_PRODUCT.tagline },
    }
  }
  if (slug === GAME_PRODUCT.slug) {
    return {
      title: `${GAME_PRODUCT.name}: ship your first version before the feature requests win`,
      description: `${GAME_PRODUCT.tagline} Free, in your browser, about a minute a round.`,
      openGraph: { title: GAME_PRODUCT.name, description: GAME_PRODUCT.tagline },
    }
  }
  return {}
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  if (slug === REVIEW_PRODUCT.slug) return <ReviewApp />
  if (slug === ROAST_PRODUCT.slug) return <RoastApp />
  if (slug === GAME_PRODUCT.slug) return <ScopeCreepGame />
  notFound()
}
