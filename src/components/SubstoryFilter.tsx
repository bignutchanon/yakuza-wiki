'use client'

import { useEffect, useState } from 'react'

// แถบค้นหา/กรองของหน้าเควสเสริม
// การ์ดทั้งหมด render มาจาก server component แล้ว (อยู่ใน HTML ตั้งแต่ build เพื่อ SEO)
// คอมโพเนนต์นี้แค่ซ่อน/โชว์การ์ดที่ตรงเงื่อนไข โดยค้นจากข้อความที่อยู่ในการ์ดเอง (textContent)
// จึงไม่ต้องส่งข้อมูลเควสมาซ้ำอีกชุด และค้นได้ถึงข้อความขั้นตอนที่ยังพับอยู่ด้วย
// ถ้าเบราว์เซอร์ไม่รันสคริปต์ ผู้ใช้ก็ยังเห็นรายการครบทุกเควสตามปกติ

interface Props {
  total: number
  /** ปุ่มกรอง — ค่าที่เลือกเอาไปเทียบกับ data-facet ของการ์ด (สายตัวเอก หรือทำเล แล้วแต่ภาค) */
  facets: { value: string; count: number }[]
  placeholder: string
}

const norm = (s: string) => s.toLowerCase().trim()

export default function SubstoryFilter({ total, facets, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [facet, setFacet] = useState('')
  const [shown, setShown] = useState(total)

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-substory]')
    const words = norm(query).split(/\s+/).filter(Boolean)
    let visible = 0

    for (const card of cards) {
      const haystack = (card.dataset.text ??= (card.textContent ?? '').toLowerCase())
      const match =
        (!facet || card.dataset.facet === facet) && words.every((w) => haystack.includes(w))
      card.hidden = !match
      if (match) visible++
    }

    setShown(visible)
  }, [query, facet])

  return (
    <div className="sub-tools">
      <input
        type="search"
        className="sub-search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="ค้นหาเควสเสริม"
      />

      {facets.length > 1 && (
        <div className="sub-chips" role="group" aria-label="กรองรายการ">
          <button
            type="button"
            className={`sub-chip${facet === '' ? ' is-on' : ''}`}
            onClick={() => setFacet('')}
            aria-pressed={facet === ''}
          >
            ทั้งหมด <span>{total}</span>
          </button>
          {facets.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`sub-chip${facet === f.value ? ' is-on' : ''}`}
              onClick={() => setFacet(f.value)}
              aria-pressed={facet === f.value}
            >
              {f.value} <span>{f.count}</span>
            </button>
          ))}
        </div>
      )}

      <p className="sub-count" aria-live="polite">
        {shown === total ? `ทั้งหมด ${total} เควส` : `พบ ${shown} จาก ${total} เควส`}
      </p>
    </div>
  )
}
