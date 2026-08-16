# แผน migrate Vite+HashRouter → Next.js (App Router, static export)

เป้าหมาย: SEO ได้จริง (HTML ต่อหน้า, metadata, sitemap) + ย้ายขึ้นโดเมน **https://yakuzathai.com** (ซื้อแล้วที่ Cloudflare 16 ส.ค. 2026)
Deploy ยังเป็น GitHub Pages ผ่าน Actions เหมือนเดิม (custom domain ผ่าน `public/CNAME`)

## การตัดสินใจ (ล็อกแล้ว — ห้ามเปลี่ยนโดยไม่ถาม)

- **Next 16 (latest) + App Router + TypeScript (.tsx/.ts, `strict: true`) — ไม่มี Tailwind, ไม่มี ESLint config ใหม่** (เดิมวางเป็น JS — user สั่งเปลี่ยนเป็น TSX 16 ส.ค.)
- **ทุกอย่างอยู่ใต้ `src/`**: `src/app/`, `src/lib/`, `src/components/`, `src/data/`, `src/content/` (user สั่ง) · ระหว่าง migrate ย้าย `src/pages/`+`src/App.jsx`+`src/main.jsx`+`src/content/loader.js` ไป `legacy/` (root) ให้ agent อ่านอ้างอิงได้ — ลบทิ้งตอนจบ
- `next.config.mjs`: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }` — **ไม่มี basePath** (root domain)
- URL ใหม่ = path เดิมแต่ไม่มี `#/` : `/game/y7/`, `/game/y7/ch/3/`, `/lore/timeline/`, `/news/`, `/prices/`, `/support/`, `/privacy/`
- โครงไฟล์ใหม่:
  ```
  src/app/
    layout.tsx          html lang=th, <head> (fonts link, AdSense script + consent snippet ผ่าน next/script), Navbar, footer, CookieConsent, HashRedirect
    llms.txt/route.ts   Route Handler static (`export const dynamic = 'force-static'`) สร้าง llms.txt ตามสเปก llmstxt.org: H1 ชื่อเว็บ + blockquote สรุป + section ต่อหมวด (ภาค → ลิงก์หน้าภาค/บท/substories/guide, Lore, ข่าว, ราคา, ม็อดแปลไทย) เป็น markdown list `- [title](absolute url): คำอธิบายสั้น` (user สั่ง)
    template.tsx        'use client' — page transition (framer-motion, initial/animate เท่านั้น ไม่มี exit) ห่อด้วย MotionConfig reducedMotion="user"
    page.tsx            Home
    game/[id]/page.tsx  + ch/[n]/page.tsx + substories/page.tsx + guide/page.tsx
    lore/page.tsx + lore/[slug]/page.tsx
    news/page.tsx · prices/page.tsx · support/page.tsx · privacy/page.tsx
    sitemap.ts · robots.ts · not-found.tsx
  src/lib/
    content.ts          server-only (fs) แทน loader.js — API เดิมเป๊ะ: contentFor(id), loreArticles, loreBySlug, newsPosts, gamePrices + export type Chapter/GameContent/LoreArticle/NewsPost
    format.ts           thaiDate() (ไม่มี fs — ใช้ได้ทั้ง server/client)
    site.ts             SITE_URL='https://yakuzathai.com', SITE_NAME, pageMeta({title, description, path, image}): Metadata
  src/data/games.ts (แปลงจาก games.js + type Game/ModInfo), screenshots.json  (CITY_MAPS img '/maps/x.png')
  src/components/*.tsx  Link จาก next/link (prop href แทน to) · ตัวที่ใช้ state/window ใส่ 'use client'
  src/content/**/*.md  ไม่แตะ
  src/styles.css       ไม่แตะเนื้อหา — import ใน app/layout.jsx
  public/              เพิ่ม CNAME (yakuzathai.com) + .nojekyll · ads.txt/maps/promptpay-qr.png คงเดิม
  ```
- ลบทิ้งเมื่อจบ: `index.html`, `vite.config.js`, dep vite/@vitejs/plugin-react/react-router-dom · `legacy/` เก็บไว้ในเครื่อง (gitignored) ตามที่ user สั่ง
- **Server component เป็นค่าเริ่มต้น** — หน้าเนื้อหาทั้งหมด render markdown ฝั่ง server (marked) ให้ HTML อยู่ใน static output (SEO)
  · `'use client'` เฉพาะ: Navbar (useState + usePathname), CookieConsent, NeonScene (three — โหลดผ่าน `next/dynamic` `ssr:false` จาก client wrapper), Screenshots (useState), template.jsx, HashRedirect, ปุ่มล้างคุกกี้ใน privacy (แยกเป็น component เล็ก), Home การ์ด motion (แยก `HomeGrid` client) 
