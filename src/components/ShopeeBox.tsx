import { SHOPEE_CHECKED, SHOPEE_IMAGE_SIZE, shopeeImage, shopeeProductsFor } from '@/data/shopee'
import type { ShopeeProduct } from '@/data/shopee'
import { thaiDate } from '@/lib/format'
import ShopeeScroller from '@/components/ShopeeScroller'

// แถวละหมวด ตามลำดับนี้ — หมวดที่ไม่มีสินค้า (เช่นหน้าเกมที่ไม่มีแผ่นขาย) ไม่ขึ้นแถว
const LINES: { group: ShopeeProduct['group']; mark: string; label: string }[] = [
  { group: 'game', mark: '遊', label: 'เกม Yakuza' },
  { group: 'gear', mark: '機', label: 'อุปกรณ์คอม' },
  { group: 'snack', mark: '菓', label: 'ขนมและเครื่องดื่ม' },
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

// แถบสินค้า Shopee Affiliate (หน้าแรกใต้แถบข่าว + หน้าเกมใต้ปุ่มแนะนำ) — ข้อมูลใน src/data/shopee.ts · ไม่มีสินค้า = ไม่ render
// ป้าย "ลิงก์ affiliate" ท้ายหัวข้อคือจุดเดียวบนหน้าที่บอกผู้อ่านว่าเว็บได้ค่าคอมจากลิงก์นี้ (ห้ามถอด)
// rel="sponsored" ตามกติกา Google สำหรับลิงก์ที่ได้ค่าตอบแทน · หัวกล่อง/หัวแถวไม่ใช่ <h2>/<h3> เพื่อไม่ให้แทรกในโครงหัวข้อของหน้า
export default function ShopeeBox({ gameId }: { gameId?: string }) {
  const products = shopeeProductsFor(gameId)
  if (!products.length) return null
  return (
    <aside className="shop" aria-label="สินค้าบน Shopee (ลิงก์ affiliate)">
      {/* <details open> = ผู้อ่านกดหัวกล่องเพื่อย่อ/ขยายได้ ไม่ต้องใช้ JS · เปิดไว้เป็นค่าเริ่มต้น การ์ดจึงอยู่ใน HTML และมองเห็นตั้งแต่โหลด */}
      <details className="shop-fold" open>
        <summary className="shop-title">
          ช้อป <span className="shop-brand">Shopee</span> ผ่านลิงก์นี้ <span className="shop-tag">ลิงก์ affiliate</span>
          <span className="shop-toggle" aria-hidden="true">
            ▾
          </span>
        </summary>
        {LINES.map((line) => {
          const items = products.filter((p) => p.group === line.group)
          if (!items.length) return null
          return (
            <section key={line.group} className="shop-line" aria-label={line.label}>
              <p className="shop-line-title">
                <span className="shop-mark" aria-hidden="true">
                  {line.mark}
                </span>
                {line.label}
              </p>
              <ShopeeScroller>
                {items.map((p) => (
                  <Card key={p.url} p={p} />
                ))}
              </ShopeeScroller>
            </section>
          )
        })}
        <p className="shop-foot">
          ภาพและราคาจาก Shopee ณ {thaiDate(SHOPEE_CHECKED)} — ราคาจริงอาจเปลี่ยน · คัดเฉพาะร้าน Mall/ร้านแนะนำ
        </p>
      </details>
    </aside>
  )
}
