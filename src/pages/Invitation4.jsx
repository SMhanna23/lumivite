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

// ── FULL-SCREEN WHITE ENVELOPE ───────────────────────────────────────────────
function EnvelopeScreen({ w, guestName, onOpen, ar, setLang, opening }) {
  const [tapped, setTapped] = useState(false)
  const tap = () => { if (tapped) return; setTapped(true); onOpen() }

  // When `opening` becomes true the envelope animates open and reveals the video behind it
  const isOpen = opening || tapped

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer select-none overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
      onClick={tap}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>

      {/* Cream background — fades away revealing the video behind */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: "#faf5ee" }}
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ delay: 0.5, duration: 1.1 }} />

      {/* Subtle grid paper texture */}
      <motion.div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#8c6b3a 0,#8c6b3a 1px,transparent 0,transparent 28px),repeating-linear-gradient(90deg,#8c6b3a 0,#8c6b3a 1px,transparent 0,transparent 28px)" }}
        animate={{ opacity: isOpen ? 0 : 0.035 }} transition={{ duration: 0.4 }} />

      {/* Bottom flap — becomes dark silhouette frame then fades */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}
        animate={{ background: isOpen ? "#1a1008" : "#f2e8d5", opacity: isOpen ? [1, 1, 0] : 1 }}
        transition={{ duration: isOpen ? 1.8 : 0, delay: isOpen ? 0.3 : 0, times: isOpen ? [0, 0.6, 1] : undefined }}
        initial={{ clipPath: "polygon(0% 100%, 100% 100%, 50% 50%)", background: "#f2e8d5" }}
      />
      {/* Left flap */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}
        animate={{ background: isOpen ? "#14100a" : "#ede5d5", opacity: isOpen ? [1, 1, 0] : 1 }}
        transition={{ duration: isOpen ? 1.8 : 0, delay: isOpen ? 0.3 : 0, times: isOpen ? [0, 0.6, 1] : undefined }}
        initial={{ clipPath: "polygon(0% 0%, 0% 100%, 50% 50%)", background: "#ede5d5" }}
      />
      {/* Right flap */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}
        animate={{ background: isOpen ? "#14100a" : "#ede5d5", opacity: isOpen ? [1, 1, 0] : 1 }}
        transition={{ duration: isOpen ? 1.8 : 0, delay: isOpen ? 0.3 : 0, times: isOpen ? [0, 0.6, 1] : undefined }}
        initial={{ clipPath: "polygon(100% 0%, 100% 100%, 50% 50%)", background: "#ede5d5" }}
      />

      {/* Fold lines */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.5, delay: isOpen ? 1.0 : 0 }}>
        <line x1="0"   y1="0"   x2="50" y2="50" stroke="#c4a35a" strokeOpacity="0.35" strokeWidth="0.2" />
        <line x1="100" y1="0"   x2="50" y2="50" stroke="#c4a35a" strokeOpacity="0.35" strokeWidth="0.2" />
        <line x1="0"   y1="100" x2="50" y2="50" stroke="#c4a35a" strokeOpacity="0.25" strokeWidth="0.2" />
        <line x1="100" y1="100" x2="50" y2="50" stroke="#c4a35a" strokeOpacity="0.25" strokeWidth="0.2" />
      </motion.svg>

      {/* Top flap — 3D fold open on tap */}
      <div className="absolute inset-0 overflow-hidden" style={{ perspective: 900, zIndex: 3 }}>
        <motion.div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 50% 50%)",
            background: "linear-gradient(175deg, #ffffff 0%, #f5ede0 55%, #ede0cc 100%)",
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
          animate={{ rotateX: isOpen ? -172 : 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Gold wax seal */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
        animate={{ scale: isOpen ? 0.7 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.5, delay: isOpen ? 0.1 : 0 }}>
        <div className="rounded-full flex items-center justify-center"
          style={{
            width: 88, height: 88,
            background: "radial-gradient(circle at 38% 35%, #d4ab4a, #b8903a 55%, #7a5818)",
            boxShadow: "0 6px 32px rgba(140,107,58,0.5), inset 0 1px 3px rgba(255,255,255,0.22)"
          }}>
          <svg viewBox="0 0 60 60" width="48" height="48" fill="none">
            <circle cx="22" cy="30" r="11" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" fill="none"/>
            <circle cx="38" cy="30" r="11" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" fill="none"/>
            <path d="M30 18 L33 12 L37 15 L30 12 L23 15 L27 12 Z" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>
      </motion.div>

      {/* Couple names + date */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center text-center px-6 pointer-events-none"
        style={{ top: "60%", zIndex: 10 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -6 : 0 }}
        transition={{ duration: isOpen ? 0.3 : 1.3, delay: isOpen ? 0 : 0.7 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,7vw,3rem)", fontWeight: 300, color: "#2c1f10", lineHeight: 1.1 }}>
          {ar ? w.groomAr : w.groom}
        </h1>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.9rem", color: GOLD, margin: "2px 0" }}>
          {ar ? "و" : "and"}
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,7vw,3rem)", fontWeight: 300, color: "#2c1f10", lineHeight: 1.1 }}>
          {ar ? w.brideAr : w.bride}
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.6rem", letterSpacing: "0.42em", color: GOLD, marginTop: 10, textTransform: "uppercase" }}>
          {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        {guestName && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.85rem", color: "#7a5c3a88", fontStyle: "italic", marginTop: 8 }}>
            {ar ? "عزيزنا" : "Dear"} <span style={{ color: GOLD }}>{guestName}</span>
          </p>
        )}
      </motion.div>

      {/* Tap to open hint */}
      <motion.div
        className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 10 }}
        animate={isOpen ? { opacity: 0 } : { opacity: [0.3, 1, 0.3] }}
        transition={isOpen ? { duration: 0.25 } : { repeat: Infinity, duration: 2.5 }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.56rem", letterSpacing: "0.48em", color: "#2c1f1055", textTransform: "uppercase" }}>
          {ar ? "انقر لفتح" : "Tap to Open"}
        </p>
        <div className="w-px h-7 mt-2" style={{ background: `linear-gradient(to bottom, ${GOLD}70, transparent)` }} />
      </motion.div>

      {/* Language toggle */}
      <button onClick={e => { e.stopPropagation(); setLang(ar ? "en" : "ar") }}
        className="absolute top-5 right-5 z-30 h-9 px-4 rounded-full text-xs transition"
        style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD, fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em" }}>
        {ar ? "EN" : "عربي"}
      </button>
    </motion.div>
  )
}

