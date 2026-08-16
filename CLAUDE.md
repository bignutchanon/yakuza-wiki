# CLAUDE.md — Yakuza Thai Wiki

เว็บ wiki ภาษาไทยของซีรีส์ Yakuza / Like a Dragon ทำโดยแฟนเกม (ไม่เกี่ยวข้องกับ SEGA / RGG Studio)
สรุปเนื้อเรื่องรายบท, ไกด์ substories, บทความ lore, ข่าว, ตารางราคา และ**ลิงก์ดาวน์โหลดม็อดแปลไทย**ของแต่ละภาค

## Stack + คำสั่ง

- React 18 + Vite 5 + react-router-dom (HashRouter) + framer-motion + marked — **JSX ล้วน ไม่มี TypeScript, ไม่มี test**
- `npm run dev` = เปิด dev server · `npm run build` = build ลง `dist/`
- Deploy: push ขึ้น `main` → GitHub Actions (`.github/workflows/deploy.yml`) build + deploy ขึ้น GitHub Pages อัตโนมัติ
- `vite.config.js` ใช้ `base: './'` + HashRouter (`/#/...`) — เพื่อให้เสิร์ฟจาก subpath ของ GitHub Pages ได้ **ห้ามเปลี่ยนเป็น BrowserRouter**

## โครงไฟล์ + data flow

```
src/
  main.jsx            HashRouter + StrictMode
  App.jsx             Routes ทั้งหมด + page transition (framer-motion) + footer
  styles.css          สไตล์ทั้งเว็บไฟล์เดียว (ธีมนีออนแดง-ดำ)
  data/
    games.js          ★ ข้อมูลหลัก 12 ภาค (GAMES array) + CITY_MAPS + helper รูป Steam CDN
    screenshots.json  รูป screenshot ราย gameId (ใช้ใน <Screenshots>)
  content/            ★ เนื้อหา markdown ทั้งหมด — loader.js กวาดตอน build
    loader.js         import.meta.glob('./*/*.md') eager + parse frontmatter เอง
    <gameId>/         ch-NN.md, substories.md, guide.md (ไกด์เสริม เช่น RPG guide y7/y8)
    lore/             บทความเสริม (timeline, characters, organizations, places, tattoos)
    news/             กระดานข่าว — ไฟล์ละโพสต์ ชื่อไฟล์ `YYYY-MM-DD-slug.md` + prices.md (ตารางราคา)
  pages/              Home, GamePage, ChapterPage, SubstoriesPage, GuidePage,
                      LorePage, NewsPage, PricesPage, SupportPage
  components/         Navbar, Markdown (marked), Credit, Screenshots, NeonScene (3D hero)
public/
  maps/               แผนที่เมือง self-host (อ้างจาก CITY_MAPS)
  promptpay-qr.png    QR หน้า Support
scripts/
  fetch-prices.ps1    ดึงราคา Steam ไทยทุกภาค — ใช้ตอนอัปเดต prices.md (PS/Xbox ต้องเช็คมือ)
```

Flow: `games.js` = metadata ภาค (ชื่อ/ปี/steamAppId/blurb/mod) → `loader.js` = เนื้อหา markdown → pages ประกอบสองอย่างนี้ render ผ่าน `<Markdown>`

## Routes

`/` Home · `/game/:id` ภาค · `/game/:id/ch/:n` บท · `/game/:id/substories` · `/game/:id/guide` · `/lore` + `/lore/:slug` · `/news` · `/prices` · `/support` · `/privacy` (นโยบายคุกกี้ — คู่กับ AdSense)

## AdSense

- script + meta ใน `index.html` (pub ID `ca-pub-8021468402008200`) + `public/ads.txt`
- ads.txt ระดับโดเมนอยู่ repo แยก `bignutchanon.github.io` (root redirect เข้า `/yakuza-wiki/`)
- แบนเนอร์คุกกี้ `<CookieConsent>` เก็บตัวเลือกใน localStorage key `cookieConsent` (`all`/`essential`) — index.html อ่านค่าตอนโหลดเพื่อตั้ง `requestNonPersonalizedAds` ก่อนโฆษณาเริ่ม · หน้า `/privacy` มีปุ่มล้างตัวเลือก

## กติกา content (frontmatter)

- **บท** `content/<gameId>/ch-NN.md`: `n` เลขบท, `title` ชื่อ EN ทางการ, `thai` ชื่อไทย, `part` (เฉพาะภาคแบ่งพาร์ท เช่น Y4/Y5) — loader เรียงตาม `n` ไฟล์เนื้อหาคือ source of truth ของรายชื่อบท (ไม่มี list กลาง)
- **lore**: `title`, `order` (เลขเรียงในสารบัญ)
- **news**: `title`, `date` (ISO), `tag` — เรียงใหม่→เก่าอัตโนมัติ
- **prices.md**: `updated` (ISO) — วันที่โชว์หัวตาราง อัปเดตทุกครั้งที่แก้ราคา
- วันที่แสดงผลผ่าน `thaiDate()` ใน loader.js (ISO → "13 ส.ค. 2026")

## กติกา games.js (สำคัญสุด — แก้บ่อย)

