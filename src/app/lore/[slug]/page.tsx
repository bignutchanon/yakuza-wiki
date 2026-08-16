import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loreArticles, loreBySlug } from '@/lib/content'
import { pageMeta } from '@/lib/site'
import Markdown from '@/components/Markdown'

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
  return pageMeta({
    title: article?.title ?? 'Lore',
    description: article
      ? `บทความ lore ในจักรวาล Yakuza / Like a Dragon: ${article.title}`
      : undefined,
    path: `/lore/${slug}/`,
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

  return (
    <div className="page">
      <div className="eyebrow">
        <Link href="/lore">Lore — เรื่องราวเบื้องหลัง</Link>
      </div>
      <h1 className="game-title">{article.title}</h1>
      <Markdown text={article.body} />
    </div>
  )
}
