import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GAMES, gameImage } from '../data/games.js'
import { newsPosts, thaiDate } from '../content/loader.js'
import Credit from '../components/Credit.jsx'

const MotionLink = motion.create(Link)

// การ์ดโผล่ไล่จังหวะทีละใบเมื่อเลื่อนมาถึง + เด้งรับเมาส์
const cardMotion = (i) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.4, delay: (i % 4) * 0.07, ease: 'easeOut' },
  whileHover: { y: -6, transition: { duration: 0.18 } },
})

// three.js หนัก ~1MB — โหลดแบบ lazy เฉพาะหน้านี้ ไม่ถ่วงหน้าเนื้อหา
const NeonScene = lazy(() => import('../components/NeonScene.jsx'))

export default function Home() {
  return (
    <>
      <div className="hero3d">
        <Suspense fallback={null}>
          <NeonScene />
        </Suspense>
        <div className="hero-copy">
          <h1>
            龍が如く <span className="accent">Yakuza Wiki</span>
          </h1>
          <p>
            สรุปเนื้อเรื่องทุกบท เควสเสริม และม็อดแปลไทย ครบทั้งซีรีส์
            ตั้งแต่ Yakuza 0 ถึง Infinite Wealth — โดยแฟนเกม เพื่อแฟนเกม
          </p>
        </div>
      </div>

      <div className="page page-wide">
        {/* แถบข่าวล่าสุด — โพสต์แรกสุดจากกระดานข่าว */}
        {newsPosts[0] && (
          <Link to="/news" className="news-strip">
            <span className="news-strip-tag">ข่าวล่าสุด</span>
            <span className="news-strip-title">{newsPosts[0].title}</span>
            <span className="news-strip-date">{thaiDate(newsPosts[0].date)} →</span>
          </Link>
        )}

        <h2 className="section-h">ทุกภาคในซีรีส์ (เรียงตามไทม์ไลน์เนื้อเรื่อง)</h2>
        <div className="game-grid">
          {GAMES.map((g, i) => (
            <MotionLink key={g.id} to={`/game/${g.id}`} className="game-card" {...cardMotion(i)}>
              <img src={gameImage(g)} alt={g.title} loading="lazy" />
              <div className="body">
                <h3>{g.title}</h3>
                <div className="meta">
                  เหตุการณ์ปี {g.year} · วางจำหน่าย {g.releaseYear}
                </div>
                {g.mod.status === 'released' && (
                  <span className="badge">มีม็อดแปลไทย</span>
                )}
              </div>
            </MotionLink>
          ))}
        </div>
        <Credit href="https://store.steampowered.com/" label="ภาพปกทั้งหมด: © SEGA — จากหน้าร้าน Steam" />

        <h2 className="section-h">ทำความรู้จักจักรวาล Yakuza</h2>
        <div className="lore-grid">
          {[
            { slug: 'timeline', icon: '龍', title: 'ไทม์ไลน์ซีรีส์', desc: 'เหตุการณ์ 35+ ปี เรียงตามปีในเกม พร้อมลำดับที่แนะนำให้เล่น' },
            { slug: 'characters', icon: '侠', title: 'ตัวละครหลัก', desc: 'โปรไฟล์คิริว มาจิมะ อิจิบัง และตัวละครสำคัญข้ามภาค' },
            { slug: 'organizations', icon: '組', title: 'องค์กร & ตระกูล', desc: 'ตระกูลโทโจ พันธมิตรโอมิ และกลุ่มอิทธิพลทั้งซีรีส์' },
            { slug: 'places', icon: '街', title: 'สถานที่ในเกม', desc: 'คามุโรโจ โซเท็นโบริ อิจินโจ และเมืองอื่น ๆ พร้อมต้นแบบจริง' },
            { slug: 'tattoos', icon: '彫', title: 'รอยสัก (อิเรซึมิ)', desc: 'ความหมายลายสักของคิริว มาจิมะ และตัวละครหลัก พร้อมภาพเต็ม' },
          ].map((l, i) => (
            <MotionLink key={l.slug} to={`/lore/${l.slug}`} className="lore-card" {...cardMotion(i)}>
              <span className="lore-icon">{l.icon}</span>
              <div>
                <h3>{l.title}</h3>
                <p>{l.desc}</p>
              </div>
            </MotionLink>
          ))}
        </div>
      </div>
    </>
  )
}
