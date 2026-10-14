export const TILE = Object.freeze({ width: 1, height: 1.35, depth: 0.77 })
export const TABLE = Object.freeze({ halfWidth: 15, goldHalfWidth: 14.7 })
export const SEATS = Object.freeze({
  us: { angle: 0 },
  right: { angle: Math.PI / 2 },
  opposite: { angle: Math.PI },
  left: { angle: -Math.PI / 2 },
})

const rotateY = ([x, y, z], angle) => [x * Math.cos(angle) + z * Math.sin(angle), y, -x * Math.sin(angle) + z * Math.cos(angle)]

export function seatTransform(seat, pos, rot = [0, 0, 0]) {
  const angle = SEATS[seat]?.angle ?? 0
  return { pos: rotateY(pos, angle), rot: [rot[0], rot[1] + angle, rot[2]] }
}

export function handPosition(index, count, { drawGap = false, y = TILE.height / 2 } = {}) {
  const totalWidth = (count - 1) * 1.02 + (drawGap ? 0.35 : 0)
  const gapOffset = drawGap && index >= count - 1 ? 0.35 : 0
  return [(index * 1.02) - totalWidth / 2 + gapOffset, y, 11.6]
}

export function pondPosition(index, { sideways = false } = {}) {
  const row = Math.floor(index / 6)
  const col = index % 6
  return { pos: [-2.55 + col * 1.02 - (sideways ? 0.18 : 0), TILE.depth / 2, 3.2 + row * 1.4], rot: [-Math.PI / 2, 0, sideways ? Math.PI / 2 : 0] }
}

export function wallPosition(index, layer = 0) {
  const stack = Math.floor(index / 2)
  const level = layer ?? index % 2
  return { pos: [-8.16 + stack * 1.02, level ? 1.155 : 0.385, 9.4], rot: [Math.PI / 2, 0, 0] }
}

export function tilePlacement(tile, handCounts = {}) {
  let placement
  if (tile.zone === 'hand') {
    const count = tile.count ?? handCounts[tile.seat] ?? 14
    placement = { pos: handPosition(tile.index, count, { drawGap: tile.drawn }), rot: [0, 0, 0] }
  } else if (tile.zone === 'pond') {
    placement = pondPosition(tile.index, { sideways: tile.sideways })
  } else if (tile.zone === 'wall') {
    placement = wallPosition(tile.index, tile.layer)
  } else if (tile.zone === 'meld') {
    const count = tile.meldCount ?? 3
    const start = 9 - (tile.meldSlot ?? 0) * (count * 1.02 + 0.95)
    const turned = tile.meldCalled ?? -1
    const shift = turned < 0 ? 0 : tile.meldIndex > turned ? 0.35 : tile.meldIndex === turned ? 0.175 : 0
    placement = { pos: [start + tile.meldIndex * 1.02 + shift, TILE.depth / 2, 11.6], rot: [-Math.PI / 2, 0, tile.sideways ? Math.PI / 2 : 0] }
  } else {
    placement = { pos: tile.pos ?? [0, TILE.height / 2, 0], rot: tile.rot ?? [0, 0, 0] }
  }
  return { ...placement, seat: tile.seat ?? 'us' }
}

export function wallTiles() {
  return Object.keys(SEATS).flatMap((seat) => Array.from({ length: 34 }, (_, index) => {
    const layer = index % 2
    const stack = Math.floor(index / 2)
    return { id: `wall-${seat}-${index}`, code: '1z', seat, zone: 'wall', index, layer, pos: [-8.16 + stack * 1.02, layer ? 1.155 : 0.385, 9.4], rot: [Math.PI / 2, 0, 0], faceUp: false, opacity: 1, dim: 0, visible: true, infrastructure: true }
  }))
}
