'use client'

import { useEffect, useState } from 'react'
import { RECOMMEND_ENDPOINT } from '@/lib/site'
import { fetchRecommendCounts } from '@/lib/recommend'

// ปุ่ม "แนะนำ" — เว็บเป็น static export ยอดจึงต้องดึงจาก Cloudflare Worker ฝั่ง client
// (โค้ด worker + วิธี deploy อยู่ที่ worker/README.md · RECOMMEND_ENDPOINT ว่าง = ปิดระบบ ปุ่มไม่ถูก render)
//
// กันกดซ้ำสองชั้น: localStorage แค่ทำให้ปุ่มจำสถานะบนเครื่องนี้ ส่วนของจริงคือ
// PRIMARY KEY (target, voter) ในฐานข้อมูล — ล้าง localStorage แล้วกดใหม่ยอดก็ไม่ขึ้น

interface RecommendButtonProps {
  /** เป้าหมายที่กดแนะนำ รูปแบบ 'ชนิด:ไอดี' เช่น 'game:y0' — worker ตรวจรูปแบบนี้ */
  target: string
  /** ข้อความบนปุ่มตอนยังไม่ได้กด */
  label?: string
}

const storageKey = (target: string): string => `recommend:${target}`

// localStorage เข้าถึงไม่ได้ในโหมดส่วนตัวบางเบราว์เซอร์ — ล้มแล้วต้องไม่พังทั้งปุ่ม
function readVoted(target: string): boolean {
  try {
    return localStorage.getItem(storageKey(target)) === '1'
  } catch {
    return false
  }
}

function rememberVoted(target: string): void {
  try {
    localStorage.setItem(storageKey(target), '1')
  } catch {
    /* ไม่เป็นไร — ฐานข้อมูลยังกันกดซ้ำให้อยู่ */
  }
}

export default function RecommendButton({ target, label = 'แนะนำภาคนี้' }: RecommendButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [voted, setVoted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!RECOMMEND_ENDPOINT) return
    setVoted(readVoted(target))

    // ยอดโหลดไม่ขึ้นไม่ใช่เรื่องใหญ่ — ปุ่มยังกดได้ แค่ไม่โชว์ตัวเลข (helper กลืน error ให้แล้ว)
    const ac = new AbortController()
    fetchRecommendCounts([target], ac.signal).then((counts) => {
      if (target in counts) setCount(counts[target])
    })
    return () => ac.abort()
  }, [target])

  async function handleClick() {
    if (voted || busy) return
    setBusy(true)
    setError('')

    // ส่งเป็น urlencoded ตั้งใจ ให้เป็น simple request เบราว์เซอร์จะได้ไม่ยิง preflight OPTIONS
    const payload = new URLSearchParams({ target })
    try {
      const res = await fetch(RECOMMEND_ENDPOINT, { method: 'POST', body: payload })
      const body = (await res.json()) as { ok?: boolean; count?: number; error?: string }
      if (!res.ok || !body.ok) throw new Error(body.error || 'กดแนะนำไม่สำเร็จ')

      setCount(body.count ?? null)
      setVoted(true)
      rememberVoted(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'กดแนะนำไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  if (!RECOMMEND_ENDPOINT) return null

  return (
    <div className="recommend">
      <button
        type="button"
        className={`recommend-btn${voted ? ' is-voted' : ''}`}
        onClick={handleClick}
        disabled={voted || busy}
        aria-pressed={voted}
      >
        <span aria-hidden="true" className="recommend-icon">
          ★
        </span>
        {voted ? 'แนะนำแล้ว' : label}
        {count !== null && <span className="recommend-count">{count.toLocaleString('th-TH')}</span>}
      </button>
      <span className="recommend-hint">
        {error || (voted ? 'ขอบคุณที่ช่วยบอกว่าหน้านี้มีประโยชน์' : 'กดได้ครั้งเดียว ไม่ต้องล็อกอิน')}
      </span>
    </div>
  )
}
