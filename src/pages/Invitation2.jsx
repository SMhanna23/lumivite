import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"

const DEFAULT_WEDDING = {
  groom: "Christopher",
  bride: "Joelle",
  date: "2026-09-20T18:00:00",
  venues: [
    { label: "Wedding Ceremony", time: "6:00 PM", place: "Saint Georges Church", location: "Feytroun, Lebanon", map: "https://maps.google.com/?q=Saint+Georges+Church+Feytroun+Lebanon" },
    { label: "Wedding Party", time: "8:30 PM", place: "Bois de Roses", location: "Feytroun, Lebanon", map: "https://maps.google.com/?q=Bois+de+Roses+Feytroun+Lebanon" },
  ],
  parents: ["Abboud Family", "Hanna Family"],
  quote: "Where there is love, there is life.",
  quoteRef: "Mahatma Gandhi",
  venue: "Feytroun, Lebanon",

  registry: [
  { name: "Wish Money", icon: "💳", desc: "Contribute to our honeymoon fund", link: "https://www.wishmoney.io", color: "#c9a96e" },
  { name: "ABC Store", icon: "🎁", desc: "Browse our gift registry", link: "https://www.abc.com.lb", color: "#c9a96e" },
  { name: "Bank Transfer", icon: "🏦", desc: "iban: LB62 0099 0000 0001 0019 2000 9123", link: null, color: "#c9a96e" },
],
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
          <div className="w-16 h-16 bg-[#4a7c59]/10 border border-[#4a7c59]/30 rounded-xl flex items-center justify-center text-2xl font-bold text-[#2d5a3d]">
            {String(val).padStart(2, "0")}
          </div>
          <span className="text-[#4a7c59]/60 text-xs mt-1 uppercase tracking-widest">{label}</span>
        </div>
      ))}
    </div>
  )
}

function Leaves() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div key={i} className="absolute text-2xl select-none"
          initial={{ x: `${Math.random() * 100}vw`, y: -40, opacity: 0.6 }}
          animate={{ y: "110vh", rotate: 180 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.6, 0.3, 0] }}
          transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 12, ease: "linear" }}>
          {["🌿", "🍃", "🌱", "🪴"][Math.floor(Math.random() * 4)]}
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

