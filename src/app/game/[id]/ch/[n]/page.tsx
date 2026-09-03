import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage, STEAM_HEADER_SIZE } from '@/data/games'
import { contentFor, plainText, substoriesForChapter } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import Markdown from '@/components/Markdown'
import Byline from '@/components/Byline'
import JsonLd from '@/components/JsonLd'
import { ChapterArt } from '@/components/Screenshots'

export async function generateStaticParams() {
  return GAMES.flatMap((g) => contentFor(g.id).chapters.map((ch) => ({ id: g.id, n: String(ch.n) })))
}
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; n: string }>
}): Promise<Metadata> {
  const { id, n } = await params
  const game = gameById(id)
  const { chapters } = contentFor(id)
  const ch = chapters.find((c) => c.n === Number(n))
  if (!game || !ch) return {}

  // ต่อชื่อภาคท้าย title เสมอ — ลำพัง "บทที่ 1: Prologue" ไม่บอกว่าเป็นภาคไหนทั้งในผลค้นหาและในแท็บ
  // (รูปแบบเดียวกับหน้า substories/guide)
  return pageMeta({
    title: `บทที่ ${ch.n}: ${ch.title} — ${game.title}`,
    description: `สรุปเนื้อเรื่อง ${game.title} บทที่ ${ch.n}${ch.thai ? ` (${ch.thai})` : ''} — ${plainText(ch.body)}`,
    path: `/game/${id}/ch/${ch.n}/`,
    image: { url: gameImage(game), ...STEAM_HEADER_SIZE },
    type: 'article',
  })
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; n: string }>
}) {
  const { id, n } = await params
  const game = gameById(id)
  const { chapters } = contentFor(id)
  const idx = chapters.findIndex((c) => c.n === Number(n))
  const ch = chapters[idx]

  if (!game || !ch) notFound()

  const prev = chapters[idx - 1]
  const next = chapters[idx + 1]
  const path = `/game/${id}/ch/${ch.n}/`

  // เควสเสริมที่ไกด์ substories ระบุว่าเปิดในบทนี้ — ข้อมูลชุดเดียวกับหน้า substories ไม่ได้เขียนซ้ำ
  const sideQuests = substoriesForChapter(id, ch.n)
  const { substories, guide } = contentFor(id)

  return (
    <div className="page">
      <JsonLd
        data={[
          articleJsonLd({
            headline: `${game.title} — บทที่ ${ch.n}: ${ch.title}`,
            description: `สรุปเนื้อเรื่อง ${game.title} บทที่ ${ch.n}${ch.thai ? ` (${ch.thai})` : ''} — ${plainText(ch.body)}`,
            path,
            image: gameImage(game),
            section: game.title,
          }),
          breadcrumbJsonLd([
            { name: game.title, path: `/game/${id}/` },
            { name: `บทที่ ${ch.n}: ${ch.title}`, path },
          ]),
        ]}
      />

      <div className="ch-head">
        <div className="eyebrow">
          <Link href={`/game/${id}`}>{game.title}</Link>
          {ch.part ? ` · ${ch.part}` : ''}
        </div>
        <div className="ch-n">บทที่ {ch.n}</div>
        <h1>{ch.thai || ch.title}</h1>
        {ch.thai && ch.title && <div className="en-title">{ch.title}</div>}
      </div>

      <Byline note="สรุปจากการเล่นจริงและบทในไฟล์เกม" />

      <div className="spoiler-note">สปอยล์เนื้อเรื่องของบทนี้เต็ม ๆ</div>

      <ChapterArt game={game} n={ch.n} />

      <Markdown text={ch.body} />

      {sideQuests.length > 0 && (
        <section className="ch-side">
          <h2>เควสเสริมที่เปิดในบทนี้</h2>
          <p className="ch-side-note">
            ถึงบทนี้แล้วเควสเสริมด้านล่างจะรับได้ — บางเควสมีเงื่อนไขอื่นเพิ่มนอกจากความคืบหน้าของเนื้อเรื่อง
          </p>
          <ul className="ch-side-list">
            {sideQuests.map((q) => (
              <li key={`${q.no}-${q.name}`}>
                <div className="ch-side-name">
                  <span className="ch-side-no">{q.no}</span> {q.name}
                </div>
                <div className="ch-side-meta">
                  {q.place}
                  {q.unlock && ` · ${q.unlock}`}
                </div>
                {q.summary && <div className="ch-side-sum">{q.summary}</div>}
              </li>
            ))}
          </ul>
          <Link className="ch-side-more" href={`/game/${id}/substories`}>
            ดูเควสเสริมทั้งหมดของภาคนี้ →
          </Link>
        </section>
      )}

      <section className="ch-more">
        <h2>อ่านต่อในภาคนี้</h2>
        <ul>
          <li>
            <Link href={`/game/${id}`}>หน้ารวม {game.title}</Link> — รายชื่อบททั้งหมด ข้อมูลภาค และม็อดแปลไทย
          </li>
          {substories && (
            <li>
              <Link href={`/game/${id}/substories`}>เควสเสริมทั้งหมด</Link> — จุดรับงาน เงื่อนไขปลดล็อก และสรุปแต่ละเควส
            </li>
          )}
          {guide && (
            <li>
              <Link href={`/game/${id}/guide`}>ไกด์เล่น {game.title}</Link> — ระบบต่อสู้ สกิล และสิ่งที่ควรรู้ก่อนเริ่ม
            </li>
          )}
        </ul>
      </section>

      <div className="pager">
        <span>
          {prev && (
            <Link href={`/game/${id}/ch/${prev.n}`}>
              ← บทที่ {prev.n}: {prev.thai || prev.title}
            </Link>
          )}
        </span>
        <span>
          {next && (
            <Link href={`/game/${id}/ch/${next.n}`}>
              บทที่ {next.n}: {next.thai || next.title} →
            </Link>
          )}
        </span>
      </div>
    </div>
  )
}
