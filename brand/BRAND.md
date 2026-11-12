# Studio NPV — Brand guidelines: Indigo & Marigold

v2.1 · October 2026. This is the brand for everything Studio NPV makes: the website, decks, documents, social posts, product UI and email. The same rules as a designed page: [brand-guidelines.html](brand-guidelines.html) and [Studio-NPV-Brand-Guidelines.pdf](Studio-NPV-Brand-Guidelines.pdf) (light) and [Studio-NPV-Brand-Guidelines-Dark.pdf](Studio-NPV-Brand-Guidelines-Dark.pdf) (dark). The live implementation is [apps/website/app/globals.css](../apps/website/app/globals.css). The source design is the "Indigo & Marigold (final)" page of the design canvas at https://claude.ai/artifact/2E386gd3aCLdFDpmkCtVSh.

## 1. Idea: a page, and a margin

Founders hiring a solo builder ask two things: can I trust this person with my idea, and will working with them feel human?

- **The page** answers the first question. It uses structure, real numbers, fixed prices and strong colour blocks.
- **The margin** answers the second. It uses pen notes in vermilion red and marigold circles, as if someone had marked up your plan.

The brand tells the story of a project: napkin, then scope, then shipped. The hand is loudest at the start and quietest at the end. Finished things look finished.

## 2. Colour

There are two brand colours, one pen colour and three neutrals. Every text pairing listed passes WCAG AA (4.5:1).

| Name | Hex | Text on it | Use |
|---|---|---|---|
| Indigo | `#232C82` | white, 12.0:1 | Hero and contact bands, primary buttons, numbers |
| Marigold | `#F5B53F` | Deep Indigo, 8.9:1 | Buttons on indigo, pen circles, active states |
| Vermilion | `#C2401E` | on Paper, 4.6:1 | Handwritten notes, strike-throughs, low scores |
| Deep Indigo | `#161B4F` | white, 16.1:1 | Footer, text on marigold |
| Paper | `#F4F2EC` | Ink, 15.2:1 | The page background |
| Turmeric (wash) | `#FCE9C2` | Ink, 14.3:1 | Warm bands, asides, pills |
| Ink | `#171A33` | on Paper, 15.2:1 | Body text and headlines |
| Slate | `#555A78` | on Paper, 6.0:1 | Secondary text, labels |

**Proportion across a page:** about 50% Paper, 25% Indigo bands and 12% Turmeric, then Ink text. Marigold is only an accent, and Vermilion appears only in the margin.

**Pairings**
- **On an Indigo band:** white headline, accent word in marigold, marigold button.
- **On a Paper page:** ink text, accent word in indigo, indigo button.
- **On a Turmeric band:** use it for proof and next steps; notes go in vermilion.

### Light and dark schemes

Every screen ships in both schemes, because not everyone likes a dark background, and not everyone likes a bright one.

- **Default:** follow the device's setting.
- **Choice:** a round sun / moon button in the header, beside the main button, switches scheme. The choice is remembered on that browser and applied before the page paints, so it never flashes.
- **Same brand in both:** the same type, marks, layout and voice. Only the colours of each role change, as below.
- **Light means light:** in the light scheme nothing on the page is dark. Bands become Indigo wash and the footer is white, and indigo moves into the headlines, accent words and buttons. Solid indigo blocks belong to the dark scheme, and to print and social where a single bold block is the whole design.

