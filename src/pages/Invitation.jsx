import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"

const WEDDING = {
  groom: "Marc",
  bride: "Mariana",
  date: "2026-09-20T18:00:00",
  venues: [
    { label: "Wedding Ceremony", time: "6:00 PM", place: "Saint Georges Church", location: "Feytroun, Lebanon", map: "https://maps.google.com" },
    { label: "Wedding Party", time: "8:30 PM", place: "Bois de Roses", location: "Feytroun, Lebanon", map: "https://maps.google.com" },
  ],
  parents: ["Fadi & Dania Fadel", "Nicolas & Marleine Louis"],
  quote: "We love because he first loved us.",
  quoteRef: "1 John 4:19",
  venue: "Feytroun, Lebanon",
  message: "Request the honor of your presence at the wedding of their son and daughter",
}

function Countdown({ targetDate }) {
  const [time, setTime] = useState({})
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return setTime({ days:0, hours:0, mins:0, secs:0 })
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [targetDate])
  return (
    <div className="flex gap-4 justify-center">
      {Object.entries(time).map(([label, val]) => (
        <div key={label} className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
            {String(val).padStart(2, "0")}
          </div>
          <span className="text-white/50 text-xs mt-1 uppercase tracking-widest">{label}</span>
        </div>
      ))}
    </div>
  )
}

