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
  quote: "You are my today and all of my tomorrows.",
  quoteAr: "أنتَ حاضري وكلّ غدٍ لي.",
  quoteRef: "Leo Christopher",
  venue: "Feytroun, Lebanon",
  venueAr: "فيترون، لبنان",
  message: "Together with their families",
  messageAr: "معاً مع عائلتيهما",
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
      {Array.from({ length: 16 }).map((_, i) => (
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
  { time: "7:00 PM", label: "Cocktail Hour", icon: "🥂", desc: "Celebrate with drinks & canapés" },
  { time: "8:30 PM", label: "Dinner", icon: "🍽️", desc: "A feast prepared with love" },
  { time: "10:00 PM", label: "First Dance", icon: "💃", desc: "Watch us dance for the first time" },
  { time: "11:00 PM", label: "Party", icon: "🎉", desc: "Dance the night away with us" },
]

const roseGold = "#B76E79"
const blush = "#F2D0D0"
const cream = "#FDF6F0"
const dark = "#5C2D35"

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
  const [lang, setLang] = useState("en")
  const ar = lang === "ar"
  const [searchParams] = useSearchParams()
  const audioRef = useRef(null)

  const guestName = searchParams.get("gn") || ""
  const numPersons = parseInt(searchParams.get("np") || "1")

  useEffect(() => {
    if (guestName) setName(guestName)
    if (numPersons) setPersons(numPersons)
  }, [])

  const startMusic = () => {
    if (audioRef.current) { audioRef.current.play().catch(() => {}); setPlaying(true) }
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
      const msg = `${attending ? "✅" : "❌"} New RSVP on Lumivite!\n👤 ${name}\n💒 ${WEDDING.groom} & ${WEDDING.bride}\n${attending ? `✅ Attending (${persons} person${persons > 1 ? "s" : ""})` : "❌ Declined"}${wishes ? `\n💬 "${wishes}"` : ""}`
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`, { mode: "no-cors" }).catch(() => {})
      setStatus("success")
    } catch (e) { setStatus("error") }
  }

  // SPLASH
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 cursor-pointer relative overflow-hidden"
        dir={ar ? "rtl" : "ltr"}
        style={{ background: `linear-gradient(160deg, ${cream} 0%, #F9E8E8 40%, #F5D5D5 100%)` }}
        onClick={() => { setStarted(true); setTimeout(() => startMusic(), 800) }}>
        <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
        <Roses />

        {/* Decorative rings */}
        <div className="absolute top-16 left-16 w-40 h-40 rounded-full border-2 opacity-20" style={{ borderColor: roseGold }} />
        <div className="absolute bottom-16 right-16 w-56 h-56 rounded-full border opacity-10" style={{ borderColor: roseGold }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border opacity-5" style={{ borderColor: roseGold }} />

        <motion.div className="relative z-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
          {/* Diamond ornament */}
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}
            className="text-4xl mb-6">💍</motion.div>
          <p className="tracking-[0.5em] text-xs uppercase mb-8 font-medium" style={{ color: roseGold }}>
            {ar ? "أنتم مدعوون" : "You're Invited"}
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: dark }}
            className="text-7xl md:text-9xl font-light mb-2">
            {ar ? WEDDING.groomAr : WEDDING.groom}
          </h1>
          <div className="flex items-center justify-center gap-4 my-3">
            <div className="h-px w-12" style={{ background: roseGold }} />
            <span className="text-3xl" style={{ color: roseGold, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>&</span>
            <div className="h-px w-12" style={{ background: roseGold }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: dark }}
            className="text-7xl md:text-9xl font-light mb-12">
            {ar ? WEDDING.brideAr : WEDDING.bride}
          </h1>
          {guestName && (
            <motion.p className="text-lg mb-8 font-light" style={{ color: "#8B4D3B" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              {ar ? "عزيزنا" : "Dear"} <span className="font-medium" style={{ color: roseGold }}>{guestName}</span>
            </motion.p>
          )}
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2">
            <p className="text-sm tracking-widest uppercase" style={{ color: `${roseGold}80` }}>
              {ar ? "اضغط للفتح" : "Tap to open"}
            </p>
            <div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${roseGold}, transparent)` }} />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // MAIN
  return (
    <div className="min-h-screen overflow-x-hidden relative"
      dir={ar ? "rtl" : "ltr"}
      style={{ background: cream, color: dark, fontFamily: ar ? "'Noto Naskh Arabic', serif" : "inherit" }}>
      <audio ref={audioRef} loop src="/music.mp3" preload="auto" />
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10"
        style={{ background: `radial-gradient(ellipse at 50% 0%, #F9E0E0 0%, ${cream} 65%)` }}>

        {/* Corner roses */}
        <div className="absolute top-8 left-8 text-3xl opacity-40">🌹</div>
        <div className="absolute top-8 right-8 text-3xl opacity-40">🌹</div>
        <div className="absolute bottom-24 left-8 text-2xl opacity-30">🌷</div>
        <div className="absolute bottom-24 right-8 text-2xl opacity-30">🌷</div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p className="tracking-[0.4em] text-xs uppercase mb-6 font-medium" style={{ color: roseGold }}>
            {ar ? "نحن نتزوج" : "We're getting married"}
          </p>
          {(ar ? WEDDING.parentsAr : WEDDING.parents).map((p, i) => (
            <p key={i} className="text-sm opacity-50">{p}</p>
          ))}
          <p className="text-sm mb-8 italic opacity-40">{ar ? WEDDING.messageAr : WEDDING.message}</p>

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
              {ar ? "٢٠ سبتمبر · ٢٠٢٦" : "September 20 · 2026"}
            </p>
            <div className="h-px w-16" style={{ background: `${roseGold}50` }} />
          </div>

          <p className="text-sm mb-10 opacity-50">{ar ? WEDDING.venueAr : WEDDING.venue}</p>
          <Countdown targetDate={WEDDING.date} />
        </motion.div>

        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-xs tracking-widest opacity-30">SCROLL</span>
          <div className="w-px h-10" style={{ background: `linear-gradient(to bottom, ${roseGold}60, transparent)` }} />
        </motion.div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
            <span className="text-2xl">🌹</span>
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
          </div>
          <p className="text-xl leading-relaxed italic opacity-70"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            "{ar ? WEDDING.quoteAr : WEDDING.quote}"
          </p>
          <p className="text-sm mt-4 tracking-widest" style={{ color: roseGold }}>— {WEDDING.quoteRef}</p>
          <div className="flex items-center gap-4 justify-center mt-8">
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
            <span className="text-2xl">💮</span>
            <div className="h-px w-20" style={{ background: `${roseGold}40` }} />
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
                <div className="h-48 w-full overflow-hidden">
                  <iframe title={v.label} width="100%" height="100%"
                    style={{ border: 0 }} loading="lazy" allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(v.place + " " + v.location)}`}
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-xs tracking-widest uppercase mb-2 font-medium" style={{ color: roseGold }}>
                    {ar ? v.labelAr : v.label}
                  </p>
                  <p className="text-3xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{v.time}</p>
                  <p className="font-medium mb-1">{ar ? v.placeAr : v.place}</p>
                  <p className="text-sm mb-4 opacity-50">{ar ? v.locationAr : v.location}</p>
                  <a href={v.map} target="_blank" rel="noopener noreferrer"
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

      {/* Photo Gallery */}
      <section className="py-24 px-6 max-w-4xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="tracking-[0.3em] text-xs uppercase text-center mb-2 font-medium" style={{ color: roseGold }}>
            {ar ? "قصتنا" : "Our Story"}
          </p>
          <h2 className="text-4xl font-light text-center mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {ar ? "لحظاتنا معاً" : "Moments Together"}
          </h2>
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
                  className="w-full h-full object-cover object-top hover:scale-110 transition duration-700" />
              </motion.div>
            ))}
          </div>
        </motion.div>
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
            {timeline.map((item, i) => (
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
                  <p className="text-sm mt-0.5 opacity-50">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
            {ar ? "يرجى الرد قبل ١ أغسطس" : "Kindly Reply By August 1st"}
          </p>
          <h2 className="text-4xl font-light mb-10" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
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
                  className="w-full rounded-xl px-5 py-4 focus:outline-none transition"
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

      <footer className="text-center py-10 text-sm border-t relative z-10"
        style={{ color: `${roseGold}60`, borderColor: `${roseGold}15` }}>
        {ar ? "صُنع بـ 🌹 بواسطة" : "Made with 🌹 by"} <span style={{ color: roseGold }}>Lumivite</span>
      </footer>
    </div>
  )
}
