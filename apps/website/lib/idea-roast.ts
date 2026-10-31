import { ROAST_PRODUCT, roastUrl } from '@/lib/products'

/** Shape of a roast from Idea Roast, plus the text built from it for sharing. */
export type Roast = {
  /** Chance, 0 to 100, that the idea survives first contact with real users. */
  odds: number
  /** The one line people will screenshot. */
  headline: string
  /** What the idea seems to be, restated plainly. */
  restated: string
  jabs: string[]
  realRisk: string
  goodBits: string[]
  /** The cheapest way to find out if it works, this week. */
  test: string
}

/** A label for the odds, from grim to bright. */
export function oddsLabel(odds: number) {
  if (odds < 15) return 'On life support'
  if (odds < 35) return 'Needs a miracle'
  if (odds < 55) return 'Coin toss'
  if (odds < 75) return 'Has a pulse'
  return 'Annoyingly promising'
}

/** Plain-text version for pasting into a message. */
export function roastToText(roast: Roast, idea: string) {
  return [
    `My idea: "${idea.trim()}"`,
    '',
    `${roast.headline}`,
    `Survival odds: ${roast.odds}% (${oddsLabel(roast.odds)})`,
    '',
    ...roast.jabs.map((j) => `- ${j}`),
    '',
    `The real risk: ${roast.realRisk}`,
    `Test it this week: ${roast.test}`,
    '',
    `Roasted by ${ROAST_PRODUCT.name} at ${roastUrl.replace('https://', '')}`,
  ].join('\n')
}
