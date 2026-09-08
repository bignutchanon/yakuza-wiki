# ระบบ "แนะนำ" (recommend) — Cloudflare Worker + D1

เว็บ yakuzathai.com เป็น static export บน GitHub Pages ไม่มี server ของตัวเอง
ยอดกดแนะนำจึงเก็บที่ Cloudflare D1 ผ่าน Worker ตัวนี้ (โดเมน DNS อยู่ที่ Cloudflare อยู่แล้ว)

ฝั่งเว็บเรียกใช้ผ่าน `RECOMMEND_ENDPOINT` ใน `src/lib/site.ts` —
**ค่าว่าง = ปิดระบบ** ปุ่มแนะนำจะไม่ถูก render เลย (เว็บยังใช้งานได้ปกติทุกอย่าง)

## ติดตั้งครั้งแรก

ต้องมี Node + login Cloudflare ก่อน (`npx wrangler login`) แล้วรันในโฟลเดอร์ `worker/`

```bash
# 1) สร้างฐานข้อมูล — คัดลอก database_id ที่ได้ไปใส่ใน wrangler.toml
npx wrangler d1 create yakuzathai

# 2) สร้างตาราง (ทั้ง local สำหรับทดสอบ และ remote ของจริง)
npx wrangler d1 execute yakuzathai --local  --file=./schema.sql
npx wrangler d1 execute yakuzathai --remote --file=./schema.sql

# 3) ตั้ง salt สำหรับ hash IP — สุ่มยาว ๆ แล้วเก็บไว้ที่เดียว
#    เปลี่ยนค่านี้เมื่อไหร่ = ผู้ที่เคยกดจะกดได้ใหม่อีกครั้ง
npx wrangler secret put VOTE_SALT

# 4) deploy (สร้าง custom domain api.yakuzathai.com ให้เองตาม routes ใน wrangler.toml)
npx wrangler deploy
```

จากนั้นใส่ค่าใน `src/lib/site.ts`:

```ts
export const RECOMMEND_ENDPOINT = 'https://api.yakuzathai.com/recommend'
```

## ทดสอบในเครื่อง

```bash
npx wrangler dev            # worker ที่ http://localhost:8787
```

แล้วตั้ง `RECOMMEND_ENDPOINT = 'http://localhost:8787/recommend'` ชั่วคราว
(`http://localhost:3000` อยู่ใน ALLOWED_ORIGINS ของ worker แล้ว)

## API

| | |
|---|---|
| `GET /recommend?targets=game:y0,game:y7` | `{ "counts": { "game:y0": 12, "game:y7": 3 } }` — cache 30 วินาที |
| `POST /recommend` body `target=game:y0` | `{ "ok": true, "target": "game:y0", "count": 13, "already": false }` |

`target` เป็นรูปแบบ `ชนิด:ไอดี` — ตอนนี้ใช้แค่ `game:<id>` แต่รองรับ `news:<slug>` / `lore:<slug>` ได้ทันที
ถ้าอยากขยายไปหน้าอื่น

## กันสแปม

- `PRIMARY KEY (target, voter)` — หนึ่ง IP กดแนะนำแต่ละเป้าหมายได้ครั้งเดียว
- `DAILY_VOTE_LIMIT` — หนึ่ง IP กดได้ 40 ครั้งต่อ 24 ชม. รวมทุกเป้าหมาย
- `ALLOWED_ORIGINS` — เรียกข้ามโดเมนจากเว็บอื่นไม่ได้
- `voter` เก็บเป็น `sha256(VOTE_SALT + IP)` ไม่ได้เก็บ IP จริง (ดูหน้า `/privacy`)

ทั้งหมดนี้กันคนตั้งใจปั่นยอดจริง ๆ ไม่ได้ 100% (เปลี่ยน IP ก็กดใหม่ได้)
แต่พอสำหรับตัวเลข "มีคนแนะนำกี่คน" ที่ไม่ได้มีอะไรได้เสีย

## ดูยอด / ลบยอดที่ไม่ปกติ

```bash
npx wrangler d1 execute yakuzathai --remote \
  --command="SELECT target, COUNT(*) n FROM recommends GROUP BY target ORDER BY n DESC"

# ลบยอดของเป้าหมายเดียว
npx wrangler d1 execute yakuzathai --remote \
  --command="DELETE FROM recommends WHERE target='game:y0'"
```

## ค่าใช้จ่าย

Workers ฟรี 100,000 request/วัน · D1 ฟรี 5 GB + อ่าน 5 ล้านแถว/วัน
ระดับทราฟฟิกของเว็บนี้ไม่มีทางชนเพดาน
