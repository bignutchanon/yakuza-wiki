'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { thaiDate } from '@/lib/format'

const MotionArticle = motion.article

// โพสต์โผล่ไล่จังหวะทีละใบ — แยกเป็น client component เพราะ framer-motion ต้องใช้ hook ฝั่ง browser
// (NewsPage เองยังเป็น server component เพื่อ export metadata ได้)
const postMotion = (i: number) =>
  ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(i, 4) * 0.08, ease: 'easeOut' },
  }) as const

// สารบัญข่าวส่งแค่คำโปรย ไม่ส่ง body เต็ม — เนื้อหาเต็มอยู่ที่ /news/<slug>/ หน้าเดียว
// (กันเนื้อหาซ้ำสองที่ในสายตาเครื่องมือค้นหา และทำให้หน้ารวมข่าวไม่โตขึ้นเรื่อย ๆ ตามจำนวนโพสต์)
export interface NewsListItem {
  slug: string
  title: string
  date: string
  tag: string
  excerpt: string
}

interface NewsListProps {
  posts: NewsListItem[]
}

export default function NewsList({ posts }: NewsListProps) {
  if (!posts.length) return <p>ยังไม่มีข่าว</p>

  return (
    <>
      {posts.map((p, i) => (
        <MotionArticle key={p.slug} className="news-post" {...postMotion(i)}>
          <div className="news-post-head">
            {p.tag && <span className="badge">{p.tag}</span>}
            <span className="news-post-date">{thaiDate(p.date)}</span>
          </div>
          <h2 className="news-post-title">
            <Link href={`/news/${p.slug}`}>{p.title}</Link>
          </h2>
          <p className="news-post-excerpt">{p.excerpt}</p>
          <Link className="news-post-more" href={`/news/${p.slug}`}>
            อ่านต่อ →
          </Link>
        </MotionArticle>
      ))}
    </>
  )
}
