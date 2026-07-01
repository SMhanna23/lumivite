import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import emailjs from "@emailjs/browser"
import Logo from "../components/Logo"

const packages = [
  { id: "bronze", name: "Bronze", nameAr: "برونز", price: "$89", color: "#cd7f32", features: ["1 template", "RSVP dashboard", "Countdown timer", "1 shared link"], featuresAr: ["قالب واحد", "لوحة RSVP", "عداد تنازلي", "رابط مشترك واحد"] },
  { id: "silver", name: "Silver", nameAr: "فضي", price: "$139", color: "#c9a96e", features: ["Personalized guest links", "Background music", "Photo gallery", "Excel import"], featuresAr: ["روابط مخصصة للضيوف", "موسيقى خلفية", "معرض صور", "استيراد Excel"], popular: true },
  { id: "gold", name: "Gold", nameAr: "ذهبي", price: "$199", color: "#ffd700", features: ["All 4 template choices", "Google Maps embed", "Guest Memory Wall", "Priority support"], featuresAr: ["4 خيارات قوالب", "خريطة Google", "جدار ذكريات الضيوف", "دعم أولوية"] },
]

const templates = [
  { id: "dark", name: "Dark Luxury", nameAr: "فاخر داكن", preview: "🌑", desc: "Elegant dark theme with gold accents", descAr: "تصميم داكن أنيق مع لمسات ذهبية", link: "/demo" },
  { id: "botanical", name: "Botanical Garden", nameAr: "الحديقة النباتية", preview: "🌿", desc: "Fresh white & sage green", descAr: "أبيض منعش مع أخضر حكيمي", link: "/demo2" },
  { id: "rosegold", name: "Rose Gold & Blush", nameAr: "ذهبي وردي", preview: "🌸", desc: "Romantic blush pink tones", descAr: "درجات وردية رومانسية", link: "/demo3" },
  { id: "sand", name: "Cinematic Sand & Seal", nameAr: "رملي سينمائي", preview: "🏺", desc: "Warm sand tones with cinematic elegance", descAr: "درجات رملية دافئة بأناقة سينمائية", link: "/demo4" },
]

