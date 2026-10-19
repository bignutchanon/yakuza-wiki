import { gameById } from '@/data/games'

// ข่าวม็อดตั้งชื่อไฟล์ YYYY-MM-DD-<เกม>-thai-mod-v<เลข> — <เกม> ตรงกับ id ใน games.ts ยกเว้นสามตัวนี้
const NEWS_GAME_ALIAS: Record<string, string> = {
  'lost-judgment': 'lostjudgment',
  kiwami3: 'y3',
  'y3-remastered': 'y3r',
}

// ข่าวแพตช์เก่ายังติดอันดับค้นหา (เช่น "yakuza 0 mod" ไปเจอข่าว v1.8.1) — ถ้าม็อดภาคนั้นออกรุ่นใหม่หลังวันที่ข่าว
// ให้คืนเกมไว้ทำกล่องชี้ไปรุ่นล่าสุดในหน้าเกม แทนการลบข่าวเก่า (ลบ = URL ที่ติดอันดับกลายเป็น 404)
// ข่าวที่มีรุ่นใหม่แทนแล้วเป็นหน้าบาง (changelog รุ่นเก่า) → noindex + ไม่ลง sitemap/llms.txt (19 ต.ค. 2026 รอบแก้ AdSense)
export function newerModFor(slug: string, postDate: string) {
  const m = slug.match(/^\d{4}-\d{2}-\d{2}-(.+)-thai-mod-v\d+$/)
  if (!m) return undefined
  const game = gameById(NEWS_GAME_ALIAS[m[1]] ?? m[1])
  const { version, updated } = game?.mod ?? {}
  if (!game || !version || !updated || updated <= postDate) return undefined
  return { id: game.id, name: game.shortTitle ?? game.title, version, updated }
}
