'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  variant?: 'primary' | 'outline'
}

export default function NewChapterButton({ projectId, variant = 'primary' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: existing } = await supabase
      .from('chapters')
      .select('position')
      .eq('project_id', projectId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = (existing?.position ?? -1) + 1

    const { error } = await supabase.from('chapters').insert({
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || null,
      position,
    })

    if (error) {
      setError('Erreur lors de la création. Réessayez.')
      setLoading(false)
      return
    }

    setOpen(false)
    setTitle('')
    setDescription('')
    router.refresh()
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
        Nouveau chapitre
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-amber-400" size={20} />
                <h2 className="font-bold text-lg">Nouveau chapitre</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-300">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="ex: Chapitre 1 — Le départ"
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-300">Description <span className="text-stone-500">(optionnel)</span></label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Une courte description..."
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
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
