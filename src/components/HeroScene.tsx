
// ภาพโปสเตอร์เป็น LCP และ fallback ของหน้าแรก ส่วน depth-photo tour ใช้ three.js แบบ lazy วางทับด้านบน
// เมื่อ WebGL พร้อม กล้องจะเคลื่อนผ่านภาพเกมทั้งสี่ฉาก; หากไม่พร้อมยังเห็นโปสเตอร์เดิม
import HeroFX from '@/components/HeroFX'
import type { HeroSceneData } from '@/lib/heroFx'

const HERO_IMAGE = '/hero/kamurocho-gate.jpg'

type NeonAnim = 'breathe' | 'flicker-a' | 'flicker-b' | 'buzz' | 'strobe'

interface NeonGlow {
  left: number
  top: number
  w: number
  h: number
  color: string
  anim: NeonAnim
  dur: number
  delay: number
  minor?: boolean // จุดเล็ก/ไกล — ซ่อนได้บนมือถือเพื่อลดจำนวนเลเยอร์
}

// ตำแหน่ง/สี อ้างจากกริด 5% ทาบภาพจริง (kamurocho-gate.jpg): ป้ายซุ้ม 神室町天下一通り,
// หลอดไฟโค้งซุ้มฝั่งซ้าย/ขวา, ป้ายเล็กใต้ซุ้มฝั่งซ้าย (KAMURO/食遊楽), ป้ายตึกขวา (ฟ้า/ชมพู/ม่วง), โลโก้ไกลสุดขวา
// ค่าคงที่ล้วน — ห้ามใช้ Math.random() ตรงนี้ (render ฝั่ง server กับ client ต้องได้ค่าเดียวกัน ไม่งั้น hydration mismatch)
const GLOWS: NeonGlow[] = [
  { left: 14, top: 25, w: 29, h: 14, color: '#ff3b5c', anim: 'breathe', dur: 7, delay: 0 }, // ป้ายซุ้มหลัก (แดง หายใจช้า)
  { left: 1, top: 2, w: 11, h: 42, color: '#ffd27a', anim: 'flicker-a', dur: 4.5, delay: 0.3 }, // หลอดไฟโค้งซุ้มฝั่งซ้าย (ทอง/ขาวอุ่น)
  { left: 41, top: 28, w: 11, h: 49, color: '#ffcf6b', anim: 'flicker-b', dur: 5.5, delay: 1.1 }, // หลอดไฟโค้งซุ้มฝั่งขวา-ล่าง
  { left: 0, top: 46, w: 10, h: 24, color: '#ff5f7a', anim: 'buzz', dur: 2.6, delay: 0.6 }, // ป้ายเล็กใต้ซุ้มฝั่งซ้าย — หลอดจะเสีย กะพริบถี่ไม่เป็นจังหวะ
  { left: 80, top: 2, w: 17, h: 24, color: '#4fd8ff', anim: 'flicker-a', dur: 6, delay: 2 }, // ป้ายฟ้าตึกขวา (Aps pleed)
  { left: 56, top: 27, w: 13, h: 16, color: '#ff4fd8', anim: 'flicker-b', dur: 4, delay: 0.8 }, // ป้ายชมพูตึกขวา (極楽大将)
  { left: 52, top: 42, w: 26, h: 20, color: '#b45bff', anim: 'strobe', dur: 5, delay: 1.6, minor: true }, // ป้ายม่วงตึกขวา (漫画次郎/まんが太郎)
  { left: 87, top: 14, w: 13, h: 24, color: '#ffb84f', anim: 'flicker-a', dur: 8, delay: 3, minor: true }, // โลโก้วงกลม+ป้ายไกลสุดขวา
]

const TOUR_SCENES: HeroSceneData[] = [
  { id: 'k3-gate', image: '/hero/kamurocho-gate.jpg', maps: '/hero/tour/k3-gate-maps.png', fill: '/hero/tour/k3-gate-fill.webp', width: 1920, height: 1080, credit: 'Like a Dragon: Kiwami 3', nearZ: 3.5, farZ: 140, duration: 9, endMove: [0.3, 0, -1.8], endTurn: [-2, 1] },
  { id: 'y5-gate', image: '/hero/kamurocho-gate-y5.jpg', maps: '/hero/tour/y5-gate-maps.png', fill: '/hero/tour/y5-gate-fill.webp', width: 1680, height: 1050, credit: 'Yakuza 5', nearZ: 4, farZ: 160, duration: 8, endMove: [0, 0, -2.2], endTurn: [0, 1], focus: [0.5, 0.45] },
  { id: 'y3r-arch', image: '/hero/tour/y3r-arch.webp', maps: '/hero/tour/y3r-arch-maps.png', fill: '/hero/tour/y3r-arch-fill.webp', width: 1920, height: 1080, credit: 'Yakuza 3 Remastered', nearZ: 3, farZ: 120, duration: 7, endMove: [0.05, 0, -1.6], endTurn: [0, 1], focus: [0.5, 0.33] },
  { id: 'y5-street', image: '/hero/tour/y5-street.webp', maps: '/hero/tour/y5-street-maps.png', fill: '/hero/tour/y5-street-fill.webp', width: 1920, height: 1080, credit: 'Yakuza 5', nearZ: 2.5, farZ: 200, duration: 10, endMove: [-0.15, -0.08, -1.8], endTurn: [0, 0] },
]

export default function HeroScene() {
  // ใช้ภาพเกมเป็นฉากตั้งต้น แล้วค่อยเปิดเลเยอร์ depth-photo หลังโหลด
  return (
    <div className="hero-scene" aria-hidden="true">
      {/* hero-frame = กรอบอัตราส่วน 16:9 กึ่งกลาง ขยายให้ cover .hero3d เสมอไม่ว่าจอไหน
          ตำแหน่ง % ของ neon-glow ด้านในจึงตรงกับจุดในภาพเป๊ะ ๆ ตลอด ไม่ขึ้นกับความกว้างจอ */}
      <div className="hero-frame">
        <img
          className="hero-img"
          src={HERO_IMAGE}
          alt=""
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        {GLOWS.map((g, i) => (
          <span
            key={i}
            className={`neon-glow neon-${g.anim}${g.minor ? ' minor' : ''}`}
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              width: `${g.w}%`,
              height: `${g.h}%`,
              background: `radial-gradient(closest-side, ${g.color}, transparent 70%)`,
              animationDuration: `${g.dur}s`,
              animationDelay: `${g.delay}s`,
            }}
          />
        ))}

        <div className="hero-rain" />
      </div>
      <HeroFX scenes={TOUR_SCENES} />
      <div className="hero-shade" />
    </div>
  )
}
