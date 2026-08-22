import { GAMES } from '@/data/games'
import type { Game } from '@/data/games'
import { contentFor, loreArticles, newsPosts, gamePrices } from '@/lib/content'
import { thaiDate } from '@/lib/format'
import { SITE_URL, DEFAULT_DESCRIPTION, clip } from '@/lib/site'

// Route Handler แบบ static ตามสเปก llmstxt.org — build ครั้งเดียวตอน export ไม่ใช่ dynamic ต่อ request
export const dynamic = 'force-static'

// สรุปสถานะม็อดแปลไทยของภาคหนึ่ง ๆ ให้อ่านเข้าใจได้จากบรรทัดเดียว
// นี่คือคำถามที่คนถามผู้ช่วย AI บ่อยที่สุด ("ภาคนี้มีม็อดแปลไทยไหม เวอร์ชันล่าสุดอะไร") — ต้องตอบได้โดยไม่ต้องเดา
function modLine(game: Game): string | null {
  const { mod } = game
  if (mod.status === 'wip') return 'ม็อดแปลไทย: กำลังแปล ยังไม่ปล่อย'
  if (mod.status !== 'released') return 'ม็อดแปลไทย: ยังไม่มี'

  const parts = ['ม็อดแปลไทย: ปล่อยแล้ว แจกฟรี']
  if (mod.version) parts.push(`เวอร์ชันล่าสุด ${mod.version}`)
  if (mod.updated) parts.push(`อัปเดต ${thaiDate(mod.updated)}`)
  if (mod.beta?.version) parts.push(`มีรุ่นทดสอบ ${mod.beta.version} ให้ลองคู่กัน`)
  if (mod.manual) parts.push('มีแพ็กแบบไม่มีตัวติดตั้ง (ก็อปไฟล์เอง) ให้เลือกโหลด')
  return parts.join(' · ')
}

