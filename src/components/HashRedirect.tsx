'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// รองรับบุ๊กมาร์กเก่าสมัย HashRouter เช่น /#/game/y7 → เด้งไปหน้าใหม่ /game/y7/ ให้อัตโนมัติ
export default function HashRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      router.replace(window.location.hash.slice(1))
    }
  }, [router])

  return null
}
