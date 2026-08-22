import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loreArticles, loreBySlug } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import Markdown from '@/components/Markdown'
import JsonLd from '@/components/JsonLd'

// เพจ lore ทั้งหมดรู้ล่วงหน้าตอน build จาก loreArticles — slug นอกลิสต์นี้ = 404 (ไม่ generate เพิ่มตอน request)
export const dynamicParams = false

export function generateStaticParams() {
  return loreArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = loreBySlug(slug)
  if (!article) return {}

  // คำโปรยมาจากย่อหน้าแรกของบทความจริง — เดิมทุกหน้าใช้ประโยคเทมเพลตเดียวกันหมด
  return pageMeta({
    title: article.title,
    description: article.excerpt,
    path: `/lore/${slug}/`,
    type: 'article',
  })
}

export default async function LoreArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = loreBySlug(slug)
  if (!article) notFound()

  const path = `/lore/${slug}/`

  return (
    <div className="page">
      <JsonLd
        data={[
          articleJsonLd({
            headline: article.title,
            description: article.excerpt,
            path,
            section: 'Lore',
          }),
          breadcrumbJsonLd([
            { name: 'Lore', path: '/lore/' },
            { name: article.title, path },
          ]),
        ]}
      />

      <div className="eyebrow">
        <Link href="/lore">Lore — เรื่องราวเบื้องหลัง</Link>
      </div>
      <h1 className="game-title">{article.title}</h1>
      <Markdown text={article.body} />
    </div>
  )
}
