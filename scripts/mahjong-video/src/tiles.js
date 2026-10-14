import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { TILE_CODES, tileName } from './mahjong.js'

const FACE_ASSETS = Object.fromEntries([
  ...Array.from({ length: 9 }, (_, i) => [`${i + 1}m`, `Man${i + 1}`]),
  ...Array.from({ length: 9 }, (_, i) => [`${i + 1}p`, `Pin${i + 1}`]),
  ...Array.from({ length: 9 }, (_, i) => [`${i + 1}s`, `Sou${i + 1}`]),
  ...['Ton','Nan','Shaa','Pei','Haku','Hatsu','Chun'].map((name, i) => [`${i + 1}z`, name]),
])
const images = new Map()
const textures = new Map()
const allMaterials = []
let frontGeometry
let backGeometry
let faceGeometry
let backMaterial
let frontMaterial
let faceMaterials

async function loadImage(url) {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

export async function loadTileTextures(renderer) {
  const [front, ...faces] = await Promise.all([
    loadImage('./assets/tiles/Front.svg'),
    ...TILE_CODES.map((code) => loadImage(`./assets/tiles/${FACE_ASSETS[code]}.svg`)),
  ])
  for (const [i, code] of TILE_CODES.entries()) {
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 400
    const ctx = canvas.getContext('2d'); ctx.drawImage(front, 0, 0, 300, 400); ctx.drawImage(faces[i], 0, 0, 300, 400)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); texture.needsUpdate = true
    textures.set(code, texture); images.set(code, canvas)
  }
  frontGeometry = new RoundedBoxGeometry(1, 1.35, .77 * 2 / 3, 4, .07)
  backGeometry = new RoundedBoxGeometry(1, 1.35, .77 / 3, 4, .07)
  faceGeometry = new THREE.PlaneGeometry(.86, 1.16)
  backMaterial = new THREE.MeshStandardMaterial({ color: '#a31226', roughness: .3, metalness: .02 })
  frontMaterial = new THREE.MeshStandardMaterial({ color: '#f3ecdc', roughness: .27, metalness: .03 })
  faceMaterials = new Map(TILE_CODES.map((code) => { const mat = new THREE.MeshStandardMaterial({ map: textures.get(code), roughness: .32 }); allMaterials.push(mat); return [code, mat] }))
  return { frontGeometry, faceGeometry, backMaterial, frontMaterial, faceMaterials }
}

export function makeTile(code, materials, { faceUp = true } = {}) {
  const root = new THREE.Group(); root.userData.code = code
  const back = new THREE.Mesh(backGeometry, materials.backMaterial)
  back.position.z = -.77 / 3
  const front = new THREE.Mesh(materials.frontGeometry, materials.frontMaterial)
  back.castShadow = true; back.receiveShadow = true; front.castShadow = true; front.receiveShadow = true
  root.add(back, front)
  if (faceUp) {
    const face = new THREE.Mesh(materials.faceGeometry, materials.faceMaterials.get(code))
    face.castShadow = true
    face.position.set(0, 0, .77 / 3 + .002); root.add(face)
  }
  root.userData.label = tileName(code)
  return root
}

export function exportFaces() {
  return TILE_CODES.map((code) => {
    const source = images.get(code); const canvas = document.createElement('canvas'); canvas.width = 72; canvas.height = 96
    canvas.getContext('2d').drawImage(source, 0, 0, 72, 96)
    return { code, dataUrl: canvas.toDataURL('image/webp', .9) }
  })
}
