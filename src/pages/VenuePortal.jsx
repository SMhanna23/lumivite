import { useState, useEffect } from "react"
import { getAuth, signOut } from "firebase/auth"
import { useAuthRole } from "../hooks/useAuthRole"

const EVENT_TYPES = ["wedding", "corporate", "other"]
const STATUSES = ["inquiry", "tentative", "confirmed", "cancelled", "completed"]
const DEPOSIT_STATUSES = ["unpaid", "partial", "paid"]
const VENDOR_ROLES = ["caterer", "dj", "florist", "photographer", "other"]

const STATUS_COLOR = {
  inquiry: "#8a8a8a", tentative: "#c9a96e", confirmed: "#4ade80",
  cancelled: "#f87171", completed: "#60a5fa",
}

const emptyForm = () => ({
  eventName: "", eventType: "wedding", date: "", startTime: "", endTime: "", hallName: "",
  status: "inquiry", expectedGuestCount: "", linkedInvitationSlug: "",
  deposit: { status: "unpaid", amount: "", totalPrice: "", note: "" },
  vendors: [], timeline: [],
})

export default function VenuePortal() {
  const { user, venueId } = useAuthRole()
  const [venueName, setVenueName] = useState("")
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null) // "new" | eventId | null
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const authHeader = async () => {
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  const loadAll = async () => {
    if (!user || !venueId) return
    setLoading(true)
    try {
      const headers = await authHeader()
      const [profileRes, eventsRes] = await Promise.all([
        fetch(`/api/venues?self=1&id=${venueId}`, { headers }),
        fetch(`/api/venue-events?venueId=${venueId}&list=1`, { headers }),
      ])
      if (profileRes.ok) setVenueName((await profileRes.json()).name || "")
      if (eventsRes.ok) setEvents((await eventsRes.json()).events || [])
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [user, venueId])

  const startNew = () => { setForm(emptyForm()); setEditingId("new") }
  const startEdit = (ev) => {
    setForm({
      eventName: ev.eventName || "", eventType: ev.eventType || "wedding",
      date: ev.date || "", startTime: ev.startTime || "", endTime: ev.endTime || "",
      hallName: ev.hallName || "", status: ev.status || "inquiry",
      expectedGuestCount: ev.expectedGuestCount || "", linkedInvitationSlug: ev.linkedInvitationSlug || "",
      deposit: { status: ev.deposit?.status || "unpaid", amount: ev.deposit?.amount || "", totalPrice: ev.deposit?.totalPrice || "", note: ev.deposit?.note || "" },
      vendors: ev.vendors || [], timeline: ev.timeline || [],
    })
    setEditingId(ev.id)
  }

  const save = async () => {
    setSaving(true)
    try {
      const headers = { ...(await authHeader()), "Content-Type": "application/json" }
      const body = { ...form, eventId: editingId === "new" ? undefined : editingId }
      const res = await fetch(`/api/venue-events?venueId=${venueId}`, { method: "PUT", headers, body: JSON.stringify(body) })
      if (res.ok) { setEditingId(null); loadAll() }
    } catch (_) {}
    setSaving(false)
  }

  const remove = async (eventId) => {
    try {
      const headers = await authHeader()
      await fetch(`/api/venue-events?venueId=${venueId}&eventId=${eventId}`, { method: "DELETE", headers })
      loadAll()
    } catch (_) {}
  }

  const addVendor = () => setForm(f => ({ ...f, vendors: [...f.vendors, { id: Math.random().toString(36).slice(2), role: "other", name: "", phone: "", email: "", notes: "" }] }))
  const updateVendor = (id, field, value) => setForm(f => ({ ...f, vendors: f.vendors.map(v => v.id === id ? { ...v, [field]: value } : v) }))
  const removeVendor = (id) => setForm(f => ({ ...f, vendors: f.vendors.filter(v => v.id !== id) }))

  const addTimelineItem = () => setForm(f => ({ ...f, timeline: [...f.timeline, { id: Math.random().toString(36).slice(2), time: "", label: "" }] }))
  const updateTimelineItem = (id, field, value) => setForm(f => ({ ...f, timeline: f.timeline.map(t => t.id === id ? { ...t, [field]: value } : t) }))
  const removeTimelineItem = (id) => setForm(f => ({ ...f, timeline: f.timeline.filter(t => t.id !== id) }))

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition"
  const labelCls = "block text-white/40 text-xs uppercase tracking-wider mb-1"

  return (
    <div className="min-h-screen bg-[#0a0806] text-white" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-[#c9a96e] tracking-[0.3em] text-xs uppercase">Lumivite Venue Portal</p>
          <h1 className="font-serif text-2xl font-light">{venueName || "..."}</h1>
        </div>
        <button onClick={() => signOut(getAuth())} className="text-white/40 text-sm hover:text-white transition">Sign out</button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {!editingId && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg text-white/70">Your Events</h2>
            <button onClick={startNew}
              className="text-sm px-4 py-2 rounded-lg bg-[#c9a96e] text-black font-medium hover:bg-[#b8965d] transition">
              + New Event
            </button>
          </div>
        )}

        {loading && <p className="text-white/30 text-sm">Loading...</p>}

        {!loading && !editingId && events.length === 0 && (
          <p className="text-white/30 text-sm">No events yet. Click "+ New Event" to add your first booking.</p>
        )}

        {!editingId && (
          <div className="grid gap-3">
            {events.map(ev => (
              <div key={ev.id} className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium">{ev.eventName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLOR[ev.status]}22`, color: STATUS_COLOR[ev.status] }}>
                      {ev.status}
                    </span>
                    {ev.linkedInvitationSlug && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">🔗 Lumivite invitation</span>
                    )}
                  </div>
                  <p className="text-white/40 text-sm mt-1">
                    {ev.date || "No date"} {ev.hallName ? `· ${ev.hallName}` : ""} {ev.expectedGuestCount ? `· ${ev.expectedGuestCount} guests` : ""}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    Deposit: {ev.deposit?.status || "unpaid"} {ev.deposit?.amount ? `($${ev.deposit.amount}${ev.deposit.totalPrice ? ` of $${ev.deposit.totalPrice}` : ""})` : ""}
                  </p>
                </div>
                {ev.linkedInvitationSlug && (
                  <a href={`/seating/${ev.linkedInvitationSlug}`} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/10 transition whitespace-nowrap">
                    🪑 Seating
                  </a>
                )}
                <a href={`/vendor/${venueId}/${ev.id}`} target="_blank" rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/60 hover:bg-white/5 transition whitespace-nowrap">
                  📋 Vendor Link
                </a>
                <button onClick={() => startEdit(ev)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/60 hover:bg-white/5 transition">
                  Edit
                </button>
                <button onClick={() => remove(ev.id)}
                  className="text-xs px-2 py-1.5 rounded-lg text-white/30 hover:text-red-400 transition">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {editingId && (
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg text-white/80">{editingId === "new" ? "New Event" : "Edit Event"}</h2>
              <button onClick={() => setEditingId(null)} className="text-white/40 text-sm hover:text-white transition">Cancel</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className={labelCls}>Event Name</label>
                <input className={inputCls} value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} placeholder="e.g. Khoury & Haddad Wedding" />
              </div>
              <div>
                <label className={labelCls}>Event Type</label>
                <select className={inputCls} value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Hall</label>
                <input className={inputCls} value={form.hallName} onChange={e => setForm(f => ({ ...f, hallName: e.target.value }))} placeholder="e.g. Grand Ballroom" />
              </div>
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="time" className={inputCls} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="time" className={inputCls} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Expected Guest Count</label>
                <input type="number" className={inputCls} value={form.expectedGuestCount} onChange={e => setForm(f => ({ ...f, expectedGuestCount: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Linked Lumivite Invitation Slug (optional)</label>
                <input className={inputCls} value={form.linkedInvitationSlug} onChange={e => setForm(f => ({ ...f, linkedInvitationSlug: e.target.value }))} placeholder="e.g. khoury-haddad-2026" />
                <p className="text-white/25 text-xs mt-1">If the couple bought a Lumivite invitation, enter its link slug here to unlock the seating plan tool for this event.</p>
              </div>
            </div>

            <p className="text-[#c9a96e] text-xs uppercase tracking-widest mb-3">Deposit (tracked manually — no online payment)</p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.deposit.status} onChange={e => setForm(f => ({ ...f, deposit: { ...f.deposit, status: e.target.value } }))}>
                  {DEPOSIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Amount Paid ($)</label>
                <input type="number" className={inputCls} value={form.deposit.amount} onChange={e => setForm(f => ({ ...f, deposit: { ...f.deposit, amount: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>Total Price ($)</label>
                <input type="number" className={inputCls} value={form.deposit.totalPrice} onChange={e => setForm(f => ({ ...f, deposit: { ...f.deposit, totalPrice: e.target.value } }))} />
              </div>
              <div className="col-span-3">
                <label className={labelCls}>Note</label>
                <input className={inputCls} value={form.deposit.note} onChange={e => setForm(f => ({ ...f, deposit: { ...f.deposit, note: e.target.value } }))} placeholder="e.g. Paid via bank transfer on Nov 10" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-[#c9a96e] text-xs uppercase tracking-widest">Vendors</p>
              <button onClick={addVendor} className="text-xs text-[#c9a96e] hover:underline">+ Add Vendor</button>
            </div>
            <div className="grid gap-2 mb-5">
              {form.vendors.map(v => (
                <div key={v.id} className="grid grid-cols-12 gap-2 items-center">
                  <select className={`${inputCls} col-span-2`} value={v.role} onChange={e => updateVendor(v.id, "role", e.target.value)}>
                    {VENDOR_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input className={`${inputCls} col-span-3`} placeholder="Name" value={v.name} onChange={e => updateVendor(v.id, "name", e.target.value)} />
                  <input className={`${inputCls} col-span-2`} placeholder="Phone" value={v.phone} onChange={e => updateVendor(v.id, "phone", e.target.value)} />
                  <input className={`${inputCls} col-span-3`} placeholder="Email" value={v.email} onChange={e => updateVendor(v.id, "email", e.target.value)} />
                  <input className={`${inputCls} col-span-1`} placeholder="Notes" value={v.notes} onChange={e => updateVendor(v.id, "notes", e.target.value)} />
                  <button onClick={() => removeVendor(v.id)} className="col-span-1 text-white/30 hover:text-red-400 transition text-sm">✕</button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-[#c9a96e] text-xs uppercase tracking-widest">Timeline</p>
              <button onClick={addTimelineItem} className="text-xs text-[#c9a96e] hover:underline">+ Add Item</button>
            </div>
            <div className="grid gap-2 mb-6">
              {form.timeline.map(t => (
                <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                  <input type="time" className={`${inputCls} col-span-2`} value={t.time} onChange={e => updateTimelineItem(t.id, "time", e.target.value)} />
                  <input className={`${inputCls} col-span-9`} placeholder="e.g. Bride & groom entrance" value={t.label} onChange={e => updateTimelineItem(t.id, "label", e.target.value)} />
                  <button onClick={() => removeTimelineItem(t.id)} className="col-span-1 text-white/30 hover:text-red-400 transition text-sm">✕</button>
                </div>
              ))}
            </div>

            <button onClick={save} disabled={saving || !form.eventName}
              className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#b8965d] transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Event"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
