import Link from 'next/link'
import { GAMES, gameImage } from '../src/data/games.js'
import { newsPosts, thaiDate } from '../lib/content.js'
import { pageMeta, DEFAULT_DESCRIPTION } from '../lib/site.js'
import NeonSceneLazy from '../src/components/NeonSceneLazy.jsx'
import HomeGrid from '../src/components/HomeGrid.jsx'

export const metadata = pageMeta({ title: '', description: DEFAULT_DESCRIPTION, path: '/' })

// หน้าแรก — server component: render markdown/ข้อมูลฝั่ง server ทั้งหมด ส่วนการ์ด motion แยกไปที่ HomeGrid (client)
export default function Home() {
  // เตรียมข้อมูลภาคให้เป็น props ที่ serialize ได้ล้วน ๆ ก่อนส่งเข้า client component
  const games = GAMES.map((g) => ({
    id: g.id,
    title: g.title,
    year: g.year,
    releaseYear: g.releaseYear,
    image: gameImage(g),
    modReleased: g.mod.status === 'released',
  }))

  return (
    <>
      <div className="hero3d">
        <NeonSceneLazy />
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
          <Link href="/news" className="news-strip">
            <span className="news-strip-tag">ข่าวล่าสุด</span>
            <span className="news-strip-title">{newsPosts[0].title}</span>
            <span className="news-strip-date">{thaiDate(newsPosts[0].date)} →</span>
          </Link>
        )}

        <HomeGrid games={games} />
      </div>
    </>
  )
}
