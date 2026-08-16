import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById } from '@/data/games'
import { contentFor } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import Markdown from '@/components/Markdown'

export async function generateStaticParams() {
  return GAMES.filter((g) => contentFor(g.id).guide).map((g) => ({ id: g.id }))
}
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const game = gameById(id)
  const { guide } = contentFor(id)
  if (!game || !guide) return {}

  const title = guide.meta.title || 'ไกด์'
  return pageMeta({
    title: `${title} — ${game.title}`,
    description: `ไกด์เสริมของ ${game.title} — ${title}`,
    path: `/game/${id}/guide/`,
  })
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = gameById(id)
  const { guide } = contentFor(id)

  if (!game || !guide) notFound()

  return (
    <div className="page">
      <div className="eyebrow">
        <Link href={`/game/${id}`}>{game.title}</Link>
      </div>
      <h1 className="game-title">{guide.meta.title || 'ไกด์เสริม'}</h1>
      <Markdown text={guide.body} />
    </div>
  )
}
