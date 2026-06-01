import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialise Firebase Admin once per cold start
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

  let title       = "You're Invited \uD83D\uDC8D"
  let description = "You have received a beautiful digital wedding invitation. Open to experience this special moment."
  let image       = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop&q=80"
  const pageUrl   = `https://www.lumivite.net/i/${slug}`

  try {
    const db   = getFirestore()
    const snap = await db.collection("invitations").doc(slug).get()

    if (snap.exists) {
      const d     = snap.data()
      const groom = d.groom  || d.groomAr || ""
      const bride = d.bride  || d.brideAr || ""
      const date  = d.date   || ""
      const photos = Array.isArray(d.photos) ? d.photos : []

      if (groom && bride) {
        title = `${groom} & ${bride} \uD83D\uDC8D`
        const dateStr = date
          ? new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : ""
        description = dateStr
          ? `${groom} & ${bride} are getting married on ${dateStr}. You are invited to celebrate their love \u2014 open to view the full invitation.`
          : `${groom} & ${bride} are getting married and you\u2019re invited! Open to view their beautiful wedding invitation.`
      }

      if (photos.length > 0 && typeof photos[0] === "string") {
        image = photos[0]
      }
    }
  } catch (_) {}

  const t      = escapeHtml(title)
  const d      = escapeHtml(description)
  const img    = escapeHtml(image)
  const u      = escapeHtml(pageUrl)
  const appUrl = pageUrl + "?_app=1"

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t}</title>

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${u}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Lumivite" />

  <!-- Twitter Card -->
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
