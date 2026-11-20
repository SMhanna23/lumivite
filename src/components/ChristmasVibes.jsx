import { useMemo } from "react"

const EMOJIS = ["🎄", "🎅", "❄️", "🎁", "⭐", "🔔", "🦌", "☃️"]

export default function ChristmasVibes() {
  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    left: Math.random() * 100,
    size: 1 + Math.random() * 1.2,
    duration: 11 + Math.random() * 10,
    delay: -(Math.random() * 20),
    drift: Math.round((Math.random() - 0.5) * 60),
  })), [])

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute top-[-10%] christmas-vibes-fall select-none"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--christmas-drift": `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