function Petals() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i} className="absolute text-xl select-none"
          initial={{ x: `${Math.random() * 100}vw`, y: -40, opacity: 0.7 }}
          animate={{ y: "110vh", rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.7, 0.5, 0] }}
          transition={{ duration: 6 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}>
          {["🌸", "🌹", "✿", "❀"][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  )
}

const timeline = [
  { time: "5:00 PM", label: "Ceremony", icon: "💒", desc: "Join us as we say our vows" },
  { time: "7:00 PM", label: "Cocktail Hour", icon: "🥂", desc: "Celebrate with drinks & canapés" },
  { time: "8:30 PM", label: "Dinner", icon: "🍽️", desc: "A feast prepared with love" },
  { time: "10:00 PM", label: "First Dance", icon: "💃", desc: "Watch us dance for the first time" },
  { time: "11:00 PM", label: "Party", icon: "🎉", desc: "Dance the night away with us" },
]

export default function Invitation() {
  const [started, setStarted] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [attending, setAttending] = useState(null)
  const [wishes, setWishes] = useState("")
  const [persons, setPersons] = useState(1)
  const [status, setStatus] = useState("idle")
  const [searchParams] = useSearchParams()

  // Silver package: auto-fill guest name & persons from URL
  const guestName = searchParams.get("gn") || ""
  const numPersons = parseInt(searchParams.get("np") || "1")

  useEffect(() => {
    if (guestName) setName(guestName)
    if (numPersons) setPersons(numPersons)
  }, [])

  const handleRSVP = async () => {
    if (!name || attending === null) return alert("Please enter your name and select attendance")
    setStatus("loading")
    try {
      await addDoc(collection(db, "rsvps"), {
        name, email, attending, wishes, persons,
        wedding: `${WEDDING.groom} & ${WEDDING.bride}`,
        createdAt: serverTimestamp()
      })
      setStatus("success")
    } catch (e) {
      console.error(e)
      setStatus("error")
    }
  }

  // SPLASH SCREEN
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0d0a08] flex flex-col items-center justify-center text-center px-6 cursor-pointer relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #3d2314 0%, #0d0a08 70%)" }}
        onClick={() => setStarted(true)}>
        <Petals />
        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-8">You're invited</p>
          <h1 className="font-serif text-7xl md:text-9xl font-light text-white mb-3">{WEDDING.groom}</h1>
          <p className="text-[#c9a96e] text-4xl font-serif italic mb-3">&</p>
          <h1 className="font-serif text-7xl md:text-9xl font-light text-white mb-12">{WEDDING.bride}</h1>
          {guestName && (
            <motion.p className="text-white/50 text-lg mb-8 font-light"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              Dear <span className="text-[#c9a96e]">{guestName}</span>
            </motion.p>
          )}
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 mt-4">
            <p className="text-white/40 text-sm tracking-widest uppercase">Tap to open</p>
            <div className="w-px h-8 bg-gradient-to-b from-[#c9a96e] to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // MAIN INVITATION
  return (
    <div className="min-h-screen bg-[#0d0a08] text-white overflow-x-hidden relative">
      <Petals />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #3d2314 0%, #0d0a08 70%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/5 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-4">We're getting married</p>
          {WEDDING.parents.map((p, i) => (
            <p key={i} className="text-white/40 text-sm">{p}</p>
          ))}
          <p className="text-white/30 text-sm mb-6 italic">{WEDDING.message}</p>
          <h1 className="font-serif text-6xl md:text-8xl font-light mb-2">{WEDDING.groom}</h1>
          <p className="text-[#c9a96e] text-4xl font-serif italic mb-2">&</p>
          <h1 className="font-serif text-6xl md:text-8xl font-light mb-10">{WEDDING.bride}</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase mb-2">September 20, 2026</p>
          <p className="text-white/40 text-sm mb-12">{WEDDING.venue}</p>
          <Countdown targetDate={WEDDING.date} />
        </motion.div>
        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-white/30 text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
          <div className="text-[#c9a96e] text-2xl mb-6">✦</div>
          <p className="text-white/60 text-xl leading-relaxed font-serif italic">"{WEDDING.quote}"</p>
          <p className="text-[#c9a96e] text-sm mt-3 tracking-widest">— {WEDDING.quoteRef}</p>
          <div className="text-[#c9a96e] text-2xl mt-6">✦</div>
        </motion.div>
      </section>

      {/* Venues */}
      <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">Join Us</p>
          <h2 className="font-serif text-4xl font-light text-center mb-12">The Celebration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WEDDING.venues.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }} viewport={{ once: true }}
                className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center hover:border-[#c9a96e]/30 transition">
                <p className="text-[#c9a96e] text-xs tracking-widest uppercase mb-3">{v.label}</p>
                <p className="font-serif text-3xl font-light mb-1">{v.time}</p>
                <p className="text-white font-medium mb-1">{v.place}</p>
                <p className="text-white/40 text-sm mb-4">{v.location}</p>
                <a href={v.map} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#c9a96e] text-sm border border-[#c9a96e]/30 rounded-full px-4 py-2 hover:bg-[#c9a96e]/10 transition">
                  📍 View on Map
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">The Day</p>
          <h2 className="font-serif text-4xl font-light text-center mb-16">Wedding Timeline</h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-white/10" />
            {timeline.map((item, i) => (
              <motion.div key={i} className="flex gap-6 mb-10 items-start"
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <div className="text-right w-16 pt-1">
                  <span className="text-white/40 text-xs">{item.time}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1a1510] border border-[#c9a96e]/40 flex items-center justify-center text-sm flex-shrink-0 relative z-10">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-white/40 text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* RSVP */}
      <section className="py-24 px-6 max-w-md mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-4">Kindly Reply By August 1st</p>
          <h2 className="font-serif text-4xl font-light mb-10">Will you join us?</h2>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                <div className="text-5xl mb-4">💌</div>
                <p className="text-[#c9a96e] font-serif text-2xl mb-2">Thank you, {name}!</p>
                <p className="text-white/50">Your RSVP has been received. We can't wait to celebrate with you.</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
                <input value={name} onChange={e => setName(e.target.value)}
                  type="text" placeholder="Your Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="Your Email (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-[#c9a96e] transition">
                  {[1,2,3,4,5].map(n => <option key={n} value={n} className="bg-[#1a1510]">{n} {n === 1 ? "person" : "persons"}</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setAttending(true)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === true ? "bg-[#c9a96e] border-[#c9a96e] text-black" : "border-white/20 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e]"}`}>
                    ✓ Attending
                  </button>
                  <button onClick={() => setAttending(false)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === false ? "bg-white/20 border-white/40 text-white" : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"}`}>
                    ✗ Decline
                  </button>
                </div>
                <textarea value={wishes} onChange={e => setWishes(e.target.value)}
                  placeholder="Share your wishes... (optional)"
                  rows={3} maxLength={200}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
                <p className="text-white/20 text-xs text-right">{wishes.length}/200</p>
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#b8965d] transition tracking-wider disabled:opacity-50">
                  {status === "loading" ? "Sending..." : "SEND RSVP"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <footer className="text-center py-10 text-white/20 text-sm border-t border-white/5 relative z-10">
        Made with ✦ by <span className="text-[#c9a96e]">Lumivite</span>
      </footer>
    </div>
  )
}