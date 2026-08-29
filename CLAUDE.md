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
    llms.txt/route.ts      Route Handler static → llms.txt (สเปก llmstxt.org — สารบัญ + สถานะม็อดรายภาค)
    llms-full.txt/route.ts   เนื้อหา markdown ทั้งเว็บรวมไฟล์เดียว (~1.3 MB) ให้ผู้ช่วย AI อ่านทีเดียวจบ
    feed.xml/route.ts        ฟีด RSS ของข่าว (ลิงก์ไป /news/<slug>/)
    sitemap.ts · robots.ts · not-found.tsx
    game/[id]/              page.tsx + ch/[n]/page.tsx + substories/page.tsx + guide/page.tsx
    lore/                    page.tsx (สารบัญ) + [slug]/page.tsx (บทความ)
    news/                    page.tsx (สารบัญ ย่อหน้าแรก) + [slug]/page.tsx (โพสต์เต็ม)
    prices/ · support/ · privacy/ · report/   page.tsx
  lib/
    content.ts            ★ server-only (fs) โหลด markdown ทั้งหมดตอน build แทน loader.js เดิม — contentFor(id), loreArticles, loreBySlug(slug), newsPosts, gamePrices
    format.ts               thaiDate() (ไม่มี fs — import ได้ทั้ง server/client component)
    site.ts                  SITE_URL, SITE_NAME, pageMeta({title, description, path, image, type, publishedTime}), clip() ตัดข้อความไม่ให้ขาดกลางคำ, absUrl()
    seo.ts                    ตัวสร้าง JSON-LD: siteJsonLd (Organization+WebSite ใน layout), breadcrumbJsonLd, articleJsonLd, videoGameJsonLd, modJsonLd
  data/
    games.ts              ★ ข้อมูลหลัก 15 ภาค (รวม Judgment / Lost Judgment / Ishin!) (GAMES array, type Game/ModInfo) + CITY_MAPS + helper รูป Steam CDN
    screenshots.json        รูป screenshot ราย gameId (ใช้ใน <Screenshots>)
  content/                 ★ เนื้อหา markdown ทั้งหมด (ไม่แตะตอน migrate) — <gameId>/ch-NN.md, substories.md, guide.md · lore/ · news/ (ไฟล์ละโพสต์) + prices.md
  components/              Navbar, Markdown (marked), JsonLd, Credit, Screenshots, HeroScene (hero รูปซุ้มคามุโรโจ + ไฟนีออนกะพริบ, รูปใน public/hero/), HomeGrid, NewsList, CookieConsent, CookieResetButton, HashRedirect
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

`/` Home · `/game/[id]` ภาค · `/game/[id]/ch/[n]` บท · `/game/[id]/substories` · `/game/[id]/guide` · `/lore` + `/lore/[slug]` · `/news` + `/news/[slug]` · `/prices` · `/report` · `/support` · `/privacy` (นโยบายคุกกี้ — คู่กับ AdSense)

ไฟล์ที่ไม่ใช่หน้าเว็บ: `/sitemap.xml` · `/robots.txt` · `/feed.xml` (RSS ข่าว) · `/llms.txt` + `/llms-full.txt`

ทุก URL จริงลงท้ายด้วย `/` เสมอ (`trailingSlash: true`) เช่น `/game/y7/ch/3/` — ไม่มี `#/` แบบ HashRouter เดิมแล้ว (ดูกติกา HashRedirect ด้านบน)

## AdSense

