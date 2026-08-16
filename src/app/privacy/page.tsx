import type { Metadata } from 'next'
import { pageMeta } from '@/lib/site'
import Markdown from '@/components/Markdown'
import CookieResetButton from '@/components/CookieResetButton'

// นโยบายความเป็นส่วนตัว + คุกกี้ — จำเป็นตามนโยบายโปรแกรม Google AdSense
// ปุ่มท้ายหน้าใช้ล้างตัวเลือกคุกกี้ (localStorage) เพื่อให้แบนเนอร์ถามใหม่ — แยกเป็น <CookieResetButton> (client)

const BODY = `
เว็บนี้เป็น wiki ภาษาไทยของซีรีส์ Yakuza / Like a Dragon จัดทำโดยแฟนเกม ไม่มีระบบสมัครสมาชิก
ไม่มีการเก็บชื่อ อีเมล หรือข้อมูลส่วนตัวใด ๆ จากผู้เข้าชมโดยตรง

## ข้อมูลที่เกิดขึ้นตอนเข้าชมเว็บ

- **โฮสติ้ง (GitHub Pages)** — เว็บนี้ให้บริการผ่าน GitHub Pages ซึ่งอาจบันทึก IP address
  ของผู้เข้าชมตามมาตรฐานของผู้ให้บริการ ดูรายละเอียดได้ที่
  [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement)
- **ฟอนต์ (Google Fonts)** — เบราว์เซอร์ของคุณโหลดฟอนต์จากเซิร์ฟเวอร์ Google
  ซึ่ง Google อาจเห็น IP address ของคุณตอนโหลด
- **โฆษณา (Google AdSense)** — ดูหัวข้อคุกกี้ด้านล่าง

## คุกกี้และโฆษณา

เว็บนี้แสดงโฆษณาผ่าน **Google AdSense** ซึ่งใช้คุกกี้เพื่อ:

- แสดงโฆษณาตามความสนใจ อิงจากการเข้าชมเว็บนี้และเว็บอื่น ๆ (personalized ads)
- นับจำนวนการแสดงผลและป้องกันการคลิกซ้ำผิดปกติ

Google และพาร์ตเนอร์ใช้คุกกี้โฆษณา (เช่นคุกกี้ DoubleClick) ตามนโยบายของ Google
อ่านวิธีที่ Google ใช้ข้อมูลได้ที่
[policies.google.com/technologies/partner-sites](https://policies.google.com/technologies/partner-sites)

## ตัวเลือกของคุณ

- **แบนเนอร์คุกกี้ของเว็บนี้** — เลือก "เฉพาะที่จำเป็น" เว็บจะขอโฆษณาแบบไม่อิงตัวตน
  (non-personalized) แทน เปลี่ยนใจเมื่อไหร่กดปุ่มท้ายหน้านี้เพื่อเลือกใหม่ได้
- **ปิดโฆษณาตามความสนใจฝั่ง Google** — ตั้งค่าได้ที่
  [adssettings.google.com](https://adssettings.google.com)
- **เลือกไม่รับจากผู้ให้บริการรายอื่น** — [aboutads.info/choices](https://www.aboutads.info/choices)
- **ลบ/บล็อกคุกกี้ทั้งหมด** — ทำได้จากการตั้งค่าเบราว์เซอร์ของคุณโดยตรง

ผู้เข้าชมจากเขตเศรษฐกิจยุโรป (EEA) และสหราชอาณาจักรจะเห็นหน้าขอความยินยอม
(consent) ของ Google ก่อนแสดงโฆษณา ตามข้อกำหนด GDPR

## ติดต่อ

คำถามเกี่ยวกับนโยบายนี้ ติดต่อผู้จัดทำได้ที่ nuthappy2549@gmail.com

_อัปเดตล่าสุด: 14 ส.ค. 2026_
`

export const metadata: Metadata = pageMeta({
  title: 'นโยบายความเป็นส่วนตัว',
  description: 'นโยบายความเป็นส่วนตัวและการใช้คุกกี้ของเว็บ Yakuza Wiki ภาษาไทย (Google AdSense)',
  path: '/privacy/',
})

export default function PrivacyPage() {
  return (
    <div className="page">
      <div className="eyebrow">Privacy</div>
      <h1 className="game-title">นโยบายความเป็นส่วนตัวและคุกกี้</h1>
      <Markdown text={BODY} />
      <CookieResetButton />
    </div>
  )
}
