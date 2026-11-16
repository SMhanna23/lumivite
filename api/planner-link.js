import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialise Firebase Admin once per cold start
if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/
const EVENT_TYPES = ["wedding", "birthday", "occasion"]
const PACKAGES = ["bronze", "silver", "gold"]

async function requireAdmin(req) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return false
  try {
    await getAuth().verifyIdToken(token)
    return true
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Admin-only: list every planner link (full fields) for the dashboard table.
    if (req.query?.list === "1") {
      if (!(await requireAdmin(req))) return res.status(401).json({ error: "Unauthorized" })
      try {
        const db = getFirestore()
        const snap = await db.collection("plannerLinks").orderBy("createdAt", "desc").get()
        return res.status(200).json({
          links: snap.docs.map(d => {
            const v = d.data()
            return {
              id: d.id,
              eventType: v.eventType,
              package: v.package,
              template: v.template,
              customPrice: v.customPrice,
              note: v.note || "",
              usedAt: v.usedAt ? v.usedAt.toDate?.()?.toISOString() || v.usedAt : null,
              orderId: v.orderId || null,
            }
          }),
        })
      } catch (e) {
        return res.status(500).json({ error: "List failed" })
      }
    }

    // Public: fetch a single link's preset — used by the client-facing order page.
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

  if (req.method === "PUT") {
    // Admin-only: create a new planner link.
    if (!(await requireAdmin(req))) return res.status(401).json({ error: "Unauthorized" })

    const { eventType, package: pkg, template, customPrice, note } = req.body || {}
    const price = Number(customPrice)
    if (!EVENT_TYPES.includes(eventType)) return res.status(400).json({ error: "Invalid eventType" })
    if (!PACKAGES.includes(pkg)) return res.status(400).json({ error: "Invalid package" })
    if (!price || price <= 0 || price > 100000) return res.status(400).json({ error: "Invalid price" })

    try {
      const db = getFirestore()
      const ref = await db.collection("plannerLinks").add({
        eventType,
        package: pkg,
        template: typeof template === "string" ? template.slice(0, 40) : "",
        customPrice: price,
        note: typeof note === "string" ? note.slice(0, 300) : "",
        createdAt: new Date(),
        usedAt: null,
        orderId: null,
      })
      return res.status(200).json({ id: ref.id })
    } catch (e) {
      return res.status(500).json({ error: "Create failed" })
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

  res.setHeader("Allow", "GET, PUT, POST")
  return res.status(405).json({ error: "Method not allowed" })
}
