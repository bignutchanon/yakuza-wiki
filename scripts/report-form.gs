/**
 * report-form.gs — ปลายทางของฟอร์มแจ้งบั๊กในหน้า /report/ ของ yakuzathai.com
 *
 * เว็บเป็น static export (GitHub Pages) ไม่มี server ของตัวเอง สคริปต์นี้จึงทำหน้าที่เป็น backend จิ๋ว:
 * รับ POST จากฟอร์ม → เซฟไฟล์แนบ (ถ้ามี) ลง Drive → เขียนหนึ่งแถวลงแท็บของภาคนั้น (และแท็บรวม)
 * แท็บแยกตามภาคถูกสร้างอัตโนมัติเมื่อมีรายงานแรกของภาคนั้น ไม่ต้องเตรียมล่วงหน้า
 *
 * ── วิธีติดตั้ง (ทำครั้งเดียว) ────────────────────────────────────────────────
 * 1. สร้าง Google Sheet ใหม่ ตั้งชื่ออะไรก็ได้ (เช่น "Yakuza Thai — Bug reports")
 * 2. ในชีตนั้น: ส่วนขยาย (Extensions) → Apps Script → ลบโค้ดเดิม → วางไฟล์นี้ทั้งไฟล์
 * 3. แก้ค่าใน CONFIG ด้านล่างถ้าต้องการ (ชื่อแท็บรายภาค / แท็บรวม / ชื่อโฟลเดอร์ Drive)
 * 4. Deploy → New deployment → ประเภท "Web app"
 *      - Execute as:      Me (บัญชีเจ้าของชีต)
 *      - Who has access:  Anyone            ← สำคัญ ต้องเป็น Anyone ไม่ใช่ "Anyone with Google account"
 * 5. กด Deploy แล้วอนุญาตสิทธิ์ (Drive + Sheets) จะได้ URL หน้าตาแบบ
 *      https://script.google.com/macros/s/AKfy…/exec
 *    เอา URL นั้นไปใส่ที่ REPORT_ENDPOINT ใน src/lib/site.ts ของโปรเจกต์เว็บ
 *
 * 6. เปิดล้างไฟล์แนบเก่าอัตโนมัติ: เลือกฟังก์ชัน installCleanupTrigger ในแถบด้านบนของ editor แล้วกด "เรียกใช้"
 *    (ทำครั้งเดียว) จากนั้นทุกวันตีสามสคริปต์จะลบไฟล์แนบที่เก่ากว่า CONFIG.attachmentKeepDays วันให้เอง
 *
 * ── เวลาแก้สคริปต์นี้ทีหลัง ──────────────────────────────────────────────────
 * ต้อง Deploy → Manage deployments → แก้ deployment เดิมเป็น "New version" เสมอ
 * ถ้ากด New deployment ใหม่ URL จะเปลี่ยน แล้วต้องไปแก้ในเว็บด้วย
 *
 * หมายเหตุ: ฟอร์มส่งมาเป็น application/x-www-form-urlencoded (simple request) เบราว์เซอร์จึงไม่ยิง
 * preflight OPTIONS ซึ่ง Apps Script ตอบไม่ได้ — ห้ามเปลี่ยนฝั่งเว็บไปใช้ JSON + custom header
 */

