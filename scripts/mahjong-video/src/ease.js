export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (v) => { const x = clamp(v); return x * x * (3 - 2 * x) }
export const easeInOutCubic = (v) => { const x = clamp(v); return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2 }
export const mix = (a, b, t) => a + (b - a) * t
