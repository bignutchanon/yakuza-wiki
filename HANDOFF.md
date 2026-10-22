# HANDOFF — สินค้า Shopee Affiliate (22 ต.ค. 2026)

สถานะ: **deploy ขึ้น main แล้ว 22 ต.ค. 2026** (push main = deploy) · ภาพรวมกติกาอยู่ใน CLAUDE.md หัวข้อ AdSense → "Shopee Affiliate"

## ทำแล้ว
- `src/data/shopee.ts` สินค้า 33 ชิ้น (เกม 7 · อุปกรณ์คอม 14: จอย/เมาส์/คีย์บอร์ด/หูฟัง/แผ่นรองเมาส์ · ขนมและเครื่องดื่ม 12: เลย์/พริงเกิลส์/เป๊ปซี่/โค้ก/โดริโทส/ชีโตส/เทสโต/ตะวัน/Sunbites) + เกณฑ์คัดหัวไฟล์ · ลิงก์ affiliate ทุกอันเช็ค redirect แล้ว (itemid ตรง + `utm_source=an_15357260476`)
- `src/components/ShopeeBox.tsx` (server) แถวละหมวด เกม Yakuza / อุปกรณ์คอม / ขนมและเครื่องดื่ม · `ShopeeScroller.tsx` (client) ลูกศรซ้าย/ขวา desktop ซ่อนบนจอสัมผัส · ทั้งกล่องย่อ/ขยายได้ด้วย `<details open>` (หัวกล่อง = `<summary>` ไม่ใช้ JS · เปิดเป็นค่าเริ่มต้น ไม่จำสถานะข้ามหน้า)
- วาง: หน้าแรกใต้แถบข่าว · หน้าเกมใต้ปุ่มแนะนำ (แผ่นของภาคนั้นเท่านั้น + อุปกรณ์/ขนม)
- 22 ต.ค. (รอบ 2) ผู้อ่านรีวิวว่าดู clickbait → ถอดป้าย -% บนรูป · ราคาสีขาวแทนแดง · เพิ่มแถวร้าน (ป้าย "Shopee Mall"/"ร้านแนะนำ" + ชื่อร้านจากฟิลด์ `shop`) และแถว "★ 4.9 · N รีวิว" (ดาวสีทอง) เหนือราคา · ราคาก่อนลดยังขีดฆ่าตัวเล็กสีเทา
- Open API เช็ค 22 ต.ค.: หน้า affiliate.shopee.co.th/open_api ยังขึ้น AppID `--` "คุณไม่ได้รับสิทธิ์…" = ยังไม่ได้สิทธิ์
- `/privacy` หัวข้อ "ลิงก์ Shopee (affiliate)" + รูปโหลดจาก Shopee · `/about` ประโยคแจ้ง affiliate

## งานค้าง (เจ้าของสั่งแล้ว)
1. ~~เพิ่มสินค้าแถวอุปกรณ์คอม + ขนม~~ เสร็จ 22 ต.ค. · แถวเกมยังมี 7 ชิ้น (ภาคละรายการถูกสุดที่ผ่านเกณฑ์ · Gaiden/Judgment/Remastered Collection ไม่มีร้านผ่าน) เพิ่มได้ถ้าเจ้าของต้องการ
2. **ราคาอัปเดตอัตโนมัติ** — ทำได้เมื่อได้สิทธิ์ Open API เท่านั้น (บัญชียังไม่มีสิทธิ์ ขอที่ help.shopee.co.th/portal/webform/c07a3cf32bfd4cd59f5c819d84583d4e) → สคริปต์เรียก `productOfferV2` (keyword · sortType 4 · isKeySeller) ตอน build ใน GitHub Actions + cron รายวัน · AppID/Secret = repo secret เจ้าของใส่เอง · ห้ามให้ GitHub Actions ยิง API ภายในของ Shopee (ไม่มี session ติด captcha แน่)
3. ~~commit + push~~ deploy แล้ว 22 ต.ค.
4. เจ้าของต้องกรอกข้อมูลการชำระเงิน/ภาษีในบัญชี affiliate เอง (ห้ามกรอกแทน)

## วิธีหาสินค้า (ใช้ซ้ำได้)
- เปิดแท็บ shopee.co.th (ล็อกอินบัญชีเจ้าของ) แล้วเรียก `fetch('/api/v4/search/search_items?by=relevancy|sales&keyword=…&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2')` จาก javascript_tool
- **ยิงห่าง ≥ 8 วินาที** — รอบแรกยิงรัว ~20 ครั้งติด captcha `scene=crawler_item` (เจ้าของกดผ่านเอง ห้ามแก้ captcha แทน) · ห้ามเปิดหน้าสินค้าทีละหน้า
- ฟิลด์: `price_min/1e5` · `price_before_discount` · `item_rating.rating_star` · `rating_count[0]` · `historical_sold` · `is_official_shop` (Mall) · `is_preferred_plus_seller` · `shopee_verified` · `stock` · `image` · `shop_name`
- เกม: ตัด `ps2|ps3|มือสอง|used|dlc|digital|แผ่นปั๊ม|บทสรุป|guide|ninja…` · ร้าน Mall/แนะนำ ★≥4.8 รีวิว≥5 → ถูกสุด · อุปกรณ์/ขนม: Mall ★≥4.8 รีวิว≥50 → ขายดี
- ผลลัพธ์ที่มี `= & ? ; % : /` โดนเครื่องมือบล็อก (`[BLOCKED: Cookie/query string data]`) → แทนอักษรพวกนี้ด้วยช่องว่างก่อน return
- ลิงก์ affiliate: affiliate.shopee.co.th/offer/custom_link ใส่ `https://shopee.co.th/product/<shopid>/<itemid>` ได้ 5 บรรทัดต่อครั้ง + Sub_id 1 `yakuzathai` → เช็คด้วย `curl -s -o /dev/null -w '%{redirect_url}' https://s.shopee.co.th/<code>`
- รูป `https://down-th.img.susercontent.com/file/<image>_tn` = 320×320
- เซิร์ฟเวอร์ทดสอบ `python -m http.server` ใน `out/` ต้องปิดก่อน `npm run build` ไม่งั้น EBUSY

---

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

~~หน้า `/privacy` ท้ายหน้ายังเป็นอีเมลส่วนตัว~~ — แก้แล้ว 18 ก.ย. 2026 (เจ้าของอนุมัติ) ตอนนี้ดึงจาก
`CONTACT_EMAIL` (`yakuzathai.contact@gmail.com`) ใน `src/lib/site.ts`
