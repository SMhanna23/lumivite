import { useState, useEffect } from "react"
import { doc, getDoc, getDocs, updateDoc, query, collection, where } from "firebase/firestore"
import { db } from "../firebase"
import SeatingEditor, { emptySeating } from "./SeatingEditor"

export default function SeatingPanel({ order, onClose }) {
  const [loading, setLoading] = useState(true)
  const [docId, setDocId] = useState(null)
  const [seating, setSeating] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "invitations"), where("orderId", "==", order.id))
        const qSnap = await getDocs(q)
        let id = null, data = null
        if (!qSnap.empty) {
          const freshest = qSnap.docs.slice().sort((a, b) => (b.data().updatedAt?.toMillis?.() || 0) - (a.data().updatedAt?.toMillis?.() || 0))[0]
          id = freshest.id
          data = freshest.data()
        } else if (order.slug) {
          const snap = await getDoc(doc(db, "invitations", order.slug))
          if (snap.exists()) { id = order.slug; data = snap.data() }
        }
        if (id) {
          setDocId(id)
          setSeating({ ...emptySeating(), ...(data.seating || {}) })
        }
      } catch (e) { /* no invitation built yet */ }
      setLoading(false)
    }
    load()
  }, [order.id])

  if (loading) return (
    <div className="border-t border-white/5 p-5">
      <p className="text-white/20 text-xs text-center animate-pulse">Loading seating...</p>
    </div>
  )

  if (!docId) return (
    <div className="border-t border-white/5 p-5">
      <p className="text-white/30 text-sm text-center">Build the invitation first, then come back to set up seating.</p>
    </div>
  )

  return (
    <div className="border-t border-white/5">
      <SeatingEditor
        docId={docId}
        initialSeating={seating}
        onSave={(next) => updateDoc(doc(db, "invitations", docId), { seating: next, updatedAt: new Date() })}
        onClose={onClose}
        title={`🪑 Seating — ${order.groomName} & ${order.brideName}`}
      />
    </div>
  )
}
