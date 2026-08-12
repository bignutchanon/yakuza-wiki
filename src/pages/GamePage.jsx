import { useParams, Link } from 'react-router-dom'
import { gameById, gameImage, steamStore } from '../data/games.js'
import { contentFor } from '../content/loader.js'
import Credit from '../components/Credit.jsx'

export default function GamePage() {
  const { id } = useParams()
  const game = gameById(id)
  if (!game) return <div className="page">ไม่พบเกมนี้</div>

  const { chapters, substories } = contentFor(id)

  // แทรกป้ายชื่อพาร์ทเมื่อบทถัดไปเปลี่ยนพาร์ท (ภาคที่แบ่งพาร์ท เช่น Y4/Y5)
  const rows = []
  let lastPart = null
  for (const ch of chapters) {
    if (ch.part && ch.part !== lastPart) {
      rows.push({ partLabel: ch.part, key: `part-${ch.part}` })
      lastPart = ch.part
    }
    rows.push({ ch, key: ch.n })
  }

  return (
    <div className="page">
      <div className="game-hero">
        <img src={gameImage(game)} alt={game.title} />
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

      <h2 className="section-h">เนื้อเรื่องหลัก — สรุปรายบท</h2>
      {chapters.length ? (
        <ul className="chapter-list">
          {rows.map((r) =>
            r.partLabel ? (
              <li key={r.key} className="part-label">{r.partLabel}</li>
            ) : (
              <li key={r.key}>
                <Link to={`/game/${id}/ch/${r.ch.n}`}>
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
          <Link to={`/game/${id}/substories`}>
            ดูรายการเควสเสริมทั้งหมดของ {game.title} →
          </Link>
        </p>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}
    </div>
  )
}
