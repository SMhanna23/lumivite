import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

const GOLD = "#c4a35a"

const ENVELOPE_VIDEO = {
  black:  "/BlackEnvelope.mp4",
  white:  "/WhiteEnvelope.mp4",
  creamy: "/CreamyEnvelope.mp4",
}
const ENVELOPE_BG = {
  black: "#0c0b09", white: "#f0ede8", creamy: "#e8d4a0",
}
const ENVELOPE_TEXT_DEAR = {
  black: "rgba(255,255,255,0.65)", white: "rgba(40,30,20,0.75)", creamy: "rgba(60,40,10,0.80)",
}
const ENVELOPE_TEXT_TAP = {
  black: "rgba(255,255,255,0.4)", white: "rgba(40,30,20,0.4)", creamy: "rgba(60,40,10,0.4)",
}

export default function EnvelopeScreen({ guestName, onOpen, onVideoEnd, ar, setLang, envelopeColor = "black" }) {
  const videoRef = useRef(null)
  const [started, setStarted] = useState(false)
  const tapped = useRef(false) // guard: only call onVideoEnd after a real tap

  const videoSrc  = ENVELOPE_VIDEO[envelopeColor]  || ENVELOPE_VIDEO.black
  const bgColor   = ENVELOPE_BG[envelopeColor]     || ENVELOPE_BG.black
  const dearColor = ENVELOPE_TEXT_DEAR[envelopeColor] || ENVELOPE_TEXT_DEAR.black
  const tapColor  = ENVELOPE_TEXT_TAP[envelopeColor]  || ENVELOPE_TEXT_TAP.black

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    // Preload first frame without triggering onVideoEnd
    v.play().then(() => { v.pause(); v.currentTime = 0 }).catch(() => {})
  }, [])

  const tap = () => {
    if (started) return
    tapped.current = true
    setStarted(true)
    onOpen()
    videoRef.current?.play().catch(() => {})
  }

  const handleEnded = () => {
    if (tapped.current) onVideoEnd()
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer select-none overflow-hidden"
      style={{ background: bgColor }}
      dir={ar ? "rtl" : "ltr"}
      onClick={tap}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
        onEnded={handleEnded}
      />

      {guestName && (
        <motion.div
          className="absolute left-0 right-0 flex flex-col items-center text-center px-6 pointer-events-none"
          style={{ bottom: "22%", zIndex: 10 }}
          animate={{ opacity: started ? 0 : 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: started ? 0.3 : 1.3, delay: started ? 0 : 0.8 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.1rem,4vw,1.6rem)", color: dearColor, fontStyle: "italic" }}>
            {ar ? "عزيزنا" : "Dear"} <span style={{ color: GOLD }}>{guestName}</span>
          </p>
        </motion.div>
      )}

      <motion.div
        className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 10 }}
        animate={started ? { opacity: 0 } : { opacity: [0.3, 1, 0.3] }}
        transition={started ? { duration: 0.25 } : { repeat: Infinity, duration: 2.5 }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", letterSpacing: "0.38em", color: tapColor, textTransform: "uppercase" }}>
          {ar ? "انقر لفتح" : "Tap to Open"}
        </p>
        <div className="w-px h-7 mt-2" style={{ background: `linear-gradient(to bottom, ${GOLD}70, transparent)` }} />
      </motion.div>

      <button onClick={e => { e.stopPropagation(); setLang(ar ? "en" : "ar") }}
        className="absolute top-5 right-5 z-30 h-9 px-4 rounded-full text-xs transition"
        style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD, fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em" }}>
        {ar ? "EN" : "عربي"}
      </button>
    </motion.div>
  )
}
