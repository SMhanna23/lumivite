import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"

const DEFAULT_WEDDING = {
  groom: "Christopher",
  bride: "Joelle",
  groomAr: "كريستوفر",
  brideAr: "جويل",
  date: "2026-09-20T18:00:00",
  venues: [
    { label: "Wedding Ceremony", labelAr: "مراسم الزواج", time: "6:00 PM", place: "Saint Georges Church", placeAr: "كنيسة مار جرجس", location: "Feytroun, Lebanon", locationAr: "فيترون، لبنان", map: "https://maps.google.com/?q=Saint+Georges+Church+Feytroun+Lebanon" },
    { label: "Wedding Party", labelAr: "حفل الزفاف", time: "8:30 PM", place: "Bois de Roses", placeAr: "بوا دو روز", location: "Feytroun, Lebanon", locationAr: "فيترون، لبنان", map: "https://maps.google.com/?q=Bois+de+Roses+Feytroun+Lebanon" },
  ],
  parents: ["Fadi & Dania Abboud", "Nicolas & Marleine Hanna"],
  parentsAr: ["فادي ودانيا عبود", "نيكولا ومرلين حنا"],
  quote: "We love because he first loved us.",
  quoteAr: "نحن نحب لأنه هو أحبنا أولاً",
  quoteRef: "1 John 4:19",
  venue: "Feytroun, Lebanon",
  venueAr: "فيترون، لبنان",
  message: "Request the honor of your presence at the wedding of their son and daughter",
  messageAr: "يطلبون شرف حضوركم حفل زفاف نجلهم وابنتهم",
  registry: [
    { name: "Wish Money", icon: "💳", desc: "Contribute to our honeymoon fund", descAr: "ساهم في صندوق شهر العسل", link: "https://www.wishmoney.io", color: "#c9a96e" },
    { name: "ABC Store", icon: "🎁", desc: "Browse our gift registry", descAr: "تصفح قائمة هداياي", link: "https://www.abc.com.lb", color: "#c9a96e" },
    { name: "Bank Transfer", icon: "🏦", desc: "iban: LB62 0099 0000 0001 0019 2000 9123", descAr: "iban: LB62 0099 0000 0001 0019 2000 9123", link: null, color: "#c9a96e" },
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
  const [lang, setLang] = useState("en")
  const ar = lang === "ar"
  const photos = WEDDING.photos?.length ? WEDDING.photos : [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600",
    "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=600",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600",
    "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600",
  ]
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
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
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

  // SPLASH SCREEN
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0d0a08] flex flex-col items-center justify-center text-center px-6 cursor-pointer relative overflow-hidden"
        dir={ar ? "rtl" : "ltr"}
        style={{ background: "radial-gradient(ellipse at 50% 30%, #3d2314 0%, #0d0a08 70%)" }}
        onClick={() => {
          setStarted(true)
          setTimeout(() => startMusic(), 800)
        }}>
        <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
        <Petals />
        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-8">
            {ar ? "أنتم مدعوون" : "You're invited"}
          </p>
          <h1 className="font-serif text-7xl md:text-9xl font-light text-white mb-3">
            {ar ? WEDDING.groomAr : WEDDING.groom}
          </h1>
          <p className="text-[#c9a96e] text-4xl font-serif italic mb-3">&</p>
          <h1 className="font-serif text-7xl md:text-9xl font-light text-white mb-12">
          {ar ? WEDDING.brideAr : WEDDING.bride}
          </h1>
          {guestName && (
            <motion.p className="text-white/50 text-lg mb-8 font-light"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              {ar ? "عزيزنا" : "Dear"} <span className="text-[#c9a96e]">{guestName}</span>
            </motion.p>
          )}
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 mt-4">
            <p className="text-white/40 text-sm tracking-widest uppercase">{ar ? "اضغط للفتح" : "Tap to open"}</p>
            <div className="w-px h-8 bg-gradient-to-b from-[#c9a96e] to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // MAIN INVITATION
  return (
    <div className="min-h-screen bg-[#0d0a08] text-white overflow-x-hidden relative"
      dir={ar ? "rtl" : "ltr"}
      style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>
      <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
      <Petals />

      {/* Floating music button */}
      <motion.button onClick={toggleMusic}
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#c9a96e] text-black flex items-center justify-center shadow-2xl hover:bg-[#b8965d] transition text-xl">
        {playing ? "⏸" : "🎵"}
      </motion.button>

      {/* Language Toggle */}
        <motion.button onClick={() => setLang(ar ? "en" : "ar")}
         initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 left-6 z-50 h-10 px-4 rounded-full flex items-center justify-center shadow-2xl text-sm font-medium transition"
        style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.4)", color: "#c9a96e" }}>
         {ar ? "EN" : "عربي"}
        </motion.button>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #3d2314 0%, #0d0a08 70%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/5 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-4">{ar ? "نحن نتزوج" : "We're getting married"}</p>
          {(ar ? WEDDING.parentsAr : WEDDING.parents).map((p, i) => (
            <p key={i} className="text-white/40 text-sm">{p}</p>
          ))}
          <p className="text-white/30 text-sm mb-6 italic">{ar ? WEDDING.messageAr : WEDDING.message}</p>
          <h1 className="font-serif text-6xl md:text-8xl font-light mb-2">{ar ? WEDDING.groomAr : WEDDING.groom}</h1>
          <p className="text-[#c9a96e] text-4xl font-serif italic mb-2">&</p>
          <h1 className="font-serif text-6xl md:text-8xl font-light mb-10">{ar ? WEDDING.brideAr : WEDDING.bride}</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase mb-2">
            {ar
              ? new Date(WEDDING.date).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
              : new Date(WEDDING.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-white/40 text-sm mb-12">{ar ? WEDDING.venueAr : WEDDING.venue}</p>
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
          <p className="text-white/70 text-2xl md:text-3xl leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive" }}>"{ar ? WEDDING.quoteAr : WEDDING.quote}"</p>
          <p className="text-[#c9a96e] text-sm mt-3 tracking-widest">— {WEDDING.quoteRef}</p>
          <div className="text-[#c9a96e] text-2xl mt-6">✦</div>
        </motion.div>
      </section>

      {/* Our Story — Photo 1 */}
      <section className="py-12 px-6 max-w-xl mx-auto relative z-10">
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-3">{ar ? "قصتنا" : "Our Story"}</p>
          <h2 className="mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.5rem" : "3.8rem", color: "white", fontWeight: 400, lineHeight: 1.2 }}>
            {ar ? "لحظاتنا معاً" : "Moments Together"}
          </h2>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#c9a96e]/60" />
            <span className="text-[#c9a96e]">✦</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#c9a96e]/60" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          whileHover={{ scale: 1.03, rotate: 0, zIndex: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{ cursor: "pointer" }}>
          <div className="bg-white p-3 pb-12" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}>
            <img src={photos[0]} alt="moment 1" className="w-full" />
          </div>
        </motion.div>
      </section>

      {/* Venues */}
        <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">{ar ? "انضموا إلينا" : "Join Us"}</p>
          <h2 className="font-serif text-4xl font-light text-center mb-12">{ar ? "الاحتفال" : "The Celebration"}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WEDDING.venues.map((v, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }} viewport={{ once: true }}
          className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden hover:border-[#c9a96e]/30 transition">
          {/* Map embed */}
          <div className="h-48 w-full overflow-hidden">
            <iframe
              title={v.label}
              width="100%" height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(v.place + " " + v.location)}`}
            />
          </div>
          <div className="p-6 text-center">
            <p className="text-[#c9a96e] text-xs tracking-widest uppercase mb-2">{ar ? v.labelAr : v.label}</p>
            <p className="font-serif text-2xl font-light mb-1">{v.time}</p>
            <p className="text-white font-medium mb-1">{ar ? v.placeAr : v.place}</p>
            <p className="text-white/40 text-sm mb-4">{ar ? v.locationAr : v.location}</p>
            <a href={v.map} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#c9a96e] text-sm border border-[#c9a96e]/30 rounded-full px-4 py-2 hover:bg-[#c9a96e]/10 transition">
              📍 Open in Google Maps
            </a>
          </div>
        </motion.div>
        ))}
      </div>
      </motion.div>
      </section>

      {/* Photos 2-3 */}
      <section className="py-10 px-6 max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-2 gap-8 md:gap-12">
          {[{ src: photos[1], rot: 2.5 }, { src: photos[2], rot: -2 }].map(({ src, rot }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30, rotate: rot }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ cursor: "pointer" }}>
              <div className="bg-white p-2 pb-12" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
                <img src={src} alt={`moment ${i + 2}`} className="w-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>     

      {/* Timeline */}
      <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">{ar ? "اليوم" : "The Day"}</p>
          <h2 className="font-serif text-4xl font-light text-center mb-16">{ar ? "برنامج حفل الزفاف" : "Wedding Timeline"}</h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-white/10" />
            {(WEDDING.timeline || timeline).map((item, i) => (
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

      {/* Photos 4-6 */}
      <section className="py-10 px-6 max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-3 gap-5 md:gap-8">
          {[{ src: photos[3], rot: 3 }, { src: photos[4] || photos[1], rot: -2 }, { src: photos[5] || photos[2], rot: 1.5 }].map(({ src, rot }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30, rotate: rot }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ cursor: "pointer" }}>
              <div className="bg-white p-2 pb-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                <img src={src} alt={`moment ${i + 4}`} className="w-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gift Registry */}
<section className="py-24 px-6 max-w-2xl mx-auto relative z-10">
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
    <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">{ar ? "بكل محبة" : "With Love"}</p>
    <h2 className="font-serif text-4xl font-light text-center mb-4">{ar ? "قائمة الهدايا" : "Gift Registry"}</h2>
    <p className="text-white/40 text-sm text-center mb-12">{ar ? "حضوركم هو أغلى هدية. إن أردتم تكريمنا أكثر:" : "Your presence is our greatest gift. If you wish to honor us further:"}</p>
    <div className="grid gap-4">
      {WEDDING.registry.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/3 hover:border-[#c9a96e]/40 hover:bg-white/5 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">{item.name}</p>
                <p className="text-white/40 text-sm">{ar ? item.descAr : item.desc}</p>
              </div>
              <span className="text-[#c9a96e] text-sm opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          ) : (
            <div className="flex items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/3">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">{item.name}</p>
                <p className="text-white/40 text-sm font-mono text-xs mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(item.desc.replace("iban: ", ""))}
                className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">
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
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-4">
            {ar
              ? `يرجى الرد قبل ${WEDDING.rsvpDeadline ? new Date(WEDDING.rsvpDeadline + "T12:00:00").toLocaleDateString("ar-EG", { month: "long", day: "numeric" }) : "١ أغسطس"}`
              : `Kindly Reply By ${WEDDING.rsvpDeadline ? new Date(WEDDING.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "August 1st"}`}
          </p>
          <h2 className="mb-10" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3.5rem", fontWeight: 400, color: "white", lineHeight: 1.2 }}>{ar ? "هل ستنضمون إلينا؟" : "Will you join us?"}</h2>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                <div className="text-5xl mb-4">💌</div>
                <p className="text-[#c9a96e] font-serif text-2xl mb-2">{ar ? `شكراً، ${name}!` : `Thank you, ${name}!`}</p>
                <p className="text-white/50">{ar ? "تم استلام ردك. لا يسعنا الانتظار للاحتفال معك." : "Your RSVP has been received. We can't wait to celebrate with you."}</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
                <input value={name} onChange={e => setName(e.target.value)}
                  type="text" placeholder={ar ? "اسمك الكامل" : "Your Full Name"}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder={ar ? "بريدك الإلكتروني (اختياري)" : "Your Email (optional)"}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition" />
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-[#c9a96e] transition">
                  {[1,2,3,4,5].map(n => <option key={n} value={n} className="bg-[#1a1510]">{n} {n === 1 ? "person" : "persons"}</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setAttending(true)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === true ? "bg-[#c9a96e] border-[#c9a96e] text-black" : "border-white/20 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e]"}`}>
                    {ar ? "✓ حاضر" : "✓ Attending"}
                  </button>
                  <button onClick={() => setAttending(false)}
                    className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === false ? "bg-white/20 border-white/40 text-white" : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"}`}>
                    {ar ? "✗ اعتذار" : "✗ Decline"}
                  </button>
                </div>
                <textarea value={wishes} onChange={e => setWishes(e.target.value)}
                  placeholder={ar ? "شاركنا أمنياتك... (اختياري)" : "Share your wishes... (optional)"}
                  rows={3} maxLength={200}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
                <p className="text-white/20 text-xs text-right">{wishes.length}/200</p>
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#b8965d] transition tracking-wider disabled:opacity-50">
                  {status === "loading" ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال التأكيد" : "SEND RSVP")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <footer className="text-center py-10 text-white/20 text-sm border-t border-white/5 relative z-10">
       {ar ? "صُنع بـ ✦ بواسطة" : "Made with ✦ by"}<span className="text-[#c9a96e]"> Lumivite</span>
      </footer>
    </div>
  )
}