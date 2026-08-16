'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MotionConfig, motion } from 'framer-motion'

// เปลี่ยนหน้าแบบ fade+slide — MotionConfig เคารพ reduced motion ของผู้ใช้
// (ไม่มี AnimatePresence/exit เพราะ template.tsx ของ App Router unmount ทันทีตอนเปลี่ยนหน้าอยู่แล้ว)
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า (เมนูปิดตัวเองใน Navbar)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
