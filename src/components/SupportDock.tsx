'use client'

import Link from 'next/link'
import { useDockState } from '@/lib/dock'

// แผงลอย "สนับสนุนผู้แปล" ฝั่งซ้าย (หน้าแรก + หน้าเกม) คู่กับแผง Shopee ฝั่งขวา — 24 ต.ค. 2026 เจ้าของสั่ง
// ใช้กรอบ/ปุ่มชุดเดียวกับ <ShopeeDock> (คลาส .shop-*) + .is-support ย้ายไปซ้าย · จอแคบ/มือถือ/กด × = ปุ่มมุมซ้ายล่าง
// รูป QR = promptpay-qr-small.png ตัวเดียวกับที่ฝังในเพจ Nexus (ชื่อบัญชีจริงในรูป เจ้าของอนุญาต — เป็น QR รับเงิน)
// วางไว้ท้าย .page ให้ลำดับ Tab เข้าเนื้อหาก่อน
export default function SupportDock() {
  const [state, pick] = useDockState('supportDock')

  return (
    <div className="shop-dock is-support" data-state={state}>
      <aside className="shop" aria-label="สนับสนุนผู้แปล">
        <div className="shop-head">
          <p className="shop-title">สนับสนุนผู้แปล</p>
          <button type="button" className="shop-close" onClick={() => pick('closed')} aria-label="ปิดแผงสนับสนุนผู้แปล">
            ×
          </button>
        </div>
        <div className="shop-body">
          <p className="support-dock-text">
            ม็อดแปลไทยทุกภาคแจกฟรี ถ้าอยากเลี้ยงกาแฟคนแปล สแกน QR พร้อมเพย์ได้เลย — รับเงินได้จากทุกธนาคาร
          </p>
          <img
            className="support-dock-qr"
            src="/promptpay-qr-small.png"
            alt="QR พร้อมเพย์ (Thai QR Payment) สำหรับสนับสนุนผู้แปล"
            width={380}
            height={586}
            loading="lazy"
          />
          <Link className="support-dock-more" href="/support">
            เงินสนับสนุนเอาไปใช้ทำอะไร →
          </Link>
        </div>
      </aside>
      <button type="button" className="shop-fab" onClick={() => pick('open')}>
        สนับสนุนผู้แปล
      </button>
    </div>
  )
}
