import * as THREE from 'three'
import { SEATS } from './layout.js'

export function createActors(stage, materials) {
  const seats = new Map()
  const actors = new Map()
  for (const [seat, data] of Object.entries(SEATS)) {
    const group = new THREE.Group()
    group.rotation.y = data.angle
    stage.scene.add(group)
    seats.set(seat, group)
  }
  const goldMaterial = new THREE.MeshBasicMaterial({ color: '#d4a24e', transparent: true, opacity: .65 })
  const stickGroup = new THREE.Group()
  const stick = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, .16), new THREE.MeshStandardMaterial({ color: '#f3ecdc', roughness: .45 }))
  stick.position.y = .22
  const redDot = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: '#e63950' }))
  redDot.position.set(0, .27, 0)
  stickGroup.add(stick, redDot)
  stickGroup.position.set(0, -.1, 2)
  stage.scene.add(stickGroup)
  function makeActor(tileState) {
    const root = stage.makeTile(tileState.code, materials, { faceUp: true })
    root.traverse((node) => {
      if (!node.isMesh) return
      node.material = Array.isArray(node.material) ? node.material.map((mat) => mat.clone()) : node.material.clone()
      const mats = Array.isArray(node.material) ? node.material : [node.material]
      for (const mat of mats) { mat.transparent = false; mat.depthWrite = true; mat.userData.baseColor = mat.color?.clone() }
    })
    const underline = new THREE.Mesh(new THREE.BoxGeometry(1.04, .025, .24), goldMaterial)
    underline.position.set(0, .018, 0)
    underline.visible = false
    root.add(underline)
    root.userData.underline = underline
    if (tileState.ghost) {
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.39, .81)), new THREE.LineBasicMaterial({ color: '#d4a24e' }))
      root.add(outline)
      root.userData.ghostOutline = outline
    }
    return root
  }

  return (state) => {
    stickGroup.visible = state.overlay.stick
    for (const actor of actors.values()) actor.visible = false
    for (const tile of state.tiles) {
      const seat = tile.seat ?? 'us'
      const actorKey = `${tile.id}:${tile.code}`
      if (!actors.has(actorKey)) {
        const actor = makeActor(tile)
        seats.get(seat).add(actor)
        actors.set(actorKey, actor)
      }
      const actor = actors.get(actorKey)
      if (actor.parent !== seats.get(seat)) { actor.parent?.remove(actor); seats.get(seat).add(actor) }
      const tileOpacity = tile.opacity ?? 1
      actor.visible = tile.visible !== false && tileOpacity > .01
      actor.position.set(...tile.pos)
      actor.rotation.set(...tile.rot)
      actor.userData.code = tile.code
      actor.children.forEach((child) => {
        if (child.isMesh && child.geometry?.type === 'PlaneGeometry') child.visible = tile.faceUp
      })
      actor.traverse((node) => {
        if (!node.isMesh || node === actor.userData.underline) return
        const mats = Array.isArray(node.material) ? node.material : [node.material]
        for (const material of mats) {
          if (material.color && material.userData.baseColor) material.color.copy(material.userData.baseColor).multiplyScalar(1 - tile.dim)
          material.transparent = false
          material.opacity = 1
          if (tile.glow === 'red') material.emissive?.set('#a51d2c')
          else if (tile.glow === 'gold') material.emissive?.set('#6b4310')
          else if (tile.ghost) material.emissive?.set('#2b2010')
          else material.emissive?.set('#000000')
        }
      })
      actor.userData.underline.visible = tile.glow === 'gold'
      if (actor.userData.ghostOutline) actor.userData.ghostOutline.visible = tile.ghost === true
    }
  }
}
