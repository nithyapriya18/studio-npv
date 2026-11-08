# Studio NPV website — copy and positioning plan

**Status:** executed. The 25-tool storefront (apps, `packages/catalog`, `docs/strategy`) has been removed; the repo is website-only. Public copy matches this plan.
**Remote:** [github.com/nithyapriya18/nava-studios](https://github.com/nithyapriya18/nava-studios)
**This file is for:** rewrite every public line so the site sounds like a senior operator, not a manifesto.

---

## Locked from grill (round 1)

| Decision | Lock |
|---|---|
| Primary offer | Idea → working first product / MVP. Internal-process products are true but secondary, not the hero. |
| Voice | Practical, to the point. No hero / one-man-army / saviour framing. |
| Process | Rethink the current nine; keep any process in a quiet section, not the homepage spine. |
| Price | No numbers on the site until a call. |
| Work | No client case studies (none exist). Anything shown is a **personal project**, not front and centre. |
| Home stats | Planner’s call: no trophy bar on Home. One quiet credibility line on Home; career facts (500K, $6.4M, PSPO) only in About, in context. |
| Contact | Calendar booking is the CTA. Email is backup; work inbox does not exist yet. Wire Calendly/Cal.com when the URL exists. |
| About personal | Live in Bangalore; no family names. |
| Writing | Rewrite both posts in the new voice. Original wording, not a paraphrase of the current essays. |
| Fit lists | No “not a good fit” (or equivalent) anywhere. Say who you are for. Scaling / 24-7 can be one honest sentence later, not a rejection list. |

### Round 2

| Decision | Lock |
|---|---|
| Process count | Nine steps, quiet (on `/start`), not Home. Current Hear/Name/Cut set is rejected; she will pick from new options. |
| Calendar | Placeholder “Book a call” until a real Calendly/Cal.com URL exists. |
| Personal work URL | Dedicated nav item; **one-word path** (choose in round 3). Not framed as clients. |
| Offer B | One subtle clause under the hero, not a section. |
| City | **Bengaluru** (not Bangalore). |
| Duration | “A few weeks” is allowed. Do **not** imply unpaid work. No prices, but never “free.” |
| Byline | **Founder, Studio NPV** under the photo — not Senior AI Product Manager. |

### Round 3 (partial)

| Decision | Lock |
|---|---|
| Personal work URL | `/lab` — personal projects, not clients. |
| First call | **Unpaid.** It exists to understand the idea and send a quote. Copy must not read as “I work for free.” The build starts only after they accept the quote. |
| Ownership | **Default: hand over** — their repo, their hosting, they run it. Studio NPV does not keep the product hostage. Optional: Studio NPV keeps hosting if they ask. **Portfolio:** ask permission to list the work and use screenshots; optional “Built by Studio NPV” credit on the product. Personal `/lab` stays until real clients exist. |
| Nine | **Set 2:** Call, Scope, Quote, Kickoff, Build, Review, Feedback, Handoff, **Continue**. No Restate, no Fix, no After. |

---

## 1. Who this is for, and the one job

**Visitor:** a founder (often first-time) who has an **idea** and needs a first product they can put in front of users. Operators with an internal process to productize are welcome, but they are not who the hero is written for.

**One job of the site:** make that person trust that **Nithya (Studio NPV)** can take their idea (or a brief, if they have one) and ship an MVP they can run — one person, practical, no theatre — then **book a call**.

It is **not** the job of this site to sell 25 tiny SaaS SKUs, lecture visitors about their “messy” processes, or prove you are bigger than enterprise software.

---

## 2. What is actually on the site today

The live site (`apps/website`) is already mostly branded **Studio NPV**. The remaining **Verity** strings are leftover docs, comments, storage prefixes, Cursor permissions, and GitHub metadata — not the hero. The problem is **voice, positioning, and proof**, not the word swap.

### Identity split (the real bug)

Three different businesses are fighting on one domain:

| Version | Where it lives | What it says you are |
|---|---|---|
| A. Services studio | Home, `/start`, `/about`, the nine | One person who learns how a week runs, then builds a custom product |
| B. 25-tool SaaS storefront | `docs/strategy/positioning.md`, website-revamp, product catalog | Fair-priced single-purpose tools, public prices, no “contact us” |
| C. Household products | Work: EasyCook, SnuggleFox | Family software as craft proof |

Your brief for this plan is **A**, scoped to SMB / first product / MVP, with an honest ceiling: **you are not selling scale yet**. B can stay in the repo as future products. It should not drive homepage copy. C can stay as a short “I use what I build” note, not as the portfolio.

### Page-by-page copy audit

**Home (`app/page.tsx`)**  
- Hero: “I build the product your operation is already working around.” — clever, but a first-time visitor has to decode it. It also assumes they already have an operation and a gap, which excludes “I have an idea.”  
- Sub: “I do not arrive with a spec.” — this is the arrogance problem. A professional does not dismiss the client’s materials. Many good clients *do* have a spec, a Notion doc, or a messy brief. The skill is **turning that into a product**, not implying they are wrong for having one.  
- Stats bar: 10+ years, 500K+ users, $6.4M, PSPO I. Impressive, but framed as enterprise flex. Fine in About; on Home it can feel like “I am too senior for you” unless tied to “I now do this for smaller teams.”  
- Process is clean (Discovery → Build → After launch). Keep the shape.  
- “The nine” is brand-first (Nava = nine). For a buyer it is extra ceremony. Peers like [Mzed Studio](https://www.mzed.studio/) use 4–5 plain steps with prices. Keep nine internally if you love it; do not make the visitor learn a vocabulary (Hear, Name, Cut, Sit, Begin) before they email you.  
- Selected work: GST Calculator + two household apps. For a services pitch this reads as “no clients yet,” which may be true — then say so honestly and show **what you built**, not fake case-study metrics (`18% in 1 tap` is marketing, not a client outcome).  
- Fit / not-fit: useful, but “You are primarily comparing hourly rates” sounds like you are scolding shoppers. Rewrite as a calm scope boundary, not a character judgment.

**Unused / competing hero (`components/hero.tsx`)**  
- Different headline, Calendly “Book a free Discovery call,” animated network. If Home does not use it, delete or wire it. Two heroes = two voices.

**About**  
- Strongest page. Still slightly manifesto: “those gaps are the right size for one person.” Family names (Naveen, Rishi) are a taste call — warm vs oversharing.  
- Career story is the credibility. Keep facts; drop the “enterprise abandoned small business” sermon unless you want a political brand.

**Start**  
- Good bones. Fees are vague (“small fixed fee”) which is honest if you do not have a number yet. Peers publish a floor (“from $X”). Decide.  
- Repeats the scolding not-fit list.

**Work + MDX**  
- GST copy still sounds like a portfolio homework (“first production-grade project in this portfolio”).  
- EasyCook / SnuggleFox are well written but they sell a different category than “I will build your MVP.”  
- Work index claims “the same sequence I use with clients” without showing a client.

**Writing**  
- Titles lecture (“the most expensive thing a small business owns…”).  
- “I don’t ask for a brief. I don’t send a list of questions.” Directly contradicts how a professional intake works, and it is the “messy requirements” attitude in another dress. A 10-year operator **does** take a brief, then clarifies it.  
- Fallback posts exist even if MDX is empty — risk of publishing copy you have not stood behind.

**Support / Privacy / Terms / Refunds / 404**  
- Support still says “We typically reply” (studio of one should say I).  
- Privacy: “this website” placeholder.  
- Terms still describe SaaS subscriptions and product pages — leftover from version B.  
- GitHub README/About still describe Verity / old Vercel host.

**Config**  
- Calendly and LinkedIn still `[your-handle]`. Email `nithya.v@outlook.com` (strategy docs once said never publish personal email). Resolve.

### Tone problems (the “cocky” list)

These patterns recur. Ban them in the rewrite:

| Pattern | Example | Why it fails |
|---|---|---|
| Dismissing their materials | “I do not arrive with a spec” / “I don’t ask for a brief” | Insults people who did the work of writing things down |
| Moralizing their ops | implying processes are messy / they own expensive manual work | Not a word you use about a client’s livelihood |
| Brand vocabulary first | Hear / Cut / Sit / Begin | Buyer wanted “what happens in week 1” |
| Enterprise dunking | “too heavy for everyone else” | Sounds like a rant, not a service |
| Fake precision | “18% in 1 tap”, $6.4M without context on Home | Reads as resume inflation |
| Fit-shaming | “if you are comparing hourly rates” | Sounds like you only want worshipful clients |
| Manifesto cadence | short punchy sentences that scold | Reads AI-cocky, not senior |

**Is it right to call requirements messy?** No — not on a professional site. Internally, unclear requirements are normal. Externally, the line is: *ideas and requirements arrive in every form; my job is to turn them into a first version you can use.* That is respect plus competence.

---

## 3. What similar sites do well (and what not to copy)

Benchmarks used: [Mzed Studio](https://www.mzed.studio/), [Kynth Studios](https://kynth.studio/), [Donjean Dev](https://donjean.dev/en), [Vlad Sedenko / MVP](https://sedenko.net/mvp).

**Steal:**

- **Outcome headline, not poetry.** Mzed: “Ship your SaaS without a CTO.” One sentence, one buyer, one fear removed.  
- **One person, said once, then proven.** “You work with me. No handoff.” Then process + work. They do not keep announcing how special solo is.  
- **Packages with a floor.** Landing / MVP / add-on. Even “from $X” beats “we’ll talk.”  
- **Process in weekday language.** Discovery call → scope → build → handoff. Four beats, not nine verbs.  
- **Honest after-launch.** “Some people need ongoing help. Some don’t. Either is fine.” Matches your scaling honesty.  
- **Work that looks like the offer.** If you sell MVPs, show MVPs (or clearly labeled personal products).  
- **CTA that matches readiness.** Email / book a call. Not “read the nine.”

**Do not steal:**

- Kynth’s density, rate-card theater, and “still Isaiah” repetition — stylish, not the calm professional you asked for.  
- Mercurium-style “we build viral apps” — different business.  
- Fake testimonials you do not have.

**Voice target:** calm, specific, first person, short. Sounds like someone who has shipped inside Novartis and Resilinc and is now available for a smaller build — not like a Twitter thread about agencies.

Draft voice chart:

| Do | Don’t |
|---|---|
| “Send what you have — a note, a deck, a list. I’ll turn it into a scoped first version.” | “I don’t do specs / messy briefs.” |
| “I build the first product you can run. I am not the person for hyper-scale yet.” | Pretend you do Kubernetes-for-millions, or hide the limit |
| “One person, end to end, for small and mid-size work.” | “One-man army” on the site (fine as self-talk; on-page it can sound try-hard). Prefer “one person, whole product.” |
| “Typically 2–4 weeks for an MVP-shaped build.” | “Weeks not a long programme” as a jab at consultancies |
| Facts in About | Trophy bar as the first thing they see |

---

## 4. Positioning (locked direction)

**One-liner:** Studio NPV is Nithya. I take your idea and build the first version you can actually use.

**For (stated positively):** founders who need an MVP. Also people who already run a process and want it as software — mentioned once, not the headline.

**Limits (one sentence, not a “not a fit” block):** I size v1 for a small or mid-size team. I am not selling a scale-out or a 24/7 operations team.

**Home how-it-works (three beats, public spine):** Book a call → agree what v1 is → I build it and hand it over. No prices. Never imply the work is free.

**Proof:** decade of shipping (engineer → data science → product). Personal projects on a one-word route. Resume. No invented clients.

**Name:** Studio NPV on every human-readable surface. `verity:` only as legacy storage keys. GitHub About / Vercel / strategy docs still need the rename.

**Voice:** practical, first person, no saviour story.

### Quiet nine — locked

Home never teaches this list. It lives on `/start`. Footer can still say Nava is Sanskrit for new, also nine.

1. **Call** — unpaid; idea in, enough to quote  
2. **Scope** — what v1 includes  
3. **Quote** — the number, before code  
4. **Kickoff** — paid work starts  
5. **Build** — a few weeks, usable product  
6. **Review** — they use it  
7. **Feedback** — we change what’s off (in scope)  
8. **Handoff** — theirs by default  
9. **Continue** — keep this running, or the next piece of work, always quoted  

**Grill is closed.** No code until you say execute.

---

## 5. Page-by-page rewrite intent (not final copy)

**Home**  
- Hero: idea → working first product. Practical. Example direction: *I build the first version of your product — from the idea you already have.*  
- Sub: one person; small and mid-size; I also build internal tools when that is the need; ten years shipping.  
- CTA: **Book a call** (calendar). No email-primary.  
- No trophy bar. No fit/not-fit. No nine board.  
- Selected work: omit from Home, or one line “Personal projects” linking to `/work`.

**About**  
- Photo, name, pronunciation. Bangalore, no family.  
- Career as evidence you can own a product end to end.  
- $6.4M / 500K / PSPO here, with a sentence of context each, not as badges.  
- One sentence on sizing v1, not a rejection list.

**Start**  
- Book a call (placeholder until Calendly exists). Unpaid call; quote after; build is paid.  
- Quiet nine (once chosen) below the fold.  
- Handoff default: their accounts. Credit/portfolio with permission.

**Work**  
- Title it as personal projects. Short intro: these are things I built for myself / as tools; they show how I ship, not client results.  
- Demote from Home. Keep in nav or nest under About — grill.  
- Rewrite MDX; drop fake metrics and “portfolio” language. No client claim.

**Writing**  
- Two new essays, same slots, new titles and arguments (idea → first version; how a first call works). Not a rewrite-in-place of the current posts.

**Support / legal**  
- Calendar as contact where it makes sense; email only as fallback if we have an address. I, not we. Terms match services + existing tools.

**Nav / footer / metadata**  
- Tagline = idea to first product. CTA = Book a call. Location Bangalore on the site if that is how you speak.

**Dead code / GitHub**  
- Unused hero: make it the calendar CTA or delete. README + GitHub About URL. Verity sweep except storage keys.

---

## 6. Ideal end-to-end flow (what we verify after execute)

1. Land on Home → know: Studio NPV is Nithya; she turns ideas into a first product; book a call.  
2. Optional About for career proof. Optional Work clearly marked personal.  
3. Start → know what the call is, that price comes after, no “not a fit” list.  
4. Book a call works (or a visible placeholder if the Calendly URL is still missing).  
5. Writing reads as original, calm, on-offer.  
6. No Verity on the public site; no family names; no prices.

---

## 7. Taste / consistency

- One type voice, one first person, Indian English or standard professional English — pick and stick (today mixes £ examples in writing with India GST).  
- Photo stays; it is the trust asset.  
- Do not add a 25-product grid on this pass.  
- Do not add testimonials you don’t have.  
- Nine-step board: keep as an easter egg *or* retire from Home; do not keep it as the main explanation.

---

## 8. Task list (execute later)

1. Lock positioning + voice from the grill (this file updated if answers change).  
2. Rewrite `config.ts` tagline, metadata, contact labels.  
3. Rewrite Home, About, Start, Work index, three work MDX files, Writing index + posts or unpublish.  
4. Rewrite Support, Privacy, Terms, Refunds, 404, footer, nav as needed.  
5. Remove or reconcile unused `hero.tsx` / competing CTAs.  
6. Sweep remaining user-facing Verity; leave storage legacy prefixes with a comment.  
7. Fix GitHub README + About URL to nava-studios.  
8. Walk the ideal flow locally. No push unless you ask.

---

## 9. Explicitly out of scope for this pass

- Building the 25-tool storefront.  
- Inventing client case studies.  
- Becoming a scaling / SRE studio on paper.  
- Visual redesign (unless a line of copy forces a small layout change).  
- Changing localStorage keys (would log users out of tools).

---

*Executed. See git history on `chore/nava-services-studio-execute` for what changed.*
