import type { Metadata } from 'next'

// ค่าคงที่ + ตัวช่วยสร้าง metadata ของเว็บ — ใช้ร่วมกันทุกหน้า

export const SITE_URL = 'https://yakuzathai.com'
export const SITE_NAME = 'Yakuza Wiki ภาษาไทย'
// รูป OG/Twitter card ค่าเริ่มต้น (หน้าแรก + หน้าที่ไม่ระบุ image เอง) — public/og.jpg 1200×630
export const DEFAULT_OG_IMAGE = '/og.jpg'
// ปลายทางฟอร์มแจ้งบั๊กในหน้า /report/ = Google Apps Script Web App (ดูวิธีติดตั้งใน scripts/report-form.gs)
// ว่าง = ยังไม่ได้ deploy → ฟอร์มจะขึ้นข้อความว่ายังไม่เปิดใช้งานและกดส่งไม่ได้
export const REPORT_ENDPOINT: string =
  'https://script.google.com/macros/s/AKfycbw_zzD9w1-R_hR5DAvvW3J2Q6aSUXdeSSqfDNunFpopNKlyHSbK9HFIJ_Tu37WdJG_6fQ/exec'

export const DEFAULT_DESCRIPTION =
  'วิกิภาษาไทยของซีรีส์ Yakuza / Like a Dragon ทำโดยแฟนเกม สรุปเนื้อเรื่องรายบท ไกด์ substories บทความ lore ข่าวสาร ตารางราคา และลิงก์ดาวน์โหลดม็อดแปลไทยครบทุกภาค'

export interface PageMetaOptions {
  title: string
  description?: string
  path: string
  image?: string
}

// สร้าง Metadata object สำหรับ generateMetadata/export const metadata ของแต่ละหน้า
// title ว่าง → ใช้ชื่อเว็บอย่างเดียว (หน้าแรก)
export function pageMeta({ title, description, path: pagePath, image }: PageMetaOptions): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME

  return {
    title: fullTitle,
    description,
    alternates: { canonical: pagePath },
    openGraph: {
      title: fullTitle,
      description,
      url: pagePath,
      siteName: SITE_NAME,
      locale: 'th_TH',
      type: 'website',
      images: [image ?? DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}
