import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

if (!getApps().length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    initializeApp({ credential: cert(sa) })
  } catch (_) {}
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

export default async function handler(req, res) {
  const slug = req.query.slug

  if (!slug || !/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
    return res.redirect(302, "https://www.lumivite.net")
  }

  let title       = "Wedding RSVP Dashboard 💍"
  let description = "Track who's attending your wedding in real time. View all your RSVPs, guest count, and messages."
  const image     = "https://www.lumivite.net/WeddingGuestDashboard.jpeg"
  const pageUrl   = `https://www.lumivite.net/dashboard/${slug}`

  try {
    const db   = getFirestore()
    const snap = await db.collection("invitations").doc(slug).get()
    if (snap.exists) {
      const d     = snap.data()
      const groom = d.groom || d.groomAr || ""
      const bride = d.bride || d.brideAr || ""
      if (groom && bride) {
        title       = `${groom} & ${bride} — Wedding Dashboard 💍`
        description = `Track who's attending ${groom} & ${bride}'s wedding. View all RSVPs, guest count, and messages in real time.`
      }
    }
  } catch (_) {}

  const t      = escapeHtml(title)
  const d      = escapeHtml(description)
  const img    = escapeHtml(image)
  const u      = escapeHtml(pageUrl)
  const appUrl = `${pageUrl}?_app=1`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t}</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${u}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Lumivite" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />
</head>
<body>
  <script>window.location.replace("${appUrl}")</script>
</body>
</html>`

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
  res.status(200).send(html)
}
