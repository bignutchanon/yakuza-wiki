import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// out/robots.txt — allow ทั้งหมด + ชี้ไปที่ sitemap
// static export ต้องประกาศ force-static ตรง ๆ เหมือน sitemap.ts ไม่งั้น build fail
export const dynamic = 'force-static'

// บอตของผู้ช่วย AI / เครื่องมือค้นหาแบบ AI — ประกาศอนุญาตแยกเป็นรายตัว
// ถึงกฎ `*` จะครอบให้อยู่แล้ว แต่บอตหลายตัว (เช่น Google-Extended, Applebot-Extended) ถือว่า
// "ไม่ระบุชื่อตัวเอง" = ไม่ได้รับอนุญาตให้ใช้เนื้อหา การเขียนชื่อไว้ตรง ๆ จึงเป็นการยืนยันเจตนา
// ว่าเว็บนี้ยินดีให้ ChatGPT / Gemini / Claude / Perplexity อ่านและอ้างอิงถึงได้
const AI_AGENTS = [
  'GPTBot', // ChatGPT — เก็บข้อมูลไปเทรน/ตอบ
  'OAI-SearchBot', // ChatGPT Search
  'ChatGPT-User', // ChatGPT เปิดลิงก์ตามคำสั่งผู้ใช้
  'ClaudeBot', // Claude
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended', // Gemini / Google AI Overviews
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended', // Apple Intelligence
  'CCBot', // Common Crawl — เป็นฐานข้อมูลตั้งต้นของโมเดลจำนวนมาก
  'meta-externalagent', // Meta AI
  'Amazonbot',
  'DuckAssistBot',
  'cohere-ai',
  'YouBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: AI_AGENTS, allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
