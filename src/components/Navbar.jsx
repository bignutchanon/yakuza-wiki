import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { GAMES } from '../data/games.js'

// ชื่อย่อสำหรับเมนู — ตัด prefix/suffix ยาว ๆ ออก
const shortTitle = (t) =>
  t
    .replace('Like a Dragon: ', '')
    .replace(': The Song of Life', '')
    .replace(' Gaiden: The Man Who Erased His Name', ' Gaiden')

export default function Navbar() {
  const [open, setOpen] = useState(false) // เมนูมือถือ
  const [gamesOpen, setGamesOpen] = useState(false) // dropdown รายชื่อภาค
  const location = useLocation()

  // ปิดเมนูทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    setOpen(false)
    setGamesOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="kanji">龍が如く</span>
          <span className="sub">Yakuza Wiki ภาษาไทย</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          ☰ เมนู
        </button>

        <nav className={`nav-links${open ? ' open' : ''}`}>
          <NavLink to="/" end className={navLinkClass}>
            หน้าแรก
          </NavLink>

          <div className={`nav-dropdown${gamesOpen ? ' open' : ''}`}>
            <button
              type="button"
              className="nav-link nav-drop-btn"
              onClick={() => setGamesOpen((v) => !v)}
              aria-expanded={gamesOpen}
            >
              ภาคทั้งหมด ▾
            </button>
            <div className="nav-menu">
              {GAMES.map((g) => (
                <NavLink
                  key={g.id}
                  to={`/game/${g.id}`}
                  className={({ isActive }) => `nav-game${isActive ? ' active' : ''}`}
                >
                  {shortTitle(g.title)}
                  <span className="yr">{g.year}</span>
                  {g.mod.status === 'released' && <span className="mod-dot" title="มีม็อดแปลไทย" />}
                </NavLink>
              ))}
              <div className="nav-menu-note">● = มีม็อดแปลไทยให้โหลด · เรียงตามไทม์ไลน์</div>
            </div>
          </div>

          <NavLink to="/news" className={navLinkClass}>
            ข่าวสาร
          </NavLink>
          <NavLink to="/prices" className={navLinkClass}>
            ราคาเกม
          </NavLink>
          <NavLink to="/lore" className={navLinkClass}>
            Lore
          </NavLink>
          <NavLink to="/support" className={navLinkClass}>
            ♥ สนับสนุน
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
