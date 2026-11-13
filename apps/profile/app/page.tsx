import Image from 'next/image'
import { Spotlight } from '@/components/effects'
import { Header } from '@/components/header'
import { ScrollFx } from '@/components/scroll-fx'
import { TrackedLink } from '@/components/tracked-link'
import { siteConfig, mailtoHref, studio, studioMailtoHref } from '@/config'
import {
  BUILT,
  CERTIFICATION,
  EDUCATION,
  LANGUAGES,
  PATH,
  POSTS,
  ROLES,
  SKILLS,
  STATS,
  STUDIO,
} from '@/lib/profile'

/*
 * The profile as a proof board: one grid of tiles that says who I am, shows
 * the evidence, and gives hiring teams and founders each their own way in.
 */

function Arrow() {
  return (
    <span className="arr" aria-hidden>
      →
    </span>
  )
}

/** "Sept 2025 – Jan 2026" → "2025 – 26"; "Feb 2026 – Present" → "2026 – now". */
function shortDates(dates: string) {
  const [from, to] = dates.split('–').map((d) => d.trim())
  const y1 = from.slice(-4)
  if (/present/i.test(to)) return `${y1} – now`
  return `${y1} – ${to.slice(-2)}`
}

export default function Home() {
  return (
    <>
      <Header />
      <ScrollFx />

      <main id="content" className="board">
        <Spotlight className="grid">
          {/* Who I am, and the two ways in. */}
          <section id="top" className="t hero spot" aria-labelledby="hero-h">
            <span className="eyebrow">{siteConfig.location}</span>
            <h1 id="hero-h" className="hero-t">
              Nithyapriya <em>Veeraraghavan</em>
            </h1>
            <p className="hero-role">VP of Product · Founder · Product management</p>
            <p className="lede">
              Ten years building software, the last six leading AI products in healthcare, supply chain and
              retail, at Novartis, Resilinc and early-stage startups.
            </p>
            {/* Two ways in: a question, its answer, and the address to write to. */}
            <div className="doors">
              <div className="door door-hire">
                <span className="door-q">Hiring?</span>
                <TrackedLink
                  href={siteConfig.resumeFile}
                  download
                  event="resume_downloaded"
                  properties={{ location: 'hero' }}
                  className="door-a"
                >
                  Get my resume <Arrow />
                </TrackedLink>
                <TrackedLink
                  href={mailtoHref}
                  event="email_clicked"
                  properties={{ location: 'hero' }}
                  className="door-mail"
                >
                  {siteConfig.email}
                </TrackedLink>
              </div>
              <div className="door door-build">
                <span className="door-q">Need something built?</span>
                <TrackedLink
                  href={studio()}
                  event="studio_opened"
                  properties={{ location: 'hero' }}
                  className="door-a"
                >
                  Start at Studio NPV <Arrow />
                </TrackedLink>
                <TrackedLink
                  href={studioMailtoHref}
                  event="studio_email_clicked"
                  properties={{ location: 'hero' }}
                  className="door-mail"
                >
                  {siteConfig.studioEmail}
                </TrackedLink>
              </div>
            </div>
          </section>

          <figure className="t photo">
            <Image
              src="/nithya.jpeg"
              alt={`Portrait of ${siteConfig.name}`}
              fill
              sizes="(min-width: 1000px) 400px, 92vw"
              preload
            />
            <figcaption className="now">
              <span className="dot" aria-hidden />
              <span>
                <b>Now:</b> VP of Product at PetaSight, building a healthcare AI platform
              </span>
            </figcaption>
          </figure>

          {/* The numbers. */}
          {STATS.map((s, i) => (
            <div key={s.t} className="t stat spot rv" style={{ transitionDelay: `${i * 70}ms` }}>
              <span
                className="stat-n"
                data-count={s.value}
                data-prefix={s.prefix}
                data-suffix={s.suffix}
                data-decimals={s.decimals}
              >
                {`${s.prefix}${s.value.toFixed(s.decimals)}${s.suffix}`}
              </span>
              <p>{s.t}</p>
            </div>
          ))}

          {/* The path, and the detail behind it. */}
          <section id="path" className="t path spot rv" aria-labelledby="path-h">
            <span className="eyebrow">The path</span>
            <h2 id="path-h" className="tile-t">
              Four careers, each one <em>compounding</em>.
            </h2>
            <ol className="steps">
              {PATH.map((p, i) => (
                <li key={p.title} className={i === PATH.length - 1 ? 'on' : undefined}>
                  <span className="dates">{p.year}</span>
                  <b>{p.title}</b>
                  <span>{p.t}</span>
                </li>
              ))}
            </ol>
            <dl className="facts">
              <div>
                <dt className="eyebrow">Certification</dt>
                <dd>{CERTIFICATION}</dd>
              </div>
              <div>
                <dt className="eyebrow">Languages</dt>
                <dd>{LANGUAGES}</dd>
              </div>
            </dl>
          </section>

          <section id="experience" className="t roles spot rv" aria-labelledby="roles-h">
            <span id="roles-h" className="eyebrow">
              Experience <span className="hint">· open a role for the detail</span>
            </span>
            {ROLES.map((r, i) => (
              <details key={r.title + r.org} className="role" open={i === 0}>
                <summary>
                  <span className="role-t">
                    {r.title} <span className="muted">· {r.org}</span>
                  </span>
                  <span className="dates" title={r.dates}>
                    {shortDates(r.dates)}
                  </span>
                </summary>
                <ul>
                  {r.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </details>
            ))}
          </section>

          {/* Things I've built. */}
          <a id="built" href={STUDIO.href} className="t prod studio spot rv">
            <span className="eyebrow">My studio</span>
            <h3 className="prod-t">{STUDIO.name}</h3>
            <p>{STUDIO.body}</p>
            <span className="go">
              Start a project <Arrow />
            </span>
          </a>
          {BUILT.map((b, i) => (
            <a
              key={b.name}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="t prod spot rv"
              style={{ transitionDelay: `${(i + 1) * 70}ms` }}
            >
              <span className="eyebrow">{b.kind}</span>
              <h3 className="prod-t">{b.name}</h3>
              <p>{b.body}</p>
              <span className="go">
                {b.cta} <Arrow />
              </span>
            </a>
          ))}

          {/* What I bring. */}
          <section id="skills" className="t skills spot rv" aria-labelledby="skills-h">
            <span id="skills-h" className="eyebrow">
              Skills
            </span>
            <div className="skill-groups">
              {SKILLS.map((g) => (
                <div key={g.group}>
                  <h3 className="skill-g">{g.group}</h3>
                  <ul className="chips">
                    {g.items.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="t edu spot rv" aria-labelledby="edu-h">
            <span id="edu-h" className="eyebrow">
              Education
            </span>
            {EDUCATION.map((e) => (
              <div key={e.title} className="edu-row">
                <h3>{e.title}</h3>
                <span className="muted">{e.org}</span>
                <span className="dates">{e.dates}</span>
              </div>
            ))}
          </section>

          {/* Writing and contact. */}
          <section id="writing" className="t write spot rv" aria-labelledby="w-h">
            <span id="w-h" className="eyebrow">
              Writing
            </span>
            <ul>
              {POSTS.map((p) => (
                <li key={p.slug}>
                  <a href={studio(`/writing/${p.slug}`)}>
                    <span className="post-t">{p.title}</span>
                    <span className="dates">{p.date}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a href={studio('/writing')} className="more">
              All writing <Arrow />
            </a>
          </section>

          <section id="contact" className="t contact rv" aria-labelledby="c-h">
            <span className="eyebrow">Contact</span>
            <h2 id="c-h" className="contact-t">
              Let’s <em>talk</em>.
            </h2>
            <p>Open to product leadership roles, collaborations and talks.</p>
            <TrackedLink
              href={mailtoHref}
              event="email_clicked"
              properties={{ location: 'contact' }}
              className="mail"
            >
              {siteConfig.email}
            </TrackedLink>
            <div className="contact-links">
              <TrackedLink
                href={siteConfig.linkedin}
                event="linkedin_opened"
                properties={{ location: 'contact' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </TrackedLink>
              <TrackedLink
                href={siteConfig.resumeFile}
                download
                event="resume_downloaded"
                properties={{ location: 'contact' }}
              >
                Resume (PDF)
              </TrackedLink>
            </div>
          </section>
        </Spotlight>
      </main>

      <footer className="foot">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}
        </span>
        <span>
          Built by <a href={studio()}>Studio NPV</a> · Have an idea? Let’s build it.
        </span>
      </footer>
    </>
  )
}
