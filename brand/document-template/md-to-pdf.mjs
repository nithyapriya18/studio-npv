#!/usr/bin/env node
// Render a Markdown file to a Studio NPV branded PDF (light scheme, A4).
//
// Usage:
//   node md-to-pdf.mjs <input.md> [output.pdf] [--html out.html]
//
// Optional front matter at the top of the Markdown file:
//   ---
//   title: Growth OS for *UPSC*      (wrap one accent word in *...* for indigo italic)
//   subtitle: One line under the title
//   eyebrow: Research and plan
//   date: 16 November 2026
//   status: Draft
//   prepared_for: Studio NPV          (any extra key shows in the cover details)
//   note: one short margin note (Kalam, vermilion); optional, at most one
//   wordmark: true                    (false for client documents)
//   toc: true                         (table of contents from the ## headings)
//   ---
//
// Rules this follows (brand/BRAND.md): light scheme for anything printed, Instrument
// Serif headings, Instrument Sans body, callouts (> blockquotes) on Turmeric. No
// credit line, and the PDF author stays empty (no "Studio NPV" in metadata).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const htmlFlag = args.indexOf("--html");
let htmlOut = null;
if (htmlFlag !== -1) { htmlOut = args[htmlFlag + 1]; args.splice(htmlFlag, 2); }
const [input, outputArg] = args;
if (!input) { console.error("Usage: node md-to-pdf.mjs <input.md> [output.pdf] [--html out.html]"); process.exit(1); }
const output = outputArg || input.replace(/\.md$/i, "") + ".pdf";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const accent = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let src = fs.readFileSync(input, "utf8");
const meta = {};
const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
if (fm) {
  for (const line of fm[1].split("\n")) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  src = src.slice(fm[0].length);
}

// Title: front matter, else the first "# " heading (which is then removed from the body).
if (!meta.title) {
  const h1 = src.match(/^#\s+(.+)$/m);
  if (h1) { meta.title = h1[1].trim(); src = src.replace(h1[0], ""); }
}
meta.title = meta.title || path.basename(input, ".md");

// Headings get ids so the contents page links work.
const toc = [];
const renderer = new marked.Renderer();
renderer.heading = function ({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const id = slug(text);
  if (depth === 2) toc.push({ id, text });
  return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};
const body = marked.parse(src, { renderer, gfm: true });

const known = new Set(["title", "subtitle", "eyebrow", "note", "wordmark", "toc"]);
const label = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const details = Object.entries(meta).filter(([k]) => !known.has(k));
const showWordmark = meta.wordmark !== "false";
const showToc = meta.toc !== "false" && toc.length > 2;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(meta.title.replace(/\*/g, ""))}</title>
<style>${fs.readFileSync(path.join(here, "document.css"), "utf8")}</style>
</head><body>
<section class="cover">
  <div class="cover-band">
    ${showWordmark ? '<div class="wordmark">studio <em>npv</em></div>' : ""}
    ${meta.eyebrow ? `<div class="eyebrow">${esc(meta.eyebrow)}</div>` : '<div class="eyebrow">&nbsp;</div>'}
    <h1>${accent(meta.title)}</h1>
    ${meta.subtitle ? `<div class="subtitle">${accent(meta.subtitle)}</div>` : ""}
  </div>
  <div class="cover-body">
    ${meta.note ? `<div class="note">${esc(meta.note)}</div>` : ""}
    ${details.length ? `<dl class="meta">${details.map(([k, v]) => `<dt>${esc(label(k))}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
  </div>
</section>
${showToc ? `<nav class="toc"><h2>Contents</h2><ol>${toc.map((t, i) => `<li><a href="#${t.id}"><span class="num">${i + 1}</span>${t.text.replace(/^\d+\.\s*/, "")}</a></li>`).join("")}</ol></nav>` : ""}
<main>${body}</main>
</body></html>`;

if (htmlOut) fs.writeFileSync(htmlOut, html);

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
if (!executablePath) { console.error("No Chrome found. Set CHROME_PATH."); process.exit(1); }

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const plainTitle = esc(meta.title.replace(/\*/g, ""));
  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font-family:'Instrument Sans',sans-serif;font-size:7.5pt;color:#555A78;padding:0 18mm;display:flex;justify-content:space-between;">
      <span>${plainTitle}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
} finally {
  await browser.close();
}
console.log(`Wrote ${output}`);
