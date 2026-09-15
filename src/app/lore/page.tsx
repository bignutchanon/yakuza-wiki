import type { Metadata } from 'next'
import Link from 'next/link'
import { loreArticles } from '@/lib/content'
import { pageMeta, clip } from '@/lib/site'
import { breadcrumbJsonLd } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = pageMeta({
  title: 'Lore — เรื่องราวเบื้องหลัง',
  description: 'ไทม์ไลน์ ตัวละคร องค์กร สถานที่ และรอยสัก — บริบทเบื้องหลังจักรวาล Yakuza / Like a Dragon',
  path: '/lore/',
})

export default function LorePage() {
  return (
    <div className="page">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Lore', path: '/lore/' }])} />

      <div className="eyebrow">Lore</div>
      <h1 className="game-title">เรื่องราวเบื้องหลังซีรีส์</h1>
      <p className="game-sub">
        ไทม์ไลน์ องค์กร ตัวละคร และสถานที่ — บริบทที่ทำให้โลกของ Yakuza กลมขึ้น
      </p>
      <div className="article">
        <p>
          ซีรีส์ Yakuza / Like a Dragon เล่าเรื่องต่อเนื่องกันมากว่า 35 ปีในเนื้อเรื่อง ตัวละครจากภาคแรก ๆ
          ยังกลับมามีบทบาทในภาคหลัง และหลายเหตุการณ์จะเข้าใจเต็มที่ก็ต่อเมื่อรู้ว่าเกิดอะไรขึ้นมาก่อน
          หมวดนี้จึงรวบรวมบริบทที่สรุปรายบทของแต่ละภาคไม่มีที่ให้เล่า ทั้งลำดับเหตุการณ์ของทั้งซีรีส์
          โครงสร้างของตระกูลยากูซ่า ประวัติตัวละครที่ข้ามหลายภาค เมืองต้นแบบในชีวิตจริง และความหมายของรอยสัก
        </p>
        <p>
          ถ้าเพิ่งเริ่มตามซีรีส์ แนะนำให้อ่าน<Link href="/lore/timeline">ไทม์ไลน์</Link>ก่อน
          เพื่อดูว่าแต่ละภาคอยู่ช่วงไหนและควรเล่นเรียงอย่างไร จากนั้นค่อยอ่าน<Link href="/lore/organizations">องค์กรและตระกูล</Link>
          ที่ช่วยให้ตามชื่อตระกูลในเนื้อเรื่องทัน ส่วนเนื้อเรื่องละเอียดของแต่ละภาคอ่านได้จากหน้าเกมในเมนูด้านบน
          บทความในหมวดนี้มีการเปิดเผยเนื้อเรื่องของหลายภาค
        </p>
      </div>
      {loreArticles.length ? (
        <ul className="chapter-list lore-list">
          {loreArticles.map((a) => (
            <li key={a.slug}>
              <Link href={`/lore/${a.slug}`}>
                <span>{a.title}</span>
                <span className="lore-desc">{clip(a.excerpt, 110)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}
    </div>
  )
}
