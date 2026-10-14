import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { makeTile } from './tiles.js'
import { TABLE } from './layout.js'

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(1920, 1080, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0d0a12')
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture
  const camera = new THREE.PerspectiveCamera(36, 16 / 9, .1, 100)
  const ambient = new THREE.HemisphereLight('#fff1dc', '#11231f', 1.15)
  scene.add(ambient)
  const key = new THREE.DirectionalLight('#fff1dc', 3.1)
  key.position.set(-4, 16, 9)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  scene.add(key)
  const rim = new THREE.PointLight('#e63950', 1.2, 32)
  rim.position.set(-10, 4, -9)
  scene.add(rim)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#0d0a12', roughness: .95 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -.2
  scene.add(floor)
  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(TABLE.halfWidth * 2, .34, TABLE.halfWidth * 2), new THREE.MeshStandardMaterial({ color: '#0f3b31', roughness: .82 }))
  tabletop.position.y = -.05
  tabletop.receiveShadow = true
  scene.add(tabletop)
  const edge = new THREE.Mesh(new THREE.BoxGeometry(30.35, .24, 30.35), new THREE.MeshStandardMaterial({ color: '#171318', roughness: .48 }))
  edge.position.y = -.16
  scene.add(edge)
  const goldMaterial = new THREE.MeshStandardMaterial({ color: '#d4a24e', metalness: .55, roughness: .35 })
  const length = TABLE.goldHalfWidth * 2
  for (const axis of ['x', 'z']) for (const side of [-1, 1]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? length : .035, .025, axis === 'z' ? length : .035), goldMaterial)
    line.position.set(axis === 'x' ? 0 : side * TABLE.goldHalfWidth, .13, axis === 'z' ? 0 : side * TABLE.goldHalfWidth)
    scene.add(line)
  }
  return { renderer, scene, camera, makeTile }
}

export function setCamera(stage, cameraState) {
  stage.camera.fov = cameraState.fov
  stage.camera.up.set(...cameraState.up)
  stage.camera.position.set(...cameraState.pos)
  stage.camera.lookAt(...cameraState.look)
  stage.camera.updateMatrixWorld()
  stage.camera.updateProjectionMatrix()
}
