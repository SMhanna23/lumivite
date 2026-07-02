import { motion } from "framer-motion"
import { useState } from "react"
import Logo from "../components/Logo"

const features = [
  { icon: "💍", title: "Stunning Templates", desc: "4 luxury designs that make guests say WOW the moment they open their invitation" },
  { icon: "🎬", title: "Cinematic Video", desc: "Envelope opening animation + full pre-wedding video support via YouTube, Vimeo, or direct upload" },
  { icon: "🎵", title: "Background Music", desc: "Set the mood with romantic music that plays automatically when guests open" },
  { icon: "📊", title: "RSVP Dashboard", desc: "Track every response in real time. Know exactly who's coming to your big day" },
  { icon: "👤", title: "Personalized Links", desc: "Each guest gets their own link with their name — a truly personal touch" },
  { icon: "🌍", title: "Bilingual (AR / EN)", desc: "Full Arabic and English support with right-to-left layout for all your guests" },
  { icon: "🌸", title: "Animations", desc: "Floating petals, smooth transitions, and cinematic reveals that impress everyone" },
  { icon: "📍", title: "Venue & Timeline", desc: "Interactive maps, wedding timeline, and all details beautifully presented" },
  { icon: "📸", title: "Memory Wall", desc: "Guests upload photos from the wedding — the couple sees them all in a beautiful private gallery" },
  { icon: "🎁", title: "Gift Registry", desc: "WishMoney, store links, and IBAN — all elegantly presented inside the invitation" },
]

const packages = [
  {
    name: "Bronze",
    price: "$89",
    color: "#cd7f32",
    features: [
      "1 luxury template (dark design)",
      "RSVP tracking dashboard",
      "Bilingual Arabic & English",
      "Countdown timer",
      "Wedding timeline",
      "Cover & venue photos (up to 3)",
      "1 shared link for all guests",
      "Valid for 3 months",
    ]
  },
  {
    name: "Silver",
    price: "$139",
    color: "#c9a96e",
    popular: true,
    features: [
      "Everything in Bronze",
      "Choice of any 1 template design",
      "Personalized guest links",
      "Guest name auto-display",
      "Background music",
      "Full photo gallery (up to 9 photos)",
      "Custom music clip (start & end time)",
      "Valid for 6 months",
    ]
  },
  {
    name: "Gold",
    price: "$199",
    color: "#ffd700",
    features: [
      "Everything in Silver",
      "All 4 template choices",
      "Guest Memory Wall (photo upload)",
      "Google Maps embed",
      "Gift registry section",
      "Priority support",
      "Unlimited revisions",
      "Valid for 12 months",
    ]
  },
]

