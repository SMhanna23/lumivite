import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { motion, AnimatePresence } from "framer-motion"

export default function SeatFinder() {
  const { slug } = useParams()
  const [wedding, setWedding] = useState(null)
  const [status, setStatus] = useState("loading") // loading | disabled | notfound | ready
  const [queryText, setQueryText] = useState("")
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "invitations", slug))
        if (!snap.exists()) { setStatus("notfound"); return }
        const d = snap.data()
        if (!d.seating?.enabled) { setStatus("disabled"); return }
        setWedding(d)
        setStatus("ready")
      } catch {
        setStatus("notfound")
      }
    }
    load()
  }, [slug])

  const guests = wedding?.seating?.guests || []
  const tables = wedding?.seating?.tables || []
  const tableById = useMemo(() => Object.fromEntries(tables.map(t => [t.id, t])), [tables])

  const matches = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    if (q.length < 2) return []
    return guests.filter(g => g.name.toLowerCase().includes(q)).slice(0, 8)
  }, [queryText, guests])

  const resultTable = picked ? tableById[picked.tableId] : null

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0c0b09] flex items-center justify-center">
      <p className="text-[#c4a35a] font-serif text-xl animate-pulse">Loading...</p>
    </div>
  )

  if (status === "disabled" || status === "notfound") return (
    <div className="min-h-screen bg-[#0c0b09] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">🪑</p>
      <p className="text-white font-serif text-2xl">Seat lookup not available</p>
      <p className="text-white/40 text-sm">Please ask a member of the welcome team for your table number.</p>
    </div>
  )

  const couple = `${wedding.groom} & ${wedding.bride}`

  return (
    <div className="min-h-screen bg-[#0c0b09] text-white" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="text-center pt-16 pb-10 px-6"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1a1508, #0c0b09)" }}>
        <p className="text-[#c4a35a] tracking-[0.3em] text-xs uppercase mb-3">Find Your Seat</p>
        <h1 className="font-serif text-4xl font-light text-white mb-3">{couple}</h1>
        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
          Type your name below to find your table
        </p>
      </div>

      <div className="max-w-md mx-auto px-6 pb-20">
        <div className="relative mb-4">
          <input
            autoFocus
            value={queryText}
            onChange={e => { setQueryText(e.target.value); setPicked(null) }}
            placeholder="Enter your name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/25 text-base focus:outline-none focus:border-[#c4a35a] transition"
          />
        </div>

        <AnimatePresence mode="wait">
          {picked ? (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(196,163,90,0.06)", border: "1px solid rgba(196,163,90,0.25)" }}>
              <p className="text-white/40 text-sm mb-2">{picked.name}</p>
              <p className="text-[#c4a35a] tracking-[0.2em] text-xs uppercase mb-2">Your Table</p>
              <p className="font-serif text-5xl font-light text-white mb-1">
                {resultTable ? resultTable.label : "—"}
              </p>
              {!resultTable && (
                <p className="text-white/30 text-xs mt-3">Not yet assigned to a table — please check with the welcome team.</p>
              )}
              <button onClick={() => { setPicked(null); setQueryText("") }}
                className="mt-6 text-xs px-4 py-2 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition">
                Search again
              </button>
            </motion.div>
          ) : matches.length > 0 ? (
            <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {matches.map(g => (
                <button key={g.id} onClick={() => setPicked(g)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-white text-sm">{g.name}</span>
                  <span className="text-white/25 text-xs">{g.persons > 1 ? `${g.persons} guests` : ""}</span>
                </button>
              ))}
            </motion.div>
          ) : queryText.trim().length >= 2 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-white/30 text-sm text-center py-6">
              No match found — please check with the welcome team.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