var CONFIG = {
  // แต่ละภาคมีแท็บของตัวเอง ตั้งชื่อจาก gameId ที่ฟอร์มส่งมา (judgment, y8, gaiden, …) สร้างให้อัตโนมัติเมื่อมีรายงานแรกของภาคนั้น
  // อยากเปลี่ยนชื่อแท็บให้อ่านง่ายขึ้น เติมคู่ gameId: 'ชื่อแท็บ' ลงใน tabNames ได้ (ที่ไม่ได้ระบุจะใช้ gameId ตรง ๆ)
  tabNames: {
    ishin: 'Ishin!',
    y0: 'Yakuza 0',
    kiwami: 'Kiwami',
    kiwami2: 'Kiwami 2',
    y3: 'Kiwami 3',
    darkties: 'Dark Ties',
    y4: 'Yakuza 4',
    y5: 'Yakuza 5',
    y6: 'Yakuza 6',
    judgment: 'Judgment',
    y7: 'Yakuza 7',
    gaiden: 'Gaiden',
    lostjudgment: 'Lost Judgment',
    y8: 'Infinite Wealth',
    pirate: 'Pirate Yakuza',
    other: 'เว็บไซต์ - อื่น ๆ',
  },
  // แท็บรวมทุกภาคเรียงตามเวลา — ตั้งเป็น '' ถ้าไม่อยากได้ (จะเขียนเฉพาะแท็บของภาคนั้น)
  masterTabName: 'ทั้งหมด',
  folderName: 'Yakuza Thai — bug report files', // โฟลเดอร์ Drive ที่เก็บไฟล์แนบ
  maxFileBytes: 8 * 1024 * 1024, // กันไฟล์ใหญ่เกิน (ฝั่งเว็บจำกัดไว้ 5 MB อยู่แล้ว)
  // ไฟล์แนบเก่ากว่ากี่วันให้ลบทิ้ง (กัน Drive เต็ม) — แถวในชีตยังอยู่ครบ เปลี่ยนแค่ช่องไฟล์แนบเป็นข้อความว่าลบแล้ว
  // ตั้ง 0 = ไม่ลบอัตโนมัติ
  attachmentKeepDays: 90,
}

var HEADERS = [
  'เวลา',
  'ภาค',
  'เวอร์ชันม็อด',
  'ประเภทปัญหา',
  'บท/ฉาก',
  'อาการ',
  'สเปกเครื่อง',
  'ลิงก์ไฟล์เซฟ',
  'ไฟล์แนบ',
  'ติดต่อกลับ',
  'หน้าที่ส่งมา',
  'User agent',
  'สถานะ',
]

function doPost(e) {
  try {
    var p = (e && e.parameter) || {}

    // ต้องมีอย่างน้อยภาคกับอาการ ไม่งั้นถือว่าเป็นการยิงมั่ว
    if (!p.game || !p.detail) {
      return json({ ok: false, error: 'ข้อมูลไม่ครบ' })
    }

    var fileUrl = ''
    if (p.fileData) {
      fileUrl = saveAttachment_(p.fileData, p.fileName, p.fileType)
    }

    var row = [
      new Date(),
      p.game,
      p.modVersion || '',
      p.issueType || '',
      p.scene || '',
      p.detail,
      p.system || '',
      p.saveLink || '',
      fileUrl,
      p.contact || '',
      p.pageUrl || '',
      p.userAgent || '',
      'ใหม่',
    ]

    // แท็บของภาคนั้น + แท็บรวม (ถ้าเปิดใช้) — ล็อกกันสองคนกดส่งพร้อมกันแล้วเขียนทับแถวเดียวกัน
    var lock = LockService.getScriptLock()
    lock.waitLock(20000)
    try {
      tabFor_(p.gameId).appendRow(row)
      if (CONFIG.masterTabName) {
        tab_(CONFIG.masterTabName).appendRow(row)
      }
    } finally {
      lock.releaseLock()
    }

    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  }
}

// เปิด URL ของ web app ตรง ๆ ในเบราว์เซอร์จะเจอข้อความนี้ (ไว้เช็คว่า deploy ติดแล้ว)
function doGet() {
  return json({ ok: true, service: 'yakuzathai bug report' })
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// แท็บของภาคหนึ่ง ๆ จาก gameId ที่ฟอร์มส่งมา
function tabFor_(gameId) {
  var id = String(gameId || 'other').trim() || 'other'
  // ชื่อแท็บของ Google Sheet ห้ามมี : \ / ? * [ ] และยาวไม่เกิน 100 ตัว
  var name = CONFIG.tabNames[id] || id
  return tab_(String(name).replace(/[:\/?*\[\]]/g, '-').slice(0, 100))
}

// เปิดแท็บตามชื่อ สร้างพร้อมหัวตารางให้ถ้ายังไม่มี
function tab_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName(name)
  if (!sh) {
    sh = ss.insertSheet(name)
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS)
    sh.setFrozenRows(1)
  }
  return sh
}

