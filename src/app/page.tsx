import type { Metadata } from 'next'
import Link from 'next/link'
import { GAMES, gameImage, modUpdateBadge } from '@/data/games'
import { newsPosts, thaiDate } from '@/lib/content'
import { pageMeta, DEFAULT_DESCRIPTION } from '@/lib/site'
import HeroScene from '@/components/HeroScene'
import HomeGrid, { type HomeGridGame } from '@/components/HomeGrid'

export const metadata: Metadata = pageMeta({ title: '', description: DEFAULT_DESCRIPTION, path: '/' })

// หน้าแรก — server component: render markdown/ข้อมูลฝั่ง server ทั้งหมด ส่วนการ์ด motion แยกไปที่ HomeGrid (client)
export default function Home() {
  // เตรียมข้อมูลภาคให้เป็น props ที่ serialize ได้ล้วน ๆ ก่อนส่งเข้า client component
  const games: HomeGridGame[] = GAMES.map((g) => ({
    id: g.id,
    title: g.title,
    year: g.year,
    releaseYear: g.releaseYear,
    image: gameImage(g),
    modReleased: g.mod.status === 'released',
    updateBadge: modUpdateBadge(g.mod),
  }))

  return (
    <>
      <div className="hero3d">
        <HeroScene />
        <div className="hero-copy">
          {/* h1 ต้องมีคำที่คนค้นจริง — เดิมเป็น "龍が如く Yakuza Wiki" ซึ่งไม่มีคำภาษาไทยให้จับเลย */}
          <h1>
            龍が如く <span className="accent">Yakuza Wiki ภาษาไทย</span>
          </h1>
          <p>
            สรุปเนื้อเรื่องทุกบท เควสเสริม และม็อดแปลไทย ครบทั้งซีรีส์
            ตั้งแต่ Yakuza 0 ถึง Infinite Wealth — โดยแฟนเกม เพื่อแฟนเกม
          </p>
        </div>
        <span className="hero-credit">ภาพ: Like a Dragon: Kiwami 3 © SEGA</span>
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
