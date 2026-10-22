'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// แถบการ์ด Shopee + ปุ่มลูกศรซ้าย/ขวา (desktop) — การ์ด (children) ยัง render ฝั่ง server อยู่ใน HTML ตามเดิม
// ไฟล์นี้ถือแค่ตำแหน่งเลื่อน: ปุ่มฝั่งที่สุดทางแล้วซ่อน · การ์ดพอดีกล่อง = ซ่อนทั้งคู่ · จอสัมผัสใช้ปัดเอา (CSS ซ่อนปุ่ม)
export default function ShopeeScroller({ children }: { children: ReactNode }) {
  const row = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  useEffect(() => {
    const el = row.current
    if (!el) return
    const update = () =>
      setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // เลื่อนทีละ ~1 หน้ากล่อง เหลือการ์ดเดิมให้เห็นต่อเนื่องนิดหน่อย
  const go = (dir: 1 | -1) => {
    const el = row.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="shop-carousel">
      <button type="button" className="shop-arrow is-prev" onClick={() => go(-1)} hidden={edge.start} aria-label="เลื่อนดูสินค้าก่อนหน้า">
        ‹
      </button>
      <ul className="shop-row" ref={row}>
        {children}
      </ul>
      <button type="button" className="shop-arrow is-next" onClick={() => go(1)} hidden={edge.end} aria-label="เลื่อนดูสินค้าถัดไป">
        ›
      </button>
    </div>
  )
}
