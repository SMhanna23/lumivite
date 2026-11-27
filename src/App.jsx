import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing"
import Invitation from "./pages/Invitation"
import Invitation2 from "./pages/Invitation2"
import Invitation3 from "./pages/Invitation3"
import Invitation4 from "./pages/Invitation4"
import Invitation5 from "./pages/Invitation5"
import Birthday from "./pages/Birthday"
import Occasion from "./pages/Occasion"
import Invitation_Live from "./pages/Invitation_Live"
import Admin from "./pages/Admin"
import Login from "./pages/Login"
import Order from "./pages/Order"
import PlannerOrder from "./pages/PlannerOrder"
import Dashboard from "./pages/Dashboard"
import DemoDashboard from "./pages/DemoDashboard"
import Memories from "./pages/Memories"
import SeatFinder from "./pages/SeatFinder"
import SeatingLink from "./pages/SeatingLink"
import MyOrder from "./pages/MyOrder"
import VenueLogin from "./pages/VenueLogin"
import VenuePortal from "./pages/VenuePortal"
import VendorLink from "./pages/VendorLink"
import NotFound from "./pages/NotFound"
import PixelPageView from "./components/PixelPageView"
import { useAuthRole } from "./hooks/useAuthRole"

// UX-only guard for the owner's admin app. The real boundary is server-side
// in each /api endpoint (api/_lib/auth.js), which re-checks the same claim.
function AdminRoute({ children }) {
  const { user, role, refresh } = useAuthRole()
  const [bootstrapping, setBootstrapping] = useState(false)
  const [bootstrapError, setBootstrapError] = useState(false)

  useEffect(() => {
    if (user && role === null && !bootstrapping && !bootstrapError) {
      setBootstrapping(true)
      ;(async () => {
        try {
          const token = await user.getIdToken()
          const res = await fetch("/api/claim-owner", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) await refresh()
          else setBootstrapError(true)
        } catch {
          setBootstrapError(true)
        } finally {
          setBootstrapping(false)
        }
      })()
    }
  }, [user, role, bootstrapping, bootstrapError, refresh])

  if (user === null) return <Navigate to="/admin/login" />
  if (user === undefined) return <div className="min-h-screen bg-[#0a0806]" />
  if (role === "venue") return <Navigate to="/venue" />
  if (role === "owner") return children
  if (bootstrapError) return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center text-white/50 text-sm px-6 text-center">
      Couldn't verify admin access. Please refresh the page.
    </div>
  )
  return <div className="min-h-screen bg-[#0a0806]" />
}

// UX-only guard for the venue partner portal.
function VenueRoute({ children }) {
  const { user, role } = useAuthRole()
  if (user === null) return <Navigate to="/venue/login" />
  if (user === undefined || role === null) return <div className="min-h-screen bg-[#0a0806]" />
  if (role !== "venue") return <Navigate to="/venue/login" />
  return children
}

export default function App() {
  const { user, role } = useAuthRole()

  return (
    <BrowserRouter>
      <PixelPageView />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Invitation />} />
        <Route path="/demo2" element={<Invitation2 />} />
        <Route path="/demo3" element={<Invitation3 />} />
        <Route path="/demo4" element={<Invitation4 />} />
        <Route path="/demo5" element={<Invitation5 />} />
        <Route path="/demo-birthday" element={<Birthday />} />
        <Route path="/demo-occasion" element={<Occasion />} />
        <Route path="/i/:slug" element={<Invitation_Live />} />
        <Route path="/order" element={<Order />} />
        <Route path="/planner-order/:linkId" element={<PlannerOrder />} />
        <Route path="/my-order/:orderId" element={<MyOrder />} />
        <Route path="/dashboard/:slug" element={<Dashboard />} />
        <Route path="/demo-dashboard" element={<DemoDashboard />} />
        <Route path="/memories/:slug" element={<Memories />} />
        <Route path="/seat/:slug" element={<SeatFinder />} />
        <Route path="/seating/:slug" element={<SeatingLink />} />
        <Route path="/vendor/:venueId/:eventId" element={<VendorLink />} />
        <Route path="/admin/login" element={user && role !== "venue" ? <Navigate to="/admin" /> : <Login />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/venue/login" element={user && role === "venue" ? <Navigate to="/venue" /> : <VenueLogin />} />
        <Route path="/venue" element={<VenueRoute><VenuePortal /></VenueRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
