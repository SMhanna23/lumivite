// Escape all user-supplied values before inserting into HTML
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

  // Allow only safe slug characters — prevent path traversal and injection
  if (!slug || !/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
    return res.redirect(302, "https://www.lumivite.net")
  }

  const invitationUrl = `https://www.lumivite.net/i/${slug}`

  // Build redirect URL: preserve guest params (gn, np) and add _src=app to skip preview on next load
  const { slug: _s, ...guestParams } = req.query
  const redirectParams = new URLSearchParams({ ...guestParams, _src: "app" })
  const redirectUrl = `${invitationUrl}?${redirectParams}`

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitations/${slug}`
    const response = await fetch(firestoreUrl)

    if (!response.ok) throw new Error("Not found")

    const data = await response.json()
    const f = data.fields || {}

    const groom = f.groom?.stringValue || ""
    const bride = f.bride?.stringValue || ""
    const date = f.date?.stringValue || ""
    const photos = f.photos?.arrayValue?.values || []
    const photo = photos[0]?.stringValue ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop&q=80"

    const title = groom && bride ? `${groom} & ${bride} 💍` : "You're Invited ✨"
    const dateStr = date
      ? new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : ""
    const description = dateStr
      ? `You are invited to celebrate the wedding of ${groom} & ${bride} on ${dateStr}`
      : `You are invited to celebrate the wedding of ${groom} & ${bride}`

    // Escape all Firestore-sourced values before embedding in HTML
    const safeTitle       = escapeHtml(title)
    const safeDescription = escapeHtml(description)
    const safePhoto       = escapeHtml(photo)
    const safeUrl         = escapeHtml(invitationUrl)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safePhoto}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:site_name" content="Lumivite">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safePhoto}">
  <script>window.location.replace(${JSON.stringify(redirectUrl)})</script>
</head>
<body style="background:#0a0806;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <p style="color:#c9a96e;font-family:serif;font-size:1.2rem;">Opening your invitation...</p>
</body>
</html>`

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate")
    res.status(200).send(html)
  } catch (e) {
    res.redirect(302, invitationUrl)
  }
}
