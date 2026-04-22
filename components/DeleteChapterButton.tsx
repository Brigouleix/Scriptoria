'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteChapterButton({ chapterId }: { chapterId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()

    // Récupérer les chemins de stockage avant suppression
    const { data: docs } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('chapter_id', chapterId)

    if (docs && docs.length > 0) {
      await supabase.storage.from('documents').remove(docs.map((d) => d.storage_path))
    }

    await supabase.from('chapters').delete().eq('id', chapterId)
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-stone-400">Confirmer ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1 text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          Oui
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Non
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="shrink-0 text-stone-600 hover:text-red-400 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  )
}
