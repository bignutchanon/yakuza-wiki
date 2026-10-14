import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { newsPosts, newsBySlug, thaiDate } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { gameById } from '@/data/games'
import Markdown from '@/components/Markdown'
import Byline from '@/components/Byline'
import JsonLd from '@/components/JsonLd'

// โพสต์ทั้งหมดรู้ล่วงหน้าตอน build จาก newsPosts — slug นอกลิสต์นี้ = 404
export const dynamicParams = false

// ข่าวม็อดตั้งชื่อไฟล์ YYYY-MM-DD-<เกม>-thai-mod-v<เลข> — <เกม> ตรงกับ id ใน games.ts ยกเว้นสามตัวนี้
const NEWS_GAME_ALIAS: Record<string, string> = {
  'lost-judgment': 'lostjudgment',
  kiwami3: 'y3',
  'y3-remastered': 'y3r',
}

// ข่าวแพตช์เก่ายังติดอันดับค้นหา (เช่น "yakuza 0 mod" ไปเจอข่าว v1.8.1) — ถ้าม็อดภาคนั้นออกรุ่นใหม่หลังวันที่ข่าว
// ให้คืนเกมไว้ทำกล่องชี้ไปรุ่นล่าสุดในหน้าเกม แทนการลบข่าวเก่า (ลบ = URL ที่ติดอันดับกลายเป็น 404)
function newerModFor(slug: string, postDate: string) {
  const m = slug.match(/^\d{4}-\d{2}-\d{2}-(.+)-thai-mod-v\d+$/)
  if (!m) return undefined
  const game = gameById(NEWS_GAME_ALIAS[m[1]] ?? m[1])
  const { version, updated } = game?.mod ?? {}
  if (!game || !version || !updated || updated <= postDate) return undefined
  return { id: game.id, name: game.shortTitle ?? game.title, version, updated }
}

export function generateStaticParams() {
  return newsPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = newsBySlug(slug)
  if (!post) return {}

  return pageMeta({
    title: post.title,
    description: post.excerpt,
    path: `/news/${slug}/`,
    type: 'article',
    // frontmatter เก็บแค่วันที่ — เติมเวลา 00:00 เขตไทยให้เป็น ISO 8601 เต็มรูปแบบตามที่ Open Graph กำหนด
    publishedTime: `${post.date}T00:00:00+07:00`,
  })
}

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const idx = newsPosts.findIndex((p) => p.slug === slug)
  const post = newsPosts[idx]
  if (!post) notFound()

  // newsPosts เรียงใหม่ → เก่า ดังนั้น index ที่น้อยกว่า = โพสต์ที่ใหม่กว่า
  const newer = newsPosts[idx - 1]
  const older = newsPosts[idx + 1]
  const path = `/news/${slug}/`
  const newerMod = newerModFor(slug, post.date)

  return (
    <div className="page">
      <JsonLd
        data={[
          articleJsonLd({
            type: 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            path,
            datePublished: post.date,
            section: post.tag || 'ข่าวสาร',
          }),
          breadcrumbJsonLd([
            { name: 'ข่าวสาร', path: '/news/' },
            { name: post.title, path },
          ]),
        ]}
      />

      <div className="eyebrow">
        <Link href="/news">ข่าวสาร</Link>
      </div>
      <div className="news-post-head">
        {post.tag && <span className="badge">{post.tag}</span>}
        <span className="news-post-date">{thaiDate(post.date)}</span>
      </div>
      <h1 className="game-title">{post.title}</h1>
      <Byline date={post.date} />

      {newerMod && (
        <Link href={`/game/${newerMod.id}/`} className="news-strip">
          <span className="news-strip-tag">มีรุ่นใหม่แล้ว</span>
          <span className="news-strip-title">
            ข่าวนี้เป็นของรุ่นเก่า — ม็อดแปลไทย {newerMod.name} รุ่นล่าสุดคือ{' '}
            <strong>{newerMod.version}</strong> ({thaiDate(newerMod.updated)}) โหลดได้ที่หน้าเกม →
          </span>
        </Link>
      )}

      <Markdown text={post.body} />

      <div className="pager">
        <span>
          {older && (
            <Link href={`/news/${older.slug}`}>← {older.title}</Link>
          )}
        </span>
        <span>
          {newer && (
            <Link href={`/news/${newer.slug}`}>{newer.title} →</Link>
          )}
        </span>
      </div>
    </div>
  )
}
