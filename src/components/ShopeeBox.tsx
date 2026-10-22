import { SHOPEE_CHECKED, SHOPEE_IMAGE_SIZE, shopeeImage, shopeeProductsFor } from '@/data/shopee'
import type { ShopeeProduct } from '@/data/shopee'
import { thaiDate } from '@/lib/format'
import ShopeeDock from '@/components/ShopeeDock'

// แท็บละหมวด ตามลำดับนี้ (แท็บแรกที่มีของ = แท็บที่เปิดอยู่ตอนโหลด) — หมวดที่ไม่มีสินค้า (เช่นหน้าเกมที่ไม่มีแผ่นขาย) ไม่มีแท็บ
// ชื่อแท็บต้องสั้น — แผงกว้าง 17rem วางสามแท็บในแถวเดียว
const LINES: { group: ShopeeProduct['group']; mark: string; label: string }[] = [
  { group: 'game', mark: '遊', label: 'เกม' },
  { group: 'gear', mark: '機', label: 'อุปกรณ์' },
  { group: 'snack', mark: '菓', label: 'ขนม' },
]

const baht = (n: number): string => n.toLocaleString('en-US')

// ร้าน (Mall/ร้านแนะนำ + ชื่อร้าน) และรีวิวอยู่เหนือราคา ให้เป็นสิ่งแรกที่เห็นหลังชื่อสินค้า — ผู้อ่านรีวิวว่าแถบนี้ดู clickbait
// จึงไม่มีป้าย -% บนรูป และราคาไม่ใช้สีแดง (22 ต.ค. 2026)
function Card({ p }: { p: ShopeeProduct }) {
  return (
    <li>
      <a className="shop-item" href={p.url} target="_blank" rel="sponsored noopener">
        <span className="shop-img">
          <img src={shopeeImage(p.image)} alt={p.name} {...SHOPEE_IMAGE_SIZE} loading="lazy" />
        </span>
        <span className="shop-name">{p.name}</span>
        <span className="shop-note">{p.note}</span>
        <span className="shop-seller">
          <span className={p.mall ? 'shop-badge is-mall' : 'shop-badge'}>{p.mall ? 'Shopee Mall' : 'ร้านแนะนำ'}</span>
          <span className="shop-shop">{p.shop}</span>
        </span>
        <span className="shop-rating">
          <b>★ {p.rating.toLocaleString('en-US', { minimumFractionDigits: 1 })}</b> · {p.reviews.toLocaleString('en-US')} รีวิว
        </span>
        <span className="shop-price">
          <b>
            ฿{baht(p.price)}
            {p.priceMax && p.priceMax > p.price ? `–${baht(p.priceMax)}` : ''}
          </b>
          {p.fullPrice && p.fullPrice > p.price && <s>฿{baht(p.fullPrice)}</s>}
        </span>
      </a>
    </li>
  )
}

// สินค้า Shopee Affiliate เป็นแผงลอยข้างขวา (หน้าแรก + หน้าเกม) ไม่แทรกกลางเนื้อหา — กรอบแผง/แท็บ/ปุ่มเปิดปิดอยู่ใน <ShopeeDock>
// ข้อมูลใน src/data/shopee.ts · ไม่มีสินค้า = ไม่ render · วางไว้ท้าย .page ให้ลำดับ Tab เข้าเนื้อหาก่อนลิงก์สินค้า
// rel="sponsored" ตามกติกา Google สำหรับลิงก์ที่ได้ค่าตอบแทน
export default function ShopeeBox({ gameId }: { gameId?: string }) {
  const products = shopeeProductsFor(gameId)
  if (!products.length) return null
  const lines = LINES.flatMap((line) => {
    const items = products.filter((p) => p.group === line.group)
    if (!items.length) return []
    const list = (
      <ul className="shop-list">
        {items.map((p) => (
          <Card key={p.url} p={p} />
        ))}
      </ul>
    )
    return [{ ...line, list }]
  })
  return (
    <ShopeeDock lines={lines}>
      <p className="shop-foot">
        ภาพและราคาจาก Shopee ณ {thaiDate(SHOPEE_CHECKED)} — ราคาจริงอาจเปลี่ยน · คัดเฉพาะร้าน Mall/ร้านแนะนำ
      </p>
    </ShopeeDock>
  )
}
