# Studio NPV document template

Turns a Markdown file into a branded A4 PDF in the light scheme: Instrument Serif headings, Instrument Sans body, Indigo table headers, callouts on Turmeric, a cover that opens on an Indigo wash band, a contents page, and page numbers. It follows the "Documents" rules in [../BRAND.md](../BRAND.md).

```sh
cd brand/document-template
npm install            # once
node md-to-pdf.mjs path/to/doc.md path/to/doc.pdf
```

- Front matter at the top of the Markdown sets the cover (title, subtitle, eyebrow, date, status, any other details, one optional margin note). See the comment at the top of `md-to-pdf.mjs`.
- Wrap one word of the title in `*...*` to set it in indigo italic.
- A `> blockquote` becomes a Turmeric callout.
- Set `wordmark: false` for client documents. Documents never carry the "by Studio NPV" credit line, and the PDF author stays empty.
- It uses the installed Chrome (set `CHROME_PATH` if it lives elsewhere).
