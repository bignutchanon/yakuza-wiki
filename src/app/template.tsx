'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MotionConfig, motion } from 'framer-motion'
import { isFirstPaint, markPainted } from '@/lib/firstPaint'

// เปลี่ยนหน้าแบบ fade+slide — MotionConfig เคารพ reduced motion ของผู้ใช้
// (ไม่มี AnimatePresence/exit เพราะ template.tsx ของ App Router unmount ทันทีตอนเปลี่ยนหน้าอยู่แล้ว)
// โหลดหน้าแรกไม่ fade (initial=false) — ห้ามให้ HTML ที่ build ออกมามีเนื้อหาติด opacity:0 ดู lib/firstPaint.ts
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า (เมนูปิดตัวเองใน Navbar)
  useEffect(() => {
    markPainted()
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={isFirstPaint() ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
