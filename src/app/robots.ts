import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// out/robots.txt — allow ทั้งหมด + ชี้ไปที่ sitemap
// static export ต้องประกาศ force-static ตรง ๆ เหมือน sitemap.ts ไม่งั้น build fail
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
