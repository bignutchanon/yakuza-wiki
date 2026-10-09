// ข้อมูลหลักของแต่ละภาค — รูป hero/cover ดึงจาก Steam CDN (ลิงก์เสถียร ไม่ต้องเก็บรูปใน repo)
// เครดิตภาพ: © SEGA — แสดงใต้รูปทุกจุดผ่านคอมโพเนนต์ <Credit>

export type ModStatus = 'released' | 'wip' | 'none'

export interface ModInfo {
  status: ModStatus
  url?: string
  note?: string
  nexus?: string
  // เวอร์ชันล่าสุด + วันที่ปล่อย (ISO) — ใช้ทำป้าย "อัปเดตใหม่" บนแบนเนอร์ ต้องแก้คู่กับ note ทุกครั้งที่ออกแพตช์
  version?: string
  updated?: string
  // รุ่นทดสอบ (beta) ที่แจกคู่กับตัวจริง — ปุ่มรองในหน้าเกม ใช้ตอนอยากให้ผู้เล่นช่วยเทสต์ก่อนออกตัวจริง
  beta?: { url: string; note?: string; version?: string; updated?: string }
  // แพ็กก็อปไฟล์เอง (ไม่มีไฟล์ .bat/.ps1) ของม็อดตัวเดียวกัน — ปุ่มรองในหน้าเกม
  // ไว้ให้คนที่โปรแกรมสแกนไวรัสลบตัวติดตั้งทิ้ง เนื้อไฟล์เกมเหมือนแพ็กปกติทุกอย่าง
  manual?: { url: string; note?: string }
}

export interface Game {
  id: string
  title: string
  subtitle: string
  year: number
  releaseYear: number
  steamAppId?: number
  image?: string
  trailer?: string
  maps?: string[]
  protagonists: string[]
  setting: string
  blurb: string
  mod: ModInfo
  // ชื่อบนหน้าร้าน Steam เมื่อต่างจาก title (เช่น "Yakuza 4 Remastered") — ใช้ใน meta description + alternateName ของ JSON-LD
  // คนค้นด้วยชื่อฉบับที่ตัวเองซื้อ ต้องเจอหน้านี้ · คัดลอกจากหน้าร้าน Steam ตรง ๆ ห้ามเดา
  storeName?: string
  // ชื่อสั้นสำหรับ <title> ของหน้าเกม เมื่อชื่อเต็มยาวจนคำค้นหลัก ("แปลไทย") หลุดท้ายผลค้นหา
  shortTitle?: string
  // รูปการ์ดแชร์ (og:image) — ใส่เฉพาะเกมที่ Steam เก็บ capsule_616x353 แบบ URL hashed (ไม่ใส่ = ประกอบจาก steamAppId)
  ogImage?: string
  // เขียน <title> / meta description ของหน้าเกมเองแทนค่าที่ประกอบอัตโนมัติ (ไว้ให้ทีม SEO ปรับรายภาค)
  seo?: { title?: string; description?: string }
}

export const steamHeader = (appId?: number): string =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`

// ขนาดจริงของภาพจาก Steam — header.jpg เป็น 460×215 และสกรีนช็อตหน้าร้านเป็น 1920×1080 เสมอ
// ใช้เป็นแอตทริบิวต์ width/height ของ <img> เพื่อจองพื้นที่ก่อนรูปโหลดเสร็จ (กัน layout shift / CLS)
export const STEAM_HEADER_SIZE = { width: 460, height: 215 } as const
export const STEAM_SHOT_SIZE = { width: 1920, height: 1080 } as const

// เกมที่ระบุ image เอง (เกมใหม่ ๆ Steam ใช้ URL แบบ hashed) ให้ใช้ก่อน fallback เป็น steamHeader
export const gameImage = (g: Game): string => g.image || steamHeader(g.steamAppId)

// รูปการ์ดแชร์ของหน้าเกม = capsule 616×353 ของ Steam — กว้างเกิน 600×315 ที่ Facebook ใช้ตัดสินให้เป็นการ์ดรูปใหญ่
// (header.jpg 460×215 เล็กกว่าเกณฑ์ ลิงก์ที่แชร์จึงได้รูปย่อเล็ก ๆ ข้างข้อความ)
export const STEAM_CAPSULE_SIZE = { width: 616, height: 353 } as const
export const gameShareImage = (g: Game): string =>
  g.ogImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.steamAppId}/capsule_616x353.jpg`

