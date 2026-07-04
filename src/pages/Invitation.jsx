import { useState, useEffect, useRef } from "react"
import EnvelopeScreen from "../components/EnvelopeScreen"
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
  memoriesEnabled: true,
  slug: "demo",
  envelopeColor: "black",
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
      {Array.from({ length: 8 }).map((_, i) => (
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
  { time: "7:00 PM", label: "Welcome Drink", icon: "🥂", desc: "Celebrate with drinks & canapés" },
  { time: "11:00 PM", label: "Party", icon: "🎉", desc: "Dance the night away with us" },
]

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function Invitation({ override = null }) {
  const WEDDING = override ? { ...DEFAULT_WEDDING, ...override } : DEFAULT_WEDDING
  const tier = (WEDDING.package || "gold").toLowerCase().includes("gold") ? "gold"
             : (WEDDING.package || "").toLowerCase().includes("silver") ? "silver"
             : "bronze"
  const [started, setStarted] = useState(false)
  const [name, setName] = useState(() => tier !== "bronze" ? (new URLSearchParams(window.location.search).get("gn") || "") : "")
  const [attending, setAttending] = useState(null)
  const [wishes, setWishes] = useState("")
  const [persons, setPersons] = useState(() => tier !== "bronze" ? parseInt(new URLSearchParams(window.location.search).get("np") || "1") : 1)
  const [status, setStatus] = useState("idle")
  const [rsvpError, setRsvpError] = useState("")
  const [copiedKey, setCopiedKey] = useState(null)
  const copyToClipboard = (text, key) => { navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 1500) }
  const [playing, setPlaying] = useState(false)
  const [searchParams] = useSearchParams()
  const [lang, setLang] = useState("en")
  const ar = lang === "ar"
  const guestName = tier !== "bronze" ? (searchParams.get("gn") || "") : ""
  const photos = WEDDING.photos?.length ? WEDDING.photos : [
    "/photo1.jpg",
    "/photo2.jpg",
    "/photo3.jpg",
    "/photo4.jpg",
    "/photo5.jpg",
    "/photo6.jpg",
    "/photo7.jpg",
    "/photo8.jpg",
    "/photo9.jpg",
  ]
  const namesFont = WEDDING.namesFont === "script" ? "'Great Vibes', cursive" : "'Cormorant Garamond', serif"
  const namesClass = WEDDING.namesFont === "script" ? "text-7xl md:text-9xl" : "text-6xl md:text-8xl"
  const subtextSize = WEDDING.heroSubtextSize === "lg" ? "1.125rem" : WEDDING.heroSubtextSize === "md" ? "1rem" : "0.875rem"
  const subtextWeight = WEDDING.heroSubtextBold ? 600 : 400
  const audioRef = useRef(null)
  const ytRef = useRef(null)
  const ytId = getYouTubeId(WEDDING.music)
  const musicStart = WEDDING.musicStart ?? 0
  const musicEnd   = WEDDING.musicEnd   ?? null

  const startMusic = () => {
    if (tier === "bronze") return
    if (ytId) {
      ytRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
      setPlaying(true)
      return
    }
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = musicStart
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false))
  }

  const toggleMusic = () => {
    if (ytId && ytRef.current) {
      const cmd = playing ? "pauseVideo" : "playVideo"
      ytRef.current.contentWindow.postMessage(`{"event":"command","func":"${cmd}","args":""}`, '*')
      setPlaying(!playing)
      return
    }
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else {
      audio.currentTime = musicStart
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

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
      wedding: `${WEDDING.groom} & ${WEDDING.bride}`,
      createdAt: serverTimestamp()
    })

    // WhatsApp notification
    const emoji = attending ? "✅" : "❌"
    const msg = `${emoji} New RSVP on Lumivite!\n👤 ${name}\n💒 ${WEDDING.groom} & ${WEDDING.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
    const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`
    fetch(waUrl, { mode: "no-cors" }).catch(() => {})

    setStatus("success")
  } catch {
    setStatus("error")
  }
}

  // Single return — media element stays mounted so it never reloads when started changes
  return (
    <div className={started ? "min-h-screen bg-[#0d0a08] text-white overflow-x-hidden relative" : "fixed inset-0"}
      dir={ar ? "rtl" : "ltr"}
      style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>

      {/* Music — Silver and Gold only */}
      {tier !== "bronze" && (ytId ? (
        <iframe ref={ytRef} title="bg-music"
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&loop=1&playlist=${ytId}&controls=0&start=${musicStart}${musicEnd ? `&end=${musicEnd}` : ""}`}
          style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}
          allow="autoplay" />
      ) : (
        <audio ref={audioRef} loop src={WEDDING.music || "/music.mp3"} preload="auto" />
      ))}

      {/* Envelope screen overlay */}
      {!started && (
        <EnvelopeScreen
          guestName={guestName}
          onOpen={startMusic}
          onVideoEnd={() => setStarted(true)}
          ar={ar}
          setLang={setLang}
          envelopeColor={WEDDING.envelopeColor || "black"}
        />
      )}

      {/* Main invitation */}
      {started && (<>
      {!WEDDING.hideEmojis && <Petals />}

      {/* Floating music button — Silver and Gold only */}
      {tier !== "bronze" && (
        <motion.button onClick={toggleMusic}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#c9a96e] text-black flex items-center justify-center shadow-2xl hover:bg-[#b8965d] transition text-xl">
          {playing ? "⏸" : "🎵"}
        </motion.button>
      )}

      {/* Language Toggle */}
        <motion.button onClick={() => setLang(ar ? "en" : "ar")}
         initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 left-6 z-50 h-10 px-4 rounded-full flex items-center justify-center shadow-2xl text-sm font-medium transition"
        style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.4)", color: "#c9a96e" }}>
         {ar ? "EN" : "عربي"}
        </motion.button>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10">
        {/* Photo background */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: `url(${photos[1] || photos[0]})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.6)"
        }} />
        {/* Vignette: dark top & bottom for text, transparent centre so photo shows */}
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(10,8,6,0.75) 0%, rgba(10,8,6,0.05) 28%, rgba(10,8,6,0.05) 65%, rgba(10,8,6,0.85) 100%)" }} />
        {/* Edge vignette */}
        <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10,8,6,0.65) 100%)" }} />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/5 pointer-events-none" />
        <motion.div className="relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-8">{ar ? "نحن نتزوج" : "We're getting married"}</p>
          <h1 className={`${namesClass} font-light text-white mb-2`} style={{ fontFamily: namesFont }}>{ar ? WEDDING.groomAr : WEDDING.groom}</h1>
          <p className="text-[#c9a96e] text-4xl italic mb-2" style={{ fontFamily: namesFont }}>&</p>
          <h1 className={`${namesClass} font-light text-white mb-10`} style={{ fontFamily: namesFont }}>{ar ? WEDDING.brideAr : WEDDING.bride}</h1>
          <p className={`tracking-widest uppercase mb-2 ${WEDDING.heroSubtextBold ? "text-white/90" : "text-white/50"}`}
            style={{ fontSize: subtextSize, fontWeight: subtextWeight }}>
            {ar
              ? new Date(WEDDING.date).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
              : new Date(WEDDING.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className={`mb-12 ${WEDDING.heroSubtextBold ? "text-white/80" : "text-white/45"}`}
            style={{ fontSize: subtextSize, fontWeight: subtextWeight }}>
            {ar ? WEDDING.venueAr : WEDDING.venue}
          </p>
          <Countdown targetDate={WEDDING.date} />
        </motion.div>
        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2 z-10"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-white/30 text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* Quote + Parents */}
      <section className="py-16 px-6 text-center max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
          {!WEDDING.hideEmojis && <div className="text-[#c9a96e] text-2xl mb-6">✦</div>}
          <p className="text-white/70 text-2xl md:text-3xl leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive" }}>"{ar ? WEDDING.quoteAr : WEDDING.quote}"</p>
          {!WEDDING.hideQuoteRef && WEDDING.quoteRef && <p className="text-[#c9a96e] text-sm mt-3 tracking-widest">— {WEDDING.quoteRef}</p>}
          {!WEDDING.hideEmojis && <div className="text-[#c9a96e] text-2xl mt-8 mb-10">✦</div>}

          {/* Parents cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(ar ? WEDDING.parentsAr : WEDDING.parents).map((p, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="border border-[#c9a96e]/30 rounded-xl px-4 py-5 text-center"
                style={{ background: "rgba(201,169,110,0.05)" }}>
                <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-2">{ar ? "عائلة" : "Mr. & Mrs."}</p>
                <p className="text-white font-light text-sm leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>{p}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-white/40 text-sm italic">{ar ? WEDDING.messageAr : WEDDING.message}</p>
        </motion.div>
      </section>

      {/* Our Story — Photo 1 (Silver and Gold only) */}
      {tier !== "bronze" && <section className="py-12 px-6 max-w-xl mx-auto relative z-10">
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-3">{ar ? "قبل الأبد" : "Before Forever"}</p>
          <h2 className="mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.5rem" : "3.8rem", color: "white", fontWeight: 400, lineHeight: 1.2 }}>
            {ar ? "لمحة منّا" : "A glimpse of us"}
          </h2>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#c9a96e]/60" />
            {!WEDDING.hideEmojis && <span className="text-[#c9a96e]">✦</span>}
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
      </section>}

      {/* Venues */}
        <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">{ar ? "انضموا إلينا" : "Join Us"}</p>
          <h2 className="font-light text-center mb-12 text-white"
            style={{ fontFamily: ar ? "'Cormorant Garamond', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3rem" }}>
            {ar ? "الاحتفال" : "The Celebration"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WEDDING.venues.map((v, i) => {
              if (i === 0 && WEDDING.hideCeremony) return null
              return (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }} viewport={{ once: true }}
          className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden hover:border-[#c9a96e]/30 transition">
          {/* Venue photo */}
          <div className="h-52 w-full overflow-hidden">
            <img
              src={photos[i + 2] || photos[0]}
              alt={v.place}
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="p-6 text-center">
            <p className="text-[#c9a96e] text-xs tracking-widest uppercase mb-2">{ar ? v.labelAr : v.label}</p>
            <p className="font-serif text-2xl font-light mb-1">{v.time}</p>
            <p className="text-white font-medium mb-1">{ar ? v.placeAr : v.place}</p>
            <p className="text-white/40 text-sm mb-4">{ar ? v.locationAr : v.location}</p>
            {tier === "gold" && (
              <a href={v.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.place + " " + v.location)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#c9a96e] text-sm border border-[#c9a96e]/30 rounded-full px-4 py-2 hover:bg-[#c9a96e]/10 transition">
                📍 Open in Google Maps
              </a>
            )}
          </div>
        </motion.div>
              )
            })}
      </div>
      </motion.div>
      </section>

      {/* Photos 2-3 (Silver and Gold only) */}
      {tier !== "bronze" && <section className="py-10 px-6 max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-2 gap-4 md:gap-12">
          {[{ src: photos[4], rot: 2.5 }, { src: photos[5], rot: -2 }].filter(item => item.src).map(({ src, rot }, i) => (
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
      </section>}

      {/* Timeline */}
      {!WEDDING.hideTimeline && <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
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
                  <p className="text-white/40 text-sm mt-0.5">{item.location || item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>}

      {/* Photos 4-6 (Silver and Gold only) */}
      {tier !== "bronze" && <section className="py-10 px-6 max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {[{ src: photos[6], rot: 3 }, { src: photos[7], rot: -2 }, { src: photos[8], rot: 1.5 }].filter(item => item.src).map(({ src, rot }, i) => (
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
      </section>}

      {/* Gift Registry (Gold only) */}
      {tier === "gold" && WEDDING.registry?.length > 0 && <section className="py-24 px-6 max-w-2xl mx-auto relative z-10">
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
    <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-2">{ar ? "بكل محبة" : "With Love"}</p>
    <h2 className="font-light text-center mb-4 text-white"
      style={{ fontFamily: ar ? "'Cormorant Garamond', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3rem" }}>
      {ar ? "قائمة الهدايا" : "Gift Registry"}
    </h2>
    <p className="text-white/40 text-sm text-center mb-12">{ar ? "وجودكم معنا هو أجمل هدية! لمن يرغب تتوفر قائمة الهدايا عبر حساب Wish Money :" : (WEDDING.registrySubtitle || "Your presence is our greatest gift. If you wish to honor us further:")}</p>
    <div className="grid gap-4">
      {WEDDING.registry.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
          {item.name === "Wish Money" ? (
            <div className="p-5 rounded-2xl border border-white/10 bg-white/3">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-xl flex-shrink-0">💳</div><p className="font-medium text-white">Wish Money</p></div>
              {item.acc && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">Acc# {item.acc}</span><button onClick={() => copyToClipboard(item.acc, "wish-acc")} className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">{copiedKey === "wish-acc" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
              {item.phone && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">{item.phone}</span><button onClick={() => copyToClipboard(item.phone, "wish-phone")} className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">{copiedKey === "wish-phone" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs px-3 py-1 rounded-full text-[#c9a96e] border border-[#c9a96e]/30">Visit →</a>}
            </div>
          ) : item.name === "Bank Transfer" ? (
            <div className="p-5 rounded-2xl border border-white/10 bg-white/3">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-xl flex-shrink-0">🏦</div><div><p className="font-medium text-white">{ar ? "تحويل بنكي" : "Bank Transfer"}</p>{item.beneficiary && <p className="text-white/40 text-xs">{item.beneficiary}</p>}</div></div>
              {(item.iban || item.desc) && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">{item.iban || item.desc?.replace("iban: ", "")}</span><button onClick={() => copyToClipboard(item.iban || item.desc?.replace("iban: ", ""), "bank-iban")} className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">{copiedKey === "bank-iban" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
              {item.bic && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs">BIC/Swift: <span className="font-mono">{item.bic}</span></span><button onClick={() => copyToClipboard(item.bic, "bank-bic")} className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">{copiedKey === "bank-bic" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
            </div>
          ) : item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/3 hover:border-[#c9a96e]/40 hover:bg-white/5 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-2xl flex-shrink-0">{item.icon}</div>
              <div className="flex-1 text-left"><p className="font-medium text-white">{item.name}</p><p className="text-white/40 text-sm">{ar ? item.descAr : item.desc}</p></div>
              <span className="text-[#c9a96e] text-sm opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          ) : null}
        </motion.div>
      ))}
    </div>
  </motion.div>
</section>}

      {/* Additional Note */}
      {(ar ? WEDDING.noteAr : WEDDING.noteEn) && (
        <section className="py-10 px-6 max-w-lg mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a96e]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a96e]/40" />
          </div>
          <p className="text-white/85 font-medium leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Cormorant Garamond', serif", fontSize: ar ? "1.2rem" : "1.1rem", fontStyle: "italic" }}>
            {ar ? WEDDING.noteAr : WEDDING.noteEn}
          </p>
        </section>
      )}

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
                  disabled={tier !== "bronze" && !!searchParams.get("gn")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition disabled:opacity-60 disabled:cursor-not-allowed" />
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  disabled={tier !== "bronze" && !!searchParams.get("np")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-[#c9a96e] transition disabled:opacity-60 disabled:cursor-not-allowed">
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
                {rsvpError && <p className="text-red-400 text-sm text-center">{rsvpError}</p>}
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#b8965d] transition tracking-wider disabled:opacity-50">
                  {status === "loading" ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال التأكيد" : "SEND RSVP")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Memories — Gold only */}
      {tier === "gold" && WEDDING.memoriesEnabled && (
        <section className="py-12 px-6 max-w-md mx-auto text-center relative z-10">
          <p className="text-[#c9a96e] text-2xl mb-3">📸</p>
          <h3 className="font-serif text-2xl font-light text-white mb-2">
            {ar ? "شاركونا ذكرياتكم" : "Share Your Memories"}
          </h3>
          <p className="text-white/40 text-sm mb-6 leading-relaxed">
            {ar
              ? "خلال الحفل أو بعده، شاركوا صوركم ولحظاتكم معنا"
              : "During or after the event, open the link below to share your photos with us"}
          </p>
          <a href={`/memories/${WEDDING.slug || "demo"}`} target="_blank" rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-full text-sm tracking-wider transition"
            style={{ background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.35)", color: "#c9a96e" }}>
            {ar ? "📸 شارك الذكريات" : "📸 Share Memories"}
          </a>
        </section>
      )}

      <footer className="text-center py-10 text-white/20 text-sm border-t border-white/5 relative z-10">
       {ar ? "صُنع بـ ✦ بواسطة" : "Made with ✦ by"}<span className="text-[#c9a96e]"> Lumivite</span>
      </footer>
    </>)}
    </div>
  )
}