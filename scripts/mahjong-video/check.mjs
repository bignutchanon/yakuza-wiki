import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { isCompleteHand, nextDora, waitingTiles } from './src/mahjong.js'
import { sceneAt, sceneOffsets, timeline, timelineInfo } from './src/timeline.js'
import { stateAt } from './src/state.js'
import { SEATS, TILE, seatTransform } from './src/layout.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const fail = (message) => { throw new Error(message) }
const marks = /[\s\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/gu
const offsets = sceneOffsets()
if (offsets[0]?.start !== 0 || offsets.at(-1)?.end !== timelineInfo.duration) fail('ฉากต้องเริ่มที่ 0 และจบตรง duration')
if (timelineInfo.duration < 115 || timelineInfo.duration > 150) fail('ความยาวต้องอยู่ระหว่าง 115–150 วินาที')
if (timeline[0].id !== 'intro' || timelineInfo.posterTime >= timeline[0].duration) fail('posterTime ต้องอยู่ใน intro')
for (const [index, { scene, start, end }] of offsets.entries()) {
  if (scene.duration <= 0 || (index && offsets[index - 1].end !== start)) fail(`ช่วงฉากไม่ต่อกัน: ${scene.id}`)
  let previous = 0
  for (const caption of scene.captions) {
    if (caption.at < previous || caption.end <= caption.at || caption.end > scene.duration) fail(`คำบรรยายซ้อนหรืออยู่นอกฉาก: ${scene.id}`)
    const length = [...caption.text.replace(marks, '').replaceAll('**', '')].length
    if (length > 70 || caption.end - caption.at < 1.2 + .075 * length + .3 - .01) fail(`คำบรรยายอ่านไม่ทัน (${length}, ${(caption.end - caption.at).toFixed(2)} วิ): ${scene.id}`)
    previous = caption.end
  }
  for (const sample of scene.complete ?? []) if (!isCompleteHand(sample)) fail(`มือที่ประกาศว่าครบไม่ครบ: ${scene.id}`)
  for (const sample of scene.tenpai ?? []) {
    const actual = waitingTiles(sample.tiles, sample.fixed ?? [])
    if (actual.length !== sample.waits.length || sample.waits.some((wait) => !actual.includes(wait))) fail(`ไพ่รอไม่ตรงใน ${scene.id}: ${sample.waits} เทียบกับ ${actual}`)
  }
  for (const event of scene.events) {
    if (!Number.isFinite(event.at) || !Number.isFinite(event.dur) || event.at < 0 || event.dur < 0) fail(`event ไม่มีเวลา relative ที่ถูกต้อง: ${scene.id}`)
    if (event.at + event.dur > scene.duration + .001) fail(`event ยาวเกินฉาก: ${scene.id} ${event.type}`)
    const explainsCaption = scene.captions.some((caption) => event.at <= caption.end && event.at + event.dur >= caption.at)
    if (scene.id !== 'recap' && !explainsCaption) fail(`event ไม่ทับช่วงคำบรรยาย: ${scene.id} ${event.type}`)
  }
}
for (const [a, b] of Object.entries({ '9m':'1m', '3p':'4p', '4z':'1z', '5z':'6z', '6z':'7z', '7z':'5z' })) if (nextDora(a) !== b) fail(`nextDora ${a} ผิด`)
if (timelineInfo.reviewTimes.some((time, i, rows) => time < 0 || time >= timelineInfo.duration || (i && time < rows[i - 1]))) fail('reviewTimes ต้องเรียงและอยู่ในคลิป')
for (const relative of ['src', 'stage.css']) {
  const dir = path.join(root, relative)
  const files = fs.statSync(dir).isDirectory() ? walk(dir) : [dir]
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    for (const banned of ['Date.now', 'performance.now', 'Math.random', 'transition', 'animation', '@keyframes']) if (content.includes(banned)) fail(`${relative}: พบ ${banned} ใน ${path.relative(root, file)}`)
  }
}

const sampleTimes = new Set(timelineInfo.reviewTimes)
for (let t = 0; t <= timelineInfo.duration; t += .5) sampleTimes.add(Number(t.toFixed(4)))
const results = []
const camera = new THREE.PerspectiveCamera()
const corners = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => new THREE.Vector3(x * TILE.width / 2, y * TILE.height / 2, z * TILE.depth / 2))))

function worldCorners(tile) {
  const rotation = new THREE.Euler(...tile.rot, 'XYZ')
  const seatAngle = SEATS[tile.seat ?? 'us'].angle
  return corners.map((corner) => corner.clone().applyEuler(rotation).add(new THREE.Vector3(...tile.pos)).applyAxisAngle(new THREE.Vector3(0, 1, 0), seatAngle))
}

