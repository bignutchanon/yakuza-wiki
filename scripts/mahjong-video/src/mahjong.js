export const TILE_CODES = [
  ...['m', 'p', 's'].flatMap((suit) => Array.from({ length: 9 }, (_, i) => `${i + 1}${suit}`)),
  ...Array.from({ length: 7 }, (_, i) => `${i + 1}z`),
]

const CODE_RE = /^([1-9][mps]|[1-7]z)$/
const HONOR_NAMES = ['ลมตะวันออก', 'ลมใต้', 'ลมตะวันตก', 'ลมเหนือ', 'มังกรขาว', 'มังกรเขียว', 'มังกรแดง']
const SUIT_NAMES = { m: 'ตัวอักษร', p: 'วงกลม', s: 'ไม้ไผ่' }

export function parseTiles(source) {
  const tiles = []
  for (const part of source.trim().split(/\s+/)) {
    if (!part) continue
    if (/^[1-9]+[mps]$/.test(part)) {
      const suit = part.at(-1)
      for (const n of part.slice(0, -1)) tiles.push(`${n}${suit}`)
    } else if (/^[1-7]+z$/.test(part)) {
      for (const n of part.slice(0, -1)) tiles.push(`${n}z`)
    }
    else throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${part}`)
  }
  if (tiles.some((tile) => !CODE_RE.test(tile))) throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${source}`)
  return tiles
}

export function countsOf(tiles) {
  const counts = new Map(TILE_CODES.map((code) => [code, 0]))
  for (const code of tiles) {
    if (!CODE_RE.test(code)) throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${code}`)
    counts.set(code, counts.get(code) + 1)
  }
  return counts
}

function removeMelds(counts, meldsLeft) {
  if (meldsLeft === 0) return [...counts.values()].every((count) => count === 0)
  const code = TILE_CODES.find((tile) => counts.get(tile) > 0)
  if (!code) return false
  const count = counts.get(code)
  if (count >= 3) {
    counts.set(code, count - 3)
    if (removeMelds(counts, meldsLeft - 1)) return true
    counts.set(code, count)
  }
  const rank = Number(code[0]); const suit = code[1]
  if (suit !== 'z' && rank <= 7 && counts.get(`${rank + 1}${suit}`) && counts.get(`${rank + 2}${suit}`)) {
    counts.set(code, count - 1); counts.set(`${rank + 1}${suit}`, counts.get(`${rank + 1}${suit}`) - 1); counts.set(`${rank + 2}${suit}`, counts.get(`${rank + 2}${suit}`) - 1)
    if (removeMelds(counts, meldsLeft - 1)) return true
    counts.set(code, count); counts.set(`${rank + 1}${suit}`, counts.get(`${rank + 1}${suit}`) + 1); counts.set(`${rank + 2}${suit}`, counts.get(`${rank + 2}${suit}`) + 1)
  }
  return false
}

export function isCompleteHand(tiles) {
  if (tiles.length !== 14) return false
  const counts = countsOf(tiles)
  if ([...counts.values()].filter((count) => count === 2).length === 7 && [...counts.values()].every((count) => count === 0 || count === 2)) return true
  for (const [pair, count] of counts) {
    if (count < 2) continue
    counts.set(pair, count - 2)
    if (removeMelds(counts, 4)) { counts.set(pair, count); return true }
    counts.set(pair, count)
  }
  return false
}

export function waitingTiles(tiles, fixedTiles = []) {
  if (tiles.length + fixedTiles.length !== 13) throw new Error(`เท็นไปต้องมีไพ่รวม 13 ใบก่อนจั่ว: พบ ${tiles.length + fixedTiles.length}`)
  const counts = countsOf(tiles)
  const fixedCounts = countsOf(fixedTiles)
  return TILE_CODES.filter((code) => counts.get(code) + fixedCounts.get(code) < 4 && isCompleteHand([...tiles, ...fixedTiles, code]))
}

export function nextDora(code) {
  if (!CODE_RE.test(code)) throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${code}`)
  const rank = Number(code[0])
  if (code.endsWith('z')) return `${rank === 4 ? 1 : rank === 7 ? 5 : rank + 1}z`
  return `${rank === 9 ? 1 : rank + 1}${code[1]}`
}

export function tileName(code) {
  if (!CODE_RE.test(code)) throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${code}`)
  return code.endsWith('z') ? HONOR_NAMES[Number(code[0]) - 1] : `${code[0]} ${SUIT_NAMES[code[1]]}`
}
