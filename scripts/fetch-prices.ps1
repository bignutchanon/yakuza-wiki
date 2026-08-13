# ดึงราคาปัจจุบันของทุกภาคจาก Steam (ประเทศไทย) — ใช้ตอนจะอัปเดตตารางใน src/content/news/prices.md
# วิธีใช้: เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน  .\scripts\fetch-prices.ps1
# แล้วคัดลอกราคาไปแก้ในตาราง + เปลี่ยนวันที่ updated: ใน frontmatter
#
# หมายเหตุ: สคริปต์นี้ดึงได้เฉพาะ Steam — ราคา PS Store / Xbox ไม่มี API เปิด
# ต้องเปิดเช็คเองจากลิงก์ในตาราง prices.md (หน้า concept ของ PS Store แสดงราคาไทยตรง ๆ)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$games = [ordered]@{
  "Yakuza 0 Director's Cut"                = 2988580
  "Yakuza Kiwami (2025)"                   = 3717330
  "Yakuza Kiwami 2 (2025)"                 = 3717340
  "Yakuza Kiwami 3 & Dark Ties"            = 3937550
  "Yakuza 4 Remastered"                    = 1105500
  "Yakuza 5 Remastered"                    = 1105510
  "Yakuza 6: The Song of Life"             = 1388590
  "Yakuza: Like a Dragon"                  = 1235140
  "Like a Dragon Gaiden"                   = 2375550
  "Like a Dragon: Infinite Wealth"         = 2072450
  "Like a Dragon: Pirate Yakuza in Hawaii" = 3061810
  "Like a Dragon: Ishin!"                  = 1805480
  "Judgment"                               = 2058180
  "Lost Judgment"                          = 2058190
}

"ราคา Steam TH ณ วันที่ $(Get-Date -Format 'yyyy-MM-dd')"
"".PadRight(60, '-')
foreach ($name in $games.Keys) {
  $id = $games[$name]
  try {
    $r = Invoke-RestMethod "https://store.steampowered.com/api/appdetails?appids=$id&filter=price_overview&cc=th" -ErrorAction Stop
    $p = $r.$id.data.price_overview
    if ($p) {
      $line = "{0,-42} {1}" -f $name, $p.final_formatted
      if ($p.discount_percent -gt 0) { $line += "  (ลด $($p.discount_percent)% จาก $($p.initial_formatted))" }
      $line
    } else {
      "{0,-42} ไม่มีข้อมูลราคา" -f $name
    }
  } catch {
    "{0,-42} ดึงไม่สำเร็จ: {1}" -f $name, $_.Exception.Message
  }
  Start-Sleep -Milliseconds 300
}
