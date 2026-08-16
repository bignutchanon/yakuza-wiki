interface CreditProps {
  href?: string
  label?: string
}

// เครดิตแหล่งที่มาของรูป — แสดงใต้รูปทุกจุดตามข้อตกลงของเว็บ
export default function Credit({ href, label = 'ภาพ: © SEGA — จากหน้าร้าน Steam' }: CreditProps) {
  return (
    <div className="credit">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {label} ↗
        </a>
      ) : (
        label
      )}
    </div>
  )
}
