import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { GAMES, gameImage } from '../data/games.js'
import Credit from '../components/Credit.jsx'

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
        <h2 className="section-h">ทุกภาคในซีรีส์ (เรียงตามไทม์ไลน์เนื้อเรื่อง)</h2>
        <div className="game-grid">
          {GAMES.map((g) => (
            <Link key={g.id} to={`/game/${g.id}`} className="game-card">
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
            </Link>
          ))}
        </div>
        <Credit href="https://store.steampowered.com/" label="ภาพปกทั้งหมด: © SEGA — จากหน้าร้าน Steam" />
      </div>
    </>
  )
}
