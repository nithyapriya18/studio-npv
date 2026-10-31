import { siteConfig } from '@/config'

/**
 * The products listed under /products. The landing page review is the first;
 * change its name or slug here and every page, link and export follows.
 */
export const REVIEW_PRODUCT = {
  name: 'Crit',
  slug: 'crit',
  tagline: 'A 30-second crit of your landing page, with the fixes ready to use.',
  description:
    'Paste your landing page copy or a link. It reviews the words and the design of your page, and you get a score, what a first-time visitor won’t understand, what’s working, and the specific changes to make. Take the fixes into your AI tool as a prompt or download them as a plan, then review again to see your progress.',
  note: 'Free · two reviews a day',
  features: ['Score and breakdown', 'Design review from a screenshot', 'Issues quoted from your page', 'Suggested copy', 'Progress over time', 'Export as prompt or plan.md'],
}

export const reviewHref = `/products/${REVIEW_PRODUCT.slug}`
export const reviewUrl = `${siteConfig.url}${reviewHref}`

export const SCOPE_PRODUCT = {
  name: 'Scope Cutter',
  slug: 'scope-cutter',
  tagline: 'Cut your feature list down to a first version you can actually ship.',
  description:
    'List every feature you’re imagining. Scope Cutter runs them through the methods product managers use, the Kano model, story mapping and a fixed time budget, and gives you a first release, a queue for what comes next, and what to measure. Free, and nothing leaves your browser.',
  note: 'Free · runs in your browser',
  features: ['Kano model, per feature', 'Walking-skeleton check', 'Fits a time budget', 'What to do by hand', 'Next-release queue', 'Download or print'],
}

export const scopeHref = `/products/${SCOPE_PRODUCT.slug}`
export const scopeUrl = `${siteConfig.url}${scopeHref}`

export const ROAST_PRODUCT = {
  name: 'Idea Roast',
  slug: 'idea-roast',
  tagline: 'Pitch your startup idea in a line or two. Get roasted, kindly, and leave with one test to run this week.',
  description:
    'Type your idea the way you’d pitch it at a party. You get a roast that’s funny but fair, the odds it survives first contact with real users, the risk that matters most, what’s genuinely good about it, and the cheapest way to test it this week. Share it as an image if you dare.',
  note: 'Free · three roasts a day',
  features: ['A roast that’s fair', 'Survival odds', 'The real risk', 'What’s good about it', 'A test for this week', 'Shareable card'],
}

export const roastHref = `/products/${ROAST_PRODUCT.slug}`
export const roastUrl = `${siteConfig.url}${roastHref}`

export const GAME_PRODUCT = {
  name: 'Scope Creep',
  slug: 'scope-creep',
  tagline: 'A small game about shipping a first version before the feature requests bury it.',
  description:
    'Your first version is due in 90 days. Catch the features it actually needs and dodge everything else, like the AI chatbot, the dark mode and "can it also do payroll?" Every extra you catch costs you days. Ship before the clock runs out, then share your launch card.',
  note: 'Free · about a minute a round',
  features: ['Keyboard, mouse or touch', 'Gets harder as you go', 'Launch card to share', 'Your best run, remembered', 'No sign-up', 'Runs in your browser'],
}

export const gameHref = `/products/${GAME_PRODUCT.slug}`
export const gameUrl = `${siteConfig.url}${gameHref}`

// Scope Cutter is off the site while it's reworked: it asks too many
// questions before it gives an answer. Add it back here and in the route.
export const PRODUCTS = [REVIEW_PRODUCT, ROAST_PRODUCT, GAME_PRODUCT]
