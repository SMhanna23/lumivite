import { useState, useEffect, useRef } from "react"
import EnvelopeScreen from "../components/EnvelopeScreen"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"
import { arMonthName, formatArabicDate, toArabicDigits, toArabicTime, personsLabelAr } from "../lib/arabicDate"

const GOLD = "#e0b589"
const COUNTDOWN_LABELS_AR = { days: "أيام", hours: "ساعات", mins: "دقائق", secs: "ثواني" }
const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"]
const WEEKDAYS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"]

const DEFAULT_WEDDING = {
  groom: "Christopher",
  bride: "Joelle",
  groomAr: "كريستوفر",
  brideAr: "جويل",
  date: "2027-09-20T18:00:00",
  video: "/PreWeddingNew.mp4",
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
  askEventAttendance: true,
  slug: "demo5",
  envelopeColor: "black",
  registry: [
    { name: "Wish Money", icon: "💳", desc: "Contribute to our honeymoon fund", descAr: "ساهم في صندوق شهر العسل", link: "https://www.wishmoney.io", color: GOLD },
    { name: "ABC Store", icon: "🎁", desc: "Browse our gift registry", descAr: "تصفح قائمة هداياي", link: "https://www.abc.com.lb", color: GOLD },
    { name: "Bank Transfer", icon: "🏦", desc: "iban: LB62 0099 0000 0001 0019 2000 9123", descAr: "iban: LB62 0099 0000 0001 0019 2000 9123", link: null, color: GOLD },
  ],
}

const timeline = [
  { time: "5:00 PM", label: "Ceremony", icon: "💒", desc: "Join us as we say our vows" },
  { time: "7:00 PM", label: "Welcome Drink", icon: "🥂", desc: "Celebrate with drinks & canapés" },
  { time: "11:00 PM", label: "Party", icon: "🎉", desc: "Dance the night away with us" },
]

// ── Video URL type detection (mirrors Invitation4) ───────────────────────────
const getYouTubeId = url => {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/\s]+)/)
  return m ? m[1] : null
}
const getVimeoId = url => {
  if (!url) return null
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}
const isDirectVideo = url => /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url || "")

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

function Petals() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} className="absolute text-xl select-none" style={{ left: 0, top: 0 }}
          initial={{ x: `${Math.random() * 100}vw`, y: -40, opacity: 0.7 }}
          animate={{ y: "110vh", rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: [0.7, 0.5, 0] }}
          transition={{ duration: 6 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}>
          {["🌸", "🌹", "✿", "❀"][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  )
}

// ── Continue affordance shared by all 3 intro pages ──────────────────────────
function ScrollHint({ ar }) {
  return (
    <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none"
      animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <span className="text-white/40 text-xs tracking-widest uppercase">{ar ? "مرّروا للأسفل" : "Scroll"}</span>
      <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
    </motion.div>
  )
}

// ── Video hero section — plays as you arrive, hands off to invitation music as you scroll past ──
function VideoHeroSection({ videoUrl, ar, onScrolledPast }) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(false)
  const triggeredRef = useRef(false)
  const ytId = getYouTubeId(videoUrl)
  const vimeoId = getVimeoId(videoUrl)
  const isDirect = isDirectVideo(videoUrl)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const opacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.9, 0])

  useEffect(() => {
    const v = videoRef.current
    if (isDirect && v) {
      v.play().catch(() => { setMuted(true); v.muted = true; v.play().catch(() => {}) })
    }
  }, [isDirect])

  useEffect(() => {
    const unsub = scrollYProgress.on("change", v => {
      if (v > 0.9 && !triggeredRef.current) {
        triggeredRef.current = true
        videoRef.current?.pause()
        onScrolledPast()
      }
    })
    return unsub
  }, [onScrolledPast])

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale, opacity }}>
        {isDirect ? (
          <video ref={videoRef} playsInline loop muted={muted}
            className="absolute inset-0 w-full h-full object-cover">
            <source src={videoUrl} />
          </video>
        ) : ytId ? (
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${ytId}`}
            allow="autoplay; fullscreen" title="Save the Date" style={{ border: "none" }} />
        ) : vimeoId ? (
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0`}
            allow="autoplay; fullscreen" title="Save the Date" style={{ border: "none" }} />
        ) : null}
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to bottom, rgba(11,10,9,0.7) 0%, transparent 25%, transparent 65%, rgba(11,10,9,0.9) 100%)" }} />

      <p className="absolute top-10 left-0 right-0 text-center z-10 pointer-events-none"
        style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.62rem", letterSpacing: "0.5em", color: `${GOLD}cc`, textTransform: "uppercase" }}>
        {ar ? "قصتنا" : "Our Story"}
      </p>

      {isDirect && (
        <button onClick={() => { setMuted(m => { const next = !m; if (videoRef.current) videoRef.current.muted = next; return next }) }}
          className="absolute top-8 right-6 z-20 w-11 h-11 rounded-full flex items-center justify-center text-lg"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", backdropFilter: "blur(8px)" }}>
          {muted ? "🔇" : "🔊"}
        </button>
      )}

      <ScrollHint ar={ar} />
    </section>
  )
}

