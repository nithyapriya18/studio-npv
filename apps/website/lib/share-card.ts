/**
 * Draws a 1200 x 630 card (the size social sites preview) in the studio's
 * indigo and marigold, for Idea Roast and Scope Creep to share. Everything is
 * drawn in the browser, so sharing costs nothing and nothing is uploaded.
 */
export type CardContent = {
  /** Small caps line at the top, such as "IDEA ROAST". */
  label: string
  /** The big figure on the left, such as "23%" or "41 days". */
  figure: string
  /** A short line under the figure. */
  figureNote: string
  /** The main text on the right. */
  headline: string
  /** A smaller line under the headline. */
  detail?: string
  /** Shown bottom right, such as "studionpv.com/products/idea-roast". */
  url: string
}

const W = 1200
const H = 630

function fontFamily(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value ? `${value}, ${fallback}` : fallback
}

/** Breaks text into lines that fit `width`, at most `max` lines, with an ellipsis if cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width || !line) {
      line = next
      continue
    }
    lines.push(line)
    line = word
    if (lines.length === max) break
  }
  if (lines.length < max && line) lines.push(line)
  const used = lines.join(' ').split(/\s+/).length
  if (used < words.length) {
    let last = lines[lines.length - 1]
    while (last && ctx.measureText(`${last}…`).width > width) last = last.replace(/\s*\S+$/, '')
    lines[lines.length - 1] = `${last}…`
  }
  return lines
}

export async function drawCard(content: CardContent): Promise<Blob> {
  // Make sure the web fonts are ready, or the card falls back to Georgia.
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  const serif = fontFamily('--font-serif', 'Georgia, serif')
  const sans = fontFamily('--font-sans', 'system-ui, sans-serif')

  ctx.fillStyle = '#161b4f'
  ctx.fillRect(0, 0, W, H)
  // A marigold glow in the corner, like the site's bands.
  const glow = ctx.createRadialGradient(W - 120, 80, 10, W - 120, 80, 520)
  glow.addColorStop(0, 'rgba(245,181,63,0.28)')
  glow.addColorStop(1, 'rgba(245,181,63,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#f5b53f'
  ctx.font = `600 22px ${sans}`
  ctx.textBaseline = 'top'
  ctx.fillText(content.label.toUpperCase().split('').join(String.fromCharCode(8202)), 72, 64)

  // The figure, sized down until it fits its column.
  let size = 150
  ctx.font = `400 ${size}px ${serif}`
  while (ctx.measureText(content.figure).width > 380 && size > 60) {
    size -= 6
    ctx.font = `400 ${size}px ${serif}`
  }
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(content.figure, 72, 300)
  ctx.font = `500 26px ${sans}`
  ctx.fillStyle = '#aeb3d8'
  wrap(ctx, content.figureNote, 360, 2).forEach((l, i) => ctx.fillText(l, 72, 350 + i * 34))

  ctx.font = `400 44px ${serif}`
  ctx.fillStyle = '#ffffff'
  const head = wrap(ctx, content.headline, 640, 5)
  head.forEach((l, i) => ctx.fillText(l, 488, 170 + i * 54))
  if (content.detail) {
    ctx.font = `400 24px ${sans}`
    ctx.fillStyle = '#aeb3d8'
    wrap(ctx, content.detail, 640, 3).forEach((l, i) => ctx.fillText(l, 488, 170 + head.length * 54 + 26 + i * 32))
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(72, H - 96)
  ctx.lineTo(W - 72, H - 96)
  ctx.stroke()
  ctx.font = `600 24px ${sans}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Studio NPV', 72, H - 50)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#f5b53f'
  ctx.fillText(content.url, W - 72, H - 50)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the card'))), 'image/png'),
  )
}

/**
 * Opens the phone's share sheet with the card where that's supported, and
 * downloads it everywhere else. Returns how it went out.
 */
export async function shareCard(blob: Blob, filename: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    }
  }
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(href), 1000)
  return 'downloaded'
}
