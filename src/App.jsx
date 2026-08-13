import { useEffect } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { MotionConfig, AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import GamePage from './pages/GamePage.jsx'
import ChapterPage from './pages/ChapterPage.jsx'
import SubstoriesPage from './pages/SubstoriesPage.jsx'
import GuidePage from './pages/GuidePage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import LorePage from './pages/LorePage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import PricesPage from './pages/PricesPage.jsx'

export default function App() {
  const location = useLocation()

  // เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า (เมนูปิดตัวเองใน Navbar)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app">
      <Navbar />
      <div className="main">
        {/* เปลี่ยนหน้าแบบ fade+slide — MotionConfig เคารพ reduced motion ของผู้ใช้ */}
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/game/:id/ch/:n" element={<ChapterPage />} />
                <Route path="/game/:id/substories" element={<SubstoriesPage />} />
                <Route path="/game/:id/guide" element={<GuidePage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/prices" element={<PricesPage />} />
                <Route path="/lore" element={<LorePage />} />
                <Route path="/lore/:slug" element={<LorePage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </MotionConfig>
        <footer className="site-footer">
          <p className="footer-support">
            เว็บนี้ทำด้วยใจโดยแฟนเกม — ถ้ามีประโยชน์{' '}
            <Link to="/support">เลี้ยงกาแฟผู้จัดทำได้ที่นี่ ♥</Link>
          </p>
          เว็บ wiki โดยแฟนเกม ทำขึ้นเพื่อแชร์ในกลุ่มผู้เล่นเท่านั้น ไม่มีส่วนเกี่ยวข้องกับ SEGA / Ryu Ga Gotoku Studio
          <br />
          ภาพประกอบทั้งหมด © SEGA — ใช้เพื่อการอ้างอิงพร้อมระบุที่มาใต้ภาพ
        </footer>
      </div>
    </div>
  )
}