- **HashRedirect** (client, ใน layout): ตอน mount ถ้า `location.hash` ขึ้นต้น `#/` → `router.replace(hash.slice(1))` (บุ๊กมาร์กเก่า `/#/game/y7` ยังใช้ได้) · **Markdown component**: แทน `href="#/` → `href="/` ตอน render (ข่าว 3 ไฟล์ลิงก์แบบเก่า)
- **Metadata**: ทุก page export `generateMetadata`/`metadata` ผ่าน `pageMeta()` — title รูปแบบ `<หน้า> — Yakuza Wiki ภาษาไทย`, description ไทย, `alternates.canonical`, openGraph (image = gameImage ของภาคถ้ามี), `metadataBase = new URL(SITE_URL)` ใน layout · `sitemap.js` ครอบทุก URL static (จาก GAMES × chapters/substories/guide + lore + หน้ารวม) · `robots.js` allow all + sitemap URL
- AdSense: `<meta name="google-adsense-account">` ผ่าน metadata `other` · inline consent snippet `beforeInteractive` + adsbygoogle script `afterInteractive` ด้วย `next/script` — logic localStorage `cookieConsent` เหมือนเดิมทุกตัวอักษร
- Fonts: คง `<link>` Google Fonts เดิม (Kanit/Sarabun) ใน layout — ไม่เปลี่ยน CSS
- Workflow `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → upload `out/` (แทน dist)
- ห้าม: BrowserRouter/react-router · ห้ามเปลี่ยน class name ใน JSX (CSS เดิมต้อง match) · ห้ามเขียนเนื้อหา markdown ใหม่

## ขั้นตอน (ทีม sonnet)

1. **Stage 1 (agent เดียว)**: scaffold + lib + layout/template + components ที่แชร์ + Home + HashRedirect + `npm run build` ผ่าน (route อื่นยังไม่มี)
2. **Stage 2 (2 agents ขนาน)**: A = routes game/* · B = lore/news/prices/support/privacy + sitemap/robots/not-found + workflow + ลบไฟล์ Vite
3. **Stage 3**: lead build ตรวจ: จำนวนหน้าใน out/ = 1 + 12 game + ~200 ch + substories/guide + lore + 5 · เปิด dev เช็คลิงก์/CSS · เทียบ visual กับ main
4. Merge → push → ตั้ง DNS Cloudflare (CNAME apex → bignutchanon.github.io, DNS-only) + GitHub Pages custom domain + Enforce HTTPS → อัป CLAUDE.md

## สถานะ (16 ส.ค. 2026)

- Stage 1/1b/2A/2B เสร็จบน branch `next-migration` — build 192 หน้า (บท 151/151, substories 11, guide 2, lore 5), sitemap 187 URL, robots/llms.txt/404/CNAME/.nojekyll ครบ, `tsc --noEmit` ผ่าน, className จาก legacy ครบทุกตัว
- บทเรียน: Next 16 App Router รัน React 19 → ต้องอัป `@react-three/fiber` 9 + react `~19.2` (r3f 9 peer `<19.3`) ไม่งั้นพัง `ReactCurrentOwner` ตอน dev · `robots.ts`/`sitemap.ts`/route handler ต้อง `export const dynamic = 'force-static'` ใต้ `output: 'export'` · `@types/react` ต้องตรง major กับ react
- ✅ 16 ส.ค. 2026 ค่ำ: DNS Cloudflare (A ×4 → 185.199.108-111.153 + CNAME www, DNS only) → GitHub custom domain ผ่าน `gh api` (ต้องถอด-ใส่โดเมนใหม่ 1 รอบถึง trigger cert) → cert approved + Enforce HTTPS → merge `next-migration` → `main` (`448ef5d`) → deploy ผ่าน · smoke test ทุก path 200, 404 ทำงาน, github.io/yakuza-wiki 301 → yakuzathai.com
- ต่อไป (งาน user): Google Search Console เพิ่ม property `yakuzathai.com` (Domain, verify TXT ที่ Cloudflare) + submit `https://yakuzathai.com/sitemap.xml` · AdSense เพิ่มเว็บ yakuzathai.com (ads.txt เสิร์ฟจาก root แล้ว) · repo `bignutchanon.github.io` ไม่จำเป็นแล้ว
