'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, BookOpen, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const GENRES = [
  'Roman', 'Fantasy', 'Science-fiction', 'Thriller', 'Policier',
  'Romance', 'Horreur', 'Historique', 'Jeunesse', 'Autre',
]

type ProjectType = 'novel' | 'team'

export default function NewProjectButton({ variant = 'primary' }: { variant?: 'primary' | 'outline' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [projectType, setProjectType] = useState<ProjectType>('novel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        genre: projectType === 'novel' ? (genre || null) : null,
        project_type: projectType,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error || !data) {
      setError('Erreur lors de la création. Réessayez.')
      setLoading(false)
      return
    }

    setOpen(false)
    setTitle('')
    setGenre('')
    setProjectType('novel')
    router.push(`/project/${data.id}`)
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setTitle('')
    setGenre('')
    setProjectType('novel')
    setError('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === 'primary'
            ? 'flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors'
            : 'flex items-center gap-2 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-400 px-4 py-2 rounded-lg text-sm transition-colors'
        }
      >
        <Plus size={16} />
        Nouveau projet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nouveau projet</h2>
              <button onClick={handleClose} className="text-stone-500 hover:text-stone-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Project type toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-stone-300">Type de projet</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectType('novel')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                      projectType === 'novel'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <BookOpen size={20} />
                    Roman solo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectType('team')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                      projectType === 'team'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <Users size={20} />
                    Projet d&apos;équipe
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-300">
                  {projectType === 'novel' ? 'Titre du roman *' : "Nom du projet *"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={projectType === 'novel' ? "ex: Les Chroniques d'Aria" : "ex: Projet Atlas"}
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {projectType === 'novel' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-stone-300">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-300 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">— Sélectionner un genre —</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-stone-400 hover:text-stone-200 text-sm px-4 py-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
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
