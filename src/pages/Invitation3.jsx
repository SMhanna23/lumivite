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
  quote: "You are my today and all of my tomorrows.",
  quoteAr: "أنتَ حاضري وكلّ غدٍ لي.",
  quoteRef: "Leo Christopher",
  venue: "Feytroun, Lebanon",
  venueAr: "فيترون، لبنان",
  message: "Together with their families",
  messageAr: "معاً مع عائلتيهما",
  memoriesEnabled: true,
  slug: "demo3",
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
    <div className="flex gap-3 justify-center">
      {Object.entries(time).map(([label, val]) => (
        <div key={label} className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-light"
            style={{ background: "rgba(198,143,119,0.15)", border: "1px solid rgba(198,143,119,0.4)", color: "#8B4D3B" }}>
            {String(val).padStart(2, "0")}
          </div>
          <span className="text-xs mt-1 uppercase tracking-widest" style={{ color: "#C68F77" }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function Roses() {
  const items = ["🌷", "🌸", "💮", "🏵️", "✿"]
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} className="absolute select-none"
          style={{ fontSize: `${14 + Math.random() * 10}px` }}
          initial={{ x: `${Math.random() * 100}vw`, y: -40, opacity: 0.5 }}
          animate={{ y: "110vh", rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.5, 0.3, 0] }}
          transition={{ duration: 7 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}>
          {items[Math.floor(Math.random() * items.length)]}
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

const roseGold = "#B76E79"
const blush = "#F2D0D0"
const cream = "#FDF6F0"
const dark = "#5C2D35"

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function Invitation({ override = null }) {
  const WEDDING = override ? { ...DEFAULT_WEDDING, ...override } : DEFAULT_WEDDING
  const [started, setStarted] = useState(false)
  const [name, setName] = useState(() => new URLSearchParams(window.location.search).get("gn") || "")
  const [email, setEmail] = useState("")
  const [attending, setAttending] = useState(null)
  const [wishes, setWishes] = useState("")
  const [persons, setPersons] = useState(() => parseInt(new URLSearchParams(window.location.search).get("np") || "1"))
  const [status, setStatus] = useState("idle")
  const [rsvpError, setRsvpError] = useState("")
  const [playing, setPlaying] = useState(false)
  const [lang, setLang] = useState("en")
  const ar = lang === "ar"
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
  const [searchParams] = useSearchParams()
  const audioRef = useRef(null)
  const ytRef = useRef(null)
  const ytId = getYouTubeId(WEDDING.music)
  const musicStart = WEDDING.musicStart ?? 0
  const musicEnd   = WEDDING.musicEnd   ?? null

  const guestName = searchParams.get("gn") || ""

  const startMusic = () => {
    if (ytId) { setPlaying(true); return }
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
        name, email, attending, wishes, persons,
        wedding: `${WEDDING.groom} & ${WEDDING.bride}`,
        createdAt: serverTimestamp()
      })
      const msg = `${attending ? "✅" : "❌"} New RSVP on Lumivite!\n👤 ${name}\n💒 ${WEDDING.groom} & ${WEDDING.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`, { mode: "no-cors" }).catch(() => {})
      setStatus("success")
    } catch (e) { setStatus("error") }
  }

  // SPLASH
  // ENVELOPE SCREEN
  if (!started) {
    return (
      <div className="fixed inset-0">
        {!ytId && <audio ref={audioRef} loop src={WEDDING.music || "/music.mp3"} preload="auto" />}
        <EnvelopeScreen
          guestName={guestName}
          onOpen={startMusic}
          onVideoEnd={() => setStarted(true)}
          ar={ar}
          setLang={setLang}
        />
      </div>
    )
  }

  // MAIN
  return (
    <div className="min-h-screen overflow-x-hidden relative"
      dir={ar ? "rtl" : "ltr"}
      style={{ background: cream, color: dark, fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>
      {ytId ? (
        <iframe ref={ytRef} title="bg-music"
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&loop=1&playlist=${ytId}&controls=0&start=${musicStart}${musicEnd ? `&end=${musicEnd}` : ""}`}
          style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}
          allow="autoplay" />
      ) : (
        <audio ref={audioRef} loop src={WEDDING.music || "/music.mp3"} preload="auto" />
      )}
      <Roses />

      {/* Top border */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ background: `linear-gradient(to right, ${blush}, ${roseGold}, ${blush})` }} />

      {/* Music button */}
      <motion.button onClick={toggleMusic}
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-xl"
        style={{ background: roseGold, color: "white" }}>
        {playing ? "⏸" : "🎵"}
      </motion.button>

      {/* Language Toggle */}
      <motion.button onClick={() => setLang(ar ? "en" : "ar")}
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 left-6 z-50 h-10 px-4 rounded-full flex items-center justify-center shadow-xl text-sm font-medium transition"
        style={{ background: `${roseGold}20`, border: `1px solid ${roseGold}60`, color: roseGold }}>
        {ar ? "EN" : "عربي"}
      </motion.button>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10">
        {/* Photo background */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: `url(${photos[1] || photos[0]})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.7)"
        }} />
        {/* Light rose overlay — keeps dark text readable */}
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(253,240,240,0.78) 0%, rgba(253,240,240,0.55) 30%, rgba(253,240,240,0.55) 65%, rgba(253,240,240,0.85) 100%)" }} />

        {/* Corner roses */}
        <div className="absolute top-8 left-8 text-3xl opacity-40">🌹</div>
        <div className="absolute top-8 right-8 text-3xl opacity-40">🌹</div>
        <div className="absolute bottom-24 left-8 text-2xl opacity-30">🌷</div>
        <div className="absolute bottom-24 right-8 text-2xl opacity-30">🌷</div>

        <motion.div className="relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="tracking-[0.4em] text-xs uppercase mb-8 font-medium" style={{ color: roseGold }}>
            {ar ? "نحن نتزوج" : "We're getting married"}
          </p>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16" style={{ background: `${roseGold}50` }} />
            <span className="text-xl">🌸</span>
            <div className="h-px w-16" style={{ background: `${roseGold}50` }} />
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: dark }}
            className="text-6xl md:text-8xl font-light mb-1">
            {ar ? WEDDING.groomAr : WEDDING.groom}
          </h1>
          <p className="text-3xl italic my-2" style={{ color: roseGold, fontFamily: "'Cormorant Garamond', serif" }}>&</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: dark }}
            className="text-6xl md:text-8xl font-light mb-8">
            {ar ? WEDDING.brideAr : WEDDING.bride}
          </h1>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: `${roseGold}50` }} />
            <p className="text-sm tracking-widest uppercase opacity-60">
              {ar
                ? new Date(WEDDING.date).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
                : new Date(WEDDING.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <div className="h-px w-16" style={{ background: `${roseGold}50` }} />
          </div>

          <p className="text-sm mb-10 opacity-50">{ar ? WEDDING.venueAr : WEDDING.venue}</p>
          <Countdown targetDate={WEDDING.date} />
        </motion.div>

        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2 z-10"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-xs tracking-widest opacity-30">SCROLL</span>
          <div className="w-px h-10" style={{ background: `linear-gradient(to bottom, ${roseGold}60, transparent)` }} />
        </motion.div>
      </section>

      {/* Quote + Parents */}
      <section className="py-16 px-6 text-center max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
            <span className="text-2xl">🌹</span>
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
          </div>
          <p className="text-2xl md:text-3xl leading-relaxed opacity-80"
            style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive" }}>
            "{ar ? WEDDING.quoteAr : WEDDING.quote}"
          </p>
          <p className="text-sm mt-4 tracking-widest" style={{ color: roseGold }}>— {WEDDING.quoteRef}</p>
          <div className="flex items-center gap-4 justify-center mt-8 mb-10">
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
            <span className="text-2xl">💮</span>
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
          </div>

          {/* Parents cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(ar ? WEDDING.parentsAr : WEDDING.parents).map((p, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="rounded-xl px-4 py-5 text-center"
                style={{ border: `1px solid ${roseGold}35`, background: `rgba(183,110,121,0.05)` }}>
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: roseGold }}>{ar ? "السادة" : "Mr. & Mrs."}</p>
                <p className="font-light text-sm leading-relaxed" style={{ color: dark, fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>{p}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-sm italic opacity-40">{ar ? WEDDING.messageAr : WEDDING.message}</p>
        </motion.div>
      </section>

      {/* Our Story — Photo 1 */}
      <section className="py-12 px-6 max-w-xl mx-auto relative z-10">
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="tracking-[0.3em] text-xs uppercase mb-3 font-medium" style={{ color: roseGold }}>{ar ? "قبل الأبد" : "Before Forever"}</p>
          <h2 className="mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.5rem" : "3.8rem", color: dark, fontWeight: 400, lineHeight: 1.2 }}>
            {ar ? "لمحة منّا" : "A glimpse of us"}
          </h2>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-20" style={{ background: `linear-gradient(to right, transparent, ${roseGold}60)` }} />
            <span className="text-xl">🌸</span>
            <div className="h-px w-20" style={{ background: `linear-gradient(to left, transparent, ${roseGold}60)` }} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          whileHover={{ scale: 1.03, rotate: 0, zIndex: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{ cursor: "pointer" }}>
          <div className="bg-white p-3 pb-12" style={{ boxShadow: `0 12px 40px ${roseGold}50` }}>
            <img src={photos[0]} alt="moment 1" className="w-full" />
          </div>
        </motion.div>
      </section>

      {/* Venues */}
      <section className="py-16 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium" style={{ color: roseGold }}>
            {ar ? "انضموا إلينا" : "Join Us"}
          </p>
          <h2 className="text-4xl font-light text-center mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {ar ? "الاحتفال" : "The Celebration"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WEDDING.venues.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }} viewport={{ once: true }}
                className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                style={{ border: `1px solid ${roseGold}30`, background: "white" }}>
                <div className="h-52 w-full overflow-hidden">
                  <img
                    src={photos[i + 2] || photos[0]}
                    alt={v.place}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-xs tracking-widest uppercase mb-2 font-medium" style={{ color: roseGold }}>
                    {ar ? v.labelAr : v.label}
                  </p>
                  <p className="text-3xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{v.time}</p>
                  <p className="font-medium mb-1">{ar ? v.placeAr : v.place}</p>
                  <p className="text-sm mb-4 opacity-50">{ar ? v.locationAr : v.location}</p>
                  <a href={v.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.place + " " + v.location)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-2 transition"
                    style={{ color: roseGold, border: `1px solid ${roseGold}40` }}>
                    📍 {ar ? "افتح في خرائط جوجل" : "Open in Google Maps"}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Photos 2-3 */}
      <section className="py-10 px-6 max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-2 gap-4 md:gap-12">
          {[{ src: photos[4] || photos[0], rot: 2.5 }, { src: photos[5] || photos[1], rot: -2 }].map(({ src, rot }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30, rotate: rot }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ cursor: "pointer" }}>
              <div className="bg-white p-2 pb-12" style={{ boxShadow: `0 10px 40px ${roseGold}45` }}>
                <img src={src} alt={`moment ${i + 2}`} className="w-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium" style={{ color: roseGold }}>
            {ar ? "اليوم" : "The Day"}
          </p>
          <h2 className="text-4xl font-light text-center mb-16" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {ar ? "برنامج حفل الزفاف" : "Wedding Timeline"}
          </h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px" style={{ background: `${roseGold}25` }} />
            {(WEDDING.timeline || timeline).map((item, i) => (
              <motion.div key={i} className="flex gap-6 mb-10 items-start"
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <div className="text-right w-16 pt-1">
                  <span className="text-xs opacity-50">{item.time}</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 relative z-10 shadow-sm"
                  style={{ background: "white", border: `1px solid ${roseGold}50` }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm mt-0.5 opacity-50">{item.location || item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Photos 4-6 */}
      <section className="py-10 px-6 max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
          {[{ src: photos[6] || photos[4] || photos[0], rot: -3 }, { src: photos[7] || photos[5] || photos[1], rot: 1.5 }, { src: photos[8] || photos[4] || photos[0], rot: -1 }].map(({ src, rot }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30, rotate: rot }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ cursor: "pointer" }}>
              <div className="bg-white p-2 pb-10" style={{ boxShadow: `0 10px 40px ${roseGold}45` }}>
                <img src={src} alt={`moment ${i + 4}`} className="w-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gift Registry */}
      <section className="py-24 px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium" style={{ color: roseGold }}>
            {ar ? "بكل محبة" : "With Love"}
          </p>
          <h2 className="text-4xl font-light text-center mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: dark }}>
            {ar ? "قائمة الهدايا" : "Gift Registry"}
          </h2>
          <p className="text-sm text-center mb-12 opacity-40">
            {ar ? "حضوركم هو أغلى هدية. إن أردتم تكريمنا أكثر:" : "Your presence is our greatest gift. If you wish to honor us further:"}
          </p>
          <div className="grid gap-4">
            {WEDDING.registry.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-5 p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition group"
                    style={{ border: `1px solid ${roseGold}20` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${roseGold}10` }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium" style={{ color: dark }}>{item.name}</p>
                      <p className="text-sm opacity-50">{ar ? item.descAr : item.desc}</p>
                    </div>
                    <span className="text-sm opacity-0 group-hover:opacity-100 transition" style={{ color: roseGold }}>→</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-5 p-5 rounded-2xl bg-white shadow-sm"
                    style={{ border: `1px solid ${roseGold}20` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${roseGold}10` }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium" style={{ color: dark }}>{item.name}</p>
                      <p className="text-xs font-mono mt-0.5 opacity-40">{item.desc}</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(item.desc.replace("iban: ", ""))}
                      className="text-xs rounded-full px-3 py-1 transition"
                      style={{ color: roseGold, border: `1px solid ${roseGold}40` }}>
                      {ar ? "نسخ" : "Copy"}
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
          <p className="tracking-[0.3em] text-xs uppercase mb-4 font-medium" style={{ color: roseGold }}>
            {ar
              ? `يرجى الرد قبل ${WEDDING.rsvpDeadline ? new Date(WEDDING.rsvpDeadline + "T12:00:00").toLocaleDateString("ar-EG", { month: "long", day: "numeric" }) : "١ أغسطس"}`
              : `Kindly Reply By ${WEDDING.rsvpDeadline ? new Date(WEDDING.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "August 1st"}`}
          </p>
          <h2 className="mb-10" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3.5rem", fontWeight: 400, color: dark, lineHeight: 1.2 }}>
            {ar ? "هل ستنضمون إلينا؟" : "Will you join us?"}
          </h2>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                <div className="text-5xl mb-4">💌</div>
                <p className="text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: roseGold }}>
                  {ar ? `شكراً، ${name}!` : `Thank you, ${name}!`}
                </p>
                <p className="opacity-50">
                  {ar ? "تم استلام ردك. لا يسعنا الانتظار للاحتفال معك." : "Your RSVP has been received. We can't wait to celebrate with you."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
                {["text", "email"].map((type, idx) => (
                  <input key={idx} value={idx === 0 ? name : email}
                    onChange={e => idx === 0 ? setName(e.target.value) : setEmail(e.target.value)}
                    type={type}
                    placeholder={idx === 0 ? (ar ? "اسمك الكامل" : "Your Full Name") : (ar ? "بريدك الإلكتروني (اختياري)" : "Your Email (optional)")}
                    className="w-full rounded-xl px-5 py-4 focus:outline-none transition"
                    style={{ background: "white", border: `1px solid ${roseGold}30`, color: dark,
                      boxShadow: "0 1px 4px rgba(183,110,121,0.08)" }} />
                ))}
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  disabled={!!searchParams.get("np")}
                  className="w-full rounded-xl px-5 py-4 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "white", border: `1px solid ${roseGold}30`, color: dark }}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "persons"}</option>)}
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setAttending(true)}
                    className="flex-1 py-4 rounded-xl font-medium tracking-wider transition"
                    style={{ background: attending === true ? roseGold : "white", color: attending === true ? "white" : roseGold, border: `1px solid ${roseGold}50` }}>
                    {ar ? "✓ حاضر" : "✓ Attending"}
                  </button>
                  <button onClick={() => setAttending(false)}
                    className="flex-1 py-4 rounded-xl font-medium tracking-wider transition"
                    style={{ background: attending === false ? dark : "white", color: attending === false ? "white" : `${dark}60`, border: `1px solid ${dark}20` }}>
                    {ar ? "✗ اعتذار" : "✗ Decline"}
                  </button>
                </div>
                <textarea value={wishes} onChange={e => setWishes(e.target.value)}
                  placeholder={ar ? "شاركنا أمنياتك... (اختياري)" : "Share your wishes... (optional)"}
                  rows={3} maxLength={200}
                  className="w-full rounded-xl px-5 py-4 focus:outline-none transition resize-none"
                  style={{ background: "white", border: `1px solid ${roseGold}30`, color: dark }} />
                <p className="text-xs text-right opacity-30">{wishes.length}/200</p>
                {rsvpError && <p className="text-red-500 text-sm text-center">{rsvpError}</p>}
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 font-semibold rounded-xl tracking-wider text-white disabled:opacity-50 transition"
                  style={{ background: `linear-gradient(135deg, ${roseGold}, #C4566A)` }}>
                  {status === "loading" ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال التأكيد" : "SEND RSVP")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Memories */}
      {WEDDING.memoriesEnabled && (
        <section className="py-12 px-6 max-w-md mx-auto text-center relative z-10">
          <p className="text-2xl mb-3">📸</p>
          <h3 className="text-2xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5C2D35" }}>
            {ar ? "شاركونا ذكرياتكم" : "Share Your Memories"}
          </h3>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: `${roseGold}80` }}>
            {ar
              ? "خلال الحفل أو بعده، شاركوا صوركم ولحظاتكم معنا"
              : "During or after the event, open the link below to share your photos with us"}
          </p>
          <a href={`/memories/${WEDDING.slug || "demo3"}`} target="_blank" rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-full text-sm tracking-wider transition"
            style={{ background: `${roseGold}10`, border: `1px solid ${roseGold}35`, color: roseGold }}>
            {ar ? "📸 شارك الذكريات" : "📸 Share Memories"}
          </a>
        </section>
      )}

      <footer className="text-center py-10 text-sm border-t relative z-10"
        style={{ color: `${roseGold}60`, borderColor: `${roseGold}15` }}>
        {ar ? "صُنع بـ 🌹 بواسطة" : "Made with 🌹 by"} <span style={{ color: roseGold }}> Lumivite</span>
      </footer>
    </div>
  )
}
