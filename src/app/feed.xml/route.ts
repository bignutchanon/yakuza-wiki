import { newsPosts } from '@/lib/content'
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, clip } from '@/lib/site'

// Route Handler แบบ static เหมือน llms.txt → out/feed.xml (build ครั้งเดียวตอน export)
export const dynamic = 'force-static'

// RSS ต้องใช้วันที่รูปแบบ RFC-822 — toUTCString() ให้ "Fri, 22 Aug 2026 00:00:00 GMT" ซึ่งใช้ได้ตรง ๆ
const rfc822 = (iso: string): string => new Date(iso).toUTCString()

const escapeXml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

function buildFeed(): string {
  // lastBuildDate ผูกกับวันที่โพสต์ล่าสุด ไม่ใช่เวลา build — ไฟล์จะได้ไม่เปลี่ยนทุกครั้งที่ deploy
  const latest = newsPosts[0]?.date

  const items = newsPosts
    .map((p) => {
      const url = `${SITE_URL}/news/${p.slug}/`
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
${p.tag ? `      <category>${escapeXml(p.tag)}</category>\n` : ''}      <description>${escapeXml(clip(p.excerpt, 400))}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — ข่าวสาร</title>
    <link>${SITE_URL}/news/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>th-TH</language>
${latest ? `    <lastBuildDate>${rfc822(latest)}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`
}

export function GET() {
  return new Response(buildFeed(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
