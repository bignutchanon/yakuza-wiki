# CLAUDE.md — Yakuza Thai Wiki

เว็บ wiki ภาษาไทยของซีรีส์ Yakuza / Like a Dragon ทำโดยแฟนเกม (ไม่เกี่ยวข้องกับ SEGA / RGG Studio)
สรุปเนื้อเรื่องรายบท, ไกด์ substories, บทความ lore, ข่าว, ตารางราคา และ**ลิงก์ดาวน์โหลดม็อดแปลไทย**ของแต่ละภาค

## Stack + คำสั่ง

- Next.js 16 (App Router) + TypeScript (`.ts`/`.tsx`, `strict: true`) + React 19.2 (App Router ต้อง React 19) + framer-motion + marked — **ไม่มี Tailwind, ไม่มี ESLint config ใหม่, ไม่มี test** · hero หน้าแรกเป็นรูปถ่ายในเกม (ไม่มี three.js/WebGL แล้ว)
- `legacy/` (gitignored, เก็บ local) = โค้ด Vite/react-router เดิมไว้อ้างอิง — ไม่ถูก build
- Static export (`output: 'export'`) — build ออกมาเป็น HTML ล้วนทุกหน้า ไม่มี Node server ตอนรันจริง
- `npm run dev` = เปิด dev server · `npm run build` = build ลง `out/`
- Deploy: push ขึ้น `main` → GitHub Actions (`.github/workflows/deploy.yml`) `npm ci` + `npm run build` + อัป `out/` ขึ้น GitHub Pages อัตโนมัติ — โดเมนหลัก **yakuzathai.com** (custom domain ผ่าน `public/CNAME`, ตั้ง DNS ที่ Cloudflare)
- `next.config.mjs`: `output: 'export'` + `trailingSlash: true` + `images: { unoptimized: true }` **ไม่มี basePath** (โดเมนหลัก ไม่ใช่ subpath) — URL ไม่มี `#/` แบบ HashRouter เดิมแล้ว ลิงก์/บุ๊กมาร์กเก่ารูปแบบ `/#/game/y7` ยังใช้ได้ผ่าน `<HashRedirect>` (client component ใน `layout.tsx`) ที่เด้งไป path จริงให้อัตโนมัติ **ห้ามเปลี่ยนกลับไปใช้ BrowserRouter/react-router**

## โครงไฟล์ + data flow

```
src/
  app/
    layout.tsx           html lang=th, <head> (font links, AdSense script/meta ผ่าน next/script), Navbar, footer, CookieConsent, HashRedirect
    template.tsx          page transition (framer-motion, 'use client') ห่อทุกหน้า
    page.tsx               Home
    llms.txt/route.ts      Route Handler static → llms.txt (สเปก llmstxt.org)
    sitemap.ts · robots.ts · not-found.tsx
    game/[id]/              page.tsx + ch/[n]/page.tsx + substories/page.tsx + guide/page.tsx
    lore/                    page.tsx (สารบัญ) + [slug]/page.tsx (บทความ)
    news/ · prices/ · support/ · privacy/    page.tsx
  lib/
    content.ts            ★ server-only (fs) โหลด markdown ทั้งหมดตอน build แทน loader.js เดิม — contentFor(id), loreArticles, loreBySlug(slug), newsPosts, gamePrices
    format.ts               thaiDate() (ไม่มี fs — import ได้ทั้ง server/client component)
    site.ts                  SITE_URL, SITE_NAME, pageMeta({title, description, path, image})
  data/
    games.ts              ★ ข้อมูลหลัก 12 ภาค (GAMES array, type Game/ModInfo) + CITY_MAPS + helper รูป Steam CDN
    screenshots.json        รูป screenshot ราย gameId (ใช้ใน <Screenshots>)
  content/                 ★ เนื้อหา markdown ทั้งหมด (ไม่แตะตอน migrate) — <gameId>/ch-NN.md, substories.md, guide.md · lore/ · news/ (ไฟล์ละโพสต์) + prices.md
  components/              Navbar, Markdown (marked), Credit, Screenshots, HeroScene (hero รูปซุ้มคามุโรโจ + ไฟนีออนกะพริบ, รูปใน public/hero/), HomeGrid, NewsList, CookieConsent, CookieResetButton, HashRedirect
  styles.css               สไตล์ทั้งเว็บไฟล์เดียว (ธีมนีออนแดง-ดำ) — import ใน layout.tsx
public/
  maps/                    แผนที่เมือง self-host (อ้างจาก CITY_MAPS)
  promptpay-qr.png         QR หน้า Support
  CNAME · .nojekyll        GitHub Pages custom domain (yakuzathai.com)
scripts/
  fetch-prices.ps1         ดึงราคา Steam ไทยทุกภาค — ใช้ตอนอัปเดต prices.md (PS/Xbox ต้องเช็คมือ)
```

