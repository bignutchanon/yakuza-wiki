import { GAMES } from '@/data/games'
import { contentFor, loreArticles, newsPosts } from '@/lib/content'
import { thaiDate } from '@/lib/format'
import { SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/site'

// Route Handler แบบ static ตามสเปก llmstxt.org — build ครั้งเดียวตอน export ไม่ใช่ dynamic ต่อ request
export const dynamic = 'force-static'

// ข้อความสถานะม็อดแปลไทยต่อท้ายบรรทัดภาค — none ไม่ต้องมีข้อความ
function modStatusText(status: string): string | null {
  if (status === 'released') return 'มีม็อดแปลไทย'
  if (status === 'wip') return 'ม็อดแปลกำลังทำ'
  return null
}

function buildLlmsTxt(): string {
  const lines: string[] = []

  lines.push('# Yakuza Wiki ภาษาไทย')
  lines.push('')
  lines.push(
    `> ${DEFAULT_DESCRIPTION} เว็บนี้ทำโดยแฟนเกม ไม่มีส่วนเกี่ยวข้องกับ SEGA หรือ Ryu Ga Gotoku Studio แต่อย่างใด`,
  )
  lines.push('')

  // ภาคเกม — แต่ละภาคพร้อมลิงก์บททั้งหมด + substories/guide ถ้ามี
  lines.push('## ภาคเกม')
  lines.push('')
  for (const g of GAMES) {
    const { chapters, substories, guide } = contentFor(g.id)
    const statusText = modStatusText(g.mod.status)
    const suffix = statusText ? ` — ${statusText}` : ''
    lines.push(`- [${g.title}](${SITE_URL}/game/${g.id}/): ${g.subtitle} (${g.releaseYear})${suffix}`)
    for (const ch of chapters) {
      const label = ch.thai ? `บทที่ ${ch.n} — ${ch.title} / ${ch.thai}` : `บทที่ ${ch.n} — ${ch.title}`
      lines.push(`  - [${label}](${SITE_URL}/game/${g.id}/ch/${ch.n}/)`)
    }
    if (substories) {
      lines.push(`  - [เควสเสริม (Substories)](${SITE_URL}/game/${g.id}/substories/)`)
    }
    if (guide) {
      lines.push(`  - [${guide.meta.title || 'ไกด์เสริม'}](${SITE_URL}/game/${g.id}/guide/)`)
    }
  }
  lines.push('')

  // Lore — บทความเสริม (ไทม์ไลน์/ตัวละคร/องค์กร/สถานที่/รอยสัก)
  lines.push('## Lore')
  lines.push('')
  for (const l of loreArticles) {
    lines.push(`- [${l.title}](${SITE_URL}/lore/${l.slug}/)`)
  }
  lines.push('')

  // ข่าวสาร — ทุกโพสต์อยู่หน้าเดียว (/news/) ไม่มี slug แยก จึงลิงก์ URL เดียวกันทุกบรรทัด
  lines.push('## ข่าวสาร')
  lines.push('')
  for (const p of newsPosts) {
    lines.push(`- [${p.title}](${SITE_URL}/news/) — ${thaiDate(p.date)}`)
  }
  lines.push('')

  lines.push('## หน้าอื่น')
  lines.push('')
  lines.push(`- [ตารางราคาเกมทุกภาค](${SITE_URL}/prices/)`)
  lines.push(`- [สนับสนุนผู้จัดทำ](${SITE_URL}/support/)`)
  lines.push(`- [นโยบายความเป็นส่วนตัว](${SITE_URL}/privacy/)`)

  return lines.join('\n') + '\n'
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
