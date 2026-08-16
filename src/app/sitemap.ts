import type { MetadataRoute } from 'next'
import { GAMES } from '@/data/games'
import { contentFor, loreArticles, newsPosts } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

// สร้างตอน build ครั้งเดียว (static export ไม่มี request-time data) → out/sitemap.xml
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  // lastModified ของหน้าแรก/ข่าว = วันที่โพสต์ข่าวล่าสุด (newsPosts เรียงใหม่ → เก่าอยู่แล้ว) หน้าอื่นไม่ระบุ
  const latestNews = newsPosts[0] ? new Date(newsPosts[0].date) : undefined

  const home: MetadataRoute.Sitemap[number] = { url: `${SITE_URL}/` }
  const news: MetadataRoute.Sitemap[number] = { url: `${SITE_URL}/news/` }
  if (latestNews) {
    home.lastModified = latestNews
    news.lastModified = latestNews
  }

  const entries: MetadataRoute.Sitemap = [
    home,
    news,
    { url: `${SITE_URL}/prices/` },
    { url: `${SITE_URL}/lore/` },
    { url: `${SITE_URL}/support/` },
    { url: `${SITE_URL}/privacy/` },
  ]

  for (const article of loreArticles) {
    entries.push({ url: `${SITE_URL}/lore/${article.slug}/` })
  }

  for (const g of GAMES) {
    entries.push({ url: `${SITE_URL}/game/${g.id}/` })
    const { chapters, substories, guide } = contentFor(g.id)
    for (const ch of chapters) {
      entries.push({ url: `${SITE_URL}/game/${g.id}/ch/${ch.n}/` })
    }
    if (substories) entries.push({ url: `${SITE_URL}/game/${g.id}/substories/` })
    if (guide) entries.push({ url: `${SITE_URL}/game/${g.id}/guide/` })
  }

  return entries
}
