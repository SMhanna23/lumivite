// Proxies WhatsApp notifications through CallMeBot server-side, so the phone
// number and API key never reach the client bundle (they were previously
// inlined as VITE_ env vars, exposing them to anyone who opened devtools).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 2000) : ""
  if (!text) {
    return res.status(400).json({ error: "Missing text" })
  }

  const phone  = process.env.CALLMEBOT_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY
  if (!phone || !apikey) {
    return res.status(500).json({ error: "Notification service not configured" })
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
    await fetch(url)
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(502).json({ error: "Failed to send notification" })
  }
}
