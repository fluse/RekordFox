export interface KnobGeometry {
  angle: number
  percent: number
}

// Piecewise-linear mapping of a knob value to its pointer angle and fill percentage, arranged so
// that 0 dB points straight up (12 o'clock) and the sweep spans ±135°.
export function computeKnobGeometry(value: number, min: number, max: number): KnobGeometry {
  if (value <= 0) {
    return {
      percent: min !== 0 ? 0.5 * (1 - value / min) : 0,
      angle: min !== 0 ? (value / min) * -135 : 0
    }
  }
  return {
    percent: max !== 0 ? 0.5 + 0.5 * (value / max) : 1,
    angle: max !== 0 ? (value / max) * 135 : 0
  }
}
