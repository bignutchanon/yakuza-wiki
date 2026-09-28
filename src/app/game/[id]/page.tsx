import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  GAMES,
  gameById,
  gameImage,
  steamStore,
  modUpdateBadge,
  CITY_MAPS,
  STEAM_HEADER_SIZE,
  STEAM_CAPSULE_SIZE,
  gameShareImage,
} from '@/data/games'
import type { Game } from '@/data/games'
import { contentFor } from '@/lib/content'
import type { Chapter } from '@/lib/content'
import { substoryDataFor } from '@/lib/substories'
import { thaiDate } from '@/lib/format'
import { pageMeta } from '@/lib/site'
import { breadcrumbJsonLd, videoGameJsonLd, modJsonLd, faqJsonLd } from '@/lib/seo'
import Credit from '@/components/Credit'
import JsonLd from '@/components/JsonLd'
import Markdown from '@/components/Markdown'
import RecommendButton from '@/components/RecommendButton'
import { ShotStrip } from '@/components/Screenshots'

export async function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }))
}
export const dynamicParams = false

// <title> ของหน้าเกม — คำค้นหลักของเว็บนี้คือ "<ชื่อภาค> แปลไทย / ภาษาไทย" จึงต้องอยู่ต้นชื่อ ไม่ใช่ชื่อภาคเปล่า ๆ
function gameMetaTitle(game: Game): string {
  const name = game.shortTitle ?? game.title
  return game.mod.status === 'released'
    ? `${name} แปลไทย: ม็อดภาษาไทย + สรุปเนื้อเรื่องรายบท`
    : `${name} สรุปเนื้อเรื่องรายบท`
}

// meta description ประกอบจากข้อมูลจริงของหน้า (เวอร์ชันม็อด/วันที่/จำนวนบท/จำนวนเควส) — ออกแพตช์ใหม่แล้วอัปเดตเองตอน build
// ไม่ต้องตัดความยาวเอง pageMeta() เรียก clip() ให้ (ส่วนท้ายที่เป็น blurb จะถูกตัดก่อน)
function gameMetaDescription(game: Game, chapterCount: number, questCount: number, hasFaq: boolean): string {
  const parts: string[] = []
  if (game.mod.status === 'released') {
    const version = game.mod.version ? ` ${game.mod.version}` : ''
    const updated = game.mod.updated ? ` (อัปเดต ${thaiDate(game.mod.updated)})` : ''
    const howTo = hasFaq ? ' พร้อมวิธีติดตั้ง' : ''
    parts.push(`ม็อดแปลไทย ${game.storeName ?? game.title}${version} โหลดฟรี${updated}${howTo}`)
  }
  if (chapterCount) parts.push(`สรุปเนื้อเรื่อง ${chapterCount} บท`)
  if (questCount) parts.push(`เควสเสริม ${questCount} เควส`)
  return parts.length ? `${parts.join(' · ')} — ${game.blurb}` : game.blurb
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const game = gameById(id)
  if (!game) return {}

  const { chapters, faq } = contentFor(id)
  const questCount = substoryDataFor(id)?.quests.length ?? 0

  return pageMeta({
    title: game.seo?.title ?? gameMetaTitle(game),
    description: game.seo?.description ?? gameMetaDescription(game, chapters.length, questCount, !!faq),
    path: `/game/${id}/`,
    image: { url: gameShareImage(game), ...STEAM_CAPSULE_SIZE },
  })
}

// แถวของสารบัญบท — ป้ายชื่อพาร์ท (แทรกก่อนบทแรกของพาร์ทนั้น) หรือแถวบทจริง
type Row = { type: 'part'; label: string; key: string } | { type: 'chapter'; ch: Chapter; key: number }

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = gameById(id)
  if (!game) notFound()

  const { chapters, substories, guide, overview, faq } = contentFor(id)

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
  const image = gameImage(game)

  return (
    <div className="page">
      <JsonLd
        data={[
          videoGameJsonLd(game, path, image),
          // ประกาศม็อดแปลไทยเป็นซอฟต์แวร์แจกฟรีแยกโหนด — คำถามยอดฮิตที่คนถามผู้ช่วย AI
          modJsonLd(game, path, image),
          faq && faqJsonLd(faq.items),
          breadcrumbJsonLd([{ name: game.title, path }]),
        ]}
      />

      <div className="game-hero">
        <img src={image} alt={game.title} {...STEAM_HEADER_SIZE} />
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
          {game.mod.manual && (
            <p className="mod-beta">
              <a className="mod-btn mod-btn-beta" href={game.mod.manual.url} target="_blank" rel="noreferrer">
                แบบไม่มีตัวติดตั้ง (ก็อปไฟล์เอง) ↓
              </a>
              {game.mod.manual.note && <span className="mod-beta-note">{game.mod.manual.note}</span>}
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
          {faq && (
            <p className="mod-faq-link">
              <a href="#faq">วิธีติดตั้งและคำถามที่พบบ่อย ↓</a>
            </p>
          )}
        </div>
      ) : (
        <div className="mod-box muted-box">
          <h3>ม็อดแปลไทย</h3>
          <p>ภาคนี้ยังไม่มีม็อดแปลไทย</p>
        </div>
      )}

      <RecommendButton target={`game:${game.id}`} />

      {/* src/content/<id>/overview.md — แนะนำภาคก่อนเล่น ช่วยให้หน้าเกมไม่เหลือแค่ blurb บรรทัดเดียว */}
      {overview && (
        <>
          <h2 className="section-h">{overview.meta.title || `รู้จัก ${game.title} ก่อนเล่น`}</h2>
          <Markdown text={overview.body} />
        </>
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
                    <img
                      src={m.img}
                      alt={`แผนที่ ${m.label}`}
                      width={m.width}
                      height={m.height}
                      loading="lazy"
                    />
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

      {/* ไม่มีหน้าเควสเสริม = ไม่แสดงหัวข้อเลย — กล่อง "กำลังเขียน" เข้าข่าย "under construction" ที่ AdSense ระบุว่าเป็นเหตุไม่อนุมัติ */}
      {substories && (
        <>
          <h2 className="section-h">เควสเสริม (Substories)</h2>
          <p>
            <Link href={`/game/${id}/substories`}>ดูรายการเควสเสริมทั้งหมดของ {game.title} →</Link>
          </p>
        </>
      )}

      {guide && (
        <>
          <h2 className="section-h">{guide.meta.title || 'ไกด์เสริม'}</h2>
          <p>
            <Link href={`/game/${id}/guide`}>อ่านฉบับเต็ม →</Link>
          </p>
        </>
      )}

      {/* src/content/<id>/faq.md — ชุดเดียวกับ FAQPage JSON-LD ด้านบน ต้องแสดงครบบนหน้า ห้ามซ่อน */}
      {faq && (
        <section id="faq" className="faq">
          <h2 className="section-h">{faq.title}</h2>
          {faq.items.map((item) => (
            <div key={item.q} className="faq-item">
              <h3>{item.q}</h3>
              <Markdown text={item.a} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
