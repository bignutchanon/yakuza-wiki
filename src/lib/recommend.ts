// ตัวช่วยอ่านยอด "แนะนำ" จาก Cloudflare Worker — ใช้ได้เฉพาะฝั่ง client (เว็บเป็น static export
// ยอดจึงไม่มีตอน build ต้องดึงตอนเปิดหน้า) · โค้ด worker + วิธี deploy อยู่ที่ worker/README.md
import { RECOMMEND_ENDPOINT } from './site'

// worker รับ target ได้ไม่เกิน MAX_TARGETS (40) ต่อหนึ่งคำขอ — หน้าแรกมี 15 ภาค ยิงรอบเดียวจบ
const MAX_TARGETS = 40

/**
 * ดึงยอดของหลาย target ในคำขอเดียว — คืน {} เมื่อระบบปิดหรือเรียกไม่สำเร็จ
 * (ยอดโหลดไม่ขึ้นไม่ใช่เรื่องใหญ่ หน้าเว็บต้องใช้งานได้เหมือนเดิม)
 */
export async function fetchRecommendCounts(
  targets: string[],
  signal?: AbortSignal
): Promise<Record<string, number>> {
  if (!RECOMMEND_ENDPOINT || targets.length === 0) return {}

  const query = encodeURIComponent(targets.slice(0, MAX_TARGETS).join(','))
  try {
    const res = await fetch(`${RECOMMEND_ENDPOINT}?targets=${query}`, { signal })
    const body = (await res.json()) as { counts?: Record<string, number> }
    return body.counts ?? {}
  } catch {
    return {}
  }
}
