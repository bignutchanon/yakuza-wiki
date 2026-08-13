import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { newsPosts, thaiDate } from '../content/loader.js'
import Markdown from '../components/Markdown.jsx'

// โพสต์โผล่ไล่จังหวะทีละใบ
const postMotion = (i) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: Math.min(i, 4) * 0.08, ease: 'easeOut' },
})

export default function NewsPage() {
  return (
    <div className="page">
      <h1>ข่าวสาร</h1>
      <p className="game-sub">
        รวมข่าวจาก Ryu Ga Gotoku Studio และเกมใหม่ในเครือ — อัปเดตโดยผู้จัดทำเป็นระยะ ·
        เช็คราคาทุกภาคได้ที่หน้า <Link to="/prices">ราคาเกม</Link>
      </p>

      {newsPosts.map((p, i) => (
        <motion.article key={p.slug} className="news-post" {...postMotion(i)}>
          <div className="news-post-head">
            {p.tag && <span className="badge">{p.tag}</span>}
            <span className="news-post-date">{thaiDate(p.date)}</span>
          </div>
          <Markdown text={`## ${p.title}\n\n${p.body}`} />
        </motion.article>
      ))}
      {newsPosts.length === 0 && <p>ยังไม่มีข่าว</p>}
    </div>
  )
}
