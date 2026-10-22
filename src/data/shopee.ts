// สินค้า Shopee Affiliate ที่โชว์ใน <ShopeeBox> (หน้าแรก + หน้าเกม) — เว็บเป็น static export ราคาจึงเป็นค่า ณ SHOPEE_CHECKED
// เกณฑ์คัด (22 ต.ค. 2026):
//   เกม  = ร้าน Mall / ร้านแนะนำ · คะแนน ≥ 4.8 จาก ≥ 5 รีวิว · มีของ · ไม่ใช่ PS2/แผ่นปั๊ม/มือสอง/โค้ดดิจิทัล → เลือกตัวถูกสุด
//   อุปกรณ์/ขนม = ร้าน Mall · คะแนน ≥ 4.8 จาก ≥ 50 รีวิว → เลือกตัวขายดีของแบรนด์สายเกม
//   ภาคที่ไม่มีร้านผ่านเกณฑ์ (Gaiden · Judgment · Remastered Collection 3-5) ไม่ใส่
// url = ลิงก์ย่อจาก affiliate.shopee.co.th → ลิงก์ที่กำหนดเอง (Sub_id 1 = yakuzathai) — ลิงก์ shopee.co.th ธรรมดาไม่ได้ค่าคอม
// image = รหัสรูปบน CDN ของ Shopee (ไฟล์ _tn 320×320) · ห้ามเขียนโปรโมชัน/โค้ดส่วนลดที่ไม่ได้ตรวจ
// รายการว่าง = ไม่มีกล่อง Shopee และ /privacy + /about ไม่ขึ้นข้อความแจ้งเรื่อง affiliate

export interface ShopeeProduct {
  name: string
  /** เครื่อง/โซน หรือรายละเอียดสั้นใต้ชื่อ */
  note: string
  group: 'game' | 'gear' | 'snack'
  /** ไอดีภาค (games.ts) ที่สินค้านี้เป็นแผ่นเกมของภาคนั้น — หน้าเกมเรียงไว้หน้าสุด หน้าเกมอื่นไม่โชว์ */
  games?: string[]
  price: number
  priceMax?: number
  /** ราคาก่อนลด (ไม่ใส่ = ไม่มีส่วนลด) */
  fullPrice?: number
  rating: number
  reviews: number
  shop: string
  /** true = Shopee Mall · false = ร้านแนะนำ */
  mall: boolean
  image: string
  url: string
}

export const SHOPEE_CHECKED = '2026-10-22'

export const SHOPEE_IMAGE_SIZE = { width: 320, height: 320 } as const
export const shopeeImage = (hash: string): string => `https://down-th.img.susercontent.com/file/${hash}_tn`

