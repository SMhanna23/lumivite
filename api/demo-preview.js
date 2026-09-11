function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

const THEMES = {
  1: {
    path: "/demo",
    name: "Dark Luxury",
    description: "A moody black & gold digital wedding invitation with cinematic video, music, and RSVP tracking. Preview the Dark Luxury template.",
    image: "demo-og-dark-luxury.png",
  },
  2: {
    path: "/demo2",
    name: "Garden Romance",
    description: "A soft botanical digital wedding invitation in sage green and cream, with cinematic video, music, and RSVP tracking. Preview the Garden Romance template.",
    image: "demo-og-garden-romance.png",
  },
  3: {
    path: "/demo3",
    name: "Rose Gold Romance",
    description: "A romantic digital wedding invitation in rose gold and blush, with cinematic video, music, and RSVP tracking. Preview the Rose Gold Romance template.",
    image: "demo-og-rose-gold-romance.png",
  },
  4: {
    path: "/demo4",
    name: "Black Tie Gold",
    description: "A formal black-tie digital wedding invitation in obsidian and gold, with cinematic video, music, and RSVP tracking. Preview the Black Tie Gold template.",
    image: "demo-og-black-tie-gold.png",
  },
}

export default async function handler(req, res) {
  const variant = THEMES[req.query.v] ? req.query.v : "1"
  const theme = THEMES[variant]

  const title   = `${theme.name} — Wedding Invitation Template 💍`
  const image   = `https://www.lumivite.net/${theme.image}`
  const pageUrl = `https://www.lumivite.net${theme.path}`
  const appUrl  = `${pageUrl}?_app=1`

  const t   = escapeHtml(title)
  const d   = escapeHtml(theme.description)
  const img = escapeHtml(image)
  const u   = escapeHtml(pageUrl)

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
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
  res.status(200).send(html)
}
