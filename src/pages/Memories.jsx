import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { motion } from "framer-motion"

export default function Memories() {
  const { slug } = useParams()
  const isDemo = slug?.startsWith("demo")
  const [wedding, setWedding] = useState(null)
  const [memories, setMemories] = useState([])
  const [status, setStatus] = useState("loading")
  const [guestName, setGuestName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [justUploaded, setJustUploaded] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        if (!isDemo) {
          const snap = await getDoc(doc(db, "invitations", slug))
          if (snap.exists()) {
            const d = snap.data()
            if (!d.memoriesEnabled) { setStatus("disabled"); return }
            setWedding(d)
          }
        }
        const mSnap = await getDocs(query(collection(db, "memories"), where("slug", "==", slug)))
        setMemories(
          mSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0))
        )
        setStatus("ready")
      } catch {
        setStatus("ready")
      }
    }
    load()
  }, [slug, isDemo])

  const handleUpload = async (files) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const apiKey = import.meta.env.VITE_IMGBB_KEY
      const urls = await Promise.all(
        Array.from(files).slice(0, 10).map(async (file) => {
          const formData = new FormData()
          formData.append("image", file)
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData })
          const data = await res.json()
          if (!data.success) throw new Error(data.error?.message || "Upload failed")
          return data.data.url
        })
      )
      await Promise.all(urls.map(url =>
        addDoc(collection(db, "memories"), {
          slug,
          url,
          guestName: guestName.trim() || "A Guest",
          uploadedAt: serverTimestamp(),
        })
      ))
      setMemories(prev => [
        ...urls.map(url => ({ url, guestName: guestName.trim() || "A Guest", id: Math.random().toString() })),
        ...prev,
      ])
      setJustUploaded(true)
      setTimeout(() => setJustUploaded(false), 3000)
    } catch (e) {
      alert("Upload failed: " + e.message)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0c0b09] flex items-center justify-center">
      <p className="text-[#c4a35a] font-serif text-xl animate-pulse">Loading memories...</p>
    </div>
  )

  if (status === "disabled") return (
    <div className="min-h-screen bg-[#0c0b09] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">📸</p>
      <p className="text-white font-serif text-2xl">Memory upload not available</p>
      <p className="text-white/40 text-sm">This feature hasn't been enabled for this invitation.</p>
    </div>
  )

  const couple = wedding ? `${wedding.groom} & ${wedding.bride}` : "The Happy Couple"

  return (
    <div className="min-h-screen bg-[#0c0b09] text-white" style={{ fontFamily: "'Jost', sans-serif" }}>

      {/* Header */}
      <div className="text-center pt-16 pb-10 px-6"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1a1508, #0c0b09)" }}>
        <p className="text-[#c4a35a] tracking-[0.3em] text-xs uppercase mb-3">Wedding Memories</p>
        <h1 className="font-serif text-4xl font-light text-white mb-3">{couple}</h1>
        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
          Share your photos from our special day — your memories mean the world to us.
        </p>
      </div>

      <div className="max-w-xl mx-auto px-6 pb-20">

        {/* Upload card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-10"
          style={{ background: "rgba(196,163,90,0.04)", border: "1px solid rgba(196,163,90,0.2)" }}>
          <p className="text-[#c4a35a] text-sm font-medium mb-4">📸 Upload Your Photos</p>

          <div className="mb-4">
            <label className="text-white/40 text-xs mb-1 block">Your Name (optional)</label>
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="e.g. John & Mary"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#c4a35a]"
            />
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleUpload(e.target.files)} />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 rounded-xl font-semibold text-sm tracking-wider transition disabled:opacity-50"
            style={{ background: justUploaded ? "rgba(74,222,128,0.12)" : "rgba(196,163,90,0.12)", border: `1px solid ${justUploaded ? "rgba(74,222,128,0.4)" : "rgba(196,163,90,0.35)"}`, color: justUploaded ? "#4ade80" : "#c4a35a" }}>
            {uploading ? "Uploading..." : justUploaded ? "✓ Photos Shared! Thank you 🤍" : "📷 Choose Photos to Upload"}
          </button>
          <p className="text-white/20 text-xs text-center mt-2">You can select multiple photos at once</p>
        </motion.div>

        {/* Gallery */}
        {memories.length > 0 ? (
          <>
            <p className="text-[#c4a35a] text-xs tracking-widest uppercase mb-4">
              {memories.length} Memor{memories.length === 1 ? "y" : "ies"} Shared
            </p>
            <div className="columns-2 gap-3">
              {memories.map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="break-inside-avoid mb-3 rounded-xl overflow-hidden relative group">
                  <img src={m.url} alt="memory" className="w-full object-cover" loading="lazy" />
                  {m.guestName && m.guestName !== "A Guest" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition">
                      <p className="text-white text-xs">{m.guestName}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📸</p>
            <p className="text-white/20 text-sm">Be the first to share a memory!</p>
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-white/20 text-xs border-t border-white/5">
        Made with ✦ by <span style={{ color: "#c4a35a" }}>Lumivite</span>
      </footer>
    </div>
  )
}
