const IMAGE_ICONS = {
  "💒": "/ceremony-icon.png",
  "🥂": "/welcome-drink-icon.png",
  "🎉": "/wedding-celebration-icon.png",
}

// No reference image was provided for After Party — kept as a hand-drawn
// white line icon (linked eighth notes) matching the same white-on-accent style.
function AfterPartyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 17.5V5.5l9-1.8v11.3" />
      <circle cx="6.8" cy="17.5" r="2.1" fill="white" stroke="none" />
      <circle cx="15.8" cy="15" r="2.1" fill="white" stroke="none" />
    </svg>
  )
}

export default function TimelineIcon({ icon, size = 16 }) {
  const imgSrc = IMAGE_ICONS[icon]
  if (imgSrc) return <img src={imgSrc} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: "contain" }} />
  if (icon === "🥳") return <AfterPartyIcon width={size} height={size} />
  return <span style={{ fontSize: size }}>{icon}</span>
}
