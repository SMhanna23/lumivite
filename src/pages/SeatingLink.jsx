import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import SeatingEditor, { emptySeating } from "../components/SeatingEditor"

export default function SeatingLink() {
  const { slug } = useParams()
  const [status, setStatus] = useState("loading") // loading | notfound | ready
  const [seating, setSeating] = useState(null)
  const [coupleName, setCoupleName] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "invitations", slug))
        if (!snap.exists()) { setStatus("notfound"); return }
        const d = snap.data()
        setCoupleName(
          d.template === "birthday" ? d.name
          : d.template === "occasion" ? d.title
          : `${d.groom} & ${d.bride}`
        )
        setSeating({ ...emptySeating(), ...(d.seating || {}) })
        setStatus("ready")
      } catch {
        setStatus("notfound")
      }
    }
    load()
  }, [slug])

  const onSave = useCallback(async (next) => {
    await fetch("/api/seating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, seating: next }),
    })
  }, [slug])

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0c0b09] flex items-center justify-center">
      <p className="text-[#c9a96e] font-serif text-xl animate-pulse">Loading seating plan...</p>
    </div>
  )

  if (status === "notfound") return (
    <div className="min-h-screen bg-[#0c0b09] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">🪑</p>
      <p className="text-white font-serif text-2xl">Seating link not found</p>
      <p className="text-white/40 text-sm">The link may be incorrect or expired.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0b09] text-white" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="text-center pt-10 pb-4 px-6"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1a1508, #0c0b09)" }}>
        <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase mb-2">Seating Plan</p>
        <h1 className="font-serif text-3xl font-light text-white">{coupleName}</h1>
      </div>
      <SeatingEditor
        docId={slug}
        initialSeating={seating}
        onSave={onSave}
        title="🪑 Seating Arrangement"
      />
    </div>
  )
}