- script (`next/script`, `strategy="afterInteractive"`) + consent snippet (`strategy="beforeInteractive"`) ใน `src/app/layout.tsx` (pub ID `ca-pub-8021468402008200`) + meta `google-adsense-account` ผ่าน `metadata.other` + `public/ads.txt`
- โดเมนหลักตอนนี้คือ yakuzathai.com เอง (custom domain, ไม่มี basePath) → `public/ads.txt` เสิร์ฟที่ root โดเมนตรง ๆ ไม่ต้องพึ่ง repo แยก `bignutchanon.github.io` redirect แบบตอนอยู่ subpath `/yakuza-wiki/` เหมือนเดิมแล้ว
- แบนเนอร์คุกกี้ `<CookieConsent>` เก็บตัวเลือกใน localStorage key `cookieConsent` (`all`/`essential`) — consent snippet ใน `layout.tsx` อ่านค่าตอนโหลดเพื่อตั้ง `requestNonPersonalizedAds` ก่อนโฆษณาเริ่ม · หน้า `/privacy` มีปุ่มล้างตัวเลือก (`<CookieResetButton>`)

## กติกา content (frontmatter)

- **บท** `src/content/<gameId>/ch-NN.md`: `n` เลขบท, `title` ชื่อ EN ทางการ, `thai` ชื่อไทย, `part` (เฉพาะภาคแบ่งพาร์ท เช่น Y4/Y5) — `src/lib/content.ts` เรียงตาม `n` ไฟล์เนื้อหาคือ source of truth ของรายชื่อบท (ไม่มี list กลาง)
- **lore**: `title`, `order` (เลขเรียงในสารบัญ)
- **news**: `title`, `date` (ISO), `tag` — เรียงใหม่→เก่าอัตโนมัติ · ชื่อไฟล์ = slug ของ URL `/news/<slug>/` (เปลี่ยนชื่อไฟล์ = ลิงก์เดิมตาย) · ย่อหน้าแรกถูกดึงเป็นคำโปรย/meta description อัตโนมัติ (`excerpt`) จึงควรเป็นประโยคที่สรุปข่าวได้ด้วยตัวเอง ไม่ใช่เกริ่นลอย ๆ
- **prices.md**: `updated` (ISO) — วันที่โชว์หัวตาราง อัปเดตทุกครั้งที่แก้ราคา
- วันที่แสดงผลผ่าน `thaiDate()` ใน `src/lib/format.ts` (ISO → "13 ส.ค. 2026") — `src/lib/content.ts` re-export ตัวเดียวกันไว้ให้ import สะดวก

## กติกา games.js (สำคัญสุด — แก้บ่อย)

