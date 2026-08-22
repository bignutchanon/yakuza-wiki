import type { MetadataRoute } from 'next'
import { GAMES } from '@/data/games'
import { contentFor, loreArticles, newsPosts, gamePrices } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

// สร้างตอน build ครั้งเดียว (static export ไม่มี request-time data) → out/sitemap.xml
export const dynamic = 'force-static'

// lastModified ใส่เฉพาะหน้าที่รู้วันที่จริงจากเนื้อหา (frontmatter ข่าว/ราคา, mod.updated ของแต่ละภาค)
// ห้ามใช้ mtime ของไฟล์: CI เช็คเอาต์ใหม่ทุกครั้ง ไฟล์ทุกไฟล์จะได้เวลาเดียวกันหมด = สัญญาณเท็จ
const at = (iso?: string): Date | undefined => {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const entry = (url: string, lastModified?: Date): MetadataRoute.Sitemap[number] =>
  lastModified ? { url, lastModified } : { url }

export default function sitemap(): MetadataRoute.Sitemap {
  // หน้าแรก/สารบัญข่าว = วันที่โพสต์ข่าวล่าสุด (newsPosts เรียงใหม่ → เก่าอยู่แล้ว)
  const latestNews = at(newsPosts[0]?.date)

  const entries: MetadataRoute.Sitemap = [
    entry(`${SITE_URL}/`, latestNews),
    entry(`${SITE_URL}/news/`, latestNews),
    entry(`${SITE_URL}/prices/`, at(gamePrices?.updated)),
    entry(`${SITE_URL}/lore/`),
    entry(`${SITE_URL}/support/`),
    entry(`${SITE_URL}/report/`),
    entry(`${SITE_URL}/privacy/`),
  ]

  for (const post of newsPosts) {
    entries.push(entry(`${SITE_URL}/news/${post.slug}/`, at(post.date)))
  }

  for (const article of loreArticles) {
    entries.push(entry(`${SITE_URL}/lore/${article.slug}/`))
  }

  for (const g of GAMES) {
    // หน้าเกมเปลี่ยนจริงเมื่อม็อดออกเวอร์ชันใหม่ (ปุ่มดาวน์โหลด/หมายเหตุเวอร์ชัน) จึงใช้ mod.updated เป็น lastmod
    entries.push(entry(`${SITE_URL}/game/${g.id}/`, at(g.mod.updated ?? g.mod.beta?.updated)))
    const { chapters, substories, guide } = contentFor(g.id)
    for (const ch of chapters) {
      entries.push(entry(`${SITE_URL}/game/${g.id}/ch/${ch.n}/`))
    }
    if (substories) entries.push(entry(`${SITE_URL}/game/${g.id}/substories/`))
    if (guide) entries.push(entry(`${SITE_URL}/game/${g.id}/guide/`))
  }

  return entries
}
