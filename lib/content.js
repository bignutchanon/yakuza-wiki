// server-side โหลดเนื้อหา markdown ทั้งหมดตอน build (แทน src/content/loader.js เดิมที่ใช้ import.meta.glob ของ Vite)
// โครงไฟล์: src/content/<gameId>/ch-NN.md และ src/content/<gameId>/substories.md
// ทำงานเฉพาะตอน build (node fs) — ห้าม import ไฟล์นี้จาก client component
//
// frontmatter ที่รองรับ:
//   n: เลขบท (เฉพาะ ch-*.md)
//   title: ชื่อบทภาษาอังกฤษ (ทางการ)
//   thai: ชื่อบทภาษาไทย
//   part: ชื่อพาร์ท (ภาคที่แบ่งเป็นพาร์ท เช่น Yakuza 4/5)

import fs from 'node:fs'
import path from 'node:path'
import { thaiDate } from './format.js'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content')

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { meta: {}, body: text }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i === -1) continue
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: text.slice(m[0].length) }
}

function loadAll() {
  const byGame = {}
  const lore = []
  const news = []
  let prices = null

  const dirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())

  for (const dirent of dirs) {
    const gameId = dirent.name
    const dirPath = path.join(CONTENT_DIR, gameId)
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'))

    for (const filename of files) {
      const file = filename.slice(0, -3) // ตัด .md
      const text = fs.readFileSync(path.join(dirPath, filename), 'utf8')
      const { meta, body } = parseFrontmatter(text)

      // โฟลเดอร์ news = กระดานข่าว (ไฟล์ละโพสต์ ชื่อไฟล์ขึ้นต้นด้วยวันที่) + prices.md = ตารางราคาเกม
      if (gameId === 'news') {
        if (file === 'prices') {
          prices = { updated: meta.updated || '', body }
        } else {
          news.push({
            slug: file,
            title: meta.title || file,
            date: meta.date || file.slice(0, 10),
            tag: meta.tag || '',
            body,
          })
        }
        continue
      }
      // โฟลเดอร์ lore = บทความเสริม (ไทม์ไลน์/องค์กร/ตัวละคร/สถานที่) ไม่ใช่บทของเกม
      if (gameId === 'lore') {
        lore.push({
          slug: file,
          title: meta.title || file,
          order: Number(meta.order ?? 99),
          body,
        })
        continue
      }
      byGame[gameId] ??= { chapters: [], substories: null, guide: null }
      if (file === 'substories') {
        byGame[gameId].substories = { meta, body }
      } else if (file === 'guide') {
        // guide.md = ไกด์เสริมของภาค (เช่นไกด์ RPG ของภาค 7/8)
        byGame[gameId].guide = { meta, body }
      } else if (file.startsWith('ch-')) {
        byGame[gameId].chapters.push({
          n: Number(meta.n ?? file.replace('ch-', '')),
          title: meta.title || '',
          thai: meta.thai || '',
          part: meta.part || '',
          body,
        })
      }
    }
  }

  for (const g of Object.values(byGame)) g.chapters.sort((a, b) => a.n - b.n)
  lore.sort((a, b) => a.order - b.order)
  news.sort((a, b) => b.date.localeCompare(a.date)) // ใหม่ → เก่า

  return { byGame, lore, news, prices }
}

// คำนวณครั้งเดียวตอน build (module-level cache) — ไฟล์นี้ถูก import เฉพาะฝั่ง server
const { byGame, lore, news, prices } = loadAll()

export const contentFor = (gameId) =>
  byGame[gameId] || { chapters: [], substories: null, guide: null }

export const loreArticles = lore
export const loreBySlug = (slug) => lore.find((a) => a.slug === slug)

// ข่าวเรียงใหม่ → เก่า / gamePrices = เนื้อหาตารางราคา (null ถ้ายังไม่มีไฟล์)
export const newsPosts = news
export const gamePrices = prices

// re-export เพื่อความเข้ากันได้กับโค้ดเดิมที่ import thaiDate จาก loader.js
export { thaiDate }
