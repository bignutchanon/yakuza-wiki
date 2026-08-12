import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ฉากคืนฝนตกสไตล์คามุโรโจ: เม็ดฝนโปรยลง + แสงนีออนโบเก้ลอยช้า ๆ + กล้องเอียงตามเมาส์
// ตั้งใจให้เบา: geometry แบบ Points ล้วน ไม่มีโมเดล ไม่มี postprocessing

const NEON_COLORS = ['#e63950', '#d4a24e', '#7b4dff', '#ff7ab0', '#3fd2ff']

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.4)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

function Rain({ count = 900 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = Math.random() * 20 - 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return arr
  }, [count])

  useFrame((_, dt) => {
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - dt * (9 + (i % 5))
      if (y < -10) y = 10
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8fa8c8"
        size={0.045}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  )
}

function Bokeh({ count = 60 }) {
  const ref = useRef()
  const texture = useMemo(glowTexture, [])
  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = -2 - Math.random() * 8
      c.set(NEON_COLORS[i % NEON_COLORS.length])
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      seeds[i] = Math.random() * Math.PI * 2
    }
    return { positions, colors, seeds }
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      pos.setY(i, pos.getY(i) + Math.sin(t * 0.4 + seeds[i]) * 0.0025)
      pos.setX(i, pos.getX(i) + Math.cos(t * 0.3 + seeds[i]) * 0.0018)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        vertexColors
        size={1.6}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function ParallaxCamera() {
  const { camera, pointer } = useThree()
  useFrame(() => {
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.04
    camera.position.y += (pointer.y * 0.6 - camera.position.y) * 0.04
    camera.lookAt(0, 0, -4)
  })
  return null
}

export default function NeonScene() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: false, alpha: true }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      <fog attach="fog" args={['#0d0a12', 6, 18]} />
      <Bokeh />
      {!reduced && <Rain />}
      {!reduced && <ParallaxCamera />}
    </Canvas>
  )
}
