import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GAMES, gameById, gameImage, steamStore, modUpdateBadge, CITY_MAPS } from '@/data/games'
import { contentFor } from '@/lib/content'
import type { Chapter } from '@/lib/content'
import { pageMeta, SITE_URL } from '@/lib/site'
import Credit from '@/components/Credit'
import { ShotStrip } from '@/components/Screenshots'

export async function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }))
}
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const game = gameById(id)
  if (!game) return {}

  return pageMeta({
    title: game.title,
    description: `${game.subtitle} — ${game.blurb}`.slice(0, 160),
    path: `/game/${id}/`,
    image: gameImage(game),
  })
}

// แถวของสารบัญบท — ป้ายชื่อพาร์ท (แทรกก่อนบทแรกของพาร์ทนั้น) หรือแถวบทจริง
type Row = { type: 'part'; label: string; key: string } | { type: 'chapter'; ch: Chapter; key: number }

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = gameById(id)
  if (!game) notFound()

  const { chapters, substories, guide } = contentFor(id)

  // แทรกป้ายชื่อพาร์ทเมื่อบทถัดไปเปลี่ยนพาร์ท (ภาคที่แบ่งพาร์ท เช่น Y4/Y5)
  const rows: Row[] = []
  let lastPart: string | null = null
  for (const ch of chapters) {
    if (ch.part && ch.part !== lastPart) {
      rows.push({ type: 'part', label: ch.part, key: `part-${ch.part}` })
      lastPart = ch.part
    }
    rows.push({ type: 'chapter', ch, key: ch.n })
  }

  const updateBadge = modUpdateBadge(game.mod)

  const path = `/game/${id}/`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    url: `${SITE_URL}${path}`,
    image: gameImage(game),
    inLanguage: 'th',
  }

  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="game-hero">
        <img src={gameImage(game)} alt={game.title} />
        {updateBadge && <span className="update-flag">{updateBadge}</span>}
      </div>
      <Credit href={steamStore(game.steamAppId)} />

      <div className="eyebrow">เหตุการณ์ปี {game.year}</div>
      <h1 className="game-title">{game.title}</h1>
      <p className="game-sub">{game.subtitle}</p>

      <p>{game.blurb}</p>

      <table className="fact-table">
        <tbody>
          <tr>
            <td>ตัวเอก</td>
            <td>{game.protagonists.join(' · ')}</td>
          </tr>
          <tr>
            <td>ฉาก</td>
            <td>{game.setting}</td>
          </tr>
          <tr>
            <td>วางจำหน่าย</td>
            <td>{game.releaseYear}</td>
          </tr>
        </tbody>
      </table>

      {game.mod.status === 'released' ? (
        <div className="mod-box">
          <h3>ม็อดแปลไทยพร้อมโหลด</h3>
          <p>
            แปลโดยผู้จัดทำเว็บนี้
            {game.mod.note ? ` — ${game.mod.note}` : ''}
          </p>
          <a className="mod-btn" href={game.mod.url} target="_blank" rel="noreferrer">
            ดาวน์โหลดม็อดแปลไทย ↓
          </a>
          {game.mod.beta && (
            <p className="mod-beta">
              <a className="mod-btn mod-btn-beta" href={game.mod.beta.url} target="_blank" rel="noreferrer">
                ลองรุ่นทดสอบ (beta) ↓
              </a>
              {game.mod.beta.note && <span className="mod-beta-note">{game.mod.beta.note}</span>}
            </p>
          )}
          {game.mod.nexus && (
            <p style={{ marginTop: '0.7rem', marginBottom: 0 }}>
              หรือโหลดผ่าน{' '}
              <a href={game.mod.nexus} target="_blank" rel="noreferrer">
                หน้าม็อดบน Nexus Mods ↗
              </a>
            </p>
          )}
        </div>
      ) : (
        <div className="mod-box muted-box">
          <h3>ม็อดแปลไทย</h3>
          <p>ภาคนี้ยังไม่มีม็อดแปลไทย</p>
        </div>
      )}

      <ShotStrip game={game} />

      {game.trailer && (
        <>
          <h2 className="section-h">เทรลเลอร์</h2>
          <div className="video-wrap">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${game.trailer}`}
              title={`${game.title} — Trailer`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <Credit href={`https://www.youtube.com/watch?v=${game.trailer}`} label="วิดีโอ: YouTube — © SEGA / RGG Studio" />
        </>
      )}

      {game.maps && game.maps.length > 0 && (
        <>
          <h2 className="section-h">แผนที่เมืองในภาคนี้</h2>
          <div className="map-grid">
            {game.maps.map((mid) => {
              const m = CITY_MAPS[mid]
              if (!m) return null
              return (
                <figure key={mid} className="map-card">
                  {/* คลิกเปิดไฟล์เต็มความละเอียดในแท็บใหม่ */}
                  <a href={m.img} target="_blank" rel="noreferrer">
                    <img src={m.img} alt={`แผนที่ ${m.label}`} loading="lazy" />
                  </a>
                  <figcaption>{m.label} — คลิกเพื่อดูเต็มขนาด</figcaption>
                </figure>
              )
            })}
          </div>
          <Credit href="https://yakuza.fandom.com/" label="แผนที่: Yakuza Wiki (Fandom) — © SEGA" />
        </>
      )}

      <h2 className="section-h">เนื้อเรื่องหลัก — สรุปรายบท</h2>
      {chapters.length ? (
        <ul className="chapter-list">
          {rows.map((r) =>
            r.type === 'part' ? (
              <li key={r.key} className="part-label">
                {r.label}
              </li>
            ) : (
              <li key={r.key}>
                <Link href={`/game/${id}/ch/${r.ch.n}`}>
                  <span className="n">{r.ch.n}</span>
                  <span>{r.ch.thai || r.ch.title}</span>
                  {r.ch.thai && <span className="en">{r.ch.title}</span>}
                </Link>
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}

      <h2 className="section-h">เควสเสริม (Substories)</h2>
      {substories ? (
        <p>
          <Link href={`/game/${id}/substories`}>ดูรายการเควสเสริมทั้งหมดของ {game.title} →</Link>
        </p>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}

      {guide && (
        <>
          <h2 className="section-h">{guide.meta.title || 'ไกด์เสริม'}</h2>
          <p>
            <Link href={`/game/${id}/guide`}>อ่านไกด์ฉบับเต็ม — อาชีพ ของเทพ และการฟาร์ม →</Link>
          </p>
        </>
      )}
    </div>
  )
}
