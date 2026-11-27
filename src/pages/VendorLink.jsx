import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

const ROLE_ICON = { caterer: "🍽️", dj: "🎵", florist: "💐", photographer: "📸", other: "🔧" }

export default function VendorLink() {
  const { venueId, eventId } = useParams()
  const [status, setStatus] = useState("loading") // loading | notfound | ready
  const [event, setEvent] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/venue-events?venueId=${venueId}&eventId=${eventId}&public=1`)
        if (!res.ok) { setStatus("notfound"); return }
        setEvent(await res.json())
        setStatus("ready")
      } catch {
        setStatus("notfound")
      }
    }
    load()
  }, [venueId, eventId])

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0c0b09] flex items-center justify-center">
      <p className="text-[#c9a96e] font-serif text-xl animate-pulse">Loading...</p>
    </div>
  )

  if (status === "notfound") return (
    <div className="min-h-screen bg-[#0c0b09] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">📋</p>
      <p className="text-white font-serif text-2xl">Link not found</p>
      <p className="text-white/40 text-sm">This event link may be incorrect or expired.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0b09] text-white px-6 py-10" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-2">Event Details</p>
          <h1 className="font-serif text-3xl font-light">{event.eventName}</h1>
          <p className="text-white/40 text-sm mt-2">{event.date} {event.hallName ? `· ${event.hallName}` : ""}</p>
        </div>

        {event.timeline?.length > 0 && (
          <div className="mb-10">
            <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">Timeline</p>
            <div className="grid gap-2">
              {event.timeline.map(t => (
                <div key={t.id} className="flex items-center gap-4 rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-[#c9a96e] text-sm font-mono">{t.time}</span>
                  <span className="text-white/80 text-sm">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.vendors?.length > 0 && (
          <div>
            <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">Vendors</p>
            <div className="grid gap-2">
              {event.vendors.map(v => (
                <div key={v.id} className="rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-white text-sm font-medium">{ROLE_ICON[v.role] || "🔧"} {v.name} <span className="text-white/30 text-xs capitalize">({v.role})</span></p>
                  <p className="text-white/40 text-xs mt-1">{v.phone} {v.email ? `· ${v.email}` : ""}</p>
                  {v.notes && <p className="text-white/30 text-xs mt-1">{v.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!event.timeline?.length && !event.vendors?.length && (
          <p className="text-white/30 text-sm text-center">No vendor or timeline details have been added yet.</p>
        )}
      </div>
    </div>
  )
}