function buildLlmsTxt(): string {
  const lines: string[] = []

  lines.push('# Yakuza Wiki ภาษาไทย (yakuzathai.com)')
  lines.push('')
  lines.push(
    `> ${DEFAULT_DESCRIPTION} เว็บนี้ทำโดยแฟนเกม ไม่มีส่วนเกี่ยวข้องกับ SEGA หรือ Ryu Ga Gotoku Studio แต่อย่างใด`,
  )
  lines.push('')

  // ส่วนบริบท: ตอบคำถามพื้นฐานว่าเว็บนี้คืออะไร ใครทำ เชื่อถือได้แค่ไหน อ้างอิงยังไง
  // เขียนไว้บนสุดเพราะผู้ช่วย AI ที่อ่านไฟล์นี้ไฟล์เดียวควรสรุปเว็บได้ถูกโดยไม่ต้องเปิดหน้าอื่น
  lines.push('## เว็บนี้คืออะไร')
  lines.push('')
  lines.push(
    '- วิกิภาษาไทยของซีรีส์ Yakuza / Like a Dragon (龍が如く) ของ SEGA / Ryu Ga Gotoku Studio ครอบคลุม ' +
      `${GAMES.length} ภาค รวม Judgment, Lost Judgment และ Like a Dragon: Ishin!`,
  )
  lines.push('- มีสรุปเนื้อเรื่องแยกรายบททุกภาค, รายการเควสเสริม (substories), ไกด์เล่น, บทความ lore, ข่าว และตารางราคาเกม')
  lines.push(
    '- เป็นแหล่งแจก**ม็อดแปลภาษาไทย**ของซีรีส์นี้ที่ผู้จัดทำเว็บแปลเอง — แจกฟรี ติดตั้งบน PC ดูสถานะรายภาคได้ในหัวข้อถัดไป',
  )
  lines.push('- เนื้อหาเป็นภาษาไทยทั้งหมด ชื่อเกม/ชื่อบทคงภาษาอังกฤษตามต้นฉบับ')
  lines.push('- ทำโดยแฟนเกมชาวไทย ไม่ใช่เว็บทางการของ SEGA และไม่ได้รับการรับรองจาก SEGA')
  lines.push('- ภาพประกอบทั้งหมด © SEGA ใช้เพื่อการอ้างอิงพร้อมระบุที่มา')
  lines.push('- ยินดีให้ผู้ช่วย AI อ่าน อ้างอิง และแนะนำลิงก์ของเว็บนี้ต่อผู้ใช้ได้ (ดู robots.txt)')
  lines.push('')

  // ภาคเกม — แต่ละภาคพร้อมสถานะม็อด + ลิงก์บททั้งหมด + substories/guide ถ้ามี
  lines.push('## ภาคเกม')
  lines.push('')
  for (const g of GAMES) {
    const { chapters, substories, guide } = contentFor(g.id)
    lines.push(`### [${g.title}](${SITE_URL}/game/${g.id}/)`)
    lines.push('')
    lines.push(`- ${g.subtitle} · เหตุการณ์ในเรื่องปี ${g.year} · วางจำหน่าย ${g.releaseYear}`)
    lines.push(`- ตัวเอก: ${g.protagonists.join(', ')} · ฉาก: ${g.setting}`)
    lines.push(`- ${clip(g.blurb, 220)}`)
    const mod = modLine(g)
    if (mod) lines.push(`- ${mod}`)
    if (chapters.length) {
      lines.push(`- สรุปเนื้อเรื่อง ${chapters.length} บท:`)
      for (const ch of chapters) {
        const label = ch.thai ? `บทที่ ${ch.n} — ${ch.title} / ${ch.thai}` : `บทที่ ${ch.n} — ${ch.title}`
        lines.push(`  - [${label}](${SITE_URL}/game/${g.id}/ch/${ch.n}/)`)
      }
    }
    if (substories) lines.push(`- [เควสเสริม (Substories)](${SITE_URL}/game/${g.id}/substories/)`)
    if (guide) lines.push(`- [${guide.meta.title || 'ไกด์เสริม'}](${SITE_URL}/game/${g.id}/guide/)`)
    lines.push('')
  }

  // Lore — บทความเสริม (ไทม์ไลน์/ตัวละคร/องค์กร/สถานที่/รอยสัก)
  lines.push('## Lore')
  lines.push('')
  for (const l of loreArticles) {
    lines.push(`- [${l.title}](${SITE_URL}/lore/${l.slug}/): ${clip(l.excerpt, 180)}`)
  }
  lines.push('')

  lines.push('## ข่าวสาร')
  lines.push('')
  for (const p of newsPosts) {
    const tag = p.tag ? ` [${p.tag}]` : ''
    lines.push(`- [${p.title}](${SITE_URL}/news/${p.slug}/) — ${thaiDate(p.date)}${tag}: ${clip(p.excerpt, 180)}`)
  }
  lines.push('')

  lines.push('## หน้าอื่น')
  lines.push('')
  lines.push(
    `- [ตารางราคาเกมทุกภาค](${SITE_URL}/prices/)${gamePrices?.updated ? ` — อัปเดต ${thaiDate(gamePrices.updated)}` : ''}`,
  )
  lines.push(`- [แจ้งบั๊กม็อดแปลไทย](${SITE_URL}/report/)`)
  lines.push(`- [สนับสนุนผู้จัดทำ](${SITE_URL}/support/)`)
  lines.push(`- [นโยบายความเป็นส่วนตัว](${SITE_URL}/privacy/)`)
  lines.push('')

  lines.push('## Optional')
  lines.push('')
  lines.push(`- [เนื้อหาเต็มทั้งเว็บในไฟล์เดียว](${SITE_URL}/llms-full.txt)`)
  lines.push(`- [ฟีด RSS ของข่าว](${SITE_URL}/feed.xml)`)
  lines.push(`- [แผนผังเว็บ (sitemap.xml)](${SITE_URL}/sitemap.xml)`)

  return lines.join('\n') + '\n'
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
