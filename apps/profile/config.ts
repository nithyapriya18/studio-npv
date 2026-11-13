export const siteConfig = {
  url: 'https://www.nithyapriya.com',
  name: 'Nithyapriya Veeraraghavan',
  short: 'Nithya',
  summary: 'Ten years across software engineering, data science and product management.',
  description:
    'Nithyapriya Veeraraghavan: ten years across software engineering, data science and product management, on AI products in healthcare, supply chain and retail. Bengaluru, India.',
  location: 'Bengaluru, India',
  email: 'nithya.v@outlook.com',
  linkedin: 'https://linkedin.com/in/npv',
  resumeFile: '/Nithyapriya-Veeraraghavan.pdf',
  studioUrl: 'https://studionpv.com',
  studioEmail: 'hello@studionpv.com',
}

export const mailtoHref = `mailto:${siteConfig.email}`
export const studioMailtoHref = `mailto:${siteConfig.studioEmail}`

/** A page on the studio site, for example studio('/products/crit'). */
export const studio = (path = '') => `${siteConfig.studioUrl}${path}`
