'use client'

import { useEffect, useState } from 'react'

// สถานะเปิด/ปิดของแผงลอย (<ShopeeDock> ขวา · <SupportDock> ซ้าย) — แต่ละแผงจำแยกกันด้วย key ของตัวเองใน localStorage
// 'auto' = ให้ CSS ตัดสินตามความกว้างจอ: ช่องว่างข้าง .page พอ → แผงเปิด · ไม่พอ/มือถือ → ปุ่มมุมล่าง (ดู styles.css)
// ผู้อ่านกด × = จำไว้ ไม่เปิดเองอีกทุกหน้า · กดปุ่มเปิดกลับ = ลบค่าที่จำ
// เริ่มจาก 'pending' (ซ่อนทั้งแผงและปุ่ม) แล้วค่อยอ่านค่าหลัง mount — คนที่เคยปิดไว้จะไม่เห็นแผงแว้บขึ้นมาก่อนหุบ
export type DockState = 'pending' | 'auto' | 'open' | 'closed'

// localStorage เข้าถึงไม่ได้ในโหมดส่วนตัวบางเบราว์เซอร์ — ล้มแล้วแค่จำไม่ได้ แผงยังใช้ได้
function readClosed(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'closed'
  } catch {
    return false
  }
}

function rememberClosed(key: string, closed: boolean): void {
  try {
    if (closed) localStorage.setItem(key, 'closed')
    else localStorage.removeItem(key)
  } catch {
    /* ไม่เป็นไร — แค่จำไม่ได้ข้ามหน้า */
  }
}

export function useDockState(key: string): [DockState, (next: 'open' | 'closed') => void] {
  const [state, setState] = useState<DockState>('pending')

  useEffect(() => {
    setState(readClosed(key) ? 'closed' : 'auto')
  }, [key])

  const pick = (next: 'open' | 'closed') => {
    setState(next)
    rememberClosed(key, next === 'closed')
  }

  return [state, pick]
}