// ── SHARED CONTENT SECTION OVERLAY (used by VideoPlayer + PhotoFilm) ─────────
const SLIDE_DURATION = 5500
const CONTENT_SECTIONS = ["opening", "quote", "ceremony", "party", "timeline", "closing"]

function renderSectionOverlay(section, w, ar) {
  const J = { fontFamily: "'Jost', sans-serif" }
  const venue0 = w.venues?.[0]
  const venue1 = w.venues?.[1]
  const defaultTimeline = [
    { time: "5:00 PM",  label: ar ? "مراسم الزواج" : "Ceremony",      icon: "💒" },
    { time: "7:00 PM",  label: ar ? "ساعة الكوكتيل" : "Cocktail Hour", icon: "🥂" },
    { time: "8:30 PM",  label: ar ? "العشاء" : "Dinner",               icon: "🍽️" },
    { time: "10:00 PM", label: ar ? "الرقصة الأولى" : "First Dance",   icon: "💃" },
    { time: "11:00 PM", label: ar ? "الحفلة" : "Party",                icon: "🎉" },
  ]
  const tl = w.timeline || defaultTimeline

  const pill = { background: "rgba(10,8,6,0.60)", backdropFilter: "blur(10px)", borderRadius: 4, padding: "28px 38px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(196,163,90,0.22)", boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)" }

  if (section === "opening") return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.0 }}>
      <div style={pill}>
        <p style={{ ...J, fontSize: "0.6rem", letterSpacing: "0.5em", color: GOLD, marginBottom: 22, textTransform: "uppercase" }}>
          {ar ? "أنتم مدعوون" : "You're Invited"}
        </p>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(2.5rem,8vw,4rem)", color: "white", textShadow: "0 2px 16px rgba(0,0,0,0.9)", lineHeight: 1.1 }}>
          {ar ? w.groomAr : w.groom}
        </p>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "1.8rem", color: GOLD, margin: "4px 0" }}>&</p>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(2.5rem,8vw,4rem)", color: "white", textShadow: "0 2px 16px rgba(0,0,0,0.9)", lineHeight: 1.1 }}>
          {ar ? w.brideAr : w.bride}
        </p>
        <p style={{ ...J, fontSize: "0.65rem", letterSpacing: "0.4em", color: GOLD, marginTop: 18, textTransform: "uppercase" }}>
          {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        {w.venue && <p style={{ ...J, fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.65)", marginTop: 6 }}>{ar ? w.venueAr : w.venue}</p>}
      </div>
    </motion.div>
  )

  if (section === "quote") return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1.0 }}>
      <div style={{ ...pill, maxWidth: 360 }}>
        <p style={{ color: GOLD, fontSize: "1.2rem", marginBottom: 18 }}>✦</p>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(1.5rem,5vw,2.2rem)", color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.9)", lineHeight: 1.55, marginBottom: 10 }}>
          "{ar ? w.quoteAr : w.quote}"
        </p>
        {w.quoteRef && <p style={{ ...J, fontSize: "0.62rem", letterSpacing: "0.28em", color: GOLD, marginBottom: 24 }}>— {w.quoteRef}</p>}
        <p style={{ color: GOLD, fontSize: "1.1rem", marginBottom: 22 }}>✦</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {(ar ? w.parentsAr : w.parents)?.map((p, i) => (
            <div key={i} style={{ background: "rgba(196,163,90,0.18)", border: `1px solid ${GOLD}45`, borderRadius: 12, padding: "10px 16px" }}>
              <p style={{ ...J, fontSize: "0.55rem", letterSpacing: "0.25em", color: GOLD, textTransform: "uppercase", marginBottom: 4 }}>{ar ? "السادة" : "Mr. & Mrs."}</p>
              <p style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif" }}>{p}</p>
            </div>
          ))}
        </div>
        {w.message && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.72rem", fontStyle: "italic", marginTop: 14, fontFamily: "'Cormorant Garamond', serif", maxWidth: 290, lineHeight: 1.6 }}>{ar ? w.messageAr : w.message}</p>}
      </div>
    </motion.div>
  )

  if (section === "ceremony" || section === "party") {
    const vn = section === "ceremony" ? (venue0 || venue1) : (venue1 || venue0)
    if (!vn) return renderSectionOverlay("closing", w, ar)
    return (
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.0 }}>
        <div style={{ ...pill, minWidth: 260 }}>
          <p style={{ ...J, fontSize: "0.58rem", letterSpacing: "0.48em", color: GOLD, textTransform: "uppercase", marginBottom: 20 }}>{ar ? vn.labelAr : vn.label}</p>
          <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(1.8rem,6vw,2.8rem)", color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.9)", marginBottom: 8, lineHeight: 1.2 }}>{ar ? vn.placeAr : vn.place}</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.8rem,9vw,4.2rem)", color: GOLD, fontWeight: 300, lineHeight: 1, marginBottom: 14 }}>{vn.time}</p>
          <p style={{ ...J, fontSize: "0.68rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.72)", marginBottom: vn.map ? 18 : 0 }}>{ar ? vn.locationAr : vn.location}</p>
          {vn.map && (
            <a href={vn.map} target="_blank" rel="noopener noreferrer" className="pointer-events-auto"
              style={{ ...J, fontSize: "0.68rem", letterSpacing: "0.18em", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "8px 22px", textDecoration: "none" }}>
              📍 {ar ? "خريطة" : "View Map"}
            </a>
          )}
        </div>
      </motion.div>
    )
  }

  if (section === "timeline") return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1.0 }}>
      <div style={{ ...pill, width: "100%", maxWidth: 320 }}>
        <p style={{ ...J, fontSize: "0.58rem", letterSpacing: "0.48em", color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>{ar ? "اليوم" : "The Day"}</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem,5vw,2.5rem)", fontWeight: 300, color: "white", marginBottom: 18, lineHeight: 1 }}>
          {ar ? "برنامج الاحتفال" : "Wedding Timeline"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {tl.slice(0, 5).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.13 }}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(196,163,90,0.15)", border: `1px solid ${GOLD}35`, borderRadius: 10, padding: "8px 14px", textAlign: "left" }}>
              <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
              <span style={{ ...J, fontSize: "0.6rem", color: GOLD, letterSpacing: "0.08em", width: 52, flexShrink: 0 }}>{item.time}</span>
              <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif" }}>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  // closing / default
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.0 }}>
      <div style={pill}>
        <p style={{ color: GOLD, fontSize: "1.3rem", marginBottom: 22 }}>✦ ✦ ✦</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.1rem,3.5vw,1.5rem)", fontWeight: 300, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, maxWidth: 300, marginBottom: 24 }}>
          {ar ? "يسعدنا أن نشاركك أجمل لحظات حياتنا" : "We can't wait to celebrate with you"}
        </p>
        <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "clamp(2rem,7vw,3rem)", color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.9)", marginBottom: 10 }}>
          {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
        </p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", letterSpacing: "0.38em", color: GOLD, textTransform: "uppercase" }}>
          {new Date(w.date).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </motion.div>
  )
}

