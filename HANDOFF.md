# HANDOFF — ระบบปุ่ม "แนะนำ" (recommend)

อัปเดต: 8 ก.ย. 2026 · สถานะ: **Worker deploy ขึ้น Cloudflare แล้ว ใช้งานได้จริง · ฝั่งเว็บเปิดระบบแล้วแต่ยังไม่ commit/push**

## สรุปสั้น

ปุ่ม "แนะนำ" ในหน้าเกม เก็บยอดที่ Cloudflare Worker + D1 (เว็บเป็น static export
บน GitHub Pages ไม่มี server ของตัวเอง จึงเก็บเองไม่ได้)

ฝั่ง Cloudflare พร้อมใช้งานแล้ว เหลือแค่ push เว็บขึ้น `main` ปุ่มก็จะโผล่ให้ผู้เล่นกด

## Cloudflare ที่ตั้งค่าไว้แล้ว (8 ก.ย. 2026)

- บัญชี `chanon.bignut@gmail.com` (account id `efbb749d650b3f392ab2fb8e963c422f`) — `wrangler` ล็อกอินค้างไว้ในเครื่องแล้ว
- D1 `yakuzathai` id `9501dee0-db3c-4041-8863-82fdafb86c00` (ใส่ใน `worker/wrangler.toml` แล้ว) · รัน `schema.sql` บน `--remote` แล้ว ตาราง `recommends` พร้อม
- Worker `yakuzathai-recommend` deploy แล้ว ผูก custom domain **`api.yakuzathai.com`** เรียบร้อย
- secret `VOTE_SALT` ตั้งแล้ว (สุ่ม 32 ไบต์ เก็บอยู่ที่ Cloudflare ที่เดียว ไม่มีสำเนาในเครื่อง —
  ถ้าจะเปลี่ยนให้ `wrangler secret put VOTE_SALT` ทับ ยอดเก่ายังอยู่ แต่คนที่เคยกดจะกดได้ใหม่อีกรอบ)
- ทดสอบบนโดเมนจริงผ่านครบ: GET ตอบ `{"counts":{...}}` · POST ครั้งแรกนับ 1 · กดซ้ำได้ `already:true` ไม่เพิ่มยอด ·
  origin นอกรายการตอบ 403 · ลบแถวที่เกิดจากการทดสอบออกจาก D1 แล้ว (ตารางว่าง)
- `node worker/test.mjs` ผ่าน 13/13

หมายเหตุ: `wrangler deploy` ครั้งแรกอาจขึ้น error `This Worker does not exist on your account [code: 10007]`
ตอนตั้ง subdomain ทั้งที่อัปโหลดสำเร็จ — รันซ้ำอีกครั้งก็ผ่าน (ระบบ Cloudflare ยังไม่ทันเห็น worker ที่เพิ่งสร้าง)

## ที่ตัดสินใจไว้แล้ว (ไม่ต้องถามซ้ำ)

- **ที่เก็บข้อมูล = Cloudflare Workers + D1** — DNS ของโดเมนอยู่ Cloudflare อยู่แล้ว ฟรี
  ไม่เพิ่มผู้ให้บริการรายใหม่ และคุม rate limit / moderation เองได้เต็มที่
  (ที่ไม่เลือก: Supabase = free tier หยุดเองถ้าไม่มีคนใช้ 1 อาทิตย์ · Firebase = rules เขียนยากกว่า SQL ·
  giscus = คนไทยเล่นเกมส่วนใหญ่ไม่มี GitHub account)
- **รอบแรกทำแค่ปุ่ม recommend ไม่ทำ review (คอมเมนต์ข้อความ)** — UGC ที่ไม่ผ่านการอนุมัติ
  เสี่ยงตรงกับเกณฑ์ "เนื้อหาที่มีคุณค่าต่ำ" ของ AdSense ที่เว็บนี้เคยโดนมาแล้ว
  ถ้าจะทำ review ทีหลัง **ต้องมีระบบอนุมัติก่อนโชว์เสมอ**
- **ไม่ต้องล็อกอิน** — คนไทยเล่นเกมกดง่ายกว่ามาก กันซ้ำด้วย localStorage (UX) +
  `PRIMARY KEY (target, voter)` ในฐานข้อมูล (ของจริง)

## ไฟล์ที่เพิ่ม/แก้ (ยังไม่ commit — `git status` เห็นครบ)

เพิ่ม:
- `worker/src/index.js` — Worker: `GET /recommend?targets=…` อ่านยอด (cache 30 วินาที) ·
  `POST /recommend` กดแนะนำ · CORS จำกัดเฉพาะ yakuzathai.com · กรอง `target` ด้วย regex
