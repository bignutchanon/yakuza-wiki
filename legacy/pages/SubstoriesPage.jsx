import { useParams, Link } from 'react-router-dom'
import { gameById } from '../data/games.js'
import { contentFor } from '../content/loader.js'
import Markdown from '../components/Markdown.jsx'

export default function SubstoriesPage() {
  const { id } = useParams()
  const game = gameById(id)
  const { substories } = contentFor(id)

  if (!game || !substories) return <div className="page">ยังไม่มีเนื้อหาส่วนนี้</div>

  return (
    <div className="page">
      <div className="eyebrow">
        <Link to={`/game/${id}`}>{game.title}</Link>
      </div>
      <h1 className="game-title">เควสเสริม (Substories)</h1>
      <Markdown text={substories.body} />
    </div>
  )
}
