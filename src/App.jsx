import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import Landing from "./pages/Landing"
import Invitation from "./pages/Invitation"
import Invitation2 from "./pages/Invitation2"
import Invitation3 from "./pages/Invitation3"
import Admin from "./pages/Admin"
import Login from "./pages/Login"

function ProtectedRoute({ user, children }) {
  if (user === null) return <Navigate to="/admin/login" />
  if (user === undefined) return <div className="min-h-screen bg-[#0a0806]" />
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
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Invitation />} />
        <Route path="/demo2" element={<Invitation2 />} />
        <Route path="/demo3" element={<Invitation3 />} />
        <Route path="/admin/login" element={user ? <Navigate to="/admin" /> : <Login />} />
        <Route path="/admin" element={<ProtectedRoute user={user}><Admin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}