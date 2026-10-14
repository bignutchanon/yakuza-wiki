import { sceneAt, timelineInfo, timeline } from './timeline.js'
import { parseTiles } from './mahjong.js'
import { TILE, tilePlacement, wallTiles, seatTransform, handPosition } from './layout.js'
import { clamp, easeInOutCubic } from './ease.js'

const cameraFor = (kind) => {
  const poses = {
    overview: { pos: [0, 25, 32], look: [0, 0, 0], fov: 43 },
    center: { pos: [0, 20, 0.1], look: [0, 0, -1], fov: 25, up: [0, 0, -1] },
    hand: { pos: [0, 5, 28], look: [0, 0.75, 11.1], fov: 34 },
    handTable: { pos: [0, 13.5, 24], look: [0, 0.5, 8.3], fov: 36 },
    table: { pos: [0, 22, 30], look: [0, 0.5, 6.4], fov: 35 },
    wall: { pos: [-6.12, 8, 18], look: [-6.12, 1, 9.4], fov: 32 },
    recap: { pos: [-1, 24, 27], look: [-4, 0, 0], fov: 38 },
  }
  return poses[kind] ?? poses.overview
}

const progress = (t, event) => clamp((t - event.at) / Math.max(event.dur, 0.001), 0, 1)
const tileId = (seat, zone, index) => `${zone}-${seat}-${index}`
const heldInOrder = (tiles) => tiles.filter((tile) => tile.id.startsWith('hand-us') && tile.visible !== false).sort((a, b) => a.index - b.index)

function addTile(tiles, tile, handCounts) {
  const place = tilePlacement(tile, handCounts)
  tiles.push({
    id: tile.id,
    code: tile.code,
    seat: place.seat,
    zone: tile.zone,
    pos: tile.pos ?? place.pos,
    rot: tile.rot ?? place.rot,
    faceUp: tile.faceUp ?? tile.zone !== 'wall',
    opacity: tile.opacity ?? 1,
    dim: tile.dim ?? 0,
    glow: tile.glow ?? null,
    visible: tile.visible !== false,
    group: tile.group,
    index: tile.index,
    row: tile.row,
    infrastructure: tile.infrastructure ?? false,
    drawn: tile.drawn ?? false,
  })
}

function initialTiles(scene, local) {
  const tiles = []
  const handCounts = {}
  const sampleIndex = scene.id === 'easy-yaku' ? Math.min(2, Math.floor(local / 4.2)) : 0
  for (const [index, group] of (scene.setup.hands ?? []).entries()) handCounts[group.seat] = group.codes.length
  if (scene.setup.walls) tiles.push(...wallTiles())
  for (const [groupIndex, group] of (scene.setup.hands ?? []).entries()) {
    if (scene.id === 'easy-yaku' && groupIndex !== sampleIndex) continue
    const parsed = group.codes
    let tileIndex = 0
    for (const [runIndex, code] of parsed.entries()) {
      const run = group.groups?.findIndex((codes) => codes.includes(code)) ?? 0
      const tile = { id: `${group.id}-${runIndex}`, code, seat: group.seat, zone: 'hand', index: tileIndex, count: parsed.length, group: `group-${run}`, faceUp: true }
      addTile(tiles, tile, handCounts)
      tileIndex += 1
    }
  }
  for (const [seat, value] of Object.entries(scene.setup.opponents ?? {})) {
    const codes = parseTiles(value)
    handCounts[seat] = codes.length
    codes.forEach((code, index) => addTile(tiles, { id: `hand-${seat}-${index}`, code, seat, zone: 'hand', index, count: codes.length, faceUp: false }, handCounts))
  }
  if (scene.setup.tileRows) {
    const rows = ['123456789m', '123456789p', '123456789s', '1234567z'].map(parseTiles)
    rows.forEach((codes, row) => codes.forEach((code, index) => addTile(tiles, {
      id: `row-${row}-${index}`, code, seat: 'us', zone: 'free', index, pos: [(index - (codes.length - 1) / 2) * 1.08, .06, (row - 2.5) * 1.55 - .1],
      rot: [Math.PI / 2, 0, 0], faceUp: false, row,
    }, handCounts)))
  }
  for (const [seat, codes] of Object.entries(scene.setup.ponds ?? {})) {
    codes.forEach((code, index) => addTile(tiles, { id: tileId(seat, 'pond', index), code, seat, zone: 'pond', index, sideways: scene.id === 'win' && code === '9m', faceUp: true }, handCounts))
  }
  for (const event of scene.events) {
    if (event.type === 'indicator') addTile(tiles, { id: 'dora-indicator', code: event.code, seat: 'us', zone: 'free', pos: event.pos, rot: [-Math.PI / 2, 0, 0], faceUp: true }, handCounts)
    if (event.type === 'exhibit' || event.type === 'doraExamples') {
      const codes = event.codes ?? event.pairs.flat()
      codes.forEach((code, i) => addTile(tiles, { id: `exhibit-${i}`, code, seat: 'us', zone: 'free', pos: event.pos ?? [i * 1.1 - (codes.length - 1) * .55, 2.2, 0], rot: [-Math.PI / 2, 0, 0], faceUp: true, opacity: 0 }, handCounts))
    }
  }
  return { tiles, handCounts }
}

