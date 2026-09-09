'use client'

import { useEffect, useState } from 'react'

// แถบค้นหา/กรองของหน้าเควสเสริม
// การ์ดทั้งหมด render มาจาก server component แล้ว (อยู่ใน HTML ตั้งแต่ build เพื่อ SEO)
// คอมโพเนนต์นี้แค่ซ่อน/โชว์การ์ดที่ตรงเงื่อนไข โดยค้นจากข้อความที่อยู่ในการ์ดเอง (textContent)
// จึงไม่ต้องส่งข้อมูลเควสมาซ้ำอีกชุด และค้นได้ถึงข้อความขั้นตอนที่ยังพับอยู่ด้วย
// ถ้าเบราว์เซอร์ไม่รันสคริปต์ ผู้ใช้ก็ยังเห็นรายการครบทุกเควสตามปกติ

interface Props {
  total: number
  places: { place: string; count: number }[]
}

const norm = (s: string) => s.toLowerCase().trim()

export default function SubstoryFilter({ total, places }: Props) {
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState('')
  const [shown, setShown] = useState(total)

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-substory]')
    const words = norm(query).split(/\s+/).filter(Boolean)
    let visible = 0

    for (const card of cards) {
      const haystack = (card.dataset.text ??= (card.textContent ?? '').toLowerCase())
      const match =
        (!place || card.dataset.place === place) && words.every((w) => haystack.includes(w))
      card.hidden = !match
      if (match) visible++
    }

    setShown(visible)
  }, [query, place])

  return (
    <div className="sub-tools">
      <input
        type="search"
        className="sub-search"
        placeholder="ค้นชื่อเควส หรือคำในเป้าหมาย เช่น ล็อกเกอร์, Amon"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="ค้นหาเควสเสริม"
      />

      <div className="sub-chips" role="group" aria-label="กรองตามทำเล">
        <button
          type="button"
          className={`sub-chip${place === '' ? ' is-on' : ''}`}
          onClick={() => setPlace('')}
          aria-pressed={place === ''}
        >
          ทั้งหมด <span>{total}</span>
        </button>
        {places.map((p) => (
          <button
            key={p.place}
            type="button"
            className={`sub-chip${place === p.place ? ' is-on' : ''}`}
            onClick={() => setPlace(p.place)}
            aria-pressed={place === p.place}
          >
            {p.place} <span>{p.count}</span>
          </button>
        ))}
      </div>

      <p className="sub-count" aria-live="polite">
        {shown === total ? `ทั้งหมด ${total} เควส` : `พบ ${shown} จาก ${total} เควส`}
      </p>
    </div>
  )
}