const faqs = [
  { q: "How long does it take to get my invitation?", a: "Within 24-48 hours after you provide your details and payment." },
  { q: "Can guests RSVP directly from the invitation?", a: "Yes! Guests tap Attending or Decline and you get notified instantly." },
  { q: "Can I share it on WhatsApp?", a: "Absolutely — just share the link. It works on any phone, tablet or computer." },
  { q: "Can guests upload their photos from the wedding?", a: "Yes! With the Memory Wall feature, guests get a private link to upload their photos during or after the wedding. You see all the photos in your dashboard instantly." },
  { q: "Can I add a pre-wedding video to my invitation?", a: "Yes! Template 4 supports direct video upload, YouTube, and Vimeo links. Your guests see an envelope opening animation and then your video plays automatically." },
  { q: "Is Arabic language supported?", a: "Yes! All templates are fully bilingual with Arabic and English, including right-to-left layout for Arabic guests." },
  { q: "Can I choose my own music?", a: "Yes! You can send us any song and we'll add it to your invitation." },
  { q: "What if I need changes after it's done?", a: "Silver and Gold packages include revisions. We're here to make it perfect." },
]

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="min-h-screen bg-[#0a0806] text-white overflow-x-hidden"
      style={{ fontFamily: "'Jost', sans-serif" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(to bottom, rgba(10,8,6,0.95), transparent)" }}>
        <Logo size="sm" href="/" />
        <a href="/order" className="bg-[#c9a96e] text-black font-semibold px-5 py-2 rounded-full hover:bg-[#b8965d] transition text-sm tracking-wider">Book Now</a>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #2d1a0e 0%, #0a0806 65%)" }}>

        {/* Floating petals */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="absolute text-lg"
              initial={{ x: `${Math.random() * 100}vw`, y: -20 }}
              animate={{ y: "105vh", rotate: 360 }}
              transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 8, ease: "linear" }}>
              {["🌸", "🌹", "✿"][Math.floor(Math.random() * 3)]}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}
          className="relative z-10 max-w-4xl">
          <p className="text-[#c9a96e] tracking-[0.4em] text-xs uppercase mb-6">Digital Wedding Invitations</p>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-6">
            Your Love Story<br />
            <span className="text-[#c9a96e] italic">Deserves More</span><br />
            Than Paper
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Stunning animated digital invitations with cinematic video, music, RSVP tracking, and personalized guest links. Starting at $89.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#demos" className="bg-[#c9a96e] text-black font-semibold px-8 py-4 rounded-full hover:bg-[#b8965d] transition text-sm tracking-wider">
              SEE LIVE DEMOS
            </a>
            <a href="https://wa.me/96171444328?text=Hi! I want a digital wedding invitation"
              target="_blank" rel="noopener noreferrer"
              className="border border-white/20 text-white px-8 py-4 rounded-full hover:border-[#c9a96e] hover:text-[#c9a96e] transition text-sm tracking-wider">
              WHATSAPP US
            </a>
            <a href="/order" className="bg-[#c9a96e] text-black font-semibold px-8 py-4 rounded-full hover:bg-[#b8965d] transition text-sm tracking-wider">
              ORDER NOW
            </a>
          </div>
        </motion.div>

        <motion.div className="absolute bottom-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="text-white/30 text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* Demo Preview */}
      <section id="demos" className="py-24 px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-3">Choose Your Style</p>
      <h2 className="font-serif text-4xl font-light mb-4">Four Stunning Templates</h2>
      <p className="text-white/40 mb-12 text-sm">Click any template to see a live demo</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">

      {/* Template 1 - Dark Luxury */}
      <a href="/demo" className="group block">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
          className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #3d2314, #0d0a08)" }}>
          <div className="p-10 text-center">
            <p className="text-[#c9a96e] text-xs tracking-widest uppercase mb-4">You're invited</p>
            <p className="font-serif text-4xl font-light text-white mb-1">Christopher</p>
            <p className="text-[#c9a96e] text-2xl font-serif italic">&</p>
            <p className="font-serif text-4xl font-light text-white mb-6">Joelle</p>
            <div className="flex gap-2 justify-center mb-4">
              {["198","03","00","34"].map((v,i) => (
                <div key={i} className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold text-white">{v}</div>
              ))}
            </div>
            <p className="text-white/30 text-xs tracking-widest">TAP TO OPEN</p>
          </div>
          <div className="bg-black/30 py-3 px-6 flex items-center justify-between">
            <span className="text-[#c9a96e] text-sm font-medium">Dark Luxury</span>
            <span className="text-white/40 text-xs group-hover:text-[#c9a96e] transition">View Demo →</span>
          </div>
        </motion.div>
      </a>

      {/* Template 2 - Botanical */}
      <a href="/demo2" className="group block">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
          className="rounded-3xl overflow-hidden border border-[#4a7c59]/20 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #f5f0e8, #e8f0e9)" }}>
          <div className="p-10 text-center">
            <p className="text-[#4a7c59] text-xs tracking-widest uppercase mb-4 font-medium">You're invited</p>
            <p className="text-4xl font-light text-[#2d3a2e] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Christopher</p>
            <p className="text-[#4a7c59] text-2xl italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>&</p>
            <p className="text-4xl font-light text-[#2d3a2e] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Joelle</p>
            <div className="flex gap-2 justify-center mb-4">
              {["198","03","00","34"].map((v,i) => (
                <div key={i} className="w-12 h-12 bg-[#4a7c59]/10 border border-[#4a7c59]/30 rounded-lg flex items-center justify-center text-sm font-bold text-[#2d5a3d]">{v}</div>
              ))}
            </div>
            <p className="text-[#4a7c59]/40 text-xs tracking-widest">TAP TO OPEN</p>
          </div>
          <div className="bg-[#4a7c59]/10 py-3 px-6 flex items-center justify-between border-t border-[#4a7c59]/10">
            <span className="text-[#4a7c59] text-sm font-medium">Botanical Garden</span>
            <span className="text-[#4a7c59]/40 text-xs group-hover:text-[#4a7c59] transition">View Demo →</span>
          </div>
        </motion.div>
        </a>


      {/* Template 3 - Rose Gold */}
      <a href="/demo3" className="group block">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg, #FDF6F0, #F9E0E0, #F5D5D5)", border: "1px solid rgba(183,110,121,0.2)" }}>
          <div className="p-10 text-center">
            <p className="text-xs tracking-widest uppercase mb-4 font-medium" style={{ color: "#B76E79" }}>You're invited</p>
            <p className="text-4xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5C2D35" }}>Christopher</p>
            <p className="text-2xl italic" style={{ color: "#B76E79", fontFamily: "'Cormorant Garamond', serif" }}>&</p>
            <p className="text-4xl font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5C2D35" }}>Joelle</p>
            <div className="flex gap-2 justify-center mb-4">
              {["198","03","00","34"].map((v,i) => (
                <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-light"
                  style={{ background: "rgba(183,110,121,0.12)", border: "1px solid rgba(183,110,121,0.35)", color: "#8B4D3B" }}>{v}</div>
              ))}
            </div>
            <p className="text-xs tracking-widest opacity-40" style={{ color: "#B76E79" }}>TAP TO OPEN</p>
          </div>
          <div className="py-3 px-6 flex items-center justify-between"
            style={{ background: "rgba(183,110,121,0.08)", borderTop: "1px solid rgba(183,110,121,0.12)" }}>
            <span className="text-sm font-medium" style={{ color: "#B76E79" }}>Rose Gold & Blush</span>
            <span className="text-xs transition group-hover:opacity-100" style={{ color: "rgba(183,110,121,0.5)" }}>View Demo →</span>
          </div>
        </motion.div>
      </a>

      {/* Template 4 - Golden Envelope */}
      <a href="/demo4" className="group block">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #1a1508, #0c0b09)", border: "1px solid rgba(196,163,90,0.25)" }}>
          <div className="p-10 text-center">
            <p className="text-xs tracking-widest uppercase mb-4 font-medium" style={{ color: "#c4a35a" }}>You're invited</p>
            <p className="font-serif text-4xl font-light text-white mb-1">Christopher</p>
            <p className="text-2xl italic mb-1" style={{ color: "#c4a35a", fontFamily: "'Cormorant Garamond', serif" }}>&</p>
            <p className="font-serif text-4xl font-light text-white mb-6">Joelle</p>
            <div className="flex gap-2 justify-center mb-4">
              {["198","03","00","34"].map((v,i) => (
                <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(196,163,90,0.12)", border: "1px solid rgba(196,163,90,0.35)", color: "#c4a35a" }}>{v}</div>
              ))}
            </div>
            <p className="text-xs tracking-widest opacity-40" style={{ color: "#c4a35a" }}>TAP TO OPEN</p>
          </div>
          <div className="py-3 px-6 flex items-center justify-between"
            style={{ background: "rgba(196,163,90,0.06)", borderTop: "1px solid rgba(196,163,90,0.15)" }}>
            <span className="text-sm font-medium" style={{ color: "#c4a35a" }}>Golden Envelope</span>
            <span className="text-xs transition group-hover:opacity-100" style={{ color: "rgba(196,163,90,0.5)" }}>View Demo →</span>
          </div>
        </motion.div>
      </a>

      </div>
      </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-3">Why Lumivite</p>
          <h2 className="font-serif text-4xl font-light text-center mb-16">Everything You Need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-[#c9a96e]/30 transition">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-3">Simple Pricing</p>
          <h2 className="font-serif text-4xl font-light text-center mb-16">Choose Your Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`relative rounded-2xl p-8 border ${pkg.popular ? "border-[#c9a96e]/50 bg-[#c9a96e]/5" : "border-white/10 bg-white/3"}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a96e] text-black text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <p style={{ color: pkg.color }} className="text-sm font-semibold tracking-widest uppercase mb-2">{pkg.name}</p>
                <p className="font-serif text-5xl font-light mb-6" style={{ color: pkg.color }}>{pkg.price}</p>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                      <span style={{ color: pkg.color }} className="mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`https://wa.me/96171444328?text=${encodeURIComponent(`Hi! I want the ${pkg.name} package`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center py-3 rounded-xl font-semibold text-sm transition"
                  style={{ background: pkg.popular ? "#c9a96e" : "transparent", color: pkg.popular ? "black" : "#c9a96e", border: `1px solid ${pkg.color}` }}>
                  Get {pkg.name} Package
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      
        {/* Testimonials */}
        <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-3">Love Stories</p>
          <h2 className="font-serif text-4xl font-light text-center mb-16">What Couples Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
        {
          name: "Maya & Karim",
          location: "Beirut, Lebanon",
          avatar: "💍",
          text: "Our guests couldn't stop talking about the invitation! Everyone was amazed that it had music and their names appeared automatically. Worth every penny.",
          stars: 5,
          package: "Silver Package"
        },
        {
          name: "Sarah & Tony",
          location: "Dubai, UAE",
          avatar: "🌸",
          text: "We got so many compliments. The dark luxury template was exactly our vibe. The RSVP dashboard made planning so much easier — we knew exactly who was coming.",
          stars: 5,
          package: "Gold Package"
        },
        {
          name: "Lara & Michel",
          location: "Paris, France",
          avatar: "✨",
          text: "Lumivite delivered in less than 24 hours. The botanical template was elegant and fresh. Our international guests loved being able to RSVP from anywhere!",
          stars: 5,
          package: "Silver Package"
        },
        {
          name: "Nour & Elie",
          location: "Riyadh, KSA",
          avatar: "🎬",
          text: "The envelope video blew everyone away! Our pre-wedding video played right inside the invitation. It felt like a movie trailer for our wedding. Absolutely stunning.",
          stars: 5,
          package: "Gold Package"
        },
      ].map((t, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          viewport={{ once: true }}
          className="bg-white/3 border border-white/8 rounded-2xl p-8 flex flex-col gap-4 hover:border-[#c9a96e]/20 transition">
          {/* Stars */}
          <div className="flex gap-1">
            {Array.from({ length: t.stars }).map((_, j) => (
              <span key={j} className="text-[#c9a96e] text-sm">★</span>
            ))}
          </div>
          {/* Quote */}
          <p className="text-white/60 text-sm leading-relaxed flex-1">"{t.text}"</p>
          {/* Person */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <div className="w-10 h-10 rounded-full bg-[#c9a96e]/20 flex items-center justify-center text-lg">
              {t.avatar}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{t.name}</p>
              <p className="text-white/30 text-xs">{t.location}</p>
            </div>
            <span className="ml-auto text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1">
              {t.package}
            </span>
          </div>
        </motion.div>
        ))}
      </div>
    </motion.div>
    </section>

      {/* FAQ */}
      <section className="py-24 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase text-center mb-3">FAQ</p>
          <h2 className="font-serif text-4xl font-light text-center mb-12">Questions?</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-white/3 transition">
                  <span className="font-medium text-sm">{faq.q}</span>
                  <span className="text-[#c9a96e] text-lg ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-white/50 text-sm leading-relaxed">{faq.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 50%, #2d1a0e 0%, #0a0806 70%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-[#c9a96e] text-3xl mb-6">✦</div>
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-4">
            Ready to Wow<br />Your Guests?
          </h2>
          <p className="text-white/40 mb-10">Join couples who chose Lumivite for their special day</p>
          <a href="/order"
            target="_blank" rel="noopener noreferrer"
            className="inline-block bg-[#c9a96e] text-black font-semibold px-10 py-4 rounded-full hover:bg-[#b8965d] transition text-sm tracking-wider">
            START YOUR INVITATION →
          </a>
        </motion.div>
      </section>

      <footer className="text-center py-8 text-white/20 text-xs border-t border-white/5">
        © 2026 Lumivite · Digital Wedding Invitations · Lebanon & Worldwide
      </footer>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/96171444328?text=Hi! I want a digital wedding invitation"
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-semibold text-white text-sm transition hover:scale-105 active:scale-95"
        style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.35)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Chat With Us
      </a>
    </div>
  )
}