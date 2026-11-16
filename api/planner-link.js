import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialise Firebase Admin once per cold start
if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query || {}
    if (!id || !ID_RE.test(id)) {
      return res.status(400).json({ error: "Invalid link id" })
    }
    try {
      const db = getFirestore()
      const snap = await db.collection("plannerLinks").doc(id).get()
      if (!snap.exists) {
        return res.status(404).json({ error: "Link not found" })
      }
      const d = snap.data()
      // Only the fields Order.jsx needs to preset the form — never the admin note.
      return res.status(200).json({
        eventType: d.eventType,
        package: d.package,
        template: d.template,
        customPrice: d.customPrice,
      })
    } catch (e) {
      return res.status(500).json({ error: "Lookup failed" })
    }
  }

  if (req.method === "POST") {
    const { id, orderId } = req.body || {}
    if (!id || !ID_RE.test(id) || !orderId || !ID_RE.test(orderId)) {
      return res.status(400).json({ error: "Invalid id" })
    }
    try {
      const db = getFirestore()
      const ref = db.collection("plannerLinks").doc(id)
      const snap = await ref.get()
      if (!snap.exists) {
        return res.status(404).json({ error: "Link not found" })
      }
      await ref.update({ usedAt: new Date(), orderId })
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: "Update failed" })
    }
  }

  res.setHeader("Allow", "GET, POST")
  return res.status(405).json({ error: "Method not allowed" })
}