- `mod.status`: `'released' | 'wip' | 'none'` — ตอน `released` ต้องมี `url` (Google Drive) · `note` กับ `nexus` optional
- ม็อดแปลเสร็จภาคไหน → แก้ entry ภาคนั้น status + url จุดเดียวจบ — ปุ่มดาวน์โหลด (GamePage), ป้าย "มีม็อดแปลไทย" (Home), จุดเขียว (Navbar) โชว์เองหมด
- **ม็อดออกตัวแก้ (patch)**: (1) แก้ `mod.note` เป็น `'v<เวอร์ชัน> (<วันที่>) — <สรุปสั้น>'` (โชว์ต่อท้ายปุ่มดาวน์โหลด) (2) เขียนข่าว `content/news/YYYY-MM-DD-<game>-thai-mod-vXYZ.md` tag `ม็อดแปลไทย`
  โครงข่าว: อาการที่แก้ (ภาษาผู้เล่น ไม่ลงเทคนิคลึก) → วิธีอัปเดต (วางไฟล์ทับ + เซฟเดิมใช้ต่อได้ไหม) → ช่องทางแจ้งบั๊ก (ระบุบท/ฉาก+ภาพหน้าจอ)
  (3) ลิงก์ Drive: ให้เจ้าของอัปเป็น "เวอร์ชันใหม่ของไฟล์เดิม" (Manage versions) ลิงก์ `url` จะไม่เปลี่ยน — ถ้าอัปเป็นไฟล์ใหม่ต้องแก้ `url` ด้วย
  ตัวอย่างล่าสุด: Y7 v1.0.3 (16 ส.ค. 2026) `2026-08-16-y7-thai-mod-v103.md`
- รูป hero/cover ดึงจาก Steam CDN ผ่าน `steamAppId` (ลิงก์เสถียร ไม่เก็บรูปใน repo) — เกมใหม่ที่ Steam ใช้ URL แบบ hashed ให้ใส่ `image` ตรง ๆ แทน

## กติกา / บทเรียน

- รูปทุกจุด © SEGA — ต้องมีเครดิตใต้รูปผ่าน `<Credit>` เสมอ
- รูปจาก Fandom: ตัด `/revision/latest?cb=...` ท้าย URL ออก ไม่งั้นโหลดไม่ขึ้น
- ภาษาไทยทั้งเว็บ ชื่อเกม/ชื่อบท EN คงอังกฤษ — สะกดชื่อตัวละครตาม glossary ของโปรเจกต์ม็อดแปล (เช่น คาซึกะ, ซาเอะจิมะ, โจริว)
- แอนิเมชันทุกจุดผ่าน `MotionConfig reducedMotion="user"` — เคารพ reduced motion

## โปรเจกต์พี่น้อง (ที่มาของม็อดใน games.js)

โปรเจกต์ม็อดแปลไทยอยู่ที่ `D:\Projects\` แยก repo ต่อภาค: `yakuza-0-direct`, `yakuza-kiwami-mod`, `yakuza-kiwami-2-mod`, `yakuza-4-thai` (Yakuza-4-Thai), `yakuza-5`, `yakuza-6-thai`, `yakuza-7-like-a-dragon-thai`, `yakuza-gaiden`, `y8-infinite-wealth`, `pirate-yakuza-hawaii-thai` — แต่ละตัวมี `HANDOFF.md` + `CLAUDE.md` ของตัวเอง ม็อดปล่อยใหม่เมื่อไหร่มาอัปเดตลิงก์ที่นี่

## สถานะม็อดล่าสุด (อัปเดตทุกครั้งที่แตะ games.js)

- **Y8 (Like a Dragon: Infinite Wealth)** — released · v1.0.1 (16 ส.ค. 2026): แก้แอป Miss Match ค้างตอนกด Chat + โปรไฟล์ไม่อัปเดต — บั๊ก reARMP (row stride/special-field) ตระกูลเดียวกับ Y7 v1.0.2/1.0.3 ไม่ใช่คำแปล · rebuild ครบ 244 ตาราง · ลิงก์ Drive ใหม่ (`1gcaBpaw…`) แทน v1.0 (`1hYSknGi…`) · รายละเอียดใน `y8-infinite-wealth/HANDOFF.md` (หัวข้อ "16 ส.ค. 2026 — บั๊ก Miss Match") + `docs/WIKI_UPDATE_v1.0.1.md`
- **Y7 (Yakuza: Like a Dragon)** — released · v1.0.3 (16 ส.ค. 2026): แก้บั๊กมินิเกมบริหารธุรกิจ (ป้าย Leader/Member เลื่อน ดาวไม่ขึ้น) + ลิฟต์ทะลุแมป — ทั้งคู่มาจากเครื่องมือสร้างตาราง (reARMP) ไม่ใช่คำแปล รายละเอียดใน `yakuza-7-like-a-dragon-thai/HANDOFF.md`
  · ลิงก์ Drive ปัจจุบัน = zip v1.0.3 (`1e_1ekuu…` อัปเดต 16 ส.ค.) — ทุกเวอร์ชันที่ผ่านมาเจ้าของอัปเป็นไฟล์ใหม่ (ลิงก์เปลี่ยนทุกครั้ง ต้องแก้ `url` ด้วย) · Nexus #197 ("ไม่เมาไม่แปล") = ฐาน font/db ของแพ็กเกจ ต้องมีเครดิตเสมอ
