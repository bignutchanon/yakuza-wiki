'use client'

// ปุ่มล้างตัวเลือกคุกกี้ในหน้า /privacy — แยกเป็น client component เล็ก ๆ เพราะต้องใช้ localStorage + window event
// (ยิง event ให้ CookieConsent เปิดแบนเนอร์ใหม่ทันทีไม่ต้อง reload)
export default function CookieResetButton() {
  const resetConsent = () => {
    localStorage.removeItem('cookieConsent')
    window.dispatchEvent(new Event('cookieConsentReset'))
  }
  return (
    <button className="mod-btn" style={{ marginTop: '1.5rem' }} onClick={resetConsent}>
      เปลี่ยนการตั้งค่าคุกกี้
    </button>
  )
}
