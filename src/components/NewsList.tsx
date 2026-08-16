'use client'

import { motion } from 'framer-motion'
import { thaiDate } from '@/lib/format'
import type { NewsPost } from '@/lib/content'
import Markdown from './Markdown'

// โพสต์โผล่ไล่จังหวะทีละใบ — แยกเป็น client component เพราะ framer-motion ต้องใช้ hook ฝั่ง browser
// (NewsPage เองยังเป็น server component เพื่อ export metadata ได้)
const postMotion = (i: number) =>
  ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(i, 4) * 0.08, ease: 'easeOut' },
  }) as const

interface NewsListProps {
  posts: NewsPost[]
}

export default function NewsList({ posts }: NewsListProps) {
  return (
    <>
      {posts.map((p, i) => (
        <motion.article key={p.slug} className="news-post" {...postMotion(i)}>
          <div className="news-post-head">
            {p.tag && <span className="badge">{p.tag}</span>}
            <span className="news-post-date">{thaiDate(p.date)}</span>
          </div>
          <Markdown text={`## ${p.title}\n\n${p.body}`} />
        </motion.article>
      ))}
      {posts.length === 0 && <p>ยังไม่มีข่าว</p>}
    </>
  )
}
