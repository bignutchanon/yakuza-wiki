'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useDockState } from '@/lib/dock'

// แผงลอยของ <ShopeeBox> — การ์ด (children) ยัง render ฝั่ง server อยู่ใน HTML ตามเดิม ไฟล์นี้ถือแค่สถานะเปิด/ปิด + แท็บหมวดที่เลือก
// สถานะเปิด/ปิด + การจำค่าที่ผู้อ่านกด × อยู่ใน useDockState (src/lib/dock.ts) ใช้ร่วมกับ <SupportDock>

// หนึ่งหมวด = หนึ่งแท็บ · list = รายการการ์ดที่ <ShopeeBox> render ฝั่ง server มาแล้ว
export interface ShopeeLine {
  group: string
  mark: string
  label: string
  list: ReactNode
}

// ป้าย "ลิงก์ affiliate" ท้ายหัวแผงคือจุดเดียวบนหน้าที่บอกผู้อ่านว่าเว็บได้ค่าคอมจากลิงก์นี้ (ห้ามถอด)
// หัวแผงไม่ใช่ <h2>/<h3> เพื่อไม่ให้แทรกในโครงหัวข้อของหน้า
// แท็บหมวด: การ์ดทุกหมวดอยู่ใน HTML ครบ หมวดที่ไม่ได้เลือกแค่ซ่อนด้วย hidden · children = บรรทัดท้ายแผง (ที่มาของราคา)
export default function ShopeeDock({ lines, children }: { lines: ShopeeLine[]; children: ReactNode }) {
  const [state, pick] = useDockState('shopDock')
  const [tab, setTab] = useState(lines[0]?.group)
  const body = useRef<HTMLDivElement>(null)

  // เปลี่ยนหมวดแล้วเริ่มดูจากบนสุด ไม่ค้างกลางรายการตามตำแหน่งเลื่อนของหมวดเดิม
  const show = (group: string) => {
    setTab(group)
    body.current?.scrollTo(0, 0)
  }

  return (
    <div className="shop-dock" data-state={state}>
      <aside className="shop" aria-label="สินค้าบน Shopee (ลิงก์ affiliate)">
        <div className="shop-head">
          <p className="shop-title">
            ช้อป <span className="shop-brand">Shopee</span> ผ่านลิงก์นี้ <span className="shop-tag">ลิงก์ affiliate</span>
          </p>
          <button type="button" className="shop-close" onClick={() => pick('closed')} aria-label="ปิดแถบสินค้า Shopee">
            ×
          </button>
        </div>
        <div className="shop-tabs" role="group" aria-label="หมวดสินค้า">
          {lines.map((line) => (
            <button
              key={line.group}
              type="button"
              className="shop-tab"
              aria-pressed={tab === line.group}
              onClick={() => show(line.group)}
            >
              <span className="shop-mark" aria-hidden="true">
                {line.mark}
              </span>
              {line.label}
            </button>
          ))}
        </div>
        <div className="shop-body" ref={body}>
          {lines.map((line) => (
            <section key={line.group} aria-label={line.label} hidden={tab !== line.group}>
              {line.list}
            </section>
          ))}
          {children}
        </div>
      </aside>
      <button type="button" className="shop-fab" onClick={() => pick('open')}>
        ช้อป <span className="shop-brand">Shopee</span>
      </button>
    </div>
  )
}
