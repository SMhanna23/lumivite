import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { doc, getDoc, getDocs, updateDoc, query, collection, where } from "firebase/firestore"
import { db } from "../firebase"
import QRCode from "qrcode"

const GOLD = "#c9a96e"
const SIDE_COLOR = { groom: "#5b8def", bride: "#e8799e", mixed: GOLD }
const SIDE_LABEL = { groom: "Groom", bride: "Bride", mixed: "Either" }
const SIDE_CYCLE = { groom: "bride", bride: "mixed", mixed: "groom" }

const ELEMENT_TYPES = {
  dancefloor: { icon: "🪩", label: "Dance Floor", color: "#c084fc", w: 170, h: 170 },
  dj:         { icon: "🎧", label: "DJ Booth",    color: "#a78bfa", w: 120, h: 90 },
  bar:        { icon: "🍸", label: "Bar",         color: "#fbbf24", w: 150, h: 80 },
  stage:      { icon: "🎤", label: "Stage",       color: "#f87171", w: 190, h: 90 },
  cake:       { icon: "🎂", label: "Cake Table",  color: "#f472b6", w: 100, h: 80 },
  gifts:      { icon: "🎁", label: "Gift Table",  color: GOLD,      w: 100, h: 80 },
  buffet:     { icon: "🍽️", label: "Buffet",      color: "#fb923c", w: 170, h: 80 },
  photobooth: { icon: "📸", label: "Photo Booth", color: "#60a5fa", w: 110, h: 100 },
  entrance:   { icon: "🚪", label: "Entrance",    color: "#4ade80", w: 100, h: 60 },
  restroom:   { icon: "🚻", label: "Restrooms",   color: "#94a3b8", w: 90, h: 60 },
}

const uid = () => Math.random().toString(36).slice(2, 10)
const emptySeating = () => ({ enabled: false, tables: [], guests: [], elements: [] })

function tableFill(table, guests) {
  return guests.filter(g => g.tableId === table.id).reduce((sum, g) => sum + (g.persons || 1), 0)
}

