'use client'

import { useEffect, useRef, useState } from 'react'
import { REPORT_ENDPOINT } from '@/lib/site'

// ฟอร์มแจ้งบั๊กม็อดแปลไทย — ยิง POST ไป Google Apps Script Web App ที่เขียนต่อลง Google Sheet
// (เว็บเป็น static export ไม่มี server ของตัวเอง — ดูสคริปต์ฝั่ง Apps Script ที่ scripts/report-form.gs)
//
// ส่งเป็น application/x-www-form-urlencoded ตั้งใจ: เป็น "simple request" เบราว์เซอร์จึงไม่ยิง
// preflight OPTIONS ซึ่ง Apps Script ตอบไม่ได้ ห้ามใส่ custom header หรือเปลี่ยนเป็น JSON

export interface ReportFormGame {
  id: string
  title: string
}

interface ReportFormProps {
  games: ReportFormGame[]
}

const ISSUE_TYPES = [
  'เกมค้าง / เกมเด้ง',
  'ตัวหนังสือเพี้ยน / อ่านไม่ออก',
  'คำแปลผิด / แปลไม่ครบ',
  'ติดตั้งไม่ได้',
  'อื่น ๆ',
]

// เพดานไฟล์แนบ — base64 ทำให้ payload บวมราว 1.4 เท่า เผื่อไว้ให้ไม่ชนลิมิตของ Apps Script
const MAX_FILE_MB = 5
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

// Apps Script ที่ต้องเซฟไฟล์แนบลง Drive ด้วยใช้เวลาได้หลายวินาที แต่ถ้าเกินนี้ถือว่าค้างแล้ว
// ตัดการรอทิ้งพร้อมบอกผู้แจ้ง ดีกว่าปล่อยให้ปุ่มค้างเงียบ ๆ จนคนปิดหน้าไปเอง
const TIMEOUT_MS = 90_000

type Status = 'idle' | 'reading' | 'sending' | 'done' | 'error'

// ไอดีของ "การกดส่งหนึ่งครั้ง" — ส่งไปกับรายงานให้ฝั่ง Apps Script ใช้กันรายงานซ้ำ
// (กดรัว ๆ หรือกดลองใหม่หลังเน็ตสะดุดทั้งที่แถวเข้าชีตไปแล้ว จะได้ไม่กลายเป็นสองแถว)
function newReportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// อ่านไฟล์เป็น base64 ล้วน (ตัดส่วนหัว data:...;base64, ออก)
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

