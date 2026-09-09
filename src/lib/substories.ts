// ข้อมูลเควสเสริมแบบมีโครงสร้าง (JSON) — ใช้แทนตาราง markdown ในภาคที่ถอดข้อมูลจากไฟล์เกมได้
// ไฟล์อยู่ที่ src/data/substories/<gameId>.json สร้างด้วย scripts/extract-substories-<gameId>.py
// server-only เหมือน lib/content.ts (อ่านด้วย fs ตอน build) — ห้าม import จาก client component

import fs from 'node:fs'
import path from 'node:path'

export interface Substory {
  /** ลำดับตามตารางในไฟล์เกม (ตัดช่องที่ถูกถอดออกแล้ว) */
  n: number
  /** ชื่อเควสภาษาอังกฤษตามที่เกมต้นฉบับใช้ */
  en: string
  /** ชื่อไทยที่ม็อดแปลไทยแสดงในเกม (ว่าง = ม็อดคงชื่ออังกฤษไว้) */
  th: string
  place: string
  /** ข้อความความคืบหน้าที่ขึ้นในบันทึกภารกิจ เรียงตามลำดับขั้นของเควส */
  steps: string[]
}

export interface SubstoryData {
  game: string
  source: string
  quests: Substory[]
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'substories')

function loadAll(): Record<string, SubstoryData> {
  if (!fs.existsSync(DATA_DIR)) return {}
  const out: Record<string, SubstoryData> = {}
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith('.json')) continue
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as SubstoryData
    out[file.slice(0, -5)] = data
  }
  return out
}

const byGame = loadAll()

export const substoryDataFor = (gameId: string): SubstoryData | null => byGame[gameId] ?? null

/** ทำเลทั้งหมดที่มีในภาคนั้น เรียงตามจำนวนเควสจากมากไปน้อย (ใช้ทำปุ่มกรอง) */
export const substoryPlaces = (data: SubstoryData): { place: string; count: number }[] => {
  const count = new Map<string, number>()
  for (const q of data.quests) count.set(q.place, (count.get(q.place) ?? 0) + 1)
  return [...count.entries()]
    .map(([place, n]) => ({ place, count: n }))
    .sort((a, b) => b.count - a.count)
}
