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

// One-time, self-serve bootstrap: the FIRST Firebase Auth account ever to
// call this (while already logged into /admin) is marked role:"owner" via a
// custom claim. Every call after that is a no-op for that same account, and
// refused for any other account — so once claimed, nobody else can ever
// become owner through this endpoint. This avoids needing the service
// account secret or Vercel CLI access on a dev machine.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "Unauthorized" })

  let decoded
  try {
    decoded = await getAuth().verifyIdToken(token)
  } catch {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (decoded.role === "owner") return res.status(200).json({ success: true, already: true })

  try {
    const db = getFirestore()
    const flagRef = db.collection("system").doc("ownerBootstrap")
    const flagSnap = await flagRef.get()
    if (flagSnap.exists && flagSnap.data().ownerUid && flagSnap.data().ownerUid !== decoded.uid) {
      return res.status(403).json({ error: "Owner account already claimed by a different account." })
    }

    await getAuth().setCustomUserClaims(decoded.uid, { role: "owner" })
    await flagRef.set({ ownerUid: decoded.uid, claimedAt: new Date() })
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: "Claim failed" })
  }
}