- ไฟล์นี้คือ `src/data/games.ts` แล้ว (TypeScript, type `Game`/`ModInfo`) — กติกาด้านล่างทั้งหมดยังใช้เหมือนเดิมทุกข้อ
- `mod.status`: `'released' | 'wip' | 'none'` — ตอน `released` ต้องมี `url` (Google Drive) · `note` กับ `nexus` optional
- `mod.beta` (`{ url, note?, version?, updated? }`) = รุ่นทดสอบที่แจกคู่ตัวจริง → ปุ่มรอง "ลองรุ่นทดสอบ (beta)" ในหน้าเกม + ป้ายมุมแบนเนอร์ · พอ beta ขึ้นเป็นตัวจริงให้ย้ายลิงก์ไป `mod.url` แล้วลบ `mod.beta` ทิ้ง
- `mod.manual` (`{ url, note? }`) = แพ็กเดียวกันแบบไม่มีตัวติดตั้ง (ไม่มี .bat/.ps1 ให้ก็อปโฟลเดอร์ทับเอง) ไว้ให้คนที่แอนติไวรัสลบตัวติดตั้งทิ้ง → ปุ่มรอง "แบบไม่มีตัวติดตั้ง (ก็อปไฟล์เอง)" ในหน้าเกม + บรรทัดใน `llms.txt` · ตอนออกเวอร์ชันใหม่ต้องอัปทั้งสองลิงก์คู่กัน (ตอนนี้ใช้ที่ Y0 DC)
- ม็อดแปลเสร็จภาคไหน → แก้ entry ภาคนั้น status + url จุดเดียวจบ — ปุ่มดาวน์โหลด (GamePage), ป้าย "มีม็อดแปลไทย" (Home), จุดเขียว (Navbar) โชว์เองหมด
- **ม็อดออกตัวแก้ (patch)**: (1) แก้ `mod.note` เป็น `'v<เวอร์ชัน> (<วันที่>) — <สรุปสั้น>'` (โชว์ต่อท้ายปุ่มดาวน์โหลด) พร้อม `mod.version` + `mod.updated` (ISO) คู่กันเสมอ — สองฟิลด์นี้คือที่มาของป้ายแดงมุมแบนเนอร์ (`modUpdateBadge` ใน `games.ts` โชว์ 30 วันแรก ทั้งการ์ดหน้าแรกและ hero หน้าเกม · เว็บเป็น static export ป้ายจึงหายตอน build ครั้งถัดไป) (2) เขียนข่าว `src/content/news/YYYY-MM-DD-<game>-thai-mod-vXYZ.md` tag `ม็อดแปลไทย`
  โครงข่าว: อาการที่แก้ (ภาษาผู้เล่น ไม่ลงเทคนิคลึก) → วิธีอัปเดต (วางไฟล์ทับ + เซฟเดิมใช้ต่อได้ไหม) → ช่องทางแจ้งบั๊ก (ระบุบท/ฉาก+ภาพหน้าจอ)
  (3) ลิงก์ Drive: ให้เจ้าของอัปเป็น "เวอร์ชันใหม่ของไฟล์เดิม" (Manage versions) ลิงก์ `url` จะไม่เปลี่ยน — ถ้าอัปเป็นไฟล์ใหม่ต้องแก้ `url` ด้วย
  ตัวอย่างล่าสุด: Gaiden v1.0.3 (24 ส.ค. 2026) `2026-08-24-gaiden-thai-mod-v103.md`
- รูป hero/cover ดึงจาก Steam CDN ผ่าน `steamAppId` (ลิงก์เสถียร ไม่เก็บรูปใน repo) — เกมใหม่ที่ Steam ใช้ URL แบบ hashed ให้ใส่ `image` ตรง ๆ แทน

## SEO / ให้ AI แนะนำเว็บได้ (แก้ครั้งใหญ่ 22 ส.ค. 2026)

- ทุกหน้าที่ลึกกว่าหน้าแรกต้องมี `<JsonLd data={breadcrumbJsonLd([...])} />` — หน้าใหม่ที่เพิ่มทีหลังก็ต้องใส่ด้วย
- `<img>` **ทุกจุด** ต้องมี `width`/`height` จริง (กัน layout shift / CLS) — ค่าคงที่อยู่ที่ `STEAM_HEADER_SIZE` (460×215), `STEAM_SHOT_SIZE` (1920×1080) ใน `games.ts` และ `CITY_MAPS[].width/height` · CSS `img { height: auto }` ใน `styles.css` เป็นตัวคู่กัน ห้ามลบ
- `pageMeta()` เรียก `clip()` ให้เอง — ส่ง description ยาวเท่าไหร่ก็ได้ **ห้าม `.slice()` เอง** (ตัดกลางคำ)
- บทความ (ข่าว/lore/บท) ส่ง `type: 'article'` + `publishedTime` เข้า `pageMeta` และคู่กับ `articleJsonLd`
- title ของหน้าย่อยในเกมต้องมีชื่อภาคต่อท้ายเสมอ (`บทที่ 3: xxx — Yakuza 5`) — ลำพังเลขบทไม่บอกว่าภาคไหน
- `robots.ts` ประกาศอนุญาตบอต AI (GPTBot / ClaudeBot / Google-Extended / PerplexityBot ฯลฯ) เป็นรายชื่อ — ตั้งใจให้ ChatGPT/Gemini/Claude อ้างอิงเว็บนี้ได้ ถ้าจะบล็อกภายหลังให้แก้ที่ `AI_AGENTS`
- `llms.txt` มีหัวข้อ "เว็บนี้คืออะไร" + สถานะม็อดรายภาค (เวอร์ชัน/วันที่) — คือสิ่งที่ผู้ช่วย AI อ่านแล้วตอบคำถาม "ภาคนี้มีม็อดแปลไทยไหม" ได้ · `modJsonLd` ในหน้าเกมประกาศม็อดเป็น `SoftwareApplication` แจกฟรีพร้อม `downloadUrl` ให้ข้อมูลเดียวกันในรูปแบบ structured data
- ปล่อยม็อดเวอร์ชันใหม่แล้ว `mod.updated` จะไปโผล่เป็น `lastmod` ของหน้าเกมใน sitemap เอง

