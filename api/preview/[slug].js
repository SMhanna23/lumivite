export default async function handler(req, res) {
  const { slug } = req.query
  const invitationUrl = `https://www.lumivite.net/i/${slug}`

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

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${photo}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${invitationUrl}">
  <meta property="og:site_name" content="Lumivite">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${photo}">
  <meta http-equiv="refresh" content="0; url=${invitationUrl}">
  <script>window.location.replace("${invitationUrl}")</script>
</head>
<body></body>
</html>`

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate")
    res.status(200).send(html)
  } catch (e) {
    res.redirect(302, invitationUrl)
  }
}