Flow: `games.ts` = metadata ภาค (ชื่อ/ปี/steamAppId/blurb/mod) → `lib/content.ts` = เนื้อหา markdown → แต่ละหน้า (server component) ประกอบสองอย่างนี้ render ผ่าน `<Markdown>` — component ไหนต้องใช้ state/window/motion ถึงมี `'use client'` (Navbar, CookieConsent, CookieResetButton, HashRedirect, HeroScene, Screenshots, HomeGrid, NewsList, template.tsx) นอกนั้น render markdown ฝั่ง server ให้ HTML อยู่ใน static output ตั้งแต่ build (SEO)

## Routes

`/` Home · `/game/[id]` ภาค · `/game/[id]/ch/[n]` บท · `/game/[id]/substories` · `/game/[id]/guide` · `/lore` + `/lore/[slug]` · `/news` · `/prices` · `/support` · `/privacy` (นโยบายคุกกี้ — คู่กับ AdSense)

ทุก URL จริงลงท้ายด้วย `/` เสมอ (`trailingSlash: true`) เช่น `/game/y7/ch/3/` — ไม่มี `#/` แบบ HashRouter เดิมแล้ว (ดูกติกา HashRedirect ด้านบน)

## AdSense

- script (`next/script`, `strategy="afterInteractive"`) + consent snippet (`strategy="beforeInteractive"`) ใน `src/app/layout.tsx` (pub ID `ca-pub-8021468402008200`) + meta `google-adsense-account` ผ่าน `metadata.other` + `public/ads.txt`
- โดเมนหลักตอนนี้คือ yakuzathai.com เอง (custom domain, ไม่มี basePath) → `public/ads.txt` เสิร์ฟที่ root โดเมนตรง ๆ ไม่ต้องพึ่ง repo แยก `bignutchanon.github.io` redirect แบบตอนอยู่ subpath `/yakuza-wiki/` เหมือนเดิมแล้ว
- แบนเนอร์คุกกี้ `<CookieConsent>` เก็บตัวเลือกใน localStorage key `cookieConsent` (`all`/`essential`) — consent snippet ใน `layout.tsx` อ่านค่าตอนโหลดเพื่อตั้ง `requestNonPersonalizedAds` ก่อนโฆษณาเริ่ม · หน้า `/privacy` มีปุ่มล้างตัวเลือก (`<CookieResetButton>`)

## กติกา content (frontmatter)

- **บท** `src/content/<gameId>/ch-NN.md`: `n` เลขบท, `title` ชื่อ EN ทางการ, `thai` ชื่อไทย, `part` (เฉพาะภาคแบ่งพาร์ท เช่น Y4/Y5) — `src/lib/content.ts` เรียงตาม `n` ไฟล์เนื้อหาคือ source of truth ของรายชื่อบท (ไม่มี list กลาง)
- **lore**: `title`, `order` (เลขเรียงในสารบัญ)
- **news**: `title`, `date` (ISO), `tag` — เรียงใหม่→เก่าอัตโนมัติ
- **prices.md**: `updated` (ISO) — วันที่โชว์หัวตาราง อัปเดตทุกครั้งที่แก้ราคา
- วันที่แสดงผลผ่าน `thaiDate()` ใน `src/lib/format.ts` (ISO → "13 ส.ค. 2026") — `src/lib/content.ts` re-export ตัวเดียวกันไว้ให้ import สะดวก

## กติกา games.js (สำคัญสุด — แก้บ่อย)

