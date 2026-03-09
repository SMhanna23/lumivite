import { useState, useEffect, useRef } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"
import { getAuth, signOut } from "firebase/auth"
import { motion, AnimatePresence } from "framer-motion"

function BuildInvitationModal({ order }) {
  const [slug, setSlug] = useState(`${order.groomName?.toLowerCase()}-${order.brideName?.toLowerCase()}`.replace(/\s/g, ""))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [extraData, setExtraData] = useState({
    groomAr: "", brideAr: "",
    venue: `${order.ceremonyPlace}, ${order.city}`,
    venueAr: "",
    parentsEn: order.parentsEn || "", parentsAr: "",
    quote: "We love because he first loved us.",
    quoteAr: "نحن نحب لأنه هو أحبنا أولاً",
    quoteRef: "1 John 4:19",
    music: order.music || "",
  })

  const update = (k, v) => setExtraData(p => ({ ...p, [k]: v }))

  const handlePhotoUpload = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const apiKey = import.meta.env.VITE_IMGBB_KEY
      const urls = await Promise.all(
        Array.from(files).slice(0, 6 - photos.length).map(async (file) => {
          const formData = new FormData()
          formData.append("image", file)
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
          })
          const data = await res.json()
          if (!data.success) throw new Error(data.error?.message || "Upload failed")
          return data.data.url
        })
      )
      setPhotos(prev => [...prev, ...urls].slice(0, 6))
    } catch (e) {
      alert("Upload error: " + e.message)
    }
    setUploading(false)
  }

  const handleBuild = async () => {
    setSaving(true)
    try {
      const { setDoc, doc } = await import("firebase/firestore")
      const invitationData = {
        groom: order.groomName,
        bride: order.brideName,
        groomAr: extraData.groomAr || order.groomName,
        brideAr: extraData.brideAr || order.brideName,
        date: order.weddingDate + "T18:00:00",
        template: order.template,
        venue: extraData.venue,
        venueAr: extraData.venueAr || extraData.venue,
        quote: extraData.quote,
        quoteAr: extraData.quoteAr,
        quoteRef: extraData.quoteRef,
        music: extraData.music,
        parents: extraData.parentsEn ? extraData.parentsEn.split("\n") : [],
        parentsAr: extraData.parentsAr ? extraData.parentsAr.split("\n") : [],
        venues: [
          { label: "Wedding Ceremony", labelAr: "مراسم الزواج", time: order.ceremonyTime, place: order.ceremonyPlace, placeAr: order.ceremonyPlace, location: order.city },
          { label: "Wedding Party", labelAr: "حفل الزفاف", time: order.partyTime, place: order.partyPlace, placeAr: order.partyPlace, location: order.city },
        ],
        slug,
        createdAt: new Date(),
        orderId: order.id,
        package: order.package,
        ...(photos.length > 0 && { photos }),
      }
      await setDoc(doc(db, "invitations", slug), invitationData)
      setSaved(true)
    } catch (e) {
      alert("Error: " + e.message)
    }
    setSaving(false)
  }

  const liveUrl = `https://lumivite.net/i/${slug}`

  return (
    <div className="border-t border-white/5 p-5">
      <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4 font-semibold">
        🛠️ Build Invitation
      </p>

      {saved ? (
        <div className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl p-4 text-center">
          <p className="text-[#4ade80] font-medium mb-2">✅ Invitation is LIVE!</p>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="text-[#c9a96e] text-sm underline break-all">{liveUrl}</a>
          <div className="flex gap-2 mt-3 justify-center">
            <button onClick={() => navigator.clipboard.writeText(liveUrl).then(() => alert("Copied!"))}
              className="text-xs px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
              📋 Copy Link
            </button>
            <a href={`https://wa.me/${order.yourPhone?.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(`Hi ${order.yourName}! 🎉 Your wedding invitation is ready!\n\n💍 ${order.groomName} & ${order.brideName}\n\nView it here: ${liveUrl}\n\nShare this link with your guests to RSVP! 🤍`)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs px-4 py-2 rounded-xl text-black font-medium transition"
              style={{ background: "#25D366" }}>
              💬 Send to Client
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Slug */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Invitation URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-white/20 text-sm">lumivite.net/i/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
          </div>

          {/* Arabic names */}
          <div className="grid grid-cols-2 gap-3">
            {[["Groom Name (Arabic)", "groomAr", "كريستوفر"], ["Bride Name (Arabic)", "brideAr", "جويل"]].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-white/30 text-xs mb-1 block">{label}</label>
                <input value={extraData[key]} onChange={e => update(key, e.target.value)}
                  placeholder={ph} dir="rtl"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>
            ))}
          </div>

          {/* Parents */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Parents (English, one per line)</label>
              <textarea value={extraData.parentsEn} onChange={e => update("parentsEn", e.target.value)}
                placeholder={"Fadi & Dania Abboud\nNicolas & Marleine Hanna"} rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e] resize-none" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Parents (Arabic, one per line)</label>
              <textarea value={extraData.parentsAr} onChange={e => update("parentsAr", e.target.value)}
                placeholder={"فادي ودانيا عبود\nنيكولا ومرلين حنا"} rows={2} dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e] resize-none" />
            </div>
          </div>

          {/* Quote */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Quote (English)</label>
            <input value={extraData.quote} onChange={e => update("quote", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>
          <div>
            <label className="text-white/30 text-xs mb-1 block">Quote (Arabic)</label>
            <input value={extraData.quoteAr} onChange={e => update("quoteAr", e.target.value)}
              dir="rtl"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>

          {/* Music */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Music URL (optional)</label>
            <input value={extraData.music} onChange={e => update("music", e.target.value)}
              placeholder="https://... or leave empty for default"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Client Photos — Gallery ({photos.length}/6)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoUpload(e.target.files)} />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt={`photo ${i+1}`} className="w-full h-full object-cover" />
                    <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || photos.length >= 6}
              className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/40 text-sm hover:border-[#c9a96e]/50 hover:text-[#c9a96e]/70 transition disabled:opacity-30">
              {uploading ? "Uploading..." : photos.length >= 6 ? "Max 6 photos" : "📷 Upload Photos"}
            </button>
          </div>

          <button onClick={handleBuild} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-black transition disabled:opacity-50"
            style={{ background: "#c9a96e" }}>
            {saving ? "Building..." : "🚀 Build & Publish Invitation"}
          </button>
        </div>
      )}
    </div>
  )
}




export default function Admin() {
  const [tab, setTab] = useState("orders")
  const [orders, setOrders] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [rsvpFilter, setRsvpFilter] = useState("all")

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [oSnap, rSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "rsvps"), orderBy("createdAt", "desc")))
      ])
      setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRsvps(rSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const exportRSVP = () => {
    const filtered = rsvpFilter === "all" ? rsvps : rsvps.filter(r => rsvpFilter === "attending" ? r.attending : !r.attending)
    const csv = ["Name,Email,Attending,Persons,Wishes,Wedding,Date",
      ...filtered.map(r => `"${r.name}","${r.email || ""}","${r.attending ? "Yes" : "No"}","${r.persons || 1}","${r.wishes || ""}","${r.wedding || ""}","${r.createdAt?.toDate?.()?.toLocaleDateString() || ""}"`)
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "rsvps.csv"; a.click()
  }

  const exportOrders = () => {
    const csv = ["Name,Phone,Email,Package,Template,Groom,Bride,Date,City,Guests,Ceremony,Party,Notes",
      ...orders.map(o => `"${o.yourName}","${o.yourPhone}","${o.yourEmail || ""}","${o.package}","${o.template}","${o.groomName}","${o.brideName}","${o.weddingDate}","${o.city}","${o.guestCount}","${o.ceremonyPlace}","${o.partyPlace}","${o.notes || ""}"`)
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click()
  }

  const attending = rsvps.filter(r => r.attending).length
  const declined = rsvps.filter(r => !r.attending).length
  const totalPersons = rsvps.filter(r => r.attending).reduce((sum, r) => sum + (r.persons || 1), 0)

  const packageColor = { bronze: "#cd7f32", silver: "#c9a96e", gold: "#ffd700" }
  const templateIcon = { dark: "🌑", botanical: "🌿", rosegold: "🌸" }
  const templateName = { dark: "Dark Luxury", botanical: "Botanical", rosegold: "Rose Gold" }

  const filteredRsvps = rsvpFilter === "all" ? rsvps : rsvps.filter(r => rsvpFilter === "attending" ? r.attending : !r.attending)

  return (
    <div className="min-h-screen bg-[#0a0806] text-white">

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[#c9a96e]">Lumivite</h1>
          <p className="text-white/30 text-xs">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="text-white/40 hover:text-white text-sm transition px-3 py-2 rounded-lg hover:bg-white/5">
            ↻ Refresh
          </button>
          <button onClick={() => signOut(getAuth())}
            className="text-white/40 hover:text-white text-sm transition px-3 py-2 rounded-lg hover:bg-white/5">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: orders.length, icon: "📦", color: "#c9a96e" },
            { label: "Total RSVPs", value: rsvps.length, icon: "💌", color: "#c9a96e" },
            { label: "Attending", value: attending, icon: "✅", color: "#4ade80" },
            { label: "Total Guests", value: totalPersons, icon: "👥", color: "#60a5fa" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-3xl font-light" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="text-white/40 text-xs uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "orders", label: `Orders (${orders.length})`, icon: "📦" },
            { id: "rsvps", label: `RSVPs (${rsvps.length})`, icon: "💌" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: tab === t.id ? "#c9a96e" : "rgba(255,255,255,0.05)", color: tab === t.id ? "black" : "rgba(255,255,255,0.5)" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/30">Loading...</div>
        ) : (

          <>
            {/* ORDERS TAB */}
            {tab === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-white/40 text-sm">{orders.length} orders received</p>
                  <button onClick={exportOrders}
                    className="text-sm px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
                    ⬇ Export CSV
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-20 text-white/20">No orders yet</div>
                ) : (
                  <div className="grid gap-4">
                    {orders.map(order => (
                      <motion.div key={order.id} layout
                        className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-[#c9a96e]/20 transition cursor-pointer"
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
                        <div className="p-5 flex items-center gap-4">
                          <div className="text-2xl">{templateIcon[order.template] || "💍"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white">{order.groomName} & {order.brideName}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: `${packageColor[order.package]}20`, color: packageColor[order.package] }}>
                                {order.package?.toUpperCase()}
                              </span>
                              <span className="text-xs text-white/30">
                                {templateName[order.template]}
                              </span>
                            </div>
                            <p className="text-white/40 text-sm truncate">
                              👤 {order.yourName} · 📞 {order.yourPhone} · 📅 {order.weddingDate}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[#c9a96e] font-semibold">
                              {order.package === "bronze" ? "$89" : order.package === "silver" ? "$139" : "$199"}
                            </p>
                            <p className="text-white/30 text-xs">
                              {order.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                            </p>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedOrder?.id === order.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              onClick={e => e.stopPropagation()}
                              className="border-t border-white/5 overflow-hidden">
                              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                {[
                                  ["🏛️ Ceremony", `${order.ceremonyPlace} at ${order.ceremonyTime}`],
                                  ["🎉 Party", `${order.partyPlace} at ${order.partyTime}`],
                                  ["📍 City", order.city],
                                  ["👥 Guests", order.guestCount],
                                  ["🎵 Music", order.music || "Not specified"],
                                  ["📝 Notes", order.notes || "None"],
                                  ["📧 Email", order.yourEmail || "Not provided"],
                                ].map(([label, val]) => (
                                  <div key={label}>
                                    <p className="text-white/30 text-xs mb-1">{label}</p>
                                    <p className="text-white/70">{val}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="px-5 pb-5 flex gap-3">
                                <a href={`https://wa.me/${order.yourPhone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${order.yourName}! 👋 Thank you for ordering your wedding invitation with Lumivite! We're working on ${order.groomName} & ${order.brideName}'s invitation and will send you a preview soon. 💍`)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition text-black font-medium"
                                  style={{ background: "#25D366" }}>
                                  💬 WhatsApp Client
                                </a>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                          {/* Build Invitation Button */}
                              {selectedOrder?.id === order.id && (
                               <div onClick={e => e.stopPropagation()}>
                                 <BuildInvitationModal order={order} onClose={() => setSelectedOrder(null)} />
                               </div>
                                )}

                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* RSVPs TAB */}
            {tab === "rsvps" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex gap-2">
                    {[
                      { id: "all", label: `All (${rsvps.length})` },
                      { id: "attending", label: `✅ Attending (${attending})` },
                      { id: "declined", label: `❌ Declined (${declined})` },
                    ].map(f => (
                      <button key={f.id} onClick={() => setRsvpFilter(f.id)}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition"
                        style={{ background: rsvpFilter === f.id ? "#c9a96e" : "rgba(255,255,255,0.05)", color: rsvpFilter === f.id ? "black" : "rgba(255,255,255,0.5)" }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={exportRSVP}
                    className="text-sm px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
                    ⬇ Export CSV
                  </button>
                </div>

                {/* RSVP Stats Bar */}
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-6">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-[#4ade80]">{attending} attending</span>
                    <span className="text-white/40">{rsvps.length > 0 ? Math.round(attending / rsvps.length * 100) : 0}% response rate</span>
                    <span className="text-red-400">{declined} declined</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${rsvps.length > 0 ? (attending / rsvps.length) * 100 : 0}%`, background: "linear-gradient(to right, #4ade80, #c9a96e)" }} />
                  </div>
                  <p className="text-white/30 text-xs mt-2 text-center">{totalPersons} total persons attending</p>
                </div>

                {filteredRsvps.length === 0 ? (
                  <div className="text-center py-20 text-white/20">No RSVPs yet</div>
                ) : (
                  <div className="grid gap-3">
                    {filteredRsvps.map(rsvp => (
                      <motion.div key={rsvp.id} layout
                        className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-white/15 transition">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rsvp.attending ? "bg-[#4ade80]" : "bg-red-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{rsvp.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {rsvp.email && <p className="text-white/30 text-xs truncate">{rsvp.email}</p>}
                            {rsvp.wedding && <p className="text-white/30 text-xs">💒 {rsvp.wedding}</p>}
                          </div>
                          {rsvp.wishes && <p className="text-white/40 text-xs mt-1 italic">"{rsvp.wishes}"</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${rsvp.attending ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-red-400/15 text-red-400"}`}>
                            {rsvp.attending ? `✓ ${rsvp.persons || 1} person${(rsvp.persons || 1) > 1 ? "s" : ""}` : "Declined"}
                          </span>
                          <p className="text-white/20 text-xs mt-1">
                            {rsvp.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}