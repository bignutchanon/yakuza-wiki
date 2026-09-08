/**
 * Cloudflare Worker — ระบบ "แนะนำ" (recommend) ของ yakuzathai.com
 *
 * เว็บหลักเป็น static export บน GitHub Pages จึงไม่มี server ของตัวเอง
 * Worker ตัวนี้คือปลายทางเดียวที่เก็บยอดกดแนะนำ (ตาราง D1 ดู schema.sql)
 *
 *   GET  /recommend?targets=game:y0,game:y7   -> { counts: { "game:y0": 12, ... } }
 *   POST /recommend   (body urlencoded: target=game:y0)
 *                                             -> { ok: true, target, count, already }
 *
 * ข้อกำหนดฝั่ง client (ห้ามแก้โดยไม่ดูตรงนี้ก่อน):
 *   - POST ส่งเป็น application/x-www-form-urlencoded ตั้งใจ ให้เป็น "simple request"
 *     เบราว์เซอร์จะได้ไม่ยิง preflight OPTIONS (ถึงจะรองรับไว้แล้วก็ตาม — ประหยัด request)
 *   - กันกดซ้ำมีสองชั้น: localStorage ฝั่งเบราว์เซอร์ (แค่ UX) + PRIMARY KEY ในตาราง (ของจริง)
 */

const ALLOWED_ORIGINS = [
  'https://yakuzathai.com',
  'https://www.yakuzathai.com',
  'http://localhost:3000',
]

// รูปแบบ target ที่ยอมรับ — 'ชนิด:ไอดี' ตัวพิมพ์เล็ก/ตัวเลข/ขีด เท่านั้น
const TARGET_RE = /^[a-z]{2,12}:[a-z0-9-]{1,60}$/
// เพดานจำนวน target ต่อหนึ่ง GET (กันคนยิงคิวรีใหญ่ ๆ ใส่ D1)
const MAX_TARGETS = 40
// เพดานการกดแนะนำต่อหนึ่ง IP ต่อ 24 ชม. (ทั้งเว็บมี ~15 ภาค เผื่อไว้ให้คนกดจริงไม่ชน)
const DAILY_VOTE_LIMIT = 40
const DAY_SECONDS = 86_400

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})

const json = (data, { status = 200, origin, cache = 0 } = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(origin ? corsHeaders(origin) : {}),
      // ให้ edge cache ยอดสั้น ๆ ได้ — ยอดช้าไปครึ่งนาทีไม่เป็นไร แต่ลดภาระ D1 ได้มาก
      'Cache-Control': cache > 0 ? `public, max-age=${cache}` : 'no-store',
    },
  })

/** แปลง IP เป็นรหัสผู้กดที่ย้อนกลับไม่ได้ — ผูกกับ VOTE_SALT ที่เก็บเป็น secret */
async function voterId(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}|${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function handleGet(url, env, origin) {
  const raw = (url.searchParams.get('targets') || '').split(',').map((t) => t.trim()).filter(Boolean)
  const targets = [...new Set(raw)].filter((t) => TARGET_RE.test(t)).slice(0, MAX_TARGETS)
  if (targets.length === 0) return json({ counts: {} }, { origin, cache: 30 })

  const placeholders = targets.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT target, COUNT(*) AS n FROM recommends WHERE target IN (${placeholders}) GROUP BY target`
  )
    .bind(...targets)
    .all()

  // ตอบครบทุก target ที่ถามมา — ตัวที่ยังไม่มีใครกดตอบ 0 ไม่ใช่หายไปเฉย ๆ
  const counts = Object.fromEntries(targets.map((t) => [t, 0]))
  for (const row of results) counts[row.target] = Number(row.n)
  return json({ counts }, { origin, cache: 30 })
}

async function handlePost(request, env, origin) {
  const form = new URLSearchParams(await request.text())
  const target = (form.get('target') || '').trim()
  if (!TARGET_RE.test(target)) {
    return json({ ok: false, error: 'target ไม่ถูกต้อง' }, { status: 400, origin })
  }

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0'
  const voter = await voterId(ip, env.VOTE_SALT || 'dev-salt')
  const now = Math.floor(Date.now() / 1000)

  const { results: recent } = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM recommends WHERE voter = ? AND ts > ?'
  )
    .bind(voter, now - DAY_SECONDS)
    .all()
  if (Number(recent[0]?.n || 0) >= DAILY_VOTE_LIMIT) {
    return json({ ok: false, error: 'กดแนะนำบ่อยเกินไป ลองใหม่พรุ่งนี้' }, { status: 429, origin })
  }

  // OR IGNORE = กดซ้ำจาก IP เดิมไม่เพิ่มยอด และไม่ถือเป็น error
  const insert = await env.DB.prepare(
    'INSERT OR IGNORE INTO recommends (target, voter, ts) VALUES (?, ?, ?)'
  )
    .bind(target, voter, now)
    .run()
  const already = (insert.meta?.changes ?? 0) === 0

  const { results } = await env.DB.prepare('SELECT COUNT(*) AS n FROM recommends WHERE target = ?')
    .bind(target)
    .all()

  return json({ ok: true, target, count: Number(results[0]?.n || 0), already }, { origin })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ''
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: allowed ? corsHeaders(allowed) : {} })
    }
    // เรียกข้ามโดเมนจากที่อื่นไม่ได้ (เรียกตรงจาก curl ที่ไม่มี Origin ยังอ่านยอดได้ ไม่เป็นไร)
    if (origin && !allowed) return json({ ok: false, error: 'origin ไม่ได้รับอนุญาต' }, { status: 403 })
    if (url.pathname !== '/recommend') return json({ ok: false, error: 'not found' }, { status: 404, origin: allowed })

    try {
      if (request.method === 'GET') return await handleGet(url, env, allowed)
      if (request.method === 'POST') return await handlePost(request, env, allowed)
    } catch (err) {
      return json({ ok: false, error: 'server error' }, { status: 500, origin: allowed })
    }
    return json({ ok: false, error: 'method not allowed' }, { status: 405, origin: allowed })
  },
}
