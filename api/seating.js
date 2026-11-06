import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialise Firebase Admin once per cold start
if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

const MAX_TABLES = 300
const MAX_ELEMENTS = 100
const MAX_GUESTS = 3000
const MAX_STR = 120

function cleanStr(v, max = MAX_STR) {
  return typeof v === "string" ? v.slice(0, max) : ""
}

// Trust nothing from the client beyond shape/size — this endpoint has no auth,
// only an unguessable slug, so a corrupt or oversized payload must be rejected
// rather than written as-is.
function sanitizeSeating(input) {
  if (!input || typeof input !== "object") return null

  const tables = Array.isArray(input.tables) ? input.tables.slice(0, MAX_TABLES).map(t => ({
    id: cleanStr(t?.id, 40),
    label: cleanStr(t?.label) || "Table",
    capacity: Math.max(1, Math.min(200, Number(t?.capacity) || 1)),
    shape: t?.shape === "rect" ? "rect" : "round",
    side: ["groom", "bride", "mixed"].includes(t?.side) ? t.side : "mixed",
    x: Number.isFinite(t?.x) ? t.x : 0,
    y: Number.isFinite(t?.y) ? t.y : 0,
  })).filter(t => t.id) : []

  const elements = Array.isArray(input.elements) ? input.elements.slice(0, MAX_ELEMENTS).map(e => ({
    id: cleanStr(e?.id, 40),
    type: cleanStr(e?.type, 40) || "dancefloor",
    label: cleanStr(e?.label) || "Element",
    x: Number.isFinite(e?.x) ? e.x : 0,
    y: Number.isFinite(e?.y) ? e.y : 0,
  })).filter(e => e.id) : []

  const guests = Array.isArray(input.guests) ? input.guests.slice(0, MAX_GUESTS).map(g => ({
    id: cleanStr(g?.id, 40),
    name: cleanStr(g?.name),
    persons: Math.max(1, Math.min(50, Number(g?.persons) || 1)),
    side: ["groom", "bride", "mixed"].includes(g?.side) ? g.side : "mixed",
    tableId: g?.tableId ? cleanStr(g.tableId, 40) : null,
    source: g?.source === "rsvp" ? "rsvp" : "manual",
    rsvpId: g?.rsvpId ? cleanStr(g.rsvpId, 60) : null,
  })).filter(g => g.id && g.name) : []

  return { enabled: !!input.enabled, tables, elements, guests }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { slug, seating } = req.body || {}

  if (!slug || !/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
    return res.status(400).json({ error: "Invalid slug" })
  }

  const clean = sanitizeSeating(seating)
  if (!clean) {
    return res.status(400).json({ error: "Invalid seating payload" })
  }

  try {
    const db = getFirestore()
    const ref = db.collection("invitations").doc(slug)
    const snap = await ref.get()
    if (!snap.exists) {
      return res.status(404).json({ error: "Invitation not found" })
    }
    await ref.update({ seating: clean, updatedAt: new Date() })
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: "Save failed" })
  }
}
