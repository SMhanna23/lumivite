import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import Invitation from "./pages/Invitation"
import Admin from "./pages/Admin"
import Login from "./pages/Login"

function ProtectedRoute({ user, children }) {
  if (user === null) return <Navigate to="/admin/login" />
  if (user === undefined) return <div className="min-h-screen bg-[#0d0a08]" />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const auth = getAuth()
    return onAuthStateChanged(auth, u => setUser(u || null))
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Invitation />} />
        <Route path="/admin/login" element={
          user ? <Navigate to="/admin" /> : <Login />
        } />
        <Route path="/admin" element={
          <ProtectedRoute user={user}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}