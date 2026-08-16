import type { Metadata } from 'next'
import Link from 'next/link'
import { loreArticles } from '@/lib/content'
import { pageMeta } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'Lore — เรื่องราวเบื้องหลัง',
  description: 'ไทม์ไลน์ ตัวละคร องค์กร สถานที่ และรอยสัก — บริบทเบื้องหลังจักรวาล Yakuza / Like a Dragon',
  path: '/lore/',
})

export default function LorePage() {
  return (
    <div className="page">
      <div className="eyebrow">Lore</div>
      <h1 className="game-title">เรื่องราวเบื้องหลังซีรีส์</h1>
      <p className="game-sub">
        ไทม์ไลน์ องค์กร ตัวละคร และสถานที่ — บริบทที่ทำให้โลกของ Yakuza กลมขึ้น
      </p>
      {loreArticles.length ? (
        <ul className="chapter-list">
          {loreArticles.map((a) => (
            <li key={a.slug}>
              <Link href={`/lore/${a.slug}`}>
                <span>{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}
    </div>
  )
}
