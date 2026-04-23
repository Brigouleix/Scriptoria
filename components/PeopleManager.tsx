'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, X, Loader2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Person {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

// ── Sub-component: one person card with avatar upload ──────────
function PersonCard({
  person,
  onDelete,
  onAvatarUpdate,
}: {
  person: Person
  onDelete: (id: string) => void
  onAvatarUpdate: (id: string, url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/people/${person.id}/avatar.${ext}`

    await supabase.storage.from('media').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    const urlWithBust = `${publicUrl}?t=${Date.now()}`

    await supabase.from('people').update({ avatar_url: urlWithBust }).eq('id', person.id)
    onAvatarUpdate(person.id, urlWithBust)
    setUploading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('people').delete().eq('id', person.id)
    onDelete(person.id)
  }

  return (
    <div className="flex items-center gap-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl px-4 py-3">
      {/* Avatar */}
      <div
        className="relative shrink-0 cursor-pointer group"
        onClick={() => fileRef.current?.click()}
        title="Changer la photo"
      >
        <div className="w-11 h-11 rounded-full overflow-hidden bg-amber-500/10 flex items-center justify-center ring-2 ring-transparent group-hover:ring-amber-500 transition-all">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-amber-500 text-sm font-bold">{initials(person.name)}</span>
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow">
          {uploading
            ? <Loader2 size={9} className="animate-spin text-white" />
            : <Camera size={9} className="text-white" />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)] truncate">{person.name}</p>
        {person.bio && <p className="text-[var(--text-muted)] text-sm truncate">{person.bio}</p>}
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function PeopleManager({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('people')
      .insert({ name: name.trim(), bio: bio.trim() || null, user_id: user.id })
      .select('id, name, bio, avatar_url')
      .single()
    setLoading(false)
    if (!error && data) {
      setPeople((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setOpen(false)
      setName('')
      setBio('')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {people.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 flex flex-col items-center gap-3 text-center">
            <p className="text-[var(--text-muted)] text-sm">Aucun personnage créé pour l&apos;instant.</p>
          </div>
        ) : (
          people.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              onDelete={(id) => setPeople((prev) => prev.filter((x) => x.id !== id))}
              onAvatarUpdate={(id, url) =>
                setPeople((prev) => prev.map((x) => x.id === id ? { ...x, avatar_url: url } : x))
              }
            />
          ))
        )}

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-dashed border-[var(--border)] hover:border-amber-500/50 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-xl px-5 py-4 text-sm transition-colors"
        >
          <Plus size={16} />
          Ajouter un personnage
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--text-primary)]">Nouveau personnage</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Alice Martin"
                  className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description courte</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="ex: Détective cynique, 40 ans, Paris"
                  className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                💡 Vous pourrez ajouter une photo après la création.
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
