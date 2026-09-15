// true จนกว่าหน้าแรกที่ผู้ใช้เปิดจะ hydrate เสร็จ — ใช้ข้ามอนิเมชัน "โผล่" (opacity 0 → 1) ตอนโหลดครั้งแรก
// เหตุผล: static export render ค่า initial ของ framer-motion ลง HTML ตรง ๆ ถ้าเป็น opacity:0 เนื้อหาทั้งหน้าจะมองไม่เห็น
// จนกว่า JS จะรัน — บอตที่ไม่รัน JS (เช่นตอนรีวิว AdSense) เห็นหน้าว่าง · เปลี่ยนหน้าภายในเว็บยังมีอนิเมชันเหมือนเดิม
// ฝั่ง server ไม่มี effect รัน ค่านี้จึงเป็น true ตลอดตอน build และตรงกับรอบ hydrate ฝั่ง client
let firstPaint = true

export const isFirstPaint = () => firstPaint

// เรียกใน useEffect ของ template.tsx หลังหน้าแรก mount เสร็จ
export const markPainted = () => {
  firstPaint = false
}
