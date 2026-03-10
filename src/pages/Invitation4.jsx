import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useSearchParams } from "react-router-dom"

const GOLD = "#c4a35a"
const DARK = "#0c0b09"

const DEFAULT_WEDDING = {
  groom: "Christopher", bride: "Joelle",
  groomAr: "كريستوفر", brideAr: "جويل",
  date: "2026-09-20T18:00:00",
  venues: [
    { label: "Wedding Ceremony", labelAr: "مراسم الزواج", time: "6:00 PM", place: "Saint Georges Church", placeAr: "كنيسة مار جرجس", location: "Feytroun, Lebanon", locationAr: "فيترون، لبنان", map: "" },
    { label: "Wedding Party",    labelAr: "حفل الزفاف",   time: "8:30 PM", place: "Bois de Roses",        placeAr: "بوا دو روز",        location: "Feytroun, Lebanon", locationAr: "فيترون، لبنان", map: "" },
  ],
  parents:   ["Fadi & Dania Abboud", "Nicolas & Marleine Hanna"],
  parentsAr: ["فادي ودانيا عبود",   "نيكولا ومرلين حنا"],
  quote:    "We love because he first loved us.",
  quoteAr:  "نحن نحب لأنه هو أحبنا أولاً",
  quoteRef: "1 John 4:19",
  venue:    "Feytroun, Lebanon", venueAr: "فيترون، لبنان",
  message:    "Request the honor of your presence at the wedding of their son and daughter",
  messageAr:  "يطلبون شرف حضوركم حفل زفاف نجلهم وابنتهم",
  registry: [
    { name: "Wish Money",    icon: "💳", desc: "Contribute to our honeymoon fund",  descAr: "ساهم في صندوق شهر العسل", link: "https://www.wishmoney.io" },
    { name: "ABC Store",     icon: "🎁", desc: "Browse our gift registry",           descAr: "تصفح قائمة هداياي",        link: "https://www.abc.com.lb" },
    { name: "Bank Transfer", icon: "🏦", desc: "iban: LB62 0099 0000 0001 0019 2000 9123", descAr: "iban: LB62 0099 0000 0001 0019 2000 9123", link: null },
  ],
  // video: ""  ← admin sets this to a YouTube URL, Vimeo URL, or direct MP4 URL
}

// ── Detect video URL type ────────────────────────────────────────────────────
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

