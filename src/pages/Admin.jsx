import { useState, useEffect, useRef } from "react"
import { collection, getDocs, orderBy, query, updateDoc, doc, deleteDoc, where } from "firebase/firestore"
import { db } from "../firebase"
import { getAuth, signOut } from "firebase/auth"
import { motion, AnimatePresence } from "framer-motion"

const STATUS_CONFIG = {
  pending_payment: { label: "Awaiting Payment", color: "#f97316", bg: "#f9731620" },
  paid:            { label: "Paid ✓",           color: "#60a5fa", bg: "#60a5fa20" },
  in_progress:     { label: "In Progress",      color: "#a78bfa", bg: "#a78bfa20" },
  delivered:       { label: "Delivered 🎉",     color: "#4ade80", bg: "#4ade8020" },
}

function OrderEditSection({ order, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState({
    groomName: order.groomName || "",
    brideName: order.brideName || "",
    yourName: order.yourName || "",
    yourPhone: order.yourPhone || "",
    yourEmail: order.yourEmail || "",
    weddingDate: order.weddingDate || "",
    city: order.city || "",
    guestCount: order.guestCount || "",
    ceremonyPlace: order.ceremonyPlace || "",
    ceremonyTime: order.ceremonyTime || "",
    partyPlace: order.partyPlace || "",
    partyTime: order.partyTime || "",
    music: order.music || "",
    notes: order.notes || "",
  })
  const set = (k, v) => setFields(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, "orders", order.id), fields)
      onSave(fields)
      setEditing(false)
    } catch (e) { alert("Error: " + e.message) }
    setSaving(false)
  }

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#c9a96e]"

  return (
    <div className="p-5 border-b border-white/5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/30 text-xs uppercase tracking-widest">Order Details</p>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1 rounded-lg font-medium text-black transition" style={{ background: "#c9a96e" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition">
            ✏️ Edit
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {[
          ["Groom", "groomName"], ["Bride", "brideName"],
          ["Client Name", "yourName"], ["Phone", "yourPhone"], ["Email", "yourEmail"],
          ["Wedding Date", "weddingDate"], ["City", "city"], ["Guests", "guestCount"],
          ["Ceremony Place", "ceremonyPlace"], ["Ceremony Time", "ceremonyTime"],
          ["Party Place", "partyPlace"], ["Party Time", "partyTime"],
          ["Music", "music"], ["Notes", "notes"],
        ].map(([label, key]) => (
          <div key={key}>
            <p className="text-white/30 text-xs mb-1">{label}</p>
            {editing
              ? <input value={fields[key]} onChange={e => set(key, e.target.value)} className={inp} />
              : <p className="text-white/70">{fields[key] || "—"}</p>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

function BuildInvitationModal({ order }) {
  const pkg = (order.package || "gold").toLowerCase()
  const tier = pkg.includes("gold") ? "gold" : pkg.includes("silver") ? "silver" : "bronze"

  const [slug, setSlug] = useState(order.slug || `${order.groomName?.toLowerCase()}-${order.brideName?.toLowerCase()}`.replace(/\s/g, ""))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaved,  setDraftSaved]  = useState(false)
  const fileInputRef = useRef(null)
  const savedDocIdRef = useRef(null) // tracks the actual Firestore doc ID (may differ from slug state)
  const [extraData, setExtraData] = useState({
    groomAr: "", brideAr: "",
    messageEn: "Together with their families",
    messageAr: "معاً مع عائلتيهما",
    venue: `${order.ceremonyPlace}, ${order.city}`,
    venueAr: "",
    parentsEn: order.parentsEn || "", parentsAr: "",
    quote: "We love because he first loved us.",
    quoteAr: "نحن نحب لأنه هو أحبنا أولاً",
    quoteRef: "1 John 4:19",
    ceremonyPlaceAr: "",
    partyPlaceAr: "",
    ceremonyMapUrl: "",
    partyMapUrl: "",
    music: order.music || "",
    musicStart: null,
    musicEnd: null,
    video: "",
    videoStart: null,
    videoEnd: null,
    muteVideo: false,
    rsvpDeadline: "",
    registryWishMoneyAcc: "",
    registryLink1: "",
    registryLink2: "",
    registryIban: "",
    tl0: "5:00 PM",    tl0loc: "",
    tl1: "7:00 PM",    tl1loc: "",
    tl2: "11:00 PM",   tl2loc: "",
    dressCode: "",
    transport: "",
    accommodation: "",
    memoriesEnabled: false,
  })

  const update = (k, v) => setExtraData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const { getDocs, getDoc, query, collection: col, where, doc: firestoreDoc } = await import("firebase/firestore")

        // Always query by orderId — reliable even if slug was changed
        let d = null, docId = null
        const q = query(col(db, "invitations"), where("orderId", "==", order.id))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) {
          docId = qSnap.docs[0].id
          d = qSnap.docs[0].data()
          savedDocIdRef.current = docId
          setSlug(docId) // restore the real slug
        } else {
          // Fallback: try current slug directly (legacy / first-time load)
          const snap = await getDoc(firestoreDoc(db, "invitations", slug))
          if (snap.exists()) { d = snap.data(); docId = slug; savedDocIdRef.current = slug }
        }

        if (d) {
          setExtraData({
            groomAr: d.groomAr || "",
            brideAr: d.brideAr || "",
            messageEn: d.message || "Together with their families",
            messageAr: d.messageAr || "معاً مع عائلتيهما",
            venue: d.venue || `${order.ceremonyPlace}, ${order.city}`,
            venueAr: d.venueAr || "",
            parentsEn: (d.parents || []).join("\n"),
            parentsAr: (d.parentsAr || []).join("\n"),
            quote: d.quote || "We love because he first loved us.",
            quoteAr: d.quoteAr || "نحن نحب لأنه هو أحبنا أولاً",
            quoteRef: d.quoteRef || "1 John 4:19",
            ceremonyPlaceAr: d.venues?.[0]?.placeAr || "",
            partyPlaceAr: d.venues?.[1]?.placeAr || "",
            ceremonyMapUrl: d.venues?.[0]?.map || "",
            partyMapUrl: d.venues?.[1]?.map || "",
            music: d.music || "",
            musicStart: d.musicStart ?? null,
            musicEnd: d.musicEnd ?? null,
            video: d.video || "",
            videoStart: d.videoStart ?? null,
            videoEnd: d.videoEnd ?? null,
            muteVideo: d.muteVideo ?? false,
            rsvpDeadline: d.rsvpDeadline || "",
            registryWishMoneyAcc: d.registry?.[0]?.acc || "",
            registryLink1: d.registry?.[0]?.link || "",
            registryLink2: d.registry?.[1]?.link || "",
            registryIban: d.registry?.[2]?.desc?.replace("iban: ", "") || "",
            tl0: d.timeline?.[0]?.time || "5:00 PM",    tl0loc: d.timeline?.[0]?.location || "",
            tl1: d.timeline?.[1]?.time || "7:00 PM",    tl1loc: d.timeline?.[1]?.location || "",
            tl2: d.timeline?.[2]?.time || "11:00 PM",   tl2loc: d.timeline?.[2]?.location || "",
            dressCode: d.dressCode || "",
            transport: d.transport || "",
            accommodation: d.accommodation || "",
            memoriesEnabled: d.memoriesEnabled ?? false,
          })
          if (d.photos?.length) setPhotos(d.photos)
          setSaved(true)
        }
      } catch (e) { /* no existing invitation */ }
      setLoading(false)
    }
    loadExisting()
  }, [])

  if (loading) return (
    <div className="border-t border-white/5 p-5">
      <p className="text-white/20 text-xs text-center animate-pulse">Loading...</p>
    </div>
  )

  const handlePhotoUpload = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const apiKey = import.meta.env.VITE_IMGBB_KEY
      const urls = await Promise.all(
        Array.from(files).slice(0, (tier === "bronze" ? 3 : 9) - photos.length).map(async (file) => {
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
      setPhotos(prev => [...prev, ...urls].slice(0, 9))
    } catch (e) {
      alert("Upload error: " + e.message)
    }
    setUploading(false)
  }


  const handleSaveDraft = async () => {
    if (!slug) return alert("Please enter an Invitation URL Slug first")
    setDraftSaving(true)
    try {
      const { setDoc, doc: firestoreDoc } = await import("firebase/firestore")
      const draftData = {
        groom: order.groomName,
        bride: order.brideName,
        groomAr: extraData.groomAr || order.groomName,
        brideAr: extraData.brideAr || order.brideName,
        message: extraData.messageEn,
        messageAr: extraData.messageAr,
        date: order.weddingDate + "T18:00:00",
        template: order.template,
        venue: extraData.venue,
        venueAr: extraData.venueAr || extraData.venue,
        quote: extraData.quote,
        quoteAr: extraData.quoteAr,
        quoteRef: extraData.quoteRef,
        music: extraData.music,
        musicStart: extraData.musicStart ?? null,
        musicEnd: extraData.musicEnd ?? null,
        video: extraData.video || "",
        videoStart: extraData.videoStart ?? null,
        videoEnd: extraData.videoEnd ?? null,
        muteVideo: extraData.muteVideo ?? false,
        rsvpDeadline: extraData.rsvpDeadline || "",
        parents: extraData.parentsEn ? extraData.parentsEn.split("\n") : [],
        parentsAr: extraData.parentsAr ? extraData.parentsAr.split("\n") : [],
        venues: [
          { label: "Wedding Ceremony", labelAr: "مراسم الزواج", time: order.ceremonyTime, place: order.ceremonyPlace, placeAr: extraData.ceremonyPlaceAr || order.ceremonyPlace, location: order.city, locationAr: extraData.venueAr || order.city, map: extraData.ceremonyMapUrl || null },
          { label: "Wedding Party", labelAr: "حفل الزفاف", time: order.partyTime, place: order.partyPlace, placeAr: extraData.partyPlaceAr || order.partyPlace, location: order.city, locationAr: extraData.venueAr || order.city, map: extraData.partyMapUrl || null },
        ],
        registry: [
          ...(extraData.registryLink1 || extraData.registryWishMoneyAcc ? [{ name: "Wish Money", icon: "💳", desc: extraData.registryWishMoneyAcc ? `Acc# ${extraData.registryWishMoneyAcc}` : "Contribute to our honeymoon fund", descAr: extraData.registryWishMoneyAcc ? `Acc# ${extraData.registryWishMoneyAcc}` : "ساهم في صندوق شهر العسل", link: extraData.registryLink1 || null, acc: extraData.registryWishMoneyAcc || null, color: "#c9a96e" }] : []),
          ...(extraData.registryLink2 ? [{ name: "Gift Registry", icon: "🎁", desc: "Browse our gift registry", descAr: "تصفح قائمة هداياي", link: extraData.registryLink2, color: "#c9a96e" }] : []),
          ...(extraData.registryIban ? [{ name: "Bank Transfer", icon: "🏦", desc: `iban: ${extraData.registryIban}`, descAr: `iban: ${extraData.registryIban}`, link: null, color: "#c9a96e" }] : []),
        ],
        timeline: [
          { time: extraData.tl0, label: "Ceremony",      labelAr: "مراسم الزواج",   icon: "💒", location: extraData.tl0loc, desc: extraData.tl0loc || "Join us as we say our vows" },
          { time: extraData.tl1, label: "Welcome Drink", labelAr: "مشروب الترحيب", icon: "🥂", location: extraData.tl1loc, desc: extraData.tl1loc || "Celebrate with drinks & canapés" },
          { time: extraData.tl2, label: "Party",         labelAr: "الحفلة",         icon: "🎉", location: extraData.tl2loc, desc: extraData.tl2loc || "Dance the night away with us" },
        ],
        dressCode: extraData.dressCode || "",
        transport: extraData.transport || "",
        accommodation: extraData.accommodation || "",
        memoriesEnabled: extraData.memoriesEnabled ?? false,
        orderId: order.id,
        package: order.package,
        _draft: true,
        ...(photos.length > 0 && { photos }),
      }
      await setDoc(firestoreDoc(db, "invitations", slug), draftData, { merge: true })
      // If slug changed, delete the old doc so it doesn't shadow the new one on reload
      if (savedDocIdRef.current && savedDocIdRef.current !== slug) {
        const { deleteDoc } = await import("firebase/firestore")
        await deleteDoc(firestoreDoc(db, "invitations", savedDocIdRef.current)).catch(() => {})
      }
      savedDocIdRef.current = slug
      // Persist the slug back to the order so it reloads correctly
      await updateDoc(firestoreDoc(db, "orders", order.id), { slug })
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 3000)
    } catch (e) {
      alert("Save draft error: " + e.message)
    }
    setDraftSaving(false)
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
        message: extraData.messageEn,
        messageAr: extraData.messageAr,
        date: order.weddingDate + "T18:00:00",
        template: order.template,
        venue: extraData.venue,
        venueAr: extraData.venueAr || extraData.venue,
        quote: extraData.quote,
        quoteAr: extraData.quoteAr,
        quoteRef: extraData.quoteRef,
        music: extraData.music,
        musicStart: extraData.musicStart ?? null,
        musicEnd: extraData.musicEnd ?? null,
        video: extraData.video || "",
        videoStart: extraData.videoStart ?? null,
        videoEnd: extraData.videoEnd ?? null,
        muteVideo: extraData.muteVideo ?? false,
        rsvpDeadline: extraData.rsvpDeadline || "",
        parents: extraData.parentsEn ? extraData.parentsEn.split("\n") : [],
        parentsAr: extraData.parentsAr ? extraData.parentsAr.split("\n") : [],
        venues: [
          { label: "Wedding Ceremony", labelAr: "مراسم الزواج", time: order.ceremonyTime, place: order.ceremonyPlace, placeAr: extraData.ceremonyPlaceAr || order.ceremonyPlace, location: order.city, locationAr: extraData.venueAr || order.city, map: extraData.ceremonyMapUrl || null },
          { label: "Wedding Party", labelAr: "حفل الزفاف", time: order.partyTime, place: order.partyPlace, placeAr: extraData.partyPlaceAr || order.partyPlace, location: order.city, locationAr: extraData.venueAr || order.city, map: extraData.partyMapUrl || null },
        ],
        registry: [
          ...(extraData.registryLink1 || extraData.registryWishMoneyAcc ? [{
            name: "Wish Money", icon: "💳",
            desc: extraData.registryWishMoneyAcc ? `Acc# ${extraData.registryWishMoneyAcc}` : "Contribute to our honeymoon fund",
            descAr: extraData.registryWishMoneyAcc ? `Acc# ${extraData.registryWishMoneyAcc}` : "ساهم في صندوق شهر العسل",
            link: extraData.registryLink1 || null,
            acc: extraData.registryWishMoneyAcc || null,
            color: "#c9a96e",
          }] : []),
          ...(extraData.registryLink2 ? [{ name: "Gift Registry", icon: "🎁", desc: "Browse our gift registry", descAr: "تصفح قائمة هداياي", link: extraData.registryLink2, color: "#c9a96e" }] : []),
          ...(extraData.registryIban ? [{ name: "Bank Transfer", icon: "🏦", desc: `iban: ${extraData.registryIban}`, descAr: `iban: ${extraData.registryIban}`, link: null, color: "#c9a96e" }] : []),
        ],
        timeline: [
          { time: extraData.tl0, label: "Ceremony",      labelAr: "مراسم الزواج",   icon: "💒", location: extraData.tl0loc, desc: extraData.tl0loc || "Join us as we say our vows" },
          { time: extraData.tl1, label: "Welcome Drink", labelAr: "مشروب الترحيب", icon: "🥂", location: extraData.tl1loc, desc: extraData.tl1loc || "Celebrate with drinks & canapés" },
          { time: extraData.tl2, label: "Party",         labelAr: "الحفلة",         icon: "🎉", location: extraData.tl2loc, desc: extraData.tl2loc || "Dance the night away with us" },
        ],
        dressCode: extraData.dressCode || "",
        transport: extraData.transport || "",
        accommodation: extraData.accommodation || "",
        memoriesEnabled: extraData.memoriesEnabled ?? false,
        slug,
        createdAt: new Date(),
        orderId: order.id,
        package: order.package,
        ...(photos.length > 0 && { photos }),
      }
      await setDoc(doc(db, "invitations", slug), invitationData)
      // If slug changed, delete the old doc so it doesn't shadow the new one on reload
      if (savedDocIdRef.current && savedDocIdRef.current !== slug) {
        const { deleteDoc } = await import("firebase/firestore")
        await deleteDoc(doc(db, "invitations", savedDocIdRef.current)).catch(() => {})
      }
      savedDocIdRef.current = slug
      // Auto-mark order as delivered
      await updateDoc(doc(db, "orders", order.id), { status: "delivered" })
      setSaved(true)
    } catch (e) {
      alert("Error: " + e.message)
    }
    setSaving(false)
  }

  const liveUrl = `https://www.lumivite.net/i/${slug}`
  const previewUrl = `https://www.lumivite.net/api/preview/${slug}`
  const dashboardUrl = `https://www.lumivite.net/dashboard/${slug}`

  return (
    <div className="border-t border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#c9a96e] text-xs uppercase tracking-widest font-semibold">🛠️ Build Invitation</p>
        <button onClick={handleSaveDraft} disabled={draftSaving}
          className="text-xs px-4 py-1.5 rounded-full font-medium transition disabled:opacity-50"
          style={{ background: draftSaved ? "rgba(74,222,128,0.15)" : "rgba(201,169,110,0.12)", border: `1px solid ${draftSaved ? "rgba(74,222,128,0.4)" : "rgba(201,169,110,0.35)"}`, color: draftSaved ? "#4ade80" : "#c9a96e" }}>
          {draftSaving ? "Saving…" : draftSaved ? "✓ Saved" : "💾 Save Draft"}
        </button>
      </div>

      {saved ? (
        <div className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#4ade80] font-medium">✅ Invitation is LIVE!</p>
            <button onClick={() => setSaved(false)}
              className="text-xs px-3 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition">
              ✏️ Edit
            </button>
          </div>
          <div className="space-y-2 mb-3">
            <div>
              <p className="text-white/30 text-xs mb-1">💌 Invitation Link (share with guests)</p>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#c9a96e] text-xs underline break-all">{liveUrl}</a>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-1">📊 RSVP Dashboard (for the couple)</p>
              <a href={dashboardUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#c9a96e] text-xs underline break-all">{dashboardUrl}</a>
            </div>
            {extraData.memoriesEnabled && (
              <div>
                <p className="text-white/30 text-xs mb-1">📸 Memory Wall (share with guests on the day)</p>
                <a href={`https://www.lumivite.net/memories/${slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-[#c9a96e] text-xs underline break-all">https://www.lumivite.net/memories/{slug}</a>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => navigator.clipboard.writeText(liveUrl).then(() => alert("Invitation link copied!"))}
              className="text-xs px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
              📋 Copy Invitation
            </button>
            <button onClick={() => navigator.clipboard.writeText(dashboardUrl).then(() => alert("Dashboard link copied!"))}
              className="text-xs px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
              📊 Copy Dashboard
            </button>
            {extraData.memoriesEnabled && (
              <button onClick={() => navigator.clipboard.writeText(`https://www.lumivite.net/memories/${slug}`).then(() => alert("Memory wall link copied!"))}
                className="text-xs px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition">
                📸 Copy Memories
              </button>
            )}
            <a href={`https://wa.me/${order.yourPhone?.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(`Hi ${order.yourName}! 🎉 Your wedding invitation is ready!\n\n💍 ${order.groomName} & ${order.brideName}\n\n📩 Invitation link (share with guests):\n${previewUrl}\n\n📊 Your RSVP dashboard (see who's attending):\n${dashboardUrl}\n\n🤍 Lumivite`)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-2 rounded-xl text-black font-medium transition"
              style={{ background: "#25D366" }}>
              💬 Send Both to Client
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Package badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold"
            style={{
              background: tier === "gold" ? "rgba(255,215,0,0.07)" : tier === "silver" ? "rgba(201,169,110,0.07)" : "rgba(205,127,50,0.07)",
              borderColor: tier === "gold" ? "rgba(255,215,0,0.3)" : tier === "silver" ? "rgba(201,169,110,0.3)" : "rgba(205,127,50,0.3)",
              color: tier === "gold" ? "#ffd700" : tier === "silver" ? "#c9a96e" : "#cd7f32",
            }}>
            {tier === "gold" ? "🥇 Gold Package" : tier === "silver" ? "🥈 Silver Package" : "🥉 Bronze Package"}
            <span className="font-normal opacity-60 ml-1">
              {tier === "bronze" ? "· No music · Cover photo only (3 max) · No maps · No registry · No memory wall"
               : tier === "silver" ? "· Music ✓ · Full gallery (9 photos) ✓ · Guest links ✓ · No maps · No registry · No memory wall"
               : "· All features unlocked"}
            </span>
          </div>

          {/* Slug */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Invitation URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-white/20 text-sm">lumivite.net/i/</span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
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

          {/* Sub-heading message */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Sub-heading (English)</label>
              <input value={extraData.messageEn} onChange={e => update("messageEn", e.target.value)}
                placeholder="Together with their families"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Sub-heading (Arabic)</label>
              <input value={extraData.messageAr} onChange={e => update("messageAr", e.target.value)}
                placeholder="معاً مع عائلتيهما" dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
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
          <div>
            <label className="text-white/30 text-xs mb-1 block">Quote Author / Reference</label>
            <input value={extraData.quoteRef} onChange={e => update("quoteRef", e.target.value)}
              placeholder="1 John 4:19"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>

          {/* Music — Silver and Gold only */}
          {tier !== "bronze" && <div>
            <label className="text-white/30 text-xs mb-1 block">Music URL (optional)</label>
            <input value={extraData.music} onChange={e => update("music", e.target.value)}
              placeholder="https://... or leave empty for default"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            <p className="text-white/20 text-xs mt-1">🎵 Music Clip (optional) — start &amp; end in seconds (e.g. 30 → 90 plays only that segment)</p>
            <div className="flex gap-3 mt-2">
              <div className="flex-1">
                <label className="text-white/25 text-xs mb-1 block">Start (seconds)</label>
                <input type="number" min="0" value={extraData.musicStart ?? ""} onChange={e => update("musicStart", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div className="flex-1">
                <label className="text-white/25 text-xs mb-1 block">End (seconds)</label>
                <input type="number" min="0" value={extraData.musicEnd ?? ""} onChange={e => update("musicEnd", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="leave empty to play full track"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>
            </div>
          </div>}

          {/* RSVP Deadline */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">RSVP Deadline</label>
            <input type="date" value={extraData.rsvpDeadline} onChange={e => update("rsvpDeadline", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>

          {/* Video + Clip + Mute — for Cinematic Sand template */}
          {order.template === "sand" && (
            <>
              <div>
                <label className="text-white/30 text-xs mb-1 block">🎬 Wedding Video URL <span className="text-white/20">(YouTube, Vimeo, or direct MP4 link)</span></label>
                <input value={extraData.video || ""} onChange={e => update("video", e.target.value)}
                  placeholder="https://youtu.be/... or https://vimeo.com/... or https://example.com/video.mp4"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>


              {/* Clip start/end */}
              <div>
                <label className="text-white/30 text-xs mb-1 block">✂️ Video Clip (optional) <span className="text-white/20">— start &amp; end in seconds (e.g. 30 → 90 plays only that segment)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/20 text-xs mb-1 block">Start (seconds)</label>
                    <input type="number" min="0" value={extraData.videoStart ?? ""} onChange={e => update("videoStart", e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="e.g. 30"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
                  </div>
                  <div>
                    <label className="text-white/20 text-xs mb-1 block">End (seconds)</label>
                    <input type="number" min="0" value={extraData.videoEnd ?? ""} onChange={e => update("videoEnd", e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="e.g. 90"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
                  </div>
                </div>
              </div>

              {/* Mute video checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                <input type="checkbox" checked={extraData.muteVideo ?? false} onChange={e => update("muteVideo", e.target.checked)}
                  className="w-4 h-4 rounded accent-[#c9a96e]" />
                <div>
                  <p className="text-white/60 text-sm">🔇 Mute video &amp; play background music</p>
                  <p className="text-white/25 text-xs mt-0.5">Check this if the couple wants their chosen music instead of the original video audio</p>
                </div>
              </label>
            </>
          )}

          {/* Venue details */}
          <p className="text-white/20 text-xs uppercase tracking-widest pt-1">📍 Venue Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Hero Location Text (English)</label>
              <input value={extraData.venue} onChange={e => update("venue", e.target.value)}
                placeholder="Saint Georges Church, Feytroun, Lebanon"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Hero Location Text (Arabic)</label>
              <input value={extraData.venueAr} onChange={e => update("venueAr", e.target.value)}
                placeholder="كنيسة مار جرجس، فيترون، لبنان" dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Ceremony Place (Arabic)</label>
              <input value={extraData.ceremonyPlaceAr} onChange={e => update("ceremonyPlaceAr", e.target.value)}
                placeholder="كنيسة مار جرجس" dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Party Place (Arabic)</label>
              <input value={extraData.partyPlaceAr} onChange={e => update("partyPlaceAr", e.target.value)}
                placeholder="بوا دو روز" dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
          </div>
          {tier === "gold" && <>
          <div>
            <label className="text-white/30 text-xs mb-1 block">Ceremony — Google Maps URL</label>
            <input value={extraData.ceremonyMapUrl} onChange={e => update("ceremonyMapUrl", e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>
          <div>
            <label className="text-white/30 text-xs mb-1 block">Party — Google Maps URL</label>
            <input value={extraData.partyMapUrl} onChange={e => update("partyMapUrl", e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>
          </>}

          {/* Gift Registry — Gold only */}
          {tier === "gold" && <p className="text-white/20 text-xs uppercase tracking-widest pt-1">🎁 Gift Registry</p>}
          {tier === "gold" && <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Wish Money Account #</label>
              <input value={extraData.registryWishMoneyAcc} onChange={e => update("registryWishMoneyAcc", e.target.value)}
                placeholder="21055323"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Wish Money Link (optional)</label>
              <input value={extraData.registryLink1} onChange={e => update("registryLink1", e.target.value)}
                placeholder="https://www.wishmoney.io/..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
          </div>
          <div>
            <label className="text-white/30 text-xs mb-1 block">Gift Store Link (optional)</label>
            <input value={extraData.registryLink2} onChange={e => update("registryLink2", e.target.value)}
              placeholder="https://www.abc.com.lb/..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
          </div>
          <div>
            <label className="text-white/30 text-xs mb-1 block">Bank Transfer IBAN</label>
            <input value={extraData.registryIban} onChange={e => update("registryIban", e.target.value)}
              placeholder="LB62 0099 0000 0001 0019 2000 9123"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#c9a96e]" />
          </div>
          </>}

          {/* Wedding Timeline */}
          <p className="text-white/20 text-xs uppercase tracking-widest pt-1">🕐 Wedding Day Timeline</p>
          {[["Ceremony", "tl0"], ["Welcome Drink", "tl1"], ["Party", "tl2"]].map(([label, key]) => (
            <div key={key} className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-xs mb-1 block">{label} — Time</label>
                <input value={extraData[key]} onChange={e => update(key, e.target.value)}
                  placeholder="6:00 PM"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-white/30 text-xs mb-1 block">{label} — Location</label>
                <input value={extraData[key + "loc"]} onChange={e => update(key + "loc", e.target.value)}
                  placeholder="Venue name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
              </div>
            </div>
          ))}

          {/* Details slide — only for Cinematic Sand & Seal (invitation4) */}
          {order.template === "sand" && (<>
            <p className="text-white/20 text-xs uppercase tracking-widest pt-1">📋 Details Slide</p>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Dress Code</label>
              <input value={extraData.dressCode} onChange={e => update("dressCode", e.target.value)}
                placeholder="Black Tie"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Transportation</label>
              <input value={extraData.transport} onChange={e => update("transport", e.target.value)}
                placeholder="Shuttle from Jounieh at 6:00 PM"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div>
              <label className="text-white/30 text-xs mb-1 block">Accommodation</label>
              <input value={extraData.accommodation} onChange={e => update("accommodation", e.target.value)}
                placeholder="Kempinski Hotel — special rates"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
          </>)}

          {/* Memories feature toggle — Gold only */}
          {tier === "gold" && <div className="border border-white/8 rounded-xl p-4" style={{ background: "rgba(196,163,90,0.03)" }}>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={extraData.memoriesEnabled ?? false} onChange={e => update("memoriesEnabled", e.target.checked)}
                className="w-4 h-4 rounded accent-[#c9a96e]" />
              <div>
                <p className="text-white/60 text-sm">📸 Enable Guest Memory Upload</p>
                <p className="text-white/25 text-xs mt-0.5">Guests can upload photos from the wedding to a shared memory wall — visible in the couple's dashboard</p>
              </div>
            </label>
            {extraData.memoriesEnabled && slug && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-white/30 text-xs mb-1">Memory Wall Link (share with guests on wedding day)</p>
                <p className="text-[#c4a35a] text-xs font-mono break-all">https://www.lumivite.net/memories/{slug}</p>
              </div>
            )}
          </div>}

          {/* Photo Upload */}
          <div>
            <label className="text-white/30 text-xs mb-1 block">Client Photos — {tier === "bronze" ? `Cover & Venue (${photos.length}/3)` : `Gallery (${photos.length}/9)`} · drag to reorder</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoUpload(e.target.files)} />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={url} draggable
                    onDragStart={e => e.dataTransfer.setData("text/plain", i)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const from = parseInt(e.dataTransfer.getData("text/plain"))
                      if (from === i) return
                      setPhotos(p => {
                        const arr = [...p]
                        arr.splice(i, 0, arr.splice(from, 1)[0])
                        return arr
                      })
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing">
                    <img src={url} alt={`photo ${i+1}`} className="w-full h-full object-cover object-top pointer-events-none" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                    <div className="absolute top-1 left-1 bg-black/60 text-white/60 text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {i + 1}
                    </div>
                    <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || photos.length >= (tier === "bronze" ? 3 : 9)}
              className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/40 text-sm hover:border-[#c9a96e]/50 hover:text-[#c9a96e]/70 transition disabled:opacity-30">
              {uploading ? "Uploading..." : photos.length >= (tier === "bronze" ? 3 : 9) ? `Max ${tier === "bronze" ? 3 : 9} photos` : "📷 Upload Photos"}
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
  const [rsvpWedding, setRsvpWedding] = useState("all")
  const [guestSlug, setGuestSlug] = useState("")
  const [guestLines, setGuestLines] = useState("")
  const [guestCopied, setGuestCopied] = useState(null)
  const [orderPage, setOrderPage] = useState(0)
  const ORDERS_PER_PAGE = 15

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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (e) { alert("Error: " + e.message) }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Delete this order? This will also delete the invitation and all RSVPs. Cannot be undone.")) return
    try {
      const order = orders.find(o => o.id === orderId)
      const slug = `${order.groomName?.toLowerCase()}-${order.brideName?.toLowerCase()}`.replace(/\s/g, "")
      const weddingName = `${order.groomName} & ${order.brideName}`

      // Delete invitation
      await deleteDoc(doc(db, "invitations", slug)).catch(() => {})

      // Delete all RSVPs for this wedding
      const rsvpSnap = await getDocs(query(collection(db, "rsvps"), where("wedding", "==", weddingName)))
      await Promise.all(rsvpSnap.docs.map(d => deleteDoc(doc(db, "rsvps", d.id))))

      // Delete the order
      await deleteDoc(doc(db, "orders", orderId))

      setOrders(prev => prev.filter(o => o.id !== orderId))
      setRsvps(prev => prev.filter(r => r.wedding !== weddingName))
      if (selectedOrder?.id === orderId) setSelectedOrder(null)
    } catch (e) { alert("Error: " + e.message) }
  }

  const handleDeleteRsvp = async (rsvpId) => {
    if (!confirm("Remove this RSVP?")) return
    try {
      await deleteDoc(doc(db, "rsvps", rsvpId))
      setRsvps(prev => prev.filter(r => r.id !== rsvpId))
    } catch (e) { alert("Error: " + e.message) }
  }

  const exportRSVP = () => {
    const filtered = filteredRsvps
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

  const weddings = orders.map(o => `${o.groomName} & ${o.brideName}`)
  const weddingRsvps = rsvpWedding === "all" ? rsvps : rsvps.filter(r => r.wedding === rsvpWedding)

  const attending = weddingRsvps.filter(r => r.attending).length
  const declined = weddingRsvps.filter(r => !r.attending).length
  const totalPersons = weddingRsvps.filter(r => r.attending).reduce((sum, r) => sum + (r.persons || 1), 0)

  const packageColor = { bronze: "#cd7f32", silver: "#c9a96e", gold: "#ffd700" }
  const templateIcon = { dark: "🌑", botanical: "🌿", rosegold: "🌸", sand: "🏺" }
  const templateName = { dark: "Dark Luxury", botanical: "Botanical", rosegold: "Rose Gold", sand: "Cinematic Sand & Seal" }

  const filteredRsvps = weddingRsvps.filter(r => rsvpFilter === "all" ? true : rsvpFilter === "attending" ? r.attending : !r.attending)

  const guestLinks = guestLines
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(",")
      const name = parts[0].trim()
      const persons = parseInt(parts[1]?.trim()) || 1
      const url = `https://www.lumivite.net/i/${guestSlug}?gn=${encodeURIComponent(name)}&np=${persons}`
      return { name, persons, url }
    })

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
            { id: "guests", label: "Guest Links", icon: "🔗" },
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
                    {orders.slice(orderPage * ORDERS_PER_PAGE, (orderPage + 1) * ORDERS_PER_PAGE).map(order => (
                      <motion.div key={order.id} layout
                        className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-[#c9a96e]/20 transition cursor-pointer"
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
                        <div className="p-5 flex items-center gap-4">
                          <div className="text-2xl">{templateIcon[order.template] || "💍"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-white">{order.groomName} & {order.brideName}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: `${packageColor[order.package]}20`, color: packageColor[order.package] }}>
                                {order.package?.toUpperCase()}
                              </span>
                              <span className="text-xs text-white/30">
                                {templateName[order.template]}
                              </span>
                              {(() => {
                                const s = STATUS_CONFIG[order.status || "pending_payment"]
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: s.bg, color: s.color }}>
                                    {s.label}
                                  </span>
                                )
                              })()}
                            </div>
                            <p className="text-white/40 text-sm truncate">
                              👤 {order.yourName} · 📞 {order.yourPhone} · 📅 {order.weddingDate}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                            <p className="text-[#c9a96e] font-semibold">
                              {order.package === "bronze" ? "$89" : order.package === "silver" ? "$139" : "$199"}
                            </p>
                            <p className="text-white/30 text-xs">
                              {order.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                            </p>
                            {(!order.status || order.status === "pending_payment") && (
                              <button
                                onClick={e => { e.stopPropagation(); handleStatusChange(order.id, "paid") }}
                                className="text-xs px-3 py-1 rounded-lg font-semibold transition"
                                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
                                ✅ Confirm Payment
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedOrder?.id === order.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              onClick={e => e.stopPropagation()}
                              className="border-t border-white/5 overflow-hidden">
                              <OrderEditSection order={order} onSave={updated => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updated } : o))} />
                              {/* Status buttons */}
                              <div className="px-5 pb-3">
                                <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Order Status</p>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <button key={key}
                                      onClick={() => handleStatusChange(order.id, key)}
                                      className="text-xs px-3 py-1.5 rounded-xl font-medium transition border"
                                      style={{
                                        background: (order.status || "pending_payment") === key ? cfg.bg : "transparent",
                                        color: (order.status || "pending_payment") === key ? cfg.color : "rgba(255,255,255,0.3)",
                                        borderColor: (order.status || "pending_payment") === key ? cfg.color : "rgba(255,255,255,0.1)",
                                      }}>
                                      {cfg.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="px-5 pb-5 flex gap-3">
                                <a href={`https://wa.me/${order.yourPhone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${order.yourName}! 👋 Thank you for ordering your wedding invitation with Lumivite! We're working on ${order.groomName} & ${order.brideName}'s invitation and will send you a preview soon. 💍`)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition text-black font-medium"
                                  style={{ background: "#25D366" }}>
                                  💬 WhatsApp Client
                                </a>
                                <button onClick={() => handleDeleteOrder(order.id)}
                                  className="text-sm px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                                  🗑 Delete Order
                                </button>
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
                {/* Pagination */}
                {orders.length > ORDERS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => setOrderPage(p => Math.max(0, p - 1))} disabled={orderPage === 0}
                      className="px-4 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition disabled:opacity-30">
                      ← Prev
                    </button>
                    <span className="text-white/30 text-sm">
                      Page {orderPage + 1} of {Math.ceil(orders.length / ORDERS_PER_PAGE)}
                    </span>
                    <button onClick={() => setOrderPage(p => Math.min(Math.ceil(orders.length / ORDERS_PER_PAGE) - 1, p + 1))} disabled={orderPage >= Math.ceil(orders.length / ORDERS_PER_PAGE) - 1}
                      className="px-4 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:border-[#c9a96e] hover:text-[#c9a96e] transition disabled:opacity-30">
                      Next →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* RSVPs TAB */}
            {tab === "rsvps" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Wedding Selector */}
                {weddings.length > 1 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => { setRsvpWedding("all"); setRsvpFilter("all") }}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition"
                      style={{ background: rsvpWedding === "all" ? "#c9a96e" : "rgba(255,255,255,0.05)", color: rsvpWedding === "all" ? "black" : "rgba(255,255,255,0.5)" }}>
                      💍 All Weddings
                    </button>
                    {weddings.map(w => (
                      <button key={w} onClick={() => { setRsvpWedding(w); setRsvpFilter("all") }}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition"
                        style={{ background: rsvpWedding === w ? "#c9a96e" : "rgba(255,255,255,0.05)", color: rsvpWedding === w ? "black" : "rgba(255,255,255,0.5)" }}>
                        💒 {w}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex gap-2">
                    {[
                      { id: "all", label: `All (${weddingRsvps.length})` },
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
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${rsvp.attending ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-red-400/15 text-red-400"}`}>
                            {rsvp.attending ? `✓ ${rsvp.persons || 1} person${(rsvp.persons || 1) > 1 ? "s" : ""}` : "Declined"}
                          </span>
                          <p className="text-white/20 text-xs">
                            {rsvp.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                          </p>
                          <button onClick={() => handleDeleteRsvp(rsvp.id)}
                            className="text-xs text-red-400/50 hover:text-red-400 transition">
                            🗑
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {/* GUEST LINKS TAB */}
            {tab === "guests" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="max-w-2xl">
                  <p className="text-white/40 text-sm mb-6">
                    Generate a personalized invitation link per guest — their name will be pre-filled in the RSVP form automatically.
                  </p>

                  {/* Invitation selector */}
                  <div className="mb-4">
                    <label className="text-white/30 text-xs uppercase tracking-widest mb-2 block">Select Wedding</label>
                    <select value={guestSlug} onChange={e => setGuestSlug(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#c9a96e]"
                      style={{ colorScheme: "dark" }}>
                      <option value="">— Select a wedding —</option>
                      {orders.map(o => {
                        const slug = `${o.groomName?.toLowerCase()}-${o.brideName?.toLowerCase()}`.replace(/\s/g, "")
                        return <option key={o.id} value={slug}>{o.groomName} & {o.brideName}</option>
                      })}
                    </select>
                  </div>

                  {/* Slug override */}
                  <div className="mb-6">
                    <label className="text-white/30 text-xs uppercase tracking-widest mb-2 block">
                      Slug <span className="text-white/20 normal-case font-normal">(auto-filled — override if you used a custom slug)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/20 text-sm whitespace-nowrap">lumivite.net/i/</span>
                      <input value={guestSlug} onChange={e => setGuestSlug(e.target.value)}
                        placeholder="e.g. john-sarah"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#c9a96e]" />
                    </div>
                  </div>

                  {/* Guest names input */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/30 text-xs uppercase tracking-widest">
                        Guest List <span className="text-white/20 normal-case font-normal">(one per line — add ", 2" for couples/families)</span>
                      </label>
                      <label className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5"
                        style={{ borderColor: "rgba(201,169,110,0.3)", color: "#c9a96e", background: "rgba(201,169,110,0.06)" }}>
                        📂 Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={e => {
                          const file = e.target.files[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = ev => {
                            const lines = ev.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
                            // Skip header row if first cell looks like "name"/"guest"
                            const start = /^(name|guest|full.?name)/i.test(lines[0]?.split(",")[0]) ? 1 : 0
                            setGuestLines(lines.slice(start).join("\n"))
                          }
                          reader.readAsText(file)
                          e.target.value = ""
                        }} />
                      </label>
                    </div>
                    <textarea value={guestLines} onChange={e => setGuestLines(e.target.value)}
                      placeholder={"Sarah & Michael\nJohn Smith, 2\nNadia Haddad\nThe Abboud Family, 4\nLara Khoury"}
                      rows={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#c9a96e] resize-none font-mono" />
                    <p className="text-white/20 text-xs mt-1">
                      {guestLines.split("\n").filter(l => l.trim()).length} guests · Format: <span className="font-mono">Name</span> or <span className="font-mono">Name, 2</span>
                    </p>
                  </div>

                  {/* Generated links */}
                  {guestLinks.length > 0 && guestSlug && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[#c9a96e] text-xs uppercase tracking-widest">{guestLinks.length} Personalized Links</p>
                        <button
                          onClick={() => {
                            const all = guestLinks.map(g => `${g.name}:\n${g.url}`).join("\n\n")
                            navigator.clipboard.writeText(all)
                            setGuestCopied("all")
                            setTimeout(() => setGuestCopied(null), 2000)
                          }}
                          className="text-xs px-4 py-2 rounded-xl border transition"
                          style={{
                            borderColor: guestCopied === "all" ? "rgba(74,222,128,0.4)" : "rgba(201,169,110,0.3)",
                            color: guestCopied === "all" ? "#4ade80" : "#c9a96e",
                            background: guestCopied === "all" ? "rgba(74,222,128,0.08)" : "rgba(201,169,110,0.06)"
                          }}>
                          {guestCopied === "all" ? "✓ Copied All!" : "📋 Copy All Links"}
                        </button>
                      </div>

                      <div className="grid gap-2">
                        {guestLinks.map((g, i) => (
                          <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3 hover:border-white/15 transition">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">
                                {g.name}
                                {g.persons > 1 && <span className="text-white/40 text-xs ml-2">({g.persons} persons)</span>}
                              </p>
                              <p className="text-white/25 text-xs truncate font-mono mt-0.5">{g.url}</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(g.url)
                                setGuestCopied(i)
                                setTimeout(() => setGuestCopied(null), 2000)
                              }}
                              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition"
                              style={{
                                borderColor: guestCopied === i ? "rgba(74,222,128,0.4)" : "rgba(201,169,110,0.3)",
                                color: guestCopied === i ? "#4ade80" : "#c9a96e",
                                background: guestCopied === i ? "rgba(74,222,128,0.08)" : "rgba(201,169,110,0.06)"
                              }}>
                              {guestCopied === i ? "✓" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guestLinks.length > 0 && !guestSlug && (
                    <p className="text-yellow-400/60 text-sm text-center py-4">Select a wedding above to generate links.</p>
                  )}
                </div>
              </motion.div>
            )}

          </>
        )}
      </div>
    </div>
  )
}