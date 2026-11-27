import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { requireOwner, requireVenue } from "./_lib/auth.js"

// Initialise Firebase Admin once per cold start
if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Owner-only everywhere, except a venue may fetch its own basic profile
// (?self=1&id=) to show its name in its own portal.
export default async function handler(req, res) {
  if (req.method === "GET" && req.query?.self === "1") {
    const { id } = req.query || {}
    if (!id || !ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" })
    if (!(await requireVenue(req, id))) return res.status(401).json({ error: "Unauthorized" })
    try {
      const db = getFirestore()
      const snap = await db.collection("venues").doc(id).get()
      if (!snap.exists) return res.status(404).json({ error: "Not found" })
      const v = snap.data()
      return res.status(200).json({ name: v.name, status: v.status })
    } catch (e) {
      return res.status(500).json({ error: "Lookup failed" })
    }
  }

  if (!(await requireOwner(req))) return res.status(401).json({ error: "Unauthorized" })

  if (req.method === "GET") {
    try {
      const db = getFirestore()
      const snap = await db.collection("venues").orderBy("createdAt", "desc").get()
      return res.status(200).json({
        venues: snap.docs.map(d => {
          const v = d.data()
          return {
            id: d.id,
            name: v.name,
            contactName: v.contactName,
            contactEmail: v.contactEmail,
            contactPhone: v.contactPhone,
            status: v.status,
            ownerNote: v.ownerNote || "",
            createdAt: v.createdAt ? v.createdAt.toDate?.()?.toISOString() || v.createdAt : null,
          }
        }),
      })
    } catch (e) {
      return res.status(500).json({ error: "List failed" })
    }
  }

  if (req.method === "PUT") {
    const { name, contactName, contactEmail, contactPhone, ownerNote } = req.body || {}
    const cleanName = typeof name === "string" ? name.trim().slice(0, 150) : ""
    const cleanEmail = typeof contactEmail === "string" ? contactEmail.trim().toLowerCase() : ""
    if (!cleanName) return res.status(400).json({ error: "Invalid name" })
    if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: "Invalid contact email" })

    try {
      const db = getFirestore()
      const auth = getAuth()
      const venueRef = db.collection("venues").doc()
      const venueId = venueRef.id

      const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + "!1"
      const authUser = await auth.createUser({ email: cleanEmail, password: tempPassword })
      await auth.setCustomUserClaims(authUser.uid, { role: "venue", venueId })

      await venueRef.set({
        name: cleanName,
        contactName: typeof contactName === "string" ? contactName.trim().slice(0, 150) : "",
        contactEmail: cleanEmail,
        contactPhone: typeof contactPhone === "string" ? contactPhone.trim().slice(0, 40) : "",
        status: "active",
        ownerNote: typeof ownerNote === "string" ? ownerNote.trim().slice(0, 500) : "",
        authUid: authUser.uid,
        createdAt: new Date(),
      })

      let resetLink = null
      try {
        resetLink = await auth.generatePasswordResetLink(cleanEmail, {
          url: "https://www.lumivite.net/venue/login",
        })
      } catch (_) {
        // Link generation can fail (e.g. unverified domain config) — the venue
        // doc + login still work fine via a manually-set password later.
      }

      return res.status(200).json({ id: venueId, resetLink })
    } catch (e) {
      const msg = e?.errorInfo?.code === "auth/email-already-exists"
        ? "That email already has a login."
        : "Create failed"
      return res.status(500).json({ error: msg })
    }
  }

  if (req.method === "POST") {
    const { id, status } = req.body || {}
    if (!id || !ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" })
    if (!["active", "paused"].includes(status)) return res.status(400).json({ error: "Invalid status" })
    try {
      const db = getFirestore()
      await db.collection("venues").doc(id).update({ status })
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: "Update failed" })
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {}
    if (!id || !ID_RE.test(id)) return res.status(400).json({ error: "Invalid id" })
    try {
      const db = getFirestore()
      const snap = await db.collection("venues").doc(id).get()
      if (snap.exists && snap.data().authUid) {
        try { await getAuth().deleteUser(snap.data().authUid) } catch (_) {}
      }
      await db.collection("venues").doc(id).delete()
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: "Delete failed" })
    }
  }

  res.setHeader("Allow", "GET, PUT, POST, DELETE")
  return res.status(405).json({ error: "Method not allowed" })
}
