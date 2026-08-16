'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Credit from './Credit.jsx'

const MotionLink = motion.create(Link)

// การ์ดโผล่ไล่จังหวะทีละใบเมื่อเลื่อนมาถึง + เด้งรับเมาส์
const cardMotion = (i) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.4, delay: (i % 4) * 0.07, ease: 'easeOut' },
  whileHover: { y: -6, transition: { duration: 0.18 } },
})

// บทความ lore หน้าแรก — ข้อมูลคงที่ ไม่ได้มาจาก markdown จึงไม่ต้องส่งผ่าน props จาก server
const LORE_LINKS = [
  { slug: 'timeline', icon: '龍', title: 'ไทม์ไลน์ซีรีส์', desc: 'เหตุการณ์ 35+ ปี เรียงตามปีในเกม พร้อมลำดับที่แนะนำให้เล่น' },
  { slug: 'characters', icon: '侠', title: 'ตัวละครหลัก', desc: 'โปรไฟล์คิริว มาจิมะ อิจิบัง และตัวละครสำคัญข้ามภาค' },
  { slug: 'organizations', icon: '組', title: 'องค์กร & ตระกูล', desc: 'ตระกูลโทโจ พันธมิตรโอมิ และกลุ่มอิทธิพลทั้งซีรีส์' },
  { slug: 'places', icon: '街', title: 'สถานที่ในเกม', desc: 'คามุโรโจ โซเท็นโบริ อิจินโจ และเมืองอื่น ๆ พร้อมต้นแบบจริง' },
  { slug: 'tattoos', icon: '彫', title: 'รอยสัก (อิเรซึมิ)', desc: 'ความหมายลายสักของคิริว มาจิมะ และตัวละครหลัก พร้อมภาพเต็ม' },
]

// การ์ดที่มีอนิเมชัน (framer-motion) ของหน้าแรก — แยกเป็น client component เพราะ motion ต้องใช้ hook ฝั่ง browser
// games = array ของข้อมูลที่ serialize ได้ล้วน ๆ (คำนวณ gameImage ไว้แล้วฝั่ง server)
export default function HomeGrid({ games }) {
  return (
    <>
      <h2 className="section-h">ทุกภาคในซีรีส์ (เรียงตามไทม์ไลน์เนื้อเรื่อง)</h2>
      <div className="game-grid">
        {games.map((g, i) => (
          <MotionLink key={g.id} href={`/game/${g.id}`} className="game-card" {...cardMotion(i)}>
            <img src={g.image} alt={g.title} loading="lazy" />
            <div className="body">
              <h3>{g.title}</h3>
              <div className="meta">
                เหตุการณ์ปี {g.year} · วางจำหน่าย {g.releaseYear}
              </div>
              {g.modReleased && <span className="badge">มีม็อดแปลไทย</span>}
            </div>
          </MotionLink>
        ))}
      </div>
      <Credit href="https://store.steampowered.com/" label="ภาพปกทั้งหมด: © SEGA — จากหน้าร้าน Steam" />

      <h2 className="section-h">ทำความรู้จักจักรวาล Yakuza</h2>
      <div className="lore-grid">
        {LORE_LINKS.map((l, i) => (
          <MotionLink key={l.slug} href={`/lore/${l.slug}`} className="lore-card" {...cardMotion(i)}>
            <span className="lore-icon">{l.icon}</span>
            <div>
              <h3>{l.title}</h3>
              <p>{l.desc}</p>
            </div>
          </MotionLink>
        ))}
      </div>
    </>
  )
}
