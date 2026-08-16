'use client'

import { useState } from 'react'
import shots from '@/data/screenshots.json'
import { steamStore, type Game } from '@/data/games'
import Credit from './Credit'

// shots.json = { [gameId]: string[] } — cast เพราะ TS อนุมาน key เป็น union ตายตัวจากไฟล์จริง
const screenshotMap = shots as Record<string, string[]>

interface ShotStripProps {
  game: Game
}

// แถบสกรีนช็อตทางการจาก Steam — คลิกเพื่อดูรูปใหญ่
export function ShotStrip({ game }: ShotStripProps) {
  const list = screenshotMap[game.id] || []
  const [active, setActive] = useState<string | null>(null)
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

interface ChapterArtProps {
  game: Game
  n: number
}

// รูปเปิดหัวบท — เลือกสกรีนช็อตแบบวนตามเลขบท (ภาพประกอบบรรยากาศ ไม่ใช่ฉากของบทนั้นตรง ๆ)
export function ChapterArt({ game, n }: ChapterArtProps) {
  const list = screenshotMap[game.id] || []
  if (!list.length) return null
  const src = list[(n - 1) % list.length]
  return (
    <div className="ch-art">
      <img src={src} alt={`ภาพประกอบจาก ${game.title}`} loading="lazy" />
      <Credit href={steamStore(game.steamAppId)} label="ภาพประกอบจากเกม: © SEGA — Steam" />
    </div>
  )
}