const T = {
  en: {
    steps: ["Package", "Template", "Details", "Contact", "Payment"],
    subtitle: "Order Your Invitation",
    mostPopular: "MOST POPULAR",
    choosePackage: "Choose Your Package",
    choosePackageSub: "Select the package that fits your needs",
    chooseTemplate: "Choose Your Template",
    chooseTemplateSub: "Pick the style that speaks to you",
    preview: "Preview",
    weddingDetails: "Wedding Details",
    weddingDetailsSub: "Tell us about your special day",
    groomName: "Groom's Name",
    brideName: "Bride's Name",
    groomPh: "Christopher",
    bridePh: "Joelle",
    parents: "Parents Names (optional)",
    parentsPh: "Fadi & Dania Abboud\nNicolas & Marleine Hanna",
    parentsHint: "One per line: Groom's parents first, then Bride's",
    weddingDate: "Wedding Date",
    ceremonyVenue: "Ceremony Venue",
    partyVenue: "Party Venue",
    placeName: "Place Name",
    time: "Time",
    ceremonyPh: "Saint Georges Church",
    ceremonyTimePh: "6:00 PM",
    partyPh: "Bois de Roses",
    partyTimePh: "8:30 PM",
    city: "City",
    cityPh: "Feytroun, Lebanon",
    guestCount: "Guest Count",
    music: "Preferred Music (optional)",
    musicPh: "Song name or YouTube link",
    contactInfo: "Your Contact Info",
    contactSub: "We'll reach you on WhatsApp within 24 hours",
    yourName: "Your Full Name",
    yourNamePh: "Sarah Abboud",
    whatsapp: "WhatsApp Number",
    whatsappPh: "+961 71 234 567",
    email: "Email (optional)",
    emailPh: "sarah@email.com",
    notes: "Additional Notes (optional)",
    notesPh: "Any special requests...",
    orderSummary: "Order Summary",
    package: "Package",
    template: "Template",
    couple: "Couple",
    totalDue: "Total Due",
    confirmOrder: "Confirm Your Order",
    confirmSub: "Review and place your order",
    howItWorks: "How it works",
    steps4: [
      "Place your order below",
      "We contact you on WhatsApp within a few hours",
      "You send payment via OMT, cash, or bank transfer",
      "We build and deliver your invitation links",
    ],
    bronzeTemplateNote: "🥉 Bronze package includes the Dark Luxury template only",
    templateLocked: "Silver & Gold only",
    back: "← Back",
    continue: "Continue →",
    continuePayment: "Continue to Payment →",
    placeOrder: "Place Order →",
    placing: "Placing Order...",
    noCharge: "We'll reach you on WhatsApp to arrange payment. No upfront charge.",
    whatsappLabel: "WhatsApp",
  },
  ar: {
    steps: ["الباقة", "القالب", "التفاصيل", "التواصل", "الدفع"],
    subtitle: "اطلب دعوتك",
    mostPopular: "الأكثر طلباً",
    choosePackage: "اختر باقتك",
    choosePackageSub: "اختر الباقة المناسبة لاحتياجاتك",
    chooseTemplate: "اختر القالب",
    chooseTemplateSub: "اختر التصميم الذي يعبّر عنكم",
    preview: "معاينة",
    weddingDetails: "تفاصيل الزفاف",
    weddingDetailsSub: "أخبرنا عن يومكم المميز",
    groomName: "اسم العريس",
    brideName: "اسم العروس",
    groomPh: "كريستوفر",
    bridePh: "جويل",
    parents: "أسماء الأهل (اختياري)",
    parentsPh: "فادي وداني عبود\nنيكولاس ومارلين حنا",
    parentsHint: "سطر لكل عائلة: أهل العريس أولاً ثم أهل العروس",
    weddingDate: "تاريخ الزفاف",
    ceremonyVenue: "مكان المراسم",
    partyVenue: "مكان الحفل",
    placeName: "اسم المكان",
    time: "الوقت",
    ceremonyPh: "كنيسة القديس جورج",
    ceremonyTimePh: "6:00 مساءً",
    partyPh: "بوا دو روز",
    partyTimePh: "8:30 مساءً",
    city: "المدينة",
    cityPh: "فيترون، لبنان",
    guestCount: "عدد المدعوين",
    music: "الموسيقى المفضّلة (اختياري)",
    musicPh: "اسم الأغنية أو رابط يوتيوب",
    contactInfo: "بياناتك",
    contactSub: "سنتواصل معك عبر الواتساب خلال 24 ساعة",
    yourName: "اسمك الكامل",
    yourNamePh: "سارة عبود",
    whatsapp: "رقم الواتساب",
    whatsappPh: "+961 71 234 567",
    email: "البريد الإلكتروني (اختياري)",
    emailPh: "sarah@email.com",
    notes: "ملاحظات إضافية (اختياري)",
    notesPh: "أي طلبات خاصة...",
    orderSummary: "ملخص الطلب",
    package: "الباقة",
    template: "القالب",
    couple: "الزوجان",
    totalDue: "المبلغ الإجمالي",
    confirmOrder: "تأكيد طلبك",
    confirmSub: "راجع وأكّد طلبك",
    howItWorks: "كيف يعمل؟",
    steps4: [
      "أرسل طلبك أدناه",
      "نتواصل معك عبر الواتساب خلال ساعات قليلة",
      "تسدّد المبلغ عبر OMT أو نقداً أو تحويل بنكي",
      "نصمّم دعوتك ونرسل لك الروابط",
    ],
    bronzeTemplateNote: "🥉 باقة برونز تشمل قالب الفاخر الداكن فقط",
    templateLocked: "فضي وذهبي فقط",
    back: "رجوع →",
    continue: "← متابعة",
    continuePayment: "← متابعة للدفع",
    placeOrder: "← تأكيد الطلب",
    placing: "جارٍ الإرسال...",
    noCharge: "سنتواصل معك عبر الواتساب لترتيب الدفع. لا دفع مسبق.",
    whatsappLabel: "الواتساب",
  }
}

