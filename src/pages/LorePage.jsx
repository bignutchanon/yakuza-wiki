import { useParams, Link } from 'react-router-dom'
import { loreArticles, loreBySlug } from '../content/loader.js'
import Markdown from '../components/Markdown.jsx'

export default function LorePage() {
  const { slug } = useParams()

  if (slug) {
    const article = loreBySlug(slug)
    if (!article) return <div className="page">ไม่พบบทความนี้</div>
    return (
      <div className="page">
        <div className="eyebrow">
          <Link to="/lore">Lore — เรื่องราวเบื้องหลัง</Link>
        </div>
        <h1 className="game-title">{article.title}</h1>
        <Markdown text={article.body} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="eyebrow">Lore</div>
      <h1 className="game-title">เรื่องราวเบื้องหลังซีรีส์</h1>
      <p className="game-sub">
        ไทม์ไลน์ องค์กร ตัวละคร และสถานที่ — บริบทที่ทำให้โลกของ Yakuza กลมขึ้น
      </p>
      {loreArticles.length ? (
        <ul className="chapter-list">
          {loreArticles.map((a) => (
            <li key={a.slug}>
              <Link to={`/lore/${a.slug}`}>
                <span>{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder">เนื้อหาส่วนนี้กำลังเขียน — เร็ว ๆ นี้</div>
      )}
    </div>
  )
}