function eventTiles(scene, local, tiles, handCounts) {
  const overlay = { chips: [], arrows: [], crosses: [], panels: [], labels: [], numbers: [], recap: null, bigword: null, lock: false, stick: false }
  const byId = new Map(tiles.map((tile) => [tile.id, tile]))
  const initial = tiles.map((tile) => ({ ...tile, pos: [...tile.pos], rot: [...tile.rot] }))
  const gapEvent = scene.events.find((event) => event.type === 'gap' && local >= event.at)
  if (gapEvent) {
    const activeHand = tiles.filter((tile) => tile.zone === 'hand' && tile.seat === 'us').sort((a, b) => a.index - b.index)
    let gapCount = 0
    let seenGroup = ''
    for (const tile of activeHand) {
      if (tile.group !== seenGroup && seenGroup) gapCount += 1
      seenGroup = tile.group
      const total = activeHand.length * 1.02 + (gapEvent.groups.length - 1) * .35
      tile.pos[0] = tile.index * 1.02 + gapCount * .35 - total / 2 + .5
    }
  }
  for (const event of scene.events) {
    const p = progress(local, event)
    const active = local >= event.at && local <= event.at + event.dur
    if (event.type === 'reset' && local >= event.at) {
      tiles.splice(0, tiles.length, ...initial.map((tile) => ({ ...tile, pos: [...tile.pos], rot: [...tile.rot] })))
      byId.clear(); tiles.forEach((tile) => byId.set(tile.id, tile))
      overlay.reset = event.state ?? true
      continue
    }
    if (['draw', 'discard'].includes(event.type) && local >= event.at) {
      let heldFrom = null
      if (event.type === 'discard') {
        const held = tiles.find((tile) => tile.seat === (event.seat ?? 'us') && tile.zone === 'hand' && tile.code === event.code && tile.visible !== false)
        if (held && scene.id === 'calls' && !event.from) {
          const order = heldInOrder(tiles)
          heldFrom = handPosition(order.indexOf(held), order.length)
        }
        if (held) { held.visible = false; held.hiddenAt = event.at }
      }
      const from = event.from ?? (event.type === 'draw' ? { zone: 'wall', index: 0, layer: 1 } : { zone: 'hand', index: 12, count: 13 })
      const to = event.to ?? { zone: 'pond', seat: event.seat, index: 0 }
      const key = `event-${scene.id}-${event.type}-${event.at}-${event.code}`
      const source = { id: key, code: event.code, seat: event.seat ?? 'us', zone: p < 1 ? from.zone : to.zone, index: p < 1 ? from.index : to.index, layer: from.layer, count: from.count, drawn: to.drawn, sideways: event.sideways, faceUp: true, opacity: 1, dim: 0 }
      const sourcePlace = tilePlacement({ ...source, seat: from.seat ?? event.seat ?? 'us' }, handCounts)
      const targetPlace = tilePlacement({ ...source, ...to, seat: to.seat ?? event.seat ?? 'us', code: event.code, sideways: event.sideways, zone: to.zone }, handCounts)
      source.pos = heldFrom ?? sourcePlace.pos
      source.rot = sourcePlace.rot
      const amount = easeInOutCubic(p)
      source.pos = source.pos.map((v, i) => v + (targetPlace.pos[i] - v) * amount)
      if (event.type === 'draw' || event.type === 'discard') source.pos[1] += Math.sin(Math.PI * p) * 2.4
      source.rot = source.rot.map((v, i) => v + (targetPlace.rot[i] - v) * amount)
      source.glow = event.glow && active ? 'gold' : null
      source.inFlight = p < 1
      source.visible = true
      if (!byId.has(key)) { tiles.push(source); byId.set(key, source) }
      else Object.assign(byId.get(key), source)
    }
    if (event.type === 'call' && local >= event.at) {
      const removeCodes = event.codes?.filter((_, i) => i !== event.calledIndex) ?? [event.code, event.code]
      for (const code of removeCodes) {
        const held = tiles.find((tile) => tile.seat === 'us' && tile.zone === 'hand' && tile.code === code && tile.visible !== false)
        if (held) { held.visible = false; held.hiddenAt = event.at }
      }
      const called = tiles.find((tile) => tile.seat === event.seat && tile.zone === 'pond' && tile.index === (event.from?.index ?? 0) && tile.visible !== false)
      if (called) called.visible = false
      const callCodes = event.codes ?? [event.code, event.code, event.code]
      callCodes.forEach((code, i) => {
        const id = `meld-${scene.id}-${event.at}-${i}`
        const destination = { id, code, seat: 'us', zone: 'meld', index: i, meldIndex: i, meldCount: callCodes.length, meldSlot: event.to?.meldIndex ?? 0, meldCalled: event.calledIndex, sideways: i === event.calledIndex, faceUp: true }
        const target = tilePlacement(destination, handCounts)
        const fromLocal = i === event.calledIndex ? tilePlacement({ ...destination, zone: 'pond', seat: event.seat, index: event.from?.index ?? 0 }, handCounts) : target
        const from = i === event.calledIndex ? seatTransform(event.seat, fromLocal.pos, fromLocal.rot) : fromLocal
        const amount = easeInOutCubic(p)
        const tile = { ...destination, pos: from.pos.map((value, axis) => value + (target.pos[axis] - value) * amount), rot: from.rot.map((value, axis) => value + (target.rot[axis] - value) * amount) }
        if (!byId.has(id)) { addTile(tiles, tile, handCounts); byId.set(id, tiles.at(-1)) }
        else Object.assign(byId.get(id), tile)
      })
    }
    if (!active) continue
    if (event.type === 'chip') {
      const anchors = event.anchors ?? [event.anchor]
      anchors.filter(Boolean).forEach((anchor, index) => overlay.chips.push({ id: `${event.at}-${index}`, text: event.text, anchor, kind: event.kind ?? 'label', opacity: Math.sin(Math.PI * p) ** .35 }))
    }
    if (event.type === 'bigword') overlay.bigword = { text: event.text, detail: event.detail, opacity: Math.sin(Math.PI * p) ** .35 }
    if (event.type === 'arrow') overlay.arrows.push({ from: event.from, to: event.to, opacity: Math.sin(Math.PI * p) ** .35 })
    if (event.type === 'cross') overlay.crosses.push({ anchor: event.anchor, opacity: Math.sin(Math.PI * p) ** .35 })
    if (event.type === 'popup') overlay.panels.push({ type: 'waits', title: event.title, rows: event.rows, opacity: Math.sin(Math.PI * p) ** .35 })
    if (event.type === 'recap') overlay.recap = { items: event.items, cta: event.cta, progress: p }
    if (event.type === 'labels') overlay.labels = event.rows
    if (event.type === 'numbers') overlay.numbers = Array.from({ length: 9 }, (_, i) => String(i + 1))
    if (event.type === 'honors') overlay.honors = event.text
    if (event.type === 'checkmarks') overlay.checkmarks = true
    if (event.type === 'doraExamples') overlay.doraPairs = event.pairs
    if (event.type === 'seats') overlay.seatLabels = ['เรา', 'ขวา', 'ตรงข้าม', 'ซ้าย']
    if (event.type === 'turnOrder') overlay.turnOrder = true
    if (event.type === 'lock') overlay.lock = true
    if (event.type === 'stick') overlay.stick = event.visible
    if (event.type === 'exhibit') for (const tile of tiles) if (tile.id.startsWith('exhibit-')) tile.opacity = 1
    if (event.type === 'ghost') for (const [index, ghost] of event.examples.entries()) {
      const key = `ghost-${ghost.code}`
      if (!byId.has(key)) {
        const tile = { id: key, code: ghost.code, seat: 'us', zone: 'free', pos: ghost.pos, rot: ghost.rot ?? [-Math.PI / 2, 0, 0], faceUp: true, opacity: 1, dim: .3, glow: 'gold', ghost: true }
        tiles.push(tile); byId.set(key, tile)
      }
      const tile = tiles.find((item) => item.id === key)
      tile.opacity = 1
      tile.dim = .3
    }
    if (event.type === 'glow') for (const tile of tiles) if (tile.code === event.code && tile.zone === event.zone && tile.seat === event.seat) tile.glow = event.color
    if (event.type === 'highlight') {
      for (const tile of tiles) if (tile.zone === 'hand' && tile.seat === 'us') {
        const pairIndex = Math.min(6, Math.floor(p * 7))
        const selected = event.groups?.some((group) => group.includes(tile.code)) ?? (event.pairs ? tile.group === `group-${pairIndex}` : false)
        tile.dim = selected ? 0 : event.dim
        tile.glow = selected ? 'gold' : null
      }
    }
    if (event.type === 'reveal') for (const tile of tiles) if (tile.zone === 'hand' && tile.seat === event.seat) { tile.faceUp = true; tile.rot[0] = -Math.PI / 2 }
    if (event.type === 'reset') overlay.reset = event.state ?? true
  }
  if (scene.id === 'calls') {
    // after calls and discards the hand slides closed over 0.35 s, as in the game
    const held = heldInOrder(tiles)
    const last = Math.max(-Infinity, ...tiles.filter((tile) => tile.hiddenAt !== undefined).map((tile) => tile.hiddenAt))
    const before = tiles.filter((tile) => tile.id.startsWith('hand-us') && (tile.visible !== false || tile.hiddenAt === last)).sort((a, b) => a.index - b.index)
    const amount = easeInOutCubic(clamp((local - last) / .35, 0, 1))
    held.forEach((tile, k) => {
      const from = handPosition(before.indexOf(tile), before.length)
      const to = handPosition(k, held.length)
      tile.pos = from.map((value, axis) => value + (to[axis] - value) * amount)
    })
  }
  return overlay
}

