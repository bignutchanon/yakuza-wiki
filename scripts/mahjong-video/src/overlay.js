import * as THREE from 'three'
import { seatTransform, TILE } from './layout.js'

const escape = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const format = (text) => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
const project = (point, camera) => {
  const v = new THREE.Vector3(...point).project(camera)
  return [(v.x + 1) * 960, (1 - v.y) * 540]
}
const faceFiles = { m: 'Man', p: 'Pin', s: 'Sou' }
const imagePath = (code) => {
  const [, value, suit] = /^([1-9])([mps]|z)$/.exec(code)
  const honor = { '1z': 'Ton', '2z': 'Nan', '3z': 'Shaa', '4z': 'Pei', '5z': 'Haku', '6z': 'Hatsu', '7z': 'Chun' }
  return `./assets/tiles/${suit === 'z' ? honor[code] : `${faceFiles[suit]}${value}`}.svg`
}
const seatPoint = { us: [0, 2, 12], right: [12, 2, 0], opposite: [0, 2, -12], left: [-12, 2, 0] }

export function createOverlay(stage) {
  const caption = document.querySelector('#caption')
  const title = document.querySelector('#title')
  const chips = document.querySelector('#chips')
  const recap = document.querySelector('#recap')
  const recapCta = document.querySelector('#recap-cta')
  const extras = document.createElement('div')
  extras.id = 'overlay-extras'
  document.querySelector('#overlay').append(extras)
  let lockBorder
  return (state) => {
    const view = state.overlay
    caption.style.display = view.boxes.caption ? '' : 'none'
    title.style.display = view.boxes.title ? '' : 'none'
    recap.style.display = view.boxes.recap ? '' : 'none'
    recapCta.style.display = view.boxes.recapCta ? '' : 'none'
    caption.innerHTML = view.caption ? format(view.caption.text) : ''
    caption.style.opacity = String(view.caption?.opacity ?? 0)
    title.innerHTML = view.title ? `${escape(view.title.title)}<small>${escape(view.title.subtitle)}</small>` : ''
    title.style.opacity = view.title ? String(Math.min(1, (state.localTime - .4) / .6, (5 - state.localTime) / .6)) : '0'
    chips.replaceChildren()
    const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    leaders.setAttribute('class', 'chip-leaders')
    leaders.setAttribute('viewBox', '0 0 1920 1080')
    const leaderDefs = document.createElementNS(leaders.namespaceURI, 'defs')
    leaderDefs.innerHTML = '<marker id="chip-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#d4a24e"/></marker>'
    leaders.append(leaderDefs)
    for (const chip of view.chips) {
      const anchorTile = state.tiles.find((tile) => tile.id === chip.anchor)
      const groupTiles = chip.anchor?.startsWith('group-') ? state.tiles.filter((tile) => tile.group === chip.anchor) : []
      let point = anchorTile ? seatTransform(anchorTile.seat ?? 'us', anchorTile.pos).pos : [0, 2.4, 0]
      if (groupTiles.length) {
        point = groupTiles.reduce((sum, tile) => {
          const world = seatTransform(tile.seat ?? 'us', tile.pos).pos
          return sum.map((value, i) => value + world[i] / groupTiles.length)
        }, [0, .7, 0])
        point[1] += 1.2
      }
      if (anchorTile && !chip.anchor.startsWith('row-')) point = [point[0], point[1] + 1.4, point[2]]
      if (chip.anchor?.startsWith('row-')) { point[0] += 1.5; point[2] -= .3 }
      if (chip.anchor === 'hand') point = [0, 3.4, 10]
      if (chip.anchor === 'waits') point = [0, 2.6, 1.4]
      if (chip.anchor === 'stick') point = [0, 1.2, 2]
      if (chip.anchor === 'row-m') point = [0, .06, -4.6]
      if (chip.anchor === 'row-2-0') point[2] -= .9
      const [x, y] = project(point, stage.camera)
      const node = document.createElement('div')
      node.className = `chip ${chip.kind}`
      node.textContent = chip.text
      node.style.left = `${x}px`
      node.style.top = `${Math.max(60, Math.min(820, y))}px`
      node.style.opacity = String(chip.opacity)
      chips.append(node)
      if (anchorTile || groupTiles.length) {
        const target = anchorTile ? seatTransform(anchorTile.seat ?? 'us', anchorTile.pos).pos : groupTiles.reduce((sum, tile) => {
          const world = seatTransform(tile.seat ?? 'us', tile.pos).pos
          return sum.map((value, i) => value + world[i] / groupTiles.length)
        }, [0, 0, 0])
        const [tx, ty] = project(target, stage.camera)
        const line = document.createElementNS(leaders.namespaceURI, 'line')
        for (const [name, value] of Object.entries({ x1: x, y1: y + 25, x2: tx, y2: ty, opacity: chip.opacity, 'marker-end': 'url(#chip-arrow)' })) line.setAttribute(name, String(value))
        leaders.append(line)
      }
    }
    if (leaders.children.length > 1) chips.prepend(leaders)

    extras.replaceChildren()
    if (view.doraPairs?.length) {
      const panel = document.createElement('div')
      panel.className = 'dora-panel'
      panel.innerHTML = view.doraPairs.map(([from, to]) => `<div><img src="${imagePath(from)}" alt=""><b>→</b><img src="${imagePath(to)}" alt=""></div>`).join('')
      extras.append(panel)
    }
    if (view.bigword) {
      const word = document.createElement('div')
      word.className = 'bigword'
      word.innerHTML = `<strong>${escape(view.bigword.text)}</strong>${view.bigword.detail ? `<small>${escape(view.bigword.detail)}</small>` : ''}`
      word.style.opacity = String(view.bigword.opacity)
      extras.append(word)
    }
    for (const panel of view.panels) {
      const node = document.createElement('div')
      node.className = 'wait-panel'
      node.style.opacity = String(panel.opacity)
      node.innerHTML = `<b>${escape(panel.title)}</b>${panel.rows.map((row) => `<span><img src="${imagePath(row.code)}" alt="">${escape(row.code)} — ${escape(row.text)}</span>`).join('')}`
      extras.append(node)
    }
    if (view.labels?.length) {
      const node = document.createElement('div')
      node.className = 'row-labels'
      node.innerHTML = view.labels.map((label) => `<span>${escape(label)}</span>`).join('')
      extras.append(node)
    }
    if (view.numbers?.length) {
      const node = document.createElement('div')
      node.className = 'tile-numbers'
      node.innerHTML = view.numbers.map((n) => `<span>${n}</span>`).join('')
      extras.append(node)
    }
    if (view.honors) {
      const node = document.createElement('div')
      node.className = 'honor-label'
      node.textContent = view.honors
      extras.append(node)
    }
    if (view.seatLabels) {
      const seatNames = ['us', 'right', 'opposite', 'left']
      view.seatLabels.forEach((name, index) => {
        // our label sits left of the hand so it does not cover the tile faces
        const [x, y] = project(seatNames[index] === 'us' ? [-8.4, 1.2, 11.6] : seatPoint[seatNames[index]], stage.camera)
        const node = document.createElement('div')
        node.className = 'seat-chip'
        node.textContent = name
        node.style.left = `${x}px`
        node.style.top = `${Math.max(55, Math.min(820, y))}px`
        extras.append(node)
      })
    }
    if (view.checkmarks) for (const tile of state.tiles) if (tile.zone === 'hand' && tile.seat === 'us' && tile.visible !== false) {
      const [x, y] = project([tile.pos[0], tile.pos[1] + 1.05, tile.pos[2]], stage.camera)
      const node = document.createElement('span')
      node.className = 'checkmark'
      node.textContent = '✓'
      node.style.left = `${x}px`
      node.style.top = `${y}px`
      extras.append(node)
    }
    if (view.lock) {
      lockBorder = document.createElement('div')
      lockBorder.className = 'lock-border'
      const held = state.tiles.filter((tile) => tile.zone === 'hand' && tile.seat === 'us' && tile.visible !== false)
      const corners = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => new THREE.Vector3(x * TILE.width / 2, y * TILE.height / 2, z * TILE.depth / 2))))
      const points = held.flatMap((tile) => {
        const rotation = new THREE.Euler(...tile.rot, 'XYZ')
        return corners.map((corner) => {
          const world = corner.clone().applyEuler(rotation).add(new THREE.Vector3(...tile.pos))
          return project(seatTransform(tile.seat ?? 'us', world.toArray()).pos, stage.camera)
        })
      })
      if (points.length) {
        const xs = points.map(([x]) => x); const ys = points.map(([, y]) => y)
        lockBorder.style.left = `${Math.max(90, Math.min(...xs) - 16)}px`
        lockBorder.style.top = `${Math.max(60, Math.min(...ys) - 16)}px`
        lockBorder.style.width = `${Math.min(1740, Math.max(...xs) + 16) - Math.max(90, Math.min(...xs) - 16)}px`
        lockBorder.style.height = `${Math.max(...ys) + 16 - Math.max(60, Math.min(...ys) - 16)}px`
      }
      extras.append(lockBorder)
    }
    if (view.arrows.length || view.crosses.length || view.turnOrder || view.doraPairs) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'overlay-drawings')
      svg.setAttribute('viewBox', '0 0 1920 1080')
      const defs = document.createElementNS(svg.namespaceURI, 'defs')
      defs.innerHTML = '<marker id="gold-arrow" markerUnits="userSpaceOnUse" markerWidth="34" markerHeight="34" refX="30" refY="17" orient="auto"><path d="M0,0 L34,17 L0,34 z" fill="#d4a24e"/></marker>'
      svg.append(defs)
      for (const arrow of view.arrows) {
        const sources = Array.isArray(arrow.from) ? arrow.from : [arrow.from]
        const targetName = Array.isArray(arrow.to) ? arrow.to[0] : arrow.to
        const tileTarget = state.tiles.find((tile) => tile.id === targetName)
        const target = tileTarget ? seatTransform(tileTarget.seat ?? 'us', tileTarget.pos).pos : targetName === 'us' ? seatPoint.us : [0, 1.1, 8]
        const [x2, y2] = project(target, stage.camera)
        for (const sourceName of sources) {
          const sourceTile = state.tiles.find((tile) => tile.id === sourceName)
          const source = sourceTile ? seatTransform(sourceTile.seat ?? 'us', sourceTile.pos).pos : seatPoint[sourceName] ?? [0, 2, 0]
          const [x1, y1] = project(source, stage.camera)
          const line = document.createElementNS(svg.namespaceURI, 'line')
          for (const [name, value] of Object.entries({ x1, y1, x2, y2, opacity: arrow.opacity, 'marker-end': 'url(#gold-arrow)' })) line.setAttribute(name, String(value))
          svg.append(line)
        }
      }
      if (view.turnOrder) {
        const order = ['us', 'right', 'opposite', 'left', 'us']
        for (let i = 0; i < 4; i++) {
          const [x1, y1] = project(seatPoint[order[i]], stage.camera)
          const [x2, y2] = project(seatPoint[order[i + 1]], stage.camera)
          const line = document.createElementNS(svg.namespaceURI, 'line')
          for (const [name, value] of Object.entries({ x1, y1, x2, y2, opacity: .35, 'marker-end': 'url(#gold-arrow)' })) line.setAttribute(name, String(value))
          svg.append(line)
        }
      }
      for (const cross of view.crosses) {
        const p = cross.anchor === 'stick' ? [0, 1.2, 2] : [0, 3.2, 10]
        const [x, y] = project(p, stage.camera)
        const mark = document.createElementNS(svg.namespaceURI, 'path')
        mark.setAttribute('d', `M${x - 70},${y - 70} L${x + 70},${y + 70} M${x + 70},${y - 70} L${x - 70},${y + 70}`)
        mark.setAttribute('opacity', String(cross.opacity))
        svg.append(mark)
      }
      extras.append(svg)
    }
    if (view.recap) {
      recap.innerHTML = view.recap.items.map((text, i) => `<div class="recap-row" style="opacity:${Math.min(1, Math.max(0, (view.recap.progress * 100 - 5 - i * 11) / 8))}"><b>✓</b>${escape(text)}</div>`).join('')
      recapCta.textContent = view.recap.cta
    } else { recap.replaceChildren(); recapCta.textContent = '' }
  }
}
