import { useMemo } from 'react'
import { marked } from 'marked'

// เนื้อหาทั้งหมดเขียนเองใน repo — เรนเดอร์ตรงได้ ไม่มี input จากผู้ใช้ภายนอก
export default function Markdown({ text }) {
  const html = useMemo(() => {
    const out = marked.parse(text, { gfm: true, breaks: false })
    // ห่อตารางให้เลื่อนแนวนอนได้บนจอแคบ
    return out.replaceAll('<table>', '<div class="table-wrap"><table>').replaceAll('</table>', '</table></div>')
  }, [text])
  return <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
}
