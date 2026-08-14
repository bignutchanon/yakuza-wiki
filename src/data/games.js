// ข้อมูลหลักของแต่ละภาค — รูป hero/cover ดึงจาก Steam CDN (ลิงก์เสถียร ไม่ต้องเก็บรูปใน repo)
// เครดิตภาพ: © SEGA — แสดงใต้รูปทุกจุดผ่านคอมโพเนนต์ <Credit>

export const steamHeader = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`

// เกมที่ระบุ image เอง (เกมใหม่ ๆ Steam ใช้ URL แบบ hashed) ให้ใช้ก่อน fallback เป็น steamHeader
export const gameImage = (g) => g.image || steamHeader(g.steamAppId)

export const steamStore = (appId) =>
  `https://store.steampowered.com/app/${appId}/`

// แผนที่เมือง — เก็บไฟล์เองใน public/maps/ (คัดไฟล์คมสุดที่หาได้จากทั้งเว็บแล้ว)
// ต้นทาง Yakuza Wiki (Fandom) © SEGA — เครดิตแสดงใต้รูปในหน้าเกม
// key ใช้อ้างจาก games[].maps (Onomichi/Honolulu ไม่มีไฟล์แผนที่เผยแพร่ที่ไหนเลย)
export const CITY_MAPS = {
  kamurocho: { label: 'คามุโรโจ (โตเกียว)', img: './maps/kamurocho.png' },
  sotenbori: { label: 'โซเท็นโบริ (โอซาก้า)', img: './maps/sotenbori.png' },
  ijincho: { label: 'อิเซซากิ อิจินโจ (โยโกฮาม่า)', img: './maps/ijincho.png' },
  ryukyu: { label: 'ดาวน์ทาวน์ริวกิว (โอกินาว่า)', img: './maps/ryukyu.png' },
}

