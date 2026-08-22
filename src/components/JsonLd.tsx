import type { JsonLdNode } from '@/lib/seo'

interface JsonLdProps {
  /** โหนดเดียวหรือหลายโหนดก็ได้ — null/undefined ในลิสต์จะถูกข้าม (สะดวกเวลาโหนดนั้นมีเฉพาะบางเงื่อนไข) */
  data: JsonLdNode | Array<JsonLdNode | null | undefined>
}

// <script type="application/ld+json"> ฝั่ง server — ข้อมูลมาจากโค้ดในรีโปทั้งหมด ไม่มี input จากผู้ใช้ภายนอก
// escape `<` กัน string ในข้อมูลปิดแท็ก script ก่อนกำหนด
export default function JsonLd({ data }: JsonLdProps) {
  const nodes = (Array.isArray(data) ? data : [data]).filter(Boolean) as JsonLdNode[]
  if (!nodes.length) return null

  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node).replaceAll('<', '\\u003c') }}
        />
      ))}
    </>
  )
}