export default function SeatingPanel({ order, onClose }) {
  const [loading, setLoading] = useState(true)
  const [docId, setDocId] = useState(null)
  const [seating, setSeating] = useState(emptySeating())
  const [search, setSearch] = useState("")
  const [hoverTableId, setHoverTableId] = useState(null)
  const [editingTableId, setEditingTableId] = useState(null)
  const [addingGuest, setAddingGuest] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: "", persons: 1, side: "mixed" })
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState("")
  const [arranging, setArranging] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showElementPicker, setShowElementPicker] = useState(false)
  const [editingElementId, setEditingElementId] = useState(null)

  const floorRef = useRef(null)
  const tableRefs = useRef({})

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "invitations"), where("orderId", "==", order.id))
        const qSnap = await getDocs(q)
        let id = null, data = null
        if (!qSnap.empty) {
          const freshest = qSnap.docs.slice().sort((a, b) => (b.data().updatedAt?.toMillis?.() || 0) - (a.data().updatedAt?.toMillis?.() || 0))[0]
          id = freshest.id
          data = freshest.data()
        } else if (order.slug) {
          const snap = await getDoc(doc(db, "invitations", order.slug))
          if (snap.exists()) { id = order.slug; data = snap.data() }
        }
        if (id) {
          setDocId(id)
          setSeating({ ...emptySeating(), ...(data.seating || {}) })
        }
      } catch (e) { /* no invitation built yet */ }
      setLoading(false)
    }
    load()
  }, [order.id])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = e => { if (e.key === "Escape") setFullscreen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  const persist = useCallback(async (next) => {
    setSeating(next)
    if (!docId) return
    try {
      await updateDoc(doc(db, "invitations", docId), { seating: next, updatedAt: new Date() })
    } catch (e) { /* silent — next edit will retry on next persist call */ }
  }, [docId])

  if (loading) return (
    <div className="border-t border-white/5 p-5">
      <p className="text-white/20 text-xs text-center animate-pulse">Loading seating...</p>
    </div>
  )

  if (!docId) return (
    <div className="border-t border-white/5 p-5">
      <p className="text-white/30 text-sm text-center">Build the invitation first, then come back to set up seating.</p>
    </div>
  )

  const unassigned = seating.guests.filter(g => !g.tableId)
  const filteredUnassigned = search.trim()
    ? unassigned.filter(g => g.name.toLowerCase().includes(search.trim().toLowerCase()))
    : unassigned

  // ── Table CRUD ──────────────────────────────────────────────────────────
  const addTable = () => {
    const n = seating.tables.length
    const col = n % 4, row = Math.floor(n / 4)
    const table = { id: uid(), label: `Table ${n + 1}`, capacity: 10, shape: "round", side: "mixed", x: 40 + col * 190, y: 40 + row * 190 }
    persist({ ...seating, tables: [...seating.tables, table] })
  }
  const updateTable = (id, patch) => {
    persist({ ...seating, tables: seating.tables.map(t => t.id === id ? { ...t, ...patch } : t) })
  }
  const deleteTable = (id) => {
    persist({
      ...seating,
      tables: seating.tables.filter(t => t.id !== id),
      guests: seating.guests.map(g => g.tableId === id ? { ...g, tableId: null } : g),
    })
    setEditingTableId(null)
  }
  const onTableDragEnd = (table, info) => {
    const newX = Math.max(0, table.x + info.offset.x)
    const newY = Math.max(0, table.y + info.offset.y)
    updateTable(table.id, { x: newX, y: newY })
  }

  // ── Venue element CRUD (dance floor, DJ, bar, etc.) ───────────────────────
  const addElement = (type) => {
    const n = seating.elements.length
    const element = { id: uid(), type, label: ELEMENT_TYPES[type].label, x: 40 + (n % 3) * 190, y: 700 + Math.floor(n / 3) * 190 }
    persist({ ...seating, elements: [...seating.elements, element] })
    setShowElementPicker(false)
  }
  const updateElement = (id, patch) => {
    persist({ ...seating, elements: seating.elements.map(el => el.id === id ? { ...el, ...patch } : el) })
  }
  const deleteElement = (id) => {
    persist({ ...seating, elements: seating.elements.filter(el => el.id !== id) })
    setEditingElementId(null)
  }
  const onElementDragEnd = (element, info) => {
    const newX = Math.max(0, element.x + info.offset.x)
    const newY = Math.max(0, element.y + info.offset.y)
    updateElement(element.id, { x: newX, y: newY })
  }

  // ── Guest CRUD ──────────────────────────────────────────────────────────
  const addGuestManually = () => {
    if (!newGuest.name.trim()) return
    const g = { id: uid(), name: newGuest.name.trim(), persons: Math.max(1, Number(newGuest.persons) || 1), side: newGuest.side, tableId: null, source: "manual", rsvpId: null }
    persist({ ...seating, guests: [...seating.guests, g] })
    setNewGuest({ name: "", persons: 1, side: "mixed" })
    setAddingGuest(false)
  }
  const removeGuest = (id) => {
    persist({ ...seating, guests: seating.guests.filter(g => g.id !== id) })
  }
  const cycleSide = (id) => {
    persist({ ...seating, guests: seating.guests.map(g => g.id === id ? { ...g, side: SIDE_CYCLE[g.side] || "mixed" } : g) })
  }
  const assignGuest = (guestId, tableId) => {
    persist({ ...seating, guests: seating.guests.map(g => g.id === guestId ? { ...g, tableId } : g) })
  }

  const hitTestTable = (point) => {
    for (const [id, el] of Object.entries(tableRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom) return id
    }
    return null
  }

  // ── Sync confirmed RSVPs ───────────────────────────────────────────────
  const syncRsvps = async () => {
    setSyncing(true)
    setSyncMsg("")
    try {
      const invSnap = await getDoc(doc(db, "invitations", docId))
      const inv = invSnap.data()
      const weddingName = inv.template === "birthday" ? `${inv.name}'s ${inv.age}th Birthday`
        : inv.template === "occasion" ? `${inv.title} — ${inv.eventType}`
        : `${inv.groom} & ${inv.bride}`
      const rSnap = await getDocs(query(collection(db, "rsvps"), where("wedding", "==", weddingName)))
      const confirmed = rSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.attending)
      const existingNames = new Set(seating.guests.map(g => g.name.trim().toLowerCase()))
      const toAdd = confirmed
        .filter(r => !existingNames.has(r.name.trim().toLowerCase()))
        .map(r => ({ id: uid(), name: r.name, persons: r.persons || 1, side: "mixed", tableId: null, source: "rsvp", rsvpId: r.id }))
      if (toAdd.length > 0) {
        await persist({ ...seating, guests: [...seating.guests, ...toAdd] })
        setSyncMsg(`✓ Added ${toAdd.length} new confirmed guest${toAdd.length > 1 ? "s" : ""}`)
      } else {
        setSyncMsg("✓ Already up to date")
      }
    } catch (e) {
      setSyncMsg("Sync failed")
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(""), 4000)
  }

  // ── Genius auto-arrange ─────────────────────────────────────────────────
  const autoArrange = () => {
    setArranging(true)
    const tables = seating.tables.map(t => ({ ...t, fill: tableFill(t, seating.guests) }))
    const toPlace = seating.guests.filter(g => !g.tableId).slice().sort((a, b) => (b.persons || 1) - (a.persons || 1))
    const guestPatch = {}
    for (const g of toPlace) {
      const need = g.persons || 1
      const candidates = tables
        .filter(t => t.capacity - t.fill >= need)
        .sort((a, b) => {
          const aSide = a.fill > 0 && seating.guests.some(x => x.tableId === a.id && x.side === g.side)
          const bSide = b.fill > 0 && seating.guests.some(x => x.tableId === b.id && x.side === g.side)
          if (aSide !== bSide) return aSide ? -1 : 1
          return (a.capacity - a.fill) - (b.capacity - b.fill) // best fit: least remaining space first
        })
      const chosen = candidates[0]
      if (chosen) {
        guestPatch[g.id] = chosen.id
        chosen.fill += need
      }
    }
    const nextGuests = seating.guests.map(g => guestPatch[g.id] ? { ...g, tableId: guestPatch[g.id] } : g)
    persist({ ...seating, guests: nextGuests })
    setArranging(false)
  }

  // ── QR code ─────────────────────────────────────────────────────────────
  const downloadQr = async () => {
    const url = `https://www.lumivite.net/seat/${docId}`
    const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 2, color: { dark: "#0c0b09", light: "#ffffff" } })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `seating-qr-${docId}.png`
    a.click()
  }

  // ── CSV export ──────────────────────────────────────────────────────────
  const exportCsv = () => {
    const rows = [["Table", "Guest", "Persons", "Side"]]
    const sorted = seating.tables.slice().sort((a, b) => a.label.localeCompare(b.label))
    for (const t of sorted) {
      const guestsHere = seating.guests.filter(g => g.tableId === t.id)
      if (guestsHere.length === 0) { rows.push([t.label, "(empty)", "", ""]); continue }
      for (const g of guestsHere) rows.push([t.label, g.name, g.persons, SIDE_LABEL[g.side] || ""])
    }
    const unseated = seating.guests.filter(g => !g.tableId)
    for (const g of unseated) rows.push(["(Unassigned)", g.name, g.persons, SIDE_LABEL[g.side] || ""])
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `seating-${docId}.csv`
    a.click()
  }

  return (
    <div className="border-t border-white/5 p-5 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#c9a96e] text-xs uppercase tracking-widest font-semibold">🪑 Seating Arrangement</p>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={seating.enabled} onChange={e => persist({ ...seating, enabled: e.target.checked })}
            className="w-4 h-4 rounded accent-[#c9a96e]" />
          <span className="text-white/50 text-xs">Enabled for guests (Gold only)</span>
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={addTable} className="text-xs px-3 py-1.5 rounded-full font-medium transition"
          style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.35)", color: GOLD }}>
          + Add Table
        </button>
        <div className="relative">
          <button onClick={() => setShowElementPicker(p => !p)} className="text-xs px-3 py-1.5 rounded-full font-medium transition"
            style={{ background: "rgba(192,132,252,0.12)", border: "1px solid rgba(192,132,252,0.35)", color: "#c084fc" }}>
            + Add Venue Element
          </button>
          {showElementPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowElementPicker(false)} />
              <div className="absolute z-50 top-full mt-2 left-0 w-64 rounded-xl p-2 grid grid-cols-2 gap-1.5"
                style={{ background: "#1a1510", border: "1px solid rgba(192,132,252,0.3)" }}>
                {Object.entries(ELEMENT_TYPES).map(([type, cfg]) => (
                  <button key={type} onClick={() => addElement(type)}
                    className="flex items-center gap-2 text-left px-2 py-2 rounded-lg transition hover:bg-white/5">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className="text-white/70 text-xs">{cfg.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button onClick={autoArrange} disabled={arranging || unassigned.length === 0}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition disabled:opacity-40"
          style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
          ✨ Genius Auto-Arrange
        </button>
        <button onClick={syncRsvps} disabled={syncing}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition disabled:opacity-50 text-white/50 border border-white/10 hover:border-white/20">
          {syncing ? "Syncing…" : "🔄 Sync RSVPs"}
        </button>
        <button onClick={downloadQr} className="text-xs px-3 py-1.5 rounded-full font-medium transition text-white/50 border border-white/10 hover:border-white/20">
          📱 Download QR
        </button>
        <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-full font-medium transition text-white/50 border border-white/10 hover:border-white/20">
          ⬇ Export CSV
        </button>
        <button onClick={() => setFullscreen(true)} className="text-xs px-3 py-1.5 rounded-full font-medium transition text-white/50 border border-white/10 hover:border-white/20">
          ⛶ Fullscreen
        </button>
        {syncMsg && <span className="text-xs text-white/40">{syncMsg}</span>}
      </div>

      <div className={fullscreen
        ? "fixed inset-0 z-[100] bg-[#0c0b09] p-4 flex flex-col"
        : "flex gap-4 flex-col lg:flex-row"}>
        {fullscreen && (
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <p className="text-[#c9a96e] text-sm font-semibold">🪑 Seating Arrangement — Fullscreen</p>
            <button onClick={() => setFullscreen(false)}
              className="text-xs px-4 py-2 rounded-full font-medium text-white/60 border border-white/15 hover:border-white/30 transition">
              ✕ Exit Fullscreen (Esc)
            </button>
          </div>
        )}
        <div className={fullscreen ? "flex gap-4 flex-1 min-h-0" : "flex gap-4 flex-col lg:flex-row w-full"}>
        {/* Floor plan */}
        <div ref={floorRef} className="relative flex-1 rounded-xl overflow-auto"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", height: fullscreen ? "100%" : 560 }}>
          <div style={{ position: "relative", width: fullscreen ? 2200 : 1200, height: fullscreen ? 1400 : 900 }}>
            {seating.tables.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <p className="text-white/30 text-base">No tables yet</p>
                <button onClick={addTable} className="text-sm px-5 py-2.5 rounded-full font-medium transition"
                  style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.35)", color: GOLD }}>
                  + Add Your First Table
                </button>
              </div>
            )}
            {seating.elements.map(element => {
              const cfg = ELEMENT_TYPES[element.type] || ELEMENT_TYPES.dancefloor
              return (
                <motion.div
                  key={`${element.id}-${element.x}-${element.y}`}
                  drag dragMomentum={false}
                  onDragEnd={(e, info) => onElementDragEnd(element, info)}
                  style={{ position: "absolute", left: element.x, top: element.y, width: cfg.w, height: cfg.h, cursor: "grab" }}
                  whileDrag={{ zIndex: 40, cursor: "grabbing" }}
                  className="rounded-2xl select-none flex flex-col items-center justify-center gap-1"
                  onTap={() => setEditingElementId(editingElementId === element.id ? null : element.id)}>
                  <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-1 pointer-events-none"
                    style={{ background: `${cfg.color}1a`, border: `1.5px dashed ${cfg.color}66` }}>
                    <span style={{ fontSize: Math.min(cfg.w, cfg.h) * 0.3 }}>{cfg.icon}</span>
                    <span className="text-[10px] font-medium text-center px-1" style={{ color: cfg.color }}>{element.label}</span>
                  </div>

                  {editingElementId === element.id && (
                    <div className="absolute z-50 top-full mt-2 left-0 w-52 rounded-xl p-3 space-y-2"
                      style={{ background: "#1a1510", border: `1px solid ${cfg.color}55` }}
                      onPointerDown={e => e.stopPropagation()}>
                      <input value={element.label} onChange={e => updateElement(element.id, { label: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
                      <button onClick={() => deleteElement(element.id)}
                        className="w-full text-[10px] py-1.5 rounded-lg text-red-400 border border-red-400/30 hover:bg-red-400/10 transition">
                        Remove
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
            {seating.tables.map(table => {
              const fill = tableFill(table, seating.guests)
              const pct = table.capacity > 0 ? fill / table.capacity : 0
              const color = pct > 1 ? "#f87171" : pct >= 0.8 ? "#fbbf24" : "#4ade80"
              const guestsHere = seating.guests.filter(g => g.tableId === table.id)
              const isHover = hoverTableId === table.id
              return (
                <motion.div
                  key={`${table.id}-${table.x}-${table.y}`}
                  ref={el => { tableRefs.current[table.id] = el }}
                  drag dragMomentum={false}
                  onDragEnd={(e, info) => onTableDragEnd(table, info)}
                  style={{ position: "absolute", left: table.x, top: table.y, width: 170, cursor: "grab" }}
                  whileDrag={{ zIndex: 50, cursor: "grabbing" }}
                  className="rounded-2xl p-3 select-none"
                  initial={false}
                  animate={{ boxShadow: isHover ? `0 0 0 2px ${GOLD}` : "0 0 0 0px transparent" }}>
                  <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}55` }}>
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setEditingTableId(editingTableId === table.id ? null : table.id)}
                        className="text-white text-xs font-medium hover:underline truncate">{table.label}</button>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}22` }}>
                        {fill}/{table.capacity}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-[22px]">
                      {guestsHere.length === 0 && <span className="text-white/15 text-[10px]">empty</span>}
                      {guestsHere.map(g => (
                        <GuestChip key={g.id} guest={g} onRemove={() => assignGuest(g.id, null)} onCycleSide={() => cycleSide(g.id)}
                          onDragEnd={(point) => {
                            assignGuest(g.id, hitTestTable(point))
                            setHoverTableId(null)
                          }}
                          onDragMove={(point) => setHoverTableId(hitTestTable(point))}
                          small showRemove />
                      ))}
                    </div>
                  </div>

                  {editingTableId === table.id && (
                    <div className="absolute z-50 top-full mt-2 left-0 w-56 rounded-xl p-3 space-y-2"
                      style={{ background: "#1a1510", border: "1px solid rgba(201,169,110,0.3)" }}
                      onPointerDown={e => e.stopPropagation()}>
                      <input value={table.label} onChange={e => updateTable(table.id, { label: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c9a96e]" />
                      <div className="flex items-center gap-2">
                        <label className="text-white/30 text-[10px]">Capacity</label>
                        <input type="number" min={1} value={table.capacity}
                          onChange={e => updateTable(table.id, { capacity: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#c9a96e]" />
                      </div>
                      <div className="flex gap-1">
                        {["groom", "bride", "mixed"].map(s => (
                          <button key={s} onClick={() => updateTable(table.id, { side: s })}
                            className="flex-1 text-[10px] py-1 rounded-full transition"
                            style={{ background: table.side === s ? `${SIDE_COLOR[s]}33` : "rgba(255,255,255,0.04)", color: table.side === s ? SIDE_COLOR[s] : "rgba(255,255,255,0.4)" }}>
                            {SIDE_LABEL[s]}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => deleteTable(table.id)}
                        className="w-full text-[10px] py-1.5 rounded-lg text-red-400 border border-red-400/30 hover:bg-red-400/10 transition">
                        Delete table
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Guest pool */}
        <div className="w-full lg:w-72 flex-shrink-0 rounded-xl p-3 flex flex-col"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", height: fullscreen ? "100%" : 560 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mb-2 focus:outline-none focus:border-[#c9a96e]" />
          <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">
            Unassigned ({filteredUnassigned.length})
          </p>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" onPointerUp={() => setHoverTableId(null)}>
            {filteredUnassigned.map(g => (
              <GuestChip key={g.id} guest={g} onRemove={() => removeGuest(g.id)} onCycleSide={() => cycleSide(g.id)}
                onDragEnd={(point) => {
                  const target = hitTestTable(point)
                  if (target) assignGuest(g.id, target)
                  setHoverTableId(null)
                }}
                onDragMove={(point) => setHoverTableId(hitTestTable(point))}
                showRemove />
            ))}
            {filteredUnassigned.length === 0 && <p className="text-white/15 text-xs text-center py-4">No unassigned guests</p>}
          </div>

          {addingGuest ? (
            <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
              <input value={newGuest.name} onChange={e => setNewGuest(p => ({ ...p, name: e.target.value }))}
                placeholder="Guest name" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c9a96e]" />
              <div className="flex gap-1.5">
                <input type="number" min={1} value={newGuest.persons}
                  onChange={e => setNewGuest(p => ({ ...p, persons: e.target.value }))}
                  className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c9a96e]" />
                <button onClick={addGuestManually} className="flex-1 text-xs rounded-lg" style={{ background: "rgba(201,169,110,0.15)", color: GOLD }}>Add</button>
                <button onClick={() => setAddingGuest(false)} className="px-2 text-xs text-white/30">✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingGuest(true)}
              className="mt-2 text-xs py-2 rounded-lg border border-white/10 text-white/50 hover:border-white/20 transition">
              + Add Guest Manually
            </button>
          )}
        </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 transition">Close</button>
      </div>

      {/* Print-only view */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold mb-4">Seating — {order.groomName} &amp; {order.brideName}</h1>
        {seating.tables.map(t => (
          <div key={t.id} className="mb-3">
            <p className="font-semibold">{t.label} ({tableFill(t, seating.guests)}/{t.capacity})</p>
            <ul className="text-sm pl-4 list-disc">
              {seating.guests.filter(g => g.tableId === t.id).map(g => <li key={g.id}>{g.name} ({g.persons})</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// framer-motion's PanInfo.point is page-relative (event.pageX/pageY), but table hit-testing
// uses getBoundingClientRect() which is viewport-relative — read the raw event's clientX/clientY
// instead so dragging still works correctly when the admin page itself is scrolled.
function clientPoint(e) {
  if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  if (e.changedTouches?.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

function GuestChip({ guest, onRemove, onCycleSide, onDragEnd, onDragMove, small, showRemove }) {
  return (
    <motion.div
      drag dragSnapToOrigin dragMomentum={false}
      onDrag={(e) => onDragMove?.(clientPoint(e))}
      onDragEnd={(e) => onDragEnd?.(clientPoint(e))}
      whileDrag={{ zIndex: 60, scale: 1.05 }}
      className="flex items-center gap-1.5 rounded-full select-none cursor-grab active:cursor-grabbing"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${SIDE_COLOR[guest.side] || GOLD}55`,
        padding: small ? "2px 8px" : "6px 10px",
        fontSize: small ? "10px" : "12px",
      }}>
      <button onClick={(e) => { e.stopPropagation(); onCycleSide?.() }}
        className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SIDE_COLOR[guest.side] || GOLD }} title="Click to change side" />
      <span className="text-white/80 truncate" style={{ maxWidth: small ? 90 : 140 }}>{guest.name}</span>
      {guest.persons > 1 && <span className="text-white/30 flex-shrink-0">×{guest.persons}</span>}
      {showRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove?.() }} className="text-white/20 hover:text-red-400 flex-shrink-0 ml-0.5">✕</button>
      )}
    </motion.div>
  )
}