// ── WHITE ENVELOPE SCREEN ────────────────────────────────────────────────────
function EnvelopeScreen({ w, guestName, onOpen, ar, setLang }) {
  const [opened, setOpened] = useState(false)
  const tap = () => { if (opened) return; setOpened(true); setTimeout(onOpen, 1100) }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center cursor-pointer select-none relative overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
      style={{ background: "#faf5ee" }}
      onClick={tap}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>

      {/* Subtle grid paper lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #8c6b3a 0, #8c6b3a 1px, transparent 0, transparent 28px), repeating-linear-gradient(90deg, #8c6b3a 0, #8c6b3a 1px, transparent 0, transparent 28px)" }} />

      {/* Language toggle */}
      <button onClick={e => { e.stopPropagation(); setLang(ar ? "en" : "ar") }}
        className="absolute top-5 right-5 z-20 h-9 px-4 rounded-full text-xs transition"
        style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD, fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em" }}>
        {ar ? "EN" : "عربي"}
      </button>

      <motion.div className="flex flex-col items-center relative z-10"
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3, ease: "easeOut" }}>

        {/* ── ENVELOPE SVG ── */}
        <div className="relative mb-8" style={{ perspective: 800 }}>
          {/* Envelope body */}
          <div className="relative"
            style={{ width: 300, height: 200, background: "white", borderRadius: 3,
              boxShadow: "0 24px 64px rgba(140,107,58,0.2), 0 4px 18px rgba(0,0,0,0.06)",
              border: "1px solid rgba(196,163,90,0.35)" }}>

            {/* Bottom V fold */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none">
              <svg viewBox="0 0 300 100" width="300" height="100">
                <polygon points="0,0 300,0 150,100" fill="#f2e9d8" />
                <line x1="0" y1="0" x2="150" y2="100" stroke={`${GOLD}55`} strokeWidth="0.7" />
                <line x1="300" y1="0" x2="150" y2="100" stroke={`${GOLD}55`} strokeWidth="0.7" />
              </svg>
            </div>
            {/* Left fold */}
            <div className="absolute inset-y-0 left-0 pointer-events-none">
              <svg viewBox="0 0 150 200" width="150" height="200">
                <line x1="0" y1="0" x2="150" y2="100" stroke={`${GOLD}40`} strokeWidth="0.7" />
              </svg>
            </div>
            {/* Right fold */}
            <div className="absolute inset-y-0 right-0 pointer-events-none">
              <svg viewBox="0 0 150 200" width="150" height="200">
                <line x1="150" y1="0" x2="0" y2="100" stroke={`${GOLD}40`} strokeWidth="0.7" />
              </svg>
            </div>

            {/* Inner names (visible when flap is up) */}
            <div className="absolute inset-x-0 top-5 flex flex-col items-center gap-0.5" style={{ zIndex: 1 }}>
              <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.15rem", color: `${GOLD}bb` }}>
                {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
              </p>
              <p className="text-xs tracking-widest" style={{ color: "#a08050aa", fontFamily: "'Jost', sans-serif" }}>
                {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* ── FLAP that folds back on open ── */}
          <motion.div
            className="absolute top-0 left-0 pointer-events-none overflow-hidden"
            style={{ width: 300, height: 102, transformOrigin: "top center", transformStyle: "preserve-3d", zIndex: 10 }}
            animate={{ rotateX: opened ? -175 : 0 }}
            transition={{ duration: 0.95, ease: [0.4, 0, 0.2, 1] }}>
            <svg viewBox="0 0 300 102" width="300" height="102">
              <polygon points="0,0 300,0 150,102" fill="white" />
              <line x1="0" y1="0" x2="150" y2="102" stroke={`${GOLD}50`} strokeWidth="0.7" />
              <line x1="300" y1="0" x2="150" y2="102" stroke={`${GOLD}50`} strokeWidth="0.7" />
              <line x1="0" y1="0" x2="300" y2="0" stroke={`${GOLD}30`} strokeWidth="0.7" />
            </svg>
            {/* Wax seal */}
            <div className="absolute"
              style={{ bottom: 10, left: "50%", transform: "translateX(-50%)" }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
                style={{ background: "radial-gradient(circle at 38% 35%, #d4ab4a, #b8903a 55%, #7a5818)",
                  boxShadow: "0 3px 14px rgba(0,0,0,0.28), inset 0 1px 2px rgba(255,255,255,0.22)" }}>
                💍
              </div>
            </div>
          </motion.div>
        </div>

        {/* Names & date below envelope */}
        <motion.div animate={{ opacity: opened ? 0 : 1, y: opened ? -8 : 0 }} transition={{ duration: 0.4 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,7vw,2.8rem)", fontWeight: 300, color: "#2c1f10", lineHeight: 1.1 }}>
            {ar ? w.groomAr : w.groom}
          </h1>
          <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.8rem", color: GOLD, margin: "2px 0" }}>
            {ar ? "و" : "and"}
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,7vw,2.8rem)", fontWeight: 300, color: "#2c1f10", lineHeight: 1.1 }}>
            {ar ? w.brideAr : w.bride}
          </h1>
          <p className="mt-3 text-xs tracking-[0.4em] uppercase" style={{ color: GOLD, fontFamily: "'Jost', sans-serif" }}>
            {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          {guestName && (
            <motion.p className="mt-3 text-sm italic"
              style={{ color: "#7a5c3a99", fontFamily: "'Cormorant Garamond', serif" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              {ar ? "عزيزنا" : "Dear"} <span style={{ color: GOLD }}>{guestName}</span>
            </motion.p>
          )}
          <motion.div className="flex flex-col items-center mt-7 gap-2"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }}>
            <p className="text-xs tracking-[0.45em] uppercase" style={{ color: "#2c1f1055", fontFamily: "'Jost', sans-serif" }}>
              {ar ? "انقر لفتح" : "Tap to Open"}
            </p>
            <div className="w-px h-7" style={{ background: `linear-gradient(to bottom, ${GOLD}70, transparent)` }} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ── VIDEO PLAYER ─────────────────────────────────────────────────────────────
function VideoPlayer({ videoUrl, photos, w, onEnded, ar }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [muted,   setMuted]   = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDur]    = useState(0)
  const ytId     = getYouTubeId(videoUrl)
  const vimeoId  = getVimeoId(videoUrl)
  const isDirect = isDirectVideo(videoUrl)
  const hasVideo = !!(ytId || vimeoId || isDirect)

  // Direct video controls
  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) videoRef.current.pause(); else videoRef.current.play()
    setPlaying(p => !p)
  }
  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !muted; setMuted(m => !m)
  }

  // If no video at all → fallback to photo film
  if (!hasVideo) return <PhotoFilm photos={photos} w={w} onEnded={onEnded} ar={ar} />

  const iframeParams = ytId
    ? `?autoplay=1&rel=0&controls=1&modestbranding=1&color=white`
    : `?autoplay=1&color=ffffff`
  const iframeSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}${iframeParams}`
    : `https://player.vimeo.com/video/${vimeoId}${iframeParams}`

  return (
    <div className="fixed inset-0 z-10" style={{ background: DARK }}>
      {/* Video */}
      {isDirect ? (
        <video ref={videoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-contain"
          style={{ background: DARK }}
          onEnded={onEnded}
          onTimeUpdate={e => { setElapsed(e.target.currentTime); setDur(e.target.duration || 0) }}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
          <source src={videoUrl} />
        </video>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={iframeSrc}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen title="Wedding Video"
        />
      )}

      {/* Custom controls — only for direct video */}
      {isDirect && (
        <div className="absolute bottom-16 left-4 right-4 z-20">
          {/* Progress */}
          <div className="w-full h-0.5 rounded-full mb-3 cursor-pointer" style={{ background: "rgba(255,255,255,0.15)" }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              if (videoRef.current) videoRef.current.currentTime = pct * duration
            }}>
            <div className="h-full rounded-full transition-none" style={{ width: duration ? `${(elapsed / duration) * 100}%` : "0%", background: GOLD }} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white text-xl w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={toggleMute} className="text-white text-base w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              {muted ? "🔇" : "🔊"}
            </button>
            {duration > 0 && (
              <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Jost', sans-serif" }}>
                {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skip to RSVP */}
      <button onClick={onEnded}
        className="absolute top-5 right-5 z-30 text-xs tracking-widest uppercase px-5 py-2.5 rounded-full transition"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontFamily: "'Jost', sans-serif",
          backdropFilter: "blur(8px)" }}>
        {ar ? "تخطي ←" : "Skip →"}
      </button>

      {/* Couple names overlay — bottom left, subtle */}
      <motion.div className="absolute bottom-5 left-5 z-20 pointer-events-none"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.7, y: 0 }} transition={{ delay: 1.5, duration: 1 }}>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.4rem", color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.7)", lineHeight: 1.2 }}>
          {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
        </p>
      </motion.div>
    </div>
  )
}