// ── VIDEO PLAYER ─────────────────────────────────────────────────────────────
function VideoPlayer({ videoUrl, photos, w, onEnded, ar }) {
  const videoRef = useRef(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [startupCover, setStartupCover] = useState(true)

  const ytId     = getYouTubeId(videoUrl)
  const vimeoId  = getVimeoId(videoUrl)
  const isDirect = isDirectVideo(videoUrl)
  const hasVideo = !!(ytId || vimeoId || isDirect)

  // Detect mobile — YouTube needs mute=1 to autoplay on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  // Mute the video if admin checked muteVideo, OR if mobile + iframe (autoplay requirement)
  const videoMuted = !!(w.muteVideo || (isMobile && (ytId || vimeoId)))

  // Cycle content sections for ALL video types
  useEffect(() => {
    if (!hasVideo) return
    const clipDur = (w.videoEnd != null && w.videoStart != null) ? (w.videoEnd - w.videoStart) : null
    const interval = clipDur ? Math.max(8000, Math.floor((clipDur / CONTENT_SECTIONS.length) * 1000)) : 20000
    const timer = setInterval(() => setSectionIdx(i => Math.min(i + 1, CONTENT_SECTIONS.length - 1)), interval)
    return () => clearInterval(timer)
  }, [hasVideo])

  // Startup cover: hide YouTube/Vimeo branding flash (title top-left, logo bottom-right)
  useEffect(() => {
    if (isDirect) { setStartupCover(false); return }
    const t = setTimeout(() => setStartupCover(false), 3800)
    return () => clearTimeout(t)
  }, [isDirect])

  // Direct video: seek to start, apply mute from admin setting
  useEffect(() => {
    if (!videoRef.current || !isDirect) return
    if (w.videoStart != null) videoRef.current.currentTime = w.videoStart
    videoRef.current.muted = !!(w.muteVideo)
  }, [isDirect])


  if (!hasVideo) return <PhotoFilm photos={photos} w={w} onEnded={onEnded} ar={ar} />

  // Build iframe URL — strip ALL YouTube/Vimeo UI
  const ytParts = [
    "autoplay=1", "rel=0", "controls=0", "modestbranding=1",
    "showinfo=0", "iv_load_policy=3", "disablekb=1", "fs=0", "playsinline=1",
    videoMuted ? "mute=1" : null,
    w.videoStart != null ? `start=${Math.floor(w.videoStart)}` : null,
    w.videoEnd   != null ? `end=${Math.floor(w.videoEnd)}`   : null,
  ].filter(Boolean).join("&")
  const vimeoParts = [
    "autoplay=1", "color=c4a35a", "controls=0", "title=0", "byline=0", "portrait=0", "playsinline=1",
    videoMuted ? "muted=1" : null,
  ].filter(Boolean).join("&")
  const iframeSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?${ytParts}`
    : `https://player.vimeo.com/video/${vimeoId}?${vimeoParts}`

  const section = CONTENT_SECTIONS[sectionIdx]

  return (
    <div className="fixed inset-0 z-10" style={{ background: DARK }}>
      {/* Video */}
      {isDirect ? (
        <video ref={videoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ background: DARK }}
          onLoadedMetadata={e => {
            if (w.videoStart != null) e.target.currentTime = w.videoStart
          }}
          onTimeUpdate={e => {
            if (w.videoEnd != null && e.target.currentTime >= w.videoEnd) onEnded()
          }}
          onEnded={onEnded}>
          <source src={videoUrl} />
        </video>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={iframeSrc}
          allow="autoplay; fullscreen; picture-in-picture"
          title="Wedding Video"
          style={{ border: "none" }}
        />
      )}

      {/* Transparent blocker — prevents clicking YouTube/Vimeo UI */}
      {(ytId || vimeoId) && <div className="absolute inset-0 z-[5]" />}

      {/* Startup cover — hides YouTube title & logo flash for first ~3.8s */}
      <AnimatePresence>
        {startupCover && (
          <motion.div className="absolute inset-0 z-[9] flex items-center justify-center"
            style={{ background: DARK }}
            exit={{ opacity: 0 }} transition={{ duration: 1.0 }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.8 }}>
              <span style={{ color: GOLD, fontSize: "1.6rem" }}>✦</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic vignette + corner watermark cover */}
      <div className="absolute inset-0 pointer-events-none z-[6]"
        style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.82) 0%,transparent 28%,transparent 62%,rgba(0,0,0,0.85) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none z-[6]"
        style={{ background: "radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(0,0,0,0.58) 100%)" }} />
      {/* Top-right corner — covers Instagram/watermark logos */}
      <div className="absolute inset-0 pointer-events-none z-[6]"
        style={{ background: "radial-gradient(ellipse at 100% 0%,rgba(0,0,0,0.90) 0%,transparent 32%)" }} />
      {/* Top-left corner */}
      <div className="absolute inset-0 pointer-events-none z-[6]"
        style={{ background: "radial-gradient(ellipse at 0% 0%,rgba(0,0,0,0.90) 0%,transparent 32%)" }} />

      {/* Content section overlay — cycles every ~20 sec */}
      <AnimatePresence mode="wait">
        <motion.div key={`vsec-${sectionIdx}`} className="absolute inset-0 z-[7] pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }}>
          {renderSectionOverlay(section, w, ar)}
        </motion.div>
      </AnimatePresence>


      {/* Skip to RSVP */}
      <button onClick={onEnded}
        className="absolute top-5 right-5 z-30 text-xs tracking-widest uppercase px-5 py-2.5 rounded-full transition"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontFamily: "'Jost', sans-serif", backdropFilter: "blur(8px)" }}>
        {ar ? "تخطي ←" : "Skip →"}
      </button>
    </div>
  )
}

