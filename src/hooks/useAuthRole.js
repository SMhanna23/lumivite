import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"

// UX-only route-guard info — NOT a security boundary. The real check lives
// server-side in each /api endpoint (api/_lib/auth.js), which reads the same
// custom claim from the verified ID token.
//
// Returns { user, role, venueId } where:
//   user === undefined  -> still loading
//   user === null       -> signed out
//   role is "owner" | "venue" | null (null while loading or signed out)
export function useAuthRole() {
  const [state, setState] = useState({ user: undefined, role: null, venueId: null })

  const load = async (u) => {
    if (!u) { setState({ user: null, role: null, venueId: null }); return }
    try {
      const result = await u.getIdTokenResult()
      setState({ user: u, role: result.claims.role || null, venueId: result.claims.venueId || null })
    } catch {
      setState({ user: u, role: null, venueId: null })
    }
  }

  useEffect(() => {
    const auth = getAuth()
    return onAuthStateChanged(auth, load)
  }, [])

  // Re-reads the ID token (forcing a refresh first) and updates role/venueId —
  // call after an action that changes the current user's custom claims
  // (e.g. the one-time owner claim bootstrap) since onAuthStateChanged does
  // not refire on a token refresh by itself.
  const refresh = async () => {
    const auth = getAuth()
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true)
      await load(auth.currentUser)
    }
  }

  return { ...state, refresh }
}