## กติกา / บทเรียน

- รูปทุกจุด © SEGA — ต้องมีเครดิตใต้รูปผ่าน `<Credit>` เสมอ
- รูปจาก Fandom: ตัด `/revision/latest?cb=...` ท้าย URL ออก ไม่งั้นโหลดไม่ขึ้น
- ภาษาไทยทั้งเว็บ ชื่อเกม/ชื่อบท EN คงอังกฤษ — สะกดชื่อตัวละครตาม glossary ของโปรเจกต์ม็อดแปล (เช่น คาซึกะ, ซาเอะจิมะ, โจริว, **ยากามิ** ไม่ใช่ ยางามิ, ตระกูล**มัตสึกาเนะ**, ตระกูล**เคียวเรอิ**, the Mole = "ไส้ศึก")
- แอนิเมชันทุกจุดผ่าน `MotionConfig reducedMotion="user"` — เคารพ reduced motion

## โปรเจกต์พี่น้อง (ที่มาของม็อดใน games.js)

โปรเจกต์ม็อดแปลไทยอยู่ที่ `D:\Projects\` แยก repo ต่อภาค: `yakuza-0-direct`, `yakuza-kiwami-mod`, `yakuza-kiwami-2-mod`, `yakuza-4-thai` (Yakuza-4-Thai), `yakuza-5`, `yakuza-6-thai`, `yakuza-7-like-a-dragon-thai`, `yakuza-gaiden`, `y8-infinite-wealth`, `pirate-yakuza-hawaii-thai`, `judgment-thai`, `lost-judgment-thai` — แต่ละตัวมี `HANDOFF.md` + `CLAUDE.md` ของตัวเอง ม็อดปล่อยใหม่เมื่อไหร่มาอัปเดตลิงก์ที่นี่

## สถานะม็อดล่าสุด (อัปเดตทุกครั้งที่แตะ games.js)

- **Lost Judgment** — released · v1.0.2 (29 ส.ค. 2026): แก้ไฟล์ตารางฟอนต์ 2 ไฟล์ที่ตกไปตอนแพ็ก v1.0.1 → ป้ายเริ่มต่อสู้/เทลอปสถานที่-วันที่ในคัตซีนขึ้นเป็นละตินอ่านไม่ออก (`ÂÛÊÉÑÎÅÂÓÕ¦ÌÙÊ`) + กลิฟไทยในเมนูบางจอผิดรูป · คำแปล/ฟอนต์ไม่เปลี่ยน ติดตั้งทับได้เลย · ลิงก์ Drive ใหม่ (`1KKNfaz2…`) แทน v1.0.1 (`1LNifc_Z…`) · v1.0.1 (29 ส.ค. 2026): แก้บั๊กร้ายแรง ขึ้นลิฟต์ที่โรงเรียนเซเรียว (และลิฟต์อื่น) แล้วตัวละครตกทะลุพื้นแมพ ต้องโหลดเซฟใหม่ — ต้นตอคือ reARMP จัดผังคอลัมน์ในแถวใหม่เอง ทำให้ช่องพิกัดปลายทาง `talk_elevator.play_pos` เลื่อนไป 20 ไบต์ · แก้โดยคงผังแถวของไฟล์ต้นฉบับทั้งหมด (ทุกไบต์เหมือนต้นฉบับ ยกเว้นตัวชี้ข้อความ) + เพิ่มด่านเทียบไบต์ · พ่วงแก้ค่าอ้างอิงภายในที่ถูกแปลติด (`sugoroku`/`scene`/`auto` — จุดเกิดของวาร์ปซุโกโรกุก็ตกทะลุพื้นเหมือนกัน) 9 ตาราง + ข้อความยาวในหน้า Skill Tree ที่ถูกตัดเรียงแนวตั้ง 52 จุด · ฟอนต์ไม่เปลี่ยน ติดตั้งทับ v1.0 ได้เลย · v1.0.1 ใช้ลิงก์ (`1LNifc_Z…`) แทน v1.0 (`1gU5rvpn…`) · v1.0 (29 ส.ค. 2026) รุ่นแรก: แปลทั้งเกมรวม DLC The Kaito Files (66,619 ประโยคไทย + คงอังกฤษโดยตั้งใจ 1,523 · 229 ไฟล์ข้อความ) · ฟอนต์ Sarabun ฉีดกลิฟลงฟอนต์เกม 10 ตัว ต้องเขียนทับ `dataont.coyote.par` ตรง ๆ (~207 MB) เพราะเกมโหลดฟอนต์ก่อนตัวโหลดม็อดทำงาน — ตัวติดตั้งสำรอง `.orig` ให้ · ซิป `LostJudgmentThai-th-v1.0.zip` ~180 MB · เพศผู้พูดถอดจากคิวเสียง `sound_voicer` ไม่ได้เดา · ผู้เล่นต้องตั้งภาษาข้อความในเกมเป็น English · **ยังไม่มีใครเล่นจบเกมด้วยม็อดนี้** — ค้างอยู่: ชื่อเฉพาะยังไม่ตรงกันบางคำ (ฮามากิตะ/ฮามาคิตะ · อากุตะ/อาคุตะ) · รายละเอียดใน `lost-judgment-thai/patch.md` + `HANDOFF.md` (§42)
- **Judgment** — released · v1.0.1 (29 ส.ค. 2026): แก้ข้อความไทยกลายเป็นอักษรละติน (`À È Ú Á`) ในจอที่ใช้ฟอนต์ `yakuza` (ป้ายท่า EX สีเขียว + เมนูแล็บโดรน) ด้วยเซลล์ตัวนำ U+0165 บังคับให้วาดด้วยฟอนต์ไทยของม็อดเสมอ + แก้คำลงท้ายผิดเพศในคัตซีน (ซาโอริ/ชินทานิ) โดยดึงเพศจากคิวเสียงพากย์ · ลิงก์ Drive ใหม่ (`1VTAwj9P…`) แทน v1.0 (`1WGZhc4u…`) · รายละเอียดใน `judgment-thai/patch.md` + `HANDOFF.md` (รอบ 17) · v1.0 (22 ส.ค. 2026) รุ่นแรก: แปลทั้งเกม 50,297 ประโยค / 159 ไฟล์ข้อความ · ฟอนต์ Sarabun วาดลงฟอนต์ในเกมโดยตรง (โหมด EN วาดทุกอย่างจาก bitmap grid `meta_ot_cond_book.dds` และตาราง advance อยู่ใน `db.judge.en.par → en/font.bin` ไม่ใช่ใน exe) · แจกเป็น `JudgmentThai-th-v<เวอร์ชัน>.zip` ~8 MB พร้อม `install.bat` ที่หาโฟลเดอร์เกมจาก Steam เอง สำรองฟอนต์เดิมเป็น `.orig` และมี `uninstall.bat` · ผู้เล่นต้องตั้งภาษาข้อความในเกมเป็น English · **ยังไม่มีใครเล่นจบเกมด้วยม็อดนี้** — ค้างอยู่: ป้าย MISSION/TIPS กับป้ายโต๊ะรูเล็ตเพิ่งแก้นาทีสุดท้ายยังไม่เคยเห็นบนจอจริง (ถ้ามีคนแจ้งว่าเกมค้างตอนขึ้นป้ายพวกนี้ ให้แจ้งกลับ `judgment-thai` ทันที) · สถาปัตยกรรมฟอนต์อยู่ใน `HANDOFF.md` (รอบ 16)
- **Gaiden (Like a Dragon Gaiden)** — released · v1.0.3 (24 ส.ค. 2026): แก้ซับไตเติลคัตซีนทั้งเกมที่กลายเป็นภาษาอังกฤษใน v1.0.2 (+ เมนูตั้งค่าบางส่วน) · ต้นตอคือ `patch_text_inplace.py` เดินคอลัมน์ชนิด 9 (พอยน์เตอร์ตารางย่อย) ด้วย stride 4 ไบต์ ทั้งที่ ARMP v2 storage mode 0 เก็บเป็น int64 8 ไบต์ → มองไม่เห็นตารางย่อยที่เก็บซับ แล้วเขียน `sound_auth.bin` ออกมาเท่าต้นฉบับอังกฤษทุกไบต์โดยไม่มี error · v1.0.3 อ่านเวอร์ชันไฟล์แล้วเลือก stride ให้ถูก + เพิ่มการตรวจก่อนปล่อยว่ามีไฟล์ไหนออกมาเหมือนต้นฉบับอังกฤษทั้งที่มีคำแปลรออยู่หรือไม่ · เปลี่ยนจาก v1.0.2 แค่ 2 ไฟล์ (`sound_auth.bin`, `option.bin`) คำแปล/ฟอนต์ไม่เปลี่ยน · ลิงก์ Drive ใหม่ (`1EmY3mbs…`) แทน v1.0.2 (`1T-WNCex…`) · รายละเอียดใน `yakuza-gaiden/docs/patch.md` · v1.0.2 (21 ส.ค.) = โป๊กเกอร์/แบล็คแจ็คค้างตอนเล่นครั้งแรก (`controller_guide.bin` — ต้นตอเดียวกับ Y8 v1.0.4) เปลี่ยนวิธีสร้างไฟล์ทั้งม็อดเป็น patch-in-place · v1.0.1 (18 ส.ค.) = สาเหตุแรก ตารางระบบถูกเขียนทับ + รหัสภายในถูกแปลติด
- **Y8 (Like a Dragon: Infinite Wealth)** — released · **v1.0.5 (30 ส.ค. 2026)**: รอบเก็บคุณภาพคำแปล ไม่ใช่แก้บั๊กเกมค้าง — ดึงเพศนักพากย์จาก `sound_auth.bin` + `sound_voicer.bin` มาตัดสินเพศผู้พูดแทนการเดา (ครอบคลุมบทพูดที่มีเสียง 99.13%) แก้ผิดเพศ 119 บรรทัด · กลางเพศ 11 · ตัวละครที่แปลปนสองเพศทั้งคน 4 ตัว · ย้ายปลายทาง 7 สไตล์ในตาราง `font2_style` จากฟอนต์ vector ไป atlas (แก้ 7 ไบต์) → ป้ายบอกสถานที่/การ์ดแนะนำตัวละคร/แคปชันเข้าฉากต่อสู้เป็นไทย 561 ข้อความ (การ์ดหัวบทลายพู่กันยังอังกฤษ ฟอนต์พู่กันขาดสระ ุ/ู) · เกลาคำแปล 86 จุดจากที่ตรวจอ่าน 1,085 · แก้หน่วยเงิน "บาท"→"เยน" · **ลิงก์ย้ายมา GitHub Releases** (`bignutchanon/yakuza8-thai-mod` tag `v1.0.5`) แทน Drive (`1DqCgTMz…`) · รายละเอียดใน `y8-infinite-wealth/docs/patch.md` · · v1.0.3 (19 ส.ค.) = Party Chat มั่วในบางเครื่อง (เพดานขนาด `sound_auth.bin`) · v1.0.2 (19 ส.ค.) = Party Chat เป็นไทย + ดาร์ตเด้ง (สาเหตุแรก) + Bonds Bingo · v1.0.1 (16 ส.ค.) = Miss Match ค้าง (reARMP)
- **Y5 (Yakuza 5)** — released · **v1.5 (29 ส.ค. 2026)** (เนื้อใน build 2026.08.29 / `wdr_v28`): แก้มินิเกมขับแท็กซี่ค้างจอมืด (`stay_en` 7 ไฟล์โครงพัง) + บทสนทนาค้างไม่ขึ้นปุ่มกดต่อ (operand 339 จุด) · เติมคำแปลที่ไม่เคยขึ้นจอ 1,029 บรรทัด + บรรทัดที่ไม่เคยมีคำแปล 139 · แก้เพศ/เปลี่ยนเป็นคำกลาง 586 · ชื่อบทหน้าโหลด 23 · ซับคัตซีนบรรทัด 2 เป็นไทยอีก 189 · มุกลิ้นพันไทยในมินิเกมโรงเรียนผู้ประกาศของฮารุกะ · รวมงานจาก v1.5 beta (pointer ร้านค้า 887 จุด) เข้าตัวจริงแล้ว → **ถอด `mod.beta` ออกจาก `games.ts` แล้ว** · ลิงก์ดาวน์โหลดย้ายมา **GitHub Releases** (`bignutchanon/yakuza5-thai-mod` tag `v1.5`) — Google Drive บล็อกไฟล์ ส่วน Dropbox ที่ใช้ชั่วคราวก็เลิกใช้แล้ว · ตารางเวอร์ชันอยู่ที่ `yakuza-5/release/VERSIONS.md` (public ถัดไป = v1.6) · ค้างอยู่: ซับบรรทัด 2 ที่ยาวเกินกรอบยังเป็นอังกฤษ · เมลในมือถือยังอังกฤษ · ข้อความที่เป็นรูปภาพยังไม่แปล
- **Y4 (Yakuza 4)** — released · v2.2 (29 ส.ค. 2026): ช่องทางหลักย้ายมา **GitHub Releases** (`bignutchanon/yakuza4-thai-mod` tag `v2.2`) — Nexus (`yakuza4remastered/mods/233`) เก็บไว้ใน `mod.nexus` เป็นมิเรอร์ · ตัวม็อดลากโฟลเดอร์ `Yakuza 4` ทับโฟลเดอร์เกม ใช้ `dinput8.dll` จัดสระ/วรรณยุกต์ตอนรัน
- **Y7 (Yakuza: Like a Dragon)** — released · v1.0.3 (16 ส.ค. 2026): แก้บั๊กมินิเกมบริหารธุรกิจ (ป้าย Leader/Member เลื่อน ดาวไม่ขึ้น) + ลิฟต์ทะลุแมป — ทั้งคู่มาจากเครื่องมือสร้างตาราง (reARMP) ไม่ใช่คำแปล รายละเอียดใน `yakuza-7-like-a-dragon-thai/HANDOFF.md`
  · ลิงก์ Drive ปัจจุบัน = zip v1.0.3 (`1e_1ekuu…` อัปเดต 16 ส.ค.) — ทุกเวอร์ชันที่ผ่านมาเจ้าของอัปเป็นไฟล์ใหม่ (ลิงก์เปลี่ยนทุกครั้ง ต้องแก้ `url` ด้วย) · Nexus #197 ("ไม่เมาไม่แปล") = ฐาน font/db ของแพ็กเกจ ต้องมีเครดิตเสมอ