function captionAt(scene, local) {
  const caption = scene.captions.find((item) => local >= item.at && local < item.end)
  return caption ? { text: caption.text, opacity: Math.min(1, (local - caption.at) / .25, (caption.end - local) / .25) } : null
}

function blendedCamera(scene, local) {
  const target = cameraFor(scene.camera)
  target.up ??= [0, 1, 0]
  const index = timeline.indexOf(scene)
  if (index <= 0) {
    const drift = Math.min(1, local / scene.duration)
    target.pos = [0, 22 - 2 * drift, 30 - 2 * drift]
    return target
  }
  const previous = cameraFor(timeline[index - 1].camera)
  previous.up ??= [0, 1, 0]
  const amount = easeInOutCubic(clamp(local / .8))
  return {
    pos: target.pos.map((value, axis) => previous.pos[axis] + (value - previous.pos[axis]) * amount),
    look: target.look.map((value, axis) => previous.look[axis] + (value - previous.look[axis]) * amount),
    fov: previous.fov + (target.fov - previous.fov) * amount,
    up: target.up.map((value, axis) => previous.up[axis] + (value - previous.up[axis]) * amount),
  }
}

export function stateAt(time) {
  const current = sceneAt(time)
  const { scene, start } = current
  const local = Math.max(0, time - start)
  const { tiles, handCounts } = initialTiles(scene, local)
  if (scene.setup.tileRows) for (const tile of tiles) if (tile.row !== undefined) {
    const rowStart = .6 + tile.row * (9 * .05 + .35)
    const amount = easeInOutCubic(clamp((local - rowStart - tile.index * .05) / .28))
    tile.visible = local >= rowStart + tile.index * .05
    tile.faceUp = amount >= .5
    tile.rot[0] = Math.PI / 2 - Math.PI * amount
  }
  if (scene.id === 'shape') for (const tile of tiles) if (tile.zone === 'hand') {
    const amount = easeInOutCubic(clamp((local - .8) / .7))
    tile.visible = local >= .8
    tile.opacity = amount
    tile.pos[2] = 11.6
  }
  if (['calls', 'win'].includes(scene.id) && local < 1.2) for (const tile of tiles) if (tile.zone === 'hand') tile.visible = false
  const overlay = eventTiles(scene, local, tiles, handCounts)
  return {
    time,
      scene: scene.id,
    localTime: local,
      camera: blendedCamera(scene, local),
    tiles,
    overlay: {
      caption: captionAt(scene, local),
      title: local < 5 ? scene.overlay ?? null : null,
      boxes: { caption: Boolean(captionAt(scene, local)), title: Boolean(local < 5 && scene.overlay), recap: Boolean(overlay.recap), recapCta: Boolean(overlay.recap?.cta), waitPanel: overlay.panels.length > 0 },
      ...overlay,
    },
  }
}

export { TILE, timelineInfo }
