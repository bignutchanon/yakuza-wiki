// ฟังก์ชันจัดรูปแบบล้วน ๆ ไม่มี fs — ใช้ได้ทั้ง server และ client component

// วันที่ ISO → รูปแบบไทยสั้น เช่น 13 ส.ค. 2026
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export function thaiDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${TH_MONTHS[m - 1]} ${y}`
}
