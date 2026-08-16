import type { Metadata } from 'next'
import { pageMeta } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'สนับสนุนผู้จัดทำ',
  description: 'ม็อดแปลไทยทุกภาคแจกฟรี — ช่องทางสนับสนุนผู้จัดทำผ่าน PromptPay',
  path: '/support/',
})

// หน้าสนับสนุนผู้จัดทำ — QR PromptPay อยู่ที่ public/promptpay-qr.png
export default function SupportPage() {
  return (
    <div className="page">
      <div className="eyebrow">Support</div>
      <h1 className="game-title">สนับสนุนผู้จัดทำ</h1>
      <p className="game-sub">
        ม็อดแปลไทยทุกภาคแจกฟรี — ถ้าอยากเลี้ยงกาแฟให้คนแปล สแกน QR ด้านล่างได้เลย
      </p>

      <div className="support-card">
        <img src="/promptpay-qr.png" alt="Thai QR Payment — PromptPay" className="qr-img" />
        <div className="support-info">
          <div className="support-label">Thai QR Payment (PromptPay)</div>
          <div className="support-name">นาย ชานน แสงพัฒน์</div>
          <div className="support-acct">xxx-x-x5185-x · รับเงินได้จากทุกธนาคาร</div>
        </div>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
        ยอดสนับสนุนทั้งหมดใช้เป็นกำลังใจและค่าเวลาในการทำม็อดแปลไทยภาคต่อ ๆ ไป
        ไม่มีผลต่อการเข้าถึงม็อด — ทุกอย่างยังแจกฟรีเหมือนเดิม
      </p>
    </div>
  )
}
