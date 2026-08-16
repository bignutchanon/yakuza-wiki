'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// แบนเนอร์ขอความยินยอมคุกกี้ — โชว์ครั้งแรกจนกว่าจะเลือก เก็บตัวเลือกใน localStorage
// 'all' = โฆษณาปกติ · 'essential' = ขอโฆษณาแบบ non-personalized
// (app/layout.jsx อ่านค่านี้ตอนโหลดหน้า เพื่อตั้ง requestNonPersonalizedAds ก่อนโฆษณาเริ่มทำงาน)
const KEY = 'cookieConsent'

export default function CookieConsent() {
  // เริ่มจาก null เสมอ (SSR ไม่มี localStorage) แล้วค่อยอ่านค่าจริงหลัง mount กัน hydration mismatch
  const [choice, setChoice] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setChoice(localStorage.getItem(KEY))
    setReady(true)

    // หน้า /privacy ยิง event นี้ตอนกด "เปลี่ยนการตั้งค่าคุกกี้" — เปิดแบนเนอร์ใหม่ทันทีไม่ต้อง reload
    const reopen = () => setChoice(null)
    window.addEventListener('cookieConsentReset', reopen)
    return () => window.removeEventListener('cookieConsentReset', reopen)
  }, [])

  if (!ready || choice) return null

  const decide = (value) => {
    localStorage.setItem(KEY, value)
    if (value === 'essential') {
      ;(window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1
    }
    setChoice(value)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="การตั้งค่าคุกกี้">
      <p className="cookie-text">
        เว็บนี้ใช้คุกกี้ของ Google AdSense เพื่อแสดงโฆษณา — เลือก "เฉพาะที่จำเป็น"
        จะแสดงโฆษณาแบบไม่อิงความสนใจแทน อ่านรายละเอียดที่{' '}
        <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link>
      </p>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-accept" onClick={() => decide('all')}>
          ยอมรับทั้งหมด
        </button>
        <button className="cookie-btn" onClick={() => decide('essential')}>
          เฉพาะที่จำเป็น
        </button>
      </div>
    </div>
  )
}
