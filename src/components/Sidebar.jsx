import { NavLink, Link } from 'react-router-dom'
import { GAMES } from '../data/games.js'

export default function Sidebar({ open }) {
  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <Link to="/" className="brand">
        <span className="kanji">龍が如く</span>
        <span className="sub">Yakuza Wiki ภาษาไทย</span>
      </Link>

      <div className="nav-section">ไทม์ไลน์ซีรีส์</div>
      {GAMES.map((g) => (
        <NavLink
          key={g.id}
          to={`/game/${g.id}`}
          className={({ isActive }) => `nav-game${isActive ? ' active' : ''}`}
        >
          {g.title.replace('Like a Dragon: ', '').replace(': The Song of Life', '').replace(' Gaiden: The Man Who Erased His Name', ' Gaiden')}
          <span className="yr">{g.year}</span>
          {g.mod.status === 'released' && <span className="mod-dot" title="มีม็อดแปลไทย" />}
        </NavLink>
      ))}

      <div className="nav-section">● = มีม็อดแปลไทยให้โหลด</div>
    </nav>
  )
}
