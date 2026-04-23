'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, X, Loader2, Camera, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Person {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
}

interface CharacterLink {
  id: string
  person_a_id: string
  person_b_id: string
  relationship: string
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function MiniAvatar({ person }: { person: Person }) {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-amber-500/30">
      {person.avatar_url ? (
        <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-amber-500 text-[10px] font-bold">{initials(person.name)}</span>
      )}
    </div>
  )
}

// ── Sub-component: one person card ────────────────────────────
function PersonCard({
  person,
  allPeople,
  links,
  onDelete,
  onAvatarUpdate,
  onLinkAdd,
  onLinkRemove,
}: {
  person: Person
  allPeople: Person[]
  links: CharacterLink[]
  onDelete: (id: string) => void
  onAvatarUpdate: (id: string, url: string) => void
  onLinkAdd: (link: CharacterLink) => void
  onLinkRemove: (linkId: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [linkTarget, setLinkTarget] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Links involving this person (either side)
  const myLinks = links.filter(
    (l) => l.person_a_id === person.id || l.person_b_id === person.id
  )

  // People not already linked and not self
  const linkedIds = new Set(myLinks.flatMap((l) => [l.person_a_id, l.person_b_id]))
  const available = allPeople.filter((p) => p.id !== person.id && !linkedIds.has(p.id))

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/people/${person.id}/avatar.${ext}`

    await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: file.type })

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

  async function handleLinkAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!linkTarget) return
    setLinkLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLinkLoading(false); return }

    const { data, error } = await supabase
      .from('character_links')
      .insert({
        user_id: user.id,
        person_a_id: person.id,
        person_b_id: linkTarget,
        relationship: linkLabel.trim(),
      })
      .select('id, person_a_id, person_b_id, relationship')
      .single()

    setLinkLoading(false)
    if (!error && data) {
      onLinkAdd(data)
      setLinkTarget('')
      setLinkLabel('')
    }
  }

  async function handleLinkRemove(linkId: string) {
    setRemovingId(linkId)
    const supabase = createClient()
    await supabase.from('character_links').delete().eq('id', linkId)
    onLinkRemove(linkId)
    setRemovingId(null)
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
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
          {myLinks.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {myLinks.length} lien{myLinks.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Liens entre personnages"
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

      {/* Expanded: links section */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 flex flex-col gap-3">
          {/* Existing links */}
          {myLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              {myLinks.map((link) => {
                const otherId = link.person_a_id === person.id ? link.person_b_id : link.person_a_id
                const other = allPeople.find((p) => p.id === otherId)
                if (!other) return null
                return (
                  <div key={link.id} className="flex items-center gap-2 text-sm">
                    <MiniAvatar person={other} />
                    <span className="font-medium text-[var(--text-primary)] truncate">{other.name}</span>
                    {link.relationship && (
                      <span className="text-[var(--text-muted)] truncate">— {link.relationship}</span>
                    )}
                    <button
                      onClick={() => handleLinkRemove(link.id)}
                      disabled={removingId === link.id}
                      className="ml-auto shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      {removingId === link.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add link form */}
          {available.length > 0 ? (
            <form onSubmit={handleLinkAdd} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Link2 size={11} /> Relier à un personnage
              </p>
              <div className="flex gap-2">
                <select
                  value={linkTarget}
                  onChange={(e) => setLinkTarget(e.target.value)}
                  className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">Choisir…</option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Relation (ex: ami, rival…)"
                  className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!linkTarget || linkLoading}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  {linkLoading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Lier
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">
              {allPeople.length <= 1
                ? 'Créez d\'autres personnages pour les relier.'
                : 'Tous les personnages sont déjà liés.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function PeopleManager({
  initialPeople,
  initialLinks,
}: {
  initialPeople: Person[]
  initialLinks: CharacterLink[]
}) {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [links, setLinks] = useState<CharacterLink[]>(initialLinks)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setName('')
      setBio('')
    }
  }, [open])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('people')
      .insert({ name: name.trim(), bio: bio.trim() || null, user_id: user.id })
      .select('id, name, bio, avatar_url')
      .single()
    setLoading(false)
    if (!error && data) {
      setPeople((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setOpen(false)
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
              allPeople={people}
              links={links}
              onDelete={(id) => setPeople((prev) => prev.filter((x) => x.id !== id))}
              onAvatarUpdate={(id, url) =>
                setPeople((prev) => prev.map((x) => x.id === id ? { ...x, avatar_url: url } : x))
              }
              onLinkAdd={(link) => setLinks((prev) => [...prev, link])}
              onLinkRemove={(linkId) => setLinks((prev) => prev.filter((l) => l.id !== linkId))}
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