// ── PHOTO FILM FALLBACK (when no video URL is set) ───────────────────────────
// A cinematic auto-playing slideshow that feels like a wedding film
const SLIDES = [
  { idx: 1, duration: 5500 },
  { idx: 2, duration: 5500 },
  { idx: 3, duration: 5500 },
  { idx: 4, duration: 5000 },
  { idx: 5, duration: 5000 },
  { idx: 6, duration: 5000 },
  { idx: 7, duration: 5000 },
  { idx: 8, duration: 5000 },
]
function PhotoFilm({ photos, w, onEnded, ar }) {
  const [slide, setSlide] = useState(0)
  const [prog,  setProg]  = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    const dur   = SLIDES[slide].duration
    const start = performance.now()
    const tick  = (now) => {
      const pct = Math.min(((now - start) / dur) * 100, 100)
      setProg(pct)
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick) }
      else if (slide < SLIDES.length - 1) { setSlide(s => s + 1); setProg(0) }
      else { onEnded() }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [slide])

  const photoSrc = photos[SLIDES[slide].idx] || photos[0]

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: DARK }}>
      {/* Gold progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full" style={{ width: `${prog}%`, background: GOLD, transition: "none" }} />
      </div>

      {/* Skip */}
      <button onClick={onEnded}
        className="fixed top-5 right-5 z-50 text-xs tracking-widest uppercase px-5 py-2.5 rounded-full transition"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)", fontFamily: "'Jost', sans-serif", backdropFilter: "blur(8px)" }}>
        {ar ? "تخطي ←" : "Skip →"}
      </button>

      {/* Ken Burns photo */}
      <AnimatePresence mode="wait">
        <motion.div key={slide}
          className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}>
          <motion.div className="absolute inset-0"
            initial={{ scale: 1.08 }} animate={{ scale: 1.0 }}
            transition={{ duration: SLIDES[slide].duration / 1000, ease: "linear" }}
            style={{ backgroundImage: `url(${photoSrc})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.52)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic vignette */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.85) 100%)" }} />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Couple names — cinematic overlay */}
      <motion.div className="fixed bottom-14 left-0 right-0 text-center pointer-events-none z-10"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 0.85, y: 0 }} transition={{ delay: 0.8, duration: 1.2 }}>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(2rem,7vw,3.5rem)", color: "white",
          textShadow: "0 2px 24px rgba(0,0,0,0.6)", lineHeight: 1.2 }}>
          {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
        </p>
        <p className="text-xs tracking-[0.4em] uppercase mt-2"
          style={{ color: GOLD, fontFamily: "'Jost', sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
          {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </motion.div>

      {/* Slide dots */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-500"
            style={{ width: i === slide ? 18 : 5, height: 5,
              background: i === slide ? GOLD : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>
    </div>
  )
}

// ── RSVP SCREEN ──────────────────────────────────────────────────────────────
function RSVPScreen({ w, ar, setLang, onReplay }) {
  const [name,      setName]      = useState("")
  const [email,     setEmail]     = useState("")
  const [attending, setAttending] = useState(null)
  const [wishes,    setWishes]    = useState("")
  const [persons,   setPersons]   = useState(1)
  const [status,    setStatus]    = useState("idle")
  const [searchParams] = useSearchParams()
  useEffect(() => { const gn = searchParams.get("gn"); if (gn) setName(gn) }, [])

  const handleRSVP = async () => {
    if (!name || attending === null) return alert("Please enter your name and select attendance")
    setStatus("loading")
    try {
      await addDoc(collection(db, "rsvps"), {
        name, email, attending, wishes, persons,
        wedding: `${w.groom} & ${w.bride}`, createdAt: serverTimestamp()
      })
      const emoji = attending ? "✅" : "❌"
      const msg = `${emoji} New RSVP on Lumivite!\n👤 ${name}\n💒 ${w.groom} & ${w.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`, { mode: "no-cors" }).catch(() => {})
      setStatus("success")
    } catch { setStatus("error") }
  }

  return (
    <motion.div className="min-h-screen flex flex-col relative overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
      style={{ background: DARK }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${GOLD}0e 0%, transparent 60%)` }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 relative z-10">
        <button onClick={onReplay}
          className="text-xs tracking-widest uppercase px-4 py-2 rounded-full transition"
          style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'Jost', sans-serif" }}>
          ← {ar ? "إعادة" : "Replay"}
        </button>
        <button onClick={() => setLang(ar ? "en" : "ar")}
          className="h-9 px-4 rounded-full text-xs transition"
          style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}45`, color: GOLD, fontFamily: "'Jost', sans-serif" }}>
          {ar ? "EN" : "عربي"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="text-center mb-9">
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.6rem", color: GOLD, lineHeight: 1 }}>
              {ar ? "من فضلكم" : "please"}
            </p>
            <h2 className="mt-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.8rem,10vw,4.2rem)", fontWeight: 300, color: "white", lineHeight: 1, letterSpacing: "0.06em" }}>
              {ar ? "ردّوا علينا" : "R S V P"}
            </h2>
            <p className="mt-3 text-xs tracking-[0.35em] uppercase" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Jost', sans-serif" }}>
              {ar
                ? `يرجى الرد قبل ${w.rsvpDeadline ? new Date(w.rsvpDeadline + "T12:00:00").toLocaleDateString("ar-EG", { month: "long", day: "numeric" }) : "١ أغسطس"}`
                : `Kindly Reply By ${w.rsvpDeadline ? new Date(w.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "August 1st"}`}
            </p>
            <p className="mt-1 text-sm italic" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
              {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
            </p>

            {/* Venues summary */}
            <div className="flex gap-3 justify-center mt-4">
              {w.venues.map((v, i) => (
                <a key={i}
                  href={v.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.place + " " + v.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-full transition"
                  style={{ border: `1px solid ${GOLD}35`, color: GOLD, fontFamily: "'Jost', sans-serif" }}>
                  📍 {ar ? v.placeAr : v.place} · {v.time}
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="text-5xl mb-5">💌</div>
                <p style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif", fontSize: "1.7rem" }}>
                  {ar ? `شكراً، ${name}!` : `Thank you, ${name}!`}
                </p>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Jost', sans-serif" }}>
                  {ar ? "تم استلام ردك بنجاح." : "Your RSVP has been received."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-3">
                {[
                  { type: "text",  val: name,  set: setName,  ph: ar ? "اسمك الكامل" : "Your Full Name" },
                  { type: "email", val: email, set: setEmail, ph: ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)" },
                ].map(({ type, val, set, ph }) => (
                  <input key={type} type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full rounded-xl px-5 py-4 text-white placeholder-white/20 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", fontFamily: "'Jost', sans-serif" }} />
                ))}
                <select value={persons} onChange={e => setPersons(parseInt(e.target.value))}
                  className="w-full rounded-xl px-5 py-4 text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", fontFamily: "'Jost', sans-serif" }}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n} style={{ background: "#1a1510" }}>{n} {n === 1 ? "person" : "persons"}</option>)}
                </select>
                <div className="flex gap-3">
                  {[
                    { val: true,  label: ar ? "✓ حاضر"   : "✓ Attending" },
                    { val: false, label: ar ? "✗ اعتذار" : "✗ Decline"  },
                  ].map(({ val, label }) => (
                    <button key={String(val)} onClick={() => setAttending(val)}
                      className="flex-1 py-4 rounded-xl font-medium tracking-wider transition"
                      style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem",
                        background: attending === val ? (val ? GOLD : "rgba(255,255,255,0.14)") : "transparent",
                        border: `1px solid ${attending === val ? (val ? GOLD : "rgba(255,255,255,0.4)") : "rgba(255,255,255,0.1)"}`,
                        color: attending === val ? "white" : "rgba(255,255,255,0.38)" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <textarea value={wishes} onChange={e => setWishes(e.target.value)}
                  placeholder={ar ? "شاركنا أمنياتك... (اختياري)" : "Share your wishes... (optional)"}
                  rows={3} maxLength={200} className="w-full rounded-xl px-5 py-4 text-white placeholder-white/20 focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", fontFamily: "'Jost', sans-serif" }} />
                <p className="text-xs text-right" style={{ color: "rgba(255,255,255,0.18)" }}>{wishes.length}/200</p>
                <button onClick={handleRSVP} disabled={status === "loading"}
                  className="w-full py-4 rounded-xl font-semibold tracking-widest uppercase transition disabled:opacity-50"
                  style={{ background: GOLD, color: "white", fontFamily: "'Jost', sans-serif", fontSize: "0.82rem" }}>
                  {status === "loading" ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال التأكيد" : "Send RSVP")}
                </button>

                {/* Registry */}
                {w.registry?.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <p className="text-xs tracking-[0.35em] uppercase text-center mb-3" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Jost', sans-serif" }}>
                      {ar ? "قائمة الهدايا" : "Gift Registry"}
                    </p>
                    {w.registry.map((item, i) => (
                      item.link ? (
                        <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl transition"
                          style={{ background: "rgba(196,163,90,0.06)", border: `1px solid ${GOLD}25` }}>
                          <span>{item.icon}</span>
                          <span className="flex-1 text-sm" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Jost', sans-serif" }}>{item.name}</span>
                          <span style={{ color: GOLD, fontSize: 12 }}>→</span>
                        </a>
                      ) : (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: "rgba(196,163,90,0.06)", border: `1px solid ${GOLD}25` }}>
                          <span>{item.icon}</span>
                          <span className="flex-1 text-xs font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</span>
                          <button onClick={() => navigator.clipboard.writeText(item.desc.replace("iban: ", ""))}
                            className="text-xs px-2 py-1 rounded-full" style={{ color: GOLD, border: `1px solid ${GOLD}40` }}>
                            Copy
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-center pb-6 text-xs relative z-10" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "'Jost', sans-serif" }}>
        {ar ? "صُنع بـ ✦ بواسطة" : "Made with ✦ by"} <span style={{ color: GOLD }}>Lumivite</span>
      </p>
    </motion.div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Invitation4({ override = null }) {
  const W = override ? { ...DEFAULT_WEDDING, ...override } : DEFAULT_WEDDING
  const [phase,   setPhase] = useState("envelope") // envelope | video | rsvp
  const [lang,    setLang]  = useState("en")
  const ar = lang === "ar"
  const audioRef = useRef(null)
  const [searchParams] = useSearchParams()
  const guestName = searchParams.get("gn") || ""

  const photos = W.photos?.length ? W.photos : [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200",
    "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=800",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800",
    "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800",
  ]

  const startMusic = () => { if (audioRef.current) { audioRef.current.play().catch(() => {}) } }

  const openEnvelope = () => { setPhase("video"); startMusic() }
  const onVideoEnded = useCallback(() => setPhase("rsvp"), [])
  const onReplay = useCallback(() => setPhase("video"), [])

  return (
    <>
      {/* Background music (quiet during video phase) */}
      <audio ref={audioRef} loop src="/music.mp3" preload="auto"
        style={{ display: "none" }}
      />

      <AnimatePresence mode="wait">
        {phase === "envelope" && (
          <motion.div key="env" className="fixed inset-0" exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.6 }}>
            <EnvelopeScreen w={W} guestName={guestName} onOpen={openEnvelope} ar={ar} setLang={setLang} />
          </motion.div>
        )}

        {phase === "video" && (
          <motion.div key="vid" className="fixed inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}>
            <VideoPlayer videoUrl={W.video} photos={photos} w={W} onEnded={onVideoEnded} ar={ar} />
          </motion.div>
        )}

        {phase === "rsvp" && (
          <motion.div key="rsvp" className="fixed inset-0 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}>
            <RSVPScreen w={W} ar={ar} setLang={setLang} onReplay={onReplay} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
