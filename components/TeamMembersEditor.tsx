'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, User, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import RoleAutocomplete from '@/components/RoleAutocomplete'

interface Person {
  id: string
  name: string
  bio: string | null
}

interface Member {
  id: string
  person_id: string
  role: string
  position: number
  person: Person
}

interface TeamMembersEditorProps {
  projectId: string
}

export default function TeamMembersEditor({ projectId }: TeamMembersEditorProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [addMode, setAddMode] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    const supabase = createClient()
    const [{ data: membersData }, { data: peopleData }] = await Promise.all([
      supabase
        .from('project_members')
        .select('id, person_id, role, position, people(id, name, bio)')
        .eq('project_id', projectId)
        .order('position'),
      supabase.from('people').select('id, name, bio').order('name'),
    ])

    const mapped = (membersData ?? []).map((m: any) => ({
      id: m.id,
      person_id: m.person_id,
      role: m.role,
      position: m.position,
      person: m.people as Person,
    }))
    setMembers(mapped)
    setAllPeople(peopleData ?? [])
    setLoading(false)
  }

  const memberPersonIds = new Set(members.map((m) => m.person_id))
  const availablePeople = allPeople.filter(
    (p) => !memberPersonIds.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd() {
    if (!selectedPerson || !role.trim()) return
    setSaving(true)
    const supabase = createClient()

    // Save role to saved_roles (upsert, ignore duplicates)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('saved_roles')
        .upsert({ user_id: user.id, role: role.trim() }, { onConflict: 'user_id,role', ignoreDuplicates: true })
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        person_id: selectedPerson.id,
        role: role.trim(),
        position: members.length,
      })
      .select('id, person_id, role, position, people(id, name, bio)')
      .single()

    if (!error && data) {
      setMembers((prev) => [...prev, {
        id: data.id,
        person_id: data.person_id,
        role: data.role,
        position: data.position,
        person: (data as any).people as Person,
      }])
    }
    setSaving(false)
    setAddMode(false)
    setSelectedPerson(null)
    setRole('')
    setSearch('')
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId)
    const supabase = createClient()
    await supabase.from('project_members').delete().eq('id', memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setDeletingId(null)
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-stone-500 text-sm"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-100">Membres de l&apos;équipe</h2>
        <span className="text-xs text-stone-500">{members.length} membre{members.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 border border-stone-800 bg-stone-900/50 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <User className="text-amber-400" size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-100 text-sm truncate">{m.person.name}</p>
              <p className="text-amber-400/80 text-xs truncate">{m.role}</p>
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id}
              className="text-stone-600 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
            >
              {deletingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        ))}

        {members.length === 0 && !addMode && (
          <p className="text-stone-500 text-sm">Aucun membre ajouté pour l&apos;instant.</p>
        )}
      </div>

      {/* Add member panel */}
      {addMode ? (
        <div className="border border-stone-700 rounded-xl p-4 flex flex-col gap-3 bg-stone-900/30">
          <p className="text-sm font-medium text-stone-300">Ajouter un membre</p>

          {/* Search person */}
          {!selectedPerson ? (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un membre..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {availablePeople.length === 0 ? (
                  <p className="text-stone-500 text-xs py-2">
                    {allPeople.length === 0
                      ? 'Aucun membre créé. Allez dans "Membres" pour en créer.'
                      : 'Tous les membres sont déjà dans ce projet.'}
                  </p>
                ) : (
                  availablePeople.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPerson(p)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-stone-800 text-sm text-stone-300 hover:text-amber-400 transition-colors"
                    >
                      <User size={13} className="shrink-0" />
                      <span className="truncate">{p.name}</span>
                      {p.bio && <span className="text-stone-600 text-xs truncate">— {p.bio}</span>}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-stone-300">
                <User size={13} className="text-amber-400" />
                <span className="font-medium">{selectedPerson.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="text-stone-500 hover:text-stone-300 text-xs ml-auto"
                >
                  Changer
                </button>
              </div>
              <RoleAutocomplete
                value={role}
                onChange={setRole}
                placeholder="Rôle dans ce projet…"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setAddMode(false); setSelectedPerson(null); setRole(''); setSearch('') }}
                  className="text-stone-400 hover:text-stone-200 text-sm px-3 py-1.5 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving || !role.trim()}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAddMode(true)}
          className="flex items-center gap-2 border border-dashed border-stone-700 hover:border-amber-500/50 text-stone-400 hover:text-amber-400 rounded-xl px-4 py-3 text-sm transition-colors"
        >
          <Plus size={15} />
          Ajouter un membre
        </button>
      )}
    </div>
  )
}
