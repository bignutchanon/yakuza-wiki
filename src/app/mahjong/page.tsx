import type { Metadata } from 'next'
import VIDEO from '@/data/videos/mahjong-basics.json'
import { guideBySlug } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import { articleJsonLd, breadcrumbJsonLd, videoObjectJsonLd } from '@/lib/seo'
import { expandTiles } from '@/lib/mahjongTiles'
import Byline from '@/components/Byline'
import JsonLd from '@/components/JsonLd'
import Markdown from '@/components/Markdown'
import TutorialVideo from '@/components/TutorialVideo'

function requiredGuide() {
  const found = guideBySlug('mahjong')
  if (!found) throw new Error('ไม่พบ src/content/guides/mahjong.md')
  return found
}
const guide = requiredGuide()
const pagePath = '/mahjong/'
const title = 'วิธีเล่นมาจองญี่ปุ่นในซีรีส์ Yakuza'

export const metadata: Metadata = pageMeta({
  title: 'วิธีเล่นมาจอง Yakuza: สอนกติกามาจองญี่ปุ่นฉบับมือใหม่ (มีวิดีโอ)',
  description: guide.excerpt,
  path: pagePath,
  type: 'article',
  publishedTime: guide.date,
  image: { url: VIDEO.poster, width: VIDEO.posterWidth, height: VIDEO.posterHeight },
})

export default function MahjongPage() {
  return (
    <div className="page">
      <JsonLd data={[
        articleJsonLd({ headline: title, description: guide.excerpt, path: pagePath, image: VIDEO.poster, datePublished: guide.date, section: 'ไกด์มินิเกม' }),
        breadcrumbJsonLd([{ name: 'วิธีเล่นมาจอง', path: pagePath }]),
        videoObjectJsonLd({ name: 'วิธีเล่นมาจองญี่ปุ่นใน Yakuza', description: guide.excerpt, path: pagePath, contentUrl: VIDEO.src, thumbnailUrl: VIDEO.poster, uploadDate: guide.date, duration: VIDEO.duration }),
      ]} />
      <div className="eyebrow">ไกด์มินิเกม</div>
      <h1 className="game-title">{title}</h1>
      <Byline date={guide.date} note="อ้างอิงกติกามาจองญี่ปุ่นมาตรฐาน (แหล่งท้ายบทความ)" />
      <TutorialVideo video={VIDEO} title={title} />
      <Markdown text={expandTiles(guide.body, 'html')} />
    </div>
  )
}
