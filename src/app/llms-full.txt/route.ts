import { GAMES } from '@/data/games'
import { contentFor, loreArticles, newsPosts, gamePrices } from '@/lib/content'
import { thaiDate } from '@/lib/format'
import { SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/site'

// เนื้อหาทั้งเว็บในไฟล์เดียว (ตามธรรมเนียม llms-full.txt ของ llmstxt.org)
// ใช้เมื่อผู้ช่วย AI อยากอ่านทีเดียวจบแทนการไล่เปิดทีละหน้า — ทุกส่วนมี URL ของหน้าจริงกำกับไว้ให้อ้างอิงกลับได้
export const dynamic = 'force-static'

function buildLlmsFull(): string {
  const out: string[] = []
  const push = (...lines: string[]) => out.push(...lines)

  push('# Yakuza Wiki ภาษาไทย — เนื้อหาทั้งเว็บ', '')
  push(`> ${DEFAULT_DESCRIPTION}`, '')
  push(
    'เว็บนี้ทำโดยแฟนเกมชาวไทย ไม่มีส่วนเกี่ยวข้องกับ SEGA หรือ Ryu Ga Gotoku Studio',
    'ภาพประกอบทั้งหมด © SEGA · ข้อความสรุปเนื้อเรื่องเขียนขึ้นเองโดยผู้จัดทำเว็บ',
    `สารบัญแบบย่ออยู่ที่ ${SITE_URL}/llms.txt`,
    '',
  )

  for (const g of GAMES) {
    const { chapters, substories, guide } = contentFor(g.id)
    push(`# ${g.title}`, '', `แหล่งที่มา: ${SITE_URL}/game/${g.id}/`, '')
    push(
      `${g.subtitle} · เหตุการณ์ในเรื่องปี ${g.year} · วางจำหน่าย ${g.releaseYear}`,
      `ตัวเอก: ${g.protagonists.join(', ')} · ฉาก: ${g.setting}`,
      '',
      g.blurb,
      '',
    )

    for (const ch of chapters) {
      const heading = ch.thai ? `${ch.title} / ${ch.thai}` : ch.title
      push(
        `## ${g.title} — บทที่ ${ch.n}: ${heading}`,
        '',
        `แหล่งที่มา: ${SITE_URL}/game/${g.id}/ch/${ch.n}/`,
        '',
        ch.body.trim(),
        '',
      )
    }
    if (substories) {
      push(
        `## ${g.title} — เควสเสริม (Substories)`,
        '',
        `แหล่งที่มา: ${SITE_URL}/game/${g.id}/substories/`,
        '',
        substories.body.trim(),
        '',
      )
    }
    if (guide) {
      push(
        `## ${g.title} — ${guide.meta.title || 'ไกด์เสริม'}`,
        '',
        `แหล่งที่มา: ${SITE_URL}/game/${g.id}/guide/`,
        '',
        guide.body.trim(),
        '',
      )
    }
  }

  push('# Lore — เรื่องราวเบื้องหลังซีรีส์', '')
  for (const l of loreArticles) {
    push(`## ${l.title}`, '', `แหล่งที่มา: ${SITE_URL}/lore/${l.slug}/`, '', l.body.trim(), '')
  }

  push('# ข่าวสารและอัปเดตม็อดแปลไทย', '')
  for (const p of newsPosts) {
    push(
      `## ${p.title}`,
      '',
      `วันที่ ${thaiDate(p.date)}${p.tag ? ` · หมวด ${p.tag}` : ''} · แหล่งที่มา: ${SITE_URL}/news/${p.slug}/`,
      '',
      p.body.trim(),
      '',
    )
  }

  if (gamePrices) {
    push(
      '# ตารางราคาเกมทุกภาค',
      '',
      `อัปเดต ${thaiDate(gamePrices.updated)} · แหล่งที่มา: ${SITE_URL}/prices/`,
      '',
      gamePrices.body.trim(),
      '',
    )
  }

  return out.join('\n')
}

export function GET() {
  return new Response(buildLlmsFull(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
