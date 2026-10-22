import type { Metadata } from 'next'
import Link from 'next/link'
import { GAMES, gameImage, modUpdateBadge } from '@/data/games'
import { contentFor, newsPosts, thaiDate } from '@/lib/content'
import { substoryDataFor } from '@/lib/substories'
import { pageMeta, DEFAULT_DESCRIPTION, AUTHOR_NAME } from '@/lib/site'
import HeroScene from '@/components/HeroScene'
import HomeGrid, { type HomeGridGame } from '@/components/HomeGrid'
import ShopeeBox from '@/components/ShopeeBox'

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

  const stats = [
    { value: GAMES.length, label: 'ภาค' },
    { value: GAMES.reduce((sum, game) => sum + contentFor(game.id).chapters.length, 0), label: 'บทสรุปเนื้อเรื่อง' },
    { value: GAMES.reduce((sum, game) => sum + (substoryDataFor(game.id)?.quests.length ?? 0), 0), label: 'เควสเสริม' },
    { value: GAMES.filter((game) => game.mod.status === 'released').length, label: 'ม็อดแปลไทย' },
  ]

  return (
    <>
      <div className="hero3d">
        <HeroScene />
        <div className="hero-copy">
          <div className="hero-eyebrow"><span aria-hidden="true" />神室町 · KAMUROCHO</div>
          {/* h1 ต้องมีคำที่คนค้นจริง — เดิมเป็น "龍が如く Yakuza Wiki" ซึ่งไม่มีคำภาษาไทยให้จับเลย */}
          <h1>
            龍が如く <span className="accent">Yakuza Wiki ภาษาไทย</span>
          </h1>
          <p>
            สรุปเนื้อเรื่องทุกบท เควสเสริม และม็อดแปลไทย ครบทั้งซีรีส์
            ตั้งแต่ Yakuza 0 ถึง Infinite Wealth — โดยแฟนเกม เพื่อแฟนเกม
          </p>
          <dl className="hero-stats">
            {stats.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <span className="hero-kanji" aria-hidden="true">神室町</span>
        <span className="hero-credit"><span className="credit-photo">ภาพ: Like a Dragon: Kiwami 3 © SEGA</span></span>
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

        {/* ย่อหน้าแนะนำเว็บ — ผู้อ่านที่มาถึงหน้าแรกครั้งแรกต้องรู้ทันทีว่าเว็บนี้คืออะไรและใครทำ */}
        <section className="home-intro">
          <h2>เว็บนี้คืออะไร</h2>
          <p>
            Yakuza Wiki ภาษาไทย คือวิกิที่ทำโดยแฟนเกมชาวไทย รวมสรุปเนื้อเรื่องรายบท ไกด์เควสเสริม
            บทความเบื้องหลัง ข่าวสาร และตารางราคาของซีรีส์ Yakuza / Like a Dragon ครบทั้ง 15 ภาค
            ตั้งแต่ Yakuza 0 จนถึง Like a Dragon: Kiwami 3
          </p>
          <p>
            สิ่งที่หาจากที่อื่นไม่ได้คือ <strong>ม็อดแปลภาษาไทย</strong> ของแต่ละภาค
            ซึ่งเป็นงานแปลของผู้จัดทำเว็บนี้เอง แจกฟรีทุกตัว พร้อมข่าวแจ้งทุกครั้งที่ออกเวอร์ชันแก้
            เนื้อหาในเว็บจึงเขียนจากคนที่อ่านบทพูดทั้งเกมมาแล้วตอนทำงานแปล ไม่ใช่การแปลวิกิภาษาอังกฤษมาวาง
          </p>
          <p className="home-intro-by">
            เขียนและดูแลโดย {AUTHOR_NAME} — <Link href="/about">อ่านเพิ่มเติมว่าใครทำเว็บนี้</Link>
          </p>
        </section>

        <HomeGrid games={games} />

        <ShopeeBox />
      </div>
    </>
  )
}
