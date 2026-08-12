import { useState } from 'react'
import shots from '../data/screenshots.json'
import { steamStore } from '../data/games.js'
import Credit from './Credit.jsx'

// แถบสกรีนช็อตทางการจาก Steam — คลิกเพื่อดูรูปใหญ่
export function ShotStrip({ game }) {
  const list = shots[game.id] || []
  const [active, setActive] = useState(null)
  if (!list.length) return null

  return (
    <div className="shot-strip-wrap">
      <div className="shot-strip">
        {list.map((src) => (
          <button
            key={src}
            type="button"
            className="shot-thumb"
            onClick={() => setActive(active === src ? null : src)}
          >
            <img src={src} alt={`สกรีนช็อต ${game.title}`} loading="lazy" />
          </button>
        ))}
      </div>
      {active && (
        <button type="button" className="shot-big" onClick={() => setActive(null)}>
          <img src={active} alt={`สกรีนช็อต ${game.title}`} />
        </button>
      )}
      <Credit href={steamStore(game.steamAppId)} label="สกรีนช็อต: © SEGA — จากหน้าร้าน Steam" />
    </div>
  )
}

// รูปเปิดหัวบท — เลือกสกรีนช็อตแบบวนตามเลขบท (ภาพประกอบบรรยากาศ ไม่ใช่ฉากของบทนั้นตรง ๆ)
export function ChapterArt({ game, n }) {
  const list = shots[game.id] || []
  if (!list.length) return null
  const src = list[(n - 1) % list.length]
  return (
    <div className="ch-art">
      <img src={src} alt={`ภาพประกอบจาก ${game.title}`} loading="lazy" />
      <Credit href={steamStore(game.steamAppId)} label="ภาพประกอบจากเกม: © SEGA — Steam" />
    </div>
  )
}