function folder_() {
  var it = DriveApp.getFoldersByName(CONFIG.folderName)
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.folderName)
}

// เซฟไฟล์แนบ (base64) ลง Drive แล้วคืน URL ของไฟล์ — ไฟล์ยังเป็นส่วนตัว เปิดได้เฉพาะเจ้าของชีต
function saveAttachment_(base64, name, type) {
  var bytes = Utilities.base64Decode(base64)
  if (bytes.length > CONFIG.maxFileBytes) {
    throw new Error('ไฟล์แนบใหญ่เกินกำหนด')
  }
  var safeName = String(name || 'attachment').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80)
  var stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmmss')
  var blob = Utilities.newBlob(bytes, type || 'application/octet-stream', stamp + '-' + safeName)
  return folder_().createFile(blob).getUrl()
}

// ─── ล้างไฟล์แนบเก่า (กัน Drive เต็ม) ──────────────────────────────────────────
// รันเองได้ตลอด และถูกเรียกอัตโนมัติทุกวันถ้าติดตั้ง trigger ด้วย installCleanupTrigger()
// ไฟล์ถูกย้ายลงถังขยะของ Drive (Google ล้างถังให้เองใน 30 วัน) ส่วนแถวในชีตยังอยู่ครบ
// เปลี่ยนแค่ช่อง "ไฟล์แนบ" เป็นข้อความบอกว่าไฟล์ถูกลบไปแล้ว จะได้ไม่มีลิงก์ตายค้างในตาราง
function cleanupOldAttachments() {
  var keepDays = CONFIG.attachmentKeepDays
  if (!keepDays) return

  var cutoff = new Date().getTime() - keepDays * 24 * 60 * 60 * 1000
  var files = folder_().getFiles()
  var removed = []

  while (files.hasNext()) {
    var f = files.next()
    if (f.getDateCreated().getTime() >= cutoff) continue
    removed.push({ id: f.getId(), name: f.getName() })
    f.setTrashed(true)
  }

  if (removed.length) {
    markRemovedAttachments_(removed, keepDays)
  }
  return removed.length
}

// แทนลิงก์ไฟล์ที่ลบไปแล้วในทุกแท็บด้วยข้อความสั้น ๆ (คอลัมน์ "ไฟล์แนบ" = คอลัมน์ที่ 9)
function markRemovedAttachments_(removed, keepDays) {
  var col = HEADERS.indexOf('ไฟล์แนบ') + 1
  var note = 'ไฟล์ถูกลบอัตโนมัติ (เก็บไว้ ' + keepDays + ' วัน)'
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets()

  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s]
    var rows = sh.getLastRow() - 1
    if (rows < 1) continue

    var range = sh.getRange(2, col, rows, 1)
    var values = range.getValues()
    var touched = false

    for (var r = 0; r < values.length; r++) {
      var cell = String(values[r][0] || '')
      if (!cell) continue
      for (var i = 0; i < removed.length; i++) {
        if (cell.indexOf(removed[i].id) !== -1) {
          values[r][0] = note
          touched = true
          break
        }
      }
    }

    if (touched) range.setValues(values)
  }
}

// ติดตั้ง trigger รายวัน — รันฟังก์ชันนี้เองครั้งเดียวจาก editor (กดปุ่ม "เรียกใช้")
// เรียกซ้ำได้ ของเก่าจะถูกลบก่อนสร้างใหม่ ไม่มี trigger ซ้อน
function installCleanupTrigger() {
  var triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'cleanupOldAttachments') {
      ScriptApp.deleteTrigger(triggers[i])
    }
  }
  ScriptApp.newTrigger('cleanupOldAttachments').timeBased().everyDays(1).atHour(3).create()
}
