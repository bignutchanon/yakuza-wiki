type LogoMarkProps = {
  size?: number
  className?: string
}

/** ตราสัญลักษณ์ D2: มังกรแดงลอดซุ้มทองบนพื้นดำ */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <img
      src="/icon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
    />
  )
}
