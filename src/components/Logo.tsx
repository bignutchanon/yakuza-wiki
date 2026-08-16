import { useId } from 'react'

type LogoMarkProps = {
  size?: number
  full?: boolean
  className?: string
}

/**
 * มาร์กโลโก้ "ประตูคามุโรโจ" (ย่อจากซุ้ม Tenkaichi-dōri) — เส้นแดงนีออนมนบนไทล์มุมโค้งสีเข้ม
 * `full=false` (ค่าเริ่มต้น) = ใช้เป็น favicon/ไอคอนเล็ก, `full=true` = เพิ่มอักษร 龍 สีทองตรงกลาง
 * ใช้ตอนแสดงผล ≥28px ขึ้นไป (เช่นโลโก้แถบเมนู) — เล็กกว่านั้นตัวอักษรจะจมไม่ชัด
 */
export function LogoMark({ size = 32, full = false, className }: LogoMarkProps) {
  const glowId = useId()

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        ry="7"
        fill="var(--bg-raise)"
        stroke="var(--line)"
        strokeWidth="1"
      />
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
      </defs>
      <g fill="var(--red)" opacity="0.6" filter={`url(#${glowId})`}>
        <rect x="8" y="12" width="4" height="14" rx="1" />
        <rect x="20" y="12" width="4" height="14" rx="1" />
        <path d="M5,10 L5,6 L8,8 L24,8 L27,6 L27,10 L24,12 L8,12 Z" />
      </g>
      <g fill="var(--red)">
        <rect x="8" y="12" width="4" height="14" rx="1" />
        <rect x="20" y="12" width="4" height="14" rx="1" />
        <path d="M5,10 L5,6 L8,8 L24,8 L27,6 L27,10 L24,12 L8,12 Z" />
      </g>
      {full && (
        <text
          x="16"
          y="22.6"
          textAnchor="middle"
          fontFamily="var(--font-display), 'Noto Sans CJK JP', sans-serif"
          fontSize="8.5"
          fontWeight={700}
          fill="var(--gold)"
        >
          龍
        </text>
      )}
    </svg>
  )
}
