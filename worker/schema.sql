-- ตาราง "แนะนำ" (recommend) ของ yakuzathai.com — ใช้กับ Cloudflare D1
-- หนึ่งแถว = หนึ่งคนกดแนะนำหนึ่งเป้าหมาย · PRIMARY KEY กันกดซ้ำจากเครื่องเดิม
--
-- target = ชนิด:ไอดี เช่น 'game:y0' (เผื่ออนาคตใช้ 'news:<slug>' / 'lore:<slug>' ได้เลย)
-- voter  = sha256(VOTE_SALT + IP) แบบ hex 32 ตัวแรก — เก็บ IP ตรง ๆ ไม่ได้ตามนโยบายความเป็นส่วนตัว
--          และเปลี่ยน VOTE_SALT เมื่อไหร่ ค่าที่เก็บไว้เดิมก็โยงกลับหาใครไม่ได้อีก
-- ts     = epoch วินาที ใช้จำกัดจำนวนครั้งต่อวันของ voter เดียวกัน
CREATE TABLE IF NOT EXISTS recommends (
  target TEXT    NOT NULL,
  voter  TEXT    NOT NULL,
  ts     INTEGER NOT NULL,
  PRIMARY KEY (target, voter)
);

-- นับยอดต่อ target (หน้าเกมเรียกทุกครั้งที่โหลด)
CREATE INDEX IF NOT EXISTS idx_recommends_target ON recommends(target);
-- นับจำนวนครั้งต่อวันของ voter เดียวกัน (กันสแปมรัว ๆ ข้ามหลายภาค)
CREATE INDEX IF NOT EXISTS idx_recommends_voter_ts ON recommends(voter, ts);
