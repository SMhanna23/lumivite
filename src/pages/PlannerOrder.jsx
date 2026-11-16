import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import Order from "./Order"

export default function PlannerOrder() {
  const { linkId } = useParams()
  const [status, setStatus] = useState("loading") // loading | notfound | ready
  const [preset, setPreset] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/planner-link?id=${encodeURIComponent(linkId)}`)
        if (!res.ok) { setStatus("notfound"); return }
        const d = await res.json()
        setPreset({ ...d, linkId })
        setStatus("ready")
      } catch {
        setStatus("notfound")
      }
    }
    load()
  }, [linkId])

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
      <p className="text-[#c9a96e] font-serif text-xl animate-pulse">Loading...</p>
    </div>
  )

  if (status === "notfound") return (
    <div className="min-h-screen bg-[#0a0806] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-4xl">🔗</p>
      <p className="text-white font-serif text-2xl">Link not found</p>
      <p className="text-white/40 text-sm">This order link may be incorrect or expired. Please contact Lumivite.</p>
    </div>
  )

  return <Order plannerPreset={preset} />
}