| Role | Light scheme | Dark scheme | Text on it, dark |
|---|---|---|---|
| Page background | Paper `#F4F2EC` | Night `#10143A` | Mist, 15.6:1 |
| Cards and panels | White `#FFFFFF` | Night card `#1A1F4D` | Mist, 13.7:1 |
| Body text and headlines | Ink `#171A33` | Mist `#EEF0FB` | |
| Secondary text, labels | Slate `#555A78` | Haze `#AEB3D8` | on Night, 8.7:1 |
| Lines and borders | `#DDD9CE` | `#2A3070` | |
| Accent word, links, active states | Indigo `#232C82` | Marigold `#F5B53F` | on Night, 9.8:1 |
| Primary button | Indigo, white text | Marigold, Deep Indigo text | 8.9:1 |
| Button hover | Marigold, Deep Indigo text | White, Deep Indigo text | |
| Bands (hero, contact) | Indigo wash `#EEEFFA`, Ink text 14.9:1, vermilion notes 4.5:1 | Night indigo `#1C2468` | white, 14.0:1 |
| Warm bands | Turmeric `#FCE9C2` | Night turmeric `#2A2547` | Mist, 12.7:1 |
| Footer | White, with a hairline on top | Midnight `#0B0E2A` | Mist, 16.7:1 |
| Margin notes | Vermilion `#C2401E` | Light vermilion `#FF8F6B` | on Night, 7.9:1 |
| Pen circles and underlines | Marigold (`#E39A1C` on Paper) | Marigold | |

**Pairings in the dark scheme**
- **On a Night page:** Mist text, accent word in marigold, marigold button with Deep Indigo text.
- **On a Night indigo band:** white headline, marigold accent, marigold button.
- **On an Indigo wash band (light scheme):** Ink headline, accent word in indigo, indigo button, marigold pen circles, vermilion notes.
- **Light objects on a band** (mock-ups, review cards) switch to Night card with Mist text, so nothing glows white in the dark.

Every pairing in both schemes passes WCAG AA (4.5:1).

## 3. Wordmark

**studio *npv***: "studio" in Instrument Sans Medium, and "npv" in Instrument Serif Italic at 1.35× the size. Both sit on a shared baseline, and "npv" takes the accent colour of its background:

| Background | "npv" colour |
|---|---|
| Paper | indigo |
| Night (dark scheme) | marigold |
| Indigo | marigold |
| Marigold | Deep Indigo |

The wordmark is always lowercase. Never draw it by hand, circle it, or set it in Kalam. The wordmark belongs to the page, not the margin.

## 4. Type: three voices

| Voice | Typeface | Use |
|---|---|---|
| Display | Instrument Serif (400, roman and italic) | Headlines, big numbers, step numerals, FAQ questions, post titles. The italic word takes the accent colour. Never below 22px. |
| Page | Instrument Sans (400/500/600) | Body text at 17px with 1.6 line height; small text at 14–15px; labels at 12px, uppercase, 0.1em tracking. Every button, field and nav item. |
| Margin | Kalam Light (300) | Margin notes only: vermilion on Paper, marigold on Indigo, 18–24px, one short line. |

All three are free on Google Fonts.

## 5. The margin: four pen marks, used sparingly

These four marks are the whole budget for fun. Use one mark per screen view. If a mark doesn't point at something true and specific, delete it.

| Mark | Colour | Use for |
|---|---|---|
| Circle | marigold | The one word a page is about. Hero headlines only. |
| Underline | marigold | A promise. One section heading per page. |
| Margin note | vermilion | An aside in your voice, beside what it explains. Under eight words. |
| Correction (strike-through) | vermilion | What the studio doesn't do, or what waits until later. Rare. |

**Motion:** circles and underlines draw on once, over 900ms, and nothing loops. With reduced motion turned on, the marks are simply there. Marks are absolutely positioned, so they never shift the layout.

## 6. Controls

Controls belong to the page, never the margin: they are round and exact, and never drawn by hand.

- **Primary button:** Indigo on Paper, Marigold on Indigo. On hover it swaps to the other brand colour.
- **Button size:** a 48px-tall pill (44px minimum touch target) with 24px side padding, Instrument Sans Medium at 15px, and an optional →. Use one primary button per view.
- **Links:** a 1.5px marigold underline.
- **Fields:** 50px tall with a 12px radius. On focus they get an Indigo border and a 3px Turmeric ring. Labels always sit visibly above the field.

## 7. Layout

