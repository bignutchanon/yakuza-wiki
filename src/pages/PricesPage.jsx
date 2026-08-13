import { Link } from 'react-router-dom'
import { gamePrices, thaiDate } from '../content/loader.js'
import Markdown from '../components/Markdown.jsx'

export default function PricesPage() {
  if (!gamePrices) {
    return (
      <div className="page">
        <h1>ราคาเกม</h1>
        <p>ยังไม่มีข้อมูลราคา</p>
      </div>
    )
  }
  return (
    <div className="page">
      <h1>ราคาเกมตอนนี้</h1>
      <p className="game-sub">
        อัปเดตล่าสุด {thaiDate(gamePrices.updated)} · ตามข่าวซีรีส์ได้ที่หน้า{' '}
        <Link to="/news">ข่าวสาร</Link>
      </p>
      <Markdown text={gamePrices.body} />
    </div>
  )
}
