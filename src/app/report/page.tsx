import type { Metadata } from 'next'
import Link from 'next/link'
import { GAMES } from '@/data/games'
import { pageMeta } from '@/lib/site'
import ReportForm, { type ReportFormGame } from '@/components/ReportForm'

export const metadata: Metadata = pageMeta({
  title: 'แจ้งบั๊กม็อดแปลไทย',
  description: 'ฟอร์มแจ้งบั๊ก คำแปลผิด หรือปัญหาการติดตั้งของม็อดแปลไทยทุกภาค แนบภาพหน้าจอและไฟล์เซฟได้',
  path: '/report/',
})

// หน้าแจ้งบั๊ก — ฟอร์มเป็น client component ที่ยิงไป Google Apps Script (ดู scripts/report-form.gs)
export default function ReportPage() {
  // ส่งเฉพาะภาคที่มีม็อดให้โหลดจริง (รวมภาคที่ยังทำอยู่) เรียงตามลิสต์หลัก
  const games: ReportFormGame[] = GAMES.filter((g) => g.mod.status !== 'none').map((g) => ({
    id: g.id,
    title: g.title,
  }))

  return (
    <div className="page">
      <div className="eyebrow">Bug report</div>
      <h1 className="game-title">แจ้งบั๊กม็อดแปลไทย</h1>
      <p className="game-sub">เจอเกมเด้ง ตัวหนังสือเพี้ยน หรือคำแปลผิด — บอกมาได้เลย</p>

      <p>
        รายงานทุกใบเข้าไปอยู่ในตารางเดียวกันที่ผู้จัดทำไล่เช็คก่อนออกตัวแก้ทุกครั้ง
        สิ่งที่ช่วยได้มากที่สุดคือ <strong>บท/ฉากที่เจอ</strong> กับ <strong>ภาพหน้าจอ</strong>
        เพราะบั๊กหลายตัวเกิดเฉพาะบางจอเท่านั้น ถ้ามีไฟล์เซฟตรงจุดนั้นด้วยยิ่งดี
      </p>

      <ReportForm games={games} />

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1.6rem' }}>
        ข้อมูลที่ส่งมาถูกเก็บในตารางส่วนตัวของผู้จัดทำเพื่อใช้ตามแก้บั๊กเท่านั้น ไม่เปิดเผยต่อสาธารณะและไม่ส่งต่อให้ใคร
        รายละเอียดอยู่ในหน้า <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link> · อยากสนับสนุนผู้จัดทำดูได้ที่หน้า{' '}
        <Link href="/support">สนับสนุน</Link>
      </p>
    </div>
  )
}
