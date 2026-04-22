'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, FileImage, File, Trash2, Loader2, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import ImageThumbnail from '@/components/ImageThumbnail'
import DocumentViewer from '@/components/DocumentViewer'

interface Document {
  id: string
  name: string
  storage_path: string
  mime_type: string
  size_bytes: number
  created_at: string
}

interface Props {
  documents: Document[]
  userId: string
  chapterId: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <FileImage className="text-blue-400" size={28} />
  if (mime === 'application/pdf') return <FileText className="text-red-400" size={28} />
  if (mime.includes('word')) return <FileText className="text-blue-500" size={28} />
  return <File className="text-stone-400" size={28} />
}

function FileCard({ doc, userId }: { doc: Document; userId: string }) {
  const router = useRouter()
  const t = useTranslations('common')
  const [deleting, setDeleting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const isImage = doc.mime_type.startsWith('image/')

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    router.refresh()
  }

  async function handleDownload() {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 60)

    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = doc.name
      a.click()
    }
  }

  return (
    <>
      {viewing && <DocumentViewer doc={doc} onClose={() => setViewing(false)} />}
      <div className="group border border-stone-800 hover:border-stone-700 bg-stone-900/50 rounded-xl overflow-hidden flex flex-col transition-colors">
        {/* Thumbnail area — cliquable */}
        <div
          className="h-36 bg-stone-900 flex items-center justify-center relative cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setViewing(true)}
        >
          {isImage ? (
            <ImageThumbnail storagePath={doc.storage_path} name={doc.name} />
          ) : (
            <FileIcon mime={doc.mime_type} />
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1 cursor-pointer" onClick={() => setViewing(true)}>
          <p className="text-sm font-medium text-stone-200 truncate" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-xs text-stone-500">{formatSize(doc.size_bytes)}</p>
        </div>

        {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors"
        >
          <Download size={12} />
          {t('download')}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-stone-600 hover:text-red-400 transition-colors"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
    </>
  )
}

export default function FileGrid({ documents, userId, chapterId }: Props) {
  const t = useTranslations('documents')

  if (documents.length === 0) {
    return (
      <div className="border border-dashed border-stone-700 rounded-xl p-12 text-center text-stone-500 text-sm">
        {t('no_files')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <FileCard key={doc.id} doc={doc} userId={userId} />
      ))}
    </div>
  )
}
