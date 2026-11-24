export default function Logo({ size = "md", href = "/", className = "" }) {
  const sizes = {
    sm: { ring: 30, text: "text-lg" },
    md: { ring: 38, text: "text-2xl" },
    lg: { ring: 48, text: "text-3xl" },
  }
  const s = sizes[size] || sizes.md

  return (
    <a href={href} className={`flex items-center gap-2 ${className}`}>
      <img src="/logo.png" alt="Lumivite" width={s.ring} height={s.ring}
        className="rounded-lg object-cover" style={{ flexShrink: 0, width: s.ring, height: s.ring }} />
      <span className={`font-serif ${s.text} text-[#c9a96e]`}>Lumivite</span>
    </a>
  )
}
