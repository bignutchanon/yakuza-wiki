import type { Metadata } from 'next'
import Link from 'next/link'
import { newsPosts } from '@/lib/content'
import { pageMeta, clip, absUrl } from '@/lib/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'
import NewsList, { type NewsListItem } from '@/components/NewsList'

export const metadata: Metadata = pageMeta({
  title: 'ข่าวสาร',
  description: 'รวมข่าวจาก Ryu Ga Gotoku Studio เกมใหม่ในเครือ และอัปเดตม็อดแปลไทยทุกภาค',
  path: '/news/',
})

export default function NewsPage() {
  // ส่งเฉพาะคำโปรยไปฝั่ง client — เนื้อหาเต็มอยู่ที่หน้าโพสต์ของแต่ละข่าว
  const items: NewsListItem[] = newsPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    tag: p.tag,
    excerpt: clip(p.excerpt, 200),
  }))

  // สารบัญข่าวเรียงใหม่ → เก่า บอกเครื่องมือค้นหา/ผู้ช่วย AI ว่าโพสต์แต่ละอันอยู่ URL ไหน
  const listJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ข่าวสารและอัปเดตม็อดแปลไทย',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: newsPosts.length,
    itemListElement: newsPosts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: absUrl(`/news/${p.slug}/`),
    })),
  }

  return (
    <div className="page">
      <JsonLd data={[listJsonLd, breadcrumbJsonLd([{ name: 'ข่าวสาร', path: '/news/' }])]} />

      <h1>ข่าวสาร</h1>
      <p className="game-sub">
        {/* ไม่ลิงก์ /feed.xml ตรงนี้ — ฟีดมีไว้ให้แอปอ่านข่าว/บอตเก็บ (ประกาศผ่าน <link rel="alternate"> ใน metadata)
            คนกดจะเจอ XML ดิบเปล่า ๆ */}
        รวมข่าวจาก Ryu Ga Gotoku Studio และเกมใหม่ในเครือ — อัปเดตโดยผู้จัดทำเป็นระยะ ·
        เช็คราคาทุกภาคได้ที่หน้า <Link href="/prices">ราคาเกม</Link>
      </p>

      <NewsList posts={items} />
    </div>
  )
}
