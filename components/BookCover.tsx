'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  title: string
  genre?: string | null
  initialCoverUrl?: string | null
}

export default function BookCover({ projectId, title, genre, initialCoverUrl }: Props) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setSaveError(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/projects/${projectId}/cover.${ext}`

    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (storageError) { setSaveError(true); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    // Strip cache-buster for storage, use stable URL for DB save
    const stableUrl = publicUrl
    const displayUrl = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('projects')
      .update({ cover_url: stableUrl })
      .eq('id', projectId)

    if (dbError) { setSaveError(true); setUploading(false); return }

    setCoverUrl(displayUrl)
    setUploading(false)
    e.target.value = ''
  }

  // Book dimensions: ~2:3 ratio
  return (
    <div className="flex flex-col gap-3 w-full">
      <h2 className="font-semibold text-sm text-[var(--text-primary)]">Couverture</h2>

      <div className="flex gap-0 drop-shadow-xl group" style={{ height: 550 }}>
        {/* Spine */}
        <div
          className="w-5 rounded-l-sm flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(to right, #92400e, #b45309)',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          <span className="text-white text-[9px] font-bold tracking-widest truncate px-1">
            {title.toUpperCase()}
          </span>
        </div>

        {/* Cover */}
        <div
          className="relative flex-1 rounded-r-sm overflow-hidden cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {/* Background: image or gradient */}
          {coverUrl ? (
            <img src={coverUrl} alt="Couverture" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(160deg, #1c1917 0%, #292524 40%, #44403c 100%)',
              }}
            />
          )}

          {/* Overlay gradient for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
            }}
          />

          {/* Title + genre */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
            {genre && (
              <span className="text-amber-400 text-[9px] font-bold tracking-[0.2em] uppercase">
                {genre}
              </span>
            )}
            <p className="text-white font-bold leading-tight" style={{ fontSize: 15 }}>
              {title}
            </p>
          </div>

          {/* Upload overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
              {uploading
                ? <Loader2 size={20} className="animate-spin" />
                : <Camera size={20} />
              }
              <span className="text-[10px] font-medium">
                {uploading ? 'Envoi…' : 'Changer la couverture'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-red-400">
          Erreur lors de la sauvegarde. Vérifie que la colonne <code>cover_url</code> existe dans la table <code>projects</code>.
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  )
}
