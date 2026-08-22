import type { Metadata } from 'next'

// ค่าคงที่ + ตัวช่วยสร้าง metadata ของเว็บ — ใช้ร่วมกันทุกหน้า

export const SITE_URL = 'https://yakuzathai.com'
export const SITE_NAME = 'Yakuza Wiki ภาษาไทย'
// รูป OG/Twitter card ค่าเริ่มต้น (หน้าแรก + หน้าที่ไม่ระบุ image เอง) — public/og.jpg 1200×630
export const DEFAULT_OG_IMAGE = '/og.jpg'
export const DEFAULT_OG_SIZE = { width: 1200, height: 630 }
// ปลายทางฟอร์มแจ้งบั๊กในหน้า /report/ = Google Apps Script Web App (ดูวิธีติดตั้งใน scripts/report-form.gs)
// ว่าง = ยังไม่ได้ deploy → ฟอร์มจะขึ้นข้อความว่ายังไม่เปิดใช้งานและกดส่งไม่ได้
export const REPORT_ENDPOINT: string =
  'https://script.google.com/macros/s/AKfycbw_zzD9w1-R_hR5DAvvW3J2Q6aSUXdeSSqfDNunFpopNKlyHSbK9HFIJ_Tu37WdJG_6fQ/exec'

export const DEFAULT_DESCRIPTION =
  'วิกิภาษาไทยของซีรีส์ Yakuza / Like a Dragon ทำโดยแฟนเกม สรุปเนื้อเรื่องรายบท ไกด์ substories บทความ lore ข่าวสาร ตารางราคา และลิงก์ดาวน์โหลดม็อดแปลไทยครบทุกภาค'

// ความยาว meta description ที่เครื่องมือค้นหาตัดทิ้ง — ใช้เป็นเพดานของ clip()
export const DESCRIPTION_MAX = 160

// แปลง path ภายในเป็น URL เต็ม (JSON-LD ต้องใช้ absolute เสมอ ต่างจาก metadata ที่ Next เติม metadataBase ให้)
export const absUrl = (pagePath: string): string =>
  pagePath.startsWith('http') ? pagePath : `${SITE_URL}${pagePath}`

// ตัดข้อความให้พอดี meta description โดยไม่ตัดกลางคำ
// ภาษาไทยไม่เว้นวรรคระหว่างคำ แต่เว้นระหว่างวลี — จึงถอยไปหาช่องว่าง/เครื่องหมายคั่นตัวสุดท้าย
// ถ้าถอยไกลเกิน 25% ของเพดานแล้วยังไม่เจอ ให้ตัดตรง ๆ (ดีกว่าได้ข้อความสั้นกุด)
export function clip(text: string, max: number = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat

  const head = flat.slice(0, max - 1)
  const cut = Math.max(head.lastIndexOf(' '), head.lastIndexOf('—'), head.lastIndexOf('·'), head.lastIndexOf(','))
  const body = cut > max * 0.75 ? head.slice(0, cut) : head
  return `${body.replace(/[\s—·,]+$/, '')}…`
}

// รูป OG ที่รู้ขนาดจริง — ใส่ og:image:width/height ให้ตัวอ่านการ์ดไม่ต้องโหลดรูปก่อนจัดเลย์เอาต์
export interface OgImage {
  url: string
  width: number
  height: number
}

export interface PageMetaOptions {
  title: string
  description?: string
  path: string
  image?: string | OgImage
  /** 'article' สำหรับหน้าที่เป็นบทความจริง (ข่าว/lore/บท) — ค่าเริ่มต้น 'website' */
  type?: 'website' | 'article'
  /** ISO date ของบทความ (เฉพาะ type 'article') */
  publishedTime?: string
  modifiedTime?: string
}

// สร้าง Metadata object สำหรับ generateMetadata/export const metadata ของแต่ละหน้า
// title ว่าง → ใช้ชื่อเว็บอย่างเดียว (หน้าแรก)
export function pageMeta({
  title,
  description,
  path: pagePath,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
}: PageMetaOptions): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const desc = description ? clip(description) : undefined

  // ส่ง image เป็น string = รู้แค่ URL → ไม่ประกาศขนาด (ประกาศผิดแย่กว่าไม่ประกาศ)
  const ogImage: OgImage | { url: string } =
    typeof image === 'string' ? { url: image } : (image ?? { url: DEFAULT_OG_IMAGE, ...DEFAULT_OG_SIZE })

  return {
    title: fullTitle,
    description: desc,
    alternates: {
      canonical: pagePath,
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: pagePath,
      siteName: SITE_NAME,
      locale: 'th_TH',
      ...(type === 'article'
        ? { type: 'article' as const, publishedTime, modifiedTime }
        : { type: 'website' as const }),
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}