// ── Photo hero with names, date & countdown ──────────────────────────────────
function HeroSection({ WEDDING, photos, ar }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url(${photos[1] || photos[0]})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "brightness(0.55)"
      }} />
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(11,10,9,0.78) 0%, rgba(11,10,9,0.1) 28%, rgba(11,10,9,0.1) 65%, rgba(11,10,9,0.88) 100%)" }} />
      <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(11,10,9,0.6) 100%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

      <motion.div className="relative z-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }}>
        <p className="tracking-[0.4em] text-sm uppercase mb-8" style={{ color: GOLD }}>{ar ? "نحن نتزوج" : "We're getting married"}</p>
        <h1 className="text-6xl md:text-8xl font-light text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{ar ? WEDDING.groomAr : WEDDING.groom}</h1>
        <p className="text-4xl italic mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>&</p>
        <h1 className="text-6xl md:text-8xl font-light text-white mb-10" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{ar ? WEDDING.brideAr : WEDDING.bride}</h1>
        <p className="tracking-widest uppercase mb-2 text-white/50 text-sm">
          {ar ? formatArabicDate(new Date(WEDDING.date)) : new Date(WEDDING.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <p className="mb-12 text-white/45 text-sm">{ar ? WEDDING.venueAr : WEDDING.venue}</p>
        <Countdown targetDate={WEDDING.date} ar={ar} />
      </motion.div>

      <ScrollHint ar={ar} />
    </section>
  )
}

// ── Save-the-date calendar with a heart marker (signature feature) ───────────
function CalendarSection({ WEDDING, ar }) {
  const d = new Date(WEDDING.date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const weddingDay = d.getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a140c 0%, #0b0a09 70%)" }}>
      <div className="absolute inset-[18px] md:inset-10 pointer-events-none" style={{ border: `1px solid ${GOLD}2e` }} />

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} viewport={{ once: true }}
        className="relative z-10 w-full max-w-sm">
        <p className="tracking-[0.4em] text-xs uppercase mb-2" style={{ color: GOLD }}>{ar ? "احفظوا التاريخ" : "Save the Date"}</p>
        <h2 className="mb-8 text-white font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem" }}>
          {ar ? `${arMonthName(d)} ${toArabicDigits(year)}` : `${d.toLocaleString("en-US", { month: "long" })} ${year}`}
        </h2>

        <div className="grid grid-cols-7 gap-y-2" dir="ltr">
          {(ar ? WEEKDAYS_AR : WEEKDAYS_EN).map((w, i) => (
            <div key={i} className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Jost', sans-serif" }}>{w}</div>
          ))}
          {cells.map((day, i) => (
            <div key={i} className="h-11 flex items-center justify-center relative">
              {day && (
                day === weddingDay ? (
                  <motion.div className="relative w-9 h-9 rounded-full flex items-center justify-center"
                    initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} viewport={{ once: true }}
                    style={{ background: `${GOLD}22`, border: `1.5px solid ${GOLD}` }}>
                    <motion.span className="absolute text-lg"
                      animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
                      💗
                    </motion.span>
                  </motion.div>
                ) : (
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Jost', sans-serif" }}>
                    {ar ? toArabicDigits(day) : day}
                  </span>
                )
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm italic" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Cormorant Garamond', serif" }}>
          {ar ? "نتطلع لرؤيتكم هناك" : "We can't wait to see you there"}
        </p>
      </motion.div>

      <ScrollHint ar={ar} />
    </section>
  )
}

