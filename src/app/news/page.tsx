import type { Metadata } from 'next'
import Link from 'next/link'
import { newsPosts } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import NewsList from '@/components/NewsList'

export const metadata: Metadata = pageMeta({
  title: 'ข่าวสาร',
  description: 'รวมข่าวจาก Ryu Ga Gotoku Studio เกมใหม่ในเครือ และอัปเดตม็อดแปลไทยทุกภาค',
  path: '/news/',
})

export default function NewsPage() {
  return (
    <div className="page">
      <h1>ข่าวสาร</h1>
      <p className="game-sub">
        รวมข่าวจาก Ryu Ga Gotoku Studio และเกมใหม่ในเครือ — อัปเดตโดยผู้จัดทำเป็นระยะ ·
        เช็คราคาทุกภาคได้ที่หน้า <Link href="/prices">ราคาเกม</Link>
      </p>

      <NewsList posts={newsPosts} />
    </div>
  )
}
