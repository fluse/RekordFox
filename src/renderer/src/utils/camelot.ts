export interface CamelotKey {
  num: number
  letter: 'A' | 'B'
}

const CAMELOT_PATTERN = /^(\d{1,2})([AB])$/i

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const hNorm = h / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, hNorm + 1 / 3) * 255,
    hue2rgb(p, q, hNorm) * 255,
    hue2rgb(p, q, hNorm - 1 / 3) * 255
  ]
}

// Camelot wheel color – maps the number (1–12) to a hue on the color wheel
export function camelotColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#52525b'
  const hue = ((num - 1) / 12) * 360
  return `hsl(${hue}, 65%, 52%)`
}

// Picks black or white text depending on the perceived brightness of the camelot color,
// so hues like blue/purple (dark) stay readable next to yellow/green (light).
export function camelotTextColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#fafafa'
  const hue = ((num - 1) / 12) * 360
  const [r, g, b] = hslToRgb(hue, 0.65, 0.52)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 150 ? '#09090b' : '#fafafa'
}

export function parseCamelotKey(raw: string | undefined | null): CamelotKey | null {
  if (!raw) return null
  const match = CAMELOT_PATTERN.exec(raw.trim())
  if (!match) return null
  const num = parseInt(match[1], 10)
  if (num < 1 || num > 12) return null
  return { num, letter: match[2].toUpperCase() as 'A' | 'B' }
}