- `worker/schema.sql` · `worker/wrangler.toml` (มี `database_id` แล้ว) · `worker/test.mjs` · `worker/README.md`
- `src/components/RecommendButton.tsx` — ปุ่มฝั่งเว็บ (client component)

แก้:
- `src/lib/site.ts` — `RECOMMEND_ENDPOINT = 'https://api.yakuzathai.com/recommend'` (เปิดระบบแล้ว)
- `src/app/game/[id]/page.tsx` — วาง `<RecommendButton target={game:${game.id}} />` ใต้กล่องม็อด เหนือ `<ShotStrip>`
- `src/styles.css` — สไตล์ `.recommend*`
- `src/app/privacy/page.tsx` — เพิ่มหัวข้อปุ่มแนะนำ (hash IP ไม่เก็บ IP จริง ไม่ใช้คุกกี้) + อัปวันที่
- `CLAUDE.md` — เพิ่มหัวข้อ "ปุ่มแนะนำ" + `worker/` ในโครงไฟล์

`npm run build` ผ่าน ปุ่มโผล่ใน `out/game/*/index.html` และ endpoint อยู่ใน chunk ของ client component แล้ว

## รอบเพิ่มยอดบนหน้าแรก (8 ก.ย. 2026)

การ์ดทุกใบบนหน้าแรกโชว์ยอดกดแนะนำเป็นป้าย `★ <จำนวน>` มุมล่างซ้ายของภาพปกแล้ว
ดึงยอดทุกภาครอบเดียวด้วย `fetchRecommendCounts()` (`src/lib/recommend.ts`) ที่แชร์กับ `<RecommendButton>`
ป้ายวางทับภาพ ไม่ได้อยู่ในเนื้อการ์ด เพราะยอดมาถึงหลังหน้าโหลดแล้ว ถ้าแทรกในเนื้อการ์ดจะดันเลย์เอาต์ (CLS)
ยอดโหลดไม่สำเร็จ = ป้ายไม่โชว์ การ์ดเหมือนเดิมทุกอย่าง

## ขั้นถัดไป

เหลือข้อเดียว: commit + push ขึ้น `main` → GitHub Actions deploy เอง แล้วเปิดหน้าเกมกดปุ่มดูจริง

**ก่อน push ต้องเคลียร์เรื่องนี้ก่อน**: CLAUDE.md มีกติกาว่าระหว่างรอผลรีวิว AdSense
"อย่าแก้โครงสร้างเว็บ" — การเพิ่มปุ่มใหม่ในหน้าเกมทุกภาคเข้าข่าย ถ้ายังรอผลอยู่ให้ push
เฉพาะโค้ด worker/ ไปก่อน แล้วค่อยเปิด `RECOMMEND_ENDPOINT` หลังรู้ผล

## กติกาที่ต้องรักษา

- POST ต้องเป็น `application/x-www-form-urlencoded` เท่านั้น — เป็น simple request จะได้ไม่มี preflight OPTIONS
  **ห้ามเปลี่ยนเป็น JSON หรือใส่ custom header**
- `voter` = `sha256(VOTE_SALT + IP)` **ไม่เก็บ IP จริง** — หน้า `/privacy` เขียนไว้แบบนี้แล้ว
  ถ้าเปลี่ยนวิธีเก็บต้องแก้หน้านั้นด้วย
- แก้ `worker/src/index.js` แล้วต้องรัน `node worker/test.mjs` ให้ผ่านก่อน deploy
- `target` รูปแบบ `ชนิด:ไอดี` — ตอนนี้ใช้แค่ `game:<id>` แต่ worker รับ `news:<slug>` / `lore:<slug>`
  ได้ทันทีถ้าจะขยายไปหน้าอื่น
- แก้ worker แล้ว deploy ใหม่ด้วย `npx wrangler deploy` ในโฟลเดอร์ `worker/` (ไม่ต้อง build เว็บใหม่
  ถ้าไม่ได้แตะโค้ดฝั่งเว็บ)

## เรื่องค้างที่ไม่เกี่ยวกับฟีเจอร์นี้

หน้า `/privacy` ท้ายหน้ายังเป็นอีเมลส่วนตัว `nuthappy2549@gmail.com` ทั้งที่กติกาในโปรเจกต์คือ
ต้องใช้ `CONTACT_EMAIL` (`yakuzathai.contact@gmail.com`) — ยังไม่แก้ให้ เพราะเป็นการเปลี่ยน
ที่อยู่ติดต่อจริงบนหน้าเว็บระหว่างรอรีวิว AdSense รอเจ้าของตัดสินใจ
