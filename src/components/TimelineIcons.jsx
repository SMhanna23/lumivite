const ICONS = {
  "💒": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8.5" cy="15" r="4.5" />
      <circle cx="15.5" cy="15" r="4.5" />
      <path d="M12 8.2c-.9-1.3-3-1.1-3 .5 0 1.6 2 2.7 3 3.4 1-.7 3-1.8 3-3.4 0-1.6-2.1-1.8-3-.5Z" fill="white" stroke="none" />
    </svg>
  ),
  "🥂": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <g transform="rotate(-16 8 12)">
        <path d="M6.3 3h3.4l-.5 5.3a1.2 1.2 0 0 1-1.2 1.1h-.1a1.2 1.2 0 0 1-1.2-1.1L6.3 3Z" />
        <path d="M8 9.4V16" />
        <path d="M6 16h4" />
      </g>
      <g transform="rotate(16 17 12)">
        <path d="M14.6 3h3.4l-.5 5.3a1.2 1.2 0 0 1-1.2 1.1h-.1a1.2 1.2 0 0 1-1.2-1.1L14.6 3Z" />
        <path d="M16.3 9.4V16" />
        <path d="M14.3 16h4" />
      </g>
    </svg>
  ),
  "🎉": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 2.5v6.5M5.3 2.5l.4 4.3a1.7 1.7 0 0 0 1.7 1.5h0a1.7 1.7 0 0 0 1.7-1.5l.4-4.3" />
      <path d="M7 11v10.5" />
      <path d="M17 2.5c-1.6 0-2.7 2.2-2.7 5s1.1 5 2.7 5" />
      <path d="M17 12.5v9" />
    </svg>
  ),
  "🥳": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 17.5V5.5l9-1.8v11.3" />
      <circle cx="6.8" cy="17.5" r="2.1" fill="white" stroke="none" />
      <circle cx="15.8" cy="15" r="2.1" fill="white" stroke="none" />
    </svg>
  ),
}

export default function TimelineIcon({ icon, size = 16 }) {
  const Render = ICONS[icon]
  if (!Render) return <span style={{ fontSize: size }}>{icon}</span>
  return <Render width={size} height={size} />
}
