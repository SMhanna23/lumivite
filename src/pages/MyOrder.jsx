import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { motion } from "framer-motion"

const STATUS_STEPS = ["pending_payment", "paid", "in_progress", "delivered"]
const STATUS_LABELS = {
  pending_payment: { label: "Awaiting Payment", icon: "⏳", desc: "We'll contact you on WhatsApp shortly to arrange payment." },
  paid:            { label: "Payment Confirmed", icon: "✅", desc: "Payment received! We're now building your invitation." },
  in_progress:     { label: "In Progress", icon: "🎨", desc: "We're crafting your invitation — almost ready!" },
  delivered:       { label: "Delivered!", icon: "🎉", desc: "Your invitation is live and ready to share!" },
}

export default function MyOrder() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) return
    const unsub = onSnapshot(doc(db, "orders", orderId), snap => {
      if (!snap.exists()) { setNotFound(true); return }
      setOrder({ id: snap.id, ...snap.data() })
    })
    return () => unsub()
  }, [orderId])

  useEffect(() => {
    if (!order || order.status === "pending_payment") return
    getDocs(query(collection(db, "invitations"), where("orderId", "==", orderId)))
      .then(snap => setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [order?.status, orderId])

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center text-center px-6">
      <div>
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="font-serif text-2xl text-white mb-2">Order Not Found</h1>
        <p className="text-white/40 text-sm">Check your link or contact us on WhatsApp.</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#c9a96e] border-t-transparent animate-spin" />
    </div>
  )

  const status = order.status || "pending_payment"
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.pending_payment
  const currentStep = STATUS_STEPS.indexOf(status)

  return (
    <div className="min-h-screen bg-[#0a0806] text-white"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0f07 0%, #0a0806 60%)" }}>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-6">
        <a href="/" className="text-[#c9a96e] font-serif text-2xl">Lumivite</a>
        <p className="text-white/30 text-xs mt-1 tracking-widest uppercase">Your Order</p>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-24">

        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/3 border border-white/10 rounded-3xl p-8 mb-6 text-center">
          <div className="text-5xl mb-4">{statusInfo.icon}</div>
          <h1 className="font-serif text-3xl font-light text-white mb-2">{statusInfo.label}</h1>
          <p className="text-white/50 text-sm">{statusInfo.desc}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-8">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-1.5 rounded-full transition-all duration-500"
                style={{ background: i <= currentStep ? "#c9a96e" : "rgba(255,255,255,0.08)" }} />
              <span className="text-white/30 text-xs hidden sm:block">
                {STATUS_LABELS[s].label.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">Order Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/40">Couple</span><span className="text-white">{order.groomName} & {order.brideName}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Package</span><span className="text-white capitalize">{order.package}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Wedding Date</span><span className="text-white">{order.weddingDate}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Order ID</span><span className="text-white/40 font-mono text-xs">{orderId}</span></div>
          </div>
        </div>

        {/* Invitation Links — shown when delivered */}
        {status === "delivered" && invitations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/3 border border-[#c9a96e]/20 rounded-2xl p-5 mb-6">
            <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-4">Your Invitation Links</p>
            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{inv.guestName || "Shared Link"}</p>
                    <p className="text-white/30 text-xs">/i/{inv.slug}</p>
                  </div>
                  <a href={`/i/${inv.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>
                    Open →
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pending Payment — WhatsApp button */}
        {status === "pending_payment" && (
          <a href={`https://wa.me/96171444328?text=${encodeURIComponent(`Hi! I placed an order for ${order.groomName} & ${order.brideName}'s invitation (Order ID: ${orderId}). I'm ready to arrange payment.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-medium text-white text-sm mb-4 transition"
            style={{ background: "#25D366" }}>
            💬 Chat With Us on WhatsApp
          </a>
        )}

        <p className="text-white/20 text-xs text-center">
          Bookmark this page to track your order status in real time.
        </p>
      </div>
    </div>
  )
}
