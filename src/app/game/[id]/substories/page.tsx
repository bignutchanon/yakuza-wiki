import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage, STEAM_HEADER_SIZE } from '@/data/games'
import { contentFor, plainText } from '@/lib/content'
import { substoryDataFor, substoryPlaces } from '@/lib/substories'
import { pageMeta } from '@/lib/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import Markdown from '@/components/Markdown'
import JsonLd from '@/components/JsonLd'
import SubstoryFilter from '@/components/SubstoryFilter'

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

  // ภาคที่ถอดข้อมูลเควสจากไฟล์เกมได้ (src/data/substories/<id>.json) ใช้การ์ด + แถบค้นหาแทนตารางยาว
  const data = substoryDataFor(id)

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

      {data && (
        <>
          <SubstoryFilter total={data.quests.length} places={substoryPlaces(data)} />

          <ol className="sub-list">
            {data.quests.map((q) => {
              const [goal, ...rest] = q.steps
              const name = q.th || q.en
              return (
                <li
                  key={q.n}
                  className="sub-card"
                  data-substory={q.n}
                  data-place={q.place}
                >
                  <div className="sub-head">
                    <span className="sub-no">{q.n}</span>
                    <h2 className="sub-name">{name}</h2>
                    <span className="sub-place">{q.place}</span>
                  </div>
                  {q.th && <p className="sub-en">{q.en}</p>}
                  {goal && <p className="sub-goal">{goal}</p>}
                  {rest.length > 0 && (
                    <details className="sub-steps">
                      <summary>ขั้นต่อไปในเควสนี้ ({rest.length})</summary>
                      <ol>
                        {rest.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}
    </div>
  )
}
