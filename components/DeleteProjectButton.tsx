'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', projectId)
    router.push('/dashboard')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">Confirmer ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Supprimer
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-stone-500 hover:text-red-400 transition-colors text-sm"
    >
      <Trash2 size={15} />
      Supprimer
    </button>
  )
}
