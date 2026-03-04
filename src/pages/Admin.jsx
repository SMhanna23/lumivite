import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { getAuth, signOut } from "firebase/auth"
import { db } from "../firebase"

export default function Admin() {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchRsvps()
  }, [])

  const fetchRsvps = async () => {
    try {
      const q = query(collection(db, "rsvps"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const attending = rsvps.filter(r => r.attending === true)
  const declined = rsvps.filter(r => r.attending === false)
  const filtered = filter === "all" ? rsvps : filter === "attending" ? attending : declined

  const handleLogout = () => getAuth().signOut()

  return (
    <div className="min-h-screen bg-[#0d0a08] text-white">

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase">Lumivite</span>
          <h1 className="font-serif text-2xl font-light">Dashboard</h1>
        </div>
        <button onClick={handleLogout}
          className="text-white/40 hover:text-white text-sm transition">
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Invited", value: rsvps.length, color: "text-white" },
            { label: "Attending", value: attending.length, color: "text-green-400" },
            { label: "Declined", value: declined.length, color: "text-red-400" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/3 border border-white/8 rounded-xl p-6 text-center">
              <p className={`text-4xl font-light font-serif ${stat.color}`}>{stat.value}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Attendance bar */}
        {rsvps.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Response rate</span>
              <span>{Math.round((rsvps.length / rsvps.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-[#c9a96e] rounded-full transition-all"
                style={{ width: `${(attending.length / rsvps.length) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-green-400">{attending.length} attending</span>
              <span className="text-red-400">{declined.length} declined</span>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "attending", "declined"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition capitalize ${filter === f ? "bg-[#c9a96e] text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {f} {f === "all" ? `(${rsvps.length})` : f === "attending" ? `(${attending.length})` : `(${declined.length})`}
            </button>
          ))}
          <button onClick={fetchRsvps}
            className="ml-auto px-4 py-2 rounded-lg text-sm bg-white/5 text-white/50 hover:text-white transition">
            ↻ Refresh
          </button>
        </div>

        {/* RSVP List */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">No RSVPs yet</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rsvp, i) => (
              <motion.div key={rsvp.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 bg-white/3 border border-white/8 rounded-xl px-5 py-4">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rsvp.attending ? "bg-green-400" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{rsvp.name}</p>
                  {rsvp.email && <p className="text-white/30 text-sm truncate">{rsvp.email}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${rsvp.attending ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                    {rsvp.attending ? "Attending" : "Declined"}
                  </span>
                  {rsvp.createdAt && (
                    <p className="text-white/20 text-xs mt-1">
                      {rsvp.createdAt.toDate?.()?.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}