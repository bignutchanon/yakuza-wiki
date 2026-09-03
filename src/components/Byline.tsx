import Link from 'next/link'
import { AUTHOR_NAME } from '@/lib/site'
import { thaiDate } from '@/lib/format'

interface BylineProps {
  /** ISO date ของบทความ — ไม่ใส่ = ไม่โชว์วันที่ (หน้าที่ไม่มีวันเผยแพร่ชัดเจน เช่น สรุปเนื้อเรื่องรายบท) */
  date?: string
  /** ข้อความต่อท้ายสั้น ๆ เช่น ที่มาของเนื้อหาในหน้านั้น */
  note?: string
}

// บรรทัดผู้เขียน — ทุกบทความต้องบอกได้ว่าใครเขียนและตรวจสอบตัวตนได้ที่ไหน
export default function Byline({ date, note }: BylineProps) {
  return (
    <p className="byline">
      เขียนโดย <Link href="/about">{AUTHOR_NAME}</Link>
      {date && <> · {thaiDate(date)}</>}
      {note && <> · {note}</>}
    </p>
  )
}
