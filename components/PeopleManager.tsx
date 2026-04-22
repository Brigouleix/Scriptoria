'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Person {
  id: string
  name: string
  bio: string | null
}

export default function PeopleManager({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      .select('id, name, bio')
      .single()
    setLoading(false)
    if (!error && data) {
      setPeople((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setOpen(false)
      setName('')
      setBio('')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('people').delete().eq('id', id)
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {people.length === 0 ? (
          <div className="border border-dashed border-stone-700 rounded-xl p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <User className="text-amber-400" size={20} />
            </div>
            <p className="text-stone-400 text-sm">Aucun membre créé pour l&apos;instant.</p>
          </div>
        ) : (
          people.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 border border-stone-800 bg-stone-900/50 rounded-xl px-5 py-4"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <User className="text-amber-400" size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-100 truncate">{p.name}</p>
                {p.bio && <p className="text-stone-400 text-sm truncate">{p.bio}</p>}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                className="text-stone-600 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          ))
        )}

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-dashed border-stone-700 hover:border-amber-500/50 text-stone-400 hover:text-amber-400 rounded-xl px-5 py-4 text-sm transition-colors"
        >
          <Plus size={16} />
          Ajouter un membre
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nouveau membre</h2>
              <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-300">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Alice Martin"
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-300">Bio courte</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="ex: Développeuse fullstack, Lyon"
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-stone-400 hover:text-stone-200 text-sm px-4 py-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
