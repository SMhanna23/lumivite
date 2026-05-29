import { readFileSync } from "fs"
import { join } from "path"

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

  let title       = "You're Invited ✨"
  let description = "You have received a beautiful digital wedding invitation. Open to view the full experience."
  let image       = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop&q=80"
  const pageUrl   = `https://www.lumivite.net/i/${slug}`

  try {
    const projectId   = process.env.VITE_FIREBASE_PROJECT_ID
    const apiKey      = process.env.VITE_FIREBASE_API_KEY
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitations/${slug}?key=${apiKey}`
    const response    = await fetch(firestoreUrl)

    if (response.ok) {
      const data   = await response.json()
      const f      = data.fields || {}
      const groom  = f.groom?.stringValue  || ""
      const bride  = f.bride?.stringValue  || ""
      const date   = f.date?.stringValue   || ""
      const photos = f.photos?.arrayValue?.values || []

      if (groom && bride) {
        title = `${groom} & ${bride} 💍`
        const dateStr = date
          ? new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : ""
        description = dateStr
          ? `You are invited to celebrate the wedding of ${groom} & ${bride} on ${dateStr}`
          : `You are invited to celebrate the wedding of ${groom} & ${bride}`
      }

      if (photos.length > 0 && photos[0].stringValue) {
        image = photos[0].stringValue
      }
    }
  } catch (_) {}

  // Read the built index.html and inject personalised OG tags
  let html
  try {
    html = readFileSync(join(process.cwd(), "dist", "index.html"), "utf-8")
  } catch (_) {
    // Fallback: minimal redirect page if dist/index.html isn't bundled
    html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="0;url=${pageUrl}">
    </head><body></body></html>`
  }

  const t   = escapeHtml(title)
  const d   = escapeHtml(description)
  const img = escapeHtml(image)
  const u   = escapeHtml(pageUrl)

  html = html
    .replace(/(<meta property="og:title" content=")[^"]*(")/g,       `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/g,  `$1${d}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/g,        `$1${img}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/g,          `$1${u}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/g,       `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/g, `$1${d}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/g,       `$1${img}$2`)

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
  res.status(200).send(html)
}
