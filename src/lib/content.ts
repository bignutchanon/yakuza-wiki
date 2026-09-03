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
import { thaiDate } from './format'

export interface Chapter {
  n: number
  title: string
  thai: string
  part: string
  body: string
}

// เนื้อหาไกด์เสริม/substories — meta เป็น frontmatter ดิบ (key-value string ล้วน)
export interface MetaBody {
  meta: Record<string, string>
  body: string
}

export interface GameContent {
  chapters: Chapter[]
  substories: MetaBody | null
  guide: MetaBody | null
}

export interface LoreArticle {
  slug: string
  title: string
  order: number
  body: string
  /** ย่อหน้าแรกแบบข้อความล้วน — ใช้เป็น meta description และคำโปรยในสารบัญ */
  excerpt: string
}

export interface NewsPost {
  slug: string
  title: string
  date: string
  tag: string
  body: string
  /** ย่อหน้าแรกแบบข้อความล้วน — ใช้เป็น meta description, คำโปรยหน้ารวมข่าว และ <description> ของ RSS */
  excerpt: string
}

export interface Prices {
  updated: string
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content')

function parseFrontmatter(text: string): MetaBody {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { meta: {}, body: text }
  const meta: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i === -1) continue
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: text.slice(m[0].length) }
}

// markdown → ข้อความล้วน (ตัดสัญลักษณ์ทิ้ง เก็บแต่ตัวอักษร) สำหรับ meta description / RSS / llms.txt
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ') // โค้ดบล็อก
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // รูป
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // ลิงก์ → เหลือข้อความ
    .replace(/<[^>]+>/g, ' ') // html ที่แทรกในบทความ
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // หัวข้อ
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '') // bullet / เลขข้อ
    .replace(/^\s*\|.*\|\s*$/gm, ' ') // แถวตาราง (สรุปย่อไม่ควรมีตาราง)
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ย่อหน้าแรกที่มีเนื้อความจริง (ข้ามหัวข้อ/รูป/ตาราง) — ใช้เป็นคำโปรยของบทความ
function firstParagraph(markdown: string): string {
  for (const block of markdown.split(/\r?\n\s*\r?\n/)) {
    const text = plainText(block)
    if (text.length >= 30) return text
  }
  return plainText(markdown)
}

function loadAll() {
  const byGame: Record<string, GameContent> = {}
  const lore: LoreArticle[] = []
  const news: NewsPost[] = []
  let prices: Prices | null = null

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
            excerpt: firstParagraph(body),
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
          excerpt: firstParagraph(body),
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

export const contentFor = (gameId: string): GameContent =>
  byGame[gameId] || { chapters: [], substories: null, guide: null }

export const loreArticles: LoreArticle[] = lore
export const loreBySlug = (slug: string): LoreArticle | undefined => lore.find((a) => a.slug === slug)

// ข่าวเรียงใหม่ → เก่า / gamePrices = เนื้อหาตารางราคา (null ถ้ายังไม่มีไฟล์)
export const newsPosts: NewsPost[] = news
export const newsBySlug = (slug: string): NewsPost | undefined => news.find((p) => p.slug === slug)
export const gamePrices: Prices | null = prices

// re-export เพื่อความเข้ากันได้กับโค้ดเดิมที่ import thaiDate จาก loader.js
export { thaiDate }

// --- เควสเสริมที่ผูกกับบท -------------------------------------------------
// substories.md ของทุกภาคเก็บเป็นตาราง markdown 5 คอลัมน์: # | ชื่อเควส | สถานที่ | ปลดล็อก | สรุป
// คอลัมน์ "ปลดล็อก" มักระบุบทที่เควสเปิด เช่น "บทที่ 4 · ชื่อเสียง 20+" — ดึงเลขบทออกมาผูกกลับไปที่หน้าบทนั้น
// ทำให้หน้าบทบอกได้ว่า "ถึงบทนี้แล้วมีเควสเสริมอะไรเปิดให้เล่นบ้าง" โดยไม่ต้องเขียนข้อมูลซ้ำในสองที่

export interface SubstoryRef {
  /** เลขลำดับในตาราง (คงเป็น string เพราะบางภาคใช้เลขผสมอักษร) */
  no: string
  name: string
  place: string
  unlock: string
  summary: string
}

function parseSubstoryTable(markdown: string): { row: SubstoryRef; chapters: number[] }[] {
  const out: { row: SubstoryRef; chapters: number[] }[] = []

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue // เส้นคั่นหัวตาราง

    const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => plainText(c.trim()))
    if (cells.length < 5) continue
    if (!/^[0-9]/.test(cells[0])) continue // แถวหัวตาราง (คอลัมน์แรกไม่ใช่ตัวเลข)

    const [no, name, place, unlock, summary] = cells
    const chapters = [...new Set([...unlock.matchAll(/บทที่\s*(\d+)/g)].map((m) => Number(m[1])))]
    if (chapters.length === 0) continue

    out.push({ row: { no, name, place, unlock, summary }, chapters })
  }
  return out
}

// gameId → เลขบท → เควสที่เปิดในบทนั้น (คำนวณครั้งเดียวตอน build เหมือนเนื้อหาอื่น)
const substoryIndex: Record<string, Map<number, SubstoryRef[]>> = {}
for (const [gameId, content] of Object.entries(byGame)) {
  if (!content.substories) continue
  const map = new Map<number, SubstoryRef[]>()
  for (const { row, chapters } of parseSubstoryTable(content.substories.body)) {
    for (const n of chapters) {
      const list = map.get(n) ?? []
      list.push(row)
      map.set(n, list)
    }
  }
  substoryIndex[gameId] = map
}

export const substoriesForChapter = (gameId: string, n: number): SubstoryRef[] =>
  substoryIndex[gameId]?.get(n) ?? []
