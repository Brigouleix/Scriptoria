'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, X, Loader2, ImagePlus, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LocationPhoto {
  id: string
  storage_path: string
  name: string
}

interface Location {
  id: string
  name: string
  description: string | null
  location_photos: LocationPhoto[]
}

// ── Photo grid inside a card ────────────────────────────────────
function PhotoGrid({
  locationId,
  photos,
  onPhotosChange,
}: {
  locationId: string
  photos: LocationPhoto[]
  onPhotosChange: (locationId: string, photos: LocationPhoto[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const newPhotos: LocationPhoto[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const slug = Math.random().toString(36).slice(2)
      const path = `${user.id}/locations/${locationId}/${Date.now()}_${slug}.${ext}`

      const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
      if (error) continue

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      const { data: row } = await supabase.from('location_photos')
        .insert({ location_id: locationId, user_id: user.id, storage_path: publicUrl, name: file.name })
        .select('id, storage_path, name')
        .single()
      if (row) newPhotos.push(row)
    }

    onPhotosChange(locationId, [...photos, ...newPhotos])
    setUploading(false)
    e.target.value = ''
  }

  async function handleDeletePhoto(photo: LocationPhoto) {
    setDeletingId(photo.id)
    const supabase = createClient()
    await supabase.from('location_photos').delete().eq('id', photo.id)
    onPhotosChange(locationId, photos.filter((p) => p.id !== photo.id))
    setDeletingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-input)]">
            <img src={photo.storage_path} alt={photo.name} className="w-full h-full object-cover" />
            <button
              onClick={() => handleDeletePhoto(photo)}
              disabled={deletingId === photo.id}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deletingId === photo.id
                ? <Loader2 size={10} className="animate-spin text-white" />
                : <X size={10} className="text-white" />
              }
            </button>
          </div>
        ))}

        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-[var(--border)] hover:border-amber-500/50 flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
        >
          {uploading
            ? <Loader2 size={18} className="animate-spin" />
            : <ImagePlus size={18} />
          }
          <span className="text-[10px]">{uploading ? 'Envoi…' : 'Ajouter'}</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
    </div>
  )
}

// ── Location card ───────────────────────────────────────────────
function LocationCard({
  location,
  onDelete,
  onPhotosChange,
}: {
  location: Location
  onDelete: (id: string) => void
  onPhotosChange: (locationId: string, photos: LocationPhoto[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cover = location.location_photos[0]?.storage_path

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('locations').delete().eq('id', location.id)
    onDelete(location.id)
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl overflow-hidden">
      {/* Cover photo */}
      {cover && (
        <div className="h-36 overflow-hidden">
          <img src={cover} alt={location.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-amber-500 shrink-0" />
            <p className="font-semibold text-[var(--text-primary)] truncate">{location.name}</p>
          </div>
          {location.description && (
            <p className="text-[var(--text-muted)] text-sm mt-0.5 line-clamp-2">{location.description}</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {location.location_photos.length} photo{location.location_photos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-40"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded: photo grid */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
          <PhotoGrid
            locationId={location.id}
            photos={location.location_photos}
            onPhotosChange={onPhotosChange}
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function LocationsManager({ initialLocations }: { initialLocations: Location[] }) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('locations')
      .insert({ name: name.trim(), description: description.trim() || null, user_id: user.id })
      .select('id, name, description')
      .single()
    setLoading(false)
    if (!error && data) {
      setLocations((prev) => [{ ...data, location_photos: [] }, ...prev])
      setOpen(false)
      setName('')
      setDescription('')
    }
  }

  function handlePhotosChange(locationId: string, photos: LocationPhoto[]) {
    setLocations((prev) => prev.map((l) => l.id === locationId ? { ...l, location_photos: photos } : l))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {locations.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 flex flex-col items-center gap-3 text-center">
            <MapPin className="text-amber-500" size={24} />
            <p className="text-[var(--text-muted)] text-sm">
              Aucun lieu créé.<br />Capturez vos lieux d&apos;inspiration avec des photos.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onDelete={(id) => setLocations((prev) => prev.filter((l) => l.id !== id))}
                onPhotosChange={handlePhotosChange}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-dashed border-[var(--border)] hover:border-amber-500/50 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-xl px-5 py-4 text-sm transition-colors"
        >
          <Plus size={16} />
          Ajouter un lieu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--text-primary)]">Nouveau lieu</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Nom du lieu *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: La forêt de Brocéliande"
                  className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ambiance, détails, ce qui vous inspire dans ce lieu…"
                  className="border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                💡 Vous pourrez ajouter des photos après la création.
              </p>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm px-4 py-2 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
