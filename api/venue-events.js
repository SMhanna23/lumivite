import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { requireVenue } from "./_lib/auth.js"

// Initialise Firebase Admin once per cold start
if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EVENT_TYPES = ["wedding", "corporate", "other"]
const STATUSES = ["inquiry", "tentative", "confirmed", "cancelled", "completed"]
const DEPOSIT_STATUSES = ["unpaid", "partial", "paid"]
const VENDOR_ROLES = ["caterer", "dj", "florist", "photographer", "other"]
const MAX_VENDORS = 30
const MAX_TIMELINE = 60
const MAX_STR = 150

function cleanStr(v, max = MAX_STR) {
  return typeof v === "string" ? v.trim().slice(0, max) : ""
}

function sanitizeVendors(input) {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_VENDORS).map(v => ({
    id: cleanStr(v?.id, 40) || Math.random().toString(36).slice(2, 10),
    role: VENDOR_ROLES.includes(v?.role) ? v.role : "other",
    name: cleanStr(v?.name),
    phone: cleanStr(v?.phone, 40),
    email: cleanStr(v?.email, 150),
    notes: cleanStr(v?.notes, 300),
  })).filter(v => v.name)
}

function sanitizeTimeline(input) {
  if (!Array.isArray(input)) return []
  return input.slice(0, MAX_TIMELINE).map(t => ({
    id: cleanStr(t?.id, 40) || Math.random().toString(36).slice(2, 10),
    time: cleanStr(t?.time, 20),
    label: cleanStr(t?.label, 150),
    assignedVendorId: t?.assignedVendorId ? cleanStr(t.assignedVendorId, 40) : null,
  })).filter(t => t.label)
}

function sanitizeEvent(input) {
  const deposit = input?.deposit || {}
  return {
    eventName: cleanStr(input?.eventName) || "Untitled Event",
    eventType: EVENT_TYPES.includes(input?.eventType) ? input.eventType : "wedding",
    date: typeof input?.date === "string" && DATE_RE.test(input.date) ? input.date : "",
    startTime: cleanStr(input?.startTime, 10),
    endTime: cleanStr(input?.endTime, 10),
    hallName: cleanStr(input?.hallName),
    status: STATUSES.includes(input?.status) ? input.status : "inquiry",
    expectedGuestCount: Math.max(0, Math.min(10000, Number(input?.expectedGuestCount) || 0)),
    deposit: {
      status: DEPOSIT_STATUSES.includes(deposit.status) ? deposit.status : "unpaid",
      amount: Math.max(0, Math.min(1000000, Number(deposit.amount) || 0)),
      totalPrice: Math.max(0, Math.min(1000000, Number(deposit.totalPrice) || 0)),
      note: cleanStr(deposit.note, 300),
    },
    linkedInvitationSlug: input?.linkedInvitationSlug ? cleanStr(input.linkedInvitationSlug, 100) : null,
    vendors: sanitizeVendors(input?.vendors),
    timeline: sanitizeTimeline(input?.timeline),
  }
}

export default async function handler(req, res) {
  const { venueId } = req.query || {}

  if (req.method === "GET") {
    if (!venueId || !ID_RE.test(venueId)) return res.status(400).json({ error: "Invalid venueId" })

    // Public: only what a vendor needs, nothing internal (no deposit, no guest counts).
    if (req.query?.public === "1") {
      const { eventId } = req.query || {}
      if (!eventId || !ID_RE.test(eventId)) return res.status(400).json({ error: "Invalid eventId" })
      try {
        const db = getFirestore()
        const snap = await db.collection("venues").doc(venueId).collection("events").doc(eventId).get()
        if (!snap.exists) return res.status(404).json({ error: "Event not found" })
        const d = snap.data()
        return res.status(200).json({
          eventName: d.eventName, date: d.date, hallName: d.hallName,
          vendors: d.vendors || [], timeline: d.timeline || [],
        })
      } catch (e) {
        return res.status(500).json({ error: "Lookup failed" })
      }
    }

    if (!(await requireVenue(req, venueId))) return res.status(401).json({ error: "Unauthorized" })

    try {
      const db = getFirestore()
      const col = db.collection("venues").doc(venueId).collection("events")

      if (req.query?.list === "1") {
        const snap = await col.orderBy("date", "desc").get()
        return res.status(200).json({ events: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
      }

      const { eventId } = req.query || {}
      if (!eventId || !ID_RE.test(eventId)) return res.status(400).json({ error: "Invalid eventId" })
      const snap = await col.doc(eventId).get()
      if (!snap.exists) return res.status(404).json({ error: "Event not found" })
      return res.status(200).json({ id: snap.id, ...snap.data() })
    } catch (e) {
      return res.status(500).json({ error: "Lookup failed" })
    }
  }

  if (req.method === "PUT") {
    if (!venueId || !ID_RE.test(venueId)) return res.status(400).json({ error: "Invalid venueId" })
    if (!(await requireVenue(req, venueId))) return res.status(401).json({ error: "Unauthorized" })

    const { eventId } = req.body || {}
    const clean = sanitizeEvent(req.body || {})

    try {
      const db = getFirestore()
      const col = db.collection("venues").doc(venueId).collection("events")

      if (eventId && ID_RE.test(eventId)) {
        await col.doc(eventId).set({ ...clean, updatedAt: new Date() }, { merge: true })
        return res.status(200).json({ id: eventId })
      }

      const ref = await col.add({ ...clean, createdAt: new Date(), updatedAt: new Date() })
      return res.status(200).json({ id: ref.id })
    } catch (e) {
      return res.status(500).json({ error: "Save failed" })
    }
  }

  if (req.method === "DELETE") {
    if (!venueId || !ID_RE.test(venueId)) return res.status(400).json({ error: "Invalid venueId" })
    if (!(await requireVenue(req, venueId))) return res.status(401).json({ error: "Unauthorized" })

    const { eventId } = req.query || {}
    if (!eventId || !ID_RE.test(eventId)) return res.status(400).json({ error: "Invalid eventId" })
    try {
      const db = getFirestore()
      await db.collection("venues").doc(venueId).collection("events").doc(eventId).delete()
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: "Delete failed" })
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE")
  return res.status(405).json({ error: "Method not allowed" })
}
