import type { ColorScheme } from '@main/db'

interface Hsl {
  h: number
  s: number
  l: number
}

// Accent hue/saturation/lightness for each preset, shared between light and dark mode
// (only --background/--foreground differ between modes, see main.css).
export const PRESET_SCHEMES: Record<Exclude<ColorScheme, 'custom'>, Hsl> = {
  purple: { h: 263.4, s: 70, l: 50.4 },
  blue: { h: 217.2, s: 91.2, l: 59.8 },
  green: { h: 142.1, s: 70.6, l: 45.3 },
  orange: { h: 24.6, s: 95, l: 53.1 },
  rose: { h: 346.8, s: 77.2, l: 49.8 },
  teal: { h: 173.4, s: 80.4, l: 40 },
  forest: { h: 138.3, s: 31.2, l: 37.1 }, // #417C53
  amber: { h: 37.7, s: 92.1, l: 50.2 },
  cyan: { h: 188.7, s: 94.5, l: 42.7 },
  fuchsia: { h: 292.2, s: 84.1, l: 60.6 }
}

export const CUSTOM_SCHEME_DEFAULT_HEX = '#8b5cf6'

function hslToCss({ h, s, l }: Hsl): string {
  return `${h} ${s}% ${l}%`
}

// Perceived lightness threshold above which dark text reads better than white.
function foregroundForLightness(l: number): string {
  return l > 65 ? '240 10% 3.9%' : '0 0% 98%'
}

export function hexToHsl(hex: string): Hsl {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.substring(0, 2), 16) / 255
  const g = parseInt(normalized.substring(2, 4), 16) / 255
  const b = parseInt(normalized.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const delta = max - min

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6
        break
      case g:
        h = (b - r) / delta + 2
        break
      default:
        h = (r - g) / delta + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  return { h: Math.round(h * 10) / 10, s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10 }
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  const toHex = (v: number): string =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function getSchemeSwatchHex(scheme: Exclude<ColorScheme, 'custom'>): string {
  return hslToHex(PRESET_SCHEMES[scheme])
}

// Applies the accent color (--primary/--ring/--primary-foreground) for the given
// scheme to the document root. Light/dark mode itself is handled separately via the
// .light/.dark class toggle in main.css — the accent hue is independent of that.
export function applyColorScheme(
  root: HTMLElement,
  colorScheme: ColorScheme,
  customAccentColor?: string
): void {
  const hsl =
    colorScheme === 'custom'
      ? hexToHsl(customAccentColor || CUSTOM_SCHEME_DEFAULT_HEX)
      : PRESET_SCHEMES[colorScheme] || PRESET_SCHEMES.purple

  const primary = hslToCss(hsl)
  root.style.setProperty('--primary', primary)
  root.style.setProperty('--ring', primary)
  root.style.setProperty('--primary-foreground', foregroundForLightness(hsl.l))
}
