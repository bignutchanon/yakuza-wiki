import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage, STEAM_HEADER_SIZE } from '@/data/games'
import { contentFor, plainText } from '@/lib/content'
import { substoryDataFor, substoryFacets } from '@/lib/substories'
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
  const facets = data ? substoryFacets(data) : null

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
          <h2 className="section-h">รายการเควสทั้งหมด</h2>
          <SubstoryFilter
            total={data.quests.length}
            facets={facets?.items ?? []}
            placeholder={
              facets?.key === 'group'
                ? 'ค้นชื่อเควส สถานที่ หรือคำในสรุป'
                : 'ค้นชื่อเควส หรือคำในสรุป เช่น ดาร์ต, Amon'
            }
          />

          <ol className="sub-list">
            {data.quests.map((q, i) => (
              <li
                key={`${q.group}-${q.n}-${i}`}
                className="sub-card"
                data-substory={q.n}
                data-facet={facets?.key === 'group' ? q.group : q.place}
              >
                <div className="sub-head">
                  <span className="sub-no">{q.n}</span>
                  <h3 className="sub-name">{q.name}</h3>
                  {q.place && <span className="sub-place">{q.place}</span>}
                </div>
                {q.sub && <p className="sub-en">{q.sub}</p>}
                {(q.group || q.unlock) && (
                  <p className="sub-meta">
                    {q.group && <span className="sub-group">{q.group}</span>}
                    {q.unlock && <span className="sub-unlock">ปลดล็อก: {q.unlock}</span>}
                  </p>
                )}
                {q.summary && <p className="sub-goal">{q.summary}</p>}
                {q.steps.length > 0 && (
                  <details className="sub-steps">
                    <summary>ขั้นต่อไปในเควสนี้ ({q.steps.length})</summary>
                    <ol>
                      {q.steps.map((step, s) => (
                        <li key={s}>{step}</li>
                      ))}
                    </ol>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
