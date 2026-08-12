import { useParams, Link } from 'react-router-dom'
import { gameById } from '../data/games.js'
import { contentFor } from '../content/loader.js'
import Markdown from '../components/Markdown.jsx'

export default function ChapterPage() {
  const { id, n } = useParams()
  const game = gameById(id)
  const { chapters } = contentFor(id)
  const idx = chapters.findIndex((c) => c.n === Number(n))
  const ch = chapters[idx]

  if (!game || !ch) return <div className="page">ไม่พบบทนี้</div>

  const prev = chapters[idx - 1]
  const next = chapters[idx + 1]

  return (
    <div className="page">
      <div className="ch-head">
        <div className="eyebrow">
          <Link to={`/game/${id}`}>{game.title}</Link>
          {ch.part ? ` · ${ch.part}` : ''}
        </div>
        <div className="ch-n">บทที่ {ch.n}</div>
        <h1>{ch.thai || ch.title}</h1>
        {ch.thai && ch.title && <div className="en-title">{ch.title}</div>}
      </div>

      <div className="spoiler-note">สปอยล์เนื้อเรื่องของบทนี้เต็ม ๆ</div>

      <Markdown text={ch.body} />

      <div className="pager">
        <span>
          {prev && (
            <Link to={`/game/${id}/ch/${prev.n}`}>
              ← บทที่ {prev.n}: {prev.thai || prev.title}
            </Link>
          )}
        </span>
        <span>
          {next && (
            <Link to={`/game/${id}/ch/${next.n}`}>
              บทที่ {next.n}: {next.thai || next.title} →
            </Link>
          )}
        </span>
      </div>
    </div>
  )
}
