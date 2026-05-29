function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export default async (request, context) => {
  const url = new URL(request.url)
  const slug = url.pathname.split("/i/")[1]?.split("?")[0]?.split("/")[0]
  if (!slug) return context.next()

  // Try both VITE_ prefixed (Netlify build vars) and plain (Netlify runtime vars)
  const apiKey    = Deno.env.get("VITE_FIREBASE_API_KEY")    || Deno.env.get("FIREBASE_API_KEY")
  const projectId = Deno.env.get("VITE_FIREBASE_PROJECT_ID") || Deno.env.get("FIREBASE_PROJECT_ID")

  let title       = "You're Invited ✨"
  let description = "You have received a beautiful digital wedding invitation. Open to view the full experience."
  let image       = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop&q=80"

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitations/${slug}?key=${apiKey}`
    )
    if (res.ok) {
      const data   = await res.json()
      const f      = data.fields || {}
      const groom  = f.groom?.stringValue  || ""
      const bride  = f.bride?.stringValue  || ""
      const photos = f.photos?.arrayValue?.values || []

      if (groom && bride) {
        title       = `${groom} & ${bride} — You're Invited ✨`
        description = `Join ${groom} & ${bride} on their special day. Open your personal digital wedding invitation.`
      }
      if (photos.length > 0 && photos[0].stringValue) {
        image = photos[0].stringValue
      }
    }
  } catch (_) {
    // fall through to defaults
  }

  const originalResponse = await context.next()
  let html = await originalResponse.text()

  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const img = escapeHtml(image)
  const pageUrl = escapeHtml(url.origin + url.pathname)

  html = html
    .replace(/(<meta property="og:title" content=")[^"]*(")/g,       `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/g,  `$1${d}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/g,        `$1${img}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/g,          `$1${pageUrl}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/g,       `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/g, `$1${d}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/g,       `$1${img}$2`)

  return new Response(html, {
    status: originalResponse.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}

export const config = { path: "/i/*" }
