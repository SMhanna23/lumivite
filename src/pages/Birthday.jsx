import { useState, useEffect, useRef } from "react"
import EnvelopeScreen from "../components/EnvelopeScreen"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"
import { formatArabicDate, toArabicDigits, toArabicTime, personsLabelAr } from "../lib/arabicDate"

const COUNTDOWN_LABELS_AR = { days: "أيام", hours: "ساعات", mins: "دقائق", secs: "ثواني" }
const GOLD = "#d4af37"

const DEFAULT_CELEBRATION = {
  name: "Sofia",
  nameAr: "صوفيا",
  age: 30,
  date: "2027-03-15T20:00:00",
  photo: "/birthday-demo-portrait.jpg",
  venue: { label: "The Celebration", labelAr: "الاحتفال", time: "8:00 PM", place: "The Grand Ballroom, Phoenicia Hotel", placeAr: "القاعة الكبرى، فينيسيا هوتيل", location: "Beirut, Lebanon", locationAr: "بيروت، لبنان", map: "https://maps.google.com/?q=Phoenicia+Hotel+Beirut", photo: "/birthday-venue-phoenicia.jpg" },
  dressCode: "Black Tie Optional",
  dressCodeAr: "إلزامية رسمية (اختياري)",
  quote: "Grow old along with me, the best is yet to be.",
  quoteAr: "كِبَر معي، فالأجمل لم يأتِ بعد.",
  quoteRef: "Robert Browning",
  message: "Please join us for an unforgettable night of celebration",
  messageAr: "انضموا إلينا لليلة احتفال لا تُنسى",
  noteEn: "Your presence is the greatest gift of all. Come dressed to celebrate in style.",
  noteAr: "حضوركم هو أثمن هدية. تعالوا لنحتفل معاً بأناقة.",
  memoriesEnabled: true,
  slug: "demo-birthday",
  envelopeColor: "black",
  timeline: [
    { time: "8:00 PM", label: "Cocktail Hour", labelAr: "ساعة الكوكتيل", icon: "🥂", location: "Rooftop Terrace", locationAr: "تراس السطح" },
    { time: "9:00 PM", label: "Dinner & Toasts", labelAr: "العشاء ونخب", icon: "🍽️", location: "Grand Ballroom", locationAr: "القاعة الكبرى" },
    { time: "11:00 PM", label: "Dancing Till Late", labelAr: "سهرة راقصة", icon: "💃", location: "Grand Ballroom", locationAr: "القاعة الكبرى" },
  ],
}

function Countdown({ targetDate, ar }) {
  const [time, setTime] = useState({})
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return setTime({ days: 0, hours: 0, mins: 0, secs: 0 })
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
            {ar ? toArabicDigits(String(val).padStart(2, "0")) : String(val).padStart(2, "0")}
          </div>
          <span className="text-white/50 text-xs mt-1 uppercase tracking-widest">{ar ? COUNTDOWN_LABELS_AR[label] : label}</span>
        </div>
      ))}
    </div>
  )
}

function Sparkles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div key={i} className="absolute select-none" style={{ left: 0, top: 0, color: GOLD, fontSize: `${12 + Math.random() * 10}px` }}
          initial={{ x: `${Math.random() * 100}vw`, y: -40, opacity: 0.8 }}
          animate={{ y: "110vh", rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.8, 0.5, 0] }}
          transition={{ duration: 7 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}>
          {["✦", "✧", "✨"][Math.floor(Math.random() * 3)]}
        </motion.div>
      ))}
    </div>
  )
}

