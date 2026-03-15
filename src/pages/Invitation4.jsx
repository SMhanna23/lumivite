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
  dressCode: "Black Tie",
  transport: "Shuttle service available from Jounieh at 6:00 PM",
  accommodation: "Kempinski Summerland Hotel — special rates for guests",
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

// ── ENVELOPE ─────────────────────────────────────────────────────────────────
function EnvelopeScreen({ w = {}, guestName, onOpen, ar, setLang, opening }) {
  const [tapped, setTapped] = useState(false)
  const tap = () => { if (tapped) return; setTapped(true); onOpen() }
  const isOpen = opening || tapped

  const groomInit = (w.groom || "G")[0]?.toUpperCase() || "G"
  const brideInit = (w.bride || "B")[0]?.toUpperCase() || "B"

  const CX = 50, CY = 45

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer select-none overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
      onClick={tap}
      style={{ background: "linear-gradient(160deg, #ede8e0 0%, #e4dfd7 100%)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.0 }}>

      {/* SVG defs — paper texture + shadow filters */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* Paper grain texture */}
          <filter id="paper" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="2" stitchTiles="stitch" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
            <feComposite in="blend" in2="SourceGraphic" operator="in"/>
          </filter>
          {/* Soft shadow blur */}
          <filter id="fold-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2"/>
          </filter>
          <filter id="crease-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4"/>
          </filter>
          {/* Seal drop shadow */}
          <filter id="seal-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(100,65,10,0.55)"/>
          </filter>
        </defs>
      </svg>

      {/* Envelope body base — paper texture applied */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(170deg, #faf7f2 0%, #f4efe7 50%, #ede8df 100%)",
        filter: "url(#paper)",
        zIndex: 0
      }} />

      {/* Bottom flap */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `polygon(0% 100%, 100% 100%, ${CX}% ${CY}%)`,
          background: "linear-gradient(340deg, #eae5dc 0%, #f0ebe3 60%, #e6e1d8 100%)",
          filter: "url(#paper)",
          zIndex: 1
        }}
        animate={{ y: isOpen ? "100%" : "0%", opacity: isOpen ? 0 : 1 }}
        transition={{ delay: isOpen ? 0.4 : 0, duration: 1.1, ease: [0.4, 0, 0.2, 1] }} />

      {/* Bottom flap inner shadow — depth along its top edge */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.4, delay: isOpen ? 0.4 : 0 }}>
        <polygon points={`0,100 100,100 ${CX+4},${CY+6} ${CX-4},${CY+6}`}
          fill="rgba(80,55,20,0.12)" filter="url(#fold-shadow)" />
      </motion.svg>

      {/* Left flap */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${CX}% ${CY}%)`,
          background: "linear-gradient(125deg, #f6f2ea 0%, #eee9e0 55%, #e8e3da 100%)",
          filter: "url(#paper)",
          zIndex: 2
        }}
        animate={{ x: isOpen ? "-100%" : "0%" }}
        transition={{ delay: isOpen ? 0.05 : 0, duration: 1.4, ease: [0.4, 0, 0.2, 1] }} />

      {/* Right flap */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `polygon(100% 0%, 100% 100%, ${CX}% ${CY}%)`,
          background: "linear-gradient(235deg, #f6f2ea 0%, #eee9e0 55%, #e8e3da 100%)",
          filter: "url(#paper)",
          zIndex: 2
        }}
        animate={{ x: isOpen ? "100%" : "0%" }}
        transition={{ delay: isOpen ? 0.05 : 0, duration: 1.4, ease: [0.4, 0, 0.2, 1] }} />

      {/* Left/right flap inner shadows — pressed paper depth */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.4, delay: isOpen ? 0.05 : 0 }}>
        <polygon points={`0,0 0,100 ${CX-4},${CY+4}`}
          fill="rgba(60,40,15,0.1)" filter="url(#fold-shadow)" />
        <polygon points={`100,0 100,100 ${CX+4},${CY+4}`}
          fill="rgba(60,40,15,0.1)" filter="url(#fold-shadow)" />
      </motion.svg>

      {/* Top flap cast shadow onto left/right */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.4, delay: isOpen ? 0.05 : 0 }}>
        <polygon points={`0,0 ${CX},${CY} ${CX-1},${CY+8} 0,8`}
          fill="rgba(70,50,20,0.18)" filter="url(#fold-shadow)" />
        <polygon points={`100,0 ${CX},${CY} ${CX+1},${CY+8} 100,8`}
          fill="rgba(70,50,20,0.18)" filter="url(#fold-shadow)" />
      </motion.svg>

      {/* Top flap — slightly darker, folded paper look */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `polygon(0% 0%, 100% 0%, ${CX}% ${CY}%)`,
          background: "linear-gradient(180deg, #d6d1c8 0%, #ddd8cf 30%, #e5e0d8 65%, #eae5dd 100%)",
          filter: "url(#paper)",
          zIndex: 4
        }}
        animate={{ y: isOpen ? "-100%" : "0%", opacity: isOpen ? 0 : 1 }}
        transition={{ delay: isOpen ? 0.6 : 0, duration: 1.1, ease: [0.4, 0, 0.2, 1] }} />

      {/* Top flap bottom-edge highlight (paper bevel) */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.4, delay: isOpen ? 0.6 : 0 }}>
        <polygon points={`0,0 ${CX},${CY} ${CX-1},${CY-1} 0,-1`}
          fill="rgba(255,255,255,0.35)" filter="url(#fold-shadow)" />
        <polygon points={`100,0 ${CX},${CY} ${CX+1},${CY-1} 100,-1`}
          fill="rgba(255,255,255,0.35)" filter="url(#fold-shadow)" />
      </motion.svg>

      {/* Fold crease lines — shadow + highlight pair */}
      <motion.svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.5, delay: isOpen ? 0.05 : 0 }}>
        {/* Shadow lines */}
        <line x1="0"   y1="0"   x2={CX} y2={CY} stroke="rgba(90,60,20,0.55)"    strokeWidth="1.6" filter="url(#crease-blur)" />
        <line x1="100" y1="0"   x2={CX} y2={CY} stroke="rgba(90,60,20,0.55)"    strokeWidth="1.6" filter="url(#crease-blur)" />
        <line x1="0"   y1="100" x2={CX} y2={CY} stroke="rgba(90,60,20,0.35)"    strokeWidth="1.2" filter="url(#crease-blur)" />
        <line x1="100" y1="100" x2={CX} y2={CY} stroke="rgba(90,60,20,0.35)"    strokeWidth="1.2" filter="url(#crease-blur)" />
        {/* Highlight lines (paper edge light reflection) */}
        <line x1="0"   y1="0"   x2={CX} y2={CY} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
        <line x1="100" y1="0"   x2={CX} y2={CY} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
        <line x1="0"   y1="100" x2={CX} y2={CY} stroke="rgba(255,255,255,0.6)"  strokeWidth="0.5" />
        <line x1="100" y1="100" x2={CX} y2={CY} stroke="rgba(255,255,255,0.6)"  strokeWidth="0.5" />
      </motion.svg>

      {/* Gold wax seal */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 10, marginTop: `${CY - 50}%` }}
        animate={{ scale: isOpen ? 0.5 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.5, delay: isOpen ? 0.05 : 0 }}>

        {/* Ambient glow ring */}
        <div style={{
          position: "absolute",
          width: 145, height: 145,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(210,165,50,0.28) 0%, transparent 65%)",
        }} />

        {/* Seal outer shadow disc */}
        <div style={{
          position: "absolute",
          width: 110, height: 110,
          borderRadius: "50%",
          background: "rgba(100,65,10,0.35)",
          filter: "blur(8px)",
          transform: "translateY(5px)"
        }} />

        {/* Octagon seal body */}
        <div style={{
          width: 102, height: 102,
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          background: "radial-gradient(circle at 34% 28%, #f7dc6a 0%, #e8ba30 28%, #c49420 52%, #9a7015 72%, #6e4c10 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          filter: "url(#seal-shadow)"
        }}>
          {/* Top-left specular highlight */}
          <div style={{
            position: "absolute",
            inset: 0,
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 52%)",
          }} />
          {/* Inner embossed ring */}
          <div style={{
            position: "absolute",
            width: 86, height: 86,
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.28), inset 0 2px 5px rgba(0,0,0,0.25)",
          }} />
          {/* Initials */}
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "0.1em",
            textShadow: "0 1px 5px rgba(0,0,0,0.5)",
            position: "relative", zIndex: 1
          }}>
            {groomInit}|{brideInit}
          </span>
        </div>
      </motion.div>

      {/* Guest name */}
      {guestName && (
        <motion.div
          className="absolute left-0 right-0 flex flex-col items-center text-center px-6 pointer-events-none"
          style={{ top: "62%", zIndex: 10 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -6 : 0 }}
          transition={{ duration: isOpen ? 0.3 : 1.3, delay: isOpen ? 0 : 0.7 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.1rem,4vw,1.6rem)", color: "rgba(90,65,30,0.72)", fontStyle: "italic" }}>
            {ar ? "عزيزنا" : "Dear"} <span style={{ color: "#a07820", fontWeight: 600 }}>{guestName}</span>
          </p>
        </motion.div>
      )}

      {/* Tap to open hint */}
      <motion.div
        className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 10 }}
        animate={isOpen ? { opacity: 0 } : { opacity: [0.4, 1, 0.4] }}
        transition={isOpen ? { duration: 0.25 } : { repeat: Infinity, duration: 2.5 }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.56rem", letterSpacing: "0.48em", color: "rgba(100,75,35,0.6)", textTransform: "uppercase" }}>
          {ar ? "انقر لفتح" : "Tap to Open"}
        </p>
        <div className="w-px h-7 mt-2" style={{ background: "linear-gradient(to bottom, rgba(160,120,40,0.55), transparent)" }} />
      </motion.div>

      {/* Language toggle */}
      <button onClick={e => { e.stopPropagation(); setLang(ar ? "en" : "ar") }}
        className="absolute top-5 right-5 z-30 h-9 px-4 rounded-full text-xs transition"
        style={{ background: "rgba(160,120,40,0.1)", border: "1px solid rgba(160,120,40,0.35)", color: "#8a6820", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em" }}>
        {ar ? "EN" : "عربي"}
      </button>
    </motion.div>
  )
}

// ── SHARED CONTENT SECTION OVERLAY (used by VideoPlayer + PhotoFilm) ─────────
const SLIDE_DURATION = 5500
const CONTENT_SECTIONS = ["opening", "timeline", "details", "closing"]

function renderSectionOverlay(section, w, ar) {
  const J  = { fontFamily: "'Jost', sans-serif" }
  const CG = { fontFamily: "'Cormorant Garamond', serif" }
  const GV = { fontFamily: "'Great Vibes', cursive" }
  const defaultTimeline = [
    { time: "5:00 PM",  label: "Ceremony",      labelAr: "مراسم الزواج",   location: "Saint Georges Church" },
    { time: "7:00 PM",  label: "Cocktail Hour",  labelAr: "ساعة الكوكتيل", location: "Garden Terrace" },
    { time: "8:30 PM",  label: "Photos",         labelAr: "جلسة التصوير",   location: "" },
    { time: "9:00 PM",  label: "Dinner",         labelAr: "العشاء",         location: "Bois de Roses" },
    { time: "11:00 PM", label: "Party",          labelAr: "الحفلة",         location: "" },
  ]
  const tl = w.timeline || defaultTimeline

  // Text shadow for text directly on video
  const ts = "0 2px 20px rgba(0,0,0,0.75), 0 1px 6px rgba(0,0,0,0.95)"

  // ── OPENING (Page 3): names on ONE LINE, special date layout ───────────────
  if (section === "opening") {
    const d        = new Date(w.date)
    const month    = d.toLocaleString("en-US", { month: "long" }).toUpperCase()
    const dayName  = d.toLocaleString("en-US", { weekday: "long" }).toUpperCase()
    const day      = d.getDate()
    const year     = d.getFullYear()
    const time     = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const monthAr  = d.toLocaleString("ar-EG", { month: "long" })
    const dayNameAr= d.toLocaleString("ar-EG", { weekday: "long" })
    const timeAr   = d.toLocaleString("ar-EG", { hour: "numeric", minute: "2-digit" })

    return (
      <motion.div className="absolute inset-0 flex flex-col items-center justify-end text-center pointer-events-none"
        style={{ paddingBottom: "clamp(44px,10vh,84px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1.3 }}>

        {/* Together with their families */}
        <p style={{ ...J, fontSize: "0.62rem", letterSpacing: "0.55em", color: "rgba(255,255,255,0.65)",
          marginBottom: 10, textTransform: "uppercase", textShadow: ts }}>
          {ar ? "يسعدنا دعوتكم" : "Together with their families"}
        </p>

        {/* Parents names */}
        {((ar ? w.parentsAr : w.parents) || []).filter(Boolean).length > 0 && (
          <p style={{ ...J, fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.52)",
            marginBottom: 12, textShadow: ts }}>
            {(ar ? w.parentsAr : w.parents).filter(Boolean).join("  ·  ")}
          </p>
        )}

        {/* Names on ONE LINE: GROOM "and" BRIDE */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "clamp(6px,2vw,12px)",
          flexWrap: "nowrap", justifyContent: "center", maxWidth: "92vw" }}>
          <p style={{ ...CG, fontSize: "clamp(1.5rem,5.8vw,3rem)", color: "white", lineHeight: 1.0,
            fontWeight: 300, letterSpacing: "0.14em", textTransform: "uppercase", textShadow: ts }}>
            {ar ? w.groomAr : w.groom}
          </p>
          <p style={{ ...GV, fontSize: "clamp(1rem,3.2vw,1.7rem)", color: GOLD, textShadow: ts }}>
            {ar ? "و" : "and"}
          </p>
          <p style={{ ...CG, fontSize: "clamp(1.5rem,5.8vw,3rem)", color: "white", lineHeight: 1.0,
            fontWeight: 300, letterSpacing: "0.14em", textTransform: "uppercase", textShadow: ts }}>
            {ar ? w.brideAr : w.bride}
          </p>
        </div>

        {/* Invite message */}
        <p style={{ ...J, fontSize: "0.58rem", letterSpacing: "0.44em", color: "rgba(255,255,255,0.55)",
          marginTop: 14, marginBottom: 20, textTransform: "uppercase", textShadow: ts }}>
          {ar ? (w.messageAr || "يدعوانكم لحضور زفافهما") : (w.message || "Invite you · to their wedding celebration")}
        </p>

        {/* Date block: MONTH / line / WEEKDAY | DAY | AT TIME / line / YEAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ ...J, fontSize: "0.58rem", letterSpacing: "0.38em", color: "rgba(255,255,255,0.62)",
            textTransform: "uppercase", textShadow: ts, marginBottom: 8 }}>
            {ar ? monthAr : month}
          </p>
          <div style={{ width: "min(200px,56vw)", height: 1, background: "rgba(255,255,255,0.28)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px,3vw,18px)",
            padding: "8px clamp(8px,3vw,16px)" }}>
            <p style={{ ...J, fontSize: "0.52rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.58)",
              textTransform: "uppercase", textShadow: ts }}>
              {ar ? dayNameAr : dayName}
            </p>
            <p style={{ ...CG, fontSize: "clamp(2rem,7.5vw,3.8rem)", color: "white", fontWeight: 300,
              lineHeight: 1, textShadow: ts }}>
              {day}
            </p>
            <p style={{ ...J, fontSize: "0.52rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.58)",
              textTransform: "uppercase", textShadow: ts }}>
              {ar ? `الساعة ${timeAr}` : `AT ${time}`}
            </p>
          </div>
          <div style={{ width: "min(200px,56vw)", height: 1, background: "rgba(255,255,255,0.28)" }} />
          <p style={{ ...J, fontSize: "0.58rem", letterSpacing: "0.38em", color: "rgba(255,255,255,0.62)",
            textTransform: "uppercase", textShadow: ts, marginTop: 8 }}>
            {year}
          </p>
        </div>
      </motion.div>
    )
  }

  // ── TIMELINE (Page 4): "The PROGRAM" — SVG icons, light wash ───────────────
  if (section === "timeline") {
    const svgIcons = [
      // Ceremony — rings
      <svg key="rings" viewBox="0 0 48 24" width="38" height="18" fill="none">
        <circle cx="16" cy="12" r="9" stroke={GOLD} strokeWidth="1.5"/>
        <circle cx="32" cy="12" r="9" stroke={GOLD} strokeWidth="1.5"/>
        <path d="M24 5 L27 1 L24 3 L21 1 Z" fill={GOLD} opacity="0.85"/>
      </svg>,
      // Cocktail Hour — martini
      <svg key="cocktail" viewBox="0 0 30 38" width="22" height="30" fill="none">
        <path d="M2 4 L28 4 L16 22 Z" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="16" y1="22" x2="16" y2="34" stroke={GOLD} strokeWidth="1.5"/>
        <line x1="9" y1="34" x2="23" y2="34" stroke={GOLD} strokeWidth="1.5"/>
        <circle cx="22" cy="8" r="2" stroke={GOLD} strokeWidth="1"/>
      </svg>,
      // Photos — camera
      <svg key="camera" viewBox="0 0 36 28" width="28" height="22" fill="none">
        <rect x="2" y="8" width="32" height="18" rx="3" stroke={GOLD} strokeWidth="1.5"/>
        <circle cx="18" cy="17" r="5.5" stroke={GOLD} strokeWidth="1.5"/>
        <path d="M11 8 L13 4 L23 4 L25 8" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>,
      // Dinner — fork & knife
      <svg key="dinner" viewBox="0 0 28 36" width="22" height="28" fill="none">
        <line x1="7" y1="2" x2="7" y2="34" stroke={GOLD} strokeWidth="1.5"/>
        <path d="M4 2 L4 13 Q7 18 10 13 L10 2" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="21" y1="2" x2="21" y2="12" stroke={GOLD} strokeWidth="1.5"/>
        <path d="M18 12 Q21 20 24 12" stroke={GOLD} strokeWidth="1.5" fill="none"/>
        <line x1="21" y1="20" x2="21" y2="34" stroke={GOLD} strokeWidth="1.5"/>
      </svg>,
      // Party — speaker
      <svg key="party" viewBox="0 0 36 36" width="28" height="28" fill="none">
        <rect x="2" y="11" width="12" height="14" rx="2" stroke={GOLD} strokeWidth="1.5"/>
        <path d="M14 11 L26 4 L26 32 L14 25" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M30 13 Q36 18 30 23" stroke={GOLD} strokeWidth="1.5" fill="none"/>
      </svg>,
    ]

    return (
      <motion.div className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1.0 }}>
        {/* Very light wash — video still visible */}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ ...GV, fontSize: "clamp(1.8rem,5.5vw,2.4rem)", color: GOLD, lineHeight: 0.85 }}>
              {ar ? "" : "The"}
            </p>
            <p style={{ ...CG, fontSize: "clamp(1.15rem,3.8vw,1.55rem)", fontWeight: 400, color: "white",
              letterSpacing: "0.38em", textTransform: "uppercase", lineHeight: 1.1, marginTop: 2 }}>
              {ar ? "البرنامج" : "Program"}
            </p>
          </div>

          {/* Center-line alternating layout */}
          <div style={{ width: "100%", maxWidth: 340, position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
              background: `${GOLD}50`, transform: "translateX(-50%)" }} />

            {tl.slice(0, 5).map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.08 }}
                style={{ display: "flex", alignItems: "center", padding: "7px 0", position: "relative" }}>
                {i % 2 === 0 ? (
                  <>
                    {/* Text LEFT, icon RIGHT */}
                    <div style={{ flex: 1, textAlign: "right", paddingRight: 16 }}>
                      <p style={{ ...J, fontSize: "0.55rem", letterSpacing: "0.28em", color: GOLD,
                        textTransform: "uppercase" }}>{item.time}</p>
                      <p style={{ ...CG, fontSize: "clamp(0.95rem,3.2vw,1.15rem)", color: "white",
                        fontWeight: 400, lineHeight: 1.15, marginTop: 1 }}>
                        {ar ? (item.labelAr || item.label) : item.label}
                      </p>
                      {item.location && <p style={{ ...J, fontSize: "0.46rem", letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{item.location}</p>}
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD,
                      flexShrink: 0, position: "relative", zIndex: 1 }} />
                    <div style={{ flex: 1, paddingLeft: 14, display: "flex", justifyContent: "flex-start",
                      alignItems: "center" }}>
                      {svgIcons[i]}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Icon LEFT, text RIGHT */}
                    <div style={{ flex: 1, paddingRight: 14, display: "flex", justifyContent: "flex-end",
                      alignItems: "center" }}>
                      {svgIcons[i]}
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD,
                      flexShrink: 0, position: "relative", zIndex: 1 }} />
                    <div style={{ flex: 1, textAlign: "left", paddingLeft: 16 }}>
                      <p style={{ ...J, fontSize: "0.55rem", letterSpacing: "0.28em", color: GOLD,
                        textTransform: "uppercase" }}>{item.time}</p>
                      <p style={{ ...CG, fontSize: "clamp(0.95rem,3.2vw,1.15rem)", color: "white",
                        fontWeight: 400, lineHeight: 1.15, marginTop: 1 }}>
                        {ar ? (item.labelAr || item.label) : item.label}
                      </p>
                      {item.location && <p style={{ ...J, fontSize: "0.46rem", letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{item.location}</p>}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // ── DETAILS (Page 5): "The DETAILS" — right-side vertical line + dots ───────
  if (section === "details") {
    const detailSections = [
      { label: ar ? "اللباس" : "Dress Code",       value: w.dressCode     || (ar ? "أنيق رسمي" : "Black Tie") },
      { label: ar ? "المواصلات" : "Transportation", value: w.transport     || (ar ? "تواصل معنا" : "Details to be announced") },
      { label: ar ? "الإقامة" : "Accommodation",   value: w.accommodation || (ar ? "تواصل معنا" : "Details to be announced") },
    ]

    return (
      <motion.div className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1.0 }}>
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.30)" }} />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div style={{ display: "flex", width: "100%", maxWidth: 360, alignItems: "stretch" }}>
            {/* Main content */}
            <div style={{ flex: 1, paddingRight: 24 }}>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...GV, fontSize: "clamp(1.8rem,5.5vw,2.4rem)", color: GOLD, lineHeight: 0.85 }}>
                  {ar ? "" : "The"}
                </p>
                <p style={{ ...CG, fontSize: "clamp(1.15rem,3.8vw,1.55rem)", fontWeight: 400, color: "white",
                  letterSpacing: "0.38em", textTransform: "uppercase", lineHeight: 1.1, marginTop: 2 }}>
                  {ar ? "التفاصيل" : "Details"}
                </p>
              </div>
              {/* 3 sections */}
              {detailSections.map((sec, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  style={{ marginBottom: 18 }}>
                  <p style={{ ...J, fontSize: "0.52rem", letterSpacing: "0.4em", color: GOLD,
                    textTransform: "uppercase", marginBottom: 4 }}>{sec.label}</p>
                  <p style={{ ...CG, fontSize: "clamp(1rem,3.3vw,1.2rem)", color: "white",
                    fontWeight: 300, lineHeight: 1.45 }}>{sec.value}</p>
                </motion.div>
              ))}
            </div>
            {/* Right vertical line with dots */}
            <div style={{ width: 20, flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1,
                background: `${GOLD}50`, transform: "translateX(-50%)" }} />
              {[22, 50, 78].map((pct, i) => (
                <div key={i} style={{ position: "absolute", top: `${pct}%`, left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 7, height: 7, borderRadius: "50%", background: `${GOLD}55`,
                  border: `1.5px solid ${GOLD}`, zIndex: 1 }} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── CLOSING (Page 6): large date directly on video, no dividers, lower ───────
  const d    = new Date(w.date)
  const mm   = String(d.getMonth() + 1).padStart(2, "0")
  const dd   = String(d.getDate()).padStart(2, "0")
  const yyyy = d.getFullYear()
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-end text-center pointer-events-none"
      style={{ paddingBottom: "clamp(60px,14vh,120px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1.3 }}>
      <p style={{ ...CG, fontSize: "clamp(4rem,16vw,7rem)", color: "white", fontWeight: 300,
        lineHeight: 0.9, textShadow: ts, letterSpacing: "0.04em" }}>
        {ar ? `${dd}.${mm}` : `${mm}.${dd}`}
      </p>
      <p style={{ ...CG, fontSize: "clamp(2.4rem,9.5vw,4.2rem)", color: "white", fontWeight: 300,
        lineHeight: 1, textShadow: ts, marginTop: 10 }}>
        {yyyy}
      </p>
      <p style={{ ...GV, fontSize: "clamp(1.8rem,6vw,2.8rem)", color: "white", textShadow: ts, marginTop: 12 }}>
        {ar ? `${w.groomAr} & ${w.brideAr}` : `${w.groom} & ${w.bride}`}
      </p>

      {/* Quote */}
      {(ar ? w.quoteAr : w.quote) && (
        <p style={{ ...GV, fontSize: "clamp(1rem,3.2vw,1.3rem)", color: GOLD,
          textShadow: ts, marginTop: 18, fontStyle: "italic",
          maxWidth: "72vw", lineHeight: 1.5 }}>
          "{ar ? (w.quoteAr || w.quote) : (w.quote || w.quoteAr)}"
        </p>
      )}
      {w.quoteRef && (
        <p style={{ ...J, fontSize: "0.52rem", letterSpacing: "0.32em", color: "rgba(255,255,255,0.42)",
          textShadow: ts, marginTop: 5 }}>
          — {w.quoteRef}
        </p>
      )}
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

      {/* Content section overlay — cycles */}
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
      <audio ref={audioRef} loop src={W.music || "/music.mp3"} preload="auto"
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
