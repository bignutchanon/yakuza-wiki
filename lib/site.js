// ค่าคงที่ + ตัวช่วยสร้าง metadata ของเว็บ — ใช้ร่วมกันทุกหน้า

export const SITE_URL = 'https://yakuzathai.com'
export const SITE_NAME = 'Yakuza Wiki ภาษาไทย'
export const DEFAULT_DESCRIPTION =
  'วิกิภาษาไทยของซีรีส์ Yakuza / Like a Dragon ทำโดยแฟนเกม สรุปเนื้อเรื่องรายบท ไกด์ substories บทความ lore ข่าวสาร ตารางราคา และลิงก์ดาวน์โหลดม็อดแปลไทยครบทุกภาค'

// สร้าง Metadata object สำหรับ generateMetadata/export const metadata ของแต่ละหน้า
// title ว่าง → ใช้ชื่อเว็บอย่างเดียว (หน้าแรก)
export function pageMeta({ title, description, path: pagePath, image }) {
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
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
    },
  }
}
