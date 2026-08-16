# แผน migrate Vite+HashRouter → Next.js (App Router, static export)

เป้าหมาย: SEO ได้จริง (HTML ต่อหน้า, metadata, sitemap) + ย้ายขึ้นโดเมน **https://yakuzathai.com** (ซื้อแล้วที่ Cloudflare 16 ส.ค. 2026)
Deploy ยังเป็น GitHub Pages ผ่าน Actions เหมือนเดิม (custom domain ผ่าน `public/CNAME`)

## การตัดสินใจ (ล็อกแล้ว — ห้ามเปลี่ยนโดยไม่ถาม)

- **Next 16 (latest) + App Router + JavaScript ล้วน (.jsx/.js) — ไม่มี TypeScript, ไม่มี Tailwind, ไม่มี ESLint config ใหม่**
- `next.config.mjs`: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }` — **ไม่มี basePath** (root domain)
- URL ใหม่ = path เดิมแต่ไม่มี `#/` : `/game/y7/`, `/game/y7/ch/3/`, `/lore/timeline/`, `/news/`, `/prices/`, `/support/`, `/privacy/`
- โครงไฟล์ใหม่:
  ```
  app/
    layout.jsx          html lang=th, <head> (fonts link, AdSense script + consent snippet ผ่าน next/script), Navbar, footer, CookieConsent, HashRedirect
    template.jsx        'use client' — page transition (framer-motion, initial/animate เท่านั้น ไม่มี exit) ห่อด้วย MotionConfig reducedMotion="user"
    page.jsx            Home
    game/[id]/page.jsx  + ch/[n]/page.jsx + substories/page.jsx + guide/page.jsx
    lore/page.jsx + lore/[slug]/page.jsx
    news/page.jsx · prices/page.jsx · support/page.jsx · privacy/page.jsx
    sitemap.js · robots.js · not-found.jsx
  lib/
    content.js          server-only (fs) แทน src/content/loader.js — API เดิมเป๊ะ: contentFor(id), loreArticles, loreBySlug, newsPosts, gamePrices
    format.js           thaiDate() (ไม่มี fs — ใช้ได้ทั้ง server/client)
    site.js             SITE_URL='https://yakuzathai.com', SITE_NAME, ฟังก์ชัน pageMeta({title, description, path}) คืน object สำหรับ generateMetadata
  src/data/games.js, screenshots.json  คงที่เดิม (แก้ CITY_MAPS img './maps/x.png' → '/maps/x.png')
  src/components/      คงที่เดิม แต่: Link จาก next/link (prop href แทน to) · ตัวที่ใช้ state/window ใส่ 'use client'
  src/content/**/*.md  ไม่แตะ
  src/styles.css       ไม่แตะเนื้อหา — import ใน app/layout.jsx
  public/              เพิ่ม CNAME (yakuzathai.com) + .nojekyll · ads.txt/maps/promptpay-qr.png คงเดิม
  ```
- ลบทิ้งเมื่อจบ: `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, `src/pages/`, `src/content/loader.js`, dep vite/@vitejs/plugin-react/react-router-dom
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