function bounds(tile, cam) {
  const points = worldCorners(tile).map((point) => point.project(cam))
  return { minX: Math.min(...points.map((p) => (p.x + 1) * 960)), maxX: Math.max(...points.map((p) => (p.x + 1) * 960)), minY: Math.min(...points.map((p) => (1 - p.y) * 540)), maxY: Math.max(...points.map((p) => (1 - p.y) * 540)) }
}

function worldBox(tile) {
  const points = worldCorners(tile)
  const box = new THREE.Box3()
  for (const point of points) box.expandByPoint(point)
  return box
}

for (const time of [...sampleTimes].sort((a, b) => a - b)) {
  const state = stateAt(time)
  const activeCaption = state.overlay.caption
  const { boxes } = state.overlay
  if (boxes.caption !== Boolean(activeCaption) || boxes.title !== Boolean(state.overlay.title) || boxes.recap !== Boolean(state.overlay.recap) || boxes.recapCta !== Boolean(state.overlay.recap?.cta) || boxes.waitPanel !== (state.overlay.panels.length > 0)) fail(`overlay empty/visible state mismatch at ${time.toFixed(1)}s`)
  const wallScenes = ['intro', 'turn', 'yaku', 'calls', 'win', 'dora', 'recap']
  const visibleWalls = state.tiles.filter((tile) => tile.zone === 'wall' && tile.visible !== false && (tile.opacity ?? 1) > .01)
  if (wallScenes.includes(state.scene) && visibleWalls.length < 100) fail(`กำแพงไม่ครบใน state: ${state.scene} ${visibleWalls.length}`)
  for (const ghost of state.tiles.filter((tile) => tile.ghost)) if (!ghost.faceUp || ghost.opacity !== 1 || ghost.dim < .25) fail(`ghost ต้องหงาย ทึบ และหรี่สีที่ ${time.toFixed(1)}s`)
  camera.fov = state.camera.fov; camera.aspect = 16 / 9; camera.near = .1; camera.far = 100
  camera.up.set(...(state.camera.up ?? [0, 1, 0])); camera.position.set(...state.camera.pos); camera.lookAt(...state.camera.look); camera.updateMatrixWorld(); camera.updateProjectionMatrix()
  const focal = state.tiles.filter((tile) => tile.visible !== false && (tile.opacity ?? 1) > .01 && !tile.inFlight && !tile.infrastructure && tile.faceUp && ['hand', 'pond', 'meld', 'free'].includes(tile.zone))
  const bad = []
  const blockers = state.tiles.filter((tile) => tile.visible !== false && tile.opacity > .2).map((tile) => ({ tile, box: worldBox(tile) }))
  for (const tile of focal) {
    const box = bounds(tile, camera)
    if (tile.dim > 0 && tile.opacity < 1 && !tile.ghost) bad.push(`${tile.id}:dim alpha`)
    if (activeCaption && box.maxX >= 180 && box.minX <= 1740 && box.maxY >= 850) bad.push(`${tile.id}:caption overlap`)
    if (box.minX < 96 || box.maxX > 1824 || box.minY < 54 || box.maxY > 1026) bad.push(`${tile.id}:ขอบ`)
    const target = new THREE.Vector3(0, 0, TILE.depth / 2).applyEuler(new THREE.Euler(...tile.rot, 'XYZ')).add(new THREE.Vector3(...tile.pos)).applyAxisAngle(new THREE.Vector3(0, 1, 0), SEATS[tile.seat ?? 'us'].angle)
    const direction = target.clone().sub(camera.position).normalize()
    const ray = new THREE.Ray(camera.position.clone(), direction)
    const targetDistance = camera.position.distanceTo(target)
    for (const candidate of blockers) {
      if (candidate.tile.id === tile.id) continue
      const hit = ray.intersectBox(candidate.box, new THREE.Vector3())
      if (hit && hit.distance < targetDistance - .45) { bad.push(`${tile.id}:บังโดย${candidate.tile.id}`); break }
    }
  }
  if (state.scene === 'dora') {
    const visibleWallInFrame = visibleWalls.filter((tile) => {
      const p = worldCorners(tile).map((point) => point.project(camera))
      return p.some((point) => point.z >= -1 && point.z <= 1 && point.x >= -1 && point.x <= 1 && point.y >= -1 && point.y <= 1)
    })
    if (visibleWallInFrame.length < 8) bad.push(`กำแพง S8 ในเฟรม ${visibleWallInFrame.length}`)
  }
  if (['turn', 'yaku'].includes(state.scene)) for (const tile of state.tiles) {
    if (tile.zone !== 'pond' || !tile.id.startsWith(`event-${state.scene}-discard-`) || tile.inFlight || tile.visible === false) continue
    const box = bounds(tile, camera)
    if (box.minX < 96 || box.maxX > 1824 || box.minY < 54 || box.maxY > 1026) bad.push(`${tile.id}:ทิ้งหลุดเฟรม`)
  }
  const handTiles = state.tiles.filter((tile) => tile.zone === 'hand' && tile.seat === 'us' && tile.visible !== false && !tile.inFlight)
  let handPercent = 0
  if (handTiles.length) {
    const handBounds = handTiles.map((tile) => bounds(tile, camera))
    handPercent = ((Math.max(...handBounds.map((box) => box.maxX)) - Math.min(...handBounds.map((box) => box.minX))) / 1920) * 100
    const heights = handBounds.map((box) => box.maxY - box.minY)
    const minHand = ['turn', 'yaku'].includes(state.scene) ? 60 : 70
    if (['shape', 'easy-yaku', 'turn', 'yaku'].includes(state.scene) && (handPercent < minHand || handPercent > 90 || Math.min(...heights) < 120)) bad.push(`มือ ${handPercent.toFixed(0)}% / ${Math.min(...heights).toFixed(0)}px`)
  }
  for (const chip of state.overlay.chips) {
    const tile = state.tiles.find((item) => item.id === chip.anchor)
    const group = chip.anchor?.startsWith('group-') ? state.tiles.filter((item) => item.group === chip.anchor) : []
    let point = tile ? seatTransform(tile.seat ?? 'us', tile.pos).pos : [0, 2.4, 0]
    if (group.length) point = group.reduce((sum, item) => {
      const world = seatTransform(item.seat ?? 'us', item.pos).pos
      return sum.map((value, i) => value + world[i] / group.length)
    }, [0, 0, 0]).map((value, i) => value + (i === 1 ? 1.2 : 0))
    if (tile && !chip.anchor.startsWith('row-')) point = [point[0], point[1] + 1.4, point[2]]
    if (chip.anchor === 'row-m') point = [0, .06, -4.6]
    else if (chip.anchor?.startsWith('row-')) { point[0] += 1.5; point[2] -= chip.anchor === 'row-2-0' ? 1.2 : .3 }
    if (chip.anchor === 'hand') point = [0, 3.4, 10]
    if (chip.anchor === 'waits') point = [0, 2.6, 1.4]
    if (chip.anchor === 'stick') point = [0, 1.2, 2]
    const p = new THREE.Vector3(...point).project(camera)
    const y = (1 - p.y) * 540
    const x = (p.x + 1) * 960
    const width = Math.min(1500, [...chip.text].length * 22 + 44)
    if (x - width / 2 < 96 || x + width / 2 > 1824 || y - 36 < 54 || y + 36 >= 860) bad.push(`ชิป:${chip.text}`)
    if (activeCaption && x + width / 2 >= 180 && x - width / 2 <= 1740 && y + 36 >= 850) bad.push(`ชิปทับ caption:${chip.text}`)
  }
  const visibleCounts = new Map()
  for (const tile of state.tiles) if (tile.visible !== false && tile.faceUp) visibleCounts.set(tile.code, (visibleCounts.get(tile.code) ?? 0) + 1)
  for (const [code, count] of visibleCounts) if (count > 4) bad.push(`${code}×${count}`)
  results.push({ time, scene: state.scene, hand: handPercent, bad })
}

console.log('เวลา | ฉาก | ความกว้างมือ | ไพ่ตัวเอกหลุดขอบ/ถูกบัง')
for (const row of results) console.log(`${row.time.toFixed(1)} | ${row.scene} | ${row.hand.toFixed(1)}% | ${row.bad.join(', ') || '—'}`)
const errors = results.filter((row) => row.bad.length)
if (errors.length) fail(`ตรวจเฟรมไม่ผ่าน ${errors.length} จุด: ${errors.slice(0, 8).map((row) => `${row.time.toFixed(1)}s ${row.scene} ${row.bad.join('/')}`).join('; ')}`)
console.log('\nฉาก | เริ่ม | จบ | คำบรรยาย')
for (const { scene, start, end } of offsets) console.log(`${scene.id} | ${start.toFixed(1)} | ${end.toFixed(1)} | ${scene.captions.length}`)
console.log(`duration รวม ${timelineInfo.duration.toFixed(2)} วินาที`)

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
}
