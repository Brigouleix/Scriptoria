'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ImagePlus, Loader2, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────
interface MapLocation {
  id: string; name: string; description: string | null; map_x: number; map_y: number
}
interface Person {
  id: string; name: string; avatar_url: string | null
}
interface Chapter {
  id: string; title: string; position: number
}
interface CharacterPin {
  id: string; person_id: string; pin_x: number; pin_y: number
}

// ── Palette ───────────────────────────────────────────────────────
const COLORS = ['#f59e0b','#ef4444','#8b5cf6','#0d9488','#3b82f6','#ec4899','#f97316','#84cc16']
const personColor = (people: Person[], id: string) =>
  COLORS[people.findIndex((p) => p.id === id) % COLORS.length] ?? COLORS[0]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function PersonAvatar({ person, color, size = 28 }: { person: Person; color: string; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.32 }}
    >
      {person.avatar_url
        ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
        : initials(person.name)
      }
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function CharacterMap({
  initialLocations,
  people,
  chapters,
  projectId,
  initialBgUrl,
}: {
  initialLocations: MapLocation[]
  people: Person[]
  chapters: Chapter[]
  projectId: string
  initialBgUrl?: string | null
}) {
  const [locations,         setLocations]         = useState<MapLocation[]>(initialLocations)
  const [selectedChapterId, setSelectedChapterId] = useState<string>(chapters[0]?.id ?? '')
  const [pins,              setPins]              = useState<CharacterPin[]>([])
  const [loadingPins,       setLoadingPins]       = useState(false)
  const [bgUrl,             setBgUrl]             = useState<string | null>(initialBgUrl ?? null)
  const [uploadingBg,       setUploadingBg]       = useState(false)

  // Popover (coordonnées viewport pour le portal)
  const [popover,          setPopover]          = useState<{ clientX: number; clientY: number; canvasX: number; canvasY: number } | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [hoveredPinId,     setHoveredPinId]     = useState<string | null>(null)
  const [mounted,          setMounted]          = useState(false)
  useEffect(() => setMounted(true), [])

  // Zoom / Pan
  const [zoom,      setZoom]      = useState(1)
  const [pan,       setPan]       = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  // Refs pour les handlers globaux (évite les re-registrations)
  const zoomRef        = useRef(1)
  const panRef         = useRef({ x: 0, y: 0 })
  const locationsRef   = useRef(locations)
  const pinsRef        = useRef(pins)

  useEffect(() => { zoomRef.current = zoom },           [zoom])
  useEffect(() => { panRef.current  = pan },            [pan])
  useEffect(() => { locationsRef.current = locations }, [locations])
  useEffect(() => { pinsRef.current  = pins },          [pins])

  // Drag refs
  const locDragRef   = useRef<{ id: string; startMouseX: number; startMouseY: number; origX: number; origY: number } | null>(null)
  const pinDragRef   = useRef<{ id: string; startMouseX: number; startMouseY: number; origX: number; origY: number } | null>(null)
  const panDragRef   = useRef<{ startX: number; startY: number; origPan: { x: number; y: number } } | null>(null)
  const mouseMovedRef = useRef(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const bgInput   = useRef<HTMLInputElement>(null)

  // ── Charger les épingles ──────────────────────────────────────
  useEffect(() => {
    if (!selectedChapterId) return
    setLoadingPins(true)
    setPins([])
    createClient()
      .from('character_pins')
      .select('id, person_id, pin_x, pin_y')
      .eq('chapter_id', selectedChapterId)
      .then(({ data }) => { setPins(data ?? []); setLoadingPins(false) })
  }, [selectedChapterId])

  // ── Wheel zoom (passive: false requis) ───────────────────────
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect   = el!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const z      = zoomRef.current
      const p      = panRef.current
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const nz     = Math.max(0.2, Math.min(8, z * factor))
      setZoom(nz)
      setPan({ x: mouseX - (mouseX - p.x) * (nz / z), y: mouseY - (mouseY - p.y) * (nz / z) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── Conversion coords écran → % canvas ───────────────────────
  function screenToCanvasPct(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: Math.max(1, Math.min(99, ((clientX - rect.left - panRef.current.x) / zoomRef.current / rect.width)  * 100)),
      y: Math.max(1, Math.min(99, ((clientY - rect.top  - panRef.current.y) / zoomRef.current / rect.height) * 100)),
    }
  }

  // ── MouseDown canvas (start pan ou drag) ─────────────────────
  function handleCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-click]')) return
    mouseMovedRef.current = false
    panDragRef.current = { startX: e.clientX, startY: e.clientY, origPan: { ...panRef.current } }
  }

  // ── Click canvas → popover ────────────────────────────────────
  function handleCanvasClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-click]')) return
    if (mouseMovedRef.current) return
    const { x, y } = screenToCanvasPct(e.clientX, e.clientY)
    setPopover({ clientX: e.clientX, clientY: e.clientY, canvasX: x, canvasY: y })
    setSelectedPersonId('')
  }

  // ── Global mousemove / mouseup ────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const z = zoomRef.current

      // Pan
      if (panDragRef.current) {
        const dx = e.clientX - panDragRef.current.startX
        const dy = e.clientY - panDragRef.current.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { mouseMovedRef.current = true; setIsPanning(true) }
        setPan({ x: panDragRef.current.origPan.x + dx, y: panDragRef.current.origPan.y + dy })
      }

      // Drag lieu
      const locDrag = locDragRef.current
      if (locDrag) {
        const dx = ((e.clientX - locDrag.startMouseX) / rect.width)  * 100 / z
        const dy = ((e.clientY - locDrag.startMouseY) / rect.height) * 100 / z
        const nx = Math.max(2, Math.min(98, locDrag.origX + dx))
        const ny = Math.max(2, Math.min(98, locDrag.origY + dy))
        setLocations((prev) => prev.map((l) => l.id === locDrag.id ? { ...l, map_x: nx, map_y: ny } : l))
      }

      // Drag épingle
      const pinDrag = pinDragRef.current
      if (pinDrag) {
        const dx = ((e.clientX - pinDrag.startMouseX) / rect.width)  * 100 / z
        const dy = ((e.clientY - pinDrag.startMouseY) / rect.height) * 100 / z
        const nx = Math.max(1, Math.min(99, pinDrag.origX + dx))
        const ny = Math.max(1, Math.min(99, pinDrag.origY + dy))
        setPins((prev) => prev.map((p) => p.id === pinDrag.id ? { ...p, pin_x: nx, pin_y: ny } : p))
      }
    }

    async function onUp() {
      setIsPanning(false)
      if (panDragRef.current) { panDragRef.current = null }

      const supabase = createClient()

      if (locDragRef.current) {
        const id  = locDragRef.current.id
        locDragRef.current = null
        const loc = locationsRef.current.find((l) => l.id === id)
        if (loc) await supabase.from('locations').update({
          map_x: Math.round(loc.map_x * 10) / 10,
          map_y: Math.round(loc.map_y * 10) / 10,
        }).eq('id', id)
      }

      if (pinDragRef.current) {
        const id  = pinDragRef.current.id
        pinDragRef.current = null
        const pin = pinsRef.current.find((p) => p.id === id)
        if (pin) await supabase.from('character_pins').update({
          pin_x: Math.round(pin.pin_x * 10) / 10,
          pin_y: Math.round(pin.pin_y * 10) / 10,
        }).eq('id', id)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, []) // deps vides → utilise les refs

  // ── Créer une épingle ─────────────────────────────────────────
  async function createPin() {
    if (!popover || !selectedPersonId || !selectedChapterId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('character_pins')
      .insert({ user_id: user.id, chapter_id: selectedChapterId, person_id: selectedPersonId, pin_x: popover.canvasX, pin_y: popover.canvasY })
      .select('id, person_id, pin_x, pin_y').single()
    if (data) setPins((prev) => [...prev, data])
    setPopover(null)
    setSelectedPersonId('')
  }

  async function deletePin(pinId: string) {
    setPins((prev) => prev.filter((p) => p.id !== pinId))
    await createClient().from('character_pins').delete().eq('id', pinId)
  }

  // ── Upload image de fond ───────────────────────────────────────
  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBg(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingBg(false); return }
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/projects/${projectId}/map_bg.${ext}`
    await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    setBgUrl(url)
    await supabase.from('projects').update({ map_bg_url: url }).eq('id', projectId)
    setUploadingBg(false)
  }

  async function removeBg() {
    setBgUrl(null)
    await createClient().from('projects').update({ map_bg_url: null }).eq('id', projectId)
  }

  // ── Drag : lieux ─────────────────────────────────────────────
  function startLocDrag(e: React.MouseEvent, loc: MapLocation) {
    e.preventDefault(); e.stopPropagation()
    locDragRef.current = { id: loc.id, startMouseX: e.clientX, startMouseY: e.clientY, origX: loc.map_x, origY: loc.map_y }
  }

  // ── Drag : épingles ───────────────────────────────────────────
  function startPinDrag(e: React.MouseEvent, pin: CharacterPin) {
    e.preventDefault(); e.stopPropagation()
    pinDragRef.current = { id: pin.id, startMouseX: e.clientX, startMouseY: e.clientY, origX: pin.pin_x, origY: pin.pin_y }
  }

  // ── Zoom controls ─────────────────────────────────────────────
  function zoomIn()    { setZoom((z) => Math.min(8, z * 1.25)) }
  function zoomOut()   { setZoom((z) => Math.max(0.2, z / 1.25)) }
  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }) }

  const pinnedIds      = new Set(pins.map((p) => p.person_id))
  const unpinnedPeople = people.filter((p) => !pinnedIds.has(p.id))

  if (chapters.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-xl p-8 text-center text-sm text-[var(--text-muted)]">
        Créez d&apos;abord des chapitres dans l&apos;onglet <span className="font-medium text-amber-500">Chapitres</span>.
      </div>
    )
  }

  // ── Popover via portal (au-dessus de tout, jamais tronqué) ──────
  const popoverPortal = mounted && popover && createPortal(
    <>
      {/* Overlay transparent : clic en dehors → ferme */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => { setPopover(null); setSelectedPersonId('') }}
      />
      {/* Carte de sélection */}
      <div
        className="fixed z-[9999] bg-[var(--bg-card)] border border-amber-500 rounded-xl shadow-2xl p-3 flex flex-col gap-2 min-w-[190px]"
        style={{
          left: popover.clientX + 10 + 205 > window.innerWidth  ? popover.clientX - 215 : popover.clientX + 10,
          top:  popover.clientY + 10 + 230 > window.innerHeight ? popover.clientY - 240 : popover.clientY + 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold text-[var(--text-primary)]">Épingler un personnage</p>

        {unpinnedPeople.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">Tous les personnages sont déjà épinglés.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            {unpinnedPeople.map((p) => {
              const color = personColor(people, p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonId(p.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    selectedPersonId === p.id
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: color, fontSize: 8, fontWeight: 700 }}
                  >
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                      : initials(p.name)
                    }
                  </div>
                  {p.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { setPopover(null); setSelectedPersonId('') }}
            className="flex-1 text-xs py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
          >
            Annuler
          </button>
          <button
            onClick={createPin}
            disabled={!selectedPersonId}
            className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-semibold transition-colors"
          >
            Épingler
          </button>
        </div>
      </div>
    </>,
    document.body
  )

  return (
    <div className="flex flex-col gap-4">
      {popoverPortal}

      {/* ── Sélecteur de chapitre ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-[var(--text-secondary)]">Chapitre :</span>
        <div className="flex flex-wrap gap-1.5">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapterId(ch.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedChapterId === ch.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border)] hover:border-amber-500/50 hover:text-[var(--text-primary)]'
              }`}
            >
              {ch.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ── Canvas ── */}
        <div className="lg:col-span-2 flex flex-col gap-2">

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">
              Clic pour épingler · Molette pour zoomer · Glisser le fond pour déplacer
            </span>
            <div className="ml-auto flex items-center gap-2">
              {bgUrl && (
                <button onClick={removeBg} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors">
                  <X size={11} /> Retirer le fond
                </button>
              )}
              <button
                onClick={() => bgInput.current?.click()}
                disabled={uploadingBg}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-amber-500/50 hover:text-amber-500 transition-colors disabled:opacity-50"
              >
                {uploadingBg ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                {bgUrl ? 'Changer le fond' : 'Image de fond'}
              </button>
              <input ref={bgInput} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            </div>
          </div>

          {/* Canvas principal */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-2xl border-2 border-dashed border-amber-500/20 overflow-hidden select-none"
            style={{
              paddingBottom: '62%',
              backgroundColor: 'var(--bg-card)',
              cursor: isPanning ? 'grabbing' : 'crosshair',
            }}
            onMouseDown={handleCanvasMouseDown}
            onClick={handleCanvasClick}
          >
            {/* ── Contenu transformé (zoom + pan) ── */}
            <div
              style={{
                position:        'absolute',
                inset:           0,
                transform:       `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                backgroundImage: bgUrl
                  ? `url(${bgUrl})`
                  : 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                backgroundSize:     bgUrl ? 'cover' : '28px 28px',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay sombre sur image */}
              {bgUrl && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}

              {/* ── Nœuds de lieux ── */}
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  data-no-click="true"
                  className="absolute flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing"
                  style={{ left: `${loc.map_x}%`, top: `${loc.map_y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
                  onMouseDown={(e) => startLocDrag(e, loc)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border-2 border-white/40">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20 shadow whitespace-nowrap max-w-[110px] truncate">
                    {loc.name}
                  </span>
                </div>
              ))}

              {/* ── Épingles de personnages ── */}
              {pins.map((pin) => {
                const person = people.find((p) => p.id === pin.person_id)
                if (!person) return null
                const color = personColor(people, pin.person_id)
                const isHovered = hoveredPinId === pin.id
                return (
                  <div
                    key={pin.id}
                    data-no-click="true"
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ left: `${pin.pin_x}%`, top: `${pin.pin_y}%`, transform: 'translate(-50%, -100%)', zIndex: isHovered ? 30 : 20 }}
                    onMouseDown={(e) => startPinDrag(e, pin)}
                    onMouseEnter={() => setHoveredPinId(pin.id)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); deletePin(pin.id) }}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow z-30 transition-opacity"
                        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
                      >
                        <X size={9} className="text-white" />
                      </button>
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/60"
                        style={{ backgroundColor: color, fontSize: 13 }}
                      >
                        {person.avatar_url
                          ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                          : initials(person.name)
                        }
                      </div>
                      <span className="text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full whitespace-nowrap shadow">
                        {person.name.split(' ')[0]}
                      </span>
                      <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Popover rendu via portal → voir fin du composant */}

            {/* ── Contrôles de zoom (overlay bas-droite) ── */}
            <div
              data-no-click="true"
              className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-[var(--bg-card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-lg px-2 py-1 shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={zoomOut}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
              >
                <ZoomOut size={13} />
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={resetView}
                className="text-[10px] font-mono w-9 text-center text-[var(--text-secondary)] hover:text-amber-500 transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={zoomIn}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
              >
                <ZoomIn size={13} />
              </button>
              <div className="w-px h-3 bg-[var(--border)] mx-0.5" />
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={resetView}
                className="text-[var(--text-muted)] hover:text-amber-500 transition-colors p-0.5"
                title="Réinitialiser la vue"
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* ── Hint si canvas vide ── */}
            {pins.length === 0 && locations.length === 0 && !loadingPins && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-[var(--text-muted)] opacity-60 text-center">
                  Cliquez n&apos;importe où pour épingler un personnage
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panneau latéral ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {loadingPins ? 'Chargement…' : `${pins.length} épingle${pins.length !== 1 ? 's' : ''} ce chapitre`}
          </p>

          {pins.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pins.map((pin) => {
                const person = people.find((p) => p.id === pin.person_id)
                if (!person) return null
                const color = personColor(people, pin.person_id)
                return (
                  <div key={pin.id} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                    <PersonAvatar person={person} color={color} size={24} />
                    <span className="text-xs text-[var(--text-primary)] flex-1 truncate">{person.name}</span>
                    <button
                      onClick={() => deletePin(pin.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {unpinnedPeople.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">
                Pas encore épinglés
              </p>
              {unpinnedPeople.map((p) => {
                const color = personColor(people, p.id)
                return (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1 rounded-lg text-[var(--text-muted)] text-xs opacity-50">
                    <PersonAvatar person={p} color={color} size={20} />
                    {p.name}
                  </div>
                )
              })}
            </div>
          )}

          {people.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic">Aucun personnage dans ce projet.</p>
          )}

          {people.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--border)]">
              {people.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {p.name.split(' ')[0]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
