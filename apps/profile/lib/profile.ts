import { studio } from '@/config'

/*
 * Everything the page says about my work, in one place. The facts come from
 * the resume in public/; change them here when the resume changes.
 */

// Shown as count-ups: prefix + value + suffix, e.g. $6.4M.
export const STATS = [
  { prefix: '', value: 10, decimals: 0, suffix: '+', t: 'years across engineering, data science and product' },
  { prefix: '$', value: 6.4, decimals: 1, suffix: 'M', t: 'saved by an NLP platform I launched at Novartis' },
  { prefix: '', value: 500, decimals: 0, suffix: 'K+', t: 'enterprise users on supply chain AI I owned at Resilinc' },
  { prefix: '', value: 75, decimals: 0, suffix: '%', t: 'of my AI proofs of concept adopted by the business' },
]

/** My own studio, and what it has shipped: one product of its own and one client site. */
export const STUDIO = {
  name: 'Studio NPV',
  href: studio(),
  body: 'My own studio. I scope, design and build first versions of software for founders and small businesses, at a fixed price agreed before work starts.',
}

export const BUILT = [
  {
    kind: 'Product · Live',
    name: 'Crit',
    href: studio('/products/crit'),
    body: 'A 30-second crit of your landing page: a score, what a first-time visitor won’t understand, and the fixes ready to use.',
    cta: 'Try Crit',
  },
  {
    kind: 'Client work · Website design',
    name: 'The Pearls Montessori',
    href: 'https://thepearls.in',
    body: 'Designed and built the school’s new website from scratch: a fast, secure site with a visit-booking and enquiry form that goes straight to the school.',
    cta: 'Visit thepearls.in',
  },
]

/** The four careers, oldest first; the last one is where I am now. */
export const PATH = [
  { year: '2014', title: 'Engineer', t: 'Test frameworks, production fixes' },
  { year: '2018', title: 'Data scientist', t: 'Clinical trial models, dashboards' },
  { year: '2020', title: 'Product lead', t: 'Healthcare, supply chain, agents' },
  { year: '2026', title: 'Founder', t: 'Studio NPV, building in public' },
]

export const ROLES = [
  {
    title: 'Head of Product Management',
    org: 'PetaSight',
    dates: 'Feb 2026 – Present',
    points: [
      'Lead product strategy, roadmap and delivery for an AI-powered healthcare platform, from first user discovery to MVP.',
      'Founding product manager on the build: user research, requirements, wireframes and agentic workflow design, with 3+ features in production in the first quarter.',
      'Prototype and test flows myself with AI-assisted development, and own the investor story and live AI demos.',
    ],
  },
  {
    title: 'Lead, Product Management',
    org: 'Opura AI',
    dates: 'Sept 2025 – Jan 2026',
    points: [
      'Designed a multi-agent system that coordinates 5+ specialised AI agents for personalised shopping, built from zero.',
      'Defined agent roles, handoffs, memory and failure modes, and worked with ML engineers on model choice, prompts and evals.',
      'Took it from concept to a working MVP, and built the go-to-market plan and investor pitch.',
    ],
  },
  {
    title: 'Senior Product Manager',
    org: 'Resilinc',
    dates: 'Jul 2024 – Sept 2025',
    points: [
      'Owned vision and delivery for 3+ supply chain AI products used by 500K+ enterprise users, raising customer satisfaction by 25%.',
      'Shipped an ML risk-scoring engine with 20+ API integrations that improved disruption prediction and operational efficiency by 20%.',
      'Co-created REVA, an LLM assistant for plain-language questions and scenario simulation, and ran a monthly advisory board of 30+ enterprise leaders.',
    ],
  },
  {
    title: 'Senior Specialist, Products (Healthcare AI)',
    org: 'Novartis',
    dates: 'Nov 2020 – Jul 2024',
    points: [
      'Launched an NLP redaction and anonymisation platform across Novartis’s global systems: $6.4M in savings and 30% better compliance.',
      'Ran a pipeline of four AI/ML proofs of concept a quarter with 75% enterprise adoption; GenAI work cut manual effort by 50% and costs by 25%.',
      'Turned regulatory, clinical data and legal requirements into features that passed compliance review, working across clinical, IT, legal and vendor teams.',
    ],
  },
  {
    title: 'Data Scientist',
    org: 'Novartis',
    dates: 'Jun 2018 – Oct 2020',
    points: [
      'Built an XGBoost and marketing-mix model to optimise clinical trial timelines, with 85% accuracy.',
      'Built an R-Shiny text-mining app for document complexity, and Dash Plotly dashboards that flag unusual spending.',
    ],
  },
  {
    title: 'Software Engineer',
    org: 'Tech Mahindra',
    dates: 'Nov 2014 – Apr 2017',
    points: [
      'Built automated test frameworks that raised QA coverage by 35%, fixed 50+ critical production defects and sped up releases by 20%.',
    ],
  },
]

export const SKILLS = [
  {
    group: 'AI and product',
    items: ['Agentic AI and multi-agent systems', 'LLM integration', 'Prompt engineering', 'RAG and AI evals', 'NLP and conversational AI', '0-to-1 products', 'AI/ML roadmaps'],
  },
  {
    group: 'Domains',
    items: ['Healthcare AI and compliance', 'Supply chain AI', 'Enterprise SaaS', 'Early-stage startups'],
  },
  {
    group: 'Ways of working',
    items: ['Go-to-market', 'Stakeholder communication', 'Agile and Scrum', 'A/B testing', 'Data-driven decisions'],
  },
  {
    group: 'Tools',
    items: ['Python', 'Figma', 'Tableau', 'Power BI', 'Balsamiq', 'TIBCO Spotfire'],
  },
]

export const EDUCATION = [
  {
    title: 'Post Graduate Program in Management, Data Analytics and Operations',
    org: 'Great Lakes Institute of Management, Chennai',
    dates: '2017 – 2018',
  },
  {
    title: 'Bachelor of Engineering, Industrial Management',
    org: 'Visvesvaraya Technological University',
    dates: '2010 – 2014',
  },
]

export const CERTIFICATION = 'Professional Scrum Product Owner (PSPO I), Scrum.org'
export const LANGUAGES = 'English, Tamil, Kannada, Hindi'

// Posts live on the studio site.
export const POSTS = [
  {
    slug: 'keeping-up-is-part-of-the-job',
    title: 'Keeping up is part of the job now',
    date: 'Sept 2026',
  },
  {
    slug: 'from-ai-prompt-to-trusted-product',
    title: 'Turning an AI prompt into a product people can trust',
    date: 'Sept 2026',
  },
  {
    slug: 'what-ai-speeds-up',
    title: 'What AI speeds up, and what it quietly takes away',
    date: 'Sept 2026',
  },
]