export default function Invitation({ override = null }) {
  const WEDDING = override ? { ...DEFAULT_WEDDING, ...override } : DEFAULT_WEDDING
  const [started, setStarted] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [attending, setAttending] = useState(null)
  const [wishes, setWishes] = useState("")
  const [persons, setPersons] = useState(1)
  const [status, setStatus] = useState("idle")
  const [playing, setPlaying] = useState(false)
  const [searchParams] = useSearchParams()
  const audioRef = useRef(null)

  const guestName = searchParams.get("gn") || ""
  const numPersons = parseInt(searchParams.get("np") || "1")

  useEffect(() => {
    if (guestName) setName(guestName)
    if (numPersons) setPersons(numPersons)
  }, [])

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  const toggleMusic = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().catch(() => {}); setPlaying(true) }
  }

  const handleRSVP = async () => {
  if (!name || attending === null) return alert("Please enter your name and select attendance")
  setStatus("loading")
  try {
    await addDoc(collection(db, "rsvps"), {
      name, email, attending, wishes, persons,
      wedding: `${WEDDING.groom} & ${WEDDING.bride}`,
      createdAt: serverTimestamp()
    })

    // WhatsApp notification
    const emoji = attending ? "✅" : "❌"
    const msg = `${emoji} New RSVP on Lumivite!\n👤 ${name}\n💒 ${WEDDING.groom} & ${WEDDING.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
    const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`
    fetch(waUrl, { mode: "no-cors" }).catch(() => {})

    setStatus("success")
  } catch (e) {
    console.error(e)
    setStatus("error")
  }
}

  // SPLASH
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 cursor-pointer relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f5f0e8 0%, #e8f0e9 50%, #f0ede4 100%)" }}
        onClick={() => { setStarted(true); setTimeout(() => startMusic(), 800) }}>
        <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
        <Leaves />

        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-[#4a7c59]/20" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-[#4a7c59]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#4a7c59]/5" />

        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
          <div className="text-4xl mb-6">🌿</div>
          <p className="text-[#4a7c59] tracking-[0.4em] text-xs uppercase mb-8 font-medium">You're Invited</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-7xl md:text-9xl font-light text-[#2d3a2e] mb-3">{WEDDING.groom}</h1>
          <p className="text-[#4a7c59] text-4xl italic mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>&</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-7xl md:text-9xl font-light text-[#2d3a2e] mb-12">{WEDDING.bride}</h1>
          {guestName && (
            <motion.p className="text-[#4a7c59]/70 text-lg mb-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              Dear <span className="text-[#4a7c59] font-medium">{guestName}</span>
            </motion.p>
          )}
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2">
            <p className="text-[#4a7c59]/50 text-sm tracking-widest uppercase">Tap to open</p>
            <div className="w-px h-8 bg-gradient-to-b from-[#4a7c59] to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // MAIN
  return (
    <div className="min-h-screen text-[#2d3a2e] overflow-x-hidden relative"
      style={{ background: "#faf8f3" }}>
      <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
      <Leaves />

      {/* Music button */}
      <motion.button onClick={toggleMusic}
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-xl transition"
        style={{ background: "#4a7c59", color: "white" }}>
        {playing ? "⏸" : "🎵"}
      </motion.button>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #e0ede2 0%, #faf8f3 60%)" }}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#4a7c59]" />

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 text-4xl opacity-30">🌿</div>
        <div className="absolute top-8 right-8 text-4xl opacity-30 scale-x-[-1]">🌿</div>
        <div className="absolute bottom-24 left-8 text-4xl opacity-20">🍃</div>
        <div className="absolute bottom-24 right-8 text-4xl opacity-20 scale-x-[-1]">🍃</div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="text-[#4a7c59] tracking-[0.4em] text-xs uppercase mb-6 font-medium">We're getting married</p>
          {WEDDING.parents.map((p, i) => (
            <p key={i} className="text-[#4a7c59]/50 text-sm">{p}</p>
          ))}
          <p className="text-[#4a7c59]/40 text-sm mb-8 italic">Request the honor of your presence</p>

          <div className="flex items-center justify-center gap-6 mb-2">
            <div className="h-px w-16 bg-[#4a7c59]/30" />
            <div className="text-2xl">🌸</div>
            <div className="h-px w-16 bg-[#4a7c59]/30" />
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-6xl md:text-8xl font-light text-[#2d3a2e] mb-1">{WEDDING.groom}</h1>
          <p className="text-[#4a7c59] text-4xl italic my-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>&</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-6xl md:text-8xl font-light text-[#2d3a2e] mb-8">{WEDDING.bride}</h1>

          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-px w-16 bg-[#4a7c59]/30" />
            <p className="text-[#4a7c59]/60 text-sm tracking-widest uppercase">September 20 · 2026</p>
            <div className="h-px w-16 bg-[#4a7c59]/30" />
          </div>

          <p className="text-[#4a7c59]/50 text-sm mb-10">{WEDDING.venue}</p>
          <Countdown targetDate={WEDDING.date} />
        </motion.div>

        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-[#4a7c59]/40 text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#4a7c59]/40 to-transparent" />
        </motion.div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="h-px w-20 bg-[#4a7c59]/30" />
            <span className="text-2xl">🌿</span>
            <div className="h-px w-20 bg-[#4a7c59]/30" />
          </div>
          <p className="text-[#2d3a2e]/70 text-xl leading-relaxed italic"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>"{WEDDING.quote}"</p>
          <p className="text-[#4a7c59] text-sm mt-4 tracking-widest">— {WEDDING.quoteRef}</p>
          <div className="flex items-center gap-4 justify-center mt-8">
            <div className="h-px w-20 bg-[#4a7c59]/30" />
            <span className="text-2xl">🌸</span>
            <div className="h-px w-20 bg-[#4a7c59]/30" />
          </div>
        </motion.div>
      </section>

      {/* Venues */}
      <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#4a7c59] tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium">Join Us</p>
          <h2 className="text-4xl font-light text-center mb-12 text-[#2d3a2e]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>The Celebration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WEDDING.venues.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }} viewport={{ once: true }}
                className="border border-[#4a7c59]/20 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                <div className="h-48 w-full overflow-hidden">
                  <iframe title={v.label} width="100%" height="100%"
                    style={{ border: 0 }} loading="lazy" allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(v.place + " " + v.location)}`}
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-[#4a7c59] text-xs tracking-widest uppercase mb-2 font-medium">{v.label}</p>
                  <p className="text-3xl font-light mb-1 text-[#2d3a2e]"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}>{v.time}</p>
                  <p className="text-[#2d3a2e] font-medium mb-1">{v.place}</p>
                  <p className="text-[#4a7c59]/60 text-sm mb-4">{v.location}</p>
                  <a href={v.map} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#4a7c59] text-sm border border-[#4a7c59]/30 rounded-full px-4 py-2 hover:bg-[#4a7c59]/10 transition">
                    📍 Open in Google Maps
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Photo Gallery */}
      <section className="py-24 px-6 max-w-4xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#4a7c59] tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium">Our Story</p>
          <h2 className="text-4xl font-light text-center mb-12 text-[#2d3a2e]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Moments Together</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(WEDDING.photos?.length
              ? WEDDING.photos.map((src, i) => ({ src, span: i === 0 ? "col-span-2 row-span-2" : "" }))
              : [
                  { src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600", span: "col-span-2 row-span-2" },
                  { src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400", span: "" },
                  { src: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=400", span: "" },
                  { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400", span: "" },
                  { src: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=400", span: "" },
                  { src: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400", span: "" },
                ]
            ).map((photo, i) => (
              <motion.div key={i} className={`${photo.span} overflow-hidden rounded-2xl aspect-square`}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }} whileHover={{ scale: 1.02 }}>
                <img src={photo.src} alt={`moment ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition duration-700" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#4a7c59] tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium">The Day</p>
          <h2 className="text-4xl font-light text-center mb-16 text-[#2d3a2e]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Wedding Timeline</h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-[#4a7c59]/20" />
            {timeline.map((item, i) => (
              <motion.div key={i} className="flex gap-6 mb-10 items-start"
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <div className="text-right w-16 pt-1">
                  <span className="text-[#4a7c59]/50 text-xs">{item.time}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-[#4a7c59]/40 flex items-center justify-center text-sm flex-shrink-0 relative z-10 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-[#2d3a2e]">{item.label}</p>
                  <p className="text-[#4a7c59]/60 text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Gift Registry */}
<section className="py-24 px-6 max-w-2xl mx-auto relative z-10">
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
    <p className="text-[#4a7c59] tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium">With Love</p>
    <h2 className="text-4xl font-light text-center mb-4 text-[#2d3a2e]"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}>Gift Registry</h2>
    <p className="text-[#4a7c59]/50 text-sm text-center mb-12">Your presence is our greatest gift. If you wish to honor us further:</p>
    <div className="grid gap-4">
      {WEDDING.registry.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-5 p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition group"
              style={{ border: "1px solid rgba(74,124,89,0.15)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(74,124,89,0.08)" }}>
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-[#2d3a2e]">{item.name}</p>
                <p className="text-[#4a7c59]/50 text-sm">{item.desc}</p>
              </div>
              <span className="text-[#4a7c59] text-sm opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          ) : (
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid rgba(74,124,89,0.15)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(74,124,89,0.08)" }}>
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-[#2d3a2e]">{item.name}</p>
                <p className="text-[#4a7c59]/50 text-xs font-mono mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(item.desc.replace("iban: ", ""))}
                className="text-xs rounded-full px-3 py-1 transition"
                style={{ color: "#4a7c59", border: "1px solid rgba(74,124,89,0.3)" }}>
                Copy
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  </motion.div>
</section>

      {/* RSVP */}
      <section className="py-24 px-6 max-w-md mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <p className="text-[#4a7c59] tracking-[0.3em] text-xs uppercase mb-4 font-medium">Kindly Reply By August 1st</p>
          <h2 className="text-4xl font-light mb-10 text-[#2d3a2e]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Will you join us?</h2>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                <div className="text-5xl mb-4">💌</div>
                <p className="text-[#4a7c59] text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Thank you, {name}!</p>
                <p className="text-[#2d3a2e]/50">Your RSVP has been received. We can't wait to celebrate with you.</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
                <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Your Full Name"
                  className="w-full bg-white border border-[#4a7c59]/20 rounded-lg px-5 py-4 text-[#2d3a2e] placeholder-[#4a7c59]/30 focus:outline-none focus:border-[#4a7c59] transition shadow-sm" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your Email (optional)"
                  className="w-full bg-white border border-[#4a7c59]/20 rounded-lg px-5 py-4 text-[#2d3a2e] placeholder-[#4a7c59]/30 focus:outline-none focus:border-[#4a7c59] transition shadow-sm" />
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  className="w-full bg-white border border-[#4a7c59]/20 rounded-lg px-5 py-4 text-[#2d3a2e] focus:outline-none focus:border-[#4a7c59] transition shadow-sm">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "persons"}</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setAttending(true)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === true ? "text-white border-[#4a7c59]" : "border-[#4a7c59]/30 text-[#4a7c59]/60 hover:border-[#4a7c59]"}`}
                    style={{ background: attending === true ? "#4a7c59" : "white" }}>
                    ✓ Attending
                  </button>
                  <button onClick={() => setAttending(false)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === false ? "bg-[#2d3a2e] border-[#2d3a2e] text-white" : "border-[#4a7c59]/30 text-[#4a7c59]/60 bg-white"}`}>
                    ✗ Decline
                  </button>
                </div>
                <textarea value={wishes} onChange={e => setWishes(e.target.value)}
                  placeholder="Share your wishes... (optional)" rows={3} maxLength={200}
                  className="w-full bg-white border border-[#4a7c59]/20 rounded-lg px-5 py-4 text-[#2d3a2e] placeholder-[#4a7c59]/30 focus:outline-none focus:border-[#4a7c59] transition resize-none shadow-sm" />
                <p className="text-[#4a7c59]/30 text-xs text-right">{wishes.length}/200</p>
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 font-semibold rounded-lg transition tracking-wider text-white disabled:opacity-50"
                  style={{ background: "#4a7c59" }}>
                  {status === "loading" ? "Sending..." : "SEND RSVP"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <footer className="text-center py-10 text-[#4a7c59]/30 text-sm border-t border-[#4a7c59]/10 relative z-10">
        Made with 🌿 by <span className="text-[#4a7c59]">Lumivite</span>
      </footer>
    </div>
  )
}