// รายชื่อภาคที่มีมาจองตามกล่อง playable_in ของ Yakuza Wiki (ตรวจ 14 ต.ค. 2026)
// y3r มาจากหัวข้อ Yakuza 3 (Remaster); pirate มาจากเนื้อหาหน้าเดียวกันที่ไม่อยู่ในกล่อง
export const MAHJONG_GAME_IDS: readonly string[] = [
  'y0', 'kiwami', 'kiwami2', 'y3', 'y3r', 'y4', 'y5', 'y6', 'y7', 'y8',
  'gaiden', 'pirate', 'judgment', 'lostjudgment', 'ishin',
]

// ภาคที่มีไกด์ Pocket Circuit ในช่อง guide.md (/game/<id>/guide/) — เมนู "มินิเกม" ใน Navbar ลิงก์ไปตามลิสต์นี้
// ถ้าเปลี่ยน guide.md ของภาคใดเป็นเรื่องอื่น ต้องเอาออกจากลิสต์นี้ด้วย
export const POCKET_CIRCUIT_GUIDE_IDS: readonly string[] = ['y0', 'kiwami']