- **Page rhythm:** a colour-block hero → Paper sections → a Turmeric band for proof → Paper → a colour-block contact band → footer. The colour block is Indigo wash in the light scheme and Night indigo in the dark. Every page opens on one, and no stretch of plain paper runs longer than about two screens.
- **Spacing:**
  - 8px base unit.
  - Sections sit 72px apart on desktop and 48px on phones.
  - Desktop sections have a 200px label rail on the left.
  - At phone width everything stacks, with a 20px gutter.
- **Surfaces:**
  - Grouped items sit on white cards with a 1px border and a 16px radius.
  - Panels on Indigo get a soft deep shadow.
  - Buttons use a 999px radius.
- **Imagery:** one real portrait, ideally on a marigold or indigo backdrop. No stock photos, no illustrated people, and no gradients or glows.

## 8. Voice

Write plainly and directly, in the first person. Say what it costs and what you get; skip describing what you are.

| Topic | Say | Not |
|---|---|---|
| Person | "I design and build…" | "We craft bespoke digital experiences" |
| Price | "a fixed price agreed before work starts" | "affordable packages" |
| Proof | "$6.4M documented cost impact" | "proven track record" |
| Limits | "If you need very large scale from day one, I'll say so." | "No project too big or small" |
| Margin | *the price is set here, once* | jokes, emoji or exclamation marks |

## 9. Do and don't

**Do**
- Open every page on a colour block (Indigo wash in light, Night indigo in dark).
- Use one pen mark per view, pointing at something true.
- Keep finished UI crisp; the hand belongs to drafts and notes.
- Ship every page in both schemes, with the sun / moon toggle in the header.
- Check every page in light, in dark, and at 390px.

**Don't**
- Draw buttons, fields or the wordmark by hand.
- Put marigold text on Paper (it fails contrast).
- Add gradients, glows, emoji or stock imagery.
- Animate anything that loops or follows the cursor.

## 10. Credit line: on everything, always

Everything the studio makes carries a credit back to the studio. This is mandatory, for our own work and for client work.

**The line:** **{Product} by Studio NPV**, linked to https://studionpv.com, followed by the tagline where there is room:

> Drawset by Studio NPV · Have an idea? Let's build it. · studionpv.com

- **{Product}** is the product or piece's own name (Drawset, Crit, Growth OS). When a piece has no product name, use "Built by Studio NPV".
- **On screen:** set "studio npv" as the wordmark, and make it a link to https://studionpv.com. In plain text and files, write "Studio NPV".
- **Tagline:** "Have an idea? Let's build it.", from the website. Drop it only when space is tight; never drop the credit.

| Where | How |
|---|---|
| Apps and product UI | Footer on every screen, with the link |
| Generated files (PDF, DWG, documents, exports) | One small line on every page or sheet, plus the file's Creator / Author metadata |
| Decks | Last slide, plus a small footer on the title slide |
| READMEs, docs, skills | The first line under the title |
| Command-line tools | The help text and the version output |
| Emails and social posts | The signature, or the wordmark bottom-left |

**Client work:** the client's brand leads; the credit sits small and quiet (bottom margin or footer), never in their logo or title block.

## Using it outside the website

- **Decks:** made in either scheme. Light for printing and bright rooms; dark for screens and dim rooms.
  - Title and section slides use an Indigo background (Night indigo in the dark scheme) with white Instrument Serif and a marigold italic accent word.
  - Content slides use a Paper background, or Night in the dark scheme.
  - Put at most one Kalam note per slide.
- **Documents:**
  - The page is Paper or white, with Instrument Serif headings and Instrument Sans body text. Anything meant to be printed uses the light scheme.
  - Callouts sit on Turmeric (Night turmeric in the dark scheme).
- **Product UI** (Crit, Scope Cutter, Growth OS): both schemes, the same toggle in the header, and the same tokens.
- **Social posts:**
  - Use an Indigo or Turmeric background and one headline.
  - Use one pen mark at most.
  - Put the wordmark bottom-left.