- ไฟล์นี้คือ `src/data/games.ts` แล้ว (TypeScript, type `Game`/`ModInfo`) — กติกาด้านล่างทั้งหมดยังใช้เหมือนเดิมทุกข้อ
- `mod.status`: `'released' | 'wip' | 'none'` — ตอน `released` ต้องมี `url` (Google Drive) · `note` กับ `nexus` optional
- `mod.beta` (`{ url, note?, version?, updated? }`) = รุ่นทดสอบที่แจกคู่ตัวจริง → ปุ่มรอง "ลองรุ่นทดสอบ (beta)" ในหน้าเกม + ป้ายมุมแบนเนอร์ · พอ beta ขึ้นเป็นตัวจริงให้ย้ายลิงก์ไป `mod.url` แล้วลบ `mod.beta` ทิ้ง
- ม็อดแปลเสร็จภาคไหน → แก้ entry ภาคนั้น status + url จุดเดียวจบ — ปุ่มดาวน์โหลด (GamePage), ป้าย "มีม็อดแปลไทย" (Home), จุดเขียว (Navbar) โชว์เองหมด
- **ม็อดออกตัวแก้ (patch)**: (1) แก้ `mod.note` เป็น `'v<เวอร์ชัน> (<วันที่>) — <สรุปสั้น>'` (โชว์ต่อท้ายปุ่มดาวน์โหลด) พร้อม `mod.version` + `mod.updated` (ISO) คู่กันเสมอ — สองฟิลด์นี้คือที่มาของป้ายแดงมุมแบนเนอร์ (`modUpdateBadge` ใน `games.ts` โชว์ 30 วันแรก ทั้งการ์ดหน้าแรกและ hero หน้าเกม · เว็บเป็น static export ป้ายจึงหายตอน build ครั้งถัดไป) (2) เขียนข่าว `src/content/news/YYYY-MM-DD-<game>-thai-mod-vXYZ.md` tag `ม็อดแปลไทย`
  โครงข่าว: อาการที่แก้ (ภาษาผู้เล่น ไม่ลงเทคนิคลึก) → วิธีอัปเดต (วางไฟล์ทับ + เซฟเดิมใช้ต่อได้ไหม) → ช่องทางแจ้งบั๊ก (ระบุบท/ฉาก+ภาพหน้าจอ)
  (3) ลิงก์ Drive: ให้เจ้าของอัปเป็น "เวอร์ชันใหม่ของไฟล์เดิม" (Manage versions) ลิงก์ `url` จะไม่เปลี่ยน — ถ้าอัปเป็นไฟล์ใหม่ต้องแก้ `url` ด้วย
  ตัวอย่างล่าสุด: Y8 v1.0.4 (20 ส.ค. 2026) `2026-08-20-y8-thai-mod-v104.md`
- รูป hero/cover ดึงจาก Steam CDN ผ่าน `steamAppId` (ลิงก์เสถียร ไม่เก็บรูปใน repo) — เกมใหม่ที่ Steam ใช้ URL แบบ hashed ให้ใส่ `image` ตรง ๆ แทน

## กติกา / บทเรียน

- รูปทุกจุด © SEGA — ต้องมีเครดิตใต้รูปผ่าน `<Credit>` เสมอ
- รูปจาก Fandom: ตัด `/revision/latest?cb=...` ท้าย URL ออก ไม่งั้นโหลดไม่ขึ้น
- ภาษาไทยทั้งเว็บ ชื่อเกม/ชื่อบท EN คงอังกฤษ — สะกดชื่อตัวละครตาม glossary ของโปรเจกต์ม็อดแปล (เช่น คาซึกะ, ซาเอะจิมะ, โจริว)
- แอนิเมชันทุกจุดผ่าน `MotionConfig reducedMotion="user"` — เคารพ reduced motion

## โปรเจกต์พี่น้อง (ที่มาของม็อดใน games.js)