export default function ReportForm({ games }: ReportFormProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // ล็อกกันกดส่งซ้ำ — ต้องเป็น ref ไม่ใช่ state เพราะ state ที่เพิ่งตั้งยังอ่านไม่ได้ในจังหวะเดียวกัน
  // และปุ่มที่ disabled จากการ re-render มาช้ากว่าการกดรัว/ดับเบิลแท็ปเสมอ
  // (เคยได้รายงานใบเดียวกันสองแถวห่างกันไม่กี่มิลลิวินาที)
  const busyRef = useRef(false)
  // ไอดีของใบที่กำลังส่ง — คงค่าเดิมไว้ตอนกดลองใหม่หลังส่งไม่สำเร็จ ให้ปลายทางรู้ว่าเป็นใบเดียวกัน
  const reportIdRef = useRef('')
  const feedbackRef = useRef<HTMLDivElement | null>(null)
  const doneRef = useRef<HTMLDivElement | null>(null)

  const configured = REPORT_ENDPOINT !== ''
  const busy = status === 'reading' || status === 'sending'

  // เลื่อนจอไปหาผลลัพธ์ทุกครั้งที่ส่งจบ — ฟอร์มยาวกว่าหนึ่งหน้าจอ ถ้าไม่เลื่อนให้
  // คนที่กดปุ่มตอนอยู่ล่างสุดจะไม่เห็นทั้งกล่องสำเร็จและข้อความบอกข้อผิดพลาด
  useEffect(() => {
    if (status === 'done') doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (status === 'error') feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [status])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!configured || busyRef.current) return

    const form = e.currentTarget
    const data = new FormData(form)

    // honeypot: บอทกรอกทุกช่อง คนไม่เห็นช่องนี้ → ถ้ามีค่าให้ทำเป็นส่งสำเร็จแล้วทิ้งไปเงียบ ๆ
    if (String(data.get('website') || '') !== '') {
      setStatus('done')
      return
    }

    busyRef.current = true
    setStatus(file ? 'reading' : 'sending')
    setError('')

    if (!reportIdRef.current) reportIdRef.current = newReportId()

    const payload = new URLSearchParams()
    for (const key of ['gameId', 'modVersion', 'issueType', 'scene', 'detail', 'system', 'saveLink', 'contact']) {
      payload.set(key, String(data.get(key) || ''))
    }
    // ส่งชื่อภาคเต็มไปด้วย ฝั่ง Apps Script ใช้ gameId ตั้งชื่อแท็บ ส่วนชื่อเต็มลงในคอลัมน์
    const picked = games.find((g) => g.id === payload.get('gameId'))
    payload.set('game', picked ? picked.title : 'อื่น ๆ')
    payload.set('reportId', reportIdRef.current)
    payload.set('pageUrl', window.location.href)
    payload.set('userAgent', navigator.userAgent)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      if (file) {
        if (file.size > MAX_FILE_BYTES) {
          throw new Error(`ไฟล์แนบใหญ่เกิน ${MAX_FILE_MB} MB — อัปขึ้น Drive แล้ววางลิงก์ในช่องรายละเอียดแทนได้`)
        }
        payload.set('fileName', file.name)
        payload.set('fileType', file.type || 'application/octet-stream')
        payload.set('fileData', await readAsBase64(file))
        setStatus('sending')
      }

      const res = await fetch(REPORT_ENDPOINT, { method: 'POST', body: payload, signal: controller.signal })

      // Apps Script ตอบเป็นหน้า HTML ได้ตอนมีปัญหาสิทธิ์หรือ deploy ค้าง — อ่านเป็นข้อความก่อนแล้วค่อยแปลง
      // ไม่งั้น res.json() จะโยนข้อความ error ที่ผู้แจ้งอ่านไม่รู้เรื่องออกมา
      const raw = await res.text()
      let body: { ok?: boolean; error?: string } = {}
      try {
        body = JSON.parse(raw) as typeof body
      } catch {
        throw new Error('ปลายทางตอบกลับผิดรูปแบบ — ระบบรับแจ้งอาจปิดอยู่ชั่วคราว ลองใหม่อีกครั้งภายหลัง')
      }
      if (!res.ok || !body.ok) throw new Error(body.error || 'ส่งไม่สำเร็จ')

      form.reset()
      setFile(null)
      reportIdRef.current = ''
      setStatus('done')
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      setError(
        aborted
          ? 'รอนานเกินไปจนต้องยกเลิก — เน็ตอาจสะดุดหรือไฟล์แนบใหญ่เกินไป กดส่งใหม่ได้เลย ถ้าใบแรกเข้าระบบไปแล้วจะไม่ถูกนับซ้ำ'
          : err instanceof Error
            ? err.message
            : 'ส่งไม่สำเร็จ',
      )
      setStatus('error')
    } finally {
      clearTimeout(timer)
      busyRef.current = false
    }
  }

  if (status === 'done') {
    return (
      <div className="report-done" ref={doneRef}>
        <h3>ส่งเรียบร้อย ขอบคุณมาก</h3>
        <p>
          รายงานเข้าระบบแล้ว ถ้าใส่ช่องทางติดต่อกลับไว้ อาจมีการถามรายละเอียดเพิ่มก่อนออกตัวแก้
          ติดตามข่าวตัวแก้ได้ที่หน้า <a href="/news/">ข่าวสาร</a>
        </p>
        <button type="button" className="mod-btn mod-btn-beta" onClick={() => setStatus('idle')}>
          แจ้งอีกเรื่อง
        </button>
      </div>
    )
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      {!configured && (
        <p className="report-note report-note-warn">
          ระบบรับแจ้งบั๊กยังไม่เปิดใช้งาน (ยังไม่ได้ตั้งค่าปลายทาง) — ระหว่างนี้แจ้งผ่านช่องทางที่โพสต์ข่าวไว้ได้เลย
        </p>
      )}

      {/* ปิดทั้งชุดตอนกำลังส่ง กันแก้ค่าในช่องระหว่างที่ payload เดินทางอยู่ และกันกดปุ่มซ้ำอีกชั้นหนึ่ง */}
      <fieldset className="report-fields" disabled={busy}>
        <label className="report-field">
          <span className="report-label">
            ภาคที่เจอปัญหา <em>*</em>
          </span>
          <select name="gameId" required defaultValue="">
            <option value="" disabled>
              — เลือกภาค —
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
            <option value="other">เว็บไซต์ / อื่น ๆ</option>
          </select>
        </label>

        <div className="report-row">
          <label className="report-field">
            <span className="report-label">
              ประเภทปัญหา <em>*</em>
            </span>
            <select name="issueType" required defaultValue="">
              <option value="" disabled>
                — เลือกประเภท —
              </option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="report-field">
            <span className="report-label">เวอร์ชันม็อด</span>
            <input type="text" name="modVersion" placeholder="เช่น v1.0 (ดูได้ที่หน้าภาคนั้น)" maxLength={40} />
          </label>
        </div>

        <label className="report-field">
          <span className="report-label">บท / ฉากที่เจอ</span>
          <input
            type="text"
            name="scene"
            placeholder="เช่น บทที่ 5 คัตซีนหลังออกจาก ADDC หรือ เมนูร้านอาหารในโซเท็นโบริ"
            maxLength={200}
          />
        </label>

        <label className="report-field">
          <span className="report-label">
            อาการที่เจอ <em>*</em>
          </span>
          <textarea
            name="detail"
            required
            rows={5}
            maxLength={3000}
            placeholder="เล่าตามที่เห็นได้เลย เช่น กดเริ่มมินิเกมดาร์ตแล้วเกมเด้งออกทันที ลองใหม่ 3 รอบก็เป็นเหมือนเดิม"
          />
        </label>

        <label className="report-field">
          <span className="report-label">สเปกเครื่อง / วิธีลงเกม</span>
          <input
            type="text"
            name="system"
            placeholder="เช่น Windows 11 · เกมจาก Steam · ลงม็อดอื่นอยู่ด้วย 1 ตัว"
            maxLength={200}
          />
        </label>

        <label className="report-field">
          <span className="report-label">ลิงก์ไฟล์เซฟ</span>
          <input type="url" name="saveLink" placeholder="https:// … (อัปไฟล์เซฟขึ้น Drive แล้ววางลิงก์)" maxLength={500} />
          <span className="report-hint">
            ถ้าเป็นบั๊กที่เจอเฉพาะบางจุดของเกม ไฟล์เซฟช่วยให้ตามแก้ได้เร็วขึ้นมาก (เปิดสิทธิ์ให้คนที่มีลิงก์ดาวน์โหลดได้ด้วย)
          </span>
        </label>

        <label className="report-field">
          <span className="report-label">ภาพหน้าจอ / คลิป</span>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,video/mp4"
            onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
          />
          <span className="report-hint">
            ไม่เกิน {MAX_FILE_MB} MB ต่อไฟล์ (png / jpg / webp / mp4) — ไฟล์ใหญ่กว่านั้นอัปขึ้น Drive แล้ววางลิงก์แทน · ไฟล์ที่ส่งมาถูกลบอัตโนมัติเมื่อครบ 90 วัน
          </span>
        </label>

        <label className="report-field">
          <span className="report-label">ช่องทางติดต่อกลับ</span>
          <input type="text" name="contact" placeholder="Discord หรืออีเมล (ไม่ใส่ก็ได้)" maxLength={120} />
          <span className="report-hint">ใช้เฉพาะกรณีต้องถามรายละเอียดเพิ่มเรื่องบั๊กนี้เท่านั้น</span>
        </label>

        {/* honeypot — ซ่อนจากคนจริงด้วย CSS ไม่ใช่ hidden เพื่อให้บอทที่อ่าน DOM ยังเห็น */}
        <div className="report-hp" aria-hidden="true">
          <label>
            เว็บไซต์
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* ช่องบอกสถานะเหนือปุ่ม — aria-live ให้โปรแกรมอ่านหน้าจอประกาศเองโดยไม่ต้องย้ายโฟกัส */}
        <div className="report-feedback" ref={feedbackRef} role="status" aria-live="polite">
          {busy && (
            <p className="report-note report-note-busy">
              <span className="report-spinner" aria-hidden="true" />
              {status === 'reading'
                ? 'กำลังอ่านไฟล์แนบ…'
                : 'กำลังส่งรายงาน… ถ้ามีไฟล์แนบอาจใช้เวลาสักครู่ อย่าเพิ่งปิดหน้านี้'}
            </p>
          )}
          {status === 'error' && <p className="report-note report-note-warn">{error}</p>}
        </div>

        <div className="report-actions">
          <button type="submit" className="mod-btn" disabled={!configured || busy}>
            {busy ? 'กำลังส่ง…' : 'ส่งรายงาน ↗'}
          </button>
          <span className="report-hint">ช่องที่มี * ต้องกรอก · ที่เหลือไม่ใส่ก็ส่งได้</span>
        </div>
      </fieldset>
    </form>
  )
}
