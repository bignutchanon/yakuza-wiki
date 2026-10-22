'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// แผงลอยของ <ShopeeBox> — การ์ด (children) ยัง render ฝั่ง server อยู่ใน HTML ตามเดิม ไฟล์นี้ถือแค่สถานะเปิด/ปิด + แท็บหมวดที่เลือก
// 'auto' = ให้ CSS ตัดสินตามความกว้างจอ: ช่องว่างขวาของ .page พอ → แผงเปิด · ไม่พอ/มือถือ → ปุ่มมุมขวาล่าง (ดู styles.css)
// ผู้อ่านกด × = จำใน localStorage ไม่เปิดเองอีกทุกหน้า · กดปุ่มเปิดกลับ = ลบค่าที่จำ
// เริ่มจาก 'pending' (ซ่อนทั้งแผงและปุ่ม) แล้วค่อยอ่านค่าหลัง mount — คนที่เคยปิดไว้จะไม่เห็นแผงแว้บขึ้นมาก่อนหุบ
const KEY = 'shopDock'

type DockState = 'pending' | 'auto' | 'open' | 'closed'

// หนึ่งหมวด = หนึ่งแท็บ · list = รายการการ์ดที่ <ShopeeBox> render ฝั่ง server มาแล้ว
export interface ShopeeLine {
  group: string
  mark: string
  label: string
  list: ReactNode
}

// localStorage เข้าถึงไม่ได้ในโหมดส่วนตัวบางเบราว์เซอร์ — ล้มแล้วแค่จำไม่ได้ แผงยังใช้ได้
function readClosed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'closed'
  } catch {
    return false
  }
}

function rememberClosed(closed: boolean): void {
  try {
    if (closed) localStorage.setItem(KEY, 'closed')
    else localStorage.removeItem(KEY)
  } catch {
    /* ไม่เป็นไร — แค่จำไม่ได้ข้ามหน้า */
  }
}

// ป้าย "ลิงก์ affiliate" ท้ายหัวแผงคือจุดเดียวบนหน้าที่บอกผู้อ่านว่าเว็บได้ค่าคอมจากลิงก์นี้ (ห้ามถอด)
// หัวแผงไม่ใช่ <h2>/<h3> เพื่อไม่ให้แทรกในโครงหัวข้อของหน้า
// แท็บหมวด: การ์ดทุกหมวดอยู่ใน HTML ครบ หมวดที่ไม่ได้เลือกแค่ซ่อนด้วย hidden · children = บรรทัดท้ายแผง (ที่มาของราคา)
export default function ShopeeDock({ lines, children }: { lines: ShopeeLine[]; children: ReactNode }) {
  const [state, setState] = useState<DockState>('pending')
  const [tab, setTab] = useState(lines[0]?.group)
  const body = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setState(readClosed() ? 'closed' : 'auto')
  }, [])

  const pick = (next: 'open' | 'closed') => {
    setState(next)
    rememberClosed(next === 'closed')
  }

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
