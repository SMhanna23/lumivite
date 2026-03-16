import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { motion } from "framer-motion"

function MemoriesGallery({ slug }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, "memories"), where("slug", "==", slug)))
      .then(snap => {
        setMemories(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0))
        )
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-white/20 text-xs text-center py-8">Loading memories...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#c9a96e] text-xs tracking-widest uppercase">📸 Guest Memories ({memories.length})</p>
        {memories.length > 0 && (
          <a href={`/memories/${slug}`} target="_blank" rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/40 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
            Open Wall →
          </a>
        )}
      </div>
      {memories.length === 0 ? (
        <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
          <p className="text-3xl mb-2">📸</p>
          <p className="text-white/20 text-sm">No memories uploaded yet</p>
          <p className="text-white/15 text-xs mt-1">Share the memory wall link with guests on the wedding day</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-3">
          {memories.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="break-inside-avoid mb-3 rounded-xl overflow-hidden relative group">
              <img src={m.url} alt="memory" className="w-full object-cover" loading="lazy" />
              {m.guestName && m.guestName !== "A Guest" && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition">
                  <p className="text-white text-xs">{m.guestName}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { slug } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [status, setStatus] = useState("loading")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const load = async () => {
      try {
        const invSnap = await getDoc(doc(db, "invitations", slug))
        if (!invSnap.exists()) { setStatus("notfound"); return }
        const inv = invSnap.data()
        setInvitation(inv)
        const weddingName = `${inv.groom} & ${inv.bride}`
        const rSnap = await getDocs(query(collection(db, "rsvps"), where("wedding", "==", weddingName)))
        setRsvps(rSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()))
        setStatus("ready")
      } catch (e) {
        setStatus("notfound")
      }
    }
    load()
  }, [slug])

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
      <p className="text-[#c9a96e] font-serif text-xl animate-pulse">Loading your dashboard...</p>
    </div>
  )

  if (status === "notfound") return (
    <div className="min-h-screen bg-[#0a0806] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-5xl">💍</p>
      <p className="text-white font-serif text-2xl">Dashboard not found</p>
      <p className="text-white/40 text-sm">This link may be incorrect or the invitation hasn't been published yet.</p>
    </div>
  )

  const attending = rsvps.filter(r => r.attending)
  const declined = rsvps.filter(r => !r.attending)
  const totalPersons = attending.reduce((sum, r) => sum + (r.persons || 1), 0)
  const responseRate = rsvps.length > 0 ? Math.round((attending.length / rsvps.length) * 100) : 0

  const weddingDate = invitation.date ? new Date(invitation.date) : null
  const daysLeft = weddingDate ? Math.ceil((weddingDate - new Date()) / (1000 * 60 * 60 * 24)) : null

  const filteredRsvps = filter === "all" ? rsvps : filter === "attending" ? attending : declined

  return (
    <div className="min-h-screen bg-[#0a0806] text-white"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 70%)" }}>

      {/* Header */}
      <div className="text-center pt-14 pb-8 px-6">
        <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-2">Wedding RSVP Dashboard</p>
        <h1 className="font-serif text-4xl font-light text-white mb-1">
          {invitation.groom} & {invitation.bride}
        </h1>
        {weddingDate && (
          <p className="text-white/40 text-sm mt-2">
            {weddingDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)" }}>
            {daysLeft} days to go
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Attending", value: attending.length, icon: "✅", color: "#4ade80", sub: `${totalPersons} persons` },
            { label: "Declined", value: declined.length, icon: "❌", color: "#f87171", sub: "can't make it" },
            { label: "Response Rate", value: `${responseRate}%`, icon: "💌", color: "#c9a96e", sub: `${rsvps.length} total` },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-light mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <p className="text-white/50 text-xs font-medium">{s.label}</p>
              <p className="text-white/20 text-xs mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        {rsvps.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-8">
            <div className="flex justify-between text-xs mb-3">
              <span className="text-[#4ade80]">{attending.length} attending</span>
              <span className="text-white/30">{totalPersons} total guests coming</span>
              <span className="text-red-400">{declined.length} declined</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${responseRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ background: "linear-gradient(to right, #4ade80, #c9a96e)" }} />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "all", label: `All (${rsvps.length})` },
            { id: "attending", label: `✅ Attending (${attending.length})` },
            { id: "declined", label: `❌ Declined (${declined.length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition"
              style={{ background: filter === f.id ? "#c9a96e" : "rgba(255,255,255,0.05)", color: filter === f.id ? "black" : "rgba(255,255,255,0.5)" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* RSVP List */}
        {filteredRsvps.length === 0 ? (
          <div className="text-center py-16 text-white/20">No responses yet</div>
        ) : (
          <div className="grid gap-3">
            {filteredRsvps.map((rsvp, i) => (
              <motion.div key={rsvp.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rsvp.attending ? "bg-[#4ade80]" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{rsvp.name}</p>
                  {rsvp.wishes && (
                    <p className="text-white/40 text-xs mt-0.5 italic">"{rsvp.wishes}"</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${rsvp.attending ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-red-400/15 text-red-400"}`}>
                  {rsvp.attending ? `✓ ${rsvp.persons || 1} person${(rsvp.persons || 1) > 1 ? "s" : ""}` : "Declined"}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {rsvps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💌</p>
            <p className="text-white/40 text-sm">No RSVPs received yet.</p>
            <p className="text-white/20 text-xs mt-1">Share your invitation link with guests to start receiving responses.</p>
          </div>
        )}

        {invitation.memoriesEnabled && (
          <div className="mt-10">
            <MemoriesGallery slug={slug} />
          </div>
        )}

        <p className="text-center text-white/15 text-xs mt-10">
          Powered by <span className="text-[#c9a96e]/40">Lumivite</span>
        </p>
      </div>
    </div>
  )
}
