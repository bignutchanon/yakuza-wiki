import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage } from '@/data/games'
import { contentFor } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import Markdown from '@/components/Markdown'
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

  return pageMeta({
    title: `บทที่ ${ch.n}: ${ch.title}`,
    description: `สรุปเนื้อเรื่อง ${game.title} บทที่ ${ch.n} — ${ch.thai}`,
    path: `/game/${id}/ch/${ch.n}/`,
    image: gameImage(game),
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

  return (
    <div className="page">
      <div className="ch-head">
        <div className="eyebrow">
          <Link href={`/game/${id}`}>{game.title}</Link>
          {ch.part ? ` · ${ch.part}` : ''}
        </div>
        <div className="ch-n">บทที่ {ch.n}</div>
        <h1>{ch.thai || ch.title}</h1>
        {ch.thai && ch.title && <div className="en-title">{ch.title}</div>}
      </div>

      <div className="spoiler-note">สปอยล์เนื้อเรื่องของบทนี้เต็ม ๆ</div>

      <ChapterArt game={game} n={ch.n} />

      <Markdown text={ch.body} />

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
