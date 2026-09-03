// ตัวสร้าง JSON-LD (schema.org) ใช้ร่วมกันทุกหน้า — เรนเดอร์ผ่าน <JsonLd> ฝั่ง server ตอน build
// เป้าหมายสองอย่าง: rich result ของ Google และให้ผู้ช่วย AI (ChatGPT/Gemini/Claude) อ่านแล้วรู้ว่าหน้านี้คืออะไร
// ไม่มี fs — import ได้ทั้ง server และ client (แต่ปกติเรียกจาก server component เท่านั้น)

import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  AUTHOR_NAME,
  CONTACT_EMAIL,
  GITHUB_URL,
  absUrl,
  clip,
} from './site'
import type { Game } from '@/data/games'

// @id คงที่ ใช้ให้โหนดอื่นอ้างถึงได้โดยไม่ต้องประกาศซ้ำทั้งก้อน
export const ORG_ID = `${SITE_URL}/#org`
export const SITE_ID = `${SITE_URL}/#website`
// ผู้เขียนตัวจริง — บทความทุกหน้าอ้างโหนดนี้เป็น author แทนที่จะเป็นองค์กรลอย ๆ
export const PERSON_ID = `${SITE_URL}/#person`

export type JsonLdNode = Record<string, unknown>

// โหนดรากของทั้งเว็บ (อยู่ใน layout จึงติดไปทุกหน้า) — บอกว่าใครทำ เว็บชื่ออะไร ภาษาอะไร
export function siteJsonLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: AUTHOR_NAME,
        url: `${SITE_URL}/about/`,
        email: CONTACT_EMAIL,
        sameAs: [GITHUB_URL],
        knowsLanguage: ['th-TH', 'en'],
        description:
          'แฟนเกมชาวไทยที่ทำม็อดแปลภาษาไทยของซีรีส์ Yakuza / Like a Dragon และเขียนเนื้อหาทั้งหมดในเว็บนี้',
      },
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: SITE_NAME,
        alternateName: ['Yakuza Thai Wiki', 'ยากูซ่าไทยวิกิ'],
        url: `${SITE_URL}/`,
        logo: absUrl('/icon-512.png'),
        email: CONTACT_EMAIL,
        founder: { '@id': PERSON_ID },
        sameAs: [GITHUB_URL],
        description:
          'กลุ่มแฟนเกมชาวไทยที่ทำวิกิสรุปเนื้อเรื่องซีรีส์ Yakuza / Like a Dragon และม็อดแปลไทยของแต่ละภาค ไม่มีส่วนเกี่ยวข้องกับ SEGA หรือ Ryu Ga Gotoku Studio',
      },
      {
        '@type': 'WebSite',
        '@id': SITE_ID,
        name: SITE_NAME,
        alternateName: 'Yakuza Thai Wiki',
        url: `${SITE_URL}/`,
        inLanguage: 'th-TH',
        publisher: { '@id': ORG_ID },
      },
    ],
  }
}

export interface Crumb {
  name: string
  path: string
}

// เส้นทางนำทาง — ทุกหน้าที่ลึกกว่าหน้าแรกควรมี (Google ใช้แสดงแทน URL ดิบในผลค้นหา)
export function breadcrumbJsonLd(trail: Crumb[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'หน้าแรก', path: '/' }, ...trail].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  }
}

export interface ArticleJsonLdOptions {
  /** 'BlogPosting' = ข่าว · 'Article' = บทความ lore / สรุปเนื้อเรื่องรายบท */
  type?: 'Article' | 'BlogPosting'
  headline: string
  description: string
  path: string
  image?: string
  datePublished?: string
  dateModified?: string
  /** หมวดของบทความ เช่น 'ข่าวสาร' หรือชื่อภาคเกม */
  section?: string
}

export function articleJsonLd({
  type = 'Article',
  headline,
  description,
  path: pagePath,
  image,
  datePublished,
  dateModified,
  section,
}: ArticleJsonLdOptions): JsonLdNode {
  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: clip(headline, 110), // schema.org กำหนดเพดาน headline ที่ 110 ตัวอักษร
    description: clip(description),
    mainEntityOfPage: absUrl(pagePath),
    url: absUrl(pagePath),
    inLanguage: 'th-TH',
    image: absUrl(image ?? DEFAULT_OG_IMAGE),
    isPartOf: { '@id': SITE_ID },
    publisher: { '@id': ORG_ID },
    author: { '@id': PERSON_ID },
  }
  if (datePublished) node.datePublished = datePublished
  if (dateModified ?? datePublished) node.dateModified = dateModified ?? datePublished
  if (section) node.articleSection = section
  return node
}

// หน้าเกม — VideoGame ตัวเต็ม (เดิมมีแค่ name/url/image) ให้เครื่องมือค้นหาจับคู่กับเกมจริงได้
export function videoGameJsonLd(game: Game, pagePath: string, image: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    alternateName: game.subtitle,
    url: absUrl(pagePath),
    image,
    description: clip(game.blurb, 300),
    inLanguage: 'th-TH',
    gamePlatform: ['PC', 'PlayStation', 'Xbox'],
    publisher: { '@type': 'Organization', name: 'SEGA' },
    author: { '@type': 'Organization', name: 'Ryu Ga Gotoku Studio' },
    datePublished: String(game.releaseYear),
    character: game.protagonists.map((name) => ({ '@type': 'Person', name })),
    contentLocation: { '@type': 'Place', name: game.setting },
    subjectOf: { '@id': SITE_ID },
  }
}

// ม็อดแปลไทยของภาคที่ปล่อยแล้ว — ประกาศเป็นซอฟต์แวร์แจกฟรี พร้อมเวอร์ชัน/วันที่/ลิงก์โหลด
// นี่คือสิ่งที่คนถามผู้ช่วย AI บ่อยที่สุด ("ม็อดแปลไทย <ภาค> มีไหม โหลดที่ไหน") — ต้องอ่านออกโดยไม่ต้องเดาจากข้อความ
export function modJsonLd(game: Game, pagePath: string, image: string): JsonLdNode | null {
  if (game.mod.status !== 'released' || !game.mod.url) return null

  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `ม็อดแปลไทย ${game.title}`,
    alternateName: `${game.title} Thai Translation Mod`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Windows',
    url: absUrl(pagePath),
    image,
    downloadUrl: game.mod.url,
    inLanguage: 'th-TH',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
    author: { '@id': ORG_ID },
    description: `ม็อดแปลภาษาไทยของ ${game.title} แจกฟรีโดยแฟนเกม ติดตั้งทับเกมต้นฉบับบน PC`,
  }
  if (game.mod.version) node.softwareVersion = game.mod.version
  if (game.mod.updated) node.dateModified = game.mod.updated
  return node
}

// หน้า /about — ประกาศว่าใครอยู่เบื้องหลังเว็บ (E-E-A-T: ผู้อ่านและเครื่องมือค้นหาต้องตรวจสอบตัวตนผู้เขียนได้)
export function aboutPageJsonLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `เกี่ยวกับ ${SITE_NAME}`,
    url: absUrl('/about/'),
    inLanguage: 'th-TH',
    isPartOf: { '@id': SITE_ID },
    mainEntity: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
  }
}
