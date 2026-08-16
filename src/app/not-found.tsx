import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

// หน้า 404 — static export ของ Next จะสร้าง out/404.html จากไฟล์นี้โดยอัตโนมัติ
export const metadata: Metadata = {
  title: `ไม่พบหน้านี้ — ${SITE_NAME}`,
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="page">
      <h1>ไม่พบหน้านี้</h1>
      <p>
        ลิงก์นี้อาจย้ายที่ไปแล้วหรือไม่มีอยู่จริง — <Link href="/">กลับหน้าแรก</Link>
      </p>
    </div>
  )
}