โปรเจกต์ม็อดแปลไทยอยู่ที่ `D:\Projects\` แยก repo ต่อภาค: `yakuza-0-direct`, `yakuza-kiwami-mod`, `yakuza-kiwami-2-mod`, `yakuza-4-thai` (Yakuza-4-Thai), `yakuza-5`, `yakuza-6-thai`, `yakuza-7-like-a-dragon-thai`, `yakuza-gaiden`, `y8-infinite-wealth`, `pirate-yakuza-hawaii-thai` — แต่ละตัวมี `HANDOFF.md` + `CLAUDE.md` ของตัวเอง ม็อดปล่อยใหม่เมื่อไหร่มาอัปเดตลิงก์ที่นี่

## สถานะม็อดล่าสุด (อัปเดตทุกครั้งที่แตะ games.js)

- **Gaiden (Like a Dragon Gaiden)** — released · v1.0.1 (18 ส.ค. 2026): แก้โป๊กเกอร์/แบล็คแจ็ค (คาสิโน Castle ทุกระดับ) + เครื่อง SEGA Master System เข้าแล้วค้าง — ม็อดเผลอเขียนตารางระบบที่ไม่มีคำแปล + รหัสภายใน (`ok`/`absolute`/`stage`) ถูกแปลติด ไม่ใช่คำแปล · ลิงก์ Drive ใหม่ (`1huUYI0b…`) แทน v1.0 (`1H-ERDEH…`) · รายละเอียดใน `yakuza-gaiden/docs/wiki_update_v1.0.1.md`
- **Y8 (Like a Dragon: Infinite Wealth)** — released · v1.0.4 (20 ส.ค. 2026): แก้เกมเด้งตอนเริ่มเล่นมินิเกม**ครั้งแรก** (ผู้เล่นแจ้งจากดาร์ต) — ต้นตอคือ `controller_guide.bin` (จอแนะนำปุ่มของมินิเกมทุกตัว) ที่ตัวสร้างไฟล์ประกอบใหม่แล้วเลย์เอาต์ไม่ตรงต้นฉบับ ไม่เกี่ยวกับคำแปล (ทดสอบด้วยไฟล์ที่คงข้อความอังกฤษก็ยังเด้ง) · v1.0.4 เปลี่ยนวิธีสร้างไฟล์ทั้งม็อดเป็น patch-in-place (`scripts/patch_text_inplace.py` แก้เฉพาะข้อความ+ตัวชี้ ไบต์อื่นเหมือนต้นฉบับ) 242 ไฟล์ ยกเว้น `sound_auth.bin` ที่ยังใช้วิธีเดิมเพราะต้องคุมขนาดตาม v1.0.3 · คำแปล/ฟอนต์ไม่เปลี่ยน · ลิงก์ Drive ใหม่ (`1DqCgTMz…`) แทน v1.0.3 (`1bHm5d85…`) · รายละเอียดใน `y8-infinite-wealth/docs/patch.md` · v1.0.3 (19 ส.ค.) = Party Chat มั่วในบางเครื่อง (เพดานขนาด `sound_auth.bin`) · v1.0.2 (19 ส.ค.) = Party Chat เป็นไทย + ดาร์ตเด้ง (สาเหตุแรก) + Bonds Bingo · v1.0.1 (16 ส.ค.) = Miss Match ค้าง (reARMP)
- **Y5 (Yakuza 5)** — released · public v1.4 (เนื้อใน build 08.12) + **แจกรุ่นทดสอบ v1.5 beta (build 2026.08.20)** คู่กัน ผ่าน `mod.beta` ใน `games.ts` (ปุ่มรองในหน้าเกม) — beta แก้เมนูร้าน/บาร์ตัวหนังสือเพี้ยน (pointer ร้านค้า 887 จุด) + ซับคัตซีนถูกตัดคำ (แถวหัวเป็นไทย 100%, แถวต่อคงอังกฤษ) · beta เป็นไฟล์ Drive แยก (`1BzWLlaB…`) ไม่ทับตัวจริง (`12eyObyF…`) · ตอน beta ขึ้นเป็นตัวจริงให้อัปทับ id ตัวจริงแล้วถอด `mod.beta` ออก · ตารางเวอร์ชันอยู่ที่ `yakuza-5/release/VERSIONS.md`
- **Y7 (Yakuza: Like a Dragon)** — released · v1.0.3 (16 ส.ค. 2026): แก้บั๊กมินิเกมบริหารธุรกิจ (ป้าย Leader/Member เลื่อน ดาวไม่ขึ้น) + ลิฟต์ทะลุแมป — ทั้งคู่มาจากเครื่องมือสร้างตาราง (reARMP) ไม่ใช่คำแปล รายละเอียดใน `yakuza-7-like-a-dragon-thai/HANDOFF.md`
  · ลิงก์ Drive ปัจจุบัน = zip v1.0.3 (`1e_1ekuu…` อัปเดต 16 ส.ค.) — ทุกเวอร์ชันที่ผ่านมาเจ้าของอัปเป็นไฟล์ใหม่ (ลิงก์เปลี่ยนทุกครั้ง ต้องแก้ `url` ด้วย) · Nexus #197 ("ไม่เมาไม่แปล") = ฐาน font/db ของแพ็กเกจ ต้องมีเครดิตเสมอ
