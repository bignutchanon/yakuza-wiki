// รันด้วย: node test.mjs  (ใช้ node:sqlite แทน D1 — ไม่ต้อง login Cloudflare)
// ตรวจว่า worker กันกดซ้ำ/กันสแปม/กรอง target/CORS ได้จริงก่อน deploy
// ทดสอบ worker ด้วย node:sqlite แทน D1 (API prepare/bind/all/run เหมือนกันพอสำหรับที่ worker ใช้)
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import worker from './src/index.js'

const db = new DatabaseSync(':memory:')
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))

const DB = {
  prepare(sql) {
    const stmt = db.prepare(sql)
    let args = []
    const api = {
      bind: (...a) => { args = a; return api },
      all: async () => ({ results: stmt.all(...args) }),
      run: async () => { const r = stmt.run(...args); return { meta: { changes: r.changes } } },
    }
    return api
  },
}
const env = { DB, VOTE_SALT: 'test-salt' }
const ORIGIN = 'https://yakuzathai.com'

const call = async (method, path, { ip = '1.1.1.1', body, origin = ORIGIN } = {}) => {
  const headers = { Origin: origin, 'cf-connecting-ip': ip }
  const req = new Request(`https://api.yakuzathai.com${path}`, { method, headers, body })
  const res = await worker.fetch(req, env)
  return { status: res.status, body: await res.json().catch(() => null), cors: res.headers.get('Access-Control-Allow-Origin') }
}
const post = (target, ip) => call('POST', '/recommend', { ip, body: new URLSearchParams({ target }) })

let fail = 0
const check = (name, cond, extra) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`, cond ? '' : JSON.stringify(extra)); if (!cond) fail++ }

// ยอดเริ่มต้น
let r = await call('GET', '/recommend?targets=game:y0,game:y7')
check('GET ตอบครบทุก target เป็น 0', JSON.stringify(r.body.counts) === '{"game:y0":0,"game:y7":0}', r.body)
check('GET ส่ง CORS ให้ origin ที่อนุญาต', r.cors === ORIGIN, r)

// กดครั้งแรก
r = await post('game:y0', '1.1.1.1')
check('POST ครั้งแรกนับ 1', r.body.count === 1 && r.body.already === false, r.body)

// กดซ้ำ IP เดิม
r = await post('game:y0', '1.1.1.1')
check('POST ซ้ำ IP เดิมไม่เพิ่มยอด + already=true', r.body.count === 1 && r.body.already === true, r.body)

// IP อื่น
r = await post('game:y0', '2.2.2.2')
check('POST จาก IP อื่นนับเพิ่ม', r.body.count === 2, r.body)

// target ไม่ถูกรูปแบบ
r = await post('GAME:Y0', '3.3.3.3')
check('target ผิดรูปแบบตอบ 400', r.status === 400, r)
r = await post("game:y0'; DROP TABLE recommends;--", '3.3.3.3')
check('target มีอักขระแปลกตอบ 400', r.status === 400, r)

// origin แปลกปลอม
r = await call('GET', '/recommend?targets=game:y0', { origin: 'https://evil.example' })
check('origin ไม่อนุญาตตอบ 403', r.status === 403, r)

// preflight
{
  const res = await worker.fetch(new Request('https://api.yakuzathai.com/recommend', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env)
  check('OPTIONS ตอบ 204 + CORS', res.status === 204 && res.headers.get('Access-Control-Allow-Origin') === ORIGIN, res.status)
}

// เพดานต่อวัน 40 ครั้ง
for (let i = 0; i < 45; i++) await post(`game:t${i}`, '9.9.9.9')
r = await post('game:last', '9.9.9.9')
check('เกินเพดานต่อวันตอบ 429', r.status === 429, r)
r = await post('game:last', '8.8.8.8')
check('IP อื่นยังกดได้ตามปกติ', r.body?.ok === true, r)

// path อื่น
r = await call('GET', '/whatever')
check('path อื่นตอบ 404', r.status === 404, r)

// GET หลาย target หลังมีข้อมูล
r = await call('GET', '/recommend?targets=game:y0,game:y99')
check('GET รวมยอดถูกต้อง', r.body.counts['game:y0'] === 2 && r.body.counts['game:y99'] === 0, r.body)

console.log(fail === 0 ? '\nทั้งหมดผ่าน' : `\nตก ${fail} ข้อ`)
process.exit(fail === 0 ? 0 : 1)