export default function Invitation5({ override = null }) {
  const WEDDING = override ? { ...DEFAULT_WEDDING, ...override } : DEFAULT_WEDDING
  const tier = (WEDDING.package || "gold").toLowerCase().includes("gold") ? "gold"
             : (WEDDING.package || "").toLowerCase().includes("silver") ? "silver"
             : "bronze"
  const [started, setStarted] = useState(false)
  const [name, setName] = useState(() => tier !== "bronze" ? (new URLSearchParams(window.location.search).get("gn") || "") : "")
  const [attending, setAttending] = useState(null)
  const [eventChoice, setEventChoice] = useState(null)
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
  const showEventChoice = (WEDDING.askEventAttendance ?? false) && !WEDDING.hideCeremony && (WEDDING.venues?.length ?? 0) >= 2
  const eventOptions = showEventChoice ? [
    { id: "both", label: `I'm coming to the ${WEDDING.venues[0].label} and the ${WEDDING.venues[1].label}`, labelAr: `سآتي إلى ${WEDDING.venues[0].labelAr} و${WEDDING.venues[1].labelAr}` },
    { id: "venue0", label: `Just the ${WEDDING.venues[0].label} for me`, labelAr: `سآتي إلى ${WEDDING.venues[0].labelAr} فقط` },
    { id: "venue1", label: `Just the ${WEDDING.venues[1].label} for me`, labelAr: `سآتي إلى ${WEDDING.venues[1].labelAr} فقط` },
  ] : []
  const photos = WEDDING.photos?.length ? WEDDING.photos : [
    "/photo1.jpg", "/photo2.jpg", "/photo3.jpg", "/photo4.jpg", "/photo5.jpg", "/photo6.jpg", "/photo7.jpg", "/photo8.jpg", "/photo9.jpg",
  ]
  const audioRef = useRef(null)
  const musicStart = WEDDING.musicStart ?? 0
  const musicEnd = WEDDING.musicEnd ?? null

  const startMusic = () => {
    if (tier === "bronze") return
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = musicStart
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  // When there's a save-the-date video, the invitation's music stays silent
  // until the guest scrolls past it — the video's own sound carries that moment instead.
  const handleEnvelopeOpen = () => {
    if (!WEDDING.video) startMusic()
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

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has("_app")) {
      url.searchParams.delete("_app")
      const query = url.searchParams.toString()
      window.history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !musicEnd) return
    const onTimeUpdate = () => { if (audio.currentTime >= musicEnd) audio.currentTime = musicStart }
    audio.addEventListener("timeupdate", onTimeUpdate)
    return () => audio.removeEventListener("timeupdate", onTimeUpdate)
  }, [musicStart, musicEnd])

  const requireEventChoice = showEventChoice && attending === true
  const handleRSVP = async () => {
    if (!name || attending === null || (requireEventChoice && eventChoice === null)) { setRsvpError(ar ? "يرجى إدخال اسمك واختيار الحضور" : "Please enter your name and select attendance"); return }
    setRsvpError("")
    setStatus("loading")
    try {
      await addDoc(collection(db, "rsvps"), {
        name, attending, wishes, persons,
        wedding: `${WEDDING.groom} & ${WEDDING.bride}`,
        ...(requireEventChoice ? { eventChoice } : {}),
        createdAt: serverTimestamp()
      })
      const emoji = attending ? "✅" : "❌"
      const chosenOption = requireEventChoice ? eventOptions.find(o => o.id === eventChoice) : null
      const msg = `${emoji} New RSVP on Lumivite!\n👤 ${name}\n💒 ${WEDDING.groom} & ${WEDDING.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${chosenOption ? `\n📍 ${chosenOption.label}` : ""}${wishes ? `\n💬 "${wishes}"` : ""}`
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
    <div className={started ? "min-h-screen bg-[#0b0a09] text-white overflow-x-hidden relative" : "fixed inset-0"}
      dir={ar ? "rtl" : "ltr"}
      style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol'" : "inherit" }}>

      {tier !== "bronze" && <audio ref={audioRef} loop src={WEDDING.music || "/music.mp3"} preload="auto" />}

      {!started && (
        <EnvelopeScreen
          guestName={guestName}
          onOpen={handleEnvelopeOpen}
          onVideoEnd={() => setStarted(true)}
          ar={ar}
          setLang={setLang}
          envelopeColor={WEDDING.envelopeColor || "black"}
        />
      )}

      {started && (<>
        {!WEDDING.hideEmojis && <Petals />}

        {/* Opening sequence — scroll-native, no taps required */}
        {WEDDING.video && <VideoHeroSection videoUrl={WEDDING.video} ar={ar} onScrolledPast={startMusic} />}
        <HeroSection WEDDING={WEDDING} photos={photos} ar={ar} />
        <CalendarSection WEDDING={WEDDING} ar={ar} />

        {tier !== "bronze" && (
          <motion.button onClick={toggleMusic}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-black flex items-center justify-center shadow-2xl transition text-xl"
            style={{ background: GOLD }}>
            {playing ? "⏸" : "🎵"}
          </motion.button>
        )}

        <motion.button onClick={() => setLang(ar ? "en" : "ar")}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-6 left-6 z-50 h-10 px-4 rounded-full flex items-center justify-center shadow-2xl text-sm font-medium transition"
          style={{ background: `${GOLD}26`, border: `1px solid ${GOLD}66`, color: GOLD }}>
          {ar ? "EN" : "عربي"}
        </motion.button>

        {/* Quote + Parents */}
        <section className="py-16 px-6 text-center max-w-2xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
            {!WEDDING.hideQuote && (<>
              {!WEDDING.hideEmojis && <div className="text-2xl mb-6" style={{ color: GOLD }}>✦</div>}
              <p className="text-white/70 text-2xl md:text-3xl leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive" }}>"{ar ? WEDDING.quoteAr : WEDDING.quote}"</p>
              {!WEDDING.hideQuoteRef && WEDDING.quoteRef && <p className="text-sm mt-3 tracking-widest" style={{ color: GOLD }}>— {WEDDING.quoteRef}</p>}
              {!WEDDING.hideEmojis && <div className="text-2xl mt-8 mb-10" style={{ color: GOLD }}>✦</div>}
            </>)}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {(ar ? WEDDING.parentsAr : WEDDING.parents).map((p, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                  className="rounded-xl px-4 py-5 text-center"
                  style={{ border: `1px solid ${GOLD}4d`, background: `${GOLD}0d` }}>
                  <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>{ar ? "عائلة" : "Mr. & Mrs."}</p>
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
            <p className="tracking-[0.3em] text-sm uppercase mb-3" style={{ color: GOLD }}>{ar ? "قبل الأبد" : "Before Forever"}</p>
            <h2 className="mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.5rem" : "3.8rem", color: "white", fontWeight: 400, lineHeight: 1.2 }}>
              {ar ? "لمحة منّا" : "A glimpse of us"}
            </h2>
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="h-px w-20" style={{ background: `linear-gradient(to right, transparent, ${GOLD}99)` }} />
              {!WEDDING.hideEmojis && <span style={{ color: GOLD }}>✦</span>}
              <div className="h-px w-20" style={{ background: `linear-gradient(to left, transparent, ${GOLD}99)` }} />
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
            <p className="tracking-[0.3em] text-sm uppercase text-center mb-2" style={{ color: GOLD }}>{ar ? "انضموا إلينا" : "Join Us"}</p>
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
                    className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden transition"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="h-52 w-full overflow-hidden">
                      <img src={photos[i + 2] || photos[0]} alt={v.place} className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-sm tracking-widest uppercase mb-2" style={{ color: GOLD }}>{ar ? v.labelAr : v.label}</p>
                      <p className="font-serif text-2xl font-light mb-1">{ar ? toArabicTime(v.time) : v.time}</p>
                      <p className="text-white font-medium mb-1">{ar ? v.placeAr : v.place}</p>
                      <p className="text-white/40 text-sm mb-4">{ar ? v.locationAr : v.location}</p>
                      {tier === "gold" && (
                        <a href={v.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.place + " " + v.location)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-2 hover:bg-white/5 transition"
                          style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>
                          📍 {ar ? "افتح في خرائط Google" : "Open in Google Maps"}
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
            <p className="tracking-[0.3em] text-xs uppercase text-center mb-2" style={{ color: GOLD }}>{ar ? "اليوم" : "The Day"}</p>
            <h2 className="font-serif text-4xl font-light text-center mb-16">{ar ? "برنامج حفل الزفاف" : "Wedding Timeline"}</h2>
            <div className="relative">
              <div className="absolute left-[88px] top-0 bottom-0 w-px bg-white/10" />
              {(WEDDING.timeline || timeline).map((item, i) => (
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
            <p className="tracking-[0.3em] text-sm uppercase text-center mb-2" style={{ color: GOLD }}>{ar ? "بكل محبة" : "With Love"}</p>
            <h2 className="font-light text-center mb-4 text-white"
              style={{ fontFamily: ar ? "'Cormorant Garamond', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3rem" }}>
              {ar ? "قائمة الهدايا" : "Gift Registry"}
            </h2>
            <p className="text-white/40 text-sm text-center mb-12">{ar ? "وجودكم معنا هو أجمل هدية! لمن يرغب تتوفر قائمة الهدايا :" : (WEDDING.registrySubtitle || "Your presence is our greatest gift. If you wish to honor us further:")}</p>
            <div className="grid gap-4">
              {WEDDING.registry.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  {item.name === "Wish Money" ? (
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/3">
                      <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${GOLD}1a` }}>💳</div><p className="font-medium text-white">Wish Money</p></div>
                      {item.acc && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">Acc# {item.acc}</span><button onClick={() => copyToClipboard(item.acc, "wish-acc")} className="text-xs rounded-full px-3 py-1 hover:bg-white/5 transition" style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>{copiedKey === "wish-acc" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
                      {item.phone && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">{item.phone}</span><button onClick={() => copyToClipboard(item.phone, "wish-phone")} className="text-xs rounded-full px-3 py-1 hover:bg-white/5 transition" style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>{copiedKey === "wish-phone" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs px-3 py-1 rounded-full" style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>Visit →</a>}
                    </div>
                  ) : item.name === "Bank Transfer" ? (
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/3">
                      <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${GOLD}1a` }}>🏦</div><div><p className="font-medium text-white">{ar ? "تحويل بنكي" : "Bank Transfer"}</p>{item.beneficiary && <p className="text-white/40 text-xs">{item.beneficiary}</p>}</div></div>
                      {(item.iban || item.desc) && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs font-mono">{item.iban || item.desc?.replace("iban: ", "")}</span><button onClick={() => copyToClipboard(item.iban || item.desc?.replace("iban: ", ""), "bank-iban")} className="text-xs rounded-full px-3 py-1 hover:bg-white/5 transition" style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>{copiedKey === "bank-iban" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
                      {item.bic && <div className="flex items-center justify-between py-2 border-t border-white/10"><span className="text-white/40 text-xs">BIC/Swift: <span className="font-mono">{item.bic}</span></span><button onClick={() => copyToClipboard(item.bic, "bank-bic")} className="text-xs rounded-full px-3 py-1 hover:bg-white/5 transition" style={{ color: GOLD, border: `1px solid ${GOLD}4d` }}>{copiedKey === "bank-bic" ? (ar ? "تم النسخ!" : "Copied!") : (ar ? "نسخ" : "Copy")}</button></div>}
                    </div>
                  ) : item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/5 transition group"
                      style={{ "--tw-border-opacity": 1 }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${GOLD}1a` }}>{item.icon}</div>
                      <div className="flex-1 text-left"><p className="font-medium text-white">{item.name}</p><p className="text-white/40 text-sm">{ar ? item.descAr : item.desc}</p></div>
                      <span className="text-sm opacity-0 group-hover:opacity-100 transition" style={{ color: GOLD }}>→</span>
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
              <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${GOLD}66)` }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${GOLD}66` }} />
              <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${GOLD}66)` }} />
            </div>
            <p className="text-white/85 font-medium leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Cormorant Garamond', serif", fontSize: ar ? "1.2rem" : "1.1rem", fontStyle: "italic" }}>
              {ar ? WEDDING.noteAr : WEDDING.noteEn}
            </p>
          </section>
        )}

        {/* RSVP */}
        <section className="py-24 px-6 max-w-md mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <p className="tracking-[0.3em] text-sm uppercase mb-4" style={{ color: GOLD }}>
              {ar
                ? `يرجى الرد قبل ${WEDDING.rsvpDeadline ? formatArabicDate(new Date(WEDDING.rsvpDeadline + "T12:00:00"), { withYear: false }) : "١ آب"}`
                : `Kindly Reply By ${WEDDING.rsvpDeadline ? new Date(WEDDING.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "August 1st"}`}
            </p>
            <h2 className="mb-10" style={{ fontFamily: ar ? "'Noto Naskh Arabic', serif" : "'Great Vibes', cursive", fontSize: ar ? "2.2rem" : "3.5rem", fontWeight: 400, color: "white", lineHeight: 1.2 }}>{ar ? "هل ستنضمون إلينا؟" : "Will you join us?"}</h2>
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
                  <div className="text-5xl mb-4">💌</div>
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
                    <button onClick={() => { setAttending(false); setEventChoice(null) }}
                      className={`flex-1 py-4 rounded-lg border transition font-medium tracking-wider ${attending === false ? "bg-white/20 border-white/40 text-white" : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"}`}>
                      {ar ? "✗ اعتذار" : "✗ Decline"}
                    </button>
                  </div>
                  {requireEventChoice && (
                    <div className="space-y-2.5" dir={ar ? "rtl" : "ltr"}>
                      {eventOptions.map(opt => (
                        <button key={opt.id} type="button" onClick={() => setEventChoice(opt.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-lg border transition ${ar ? "text-right" : "text-left"}`}
                          style={{ borderColor: eventChoice === opt.id ? GOLD : "rgba(255,255,255,0.15)", background: eventChoice === opt.id ? `${GOLD}1a` : "transparent" }}>
                          <span className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition"
                            style={{ borderColor: eventChoice === opt.id ? GOLD : "rgba(255,255,255,0.3)" }}>
                            {eventChoice === opt.id && <span className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />}
                          </span>
                          <span className="text-sm leading-snug" style={{ color: eventChoice === opt.id ? "white" : "rgba(255,255,255,0.6)" }}>{ar ? opt.labelAr : opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
        {tier === "gold" && WEDDING.memoriesEnabled && (
          <section className="py-12 px-6 max-w-md mx-auto text-center relative z-10">
            <p className="text-2xl mb-3" style={{ color: GOLD }}>📸</p>
            <h3 className="font-serif text-2xl font-light text-white mb-2">
              {ar ? "شاركونا ذكرياتكم" : "Share Your Memories"}
            </h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              {ar ? "خلال الحفل أو بعده، شاركوا صوركم ولحظاتكم معنا" : "During or after the event, open the link below to share your photos with us"}
            </p>
            <a href={`/memories/${WEDDING.slug || "demo5"}`} target="_blank" rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-full text-sm tracking-wider transition"
              style={{ background: `${GOLD}1a`, border: `1px solid ${GOLD}59`, color: GOLD }}>
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
