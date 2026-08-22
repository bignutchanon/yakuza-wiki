
// ภาพซุ้มประตูคามุโรโจจริงจากเกม (Like a Dragon: Kiwami 3) แทนอนุภาค three.js เดิม
// ค่าเดียวจุดนี้ — สลับไปใช้ public/hero/kamurocho-gate-y5.jpg (Yakuza 5, ซุ้มอยู่กลางภาพ) ได้ที่นี่จุดเดียว
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

export default function HeroScene() {
  // ภาพนิ่ง — ไม่มีพารัลแลกซ์ตามเมาส์/ซูม (user สั่ง freeze) เหลือแค่ไฟนีออนกะพริบ + ฝนผ่าน CSS
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
        <div className="hero-shade" />
      </div>
    </div>
  )
}
