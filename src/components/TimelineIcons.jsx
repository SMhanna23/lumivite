const IMAGE_ICONS = {
  "💒": "/ceremony-icon.png",
  "🥂": "/welcome-drink-icon.png",
  "🎉": "/wedding-celebration-icon.png",
  "🥳": "/after-party-icon.png",
}

export default function TimelineIcon({ icon, size = 16 }) {
  const imgSrc = IMAGE_ICONS[icon]
  if (imgSrc) return <img src={imgSrc} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: "contain" }} />
  return <span style={{ fontSize: size }}>{icon}</span>
}
