# Studio NPV

One-person services studio in Bengaluru. Nithyapriya Veeraraghavan takes an
idea and builds the first version a small or mid-size team can use.

Studio: [studionpv.com](https://studionpv.com) · Profile: [nithyapriya.com](https://www.nithyapriya.com)
Repo: [github.com/nithyapriya18/studio-npv](https://github.com/nithyapriya18/studio-npv)

## Layout

Two Next.js apps, each its own Vercel project:

- `apps/website` — the Studio NPV site, on studionpv.com (Vercel project
  `studio-npv`). Home, About, Start (how an engagement works), Writing, and
  the free tools under `/products` (Crit, Idea Roast, Scope Creep).
- `apps/profile` — my personal profile, on nithyapriya.com (Vercel project
  `nithyapriya-profile`). One static page: experience, skills, education,
  resume. It borrows the studio's colours but not its type or marks, and
  sends old studio paths on this domain to studionpv.com.

## Run

```bash
npm install
npm run dev           # studio on :3000
npm run dev:profile   # profile on :3001
npm run build         # both
```

## What this is not

Not a storefront for a catalog of small SaaS tools — that direction was
tried and retired. See `plan.md` for the current positioning and voice.
