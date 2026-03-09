import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

const packages = [
  { id: "bronze", name: "Bronze", price: "$89", color: "#cd7f32", features: ["1 template", "RSVP dashboard", "Countdown timer", "1 shared link"] },
  { id: "silver", name: "Silver", price: "$139", color: "#c9a96e", features: ["Personalized guest links", "Background music", "Photo gallery", "Excel import"], popular: true },
  { id: "gold", name: "Gold", price: "$199", color: "#ffd700", features: ["2 template choices", "Google Maps embed", "Gift registry", "Priority support"] },
]

const templates = [
  { id: "dark", name: "Dark Luxury", preview: "🌑", desc: "Elegant dark theme with gold accents", link: "/demo" },
  { id: "botanical", name: "Botanical Garden", preview: "🌿", desc: "Fresh white & sage green", link: "/demo2" },
  { id: "rosegold", name: "Rose Gold & Blush", preview: "🌸", desc: "Romantic blush pink tones", link: "/demo3" },
]

const steps = ["Package", "Template", "Details", "Contact", "Payment"]

export default function Order() {
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState("idle")
  const [form, setForm] = useState({
    package: "",
    template: "",
    groomName: "",
    brideName: "",
    parentsEn: "",
    weddingDate: "",
    ceremonyPlace: "",
    ceremonyTime: "",
    partyPlace: "",
    partyTime: "",
    city: "",
    guestCount: "",
    music: "",
    yourName: "",
    yourPhone: "",
    yourEmail: "",
    notes: "",
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setStatus("loading")
    try {
      await addDoc(collection(db, "orders"), {
        ...form,
        createdAt: serverTimestamp()
      })
      // WhatsApp notification
      const msg = `🎉 New Order on Lumivite!\n📦 ${form.package.toUpperCase()} Package — ${packages.find(p => p.id === form.package)?.price}\n🎨 ${form.template} Template\n💒 ${form.groomName} & ${form.brideName}\n📅 ${form.weddingDate}\n👤 Client: ${form.yourName}\n📞 ${form.yourPhone}\n⚠️ Awaiting payment confirmation!`
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`, { mode: "no-cors" }).catch(() => {})
      setStatus("success")
    } catch (e) {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0a0806] flex items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="font-serif text-4xl font-light text-white mb-4">Order Received!</h1>
          <p className="text-white/50 mb-4">Thank you <span className="text-[#c9a96e]">{form.yourName}</span>! We've received your order and will contact you within 24 hours on WhatsApp.</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Order Summary</p>
            <p className="text-white text-sm">📦 {form.package.charAt(0).toUpperCase() + form.package.slice(1)} Package</p>
            <p className="text-white text-sm">🎨 {templates.find(t => t.id === form.template)?.name} Template</p>
            <p className="text-white text-sm">💒 {form.groomName} & {form.brideName}</p>
            <p className="text-white text-sm">📅 {form.weddingDate}</p>
            <p className="text-white text-sm">📞 {form.yourPhone}</p>
          </div>
          <a href="/" className="inline-block bg-[#c9a96e] text-black font-semibold px-8 py-3 rounded-full text-sm">
            Back to Home
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-white"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 60%)" }}>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-6">
        <a href="/" className="text-[#c9a96e] font-serif text-2xl">Lumivite</a>
        <p className="text-white/30 text-xs mt-1 tracking-widest uppercase">Order Your Invitation</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 px-6 mb-12">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition ${
              i === step ? "bg-[#c9a96e] text-black" :
              i < step ? "bg-[#c9a96e]/20 text-[#c9a96e]" :
              "bg-white/5 text-white/30"}`}>
              <span>{i < step ? "✓" : i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px ${i < step ? "bg-[#c9a96e]/50" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-24">
        <AnimatePresence mode="wait">

          {/* STEP 0 - Package */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">Choose Your Package</h2>
              <p className="text-white/40 text-center text-sm mb-10">Select the package that fits your needs</p>
              <div className="grid gap-4">
                {packages.map(pkg => (
                  <motion.div key={pkg.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => update("package", pkg.id)}
                    className="relative p-6 rounded-2xl border cursor-pointer transition"
                    style={{
                      borderColor: form.package === pkg.id ? pkg.color : "rgba(255,255,255,0.1)",
                      background: form.package === pkg.id ? `${pkg.color}10` : "rgba(255,255,255,0.02)"
                    }}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full bg-[#c9a96e] text-black">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold tracking-wider text-sm" style={{ color: pkg.color }}>{pkg.name.toUpperCase()}</p>
                        <p className="font-serif text-3xl font-light mt-1" style={{ color: pkg.color }}>{pkg.price}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition`}
                        style={{ borderColor: pkg.color, background: form.package === pkg.id ? pkg.color : "transparent" }}>
                        {form.package === pkg.id && <span className="text-black text-xs">✓</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pkg.features.map((f, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/50">✓ {f}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setStep(1)} disabled={!form.package}
                className="w-full mt-8 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                style={{ background: "#c9a96e" }}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 1 - Template */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">Choose Your Template</h2>
              <p className="text-white/40 text-center text-sm mb-10">Pick the style that speaks to you</p>
              <div className="grid gap-4">
                {templates.map(t => (
                  <motion.div key={t.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => update("template", t.id)}
                    className="p-6 rounded-2xl border cursor-pointer transition flex items-center gap-5"
                    style={{
                      borderColor: form.template === t.id ? "#c9a96e" : "rgba(255,255,255,0.1)",
                      background: form.template === t.id ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.02)"
                    }}>
                    <div className="text-4xl">{t.preview}</div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{t.name}</p>
                      <p className="text-white/40 text-sm">{t.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={t.link} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">
                        Preview
                      </a>
                      <div className="w-6 h-6 rounded-full border-2 border-[#c9a96e] flex items-center justify-center"
                        style={{ background: form.template === t.id ? "#c9a96e" : "transparent" }}>
                        {form.template === t.id && <span className="text-black text-xs">✓</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">
                  ← Back
                </button>
                <button onClick={() => setStep(2)} disabled={!form.template}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 - Wedding Details */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">Wedding Details</h2>
              <p className="text-white/40 text-center text-sm mb-10">Tell us about your special day</p>
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  {[["Groom's Name", "groomName", "Christopher"], ["Bride's Name", "brideName", "Joelle"]].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                      <input value={form[key]} onChange={e => update(key, e.target.value)}
                        placeholder={ph} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Parents Names (optional)</label>
                  <textarea value={form.parentsEn} onChange={e => update("parentsEn", e.target.value)}
                    placeholder={"Fadi & Dania Abboud\nNicolas & Marleine Hanna"} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
                  <p className="text-white/20 text-xs mt-1">One per line: Groom's parents first, then Bride's</p>
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Wedding Date</label>
                  <input value={form.weddingDate} onChange={e => update("weddingDate", e.target.value)}
                    type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c9a96e] transition" />
                </div>

                <div className="pt-2">
                  <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">Ceremony Venue</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Place Name</label>
                      <input value={form.ceremonyPlace} onChange={e => update("ceremonyPlace", e.target.value)}
                        placeholder="Saint Georges Church" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Time</label>
                      <input value={form.ceremonyTime} onChange={e => update("ceremonyTime", e.target.value)}
                        placeholder="6:00 PM" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">Party Venue</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Place Name</label>
                      <input value={form.partyPlace} onChange={e => update("partyPlace", e.target.value)}
                        placeholder="Bois de Roses" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Time</label>
                      <input value={form.partyTime} onChange={e => update("partyTime", e.target.value)}
                        placeholder="8:30 PM" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">City</label>
                    <input value={form.city} onChange={e => update("city", e.target.value)}
                      placeholder="Feytroun, Lebanon" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Guest Count</label>
                    <input value={form.guestCount} onChange={e => update("guestCount", e.target.value)}
                      placeholder="150" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Preferred Music (optional)</label>
                  <input value={form.music} onChange={e => update("music", e.target.value)}
                    placeholder="Song name or YouTube link" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
                </div>

              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">
                  ← Back
                </button>
                <button onClick={() => setStep(3)}
                  disabled={!form.groomName || !form.brideName || !form.weddingDate}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 - Contact */}
      {step === 3 && (
      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-3xl font-light text-center mb-2">Your Contact Info</h2>
      <p className="text-white/40 text-center text-sm mb-10">We'll reach you on WhatsApp within 24 hours</p>
      <div className="space-y-4 mb-8">
      {[
        ["Your Full Name", "yourName", "text", "Sarah Abboud"],
        ["WhatsApp Number", "yourPhone", "tel", "+961 71 234 567"],
        ["Email (optional)", "yourEmail", "email", "sarah@email.com"],
      ].map(([label, key, type, ph]) => (
        <div key={key}>
          <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{label}</label>
          <input value={form[key]} onChange={e => update(key, e.target.value)}
            type={type} placeholder={ph}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition" />
        </div>
      ))}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Additional Notes (optional)</label>
        <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
          placeholder="Any special requests..." rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
      </div>
    </div>

              {/* Mini Order Summary */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">Order Summary</p>
          <div className="space-y-2 text-sm">
          <div className="flex justify-between">
          <span className="text-white/50">Package</span>
          <span className="text-white capitalize">{form.package} — {packages.find(p => p.id === form.package)?.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Template</span>
          <span className="text-white">{templates.find(t => t.id === form.template)?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Couple</span>
          <span className="text-white">{form.groomName} & {form.brideName}</span>
        </div>
        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
          <span className="text-white/50">Total Due</span>
          <span className="font-bold text-xl text-[#c9a96e]">{packages.find(p => p.id === form.package)?.price}</span>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">
        ← Back
      </button>
      <button onClick={() => setStep(4)}
        disabled={!form.yourName || !form.yourPhone}
        className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
        style={{ background: "#c9a96e" }}>
        Continue to Payment →
      </button>
    </div>
  </motion.div>
  )}

          {/* STEP 4 - Payment */}
{step === 4 && (
  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
    <h2 className="font-serif text-3xl font-light text-center mb-2">Complete Payment</h2>
    <p className="text-white/40 text-center text-sm mb-10">Choose your preferred payment method</p>

    {/* Amount Due */}
    <div className="text-center mb-8">
      <p className="text-white/40 text-sm mb-1">Total Due</p>
      <p className="font-serif text-5xl font-light text-[#c9a96e]">
        {packages.find(p => p.id === form.package)?.price}
      </p>
      <p className="text-white/30 text-xs mt-1 capitalize">{form.package} Package · {templates.find(t => t.id === form.template)?.name}</p>
    </div>

    {/* Payment Methods */}
    <div className="grid gap-4 mb-8">

      {/* OMT */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6 hover:border-[#c9a96e]/30 transition">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">🏧</div>
          <div>
            <p className="font-medium text-white">OMT Transfer</p>
            <p className="text-white/40 text-xs">Cash transfer via OMT</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Recipient Name</span>
            <span className="text-white font-medium">S. Mhanna</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Phone Number</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">+961 71 444 328</span>
              <button onClick={() => { navigator.clipboard.writeText("96171444328"); alert("Copied!") }}
                className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-2 py-0.5 hover:bg-[#c9a96e]/10 transition">
                Copy
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Amount</span>
            <span className="text-[#c9a96e] font-bold">{packages.find(p => p.id === form.package)?.price}</span>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-3">After sending, click "I've Paid" below and we'll confirm within 1 hour.</p>
      </div>

      {/* Bank Transfer */}
<div className="bg-white/3 border border-white/10 rounded-2xl p-6 hover:border-[#c9a96e]/30 transition">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🏦</div>
    <div>
      <p className="font-medium text-white">Bank Card Transfer</p>
      <p className="text-white/40 text-xs">Transfer directly to Blom Bank card</p>
    </div>
  </div>
  <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-white/40">Bank</span>
      <span className="text-white font-medium">Blom Bank</span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-white/40">Card Number</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-mono text-xs">**** **** **** 8478</span>
        <button onClick={() => { navigator.clipboard.writeText("4870522074258478"); alert("Copied!") }}
          className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-2 py-0.5 hover:bg-[#c9a96e]/10 transition">
          Copy
        </button>
      </div>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Name on Card</span>
      <span className="text-white font-medium">S. MHANNA</span>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Amount</span>
      <span className="text-[#c9a96e] font-bold">{packages.find(p => p.id === form.package)?.price}</span>
    </div>
  </div>
  <p className="text-white/30 text-xs mt-3">Use your name + wedding date as transfer reference.</p>
</div>

          {/* Whish Money */}
<div className="bg-white/3 border border-white/10 rounded-2xl p-6 hover:border-[#c9a96e]/30 transition">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">💜</div>
    <div>
      <p className="font-medium text-white">Whish Money</p>
      <p className="text-white/40 text-xs">Send via Whish Money app</p>
    </div>
  </div>
  <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-white/40">Whish Number</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">+961 71 444 328</span>
        <button onClick={() => { navigator.clipboard.writeText("96171444328"); alert("Copied!") }}
          className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-2 py-0.5 hover:bg-[#c9a96e]/10 transition">
          Copy
        </button>
      </div>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Name</span>
      <span className="text-white font-medium">S. MHANNA</span>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Amount</span>
      <span className="text-[#c9a96e] font-bold">{packages.find(p => p.id === form.package)?.price}</span>
    </div>
  </div>
  <p className="text-white/30 text-xs mt-3">Open Whish app → Send Money → enter number above → confirm amount.</p>
</div>


      {/* WhatsApp Pay / Cash */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6 hover:border-[#c9a96e]/30 transition">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="font-medium text-white">WhatsApp / Cash</p>
            <p className="text-white/40 text-xs">Arrange payment directly with us</p>
          </div>
        </div>
        <a href={`https://wa.me/96171444328?text=${encodeURIComponent(`Hi! I just placed an order for ${form.groomName} & ${form.brideName}'s wedding invitation (${form.package} package). I'd like to arrange payment. Total: ${packages.find(p => p.id === form.package)?.price}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-white transition text-sm"
          style={{ background: "#25D366" }}>
          💬 Message Us on WhatsApp
        </a>
      </div>

    </div>

    {/* Confirm Payment Button */}
    <div className="flex gap-3">
      <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">
        ← Back
      </button>
      <button onClick={handleSubmit} disabled={status === "loading"}
        className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
        style={{ background: "#c9a96e" }}>
        {status === "loading" ? "Submitting..." : "✅ I've Paid — Place Order"}
      </button>
    </div>

    <p className="text-white/20 text-xs text-center mt-4">
      Your order will be confirmed after payment verification. We'll contact you on WhatsApp within 1 hour.
    </p>
  </motion.div>
)}

        </AnimatePresence>
      </div>
    </div>
  )
}