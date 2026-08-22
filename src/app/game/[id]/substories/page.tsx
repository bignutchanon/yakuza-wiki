import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage, STEAM_HEADER_SIZE } from '@/data/games'
import { contentFor, plainText } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import Markdown from '@/components/Markdown'
import JsonLd from '@/components/JsonLd'

export async function generateStaticParams() {
  return GAMES.filter((g) => contentFor(g.id).substories).map((g) => ({ id: g.id }))
}
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const game = gameById(id)
  const { substories } = contentFor(id)
  if (!game || !substories) return {}

  return pageMeta({
    title: `Substories — ${game.title}`,
    description: `รายการเควสเสริม (Substories) ทั้งหมดของ ${game.title} — ${plainText(substories.body)}`,
    path: `/game/${id}/substories/`,
    image: { url: gameImage(game), ...STEAM_HEADER_SIZE },
  })
}

export default async function SubstoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = gameById(id)
  const { substories } = contentFor(id)

  if (!game || !substories) notFound()

  return (
    <div className="page">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: game.title, path: `/game/${id}/` },
          { name: 'เควสเสริม (Substories)', path: `/game/${id}/substories/` },
        ])}
      />

      <div className="eyebrow">
        <Link href={`/game/${id}`}>{game.title}</Link>
      </div>
      <h1 className="game-title">เควสเสริม (Substories)</h1>
      <Markdown text={substories.body} />
    </div>
  )
}