export default function Birthday({ override = null }) {
  const CELEBRATION = override ? { ...DEFAULT_CELEBRATION, ...override } : DEFAULT_CELEBRATION
  const GOLD = CELEBRATION.accentColor || "#d4af37"
  const tier = (CELEBRATION.package || "gold").toLowerCase().includes("gold") ? "gold"
             : (CELEBRATION.package || "").toLowerCase().includes("silver") ? "silver"
             : "bronze"
  const [started, setStarted] = useState(false)
  const [name, setName] = useState(() => tier !== "bronze" ? (new URLSearchParams(window.location.search).get("gn") || "") : "")
  const [attending, setAttending] = useState(null)
  const [wishes, setWishes] = useState("")
  const [persons, setPersons] = useState(() => tier !== "bronze" ? parseInt(new URLSearchParams(window.location.search).get("np") || "1") : 1)
  const [status, setStatus] = useState("idle")
  const [rsvpError, setRsvpError] = useState("")
  const [playing, setPlaying] = useState(false)
  const [searchParams] = useSearchParams()
  const [lang, setLang] = useState("en")
  const ar = lang === "ar"
  const guestName = tier !== "bronze" ? (searchParams.get("gn") || "") : ""
  const audioRef = useRef(null)
  const musicStart = CELEBRATION.musicStart ?? 0
  const musicEnd = CELEBRATION.musicEnd ?? null

  const startMusic = () => {
    if (tier === "bronze") return
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = musicStart
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else {
      audio.currentTime = musicStart
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  // Clean up ?_app=1 that demo-preview.js adds for routing bypass, preserving other params (gn, np)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has("_app")) {
      url.searchParams.delete("_app")
      const query = url.searchParams.toString()
      window.history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash)
    }
  }, [])

  // Loop audio within start/end segment
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !musicEnd) return
    const onTimeUpdate = () => { if (audio.currentTime >= musicEnd) audio.currentTime = musicStart }
    audio.addEventListener("timeupdate", onTimeUpdate)
    return () => audio.removeEventListener("timeupdate", onTimeUpdate)
  }, [musicStart, musicEnd])

  const handleRSVP = async () => {
    if (!name || attending === null) { setRsvpError(ar ? "يرجى إدخال اسمك واختيار الحضور" : "Please enter your name and select attendance"); return }
    setRsvpError("")
    setStatus("loading")
    try {
      await addDoc(collection(db, "rsvps"), {
        name, attending, wishes, persons,
        wedding: `${CELEBRATION.name}'s ${CELEBRATION.age}th Birthday`,
        createdAt: serverTimestamp()
      })
      const emoji = attending ? "✅" : "❌"
      const msg = `${emoji} New RSVP on Lumivite!\n👤 ${name}\n🎂 ${CELEBRATION.name}'s ${CELEBRATION.age}th Birthday\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
      fetch("/api/notify-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {})
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className={started ? "min-h-screen bg-[#0d0a08] text-white overflow-x-hidden relative" : "fixed inset-0"}
      dir={ar ? "rtl" : "ltr"}
      style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol'" : "inherit" }}>

      {/* Music — Silver and Gold only */}
      {tier !== "bronze" && <audio ref={audioRef} loop src={CELEBRATION.music || "/music.mp3"} preload="auto" />}

      {/* Envelope screen overlay */}
      {!started && (
        <EnvelopeScreen
          guestName={guestName}
          onOpen={startMusic}
          onVideoEnd={() => setStarted(true)}
          ar={ar}
          setLang={setLang}
          envelopeColor={CELEBRATION.envelopeColor || "black"}
        />
      )}

      {/* Main invitation */}
      {started && (<>
        {!CELEBRATION.hideEmojis && <Sparkles />}

        {/* Floating music button — Silver and Gold only */}
        {tier !== "bronze" && (
          <motion.button onClick={toggleMusic}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-black flex items-center justify-center shadow-2xl transition text-xl"
            style={{ background: GOLD }}>
            {playing ? "⏸" : "🎵"}
          </motion.button>
        )}

        {/* Language Toggle */}
        <motion.button onClick={() => setLang(ar ? "en" : "ar")}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-6 left-6 z-50 h-10 px-4 rounded-full flex items-center justify-center shadow-2xl text-sm font-medium transition"
          style={{ background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}66`, color: GOLD }}>
          {ar ? "EN" : "عربي"}
        </motion.button>

        {/* Hero */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10 overflow-hidden">
          {/* Celebrant photo background — swappable per client via CELEBRATION.photo */}
          {CELEBRATION.photo && (
            <div className="absolute inset-0 z-0" style={{
              backgroundImage: `url(${CELEBRATION.photo})`,
              backgroundSize: "cover", backgroundPosition: "center top",
              filter: "brightness(0.5)"
            }} />
          )}
          <div className="absolute inset-0 z-0" style={{ background: CELEBRATION.photo ? "linear-gradient(to bottom, rgba(10,8,6,0.8) 0%, rgba(10,8,6,0.2) 26%, rgba(10,8,6,0.25) 62%, rgba(10,8,6,0.92) 100%)" : "radial-gradient(ellipse at 50% 38%, #221a10 0%, #130f0a 45%, #0a0806 85%)" }} />
          <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(10,8,6,0.55) 100%)" }} />
          <div className="absolute inset-[18px] md:inset-10 z-0 pointer-events-none" style={{ border: `1px solid ${GOLD}33` }} />
          <div className="absolute inset-[26px] md:inset-14 z-0 pointer-events-none" style={{ border: `1px solid ${GOLD}1a` }} />

          {/* Big watermark age numeral — the signature motif for this template */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ fontSize: "min(60vw, 26rem)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "rgba(212,175,55,0.14)", lineHeight: 1, mixBlendMode: "overlay" }}>
            {ar ? toArabicDigits(CELEBRATION.age) : CELEBRATION.age}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

          <motion.div className="relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
            <p className="tracking-[0.4em] text-sm uppercase mb-6" style={{ color: GOLD }}>{ar ? "أنتم مدعوون" : "You're Invited"}</p>
            <h1 className="text-7xl md:text-9xl font-light text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {ar ? CELEBRATION.nameAr : CELEBRATION.name}
            </h1>
            <div className="flex items-center justify-center gap-3 mb-10">
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none"><path d="M26 2C20 2 15 7 14 14C13 7 8 2 2 2" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.6" /></svg>
              <p className="text-2xl md:text-3xl italic" style={{ fontFamily: "'Great Vibes', cursive", color: GOLD }}>
                {ar ? `تحتفل بعيدها الـ ${toArabicDigits(CELEBRATION.age)}` : `is turning ${CELEBRATION.age}`}
              </p>
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none" style={{ transform: "scaleX(-1)" }}><path d="M26 2C20 2 15 7 14 14C13 7 8 2 2 2" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.6" /></svg>
            </div>
            <p className="tracking-widest uppercase mb-2 text-white/50 text-sm">
              {ar
                ? formatArabicDate(new Date(CELEBRATION.date))
                : new Date(CELEBRATION.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <p className="mb-12 text-white/45 text-sm">
              {ar ? CELEBRATION.venue.locationAr : CELEBRATION.venue.location}
            </p>
            <Countdown targetDate={CELEBRATION.date} ar={ar} />
          </motion.div>

          <motion.div className="absolute bottom-10 left-1/2 flex flex-col items-center gap-2 z-10"
            initial={{ x: "-50%" }} animate={{ x: "-50%", y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <span className="text-white/70 text-sm font-bold tracking-widest">SCROLL</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
          </motion.div>
        </section>

        {/* Quote + Message */}
        <section className="py-16 px-6 text-center max-w-2xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
            {!CELEBRATION.hideQuote && (<>
              {!CELEBRATION.hideEmojis && <div className="text-2xl mb-6" style={{ color: GOLD }}>✦</div>}
              <p className="text-white/70 text-2xl md:text-3xl leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive" }}>
                "{ar ? CELEBRATION.quoteAr : CELEBRATION.quote}"
              </p>
              {CELEBRATION.quoteRef && <p className="text-sm mt-3 tracking-widest" style={{ color: GOLD }}>— {CELEBRATION.quoteRef}</p>}
              {!CELEBRATION.hideEmojis && <div className="text-2xl mt-8 mb-6" style={{ color: GOLD }}>✦</div>}
            </>)}
            <p className="text-white/40 text-sm italic">{ar ? CELEBRATION.messageAr : CELEBRATION.message}</p>
          </motion.div>
        </section>

        {/* Milestone ornament */}
        <section className="py-16 px-6 max-w-lg mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-6">
              <circle cx="28" cy="28" r="27" stroke={GOLD} strokeWidth="1" opacity="0.5" />
              <circle cx="28" cy="28" r="21" stroke={GOLD} strokeWidth="0.5" opacity="0.35" />
              <text x="28" y="35" textAnchor="middle" fill={GOLD} style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>
                {ar ? toArabicDigits(CELEBRATION.age) : CELEBRATION.age}
              </text>
            </svg>
            <h2 className="mb-4" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2rem" : "3rem", color: "white", fontWeight: 400, lineHeight: 1.2 }}>
              {ar ? "محطة تستحق الاحتفال" : "A Milestone Worth Celebrating"}
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {ar
                ? "ليلة واحدة، أعزّ الناس، وذكريات تدوم مدى الحياة."
                : "One unforgettable night, the people who matter most, and memories to last a lifetime."}
            </p>
          </motion.div>
        </section>

        {/* The Celebration — venue */}
        <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="tracking-[0.3em] text-sm uppercase text-center mb-2" style={{ color: GOLD }}>{ar ? "انضموا إلينا" : "Join Us"}</p>
            <h2 className="font-light text-center mb-12 text-white" style={{ fontFamily: ar ? "'Cormorant Garamond', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3rem" }}>
              {ar ? CELEBRATION.venue.labelAr : CELEBRATION.venue.label}
            </h2>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden transition" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {CELEBRATION.venue.photo ? (
                <div className="h-56 w-full overflow-hidden">
                  <img src={CELEBRATION.venue.photo} alt={CELEBRATION.venue.place} className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700" />
                </div>
              ) : (
                <div className="h-20 w-full flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1a140d 0%, #110d08 100%)" }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 1v20M1 11h20" stroke={GOLD} strokeWidth="0.75" opacity="0.5" transform="rotate(45 11 11)" /></svg>
                </div>
              )}
              <div className="p-6 text-center">
                <p className="font-serif text-2xl font-light mb-1">{ar ? toArabicTime(CELEBRATION.venue.time) : CELEBRATION.venue.time}</p>
                <p className="text-white font-medium mb-1">{ar ? CELEBRATION.venue.placeAr : CELEBRATION.venue.place}</p>
                <p className="text-white/40 text-sm mb-3">{ar ? CELEBRATION.venue.locationAr : CELEBRATION.venue.location}</p>
                {CELEBRATION.dressCode && (
                  <p className="text-xs tracking-widest uppercase mb-4" style={{ color: GOLD }}>
                    {ar ? CELEBRATION.dressCodeAr : CELEBRATION.dressCode}
                  </p>
                )}
                {tier === "gold" && (
                  <a href={CELEBRATION.venue.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CELEBRATION.venue.place + " " + CELEBRATION.venue.location)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm border rounded-full px-4 py-2 hover:bg-white/5 transition"
                    style={{ color: GOLD, borderColor: `${GOLD}4d` }}>
                    📍 {ar ? "افتح في خرائط Google" : "Open in Google Maps"}
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Timeline */}
        {!CELEBRATION.hideTimeline && <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="tracking-[0.3em] text-xs uppercase text-center mb-2" style={{ color: GOLD }}>{ar ? "الأمسية" : "The Evening"}</p>
            <h2 className="font-serif text-4xl font-light text-center mb-16">{ar ? "برنامج الحفلة" : "Night's Program"}</h2>
            <div className="relative">
              <div className="absolute left-[88px] top-0 bottom-0 w-px bg-white/10" />
              {CELEBRATION.timeline.map((item, i) => (
                <motion.div key={i} className="flex gap-6 mb-10 items-start"
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <div className="text-right w-16 pt-1">
                    <span className="text-white/40 text-xs">{ar ? toArabicTime(item.time) : item.time}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#1a1510] border flex items-center justify-center text-sm flex-shrink-0 relative z-10" style={{ borderColor: `${GOLD}66` }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{ar ? item.labelAr : item.label}</p>
                    <p className="text-white/40 text-sm mt-0.5">{ar ? item.locationAr : item.location}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>}

        {/* Additional Note */}
        {(ar ? CELEBRATION.noteAr : CELEBRATION.noteEn) && (
          <section className="py-10 px-6 max-w-lg mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent" style={{ "--tw-gradient-to": `${GOLD}66` }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${GOLD}66` }} />
              <div className="h-px w-16 bg-gradient-to-l from-transparent" style={{ "--tw-gradient-to": `${GOLD}66` }} />
            </div>
            <p className="text-white/85 font-medium leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Cormorant Garamond', serif", fontSize: ar ? "1.2rem" : "1.1rem", fontStyle: "italic" }}>
              {ar ? CELEBRATION.noteAr : CELEBRATION.noteEn}
            </p>
          </section>
        )}

        {/* RSVP */}
        <section className="py-24 px-6 max-w-md mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <p className="tracking-[0.3em] text-sm uppercase mb-4" style={{ color: GOLD }}>
              {ar
                ? `يرجى الرد قبل ${CELEBRATION.rsvpDeadline ? formatArabicDate(new Date(CELEBRATION.rsvpDeadline + "T12:00:00"), { withYear: false }) : "١ آذار"}`
                : `Kindly Reply By ${CELEBRATION.rsvpDeadline ? new Date(CELEBRATION.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "March 1st"}`}
            </p>
            <h2 className="mb-10" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3.5rem", fontWeight: 400, color: "white", lineHeight: 1.2 }}>
              {ar ? "هل ستحتفلون معنا؟" : "Will you celebrate with us?"}
            </h2>
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="font-serif text-2xl mb-2" style={{ color: GOLD }}>{ar ? `شكراً، ${name}!` : `Thank you, ${name}!`}</p>
                  <p className="text-white/50">{ar ? "تم استلام ردك. لا يسعنا الانتظار للاحتفال معك." : "Your RSVP has been received. We can't wait to celebrate with you."}</p>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-4">
                  <input value={name} onChange={e => setName(e.target.value)}
                    type="text" placeholder={ar ? "اسمك الكامل" : "Your Full Name"}
                    disabled={tier !== "bronze" && !!searchParams.get("gn")}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none transition">
                    {Array.from({ length: (tier !== "bronze" && searchParams.get("np")) ? parseInt(searchParams.get("np")) : 5 }, (_, i) => i + 1).map(n => <option key={n} value={n} className="bg-[#1a1510]">{ar ? personsLabelAr(n) : `${n} ${n === 1 ? "person" : "persons"}`}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => setAttending(true)}
                      className="flex-1 py-4 rounded-lg border transition font-medium tracking-wider"
                      style={{
                        background: attending === true ? GOLD : "transparent",
                        borderColor: attending === true ? GOLD : "rgba(255,255,255,0.2)",
                        color: attending === true ? "black" : "rgba(255,255,255,0.5)",
                      }}>
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none transition resize-none" />
                  <p className="text-white/20 text-xs text-right">{wishes.length}/200</p>
                  {rsvpError && <p className="text-red-400 text-sm text-center">{rsvpError}</p>}
                  <button onClick={handleRSVP} disabled={status === "loading"}
                    className="w-full py-4 text-black font-semibold rounded-lg transition tracking-wider disabled:opacity-50"
                    style={{ background: GOLD }}>
                    {status === "loading" ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال التأكيد" : "SEND RSVP")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Memories — Gold only */}
        {tier === "gold" && CELEBRATION.memoriesEnabled && (
          <section className="py-12 px-6 max-w-md mx-auto text-center relative z-10">
            <p className="text-2xl mb-3" style={{ color: GOLD }}>📸</p>
            <h3 className="font-serif text-2xl font-light text-white mb-2">
              {ar ? "شاركونا ذكرياتكم" : "Share Your Memories"}
            </h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              {ar ? "خلال الحفل أو بعده، شاركوا صوركم ولحظاتكم معنا" : "During or after the party, open the link below to share your photos with us"}
            </p>
            <a href={`/memories/${CELEBRATION.slug || "demo-birthday"}`} target="_blank" rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-full text-sm tracking-wider transition"
              style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}59`, color: GOLD }}>
              {ar ? "📸 شارك الذكريات" : "📸 Share Memories"}
            </a>
          </section>
        )}

        <footer className="text-center py-10 text-white/20 text-sm border-t border-white/5 relative z-10">
          {ar ? "صُنع بـ ✦ بواسطة" : "Made with ✦ by"}<span style={{ color: GOLD }}> Lumivite</span>
        </footer>
      </>)}
    </div>
  )
}
