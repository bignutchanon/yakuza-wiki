'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GAMES } from '@/data/games'
import { LogoMark } from '@/components/Logo'

// ชื่อย่อสำหรับเมนู — ตัด prefix/suffix ยาว ๆ ออก
const shortTitle = (t: string): string =>
  t
    .replace('Like a Dragon: ', '')
    .replace(': The Song of Life', '')
    .replace(' Gaiden: The Man Who Erased His Name', ' Gaiden')

export default function Navbar() {
  const [open, setOpen] = useState(false) // เมนูมือถือ
  const [gamesOpen, setGamesOpen] = useState(false) // dropdown รายชื่อภาค
  const pathname = usePathname()

  // ปิดเมนูทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    setOpen(false)
    setGamesOpen(false)
  }, [pathname])

  // แทนที่ NavLink ของ react-router: root ต้อง exact เท่านั้น ที่เหลือ active ทั้งตัวเองและ path ย่อย
  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
  const navLinkClass = (href: string): string => `nav-link${isActive(href) ? ' active' : ''}`

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <LogoMark size={30} full className="brand-mark" />
          <span className="brand-text">
            <span className="kanji">龍が如く</span>
            <span className="sub">Yakuza Wiki ภาษาไทย</span>
          </span>
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
          <Link href="/" className={navLinkClass('/')}>
            หน้าแรก
          </Link>

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
                <Link
                  key={g.id}
                  href={`/game/${g.id}`}
                  className={`nav-game${isActive(`/game/${g.id}`) ? ' active' : ''}`}
                >
                  {shortTitle(g.title)}
                  <span className="yr">{g.year}</span>
                  {g.mod.status === 'released' && <span className="mod-dot" title="มีม็อดแปลไทย" />}
                </Link>
              ))}
              <div className="nav-menu-note">● = มีม็อดแปลไทยให้โหลด · เรียงตามไทม์ไลน์</div>
            </div>
          </div>

          <Link href="/news" className={navLinkClass('/news')}>
            ข่าวสาร
          </Link>
          <Link href="/prices" className={navLinkClass('/prices')}>
            ราคาเกม
          </Link>
          <Link href="/lore" className={navLinkClass('/lore')}>
            Lore
          </Link>
          <Link href="/support" className={navLinkClass('/support')}>
            ♥ สนับสนุน
          </Link>
        </nav>
      </div>
    </header>
  )
}
