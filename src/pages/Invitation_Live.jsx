import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import Invitation from "./Invitation"
import Invitation2 from "./Invitation2"
import Invitation3 from "./Invitation3"
import Invitation4 from "./Invitation4"

export default function Invitation_Live() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState("loading") // loading | found | notfound

  // Clean up ?_app=1 that preview.js adds for routing bypass, preserving other params (gn, np)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has("_app")) {
      url.searchParams.delete("_app")
      const query = url.searchParams.toString()
      window.history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash)
    }
  }, [])

  useEffect(() => {
    const fetch = async () => {
      try {
        const ref = doc(db, "invitations", slug)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setData(snap.data())
          setStatus("found")
        } else {
          setStatus("notfound")
        }
      } catch (e) {
        setStatus("notfound")
      }
    }
    fetch()
  }, [slug])

  if (status === "loading") return (
    <div className="min-h-screen bg-[#0d0a08] flex items-center justify-center">
      <div className="text-[#c9a96e] font-serif text-2xl animate-pulse">Loading your invitation...</div>
    </div>
  )

  if (status === "notfound") return (
    <div className="min-h-screen bg-[#0d0a08] flex flex-col items-center justify-center gap-4">
      <p className="text-6xl">💍</p>
      <p className="text-white font-serif text-2xl">Invitation not found</p>
      <p className="text-white/40 text-sm">The link may be incorrect or expired.</p>
      <a href="/" className="mt-4 text-[#c9a96e] text-sm border border-[#c9a96e]/30 px-6 py-2 rounded-full hover:bg-[#c9a96e]/10 transition">
        Back to Lumivite
      </a>
    </div>
  )

  // Pass client data as props override — Bronze is always forced to the default dark template
  const pkg = (data.package || "gold").toLowerCase()
  const tier = pkg.includes("gold") ? "gold" : pkg.includes("silver") ? "silver" : "bronze"
  const template = data.template || "dark"
  if (tier !== "bronze") {
    if (template === "botanical") return <Invitation2 override={data} />
    if (template === "rosegold") return <Invitation3 override={data} />
    if (template === "sand") return <Invitation4 override={data} />
  }
  return <Invitation override={data} />
}