export default function Order() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState("idle")
  const [lang, setLang] = useState("en")
  const t = T[lang]
  const isAr = lang === "ar"

  const [form, setForm] = useState({
    package: "", template: "", groomName: "", brideName: "", parentsEn: "",
    weddingDate: "", ceremonyPlace: "", ceremonyTime: "", partyPlace: "", partyTime: "",
    city: "", guestCount: "", music: "", yourName: "", yourPhone: "", yourEmail: "", notes: "",
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-select dark template when Bronze is chosen — it's the only option
  useEffect(() => {
    if (form.package === "bronze") update("template", "dark")
  }, [form.package])

  const handleSubmit = async () => {
    setStatus("loading")
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...form,
        status: "pending_payment",
        createdAt: serverTimestamp()
      })
      const msg = `🎉 New Order on Lumivite!\n📦 ${form.package.toUpperCase()} Package — ${packages.find(p => p.id === form.package)?.price}\n🎨 ${form.template} Template\n💒 ${form.groomName} & ${form.brideName}\n📅 ${form.weddingDate}\n👤 Client: ${form.yourName}\n📞 ${form.yourPhone}\n⚠️ Awaiting payment confirmation!`
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${import.meta.env.VITE_CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${import.meta.env.VITE_CALLMEBOT_APIKEY}`, { mode: "no-cors" }).catch(() => {})
      if (form.yourEmail) {
        emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_name: form.yourName,
            to_email: form.yourEmail,
            couple: `${form.groomName} & ${form.brideName}`,
            package: `${form.package.charAt(0).toUpperCase() + form.package.slice(1)} — ${packages.find(p => p.id === form.package)?.price}`,
            wedding_date: form.weddingDate,
            order_link: `https://www.lumivite.net/my-order/${docRef.id}`,
            order_id: docRef.id,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        ).catch(() => {})
      }
      navigate(`/my-order/${docRef.id}`)
    } catch (e) {
      setStatus("error")
    }
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition"

  return (
    <div className="min-h-screen bg-[#0a0806] text-white"
      dir={isAr ? "rtl" : "ltr"}
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 60%)" }}>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-6 relative">
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>
        <p className="text-white/30 text-xs mt-1 tracking-widest uppercase">{t.subtitle}</p>
        {/* Language Toggle */}
        <button onClick={() => setLang(isAr ? "en" : "ar")}
          className="absolute top-16 right-6 text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/40 hover:border-[#c9a96e]/50 hover:text-[#c9a96e] transition"
          style={{ fontFamily: isAr ? "'Jost', sans-serif" : "'Noto Naskh Arabic', sans-serif" }}>
          {isAr ? "English" : "عربي"}
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 px-6 mb-12">
        {t.steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition ${
              i === step ? "bg-[#c9a96e] text-black" :
              i < step ? "bg-[#c9a96e]/20 text-[#c9a96e]" :
              "bg-white/5 text-white/30"}`}>
              <span>{i < step ? "✓" : i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < t.steps.length - 1 && (
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
              <h2 className="font-serif text-3xl font-light text-center mb-2">{t.choosePackage}</h2>
              <p className="text-white/40 text-center text-sm mb-10">{t.choosePackageSub}</p>
              <div className="grid gap-4">
                {packages.map(pkg => (
                  <motion.div key={pkg.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => update("package", pkg.id)}
                    className="relative p-6 rounded-2xl border cursor-pointer transition"
                    style={{ borderColor: form.package === pkg.id ? pkg.color : "rgba(255,255,255,0.1)", background: form.package === pkg.id ? `${pkg.color}10` : "rgba(255,255,255,0.02)" }}>
                    {pkg.popular && (
                      <div className={`absolute -top-3 ${isAr ? "right-6" : "left-6"} text-xs font-bold px-3 py-1 rounded-full bg-[#c9a96e] text-black`}>
                        {t.mostPopular}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold tracking-wider text-sm" style={{ color: pkg.color }}>{(isAr ? pkg.nameAr : pkg.name).toUpperCase()}</p>
                        <p className="font-serif text-3xl font-light mt-1" style={{ color: pkg.color }}>{pkg.price}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition"
                        style={{ borderColor: pkg.color, background: form.package === pkg.id ? pkg.color : "transparent" }}>
                        {form.package === pkg.id && <span className="text-black text-xs">✓</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(isAr ? pkg.featuresAr : pkg.features).map((f, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/50">✓ {f}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setStep(1)} disabled={!form.package}
                className="w-full mt-8 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                style={{ background: "#c9a96e" }}>
                {t.continue}
              </button>
            </motion.div>
          )}

          {/* STEP 1 - Template */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">{t.chooseTemplate}</h2>
              <p className="text-white/40 text-center text-sm mb-6">{t.chooseTemplateSub}</p>
              {form.package === "bronze" && (
                <p className="text-center text-xs mb-8 py-2 px-4 rounded-xl border"
                  style={{ color: "#cd7f32", borderColor: "rgba(205,127,50,0.3)", background: "rgba(205,127,50,0.07)" }}>
                  {t.bronzeTemplateNote}
                </p>
              )}
              <div className="grid gap-4">
                {templates.map(tmpl => {
                  const locked = form.package === "bronze" && tmpl.id !== "dark"
                  return (
                    <motion.div key={tmpl.id}
                      whileHover={locked ? {} : { scale: 1.01 }}
                      whileTap={locked ? {} : { scale: 0.99 }}
                      onClick={() => !locked && update("template", tmpl.id)}
                      className="p-6 rounded-2xl border transition flex items-center gap-5"
                      style={{
                        borderColor: locked ? "rgba(255,255,255,0.05)" : form.template === tmpl.id ? "#c9a96e" : "rgba(255,255,255,0.1)",
                        background: locked ? "rgba(255,255,255,0.01)" : form.template === tmpl.id ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.02)",
                        opacity: locked ? 0.4 : 1,
                        cursor: locked ? "not-allowed" : "pointer",
                      }}>
                      <div className="text-4xl">{tmpl.preview}</div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{isAr ? tmpl.nameAr : tmpl.name}</p>
                        <p className="text-white/40 text-sm">{isAr ? tmpl.descAr : tmpl.desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {locked ? (
                          <span className="text-xs px-3 py-1 rounded-full border"
                            style={{ color: "#c9a96e", borderColor: "rgba(201,169,110,0.25)", background: "rgba(201,169,110,0.05)" }}>
                            🔒 {t.templateLocked}
                          </span>
                        ) : (
                          <>
                            <a href={tmpl.link} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-[#c9a96e] text-xs border border-[#c9a96e]/30 rounded-full px-3 py-1 hover:bg-[#c9a96e]/10 transition">
                              {t.preview}
                            </a>
                            <div className="w-6 h-6 rounded-full border-2 border-[#c9a96e] flex items-center justify-center"
                              style={{ background: form.template === tmpl.id ? "#c9a96e" : "transparent" }}>
                              {form.template === tmpl.id && <span className="text-black text-xs">✓</span>}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">{t.back}</button>
                <button onClick={() => setStep(2)} disabled={!form.template}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>{t.continue}</button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 - Wedding Details */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">{t.weddingDetails}</h2>
              <p className="text-white/40 text-center text-sm mb-10">{t.weddingDetailsSub}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[[t.groomName, "groomName", t.groomPh], [t.brideName, "brideName", t.bridePh]].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                      <input value={form[key]} onChange={e => update(key, e.target.value)} placeholder={ph} className={inp} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.parents}</label>
                  <textarea value={form.parentsEn} onChange={e => update("parentsEn", e.target.value)} placeholder={t.parentsPh} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
                  <p className="text-white/20 text-xs mt-1">{t.parentsHint}</p>
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.weddingDate}</label>
                  <input value={form.weddingDate} onChange={e => update("weddingDate", e.target.value)} type="date" className={inp} />
                </div>
                <div className="pt-2">
                  <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">{t.ceremonyVenue}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">{t.placeName}</label>
                      <input value={form.ceremonyPlace} onChange={e => update("ceremonyPlace", e.target.value)} placeholder={t.ceremonyPh} className={inp} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">{t.time}</label>
                      <input value={form.ceremonyTime} onChange={e => update("ceremonyTime", e.target.value)} placeholder={t.ceremonyTimePh} className={inp} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">{t.partyVenue}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">{t.placeName}</label>
                      <input value={form.partyPlace} onChange={e => update("partyPlace", e.target.value)} placeholder={t.partyPh} className={inp} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">{t.time}</label>
                      <input value={form.partyTime} onChange={e => update("partyTime", e.target.value)} placeholder={t.partyTimePh} className={inp} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.city}</label>
                    <input value={form.city} onChange={e => update("city", e.target.value)} placeholder={t.cityPh} className={inp} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.guestCount}</label>
                    <input value={form.guestCount} onChange={e => update("guestCount", e.target.value)} placeholder="150" type="number" className={inp} />
                  </div>
                </div>
                {form.package !== "bronze" && (
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.music}</label>
                    <input value={form.music} onChange={e => update("music", e.target.value)} placeholder={t.musicPh} className={inp} />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">{t.back}</button>
                <button onClick={() => setStep(3)} disabled={!form.groomName || !form.brideName || !form.weddingDate}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>{t.continue}</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 - Contact */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">{t.contactInfo}</h2>
              <p className="text-white/40 text-center text-sm mb-10">{t.contactSub}</p>
              <div className="space-y-4 mb-8">
                {[
                  [t.yourName, "yourName", "text", t.yourNamePh],
                  [t.whatsapp, "yourPhone", "tel", t.whatsappPh],
                  [t.email, "yourEmail", "email", t.emailPh],
                ].map(([label, key, type, ph]) => (
                  <div key={key}>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                    <input value={form[key]} onChange={e => update(key, e.target.value)} type={type} placeholder={ph} className={inp} />
                  </div>
                ))}
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">{t.notes}</label>
                  <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder={t.notesPh} rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e] transition resize-none" />
                </div>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
                <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">{t.orderSummary}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">{t.package}</span><span className="text-white capitalize">{form.package} — {packages.find(p => p.id === form.package)?.price}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">{t.template}</span><span className="text-white">{templates.find(tmpl => tmpl.id === form.template)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">{t.couple}</span><span className="text-white">{form.groomName} & {form.brideName}</span></div>
                  <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                    <span className="text-white/50">{t.totalDue}</span>
                    <span className="font-bold text-xl text-[#c9a96e]">{packages.find(p => p.id === form.package)?.price}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">{t.back}</button>
                <button onClick={() => setStep(4)} disabled={!form.yourName || !form.yourPhone}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>{t.continuePayment}</button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 - Confirm & Pay */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-serif text-3xl font-light text-center mb-2">{t.confirmOrder}</h2>
              <p className="text-white/40 text-center text-sm mb-10">{t.confirmSub}</p>
              <div className="text-center mb-8">
                <p className="text-white/40 text-sm mb-1">{t.totalDue}</p>
                <p className="font-serif text-5xl font-light text-[#c9a96e]">{packages.find(p => p.id === form.package)?.price}</p>
                <p className="text-white/30 text-xs mt-1 capitalize">{form.package} · {templates.find(tmpl => tmpl.id === form.template)?.name}</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-8">
                <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">{t.howItWorks}</p>
                <div className="space-y-4">
                  {t.steps4.map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>{i + 1}</div>
                      <p className="text-white/70 text-sm">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
                <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">{t.orderSummary}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">{t.package}</span><span className="text-white capitalize">{form.package} — {packages.find(p => p.id === form.package)?.price}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">{t.template}</span><span className="text-white">{templates.find(tmpl => tmpl.id === form.template)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">{t.couple}</span><span className="text-white">{form.groomName} & {form.brideName}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">{t.whatsappLabel}</span><span className="text-white">{form.yourPhone}</span></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/50 hover:border-white/20 transition">{t.back}</button>
                <button onClick={handleSubmit} disabled={status === "loading"}
                  className="flex-1 py-4 rounded-xl font-semibold tracking-wider text-black disabled:opacity-30 transition"
                  style={{ background: "#c9a96e" }}>
                  {status === "loading" ? t.placing : t.placeOrder}
                </button>
              </div>
              <p className="text-white/20 text-xs text-center mt-4">{t.noCharge}</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