// ป้าย "อัปเดตใหม่" บนแบนเนอร์ — โชว์เมื่อแพตช์ล่าสุดออกไม่เกิน UPDATE_FRESH_DAYS วัน
// หมายเหตุ: เว็บเป็น static export → วันที่ถูกคำนวณตอน build ป้ายจึงหายก็ต่อเมื่อมี build/deploy ครั้งถัดไป
export const UPDATE_FRESH_DAYS = 30

export const modUpdateBadge = (mod: ModInfo, now: Date = new Date()): string | null => {
  if (mod.status !== 'released') return null
  const fresh = (iso?: string): boolean => {
    if (!iso) return false
    const [y, m, d] = iso.split('-').map(Number)
    const days = (now.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000
    // เผื่อ -1 วัน เพราะ GitHub Actions build ด้วยเวลา UTC ซึ่งช้ากว่าไทย 7 ชม. (แพตช์ที่ปล่อย "วันนี้" ตามเวลาไทยจะยังไม่ถึงกำหนดในสายตา runner)
    return days >= -1 && days <= UPDATE_FRESH_DAYS
  }
  if (fresh(mod.updated)) return `อัปเดต ${mod.version ?? 'ใหม่'}`
  if (mod.beta && fresh(mod.beta.updated)) return `${mod.beta.version ?? 'beta'} ให้ลอง`
  return null
}

export const steamStore = (appId?: number): string =>
  `https://store.steampowered.com/app/${appId}/`

// แผนที่เมือง — เก็บไฟล์เองใน public/maps/ (คัดไฟล์คมสุดที่หาได้จากทั้งเว็บแล้ว)
// ต้นทาง Yakuza Wiki (Fandom) © SEGA — เครดิตแสดงใต้รูปในหน้าเกม
// key ใช้อ้างจาก games[].maps (Onomichi/Honolulu ไม่มีไฟล์แผนที่เผยแพร่ที่ไหนเลย)
// width/height = ขนาดจริงของไฟล์ ต้องใส่ในแท็ก <img> เพื่อจองพื้นที่ล่วงหน้า (กัน layout shift / CLS)
export const CITY_MAPS: Record<string, { label: string; img: string; width: number; height: number }> = {
  kamurocho: { label: 'คามุโรโจ (โตเกียว)', img: '/maps/kamurocho.png', width: 3500, height: 1568 },
  sotenbori: { label: 'โซเท็นโบริ (โอซาก้า)', img: '/maps/sotenbori.png', width: 1920, height: 1080 },
  ijincho: { label: 'อิเซซากิ อิจินโจ (โยโกฮาม่า)', img: '/maps/ijincho.png', width: 1330, height: 874 },
  ryukyu: { label: 'ดาวน์ทาวน์ริวกิว (โอกินาว่า)', img: '/maps/ryukyu.png', width: 1683, height: 1487 },
}

// mod.status: 'released' | 'wip' | 'none'
export const GAMES: Game[] = [
  {
    id: 'ishin',
    title: 'Like a Dragon: Ishin!',
    subtitle: 'ซามูไรยุคบาคุมัตสึ — สปินออฟย้อนยุคที่ไกลจากคามุโรโจที่สุด',
    year: 1866,
    releaseYear: 2023,
    steamAppId: 1805480,
    trailer: 'kyIbxAUH9VU',
    protagonists: ['ริวมะ ซากาโมโตะ'],
    setting: 'โทสะ / เกียว (เกียวโต) — ยุคบาคุมัตสึ ค.ศ. 1860',
    blurb:
      'ญี่ปุ่นปลายยุคเอโดะกำลังจะแตกเป็นสองฝ่ายหลังเรือรบตะวันตกมาถึง ริวมะ ซากาโมโตะถูกใส่ร้ายว่าฆ่าพ่อบุญธรรมของตัวเอง จึงหนีไปเกียวโตแล้วแฝงตัวเข้ากลุ่มชินเซ็นงุมิในชื่อ "ไซโต ฮาจิเมะ" เพื่อล่าฆาตกรตัวจริง — สปินออฟที่ยกนักแสดงทั้งซีรีส์มาสวมบทบุคคลจริงในประวัติศาสตร์ (ฉบับรีเมค Kiwami วางขายทั่วโลกปี 2023 ต้นฉบับปี 2014 มีแต่ในญี่ปุ่น)',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/like-a-dragon-ishin-thai-mod/releases/download/v1.8/LikeADragonIshinThai-v1.8.zip',
      nexus: 'https://www.nexusmods.com/likeadragonishin/mods/87',
      note: 'v1.8 (20 ก.ย. 2026) — แก้กล้องค้างผิดที่ในฉากเข้านอนกับฮารุกะ (กล่องบทพูดว่าง) ติดตั้งทับได้เลย · ตั้งภาษาข้อความในเกมเป็น English',
      version: 'v1.8',
      updated: '2026-09-20',
    },
  },
  {
    id: 'y0',
    title: 'Yakuza 0',
    subtitle: 'จุดเริ่มต้นของตำนาน',
    storeName: "Yakuza 0 Director's Cut",
    year: 1988,
    releaseYear: 2015,
    steamAppId: 2988580,
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2988580/aaceda0f5c16fce191e63f7342d07323e86a1156/header.jpg',
    ogImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2988580/cd4801db60e667d95798120cc4e6e513695beeef/capsule_616x353.jpg',
    trailer: 'eeKcgXuewvg',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว', 'โกโร่ มาจิม่า'],
    setting: 'คามุโรโจ (โตเกียว) / โซเท็นโบริ (โอซาก้า) — ค.ศ. 1988',
    blurb:
      'ยุคฟองสบู่ญี่ปุ่นกำลังเดือด คิริวหนุ่มถูกใส่ร้ายคดีฆาตกรรมบนที่ดินผืนเดียวที่ทั้งคามุโรโจต้องการ ส่วนมาจิม่าถูกเนรเทศไปคุมคาบาเรต์ในโอซาก้า รอวันกลับเข้าตระกูล — สองเส้นเรื่องค่อย ๆ บรรจบกันเป็นจุดเริ่มต้นของทุกสิ่ง',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza0-dc-thai-mod/releases/download/v2.3/Yakuza0DC_Thai_v2.3.zip',
      note: "v2.3 (8 ต.ค. 2026) — แก้ร้านแลก CP ที่ศาลเจ้าหมวด Business ว่างเปล่า + Telephone Club และ Pocket Circuit เป็นไทย (ตัวเลือก คำตอบของสาว ๆ คำพากย์ เมนู ชื่ออะไหล่/รถ) + คำทั่วไปในเมนู (ใช่/ไม่ใช่/ตกลง/ซื้อ) เป็นไทย · รองรับ Yakuza 0 Director's Cut · ติดตั้ง: ปิดเกม แตกไฟล์ zip แล้วลากโฟลเดอร์ runtime ไปวางทับในโฟลเดอร์เกม (Steam → Manage → Browse local files) ตอบ Merge/Replace แล้วเปิดเกมได้เลย · ติดตั้งทับ v2.2 ได้ เซฟเดิมใช้ต่อได้",
      version: 'v2.3',
      updated: '2026-10-08',
      nexus: 'https://www.nexusmods.com/yakuza0directorscut/mods/40',
    },
  },
  {
    id: 'kiwami',
    title: 'Yakuza Kiwami',
    subtitle: 'รีเมคภาคแรก — มังกรกลับคืนสู่คามุโรโจ',
    year: 2005,
    releaseYear: 2016,
    steamAppId: 3717330,
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3717330/07bf98df23eb154febbf878a79ff02b915b6cc43/header.jpg',
    ogImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3717330/afcac448bb5f508b7e75b8eff7cb8b9431dd721a/capsule_616x353.jpg',
    trailer: 'fuBRHFl_LiM',
    maps: ['kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'คามุโรโจ — ค.ศ. 1995 / 2005',
    blurb:
      'คิริวรับผิดแทนเพื่อนรักในคดีฆ่าหัวหน้าตระกูล ติดคุกสิบปี ออกมาพบว่าเงินหนึ่งหมื่นล้านเยนของตระกูลโทโจหายไป และเด็กหญิงชื่อฮารุกะคือกุญแจของทุกอย่าง',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza-kiwami-thai-mod/releases/download/v1.5.1/YakuzaKiwamiR_Thai_v1.5.1.zip',
      nexus: 'https://www.nexusmods.com/yakuzakiwami2025/mods/31',
      note: 'v1.5.1 (10 ต.ค. 2026) — รองรับ Yakuza Kiwami (Remaster 2025) · แก้เกมเด้งใน MesuKing · เมนูหยุดเกมและข้อความในมินิเกม (ไพ่นกกระจอก โชกิ คาสิโน Pocket Circuit ฯลฯ) เป็นไทย ติดตั้งทับได้เลย',
      version: 'v1.5.1',
      updated: '2026-10-10',
    },
  },
  {
    id: 'kiwami2',
    title: 'Yakuza Kiwami 2',
    subtitle: 'มังกรสองตัวจะอยู่ฟ้าเดียวกันไม่ได้',
    year: 2006,
    releaseYear: 2017,
    steamAppId: 3717340,
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3717340/894621031b664c828e8114c42934a098e38d182b/header.jpg',
    ogImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3717340/e92c1041d8697ea3eec7a3aafe60246bce742e7d/capsule_616x353.jpg',
    trailer: 'JSTKk_pvjl4',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'คามุโรโจ / โซเท็นโบริ — ค.ศ. 2006',
    blurb:
      'สงครามระหว่างตระกูลโทโจกับพันธมิตรโอมิปะทุ คิริวต้องเผชิญหน้ากับ "มังกรแห่งคันไซ" เรียว โกดะ ในศึกที่แฟน ๆ ยกให้เป็นคู่ปรับที่ดีที่สุดของซีรีส์',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza-kiwami2-thai-mod/releases/download/v1.3/YakuzaKiwami2R-Thai-v1.3.zip',
      nexus: 'https://www.nexusmods.com/yakuzakiwami2025/mods/32',
      note: 'v1.3 (7 ต.ค. 2026) — รองรับ Yakuza Kiwami 2 (Remaster 2025) · ภาพในเกมเป็นไทย (การ์ดชื่อบท ป้ายบอส มินิเกม การ์ดตัวละคร ป้ายในคัตซีน โลโก้) + เกลาคำแปลเนื้อเรื่องไล่ทีละบท · รุ่นนี้ติดตั้งด้วย install.bat ต้องมีที่ว่างในไดรฟ์เกม ~2.5 GB',
      version: 'v1.3',
      updated: '2026-10-07',
    },
  },
  {
    id: 'y3',
    title: 'Yakuza Kiwami 3',
    subtitle: 'รีเมคภาค 3 — จากคามุโรโจสู่ชายหาดโอกินาว่า',
    storeName: 'Yakuza Kiwami 3 & Dark Ties',
    year: 2009,
    releaseYear: 2026,
    steamAppId: 3937550,
    image:
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3937550/a90df0d7be6d8f1dd5d8eceb796840ff522d002a/header.jpg',
    ogImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3937550/2a9851eada96c190d00c135a94320020653ae0ec/capsule_616x353.jpg',
    trailer: 'nKeeJzadLUE',
    maps: ['ryukyu', 'kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'โอกินาว่า / คามุโรโจ — ค.ศ. 2009',
    blurb:
      'คิริววางมือไปเปิดสถานเลี้ยงเด็กกำพร้าริมทะเล แต่โครงการรีสอร์ตทหารลากเขากลับเข้าสู่เกมการเมืองและเงาของชายที่หน้าเหมือนคนที่ตายไปแล้ว — รีเมคเต็มรูปแบบของ Yakuza 3 (2009) วางจำหน่ายคู่กับแคมเปญใหม่ Dark Ties',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza-kiwami3-thai-mod/releases/download/v1.3.1/YakuzaKiwami3-Thai-v1.3.1.zip',
      nexus: 'https://www.nexusmods.com/yakuzakiwami3/mods/372',
      note: 'v1.3.1 (4 ต.ค. 2026) — เกลาบทพูดโหมด Dark Ties ใหม่ทั้งแคมเปญ (ความหมายตรงเสียงพากย์ญี่ปุ่น · ระดับภาษาตรงความสัมพันธ์) · v1.3 มีภาพในเกมเป็นภาษาไทยและเกลาบทพูดเนื้อเรื่องหลักทั้ง 12 บทแล้ว · ชุดม็อด 3 ไฟล์ ติดตั้งทับได้เลย เซฟเดิมใช้ต่อได้',
      version: 'v1.3.1',
      updated: '2026-10-04',
    },
  },
  {
    id: 'y3r',
    title: 'Yakuza 3 Remastered',
    subtitle: 'ภาค 3 ฉบับรีมาสเตอร์ — ต้นฉบับปี 2009 ก่อนถูกรีเมคเป็น Kiwami 3',
    year: 2009,
    releaseYear: 2019,
    steamAppId: 1088710,
    maps: ['ryukyu', 'kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'โอกินาว่า / คามุโรโจ — ค.ศ. 2009',
    blurb:
      'คิริววางมือจากวงการมาเปิดสถานเลี้ยงเด็กกำพร้าริมทะเลที่โอกินาว่า ก่อนโครงการรีสอร์ตและกระสุนนัดหนึ่งกลางคามุโรโจจะลากเขากลับเข้าสู่ศึกของตระกูลโทโจอีกครั้ง — ฉบับรีมาสเตอร์ของเกมต้นฉบับปี 2009 เนื้อเรื่องเดียวกับ Yakuza Kiwami 3',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza3-thai-mod/releases/download/v1.0/Yakuza3-Thai-Mod-v1.0.zip',
      nexus: 'https://www.nexusmods.com/yakuza3remastered/mods/273',
      note: 'v1.0 (9 ก.ย. 2026) — รุ่นแรก แปลไทยทั้งเกม ลากโฟลเดอร์ทับโฟลเดอร์เกมจบ ไม่ต้องตั้ง Launch Options',
      version: 'v1.0',
      updated: '2026-09-09',
    },
  },
  {
    id: 'y4',
    title: 'Yakuza 4',
    subtitle: 'สี่ชีวิต หนึ่งคดี',
    storeName: 'Yakuza 4 Remastered',
    year: 2010,
    releaseYear: 2010,
    steamAppId: 1105500,
    trailer: 'SdM55hOwXFQ',
    maps: ['kamurocho'],
    protagonists: ['ชุน อากิยามะ', 'ไทกะ ซาเอะจิมะ', 'มาซาโยชิ ทานิมูระ', 'คาซึมะ คิริว'],
    setting: 'คามุโรโจ — ค.ศ. 2010',
    blurb:
      'ครั้งแรกที่ซีรีส์เล่าผ่านตัวเอกสี่คน — เจ้าหนี้ใจดี นักโทษแหกคุก ตำรวจนอกคอก และมังกรในตำนาน — สี่มุมมองที่พันกันรอบคดีเดียวกลางคามุโรโจ',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza4-thai-mod/releases/download/v2.3.2/Yakuza4-Thai-Mod-v2.3.2.zip',
      nexus: 'https://www.nexusmods.com/yakuza4remastered/mods/233',
      note: 'v2.3.2 (16 ก.ย. 2026) — แก้เกมเด้ง/ค้างตอนคุยกับ NPC บางคน (ตาแก่ในท่อระบายน้ำสายซาเอะจิมะ · ฮอสเตสคลับ · โบว์ลิ่ง · ปาเป้า) · ลากโฟลเดอร์เดียวทับ ไม่ต้องตั้ง Launch Options',
      version: 'v2.3.2',
      updated: '2026-09-16',
    },
  },
  {
    id: 'y5',
    title: 'Yakuza 5',
    subtitle: 'ความฝัน ห้าเมือง ห้าชีวิต',
    storeName: 'Yakuza 5 Remastered',
    year: 2012,
    releaseYear: 2012,
    steamAppId: 1105510,
    trailer: '5k60CPJm2ss',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว', 'ไทกะ ซาเอะจิมะ', 'ฮารุกะ ซาวามูระ', 'ชุน อากิยามะ', 'ทัตสึโอะ ชินาดะ'],
    setting: 'ฟุกุโอกะ / ซัปโปโร / โอซาก้า / นาโกย่า / โตเกียว — ค.ศ. 2012',
    blurb:
      'ภาคที่ใหญ่ที่สุดของยุค PS3 — คิริวขับแท็กซี่ในฟุกุโอกะ ฮารุกะไล่ตามฝันไอดอล และสงครามครั้งใหม่กำลังก่อตัวเหนือทั้งห้าเมือง',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza5-thai-mod/releases/download/v1.5/Yakuza5-Thai-v1.5.zip',
      nexus: 'https://www.nexusmods.com/yakuza5remastered/mods/329',
      note: 'v1.5 (29 ส.ค. 2026) — แก้มินิเกมขับแท็กซี่ค้างจอมืด + บทสนทนาค้างไม่ขึ้นปุ่มกดต่อ · เมนูร้าน/บาร์ ชื่อบทหน้าโหลด และซับคัตซีนเป็นไทยครบขึ้น (รวมงานจากรุ่นทดสอบ v1.5 beta เข้าตัวจริงแล้ว) · ติดตั้งทับได้เลย เซฟเดิมใช้ต่อได้',
      version: 'v1.5',
      updated: '2026-08-29',
    },
  },
  {
    id: 'y6',
    title: 'Yakuza 6: The Song of Life',
    subtitle: 'บทเพลงสุดท้ายของมังกร',
    year: 2016,
    releaseYear: 2016,
    steamAppId: 1388590,
    trailer: 'd2uaH7muVmw',
    maps: ['kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'คามุโรโจ / โอโนมิจิ (ฮิโรชิม่า) — ค.ศ. 2016',
    blurb:
      'ฮารุกะหายตัวไปและตื่นขึ้นมาพร้อมลูกน้อยปริศนา คิริวออกตามหาความจริงถึงเมืองท่าเล็ก ๆ ในฮิโรชิม่า — บทสรุปมหากาพย์ของคาซึมะ คิริวบนเอนจินใหม่ Dragon Engine',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza6-thai-mod/releases/download/v1.4/Yakuza6-Thai-v1.4.zip',
      note: 'v1.4 (6 ก.ย. 2026) — ช่องไฟตัวอักษรไทยเป็นแบบสัดส่วน ไม่ห่างเป็นช่องเท่าคันจิแล้ว · ต้องตั้งภาษาเกมใน Steam เป็น Japanese',
      version: 'v1.4',
      updated: '2026-09-06',
    },
  },
  {
    id: 'judgment',
    title: 'Judgment',
    subtitle: 'ทนายที่ตกอับ กับคดีฆาตกรรมต่อเนื่องในคามุโรโจ',
    year: 2018,
    releaseYear: 2019,
    steamAppId: 2058180,
    trailer: 'AKrZgO-bqB4',
    maps: ['kamurocho'],
    protagonists: ['ทาคายูกิ ยากามิ', 'มาซาฮารุ ไคโตะ'],
    setting: 'คามุโรโจ (โตเกียว) — ค.ศ. 2018',
    blurb:
      'ทาคายูกิ ยากามิ ทนายที่ชื่อเสียงพังทั้งวงการหลังคดีหนึ่ง ผันตัวมาเปิดสำนักงานนักสืบเล็ก ๆ ในคามุโรโจ แล้วถูกลากเข้าคดีฆาตกรรมต่อเนื่องที่เหยื่อทุกรายถูกควักลูกตา — สปินออฟแนวสืบสวนที่เอาการต่อสู้แบบซีรีส์มาผสมกับงานสะกดรอย ตามหาเบาะแส และการว่าความในศาล',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/judgment-thai/releases/download/v1.3.0/JudgmentThai-th-v1.3.0.zip',
      nexus: 'https://www.nexusmods.com/judgment/mods/365',
      note: 'v1.3.0 (29 ก.ย. 2026) — เกลาซับเนื้อเรื่องครบ 13 บท · แก้ศัพท์ที่อ่านแปลก (ตำรวจกังฉิน · ความแตก) · ป้ายโป๊กเกอร์ไม่ตกกรอบ · ติดตั้งทับได้เลย เซฟเดิมใช้ต่อได้',
      version: 'v1.3.0',
      updated: '2026-09-29',
    },
  },
  {
    id: 'y7',
    title: 'Yakuza: Like a Dragon',
    subtitle: 'มังกรตัวใหม่ อิจิบัง คาซึกะ',
    year: 2019,
    releaseYear: 2020,
    steamAppId: 1235140,
    trailer: 'dNmM9pivqQ0',
    maps: ['ijincho'],
    protagonists: ['อิจิบัง คาซึกะ'],
    setting: 'อิเซซากิ อิจินโจ (โยโกฮาม่า) — ค.ศ. 2019',
    blurb:
      'อิจิบังติดคุก 18 ปีแทนตระกูล ออกมาพบว่าถูกหักหลังและถูกยิงทิ้ง — เขาลุกขึ้นจากกองขยะในโยโกฮาม่าพร้อมเปลี่ยนซีรีส์เป็น RPG เต็มตัวครั้งแรก',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza7-thai-mod/releases/download/v1.0.4/LikeADragon7-Thai-v1.0.4.zip',
      nexus: 'https://www.nexusmods.com/yakuzalikeadragon/mods/336',
      note: 'v1.0.4 (2 ก.ย. 2026) — คำลงท้าย/สรรพนามตรงเพศผู้พูดขึ้นทั้งเกม (บทของเอริในมินิเกมบริหารธุรกิจ ฯลฯ)',
      version: 'v1.0.4',
      updated: '2026-09-02',
    },
  },
  {
    id: 'gaiden',
    title: 'Like a Dragon Gaiden: The Man Who Erased His Name',
    subtitle: 'ชายผู้ลบชื่อตัวเอง',
    shortTitle: 'Like a Dragon Gaiden',
    year: 2019,
    releaseYear: 2023,
    steamAppId: 2375550,
    trailer: 'm8gvTDCJb0E',
    maps: ['sotenbori'],
    protagonists: ['คาซึมะ คิริว (โจริว)'],
    setting: 'โซเท็นโบริ / ปราสาทโอซาก้า — ค.ศ. 2019–2020',
    blurb:
      'คิริวแกล้งตายและกลายเป็นสายลับนาม "โจริว" — เรื่องราวที่เกิดขึ้นคู่ขนานกับภาค 7 และปูทางสู่ Infinite Wealth',
    mod: {
      status: 'released',
      url: 'https://drive.google.com/file/d/1EmY3mbsLmSlPPdZw1a3tF3bBvcCGeSYt/view?usp=sharing',
      nexus: 'https://www.nexusmods.com/likeadragongaiden/mods/533',
      note: 'v1.0.3 (24 ส.ค. 2026) — แก้ซับไตเติลในคัตซีนที่กลายเป็นภาษาอังกฤษใน v1.0.2',
      version: 'v1.0.3',
      updated: '2026-08-24',
    },
  },
  {
    id: 'lostjudgment',
    title: 'Lost Judgment',
    subtitle: 'ความยุติธรรมที่กฎหมายเอื้อมไม่ถึง',
    year: 2021,
    releaseYear: 2021,
    steamAppId: 2058190,
    trailer: 'FJy96Wve7yo',
    maps: ['kamurocho', 'ijincho'],
    protagonists: ['ทาคายูกิ ยากามิ', 'มาซาฮารุ ไคโตะ'],
    setting: 'คามุโรโจ (โตเกียว) / อิเซซากิ อิจินโจ (โยโกฮาม่า) — ค.ศ. 2021',
    blurb:
      'ตำรวจคนหนึ่งสารภาพกลางศาลว่าเขาฆ่าคน ทั้งที่ตอนเกิดเหตุเขานั่งอยู่ในห้องพิจารณาคดีอีกเมืองหนึ่ง — คำสารภาพนั้นลากยากามิเข้าไปในคดีกลั่นแกล้งของโรงเรียนมัธยมในโยโกฮาม่าที่จบลงด้วยการฆ่าตัวตาย และคำถามว่าถ้ากฎหมายเอาผิดคนผิดไม่ได้ ใครควรเป็นคนลงมือ',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/lost-judgment-thai/releases/download/v1.1.0/LostJudgmentThai-th-v1.1.0.zip',
      nexus: 'https://www.nexusmods.com/lostjudgment/mods/800',
      note: 'v1.1.0 (7 ต.ค. 2026) — เกลาบทพูดทั้งเกม (เนื้อเรื่องหลัก · แฟ้มคดีไคโตะ · ไซด์เคส · School Stories) + วรรณยุกต์ไม่ลอยสูง สระ/วรรณยุกต์อยู่ตรงตัวอักษร + โลโก้หน้าเข้าเกมและตัวหนังสือในรูปมินิเกมเป็นไทย · ฟอนต์เปลี่ยน รัน install.bat ทับของเดิมได้เลย',
      version: 'v1.1.0',
      updated: '2026-10-07',
    },
  },
  {
    id: 'y8',
    title: 'Like a Dragon: Infinite Wealth',
    subtitle: 'สองมังกร ข้ามมหาสมุทร',
    year: 2024,
    releaseYear: 2024,
    steamAppId: 2072450,
    trailer: '7WIpJ-ZZBUQ',
    maps: ['ijincho'],
    protagonists: ['อิจิบัง คาซึกะ', 'คาซึมะ คิริว'],
    setting: 'โฮโนลูลู (ฮาวาย) / โยโกฮาม่า — ค.ศ. 2024',
    blurb:
      'อิจิบังบินข้ามมหาสมุทรไปตามหาแม่ที่ฮาวาย ส่วนคิริวผู้ป่วยมะเร็งออกเดินทางครั้งสุดท้าย — ภาคที่ใหญ่ที่สุดของซีรีส์ และครั้งแรกที่สองมังกรลุยด้วยกันเต็มภาค',
    mod: {
      status: 'released',
      url: 'https://github.com/bignutchanon/yakuza8-thai-mod/releases/download/v1.0.7/LikeADragon8-Thai-v1.0.7.zip',
      nexus: 'https://www.nexusmods.com/likeadragoninfinitewealth/mods/494',
      note: 'v1.0.7 (13 ก.ย. 2026) — รอบเกลาสำนวน: น้ำเสียงตัวละครนิ่งขึ้น + แก้ประโยคที่ความหมายเพี้ยน ติดตั้งทับได้เลย',
      version: 'v1.0.7',
      updated: '2026-09-13',
    },
  },
  {
    id: 'pirate',
    title: 'Like a Dragon: Pirate Yakuza in Hawaii',
    subtitle: 'มาจิม่ากัปตันโจรสลัด',
    year: 2025,
    releaseYear: 2025,
    steamAppId: 3061810,
    ogImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3061810/7028c5abc388a2376e0a19aca1e2362821b2ef62/capsule_616x353.jpg',
    trailer: '4UW7G-fAvOM',
    protagonists: ['โกโร่ มาจิม่า'],
    setting: 'ฮาวาย / มาดแลนติส — ค.ศ. 2025',
    blurb:
      'มาจิม่าตื่นบนเกาะร้างพร้อมความจำที่หายไป — คว้าดาบคู่ ยึดเรือ แล้วกลายเป็นกัปตันโจรสลัดแห่งแปซิฟิกในภาคสปินออฟสุดเหวี่ยง',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/13Vt_7d1BTEOg-yEBnXh6Sp_lWXIsRcCM/view?usp=drive_link', nexus: 'https://www.nexusmods.com/likeadragonpirateyakuzainhawaii/mods/237' },
  },
]

export const gameById = (id: string): Game | undefined => GAMES.find((g) => g.id === id)