// ── PHOTO FILM FALLBACK (when no video URL is set) ───────────────────────────
// Cinematic slideshow: one photo per slide, each showing a different invitation section

function PhotoFilm({ photos, w, onEnded, ar }) {
  const [slide, setSlide] = useState(0)
  const [prog,  setProg]  = useState(0)
  const rafRef = useRef(null)
  const totalSlides = photos.length

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const tick  = (now) => {
      const pct = Math.min(((now - start) / SLIDE_DURATION) * 100, 100)
      setProg(pct)
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick) }
      else if (slide < totalSlides - 1) { setSlide(s => s + 1); setProg(0) }
      else { onEnded() }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [slide, totalSlides])

  const photoSrc = photos[slide] || photos[0]

  const getSection = (idx, total) => {
    if (total <= CONTENT_SECTIONS.length) return CONTENT_SECTIONS[Math.min(idx, CONTENT_SECTIONS.length - 1)]
    return CONTENT_SECTIONS[Math.min(Math.floor((idx / total) * CONTENT_SECTIONS.length), CONTENT_SECTIONS.length - 1)]
  }
  const section = getSection(slide, totalSlides)

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
            transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
            style={{ backgroundImage: `url(${photoSrc})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.48)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic vignette */}
      <div className="fixed inset-0 pointer-events-none z-[5]"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 22%, transparent 68%, rgba(0,0,0,0.80) 100%)" }} />
      <div className="fixed inset-0 pointer-events-none z-[5]"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.52) 100%)" }} />

      {/* Content overlay — changes per slide */}
      <AnimatePresence mode="wait">
        <motion.div key={`content-${slide}`} className="absolute inset-0 z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}>
          {renderSectionOverlay(section, w, ar)}
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {photos.map((_, i) => (
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

  const openEnvelope = () => {
    setPhase("opening")
    if (W.muteVideo) startMusic()
    setTimeout(() => setPhase("video"), 2400)
  }
  const onVideoEnded = useCallback(() => setPhase("rsvp"), [])
  const onReplay = useCallback(() => setPhase("video"), [])

  return (
    <>
      {/* Background music (quiet during video phase) */}
      <audio ref={audioRef} loop src="/music.mp3" preload="auto"
        style={{ display: "none" }}
      />

      {/* Video — pre-rendered behind envelope during opening, full-screen after */}
      <AnimatePresence>
        {(phase === "opening" || phase === "video") && (
          <motion.div key="vid" className="fixed inset-0 z-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>
            <VideoPlayer videoUrl={W.video} photos={photos} w={W} onEnded={onVideoEnded} ar={ar} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Envelope — stays on top during opening, fades away as video shows through */}
      <AnimatePresence>
        {(phase === "envelope" || phase === "opening") && (
          <motion.div key="env" className="fixed inset-0 z-10"
            exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <EnvelopeScreen w={W} guestName={guestName} onOpen={openEnvelope} ar={ar} setLang={setLang} opening={phase === "opening"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP */}
      <AnimatePresence>
        {phase === "rsvp" && (
          <motion.div key="rsvp" className="fixed inset-0 z-20 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}>
            <RSVPScreen w={W} ar={ar} setLang={setLang} onReplay={onReplay} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