export const SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    name: 'Like a Dragon: Ishin!', note: 'แผ่น PS4/PS5 · EU (EN)', group: 'game', games: ['ishin'],
    price: 740, fullPrice: 1680, rating: 5, reviews: 27, shop: 'Geenamp Game Shop', mall: false,
    image: 'th-11134207-81ztj-meel5omszvus35', url: 'https://s.shopee.co.th/6q1fnPZPVL',
  },
  {
    name: 'Yakuza 0 / Kiwami / Kiwami 2 / 6', note: 'แผ่น PS4 · Zone 3 · เลือกภาคในหน้าสินค้า', group: 'game', games: ['y0', 'kiwami', 'kiwami2', 'y6'],
    price: 790, priceMax: 990, rating: 5, reviews: 7, shop: 'New game kim', mall: false,
    image: 'th-11134207-7r98y-lyos49j52zk110', url: 'https://s.shopee.co.th/AAI7lYwGq3',
  },
  {
    name: 'Like a Dragon: Pirate Yakuza in Hawaii', note: 'แผ่น PS5 · Asia (EN)', group: 'game', games: ['pirate'],
    price: 950, fullPrice: 1990, rating: 5, reviews: 34, shop: 'MONI GAME GADGET STORE', mall: true,
    image: 'th-11134207-81ztn-mu1l5oktxzpi5b', url: 'https://s.shopee.co.th/7AeWC1Y8pN',
  },
  {
    name: 'Lost Judgment', note: 'แผ่น PS4/PS5 · EU (EN)', group: 'game', games: ['lostjudgment'],
    price: 980, fullPrice: 1980, rating: 5, reviews: 5, shop: 'Geenamp Game Shop', mall: false,
    image: 'th-11134207-81ztj-mnjf7rd0y32d48', url: 'https://s.shopee.co.th/7puCzFVbTZ',
  },
  {
    name: 'Like a Dragon: Infinite Wealth', note: 'แผ่น PS5 · Asia (EN)', group: 'game', games: ['y8'],
    price: 990, fullPrice: 2290, rating: 5, reviews: 30, shop: 'MONI GAME GADGET STORE', mall: true,
    image: 'th-11134207-81zti-mu1kxget3m6ec1', url: 'https://s.shopee.co.th/6fiFb6a2qI',
  },
  {
    name: 'Yakuza: Like a Dragon', note: 'แผ่น PS4', group: 'game', games: ['y7'],
    price: 990, priceMax: 1390, fullPrice: 1790, rating: 4.95, reviews: 22, shop: 'ClaSsIC GaME OfficialS', mall: false,
    image: 'th-11134211-81ztp-mdykyckx7bpdd2', url: 'https://s.shopee.co.th/9zyhZFwuB0',
  },
  {
    name: 'Yakuza Kiwami 3 & Dark Ties', note: 'Nintendo Switch 2', group: 'game', games: ['y3'],
    price: 1410, fullPrice: 2135, rating: 5, reviews: 6, shop: 'Billz Gameshop', mall: false,
    image: 'th-11134207-81ztl-mjwgam8clpfoc5', url: 'https://s.shopee.co.th/7fammwWEoW',
  },
  {
    name: 'FANTECH WGP13S จอยเกมมิ่ง', note: 'ทรง X-BOX · มีสาย', group: 'gear',
    price: 643, priceMax: 685, fullPrice: 1590, rating: 4.92, reviews: 4977, shop: 'FANTECH Official Store', mall: true,
    image: 'th-11134207-81ztl-mulkz22lc6bs64', url: 'https://s.shopee.co.th/20wQ4btK5Q',
  },
  {
    name: 'GameSir G7 Pro จอยไร้สาย', note: 'Xbox / PC / มือถือ · 3 โหมด', group: 'gear',
    price: 2556, priceMax: 4390, fullPrice: 2990, rating: 4.94, reviews: 1989, shop: 'GameSir Thailand', mall: true,
    image: 'th-11134207-81ztm-muiriqmejocm91', url: 'https://s.shopee.co.th/2BFqGusgkT',
  },
  {
    name: 'NUBWO BLADE X จอยคอนโทรลเลอร์', note: 'รุ่น NJ034', group: 'gear',
    price: 208, fullPrice: 230, rating: 4.81, reviews: 886, shop: 'JIB Official Store', mall: true,
    image: 'b0564cb08230f5ab7097377d5ff48f9e', url: 'https://s.shopee.co.th/2LZGTDs3PW',
  },
  {
    name: 'Logitech G304 เมาส์ไร้สาย', note: 'LIGHTSPEED · 12,000 DPI', group: 'gear',
    price: 1056, priceMax: 1079, fullPrice: 1599, rating: 4.94, reviews: 5061, shop: 'Logi.shop', mall: true,
    image: 'th-11134207-81ztj-mulkmg6e18nabb', url: 'https://s.shopee.co.th/2VsgfWrQ4Z',
  },
  {
    name: 'Logitech G203 เมาส์เกมมิ่ง', note: 'LIGHTSYNC RGB · มีสาย', group: 'gear',
    price: 554, fullPrice: 990, rating: 4.93, reviews: 6029, shop: 'Logi.shop', mall: true,
    image: 'th-11134207-81ztp-mulklhyg8936e5', url: 'https://s.shopee.co.th/1LgjHNvrRM',
  },
  {
    name: 'FANTECH เมาส์เกมมิ่งไร้สาย', note: 'ปรับ DPI 800–2000', group: 'gear',
    price: 361, priceMax: 634, fullPrice: 900, rating: 4.91, reviews: 6671, shop: 'FANTECH Official Store', mall: true,
    image: 'th-11134211-7rask-m78tc6rdzckj89', url: 'https://s.shopee.co.th/9fLrAdyAqy',
  },
  {
    name: 'ATK Dragonfly R1 เมาส์ไร้สาย', note: 'น้ำหนักเบา · เซนเซอร์ PAW3395', group: 'gear',
    price: 720, priceMax: 2215, fullPrice: 1495, rating: 4.91, reviews: 9812, shop: 'ATK GEAR Brand-Owned Store', mall: true,
    image: 'cn-11134207-820l4-mictiver7xfl5f', url: 'https://s.shopee.co.th/2gC6rrp5Dk',
  },
  {
    name: 'FANTECH MK889 คีย์บอร์ดเมคคานิคอล', note: 'ไฟ RGB 13 โหมด', group: 'gear',
    price: 818, priceMax: 854, fullPrice: 1780, rating: 4.94, reviews: 5001, shop: 'FANTECH Official Store', mall: true,
    image: 'th-11134207-81zto-mull7wq6172a52', url: 'https://s.shopee.co.th/9pfHMwxXW1',
  },
  {
    name: 'AULA F75 คีย์บอร์ดเมคคานิคอล', note: 'ขนาด 75% · ไฟ RGB', group: 'gear',
    price: 1738, priceMax: 2429, fullPrice: 2599, rating: 4.9, reviews: 4906, shop: 'AULA Official Store', mall: true,
    image: 'cn-11134207-820l4-mt6i2wlh4popfa', url: 'https://s.shopee.co.th/2qVX4AoRsn',
  },
  {
    name: 'NUBWO คีย์บอร์ดเมคคานิคอล MINI', note: 'ไร้สาย / บลูทูธ · ไฟ RGB', group: 'gear',
    price: 1035, priceMax: 1189, fullPrice: 1380, rating: 4.94, reviews: 2155, shop: 'NUBWO OFFICIAL STORE', mall: true,
    image: 'sg-11134201-8261e-mjpflgxhb5z768', url: 'https://s.shopee.co.th/30oxGTnoXq',
  },
  {
    name: 'ONIKUMA K8 หูฟังเกมมิ่ง', note: 'ใช้ได้ทั้ง PC / PS4 / มือถือ', group: 'gear',
    price: 399, priceMax: 799, rating: 4.85, reviews: 4232, shop: 'ONIKUMA', mall: true,
    image: 'cn-11134207-7r98o-ln43pw7m3ffd8b', url: 'https://s.shopee.co.th/9Kj0m1zRWw',
  },
  {
    name: 'HyperX Cloud Stinger 2 Core', note: 'หูฟังเกมมิ่งมีสาย สำหรับ PC', group: 'gear',
    price: 1235, fullPrice: 1790, rating: 4.9, reviews: 3055, shop: 'HyperX Flagship Store', mall: true,
    image: 'sg-11134201-821fk-mh7agq5b60p543', url: 'https://s.shopee.co.th/3B8NSmnBCt',
  },
  {
    name: 'FANTECH หูฟังเกมมิ่ง 7.1', note: 'มีไมค์ · ไฟ RGB', group: 'gear',
    price: 403, fullPrice: 475, rating: 4.91, reviews: 2362, shop: 'FANTECH Official Store', mall: true,
    image: 'th-11134207-81ztq-mulm3h50l3b69f', url: 'https://s.shopee.co.th/3LRnf5mXrw',
  },
  {
    name: 'FANTECH แผ่นรองเมาส์เกมมิ่ง', note: 'MP78 / MP291 · เลือกขนาดได้', group: 'gear',
    price: 62, priceMax: 228, fullPrice: 75, rating: 4.94, reviews: 3474, shop: 'FANTECH Official Store', mall: true,
    image: 'sg-11134201-22100-lsl6ohtzjyiv0f', url: 'https://s.shopee.co.th/9Kj0o7uIOB',
  },
  {
    name: 'Lay’s เลย์ แพ็ก 4 ซอง', note: 'ซองละ 32 บาท · เลือกรสได้', group: 'snack',
    price: 99, priceMax: 108, fullPrice: 128, rating: 4.91, reviews: 142682, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-81ztk-mrpmm578ov7m92', url: 'https://s.shopee.co.th/AUuyCGpr1Q',
  },
  {
    name: 'Pringles 6 กระป๋อง', note: 'ซาวครีมและหัวหอม', group: 'snack',
    price: 168, rating: 4.95, reviews: 6044, shop: 'Sino_Family_Shop', mall: true,
    image: 'th-11134207-7ra0l-md50v0eq44jk8c', url: 'https://s.shopee.co.th/AAI7ner7hO',
  },
  {
    name: 'Pringles 6 กระป๋อง', note: 'ออริจินอล · กระป๋องละ 42 ก.', group: 'snack',
    price: 168, rating: 4.95, reviews: 4978, shop: 'Sino_Family_Shop', mall: true,
    image: 'th-11134207-7rasf-m3ynoea3npcnd0', url: 'https://s.shopee.co.th/9zyhbLrl2N',
  },
  {
    name: 'เป๊ปซี่ 1.95 ลิตร แพ็ก 6 ขวด', note: 'ส่งทั่วประเทศ', group: 'snack',
    price: 220, fullPrice: 246, rating: 4.96, reviews: 3308, shop: 'Suntory PepsiCo', mall: true,
    image: 'th-11134207-81zti-mr6u7o9psi6c4a', url: 'https://s.shopee.co.th/9V2R0RWmFm',
  },
  {
    name: 'เป๊ปซี่ 330 มล. แพ็ก 6 ขวด', note: 'ขวดเล็ก', group: 'snack',
    price: 69, rating: 4.99, reviews: 89, shop: 'Tops Prachautit', mall: true,
    image: 'sg-11134201-82595-msy3kpdxtzwmb9', url: 'https://s.shopee.co.th/9Kj0o8XPal',
  },
  {
    name: 'โค้ก 325 มล. 24 กระป๋อง', note: 'ส่งทั่วประเทศ', group: 'snack',
    price: 362, fullPrice: 384, rating: 4.91, reviews: 3288, shop: 'Coca-Cola Official Shop', mall: true,
    image: 'th-11134207-81ztd-mtx6y7e1eqru1b', url: 'https://s.shopee.co.th/AUuyCHSyE0',
  },
  {
    name: 'Doritos โดริโทส แพ็ก 4 ซอง', note: 'ซองละ 32 บาท · เลือกรสได้', group: 'snack',
    price: 102, fullPrice: 128, rating: 4.93, reviews: 8604, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-81ztd-mnco95ewbpxh15', url: 'https://s.shopee.co.th/AKbXzyTbYz',
  },
  {
    name: 'Cheetos ชีโตส แพ็ก 3 ซอง', note: 'ซองละ 20 บาท · เลือกรสได้', group: 'snack',
    price: 56, fullPrice: 60, rating: 4.92, reviews: 9527, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-81zte-mrfnsq3lsft85c', url: 'https://s.shopee.co.th/AAI7nfUEty',
  },
  {
    name: 'Lay’s เลย์ แพ็ก 6 ซอง', note: 'ซองละ 10 บาท · เลือกรสได้', group: 'snack',
    price: 56, fullPrice: 60, rating: 4.92, reviews: 38320, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-81ztl-mrpmkguz9jwn17', url: 'https://s.shopee.co.th/AKbXzxqUMP',
  },
  {
    name: 'เทสโต แพ็ก 6 ซอง', note: 'ซองละ 42 ก. · เลือกสูตรได้', group: 'snack',
    price: 85, priceMax: 139, fullPrice: 139, rating: 4.97, reviews: 3893, shop: 'BJC OFFICIAL STORE', mall: true,
    image: 'th-11134207-81ztl-mq31dxhmxp8se3', url: 'https://s.shopee.co.th/5q98diH2wW',
  },
  {
    name: 'ตะวัน แพ็ก 12 ซอง', note: 'ซองละ 5 บาท · เลือกรสได้', group: 'snack',
    price: 55, priceMax: 56, fullPrice: 60, rating: 4.94, reviews: 12347, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-7ra0m-mcbwabzkf77oe4', url: 'https://s.shopee.co.th/3B8NQiUlSk',
  },
  {
    name: 'Sunbites ธัญพืชอบกรอบ แพ็ก 3 ซอง', note: 'ซองละ 20 บาท · เลือกรสได้', group: 'snack',
    price: 54, priceMax: 56, fullPrice: 60, rating: 4.9, reviews: 16262, shop: 'Pepsico Official Shop', mall: true,
    image: 'th-11134207-81ztn-mubs6tu610qr0b', url: 'https://s.shopee.co.th/30oxEPVOnj',
  },
]

// หน้าเกม: แผ่นของภาคนั้นขึ้นก่อน ตามด้วยอุปกรณ์/ขนม (แผ่นภาคอื่นไม่โชว์) · หน้าแรก: ทุกชิ้นตามลำดับในไฟล์
export const shopeeProductsFor = (gameId?: string): ShopeeProduct[] =>
  gameId
    ? [
        ...SHOPEE_PRODUCTS.filter((p) => p.games?.includes(gameId)),
        ...SHOPEE_PRODUCTS.filter((p) => p.group !== 'game'),
      ]
    : SHOPEE_PRODUCTS
