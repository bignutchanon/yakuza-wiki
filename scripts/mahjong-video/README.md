# เครื่องมือเรนเดอร์วิดีโอมาจอง

เครื่องมือนี้คำนวณสถานะจากเวลาใน `src/state.js` แล้ววาดด้วย three.js ใน Chrome headless ก่อนส่งภาพให้ ffmpeg รวมเป็น MP4 ไม่มีเสียงหรือภาพจากเกม

ภาพไพ่ดัดแปลงจาก [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) ซึ่งระบุว่าเป็น public domain (CC0) ไฟล์ต้นฉบับและ `LICENSE.md` อยู่ใน `assets/tiles/` ฟอนต์ Kanit และ Sarabun พร้อม OFL อยู่ใน `assets/fonts/`

## ตรวจและ preview

```sh
node check.mjs
node serve.mjs
```

เปิด URL ที่เซิร์ฟเวอร์แสดงใน Chrome: `?t=12.5` แสดงเฟรมเดียว และ `?play` เปิดแถบเลื่อนเวลา

## แก้คำบรรยายและฉาก

แก้ข้อความ คำบรรยาย เหตุการณ์ และ `duration` ของฉากใน `src/timeline.js` เวลา `at` / `end` / `dur` ทั้งหมดนับจากต้นฉาก ระบบเลื่อนฉากถัดไปและขยายเวลาคำบรรยายที่อ่านไม่ทันให้อัตโนมัติ `src/layout.js` คำนวณตำแหน่งตามที่นั่ง ส่วน `src/state.js` สร้างสถานะเฟรมจากเวลาโดยไม่อิงเฟรมก่อนหน้า

เรนเดอร์ภาพตรวจและวิดีโอ:

```sh
node render.mjs --stills --scale 0.5
node render.mjs
```

ไฟล์กลางและภาพตรวจอยู่ใต้ `out/` การเรนเดอร์เต็มจะสร้าง master, MP4, poster, manifest และภาพหน้าไพ่สำหรับเว็บ ไฟล์เหล่านี้ไม่ถูกเก็บไว้ใต้ `out/` หากเป็นไฟล์ที่เผยแพร่

แฟล็กที่ใช้ได้:

- `--stills` สร้างภาพตาม `reviewTimes` และ contact sheet
- `--from 12 --to 20` จำกัดช่วงเวลาเป็นวินาที
- `--scale 0.5` ลดขนาดภาพสำหรับตรวจ
- `--encode-only` เข้ารหัสซ้ำจาก `out/master.mp4`
- `--tiles` ส่งออกภาพหน้าไพ่ 34 แบบ

ต้องมี Chrome ที่ `C:\Program Files\Google\Chrome\Application\chrome.exe` และ ffmpeg/ffprobe ใน PATH แพ็กเกจ three.js และ puppeteer-core ติดตั้งไว้ในโฟลเดอร์นี้แล้ว
