import type { Metadata } from 'next'
import Link from 'next/link'
import { gamePrices, thaiDate } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import Markdown from '@/components/Markdown'

export const metadata: Metadata = pageMeta({
  title: 'ราคาเกม',
  description: gamePrices
    ? `ตารางราคาเกม Yakuza / Like a Dragon ทุกภาค — อัปเดตล่าสุด ${thaiDate(gamePrices.updated)}`
    : 'ตารางราคาเกม Yakuza / Like a Dragon ทุกภาคบน Steam/PS/Xbox',
  path: '/prices/',
})

export default function PricesPage() {
  if (!gamePrices) {
    return (
      <div className="page">
        <h1>ราคาเกม</h1>
        <p>ยังไม่มีข้อมูลราคา</p>
      </div>
    )
  }
  return (
    <div className="page">
      <h1>ราคาเกมตอนนี้</h1>
      <p className="game-sub">
        อัปเดตล่าสุด {thaiDate(gamePrices.updated)} · ตามข่าวซีรีส์ได้ที่หน้า{' '}
        <Link href="/news">ข่าวสาร</Link>
      </p>
      <Markdown text={gamePrices.body} />
    </div>
  )
}