// mod.status: 'released' | 'wip' | 'none'
export const GAMES = [
  {
    id: 'y0',
    title: 'Yakuza 0',
    subtitle: 'จุดเริ่มต้นของตำนาน',
    year: 1988,
    releaseYear: 2015,
    steamAppId: 638970,
    trailer: 'eeKcgXuewvg',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว', 'โกโร่ มาจิมะ'],
    setting: 'คามุโรโจ (โตเกียว) / โซเท็นโบริ (โอซาก้า) — ค.ศ. 1988',
    blurb:
      'ยุคฟองสบู่ญี่ปุ่นกำลังเดือด คิริวหนุ่มถูกใส่ร้ายคดีฆาตกรรมบนที่ดินผืนเดียวที่ทั้งคามุโรโจต้องการ ส่วนมาจิมะถูกเนรเทศไปคุมคาบาเรต์ในโอซาก้า รอวันกลับเข้าตระกูล — สองเส้นเรื่องค่อย ๆ บรรจบกันเป็นจุดเริ่มต้นของทุกสิ่ง',
    mod: {
      status: 'released',
      url: 'https://drive.google.com/file/d/1vWUKw1czGJhaDXPktMa4fea7__32k67z/view?usp=drive_link',
      note: "รองรับ Yakuza 0 Director's Cut",
      nexus: 'https://www.nexusmods.com/yakuza0directorscut/mods/36',
    },
  },
  {
    id: 'kiwami',
    title: 'Yakuza Kiwami',
    subtitle: 'รีเมคภาคแรก — มังกรกลับคืนสู่คามุโรโจ',
    year: 2005,
    releaseYear: 2016,
    steamAppId: 834530,
    trailer: 'fuBRHFl_LiM',
    maps: ['kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'คามุโรโจ — ค.ศ. 1995 / 2005',
    blurb:
      'คิริวรับผิดแทนเพื่อนรักในคดีฆ่าหัวหน้าตระกูล ติดคุกสิบปี ออกมาพบว่าเงินหนึ่งหมื่นล้านเยนของตระกูลโทโจหายไป และเด็กหญิงชื่อฮารุกะคือกุญแจของทุกอย่าง',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/1l6ylfgV_E9cLI2muS_21_roDiaBzSvfR/view?usp=drive_link', note: 'รองรับ Yakuza Kiwami (Remaster 2025)' },
  },
  {
    id: 'kiwami2',
    title: 'Yakuza Kiwami 2',
    subtitle: 'มังกรสองตัวจะอยู่ฟ้าเดียวกันไม่ได้',
    year: 2006,
    releaseYear: 2017,
    steamAppId: 927380,
    trailer: 'JSTKk_pvjl4',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'คามุโรโจ / โซเท็นโบริ — ค.ศ. 2006',
    blurb:
      'สงครามระหว่างตระกูลโทโจกับพันธมิตรโอมิปะทุ คิริวต้องเผชิญหน้ากับ "มังกรแห่งคันไซ" เรียว โกดะ ในศึกที่แฟน ๆ ยกให้เป็นคู่ปรับที่ดีที่สุดของซีรีส์',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/1JBdKqU0AZh-TkqmMDsn5I9qSRSgNnLTl/view?usp=drive_link', note: 'รองรับ Yakuza Kiwami 2 (Remaster 2025)' },
  },
  {
    id: 'y3',
    title: 'Yakuza Kiwami 3',
    subtitle: 'รีเมคภาค 3 — จากคามุโรโจสู่ชายหาดโอกินาว่า',
    year: 2009,
    releaseYear: 2026,
    steamAppId: 3937550,
    image:
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3937550/a90df0d7be6d8f1dd5d8eceb796840ff522d002a/header.jpg',
    trailer: 'nKeeJzadLUE',
    maps: ['ryukyu', 'kamurocho'],
    protagonists: ['คาซึมะ คิริว'],
    setting: 'โอกินาว่า / คามุโรโจ — ค.ศ. 2009',
    blurb:
      'คิริววางมือไปเปิดสถานเลี้ยงเด็กกำพร้าริมทะเล แต่โครงการรีสอร์ตทหารลากเขากลับเข้าสู่เกมการเมืองและเงาของชายที่หน้าเหมือนคนที่ตายไปแล้ว — รีเมคเต็มรูปแบบของ Yakuza 3 (2009) วางจำหน่ายคู่กับแคมเปญใหม่ Dark Ties',
    mod: { status: 'none' },
  },
  {
    id: 'darkties',
    title: 'Dark Ties',
    subtitle: 'เรื่องราวฝั่งโยชิทากะ มิเนะ — แคมเปญใหม่คู่กับ Kiwami 3',
    year: 2007,
    releaseYear: 2026,
    steamAppId: 3937550,
    image:
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3937550/a90df0d7be6d8f1dd5d8eceb796840ff522d002a/header.jpg',
    trailer: 'nKeeJzadLUE',
    maps: ['kamurocho'],
    protagonists: ['โยชิทากะ มิเนะ'],
    setting: 'โตเกียว — ค.ศ. 2007 (ก่อนเหตุการณ์ภาค 3)',
    blurb:
      'เรื่องราวที่ไม่เคยเล่ามาก่อนของมิเนะ ตัวร้ายจากภาค 3 — เส้นทางจากนักธุรกิจสู่โลกยากูซ่า แคมเปญใหม่ยาว ~15 ชั่วโมงที่มาคู่กับ Yakuza Kiwami 3',
    mod: { status: 'none' },
  },
  {
    id: 'y4',
    title: 'Yakuza 4',
    subtitle: 'สี่ชีวิต หนึ่งคดี',
    year: 2010,
    releaseYear: 2010,
    steamAppId: 1105500,
    trailer: 'SdM55hOwXFQ',
    maps: ['kamurocho'],
    protagonists: ['ชุน อากิยามะ', 'ไทกะ ซาเอะจิมะ', 'มาซาโยชิ ทานิมูระ', 'คาซึมะ คิริว'],
    setting: 'คามุโรโจ — ค.ศ. 2010',
    blurb:
      'ครั้งแรกที่ซีรีส์เล่าผ่านตัวเอกสี่คน — เจ้าหนี้ใจดี นักโทษแหกคุก ตำรวจนอกคอก และมังกรในตำนาน — สี่มุมมองที่พันกันรอบคดีเดียวกลางคามุโรโจ',
    mod: { status: 'released', url: 'https://www.nexusmods.com/yakuza4remastered/mods/233' },
  },
  {
    id: 'y5',
    title: 'Yakuza 5',
    subtitle: 'ความฝัน ห้าเมือง ห้าชีวิต',
    year: 2012,
    releaseYear: 2012,
    steamAppId: 1105510,
    trailer: '5k60CPJm2ss',
    maps: ['kamurocho', 'sotenbori'],
    protagonists: ['คาซึมะ คิริว', 'ไทกะ ซาเอะจิมะ', 'ฮารุกะ ซาวามูระ', 'ชุน อากิยามะ', 'ทัตสึโอะ ชินาดะ'],
    setting: 'ฟุกุโอกะ / ซัปโปโร / โอซาก้า / นาโกย่า / โตเกียว — ค.ศ. 2012',
    blurb:
      'ภาคที่ใหญ่ที่สุดของยุค PS3 — คิริวขับแท็กซี่ในฟุกุโอกะ ฮารุกะไล่ตามฝันไอดอล และสงครามครั้งใหม่กำลังก่อตัวเหนือทั้งห้าเมือง',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/12eyObyFInDo5SjHzwBYSD4yQWHTPsHqd/view?usp=drive_link' },
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
    mod: { status: 'released', url: 'https://drive.google.com/file/d/14_yQgaxuiUQgaY8NQA0eIUlEI8fEyTaW/view?usp=drive_link' },
  },
  {
    id: 'y7',
    title: 'Yakuza: Like a Dragon',
    subtitle: 'มังกรตัวใหม่ อิจิบัง คาสึกะ',
    year: 2019,
    releaseYear: 2020,
    steamAppId: 1235140,
    trailer: 'dNmM9pivqQ0',
    maps: ['ijincho'],
    protagonists: ['อิจิบัง คาสึกะ'],
    setting: 'อิเซซากิ อิจินโจ (โยโกฮาม่า) — ค.ศ. 2019',
    blurb:
      'อิจิบังติดคุก 18 ปีแทนตระกูล ออกมาพบว่าถูกหักหลังและถูกยิงทิ้ง — เขาลุกขึ้นจากกองขยะในโยโกฮาม่าพร้อมเปลี่ยนซีรีส์เป็น RPG เต็มตัวครั้งแรก',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/15fJFSyhdyZ_nopCbECZMk_gdap3CkAKe/view?usp=drive_link' },
  },
  {
    id: 'gaiden',
    title: 'Like a Dragon Gaiden: The Man Who Erased His Name',
    subtitle: 'ชายผู้ลบชื่อตัวเอง',
    year: 2019,
    releaseYear: 2023,
    steamAppId: 2375550,
    trailer: 'm8gvTDCJb0E',
    maps: ['sotenbori'],
    protagonists: ['คาซึมะ คิริว (โจริว)'],
    setting: 'โซเท็นโบริ / ปราสาทโอซาก้า — ค.ศ. 2019–2020',
    blurb:
      'คิริวแกล้งตายและกลายเป็นสายลับนาม "โจริว" — เรื่องราวที่เกิดขึ้นคู่ขนานกับภาค 7 และปูทางสู่ Infinite Wealth',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/1H-ERDEHAQ4cFDStkydr9iR753vzNuoQW/view?usp=drive_link' },
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
    protagonists: ['อิจิบัง คาสึกะ', 'คาซึมะ คิริว'],
    setting: 'โฮโนลูลู (ฮาวาย) / โยโกฮาม่า — ค.ศ. 2024',
    blurb:
      'อิจิบังบินข้ามมหาสมุทรไปตามหาแม่ที่ฮาวาย ส่วนคิริวผู้ป่วยมะเร็งออกเดินทางครั้งสุดท้าย — ภาคที่ใหญ่ที่สุดของซีรีส์ และครั้งแรกที่สองมังกรลุยด้วยกันเต็มภาค',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/1hYSknGiRtufEFFkCV91cDUikmBbTH3Cp/view?usp=drive_link' },
  },
  {
    id: 'pirate',
    title: 'Like a Dragon: Pirate Yakuza in Hawaii',
    subtitle: 'มาจิมะกัปตันโจรสลัด',
    year: 2025,
    releaseYear: 2025,
    steamAppId: 3061810,
    trailer: '4UW7G-fAvOM',
    protagonists: ['โกโร่ มาจิมะ'],
    setting: 'ฮาวาย / มาดแลนติส — ค.ศ. 2025',
    blurb:
      'มาจิมะตื่นบนเกาะร้างพร้อมความจำที่หายไป — คว้าดาบคู่ ยึดเรือ แล้วกลายเป็นกัปตันโจรสลัดแห่งแปซิฟิกในภาคสปินออฟสุดเหวี่ยง',
    mod: { status: 'released', url: 'https://drive.google.com/file/d/13Vt_7d1BTEOg-yEBnXh6Sp_lWXIsRcCM/view?usp=drive_link' },
  },
]

export const gameById = (id) => GAMES.find((g) => g.id === id)
