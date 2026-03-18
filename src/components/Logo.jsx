export default function Logo({ size = "md", href = "/", className = "" }) {
  const sizes = {
    sm: { ring: 22, text: "text-lg" },
    md: { ring: 28, text: "text-2xl" },
    lg: { ring: 36, text: "text-3xl" },
  }
  const s = sizes[size] || sizes.md

  return (
    <a href={href} className={`flex items-center gap-2 ${className}`}>
      <svg width={s.ring} height={s.ring} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <circle cx="10" cy="14" r="7.5" stroke="#c9a96e" strokeWidth="2.2" fill="none"/>
        <circle cx="18" cy="14" r="7.5" stroke="#c9a96e" strokeWidth="2.2" fill="none"/>
      </svg>
      <span className={`font-serif ${s.text} text-[#c9a96e]`}>Lumivite</span>
    </a>
  )
}
