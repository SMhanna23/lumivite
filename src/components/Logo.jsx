export default function Logo({ size = "md", href = "/", className = "" }) {
  const sizes = {
    sm: { ring: 44, text: "text-lg" },
    md: { ring: 52, text: "text-2xl" },
    lg: { ring: 64, text: "text-3xl" },
  }
  const s = sizes[size] || sizes.md

  return (
    <a href={href} className={`flex items-center gap-2 ${className}`}>
      <div className="overflow-hidden" style={{ flexShrink: 0, width: s.ring, height: s.ring }}>
        <img src="/logo.png" alt="Lumivite" className="w-full h-full object-cover" style={{ transform: "scale(1.06)" }} />
      </div>
      <span className={`font-serif ${s.text} text-[#c9a96e]`}>Lumivite</span>
    </a>
  )
}
