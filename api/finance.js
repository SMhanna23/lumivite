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
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

// Every endpoint here is admin-only — this is financial data, never
// exposed to any public/client-facing route.
export default async function handler(req, res) {
  if (!(await requireAdmin(req))) return res.status(401).json({ error: "Unauthorized" })

  if (req.method === "GET") {
    try {
      const db = getFirestore()
      const snap = await db.collection("financeEntries").orderBy("date", "desc").get()
      return res.status(200).json({
        entries: snap.docs.map(d => {
          const v = d.data()
          return { id: d.id, clientName: v.clientName, amount: v.amount, date: v.date, note: v.note || "" }
        }),
      })
    } catch (e) {
      return res.status(500).json({ error: "List failed" })
    }
  }

  if (req.method === "PUT") {
    const { clientName, amount, date, note } = req.body || {}
    const price = Number(amount)
    const name = typeof clientName === "string" ? clientName.trim().slice(0, 150) : ""
    if (!name) return res.status(400).json({ error: "Invalid clientName" })
    if (!price || price <= 0 || price > 1000000) return res.status(400).json({ error: "Invalid amount" })
    if (typeof date !== "string" || !DATE_RE.test(date)) return res.status(400).json({ error: "Invalid date" })

    try {
      const db = getFirestore()
      const ref = await db.collection("financeEntries").add({
        clientName: name,
        amount: price,
        date,
        note: typeof note === "string" ? note.trim().slice(0, 300) : "",
        createdAt: new Date(),
      })
      return res.status(200).json({ id: ref.id })
    } catch (e) {
      return res.status(500).json({ error: "Create failed" })
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {}
    if (!id || !ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" })
    try {
      const db = getFirestore()
      await db.collection("financeEntries").doc(id).delete()
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: "Delete failed" })
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE")
  return res.status(405).json({ error: "Method not allowed" })
}
