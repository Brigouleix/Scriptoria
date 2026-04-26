'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, X, Loader2, Camera, Link2,
  ChevronDown, ChevronUp, ExternalLink, Pencil, Check,
} from 'lucide-react'
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

// ── PersonCard ─────────────────────────────────────────────────
function PersonCard({
  person,
  allPeople,
  links,
  onDelete,
  onAvatarUpdate,
  onLinkAdd,
  onLinkRemove,
  onLinkEdit,
}: {
  person: Person
  allPeople: Person[]
  links: CharacterLink[]
  onDelete: (id: string) => void
  onAvatarUpdate: (id: string, url: string) => void
  onLinkAdd: (link: CharacterLink) => void
  onLinkRemove: (linkId: string) => void
  onLinkEdit: (linkId: string, relationship: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading,   setUploading]   = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [expanded,    setExpanded]    = useState(false)
  const [linkTarget,  setLinkTarget]  = useState('')
  const [linkLabel,   setLinkLabel]   = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError,   setLinkError]   = useState<string | null>(null)
  const [removingId,  setRemovingId]  = useState<string | null>(null)

  // État édition inline d'un lien
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editingRel,  setEditingRel]  = useState('')

  const myLinks = links.filter(
    (l) => l.person_a_id === person.id || l.person_b_id === person.id,
  )

  const linkedIds = new Set(myLinks.flatMap((l) => [l.person_a_id, l.person_b_id]))
  const available = allPeople.filter((p) => p.id !== person.id && !linkedIds.has(p.id))

  // ── Handlers ────────────────────────────────────────────────
  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext  = file.name.split('.').pop() ?? 'jpg'
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
    setLinkError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLinkLoading(false); return }

    const { data, error } = await supabase
      .from('character_links')
      .insert({
        user_id:      user.id,
        person_a_id:  person.id,
        person_b_id:  linkTarget,
        relationship: linkLabel.trim(),
      })
      .select('id, person_a_id, person_b_id, relationship')
      .single()

    setLinkLoading(false)
    if (error) {
      if (error.code === '23505') {
        setLinkError('Ces personnages sont déjà liés.')
      } else {
        setLinkError('Impossible de créer le lien : ' + error.message)
      }
      return
    }
    if (data) {
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

  async function handleLinkEditSave(linkId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('character_links')
      .update({ relationship: editingRel.trim() })
      .eq('id', linkId)
    if (!error) {
      onLinkEdit(linkId, editingRel.trim())
    }
    setEditingId(null)
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div id={person.id} className="border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden">
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
          <Link
            href={`/people/${person.id}`}
            className="group/name flex items-center gap-1.5 hover:text-amber-500 transition-colors"
          >
            <p className="font-semibold text-[var(--text-primary)] group-hover/name:text-amber-500 truncate transition-colors">
              {person.name}
            </p>
            <ExternalLink size={11} className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover/name:opacity-100 transition-opacity" />
          </Link>
          {person.bio && <p className="text-[var(--text-muted)] text-sm truncate">{person.bio}</p>}
          {myLinks.length > 0 && (
            <p className="text-xs text-amber-500/80 mt-0.5">
              {myLinks.length} lien{myLinks.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Liens entre personnages"
            className="flex items-center gap-1 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/5 transition-colors text-[11px] font-medium"
          >
            <Link2 size={13} />
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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

      {/* Section liens (dépliable) */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 flex flex-col gap-3 bg-[var(--bg-base)]/40">

          {/* Liens existants */}
          {myLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Liens actifs
              </p>
              {myLinks.map((link) => {
                const otherId = link.person_a_id === person.id ? link.person_b_id : link.person_a_id
                const other   = allPeople.find((p) => p.id === otherId)
                if (!other) return null

                return (
                  <div key={link.id} className="flex items-center gap-2 text-sm group/link">
                    <MiniAvatar person={other} />
                    <Link
                      href={`/people/${other.id}`}
                      className="font-medium text-[var(--text-primary)] truncate hover:text-amber-500 transition-colors text-xs"
                    >
                      {other.name}
                    </Link>

                    {editingId === link.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          autoFocus
                          value={editingRel}
                          onChange={(e) => setEditingRel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLinkEditSave(link.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          placeholder="ex: ami, rival…"
                          className="flex-1 min-w-0 bg-[var(--bg-input)] border border-amber-500 rounded px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                        />
                        <button
                          onClick={() => handleLinkEditSave(link.id)}
                          className="text-green-500 hover:text-green-400 transition-colors shrink-0"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {link.relationship && (
                          <span className="text-[var(--text-muted)] text-xs truncate flex-1">
                            — {link.relationship}
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(link.id); setEditingRel(link.relationship) }}
                            className="text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                            title="Modifier la relation"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleLinkRemove(link.id)}
                            disabled={removingId === link.id}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-40"
                            title="Supprimer le lien"
                          >
                            {removingId === link.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulaire ajout de lien */}
          {available.length > 0 ? (
            <form onSubmit={handleLinkAdd} className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Link2 size={10} /> Nouveau lien
              </p>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={linkTarget}
                  onChange={(e) => { setLinkTarget(e.target.value); setLinkError(null) }}
                  className="col-span-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">Choisir un personnage…</option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit() }}
                  placeholder="Relation (ami, rival…)"
                  className="col-span-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {linkError && (
                <p className="text-xs text-red-500">{linkError}</p>
              )}

              <button
                type="submit"
                disabled={!linkTarget || linkLoading}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-full"
              >
                {linkLoading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Créer le lien
              </button>
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

// ── Composant principal ─────────────────────────────────────────
export default function PeopleManager({
  initialPeople,
  initialLinks,
  projectId,
  onPeopleChange,
  onLinksChange,
}: {
  initialPeople: Person[]
  initialLinks: CharacterLink[]
  projectId?: string
  onPeopleChange?: (people: Person[]) => void
  onLinksChange?: (links: CharacterLink[]) => void
}) {
  const [people,  setPeople]  = useState<Person[]>(initialPeople)
  const [links,   setLinks]   = useState<CharacterLink[]>(initialLinks)
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [bio,     setBio]     = useState('')
  const [loading, setLoading] = useState(false)

  // Notifier le parent à chaque changement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onPeopleChange?.(people) }, [people])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onLinksChange?.(links) }, [links])

  useEffect(() => {
    if (open) { setName(''); setBio('') }
  }, [open])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const payload: Record<string, unknown> = {
      name:    name.trim(),
      bio:     bio.trim() || null,
      user_id: user.id,
    }
    // Si on est dans un projet, associer le personnage
    if (projectId) payload.project_id = projectId

    const { data, error } = await supabase
      .from('people')
      .insert(payload)
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
              onLinkEdit={(linkId, relationship) =>
                setLinks((prev) =>
                  prev.map((l) => l.id === linkId ? { ...l, relationship } : l),
                )
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

      {/* Modal création */}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit() }}
                  required
                  autoFocus
                  placeholder="ex: Alice Martin"
                  className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description courte</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit() }}
                  placeholder="ex: Détective cynique, 40 ans, Paris"
                  className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors"
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
