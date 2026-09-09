// ข้อมูลเควสเสริมแบบมีโครงสร้าง (JSON) — แหล่งข้อมูลจริงของหน้า /game/<id>/substories/
// ไฟล์อยู่ที่ src/data/substories/<gameId>.json
//   y3r  สร้างจากไฟล์เกมโดยตรงด้วย scripts/extract-substories-y3r.py
//   ภาคอื่น แปลงมาจากตาราง markdown เดิมด้วย scripts/substories-md-to-json.py
// server-only เหมือน lib/content.ts (อ่านด้วย fs ตอน build) — ห้าม import จาก client component

import fs from 'node:fs'
import path from 'node:path'

export interface Substory {
  /** เลขในตารางของเกม/ไกด์ — เป็น string เพราะบางภาคใช้เลขซ้ำหรือมีอักษรผสม */
  n: string
  /** ชื่อที่โชว์เป็นหัวการ์ด */
  name: string
  /** ชื่อรอง (ชื่ออังกฤษ) ถ้าหัวการ์ดเป็นภาษาไทย */
  sub: string
  place: string
  /** เงื่อนไขปลดล็อก เช่น "บทที่ 5+" (ว่าง = ยังไม่มีข้อมูล) */
  unlock: string
  summary: string
  /** ขั้นความคืบหน้าถัดไปของเควส (ตอนนี้มีเฉพาะภาคที่ถอดจากไฟล์เกม) */
  steps: string[]
  /** กลุ่มของเควส เช่น สายตัวเอกใน Y0/Y4/Y5 (ว่าง = ไม่แบ่งกลุ่ม) */
  group: string
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

export interface SubstoryFacet {
  value: string
  count: number
}

/** ปุ่มกรองของภาคนั้น — ใช้กลุ่ม (สายตัวเอก) ก่อนถ้ามี ไม่งั้นใช้ทำเล */
export function substoryFacets(data: SubstoryData): { key: 'group' | 'place'; items: SubstoryFacet[] } {
  const key = data.quests.some((q) => q.group) ? 'group' : 'place'
  const count = new Map<string, number>()
  for (const q of data.quests) {
    const value = q[key]
    if (value) count.set(value, (count.get(value) ?? 0) + 1)
  }
  const items = [...count.entries()].map(([value, n]) => ({ value, count: n }))
  // กลุ่มเรียงตามลำดับที่ปรากฏในไกด์ (สายตัวเอกมีลำดับของมัน) ส่วนทำเลเรียงตามจำนวน
  if (key === 'place') items.sort((a, b) => b.count - a.count)
  return { key, items }
}
