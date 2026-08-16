import { marked } from 'marked'

interface MarkdownProps {
  text: string
}

// เนื้อหาทั้งหมดเขียนเองใน repo — เรนเดอร์ตรงได้ ไม่มี input จากผู้ใช้ภายนอก
// เป็น server component ล้วน (render ฝั่ง server ตอน build ให้ HTML อยู่ใน static output เพื่อ SEO)
export default function Markdown({ text }: MarkdownProps) {
  // marked.parse คืน string เสมอเพราะไม่ได้เปิด async — cast ให้ตรงชนิดจริง
  let html = marked.parse(text, { gfm: true, breaks: false }) as string
  // ห่อตารางให้เลื่อนแนวนอนได้บนจอแคบ
  html = html.replaceAll('<table>', '<div class="table-wrap"><table>').replaceAll('</table>', '</table></div>')
  // ข่าวเก่าบางไฟล์ลิงก์แบบ HashRouter (#/game/y7) — แปลงเป็น path ใหม่ตอน render
  html = html.replaceAll('href="#/', 'href="/')
  return <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
}
