import { getAuth } from "firebase-admin/auth"

function bearerToken(req) {
  const header = req.headers.authorization || ""
  return header.startsWith("Bearer ") ? header.slice(7) : null
}

// Verifies the token belongs to the owner (the single business-owner account).
// Use for anything that should never be visible to a venue account: finance,
// planner-link management, venue account management itself, etc.
export async function requireOwner(req) {
  const token = bearerToken(req)
  if (!token) return false
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.role === "owner"
  } catch {
    return false
  }
}

// Verifies the token belongs to the owner, OR to the venue account matching
// venueId. Use for venue-scoped data (events, seating, vendors) so a venue
// can only ever touch its own data, while the owner can still manage/support
// any venue.
export async function requireVenue(req, venueId) {
  const token = bearerToken(req)
  if (!token) return false
  try {
    const decoded = await getAuth().verifyIdToken(token)
    if (decoded.role === "owner") return true
    return decoded.role === "venue" && decoded.venueId === venueId
  } catch {
    return false
  }
}
