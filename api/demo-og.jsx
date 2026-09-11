import { ImageResponse } from "@vercel/og"

export const config = { runtime: "edge" }

const THEMES = {
  1: {
    name: "Dark Luxury",
    subtitle: "Wedding Invitation Template",
    bg: "linear-gradient(160deg, #0c0b09 0%, #1a1611 55%, #0c0b09 100%)",
    accent: "#c9a96e",
    text: "#f5f1e8",
  },
  2: {
    name: "Garden Romance",
    subtitle: "Wedding Invitation Template",
    bg: "linear-gradient(160deg, #eef4ee 0%, #faf8f3 55%, #e8f0e5 100%)",
    accent: "#4a7c59",
    text: "#2d3a2e",
  },
  3: {
    name: "Rose Gold Romance",
    subtitle: "Wedding Invitation Template",
    bg: "linear-gradient(160deg, #fdf6f0 0%, #f7e6df 55%, #fdf6f0 100%)",
    accent: "#B76E79",
    text: "#5C2D35",
  },
  4: {
    name: "Black Tie Gold",
    subtitle: "Wedding Invitation Template",
    bg: "linear-gradient(160deg, #0c0b09 0%, #171310 55%, #0c0b09 100%)",
    accent: "#c4a35a",
    text: "#f5f1e8",
  },
}

async function loadGoogleFont(family, weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (match) {
    const res = await fetch(match[1])
    if (res.status === 200) return await res.arrayBuffer()
  }
  throw new Error("font load failed")
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const variant = searchParams.get("v")
  const theme = THEMES[variant] || THEMES[1]

  const titleText = theme.name
  const subtitleText = `${theme.subtitle} · LUMIVITE`

  let fonts = []
  try {
    const [titleFont, subtitleFont] = await Promise.all([
      loadGoogleFont("Playfair Display", 600, titleText),
      loadGoogleFont("Jost", 500, subtitleText),
    ])
    fonts = [
      { name: "Playfair Display", data: titleFont, weight: 600, style: "normal" },
      { name: "Jost", data: subtitleFont, weight: 500, style: "normal" },
    ]
  } catch (_) {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: theme.bg,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: `1px solid ${theme.accent}66`,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 20,
            letterSpacing: 8,
            color: theme.accent,
            fontFamily: "Jost",
            textTransform: "uppercase",
            marginBottom: 28,
            display: "flex",
          }}
        >
          LUMIVITE
        </div>
        <div
          style={{
            fontSize: 96,
            color: theme.text,
            fontFamily: "Playfair Display",
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            padding: "0 60px",
          }}
        >
          {titleText}
        </div>
        <div
          style={{
            width: 90,
            height: 2,
            background: theme.accent,
            margin: "32px 0",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 24,
            color: theme.accent,
            fontFamily: "Jost",
            letterSpacing: 3,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {theme.subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  )
}
